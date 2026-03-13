import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, StyleSheet, Alert, StatusBar, TouchableOpacity,
  Text, ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import uuid from 'react-native-uuid';
import { DailyWorkout, WorkoutSegment } from '../context/types';
import GpsService, { Coordinate, RunUpdate } from '../services/gps.service';
import { useApp } from '../context/AppContext';

const uuidv4 = uuid.v4;

// Lazy-load optional services (may not be fully linked yet)
let AudioService: any = null;
try { AudioService = require('../services/audioService').default; } catch {}

type RunState = 'idle' | 'acquiring' | 'running' | 'paused' | 'finished';

interface Props {
  route: { params: { workout: DailyWorkout } };
  navigation: any;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function LiveRunScreen({ route, navigation }: Props) {
  const { workout } = route.params;
  const { addRoute } = useApp();

  const [runState, setRunState] = useState<RunState>('idle');
  const [distance, setDistance] = useState(0);
  const [currentPace, setCurrentPace] = useState('--:--');
  const [avgPace, setAvgPace] = useState('--:--');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [elevationGainFt, setElevationGainFt] = useState(0);
  const [elevationLossFt, setElevationLossFt] = useState(0);
  const [currentAltitudeFt, setCurrentAltitudeFt] = useState<number | undefined>();

  // Segment player state
  const segments = workout.segments ?? [];
  const [currentSegIdx, setCurrentSegIdx] = useState(0);
  const [segElapsed, setSegElapsed] = useState(0); // seconds in current segment
  const [showSegments, setShowSegments] = useState(segments.length > 0);

  // Mile split tracking
  const lastMileRef = useRef(0);

  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      GpsService.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      AudioService?.cancel?.();
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(GpsService.getElapsedSeconds());
      setSegElapsed(s => s + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  // Check for mile split announcements
  const checkMileSplit = useCallback((dist: number, elapsed: number, pace: string) => {
    const completedMiles = Math.floor(dist);
    if (completedMiles > lastMileRef.current) {
      lastMileRef.current = completedMiles;
      if (AudioService) {
        const splitSecs = elapsed - (completedMiles - 1) * (elapsed / dist);
        AudioService.announceMileSplit(completedMiles, splitSecs, pace);
      }
    }
  }, []);

  // Advance to next segment
  const advanceSegment = useCallback(() => {
    setCurrentSegIdx(prev => {
      const next = prev + 1;
      if (next < segments.length) {
        setSegElapsed(0);
        AudioService?.announceSegmentStart(
          segments[next].name,
          segments[next].distance,
          segments[next].pace,
          segments[next].duration
        );
        return next;
      }
      return prev;
    });
  }, [segments]);

  // Auto-advance segments based on distance/duration
  useEffect(() => {
    if (runState !== 'running' || segments.length === 0) return;
    const seg = segments[currentSegIdx];
    if (!seg) return;

    if (seg.duration && segElapsed >= seg.duration * 60) {
      const isLast = currentSegIdx === segments.length - 1;
      AudioService?.announceSegmentComplete(seg.name, isLast ? undefined : segments[currentSegIdx + 1]?.name);
      if (!isLast) advanceSegment();
    }
  }, [segElapsed, currentSegIdx, segments, runState, advanceSegment]);

  const handleUpdate = useCallback((update: RunUpdate) => {
    setRunState(prev => prev === 'acquiring' ? 'running' : prev);
    setDistance(update.distance);
    setCurrentPace(update.currentPace);
    setAvgPace(update.avgPace);
    setCoordinates(update.coordinates);
    setElevationGainFt(update.elevationGainFt);
    setElevationLossFt(update.elevationLossFt);
    setCurrentAltitudeFt(update.currentAltitudeFt);

    checkMileSplit(update.distance, GpsService.getElapsedSeconds(), update.avgPace);

    if (update.coordinates.length > 0 && mapRef.current) {
      const last = update.coordinates[update.coordinates.length - 1];
      mapRef.current.animateToRegion({
        latitude: last.latitude, longitude: last.longitude,
        latitudeDelta: 0.004, longitudeDelta: 0.004,
      }, 500);
    }
  }, [checkMileSplit]);

  const handleStart = async () => {
    setRunState('acquiring');
    const ok = await GpsService.start(handleUpdate);
    if (!ok) {
      setRunState('idle');
      Alert.alert('Location Permission Required', 'Please enable location access in Settings to track your run.');
      return;
    }
    startTimer();
    if (segments.length > 0 && AudioService) {
      AudioService.announceSegmentStart(segments[0].name, segments[0].distance, segments[0].pace, segments[0].duration);
    }
  };

  const handlePause = () => {
    GpsService.pause();
    stopTimer();
    setRunState('paused');
  };

  const handleResume = async () => {
    await GpsService.resume(handleUpdate);
    startTimer();
    setRunState('running');
  };

  const handleFinish = () => {
    Alert.alert(
      'Finish Run?',
      `${distance.toFixed(2)} mi — ${formatTime(elapsedSeconds)}`,
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            GpsService.pause();
            stopTimer();
            setRunState('finished');
            AudioService?.announceWorkoutComplete(distance, GpsService.getAvgPace());

            const durationMinutes = Math.round(elapsedSeconds / 60);
            navigation.replace('CheckIn', {
              workout,
              prefill: {
                distance: distance.toFixed(2),
                duration: String(durationMinutes),
                pace: GpsService.getAvgPace(),
                elevationGainFt: GpsService.getElevationGainFt(),
                elevationLossFt: GpsService.getElevationLossFt(),
              },
            });
          },
        },
      ]
    );
  };

  const handleDiscard = () => {
    Alert.alert('Discard Run?', 'This will delete your current run data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          GpsService.stop();
          stopTimer();
          navigation.goBack();
        },
      },
    ]);
  };

  const handleSaveRoute = () => {
    Alert.prompt(
      'Save Route',
      'Give this route a name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (name: string | undefined) => {
            if (!name?.trim()) return;
            await addRoute({
              id: uuidv4() as string,
              name: name.trim(),
              coordinates: coordinates.map(c => ({
                latitude: c.latitude,
                longitude: c.longitude,
                altitude: c.altitude,
              })),
              distanceMiles: distance,
              elevationGainFt,
              createdAt: new Date().toISOString(),
            });
            Alert.alert('Route Saved', `"${name.trim()}" has been saved to your routes.`);
          },
        },
      ],
      'plain-text',
      `${workout.type.replace(/_/g, ' ')} route`
    );
  };

  const polylineCoords = coordinates.map(c => ({ latitude: c.latitude, longitude: c.longitude }));

  const initialRegion = coordinates.length > 0
    ? { latitude: coordinates[0].latitude, longitude: coordinates[0].longitude, latitudeDelta: 0.004, longitudeDelta: 0.004 }
    : { latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.01, longitudeDelta: 0.01 };

  // Current segment for display
  const currentSeg: WorkoutSegment | undefined = segments[currentSegIdx];
  const nextSeg: WorkoutSegment | undefined = segments[currentSegIdx + 1];
  const segSecondsRemaining = currentSeg?.duration
    ? Math.max(0, currentSeg.duration * 60 - segElapsed)
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        followsUserLocation={runState === 'running'}
        showsMyLocationButton={false}
        mapType="standard"
      >
        {polylineCoords.length >= 2 && (
          <Polyline coordinates={polylineCoords} strokeColor="#6200ea" strokeWidth={4} />
        )}
        {polylineCoords.length > 0 && (
          <Marker coordinate={polylineCoords[0]} pinColor="green" title="Start" />
        )}
      </MapView>

      <View style={styles.statsOverlay}>
        {/* Segment Player */}
        {showSegments && segments.length > 0 && runState !== 'idle' && (
          <View style={styles.segmentContainer}>
            <View style={styles.segmentHeader}>
              <Text style={styles.segmentName}>{currentSeg?.name ?? 'Workout'}</Text>
              <TouchableOpacity onPress={() => setShowSegments(false)}>
                <Text style={styles.segmentHide}>Hide</Text>
              </TouchableOpacity>
            </View>
            {currentSeg && (
              <Text style={styles.segmentDetail}>
                {currentSeg.distance != null ? `${currentSeg.distance} mi` : ''}
                {currentSeg.pace && currentSeg.pace !== '0:00' ? ` @ ${currentSeg.pace}/mi` : ''}
                {currentSeg.duration && !currentSeg.distance ? `${currentSeg.duration} min` : ''}
              </Text>
            )}
            {segSecondsRemaining !== null && (
              <Text style={styles.segmentCountdown}>{formatTime(segSecondsRemaining)}</Text>
            )}
            <View style={styles.segmentDots}>
              {segments.map((_, i) => (
                <View key={i} style={[styles.segmentDot, i === currentSegIdx && styles.segmentDotActive]} />
              ))}
            </View>
            {nextSeg && (
              <Text style={styles.nextSegment}>Next: {nextSeg.name}</Text>
            )}
            {currentSegIdx < segments.length - 1 && (
              <TouchableOpacity style={styles.skipBtn} onPress={advanceSegment}>
                <Text style={styles.skipBtnText}>Skip to Next →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!showSegments && segments.length > 0 && runState !== 'idle' && (
          <TouchableOpacity onPress={() => setShowSegments(true)} style={styles.showSegmentsBtn}>
            <Text style={styles.showSegmentsBtnText}>Show Workout Plan</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>miles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currentPace}</Text>
            <Text style={styles.statLabel}>current /mi</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{avgPace}</Text>
            <Text style={styles.statLabel}>avg /mi</Text>
          </View>
        </View>

        {/* Elevation row */}
        {(elevationGainFt > 0 || currentAltitudeFt !== undefined) && (
          <View style={styles.elevationRow}>
            {currentAltitudeFt !== undefined && (
              <Text style={styles.elevStat}>Alt: {currentAltitudeFt} ft</Text>
            )}
            {elevationGainFt > 0 && (
              <Text style={styles.elevStat}>↑ {elevationGainFt} ft</Text>
            )}
            {elevationLossFt > 0 && (
              <Text style={styles.elevStat}>↓ {elevationLossFt} ft</Text>
            )}
          </View>
        )}

        <Text style={styles.workoutLabel}>
          {workout.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          {workout.targetDistance ? `  ·  Target ${workout.targetDistance} mi` : ''}
        </Text>

        <View style={styles.controls}>
          {runState === 'idle' && (
            <TouchableOpacity style={[styles.btn, styles.btnGo]} onPress={handleStart}>
              <Text style={styles.btnText}>START</Text>
            </TouchableOpacity>
          )}
          {runState === 'acquiring' && (
            <View style={styles.acquiringRow}>
              <ActivityIndicator color="#4caf50" size="small" />
              <Text style={styles.acquiringText}>Acquiring GPS…</Text>
            </View>
          )}
          {runState === 'running' && (
            <>
              <TouchableOpacity style={[styles.btn, styles.btnPause]} onPress={handlePause}>
                <Text style={styles.btnText}>PAUSE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnFinish]} onPress={handleFinish}>
                <Text style={styles.btnText}>FINISH</Text>
              </TouchableOpacity>
            </>
          )}
          {runState === 'paused' && (
            <>
              <TouchableOpacity style={[styles.btn, styles.btnGo]} onPress={handleResume}>
                <Text style={styles.btnText}>RESUME</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnFinish]} onPress={handleFinish}>
                <Text style={styles.btnText}>FINISH</Text>
              </TouchableOpacity>
              <View style={styles.secondaryActions}>
                {distance > 0 && (
                  <TouchableOpacity style={styles.saveRouteBtn} onPress={handleSaveRoute}>
                    <Text style={styles.saveRouteBtnText}>Save Route</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
                  <Text style={styles.discardText}>Discard</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  statsOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(20, 10, 40, 0.92)',
    paddingTop: 12, paddingBottom: 40, paddingHorizontal: 24,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  // Segment player
  segmentContainer: {
    backgroundColor: 'rgba(98, 0, 234, 0.3)',
    borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(98,0,234,0.5)',
  },
  segmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segmentName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  segmentHide: { color: '#888', fontSize: 12 },
  segmentDetail: { color: '#9c75e8', fontSize: 13, marginTop: 2 },
  segmentCountdown: { color: '#fff', fontSize: 22, fontWeight: '200', textAlign: 'center', marginVertical: 4 },
  segmentDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 6 },
  segmentDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555' },
  segmentDotActive: { backgroundColor: '#6200ea', width: 18 },
  nextSegment: { color: '#888', fontSize: 11, textAlign: 'center', marginTop: 4 },
  skipBtn: { alignSelf: 'center', marginTop: 6, paddingHorizontal: 12, paddingVertical: 4 },
  skipBtnText: { color: '#9c75e8', fontSize: 12 },
  showSegmentsBtn: { alignSelf: 'center', marginBottom: 6 },
  showSegmentsBtnText: { color: '#9c75e8', fontSize: 12, textDecorationLine: 'underline' },
  // Timer & stats
  timer: {
    color: '#fff', fontSize: 52, fontWeight: '200',
    letterSpacing: 2, textAlign: 'center', fontVariant: ['tabular-nums'],
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
  statLabel: { color: '#aaa', fontSize: 11, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 36, backgroundColor: '#444' },
  elevationRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 },
  elevStat: { color: '#888', fontSize: 12 },
  workoutLabel: { color: '#9c75e8', fontSize: 13, textAlign: 'center', marginVertical: 8, textTransform: 'capitalize' },
  // Controls
  controls: { flexDirection: 'row', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' },
  btn: { flex: 1, paddingVertical: 16, borderRadius: 50, alignItems: 'center', justifyContent: 'center', maxWidth: 160 },
  btnGo: { backgroundColor: '#4caf50' },
  btnPause: { backgroundColor: '#ff9800' },
  btnFinish: { backgroundColor: '#6200ea' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1.5 },
  secondaryActions: { flexDirection: 'row', gap: 8, width: '100%', justifyContent: 'center' },
  saveRouteBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  saveRouteBtnText: { color: '#9c75e8', fontSize: 13 },
  discardBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  discardText: { color: '#666', fontSize: 13 },
  acquiringRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  acquiringText: { color: '#aaa', fontSize: 15, letterSpacing: 0.5 },
});
