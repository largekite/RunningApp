import {
  DailyWorkout,
  ActivityCheckIn,
  AdaptationInput,
  AdaptationResult,
  WorkoutType,
} from '../context/types';
import { getRecommendedPace, adjustPace } from '../utils/paceCalculator';
import { formatDate } from '../utils/dateHelpers';

/**
 * Adaptive Training Algorithm
 * Adjusts upcoming workouts based on recent performance, sleep, and nutrition
 */
class AdaptationService {
  /**
   * Analyze recent check-ins and adapt the next workout
   */
  adaptWorkout(input: AdaptationInput): AdaptationResult {
    const { plannedWorkout, recentCheckIns, currentWeek, totalWeeks, weeklyMileage } = input;

    // If it's a rest day or already modified, don't adapt
    if (plannedWorkout.type === 'rest' || plannedWorkout.modified) {
      return { adjustedWorkout: plannedWorkout };
    }

    // Analyze recent check-ins
    const analysis = this.analyzeCheckIns(recentCheckIns);

    // Make adaptation decision
    const adaptation = this.decideAdaptation(
      plannedWorkout,
      analysis,
      currentWeek,
      totalWeeks,
      weeklyMileage
    );

    return adaptation;
  }

  /**
   * Analyze recent check-ins for patterns
   */
  private analyzeCheckIns(checkIns: ActivityCheckIn[]): CheckInAnalysis {
    if (checkIns.length === 0) {
      return {
        averageRPE: 3,
        averageSleepHours: 7,
        averageSleepQuality: 3,
        averageNutritionScore: 3,
        completionRate: 100,
        consecutiveMissed: 0,
        lastWorkoutRPE: 3,
        lastSleepHours: 7,
        hasRecentHighEffort: false,
        hasRecentPoorSleep: false,
      };
    }

    // Calculate averages
    const completed = checkIns.filter((c) => c.completed);
    const completionRate = (completed.length / checkIns.length) * 100;

    const rpeValues = completed.filter((c) => c.perceivedEffort).map((c) => c.perceivedEffort!);
    const averageRPE = rpeValues.length > 0
      ? rpeValues.reduce((sum, val) => sum + val, 0) / rpeValues.length
      : 3;

    const sleepHours = checkIns.filter((c) => c.sleepHours).map((c) => c.sleepHours!);
    const averageSleepHours = sleepHours.length > 0
      ? sleepHours.reduce((sum, val) => sum + val, 0) / sleepHours.length
      : 7;

    const sleepQuality = checkIns.filter((c) => c.sleepQuality).map((c) => c.sleepQuality!);
    const averageSleepQuality = sleepQuality.length > 0
      ? sleepQuality.reduce((sum, val) => sum + val, 0) / sleepQuality.length
      : 3;

    const nutritionScores = checkIns.filter((c) => c.nutritionScore).map((c) => c.nutritionScore!);
    const averageNutritionScore = nutritionScores.length > 0
      ? nutritionScores.reduce((sum, val) => sum + val, 0) / nutritionScores.length
      : 3;

    // Check for consecutive missed workouts
    let consecutiveMissed = 0;
    for (let i = checkIns.length - 1; i >= 0; i--) {
      if (!checkIns[i].completed) {
        consecutiveMissed++;
      } else {
        break;
      }
    }

    // Last workout metrics
    const lastCompleted = completed[completed.length - 1];
    const lastWorkoutRPE = lastCompleted?.perceivedEffort || 3;
    const lastSleepHours = checkIns[checkIns.length - 1]?.sleepHours || 7;

    // Flags
    const hasRecentHighEffort = rpeValues.slice(-3).some((rpe) => rpe >= 4);
    const hasRecentPoorSleep = sleepHours.slice(-3).some((hours) => hours < 6);

    return {
      averageRPE,
      averageSleepHours,
      averageSleepQuality,
      averageNutritionScore,
      completionRate,
      consecutiveMissed,
      lastWorkoutRPE,
      lastSleepHours,
      hasRecentHighEffort,
      hasRecentPoorSleep,
    };
  }

  /**
   * Decide if and how to adapt the workout
   */
  private decideAdaptation(
    planned: DailyWorkout,
    analysis: CheckInAnalysis,
    currentWeek: number,
    totalWeeks: number,
    weeklyMileage: number[]
  ): AdaptationResult {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let adjustedWorkout = { ...planned };
    let shouldModify = false;

    // Rule 1: Poor sleep = easier workout or rest
    if (analysis.lastSleepHours < 6 || analysis.averageSleepQuality < 2) {
      if (planned.type === 'long_run' || planned.type === 'tempo' || planned.type === 'intervals') {
        shouldModify = true;
        adjustedWorkout.type = 'recovery';
        adjustedWorkout.targetDistance = (planned.targetDistance || 0) * 0.5;
        adjustedWorkout.targetPace = adjustPace(planned.targetPace || '9:00', 15); // 15% slower
        reasons.push('Poor sleep quality detected. Converted to recovery run.');
        recommendations.push('Prioritize getting 8+ hours of sleep tonight.');
      }
    }

    // Rule 2: High RPE + high effort = reduce intensity
    if (analysis.lastWorkoutRPE >= 4 && analysis.hasRecentHighEffort) {
      if (planned.type === 'tempo' || planned.type === 'intervals') {
        shouldModify = true;
        adjustedWorkout.type = 'easy_run';
        adjustedWorkout.targetPace = adjustPace(planned.targetPace || '9:00', 10); // 10% slower
        reasons.push('Recent high effort workouts. Reducing intensity to prevent overtraining.');
        recommendations.push('Focus on easy, comfortable effort today.');
      }
    }

    // Rule 3: Consecutive missed workouts = reduce volume
    if (analysis.consecutiveMissed >= 2) {
      shouldModify = true;
      adjustedWorkout.targetDistance = (planned.targetDistance || 0) * 0.7;
      reasons.push('Missed recent workouts. Reducing volume to ease back in.');
      recommendations.push('Build back gradually to avoid injury.');
    }

    // Rule 4: Low completion rate = easier week ahead
    if (analysis.completionRate < 60) {
      shouldModify = true;
      adjustedWorkout.targetDistance = (planned.targetDistance || 0) * 0.8;
      reasons.push('Low recent completion rate. Adjusting volume to improve consistency.');
      recommendations.push('Focus on completing shorter runs to build momentum.');
    }

    // Rule 5: Mileage increase too rapid (>10% per week)
    if (weeklyMileage.length >= 2) {
      const lastWeek = weeklyMileage[weeklyMileage.length - 1];
      const previousWeek = weeklyMileage[weeklyMileage.length - 2];
      const increase = ((lastWeek - previousWeek) / previousWeek) * 100;

      if (increase > 15) {
        shouldModify = true;
        adjustedWorkout.targetDistance = (planned.targetDistance || 0) * 0.85;
        reasons.push('Weekly mileage increased too quickly. Reducing to prevent injury.');
        recommendations.push('Follow the 10% rule for mileage increases.');
      }
    }

    // Rule 6: Very low RPE consistently = can increase intensity slightly
    if (
      analysis.averageRPE < 2.5 &&
      !shouldModify &&
      (planned.type === 'easy_run' || planned.type === 'long_run')
    ) {
      shouldModify = true;
      adjustedWorkout.targetPace = adjustPace(planned.targetPace || '9:00', -5); // 5% faster
      reasons.push('Workouts have been feeling very easy. Slightly increasing pace.');
      recommendations.push('You can handle a bit more intensity!');
    }

    // Rule 7: Poor nutrition scores = add nutrition reminder
    if (analysis.averageNutritionScore < 2.5) {
      recommendations.push(
        'Recent nutrition scores are low. Focus on fueling properly before and after runs.'
      );
    }

    // Apply modifications if needed
    if (shouldModify) {
      adjustedWorkout.modified = true;
      adjustedWorkout.modificationReason = reasons.join(' ');
    }

    return {
      adjustedWorkout,
      reason: reasons.join(' ') || undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  /**
   * Get workout recommendations based on recent history
   */
  getRecommendations(checkIns: ActivityCheckIn[]): string[] {
    const analysis = this.analyzeCheckIns(checkIns);
    const recommendations: string[] = [];

    if (analysis.averageSleepHours < 7) {
      recommendations.push('Aim for 7-9 hours of sleep per night for optimal recovery.');
    }

    if (analysis.averageRPE > 4) {
      recommendations.push('Your recent workouts have been very hard. Consider more easy runs.');
    }

    if (analysis.completionRate < 75) {
      recommendations.push('Try to maintain consistency. Even short runs help build the habit.');
    }

    if (analysis.averageNutritionScore < 3) {
      recommendations.push('Focus on nutrition: carbs for fuel, protein for recovery.');
    }

    return recommendations;
  }
}

// Analysis result interface
interface CheckInAnalysis {
  averageRPE: number;
  averageSleepHours: number;
  averageSleepQuality: number;
  averageNutritionScore: number;
  completionRate: number;
  consecutiveMissed: number;
  lastWorkoutRPE: number;
  lastSleepHours: number;
  hasRecentHighEffort: boolean;
  hasRecentPoorSleep: boolean;
}

export default new AdaptationService();
