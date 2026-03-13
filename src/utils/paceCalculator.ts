/**
 * Pace Calculator Utilities
 */

/**
 * Convert pace string (e.g., "8:30") to seconds per mile
 */
export function paceToSeconds(pace: string): number {
  if (!pace || !pace.includes(':')) return NaN;
  const [minutes, seconds] = pace.split(':').map(Number);
  if (isNaN(minutes) || isNaN(seconds)) return NaN;
  return minutes * 60 + seconds;
}

/**
 * Convert seconds per mile to pace string (e.g., "8:30")
 */
export function secondsToPace(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate average pace from distance (miles) and duration (minutes)
 */
export function calculatePace(distanceMiles: number, durationMinutes: number): string {
  if (distanceMiles === 0) return '0:00';
  const secondsPerMile = (durationMinutes * 60) / distanceMiles;
  return secondsToPace(secondsPerMile);
}

/**
 * Calculate duration needed for a distance at a given pace
 */
export function calculateDuration(distanceMiles: number, pace: string): number {
  const secondsPerMile = paceToSeconds(pace);
  return (distanceMiles * secondsPerMile) / 60; // return in minutes
}

/**
 * Adjust pace by percentage (e.g., -10 for 10% slower, +5 for 5% faster)
 */
export function adjustPace(pace: string, percentChange: number): string {
  const seconds = paceToSeconds(pace);
  const adjusted = seconds * (1 + percentChange / 100);
  return secondsToPace(adjusted);
}

/**
 * Get recommended pace based on workout type and base easy pace
 */
export function getRecommendedPace(
  easyPace: string,
  workoutType: 'easy_run' | 'long_run' | 'tempo' | 'intervals' | 'recovery' | 'rest' | 'strides' | 'fartlek' | 'hill_repeats' | 'cross_training' | 'benchmark'
): string {
  const easySeconds = paceToSeconds(easyPace);

  switch (workoutType) {
    case 'easy_run':
    case 'long_run':
      return secondsToPace(easySeconds); // Easy pace
    case 'recovery':
      return secondsToPace(easySeconds * 1.15); // 15% slower than easy
    case 'tempo':
      return secondsToPace(easySeconds * 0.92); // ~8% faster than easy (threshold pace)
    case 'intervals':
      return secondsToPace(easySeconds * 0.85); // ~15% faster than easy (5K pace)
    case 'strides':
      return secondsToPace(easySeconds * 0.80); // ~20% faster (mile effort)
    case 'fartlek':
      return secondsToPace(easySeconds); // Average is easy pace; fast segments vary
    case 'hill_repeats':
      return secondsToPace(easySeconds * 0.87); // Hard effort uphill (~13% faster)
    case 'cross_training':
      return '0:00'; // N/A — non-running workout
    case 'rest':
      return '0:00';
    default:
      return easyPace;
  }
}

/**
 * Calculate goal-race-pace-derived training paces from a finish time target
 */
export interface GoalTimePaces {
  racePace: string;    // Target race pace (min:sec/mile)
  tempo: string;       // Comfortably hard threshold pace (~25s slower than race pace for marathon+)
  threshold: string;   // Lactate threshold (~15s slower than race pace)
  interval: string;    // VO2max intervals (~10s faster than race pace)
}

export function calculatePacesFromGoalTime(goalFinishTime: string, goalDistance: number): GoalTimePaces {
  // Parse HH:MM:SS or H:MM:SS
  const parts = goalFinishTime.split(':').map(Number);
  let totalSeconds: number;
  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1];
  } else {
    return { racePace: '0:00', tempo: '0:00', threshold: '0:00', interval: '0:00' };
  }

  const racePaceSeconds = totalSeconds / goalDistance;

  // Pace offsets vary by race distance (shorter races = tighter spread)
  const tempoOffset = goalDistance >= 26.2 ? 25 : goalDistance >= 13.1 ? 20 : 15;
  const thresholdOffset = goalDistance >= 26.2 ? 15 : goalDistance >= 13.1 ? 10 : 8;
  const intervalOffset = goalDistance >= 26.2 ? 10 : goalDistance >= 13.1 ? 8 : 6;

  return {
    racePace: secondsToPace(racePaceSeconds),
    tempo: secondsToPace(racePaceSeconds + tempoOffset),
    threshold: secondsToPace(racePaceSeconds + thresholdOffset),
    interval: secondsToPace(racePaceSeconds - intervalOffset),
  };
}

/**
 * Calculate target paces for different zones based on easy pace
 */
export interface PaceZones {
  recovery: string;
  easy: string;
  longRun: string;
  tempo: string;
  threshold: string;
  interval: string;
}

/**
 * Grade-Adjusted Pace using Minetti's energy cost model approximation.
 * gradePercent: positive = uphill, negative = downhill
 * Returns equivalent flat-terrain pace string.
 */
export function gradeAdjustedPace(pace: string, gradePercent: number): string {
  const flatPaceSeconds = paceToSeconds(pace);
  // Minetti coefficient: energy cost relative to flat
  // Simplified: C_r(grade) = 3.6 * grade^2 + 0.3 * grade + 1  (valid -30% to +30%)
  const g = gradePercent / 100;
  const costRatio = Math.max(0.5, 3.6 * g * g + 0.3 * g + 1);
  return secondsToPace(flatPaceSeconds / costRatio);
}

export function calculatePaceZones(easyPace: string): PaceZones {
  const easySeconds = paceToSeconds(easyPace);

  return {
    recovery: secondsToPace(easySeconds * 1.15),
    easy: easyPace,
    longRun: secondsToPace(easySeconds * 1.05),
    tempo: secondsToPace(easySeconds * 0.92),
    threshold: secondsToPace(easySeconds * 0.88),
    interval: secondsToPace(easySeconds * 0.85),
  };
}
