/**
 * Audio cue service using react-native-tts for spoken workout feedback.
 * Provides mile splits, segment announcements, and workout completion cues.
 */
import Tts from 'react-native-tts';

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;
  try {
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1.0);
    initialized = true;
  } catch (e) {
    console.warn('TTS initialization failed:', e);
  }
}

/**
 * Speak a text string non-blocking.
 */
function speak(text: string): void {
  try {
    ensureInitialized();
    Tts.speak(text);
  } catch (e) {
    console.warn('TTS speak failed:', e);
  }
}

/**
 * Announce a mile split.
 * e.g. "Mile 2. Split: 8 minutes 30 seconds. Average pace 8 45 per mile."
 */
function announceMileSplit(mile: number, splitTimeSeconds: number, avgPaceStr: string): void {
  try {
    const mins = Math.floor(splitTimeSeconds / 60);
    const secs = splitTimeSeconds % 60;
    const splitPhrase =
      secs > 0 ? `${mins} minutes ${secs} seconds` : `${mins} minutes`;
    const pacePhrase = avgPaceStr.replace(':', ' ');
    const text = `Mile ${mile}. Split: ${splitPhrase}. Average pace ${pacePhrase} per mile.`;
    speak(text);
  } catch (e) {
    console.warn('announceMileSplit failed:', e);
  }
}

/**
 * Announce the start of a workout segment.
 * e.g. "Starting Tempo Interval. 1 mile at 8 30 per mile."
 */
function announceSegmentStart(
  segmentName: string,
  distance?: number,
  pace?: string,
  duration?: number,
): void {
  try {
    let detail = '';
    if (distance !== undefined && pace) {
      const pacePhrase = pace.replace(':', ' ');
      detail = ` ${distance} ${distance === 1 ? 'mile' : 'miles'} at ${pacePhrase} per mile.`;
    } else if (duration !== undefined) {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      detail = secs > 0 ? ` ${mins} minutes ${secs} seconds.` : ` ${mins} minutes.`;
    } else if (pace) {
      const pacePhrase = pace.replace(':', ' ');
      detail = ` Target pace ${pacePhrase} per mile.`;
    }
    const text = `Starting ${segmentName}.${detail}`;
    speak(text);
  } catch (e) {
    console.warn('announceSegmentStart failed:', e);
  }
}

/**
 * Announce segment completion and optionally the next segment.
 * e.g. "Segment complete. Next up: Recovery Jog"
 */
function announceSegmentComplete(completedName: string, nextName?: string): void {
  try {
    const nextPhrase = nextName ? `Next up: ${nextName}` : 'Workout complete!';
    const text = `Segment complete. ${nextPhrase}`;
    speak(text);
  } catch (e) {
    console.warn('announceSegmentComplete failed:', e);
  }
}

/**
 * Announce workout completion.
 * e.g. "Great work! Workout complete. 6.2 miles at 8 45 per mile."
 */
function announceWorkoutComplete(totalDistance: number, avgPace: string): void {
  try {
    const distStr = totalDistance.toFixed(1);
    const pacePhrase = avgPace.replace(':', ' ');
    const text = `Great work! Workout complete. ${distStr} miles at ${pacePhrase} per mile.`;
    speak(text);
  } catch (e) {
    console.warn('announceWorkoutComplete failed:', e);
  }
}

/**
 * Announce the current heart rate zone.
 * e.g. "Heart rate zone 2: Aerobic"
 */
function announceHRZone(zone: number, zoneName: string): void {
  try {
    const text = `Heart rate zone ${zone}: ${zoneName}`;
    speak(text);
  } catch (e) {
    console.warn('announceHRZone failed:', e);
  }
}

/**
 * Cancel any ongoing speech.
 */
function cancel(): void {
  try {
    Tts.stop();
  } catch (e) {
    console.warn('TTS cancel failed:', e);
  }
}

const AudioService = {
  speak,
  announceMileSplit,
  announceSegmentStart,
  announceSegmentComplete,
  announceWorkoutComplete,
  announceHRZone,
  cancel,
};

export default AudioService;
