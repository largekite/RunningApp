import uuid from 'react-native-uuid';
const uuidv4 = uuid.v4;
import { TrainingPlan, WeeklyPlan, DailyWorkout, ExperienceLevel, WorkoutType, WorkoutSegment } from '../context/types';
import { formatDate, getDateForDay, getWeekStart } from './dateHelpers';
import { getRecommendedPace, calculatePacesFromGoalTime } from './paceCalculator';

interface PlanInput {
  raceDate: string; // ISO date
  goalDistance: number; // e.g., 6.2 (10K), 13.1 (half), 26.2 (marathon), 31 (50K), 50, 62 (100K)
  currentWeeklyMileage: number;
  longestRun: number;
  experienceLevel: ExperienceLevel;
  easyPace: string; // e.g., "9:00"
  goalFinishTime?: string; // e.g., "3:45:00" — optional target finish time
}

/**
 * Generate a training plan for any race distance
 */
export function generateTrainingPlan(input: PlanInput): TrainingPlan {
  const { raceDate, goalDistance, currentWeeklyMileage, longestRun, experienceLevel, easyPace, goalFinishTime } = input;

  // Determine plan duration based on experience, fitness, and distance
  const totalWeeks = calculatePlanDuration(experienceLevel, currentWeeklyMileage, longestRun, goalDistance);

  // Calculate start date
  const raceDay = new Date(raceDate);
  const startDate = new Date(raceDay);
  startDate.setDate(raceDay.getDate() - totalWeeks * 7);

  // Calculate peak weekly mileage scaled to goal distance
  const peakMileage = calculatePeakMileage(experienceLevel, currentWeeklyMileage, goalDistance);

  // Cap longest training run based on goal distance
  // For short races, train longer than the race itself to build fitness
  const maxLongRun =
    goalDistance <= 3.2 ? 8 :   // 5K: long runs up to 8 miles
    goalDistance <= 6.2 ? 10 :  // 10K: long runs up to 10 miles
    goalDistance <= 26.2 ? goalDistance : // Half/Marathon: up to race distance
    goalDistance * 0.8;          // Ultra: 80% of race distance

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
    goalFinishTime,
    goalDistance,
  });

  // Append one post-race recovery week after the race
  const postRaceWeek = generatePostRaceRecoveryWeek(totalWeeks + 1, startDate, totalWeeks, goalDistance, easyPace);

  return {
    id: uuidv4() as string,
    goalDistance,
    startDate: formatDate(startDate),
    raceDate,
    currentWeek: 1,
    totalWeeks: totalWeeks + 1,
    baseWeeklyMileage: currentWeeklyMileage,
    peakWeeklyMileage: peakMileage,
    weeks: [...weeks, postRaceWeek],
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
  if (goalDistance <= 3.2) {
    targetPeak = 25; // 5K: typical peak is 20-35 mi/wk regardless of race distance
  } else if (goalDistance <= 13.1) {
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
  goalFinishTime?: string;
  goalDistance: number;
}

function generateWeeklyPlans(input: WeeklyPlanInput): WeeklyPlan[] {
  const { totalWeeks, startDate, currentMileage, peakMileage, longestRun, easyPace, maxLongRun, goalFinishTime, goalDistance } = input;

  // Derive goal-time-based paces if provided
  const goalPaces = goalFinishTime
    ? calculatePacesFromGoalTime(goalFinishTime, goalDistance)
    : null;

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
      totalWeeks,
      weekStartDate,
      weeklyMileage,
      longRunDistance,
      easyPace,
      phase,
      goalPaces,
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
  totalWeeks: number;
  weekStartDate: Date;
  weeklyMileage: number;
  longRunDistance: number;
  easyPace: string;
  phase: string;
  goalPaces: { racePace: string; tempo: string; threshold: string; interval: string } | null;
}

function generateWeekWorkouts(input: WeekWorkoutsInput): DailyWorkout[] {
  const { weekNum, totalWeeks, weekStartDate, weeklyMileage, longRunDistance, easyPace, phase, goalPaces } = input;

  const isTaper = phase.includes('Taper');
  const isBuild = phase.includes('Build');
  const isPeak = phase.includes('Peak');
  const isBase = phase.includes('Base');

  // Select workout types based on training phase
  // Mon: easy, Tue: quality, Wed: easy, Thu: quality/recovery, Fri: rest, Sat: long, Sun: recovery
  let tuesdayType: WorkoutType;
  let thursdayType: WorkoutType;

  if (isBase) {
    const lateBase = weekNum > 2;
    tuesdayType = lateBase ? 'strides' : 'easy_run';
    thursdayType = lateBase ? 'cross_training' : 'easy_run';
  } else if (isBuild) {
    // Alternate fartlek/tempo on Tuesday, hill_repeats/intervals on Thursday
    tuesdayType = weekNum % 2 === 0 ? 'tempo' : 'fartlek';
    thursdayType = weekNum % 2 === 0 ? 'intervals' : 'hill_repeats';
  } else if (isPeak) {
    tuesdayType = 'tempo';
    thursdayType = 'intervals';
  } else if (isTaper) {
    tuesdayType = 'strides';
    thursdayType = 'recovery';
  } else {
    tuesdayType = 'easy_run';
    thursdayType = 'easy_run';
  }

  const workoutTypes: WorkoutType[] = [
    'easy_run',    // Monday
    tuesdayType,   // Tuesday
    'easy_run',    // Wednesday
    thursdayType,  // Thursday
    'rest',        // Friday
    'long_run',    // Saturday
    'recovery',    // Sunday
  ];

  const remainingMileage = weeklyMileage - longRunDistance;
  const thursdayFraction = isTaper ? 0.15 : 0.2;

  const mileageDistribution = [
    remainingMileage * 0.20, // Monday
    remainingMileage * 0.25, // Tuesday
    remainingMileage * 0.20, // Wednesday
    remainingMileage * thursdayFraction, // Thursday
    0,                        // Friday (rest)
    longRunDistance,           // Saturday
    remainingMileage * 0.15,  // Sunday
  ];

  // Resolve paces — use goal-time-derived paces when available
  const tempoPace = goalPaces ? goalPaces.tempo : getRecommendedPace(easyPace, 'tempo');
  const intervalPace = goalPaces ? goalPaces.interval : getRecommendedPace(easyPace, 'intervals');
  const hillPace = getRecommendedPace(easyPace, 'hill_repeats');
  const stridesPace = getRecommendedPace(easyPace, 'strides');

  const workouts: DailyWorkout[] = [];

  for (let day = 0; day < 7; day++) {
    const workoutDate = getDateForDay(weekStartDate, day);
    const type = workoutTypes[day];
    const distance = Math.round(mileageDistribution[day] * 10) / 10;

    const { notes, segments } = buildWorkoutDetails(type, distance, easyPace, tempoPace, intervalPace, hillPace, stridesPace, isPeak, totalWeeks, weekNum, goalPaces);

    workouts.push({
      id: uuidv4() as string,
      date: formatDate(workoutDate),
      type,
      targetDistance: type === 'rest' || type === 'cross_training' ? undefined : distance,
      targetPace: type === 'rest' || type === 'cross_training' ? undefined : getRecommendedPace(easyPace, type),
      notes,
      segments: segments.length > 0 ? segments : undefined,
      modified: false,
    });
  }

  return workouts;
}

/**
 * Build notes and structured segments for a given workout type
 */
function buildWorkoutDetails(
  type: WorkoutType,
  distance: number,
  easyPace: string,
  tempoPace: string,
  intervalPace: string,
  hillPace: string,
  stridesPace: string,
  isPeak: boolean,
  totalWeeks: number,
  weekNum: number,
  goalPaces: { racePace: string } | null,
): { notes: string; segments: WorkoutSegment[] } {
  const warmupDist = 1.0;
  const cooldownDist = 1.0;

  switch (type) {
    case 'long_run': {
      const finishMiles = isPeak && goalPaces ? 2 : 0;
      const segments: WorkoutSegment[] = [
        {
          name: 'Easy Miles',
          distance: Math.max(distance - finishMiles, distance),
          pace: easyPace,
          description: 'Steady conversational effort. Walk breaks OK. Fuel every 45-60 min.',
        },
      ];
      if (finishMiles > 0 && goalPaces) {
        segments[0].distance = distance - finishMiles;
        segments.push({
          name: 'Finish Miles',
          distance: finishMiles,
          pace: goalPaces.racePace,
          description: `Finish at goal race pace (${goalPaces.racePace}/mi) to practice race effort.`,
        });
      }
      return {
        notes: finishMiles > 0
          ? `Long run with last ${finishMiles} miles at goal race pace.`
          : 'Focus on maintaining steady effort. Walk breaks are OK. Fuel and hydrate every 45-60 min.',
        segments,
      };
    }

    case 'tempo': {
      const mainDist = Math.max(Math.round((distance - warmupDist - cooldownDist) * 10) / 10, 1);
      return {
        notes: `Comfortably hard effort. Target ${tempoPace}/mi.`,
        segments: [
          { name: 'Warm-up', distance: warmupDist, pace: easyPace, description: 'Easy jog to loosen up.' },
          { name: 'Tempo', distance: mainDist, pace: tempoPace, description: `Comfortably hard — you can speak only in short phrases. Target ${tempoPace}/mi.` },
          { name: 'Cool-down', distance: cooldownDist, pace: easyPace, description: 'Easy jog to recover.' },
        ],
      };
    }

    case 'intervals': {
      const reps = distance >= 7 ? 8 : 6;
      return {
        notes: `${reps}×800m at ${intervalPace}/mi with 400m jog recovery between each.`,
        segments: [
          { name: 'Warm-up', distance: warmupDist, pace: easyPace, description: 'Easy jog to prepare for hard efforts.' },
          { name: `${reps}×800m`, duration: reps * 4, pace: intervalPace, description: `Run 800m at ${intervalPace}/mi, then jog 400m easy. Repeat ${reps} times.` },
          { name: 'Cool-down', distance: cooldownDist, pace: easyPace, description: 'Easy jog to flush out lactic acid.' },
        ],
      };
    }

    case 'fartlek': {
      const fartlekReps = Math.max(4, Math.round((distance - warmupDist - cooldownDist) / 0.5));
      return {
        notes: `Unstructured speed play. Alternate ${fartlekReps}×(1 min fast / 2 min easy).`,
        segments: [
          { name: 'Warm-up', distance: warmupDist, pace: easyPace, description: 'Easy jog to ease in.' },
          { name: `${fartlekReps}× Surges`, duration: fartlekReps * 3, pace: intervalPace, description: `${fartlekReps} rounds: 1 min fast (${intervalPace}/mi effort), 2 min easy recovery jog.` },
          { name: 'Cool-down', distance: cooldownDist, pace: easyPace, description: 'Easy jog to finish.' },
        ],
      };
    }

    case 'hill_repeats': {
      const reps = 8;
      return {
        notes: `${reps}× hill sprints. Run hard uphill ~200m, walk down as recovery.`,
        segments: [
          { name: 'Warm-up', distance: warmupDist, pace: easyPace, description: 'Easy flat jog before the hill.' },
          { name: `${reps}× Hills`, duration: reps * 3, pace: hillPace, description: `Sprint uphill ~200m at hard effort (${hillPace}/mi on flat equivalent). Walk back down. Repeat ${reps} times.` },
          { name: 'Cool-down', distance: cooldownDist, pace: easyPace, description: 'Easy jog on flat to recover.' },
        ],
      };
    }

    case 'strides': {
      const strideDist = Math.max(distance - 0.3, distance * 0.8);
      return {
        notes: `Easy run with 4-6 strides at the end. Each stride is 20-25 sec at mile effort.`,
        segments: [
          { name: 'Easy Run', distance: strideDist, pace: easyPace, description: 'Comfortable easy effort.' },
          { name: '4-6 Strides', duration: 3, pace: stridesPace, description: `4-6 × 20-25 sec accelerations to near-sprint (${stridesPace}/mi). Full rest between each (walk 60-90 sec).` },
        ],
      };
    }

    case 'cross_training': {
      return {
        notes: '45-60 min of low-impact cardio: cycling, swimming, elliptical, or yoga.',
        segments: [
          { name: 'Cross-Training', duration: 50, description: '45-60 min easy effort. Keeps aerobic fitness while resting legs. Great for yoga, swimming, or cycling.' },
        ],
      };
    }

    case 'recovery': {
      return {
        notes: 'Very easy effort. This run aids recovery from harder efforts.',
        segments: [],
      };
    }

    default:
      return { notes: '', segments: [] };
  }
}

/**
 * Generate a post-race recovery week starting the Monday after race day
 */
function generatePostRaceRecoveryWeek(
  weekNum: number,
  planStartDate: Date,
  totalTrainingWeeks: number,
  goalDistance: number,
  easyPace: string
): WeeklyPlan {
  // Recovery week starts the Monday after the last training week
  const weekStartDate = new Date(planStartDate);
  weekStartDate.setDate(planStartDate.getDate() + totalTrainingWeeks * 7);

  // Cap recovery run distance based on race distance
  const maxRecoveryRun =
    goalDistance <= 3.2 ? 2 :
    goalDistance <= 6.2 ? 3 :
    goalDistance <= 13.1 ? 4 :
    goalDistance <= 26.2 ? 6 : 8;

  // Mon: rest, Tue: short recovery, Wed: rest, Thu: recovery, Fri: rest, Sat: rest, Sun: easy run
  const dayPlans: Array<{ type: WorkoutType; distance: number; notes: string }> = [
    { type: 'rest', distance: 0, notes: 'Full rest. Celebrate your race! Sleep, hydrate, and eat well.' },
    { type: 'recovery', distance: Math.round(maxRecoveryRun * 0.5 * 10) / 10, notes: 'Very easy shakeout. Stop immediately if anything hurts.' },
    { type: 'rest', distance: 0, notes: 'Rest day. Continue prioritizing sleep and nutrition.' },
    { type: 'recovery', distance: Math.round(maxRecoveryRun * 0.7 * 10) / 10, notes: 'Easy recovery run. Keep effort conversational.' },
    { type: 'rest', distance: 0, notes: 'Rest day.' },
    { type: 'rest', distance: 0, notes: 'Rest day.' },
    { type: 'easy_run', distance: maxRecoveryRun, notes: 'Easy run to wrap up recovery week. You should feel mostly back to normal.' },
  ];

  const workouts: DailyWorkout[] = dayPlans.map((day, i) => {
    const workoutDate = getDateForDay(weekStartDate, i);
    return {
      id: uuidv4() as string,
      date: formatDate(workoutDate),
      type: day.type,
      targetDistance: day.type === 'rest' ? undefined : day.distance,
      targetPace: day.type === 'rest' ? undefined : getRecommendedPace(easyPace, day.type),
      notes: day.notes,
      modified: false,
    };
  });

  const totalMileage = dayPlans.reduce((sum, d) => sum + d.distance, 0);

  return {
    weekNumber: weekNum,
    totalMileage: Math.round(totalMileage * 10) / 10,
    focus: 'Post-Race Recovery',
    workouts,
  };
}
