/**
 * Pace Calculator Utilities
 */

/**
 * Convert pace string (e.g., "8:30") to seconds per mile
 */
export function paceToSeconds(pace: string): number {
  const [minutes, seconds] = pace.split(':').map(Number);
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
  workoutType: 'easy_run' | 'long_run' | 'tempo' | 'intervals' | 'recovery' | 'rest'
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
    case 'rest':
      return '0:00';
    default:
      return easyPace;
  }
}

/**
 * Calculate target paces for different zones based on easy pace
 */
export interface PaceZones {
  recovery: string;
  easy: string;
  tempo: string;
  threshold: string;
  interval: string;
}

export function calculatePaceZones(easyPace: string): PaceZones {
  const easySeconds = paceToSeconds(easyPace);

  return {
    recovery: secondsToPace(easySeconds * 1.15),
    easy: easyPace,
    tempo: secondsToPace(easySeconds * 0.92),
    threshold: secondsToPace(easySeconds * 0.88),
    interval: secondsToPace(easySeconds * 0.85),
  };
}
