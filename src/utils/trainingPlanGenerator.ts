import uuid from 'react-native-uuid';
const uuidv4 = uuid.v4;
import { TrainingPlan, WeeklyPlan, DailyWorkout, ExperienceLevel, WorkoutType } from '../context/types';
import { formatDate, getDateForDay, getWeekStart } from './dateHelpers';
import { getRecommendedPace } from './paceCalculator';

interface PlanInput {
  raceDate: string; // ISO date
  goalDistance: number; // e.g., 6.2 (10K), 13.1 (half), 26.2 (marathon), 31 (50K), 50, 62 (100K)
  currentWeeklyMileage: number;
  longestRun: number;
  experienceLevel: ExperienceLevel;
  easyPace: string; // e.g., "9:00"
}

/**
 * Generate a training plan for any race distance
 */
export function generateTrainingPlan(input: PlanInput): TrainingPlan {
  const { raceDate, goalDistance, currentWeeklyMileage, longestRun, experienceLevel, easyPace } = input;

  // Determine plan duration based on experience, fitness, and distance
  const totalWeeks = calculatePlanDuration(experienceLevel, currentWeeklyMileage, longestRun, goalDistance);

  // Calculate start date
  const raceDay = new Date(raceDate);
  const startDate = new Date(raceDay);
  startDate.setDate(raceDay.getDate() - totalWeeks * 7);

  // Calculate peak weekly mileage scaled to goal distance
  const peakMileage = calculatePeakMileage(experienceLevel, currentWeeklyMileage, goalDistance);

  // Cap longest training run based on goal distance
  const maxLongRun = goalDistance <= 26.2 ? goalDistance : goalDistance * 0.8;

  // Generate weekly plans
  const weeks = generateWeeklyPlans({
    totalWeeks,
    startDate,
    currentMileage: currentWeeklyMileage,
    peakMileage,
    longestRun,
    easyPace,
    experienceLevel,
    maxLongRun,
  });

  return {
    id: uuidv4() as string,
    goalDistance,
    startDate: formatDate(startDate),
    raceDate,
    currentWeek: 1,
    totalWeeks,
    baseWeeklyMileage: currentWeeklyMileage,
    peakWeeklyMileage: peakMileage,
    weeks,
  };
}

/**
 * Calculate training plan duration based on experience, fitness, and goal distance
 */
function calculatePlanDuration(
  experience: ExperienceLevel,
  currentMileage: number,
  longestRun: number,
  goalDistance: number
): number {
  // Base weeks by distance category
  let baseWeeks: number;
  if (goalDistance <= 6.2) {
    baseWeeks = 8; // 10K
  } else if (goalDistance <= 13.1) {
    baseWeeks = 12; // Half marathon
  } else if (goalDistance <= 26.2) {
    baseWeeks = 16; // Marathon
  } else if (goalDistance <= 31) {
    baseWeeks = 18; // 50K
  } else if (goalDistance <= 50) {
    baseWeeks = 20; // 50 miles
  } else {
    baseWeeks = 24; // 100K+
  }

  // Adjust by experience
  if (experience === 'advanced' && currentMileage >= 40 && longestRun >= 15) {
    baseWeeks -= 4;
  } else if (experience === 'intermediate' && currentMileage >= 30) {
    baseWeeks -= 2;
  } else if (experience === 'beginner') {
    baseWeeks += 2;
  }

  return Math.max(8, Math.min(baseWeeks, 30));
}

/**
 * Calculate peak weekly mileage scaled to goal distance
 */
function calculatePeakMileage(experience: ExperienceLevel, currentMileage: number, goalDistance: number): number {
  // Peak weekly mileage as a ratio of goal distance
  let targetPeak: number;
  if (goalDistance <= 13.1) {
    targetPeak = goalDistance * 2.5; // e.g., 10K -> ~15 mi/wk, half -> ~33 mi/wk
  } else if (goalDistance <= 26.2) {
    targetPeak = goalDistance * 1.5; // marathon -> ~40 mi/wk
  } else {
    targetPeak = goalDistance * 0.9; // ultras -> 85-90% of goal distance
  }

  // Adjust by experience
  if (experience === 'advanced') {
    targetPeak *= 1.1;
  } else if (experience === 'beginner') {
    targetPeak *= 0.85;
  }

  // Ensure we don't increase too quickly from current mileage
  const safeMaxIncrease = currentMileage * 1.8;

  return Math.round(Math.min(targetPeak, safeMaxIncrease));
}

/**
 * Generate all weekly plans
 */
interface WeeklyPlanInput {
  totalWeeks: number;
  startDate: Date;
  currentMileage: number;
  peakMileage: number;
  longestRun: number;
  easyPace: string;
  experienceLevel: ExperienceLevel;
  maxLongRun: number;
}

function generateWeeklyPlans(input: WeeklyPlanInput): WeeklyPlan[] {
  const { totalWeeks, startDate, currentMileage, peakMileage, longestRun, easyPace, maxLongRun } = input;

  const weeks: WeeklyPlan[] = [];

  // Training plan phases
  const basePhaseWeeks = Math.floor(totalWeeks * 0.4); // 40% base building
  const buildPhaseWeeks = Math.floor(totalWeeks * 0.35); // 35% build
  const peakPhaseWeeks = Math.floor(totalWeeks * 0.15); // 15% peak
  const taperWeeks = totalWeeks - basePhaseWeeks - buildPhaseWeeks - peakPhaseWeeks; // ~10% taper

  let longestRunSoFar = longestRun;

  for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
    // Determine phase
    let phase: string;
    let weeklyMileage: number;
    let longRunDistance: number;

    if (weekNum <= basePhaseWeeks) {
      phase = 'Base Building';
      weeklyMileage = linearProgression(currentMileage, peakMileage * 0.6, weekNum, basePhaseWeeks);
      longRunDistance = Math.min(longestRunSoFar + 2, weeklyMileage * 0.35);
    } else if (weekNum <= basePhaseWeeks + buildPhaseWeeks) {
      phase = 'Build Phase';
      const buildWeek = weekNum - basePhaseWeeks;
      weeklyMileage = linearProgression(
        peakMileage * 0.6,
        peakMileage * 0.85,
        buildWeek,
        buildPhaseWeeks
      );
      longRunDistance = Math.min(longestRunSoFar + 3, weeklyMileage * 0.4);
    } else if (weekNum <= totalWeeks - taperWeeks) {
      phase = 'Peak Phase';
      weeklyMileage = peakMileage;
      longRunDistance = Math.min(longestRunSoFar + 4, maxLongRun);
    } else {
      phase = 'Taper';
      const taperWeek = weekNum - (totalWeeks - taperWeeks);
      weeklyMileage = peakMileage * (1 - taperWeek * 0.3); // Reduce 30% per taper week
      longRunDistance = longestRunSoFar * 0.6; // Reduce long run significantly
    }

    // Every 4th week is a recovery week (except during taper)
    if (weekNum % 4 === 0 && weekNum < totalWeeks - taperWeeks) {
      weeklyMileage *= 0.75; // Reduce by 25%
      longRunDistance *= 0.7;
      phase += ' (Recovery)';
    }

    // Update longest run tracker
    longestRunSoFar = Math.max(longestRunSoFar, longRunDistance);

    // Calculate week start date
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + (weekNum - 1) * 7);

    // Generate daily workouts for the week
    const workouts = generateWeekWorkouts({
      weekNum,
      weekStartDate,
      weeklyMileage,
      longRunDistance,
      easyPace,
      phase,
    });

    weeks.push({
      weekNumber: weekNum,
      totalMileage: Math.round(weeklyMileage),
      focus: phase,
      workouts,
    });
  }

  return weeks;
}

/**
 * Linear progression between two values
 */
function linearProgression(start: number, end: number, current: number, total: number): number {
  return start + ((end - start) * current) / total;
}

/**
 * Generate daily workouts for a week
 */
interface WeekWorkoutsInput {
  weekNum: number;
  weekStartDate: Date;
  weeklyMileage: number;
  longRunDistance: number;
  easyPace: string;
  phase: string;
}

function generateWeekWorkouts(input: WeekWorkoutsInput): DailyWorkout[] {
  const { weekNum, weekStartDate, weeklyMileage, longRunDistance, easyPace, phase } = input;

  // Calculate mileage distribution
  // Typical week: Monday (easy), Tuesday (workout), Wed (easy), Thu (workout), Fri (rest), Sat (long), Sun (recovery)
  const remainingMileage = weeklyMileage - longRunDistance;

  const workoutTypes: WorkoutType[] = [
    'easy_run', // Monday
    phase.includes('Base') ? 'easy_run' : 'tempo', // Tuesday
    'easy_run', // Wednesday
    phase.includes('Taper') ? 'recovery' : 'intervals', // Thursday
    'rest', // Friday
    'long_run', // Saturday
    'recovery', // Sunday
  ];

  const mileageDistribution = [
    remainingMileage * 0.2, // Monday
    remainingMileage * 0.25, // Tuesday
    remainingMileage * 0.2, // Wednesday
    phase.includes('Taper') ? remainingMileage * 0.15 : remainingMileage * 0.2, // Thursday
    0, // Friday (rest)
    longRunDistance, // Saturday
    remainingMileage * 0.15, // Sunday
  ];

  const workouts: DailyWorkout[] = [];

  for (let day = 0; day < 7; day++) {
    const workoutDate = getDateForDay(weekStartDate, day);
    const type = workoutTypes[day];
    const distance = Math.round(mileageDistribution[day] * 10) / 10; // Round to 1 decimal

    let notes = '';
    if (type === 'long_run') {
      notes = 'Focus on maintaining steady effort. Walk breaks are OK. Fuel and hydrate every 45-60 min.';
    } else if (type === 'tempo') {
      notes = `Warm up 1 mile easy, then ${Math.round(distance * 0.6)} miles at tempo pace, cool down 1 mile easy.`;
    } else if (type === 'intervals') {
      notes = `Warm up 1 mile, then 6-8 x 800m at interval pace with 400m recovery, cool down 1 mile.`;
    } else if (type === 'recovery') {
      notes = 'Very easy effort. This run aids recovery from harder efforts.';
    }

    workouts.push({
      id: uuidv4() as string,
      date: formatDate(workoutDate),
      type,
      targetDistance: type === 'rest' ? undefined : distance,
      targetPace: type === 'rest' ? undefined : getRecommendedPace(easyPace, type),
      targetDuration: type === 'rest' ? undefined : undefined, // Can calculate if needed
      notes,
      modified: false,
    });
  }

  return workouts;
}
