import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';

export interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number;   // meters (from GPS)
  timestamp: number;   // ms
}

export interface RunUpdate {
  distance: number;          // miles accumulated
  currentPace: string;       // min:sec/mile — rolling 30-second window
  avgPace: string;           // min:sec/mile — overall average
  coordinates: Coordinate[];
  elevationGainFt: number;   // total ascent in feet
  elevationLossFt: number;   // total descent in feet
  currentAltitudeFt?: number;
}

function haversineDistance(a: Coordinate, b: Coordinate): number {
  const R = 3958.8;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function secondsToPaceStr(secondsPerMile: number): string {
  if (!isFinite(secondsPerMile) || secondsPerMile <= 0) return '--:--';
  const m = Math.floor(secondsPerMile / 60);
  const s = Math.round(secondsPerMile % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const METERS_TO_FEET = 3.28084;

class GpsService {
  private watchId: number | null = null;
  private coordinates: Coordinate[] = [];
  private totalDistance = 0;
  private totalElapsedMs = 0;
  private segmentStartMs = 0;
  private skipNextSegment = false;

  // Elevation tracking
  private filteredAltitude: number | null = null; // EMA-filtered altitude in meters
  private elevationGainM = 0;
  private elevationLossM = 0;
  private readonly EMA_ALPHA = 0.3;        // smoothing factor
  private readonly ELEVATION_THRESHOLD_M = 2; // only count changes > 2m

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const result = await Geolocation.requestAuthorization('whenInUse');
      return result === 'granted';
    }
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'RunningApp needs your location to track your run.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
          buttonNeutral: 'Ask Later',
        }
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  }

  async start(onUpdate: (update: RunUpdate) => void): Promise<boolean> {
    const ok = await this.requestPermissions();
    if (!ok) return false;

    this.segmentStartMs = Date.now();

    this.watchId = Geolocation.watchPosition(
      position => {
        const rawAlt = position.coords.altitude ?? null;

        const coord: Coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: rawAlt ?? undefined,
          timestamp: position.timestamp,
        };

        // Elevation tracking with EMA noise filter
        if (rawAlt !== null) {
          if (this.filteredAltitude === null) {
            this.filteredAltitude = rawAlt;
          } else {
            const prevFiltered = this.filteredAltitude;
            this.filteredAltitude =
              this.EMA_ALPHA * rawAlt + (1 - this.EMA_ALPHA) * prevFiltered;
            const delta = this.filteredAltitude - prevFiltered;
            if (delta > this.ELEVATION_THRESHOLD_M) {
              this.elevationGainM += delta;
            } else if (delta < -this.ELEVATION_THRESHOLD_M) {
              this.elevationLossM += Math.abs(delta);
            }
          }
        }

        if (this.coordinates.length > 0) {
          if (this.skipNextSegment) {
            this.skipNextSegment = false;
          } else {
            const prev = this.coordinates[this.coordinates.length - 1];
            const segDist = haversineDistance(prev, coord);
            const timeDiffSec = (coord.timestamp - prev.timestamp) / 1000;
            const speedMph = timeDiffSec > 0 ? (segDist / timeDiffSec) * 3600 : 999;
            if (speedMph < 30) {
              this.totalDistance += segDist;
            }
          }
        }

        this.coordinates.push(coord);

        // Rolling 30-second pace
        const nowMs = coord.timestamp;
        const rollingCoords = this.coordinates.filter(c => nowMs - c.timestamp <= 30_000);
        let currentPace = '--:--';
        if (rollingCoords.length >= 2) {
          let rollingDist = 0;
          for (let i = 1; i < rollingCoords.length; i++) {
            rollingDist += haversineDistance(rollingCoords[i - 1], rollingCoords[i]);
          }
          const rollingTimeSec = (nowMs - rollingCoords[0].timestamp) / 1000;
          if (rollingDist > 0.001) {
            currentPace = secondsToPaceStr(rollingTimeSec / rollingDist);
          }
        }

        const elapsedSec = this.getElapsedSeconds();
        const avgPace =
          this.totalDistance > 0.01
            ? secondsToPaceStr(elapsedSec / this.totalDistance)
            : '--:--';

        onUpdate({
          distance: this.totalDistance,
          currentPace,
          avgPace,
          coordinates: [...this.coordinates],
          elevationGainFt: Math.round(this.elevationGainM * METERS_TO_FEET),
          elevationLossFt: Math.round(this.elevationLossM * METERS_TO_FEET),
          currentAltitudeFt: this.filteredAltitude !== null
            ? Math.round(this.filteredAltitude * METERS_TO_FEET)
            : undefined,
        });
      },
      error => {
        console.error('GPS error:', error.code, error.message);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 5,
        interval: 3000,
        fastestInterval: 2000,
        showLocationDialog: true,
        forceRequestLocation: true,
      }
    );

    return true;
  }

  pause(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.segmentStartMs > 0) {
      this.totalElapsedMs += Date.now() - this.segmentStartMs;
      this.segmentStartMs = 0;
    }
    this.skipNextSegment = true;
  }

  resume(onUpdate: (update: RunUpdate) => void): Promise<boolean> {
    return this.start(onUpdate);
  }

  stop(): void {
    this.pause();
    this.coordinates = [];
    this.totalDistance = 0;
    this.totalElapsedMs = 0;
    this.segmentStartMs = 0;
    this.skipNextSegment = false;
    this.filteredAltitude = null;
    this.elevationGainM = 0;
    this.elevationLossM = 0;
  }

  getElapsedSeconds(): number {
    const activeMs = this.segmentStartMs > 0 ? Date.now() - this.segmentStartMs : 0;
    return (this.totalElapsedMs + activeMs) / 1000;
  }

  getDistance(): number { return this.totalDistance; }

  getAvgPace(): string {
    const elapsed = this.getElapsedSeconds();
    return this.totalDistance > 0.01
      ? secondsToPaceStr(elapsed / this.totalDistance)
      : '--:--';
  }

  getElevationGainFt(): number {
    return Math.round(this.elevationGainM * METERS_TO_FEET);
  }

  getElevationLossFt(): number {
    return Math.round(this.elevationLossM * METERS_TO_FEET);
  }
}

export default new GpsService();
