/**
 * Health platform sync service stub.
 *
 * NOTE: This is a graceful stub. To enable native health integration:
 *
 * iOS: Install react-native-health (https://github.com/agencyenterprise/react-native-health)
 *   - Run: npm install react-native-health && cd ios && pod install
 *   - Add HealthKit entitlement in Xcode
 *   - Implement each method using AppleHealthKit from 'react-native-health'
 *
 * Android: Install react-native-health-connect (https://github.com/matinzd/react-native-health-connect)
 *   - Run: npm install react-native-health-connect
 *   - Add permissions to AndroidManifest.xml for Health Connect
 *   - Implement each method using the Health Connect API
 *
 * Each method below is the integration point — replace the stub body with the
 * appropriate SDK call wrapped in a try/catch.
 */

import { ActivityCheckIn } from '../context/types';

/**
 * Check if health data integration is available on this device.
 * Returns true only when native SDK is installed and platform supports it.
 */
async function isAvailable(): Promise<boolean> {
  // NOTE: Replace with AppleHealthKit.isAvailable() on iOS
  // or HealthConnect.isAvailable() on Android
  return false;
}

/**
 * Request health data permissions from the user.
 * Returns true if permissions were granted.
 */
async function requestPermissions(): Promise<boolean> {
  // NOTE: Replace with AppleHealthKit.initHealthKit(permissions, callback) on iOS
  // or HealthConnect.requestPermission(permissions) on Android
  return false;
}

/**
 * Read sleep data for a given date.
 * Returns hours slept and a quality score (1–5) derived from sleep stages if available.
 */
async function readSleepData(
  date: string,
): Promise<{ hours: number; quality: number } | null> {
  // NOTE: Replace with AppleHealthKit.getSleepSamples(options, callback) on iOS
  // or HealthConnect.readRecords('SleepSession', ...) on Android
  return null;
}

/**
 * Read heart rate data for a given date.
 * Returns average and maximum BPM recorded during the day.
 */
async function readHRData(
  date: string,
): Promise<{ avgBpm: number; maxBpm: number } | null> {
  // NOTE: Replace with AppleHealthKit.getHeartRateSamples(options, callback) on iOS
  // or HealthConnect.readRecords('HeartRate', ...) on Android
  return null;
}

/**
 * Write a completed workout to the health platform.
 * Returns true if successfully written.
 */
async function writeWorkout(checkIn: ActivityCheckIn): Promise<boolean> {
  // NOTE: Replace with AppleHealthKit.saveWorkout(options, callback) on iOS
  // or HealthConnect.insertRecords([workoutRecord]) on Android
  return false;
}

class HealthService {
  isAvailable = isAvailable;
  requestPermissions = requestPermissions;
  readSleepData = readSleepData;
  readHRData = readHRData;
  writeWorkout = writeWorkout;
}

export default new HealthService();
