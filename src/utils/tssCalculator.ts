/**
 * Training Stress Score (TSS) calculations.
 * Based on Training Peaks methodology adapted for running.
 */

/**
 * Calculate running TSS (rTSS).
 * rTSS = (durationSeconds * NGP * IF) / (FTP * 3600) * 100
 * where IF = NGP / FTP (Intensity Factor)
 *
 * @param durationMinutes - workout duration in minutes
 * @param ngpSecondsPerMile - Normalized Graded Pace in seconds per mile
 * @param ftpSecondsPerMile - Functional Threshold Pace (60-min pace) in seconds per mile
 */
export function calculateRTSS(
  durationMinutes: number,
  ngpSecondsPerMile: number,
  ftpSecondsPerMile: number,
): number {
  if (ftpSecondsPerMile <= 0 || ngpSecondsPerMile <= 0 || durationMinutes <= 0) {
    return 0;
  }
  const durationSeconds = durationMinutes * 60;
  // Note: faster pace = smaller seconds per mile value = higher intensity
  // IF = FTP / NGP so that running faster than FTP gives IF > 1
  const intensityFactor = ftpSecondsPerMile / ngpSecondsPerMile;
  const rTSS = (durationSeconds * intensityFactor * intensityFactor) / 3600 * 100;
  return Math.round(rTSS * 10) / 10;
}

/**
 * Exponential weighted average helper.
 * decay is the time constant (e.g. 7 for ATL, 42 for CTL).
 */
function exponentialWeightedAverage(values: number[], decay: number): number {
  if (values.length === 0) return 0;
  const k = 1 / decay;
  let ewa = values[0];
  for (let i = 1; i < values.length; i++) {
    ewa = ewa * (1 - k) + values[i] * k;
  }
  return Math.round(ewa * 10) / 10;
}

/**
 * Calculate Acute Training Load (short-term fatigue indicator).
 * Uses 7-day exponential weighted average by default.
 *
 * @param tssHistory - array of daily TSS values, oldest first
 * @param days - number of days for the window (default 7)
 */
export function calculateATL(tssHistory: number[], days: number = 7): number {
  const recent = tssHistory.slice(-Math.max(days * 2, tssHistory.length));
  return exponentialWeightedAverage(recent, days);
}

/**
 * Calculate Chronic Training Load (long-term fitness indicator).
 * Uses 42-day exponential weighted average by default.
 *
 * @param tssHistory - array of daily TSS values, oldest first
 * @param days - number of days for the window (default 42)
 */
export function calculateCTL(tssHistory: number[], days: number = 42): number {
  return exponentialWeightedAverage(tssHistory, days);
}

/**
 * Calculate Training Stress Balance (Form).
 * TSB = CTL - ATL
 * Positive = fresh/recovered, Negative = fatigued/building
 */
export function calculateTSB(ctl: number, atl: number): number {
  return Math.round((ctl - atl) * 10) / 10;
}

/**
 * Get a human-readable label for a TSB value.
 */
export function getTSBLabel(tsb: number): { label: string; color: string; description: string } {
  if (tsb > 10) {
    return {
      label: 'Fresh',
      color: '#4caf50',
      description: 'Well recovered, ready to perform',
    };
  } else if (tsb >= 0) {
    return {
      label: 'Optimal',
      color: '#2196f3',
      description: 'Good balance of fitness and freshness',
    };
  } else if (tsb >= -10) {
    return {
      label: 'Productive',
      color: '#9c27b0',
      description: 'Building fitness effectively',
    };
  } else {
    return {
      label: 'Fatigued',
      color: '#f44336',
      description: 'High training load, manage recovery',
    };
  }
}

/**
 * RPE-based TSS fallback for when pace data is unavailable.
 * Formula: durationHours * 100 * (rpe / 5)^2
 *
 * @param durationMinutes - workout duration in minutes
 * @param rpe - Rate of Perceived Exertion (1–10 scale for this calculation, or 1–5 RPE mapped internally)
 */
export function rpeBasedTSS(durationMinutes: number, rpe: number): number {
  if (durationMinutes <= 0 || rpe <= 0) return 0;
  const durationHours = durationMinutes / 60;
  const normalizedRpe = rpe / 5; // supports both 1-5 and 1-10 scales
  const tss = durationHours * 100 * Math.pow(normalizedRpe, 2);
  return Math.round(tss * 10) / 10;
}
