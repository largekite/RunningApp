import { ActivityCheckIn } from '../context/types';
import {
  calculateRTSS,
  calculateATL,
  calculateCTL,
  calculateTSB,
  getTSBLabel,
  rpeBasedTSS,
} from '../utils/tssCalculator';
import { paceToSeconds } from '../utils/paceCalculator';

/**
 * Compute a single day's TSS from a check-in.
 * Prefers rTSS when actual distance + pace available; falls back to RPE-based TSS.
 */
function getDailyTSS(checkIn: ActivityCheckIn, ftpPace: string): number {
  if (!checkIn.completed) return 0;

  const ftpSeconds = paceToSeconds(ftpPace);
  if (ftpSeconds <= 0) return 0;

  if (
    checkIn.actualDistance != null &&
    checkIn.actualDistance > 0 &&
    checkIn.actualPace &&
    checkIn.actualPace.trim().length > 0
  ) {
    const ngpSeconds = paceToSeconds(checkIn.actualPace);
    if (ngpSeconds > 0 && checkIn.actualDuration != null && checkIn.actualDuration > 0) {
      return calculateRTSS(checkIn.actualDuration, ngpSeconds, ftpSeconds);
    }
  }

  if (
    checkIn.perceivedEffort != null &&
    checkIn.actualDuration != null &&
    checkIn.actualDuration > 0
  ) {
    return rpeBasedTSS(checkIn.actualDuration, checkIn.perceivedEffort);
  }

  return 0;
}

/**
 * Build a sorted array of {date, tss} for the last 90 days from check-ins.
 */
function buildTSSHistory(
  checkIns: ActivityCheckIn[],
  ftpPace: string,
): { date: string; tss: number }[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const byDate: { [date: string]: number } = {};
  for (const checkIn of checkIns) {
    if (checkIn.date < cutoffStr) continue;
    const tss = getDailyTSS(checkIn, ftpPace);
    byDate[checkIn.date] = (byDate[checkIn.date] || 0) + tss;
  }

  return Object.entries(byDate)
    .map(([date, tss]) => ({ date, tss }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get current ATL, CTL, TSB and a human-readable label.
 */
function getCurrentLoad(
  checkIns: ActivityCheckIn[],
  ftpPace: string,
): {
  atl: number;
  ctl: number;
  tsb: number;
  label: string;
  color: string;
  description: string;
} {
  const history = buildTSSHistory(checkIns, ftpPace);
  const tssValues = history.map((h) => h.tss);

  const atl = calculateATL(tssValues, 7);
  const ctl = calculateCTL(tssValues, 42);
  const tsb = calculateTSB(ctl, atl);
  const { label, color, description } = getTSBLabel(tsb);

  return { atl, ctl, tsb, label, color, description };
}

/**
 * Build a day-by-day ATL/CTL/TSB history for charting.
 * Fills in zero for days with no activity.
 */
function getLoadHistory(
  checkIns: ActivityCheckIn[],
  ftpPace: string,
  days: number = 60,
): { date: string; atl: number; ctl: number; tsb: number }[] {
  // Build a date→tss lookup
  const history = buildTSSHistory(checkIns, ftpPace);
  const tssByDate: { [date: string]: number } = {};
  for (const h of history) {
    tssByDate[h.date] = h.tss;
  }

  // Generate the past N days in order
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }

  // Rebuild TSS by date from history for use in the 90-day rolling window
  const allTSSByDate: { [date: string]: number } = {};
  for (const h of history) {
    allTSSByDate[h.date] = h.tss;
  }

  const result: { date: string; atl: number; ctl: number; tsb: number }[] = [];
  const cumulativeTSS: number[] = [];

  // Fill in the full 90-day window of daily TSS values
  const allDates: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    allDates.push(d.toISOString().split('T')[0]);
  }

  for (const date of allDates) {
    cumulativeTSS.push(allTSSByDate[date] ?? 0);
    if (dates.includes(date)) {
      const atl = calculateATL([...cumulativeTSS], 7);
      const ctl = calculateCTL([...cumulativeTSS], 42);
      const tsb = calculateTSB(ctl, atl);
      result.push({ date, atl, ctl, tsb });
    }
  }

  return result;
}

class TrainingLoadService {
  getDailyTSS = getDailyTSS;
  buildTSSHistory = buildTSSHistory;
  getCurrentLoad = getCurrentLoad;
  getLoadHistory = getLoadHistory;
}

export default new TrainingLoadService();
