import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

export interface WeatherData {
  temperature: number;      // °F
  feelsLike: number;        // °F
  humidity: number;         // %
  windSpeed: number;        // mph
  weatherCode: number;      // WMO code
  condition: string;        // human-readable
  icon: string;             // emoji
  runningAdvice: string;
  adviceColor: string;      // hex color for advice chip
}

// WMO Weather interpretation codes → condition + emoji
function interpretWeatherCode(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear sky', icon: '☀️' };
  if (code === 1) return { condition: 'Mainly clear', icon: '🌤️' };
  if (code === 2) return { condition: 'Partly cloudy', icon: '⛅' };
  if (code === 3) return { condition: 'Overcast', icon: '☁️' };
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: '🌫️' };
  if (code >= 51 && code <= 57) return { condition: 'Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 67) return { condition: 'Rain', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: '❄️' };
  if (code >= 80 && code <= 82) return { condition: 'Rain showers', icon: '🌦️' };
  if (code === 85 || code === 86) return { condition: 'Snow showers', icon: '🌨️' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Unknown', icon: '🌡️' };
}

function getRunningAdvice(
  temp: number,
  weatherCode: number,
  windSpeed: number
): { advice: string; color: string } {
  // Thunderstorm / heavy snow / blizzard
  if (weatherCode >= 95 || (weatherCode >= 71 && weatherCode <= 77)) {
    return { advice: 'Stay inside — unsafe conditions for running', color: '#c62828' };
  }
  // Heavy rain
  if ((weatherCode >= 63 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return { advice: 'Heavy rain — slippery surfaces, run with caution', color: '#e65100' };
  }
  // Very hot
  if (temp >= 90) {
    return { advice: 'Very hot — run early/late, hydrate heavily, shorten effort', color: '#c62828' };
  }
  if (temp >= 80) {
    return { advice: 'Hot — hydrate well, expect slower paces', color: '#e65100' };
  }
  // Very cold
  if (temp <= 20) {
    return { advice: 'Very cold — protect extremities, shorten if needed', color: '#c62828' };
  }
  if (temp <= 32) {
    return { advice: 'Freezing — layer up, watch for ice on roads', color: '#e65100' };
  }
  // High wind
  if (windSpeed >= 25) {
    return { advice: 'High wind — adjust effort on exposed routes', color: '#e65100' };
  }
  // Light rain / drizzle
  if (weatherCode >= 51 && weatherCode <= 57) {
    return { advice: 'Light drizzle — bring a cap, enjoy the cool!', color: '#1565c0' };
  }
  // Cold but runnable
  if (temp <= 45) {
    return { advice: 'Cold — dress in layers, warm up slowly', color: '#1565c0' };
  }
  // Ideal range 45–75°F
  return { advice: 'Great conditions for a run!', color: '#2e7d32' };
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'RunningApp needs location to show local weather.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  // iOS: Geolocation.requestAuthorization handles it
  const result = await Geolocation.requestAuthorization('whenInUse');
  return result === 'granted';
}

function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      error => reject(error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 } // 5-min cache
    );
  });
}

class WeatherService {
  async getWeather(): Promise<WeatherData | null> {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return null;

      const { lat, lon } = await getCurrentPosition();

      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) return null;

      const json = await response.json();
      const current = json.current;
      if (!current) return null;

      const temp = Math.round(current.temperature_2m);
      const feelsLike = Math.round(current.apparent_temperature);
      const humidity = Math.round(current.relative_humidity_2m);
      const windSpeed = Math.round(current.wind_speed_10m);
      const weatherCode: number = current.weather_code;

      const { condition, icon } = interpretWeatherCode(weatherCode);
      const { advice, color } = getRunningAdvice(temp, weatherCode, windSpeed);

      return {
        temperature: temp,
        feelsLike,
        humidity,
        windSpeed,
        weatherCode,
        condition,
        icon,
        runningAdvice: advice,
        adviceColor: color,
      };
    } catch (error) {
      console.error('WeatherService error:', error);
      return null;
    }
  }
}

export default new WeatherService();
