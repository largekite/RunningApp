import { WorkoutType, NutritionTip } from '../context/types';
import {
  getNutritionTip,
  getAllTipsForWorkout,
  calculateHydrationNeeds,
} from '../constants/nutritionTips';

/**
 * Nutrition Service
 * Provides nutrition recommendations based on workouts
 */
class NutritionService {
  /**
   * Get a contextual nutrition tip for today's workout
   */
  getTipForWorkout(workoutType: WorkoutType): NutritionTip {
    return getNutritionTip(workoutType);
  }

  /**
   * Get all tips for a specific workout type
   */
  getAllTips(workoutType: WorkoutType): NutritionTip[] {
    return getAllTipsForWorkout(workoutType);
  }

  /**
   * Get hydration recommendations
   */
  getHydrationRecommendations(distanceMiles: number): {
    preRun: string;
    during: string;
    postRun: string;
  } {
    return calculateHydrationNeeds(distanceMiles);
  }

  /**
   * Get general daily nutrition goals for ultramarathon training
   */
  getDailyNutritionGoals(weightLbs: number, weeklyMileage: number): {
    calories: number;
    carbsGrams: number;
    proteinGrams: number;
    fatsGrams: number;
  } {
    // Base metabolic rate + activity
    // Rough estimate: BMR ~15 cal/lb + training calories
    const baseCal = weightLbs * 15;
    const trainingCal = weeklyMileage * 100; // ~100 cal per mile
    const dailyTrainingCal = trainingCal / 7;
    const totalCalories = Math.round(baseCal + dailyTrainingCal);

    // Macronutrient distribution for endurance athletes
    // 55-65% carbs, 15-20% protein, 20-30% fat
    const carbsGrams = Math.round((totalCalories * 0.6) / 4); // 4 cal per gram
    const proteinGrams = Math.round((totalCalories * 0.18) / 4);
    const fatsGrams = Math.round((totalCalories * 0.22) / 9); // 9 cal per gram

    return {
      calories: totalCalories,
      carbsGrams,
      proteinGrams,
      fatsGrams,
    };
  }

  /**
   * Get nutrition recommendations based on recent scores
   */
  getNutritionAdvice(averageScore: number): string[] {
    const advice: string[] = [];

    if (averageScore < 2) {
      advice.push('Your nutrition needs significant improvement.');
      advice.push('Focus on eating 3 balanced meals per day.');
      advice.push('Plan meals in advance to avoid poor choices.');
      advice.push('Consider meal prep on rest days.');
    } else if (averageScore < 3) {
      advice.push('Your nutrition could use some attention.');
      advice.push('Try to include more whole foods.');
      advice.push('Ensure adequate protein intake (0.5-0.7g per lb body weight).');
      advice.push('Don\'t skip post-run recovery meals.');
    } else if (averageScore < 4) {
      advice.push('Your nutrition is on track!');
      advice.push('Keep focusing on quality carbs before long runs.');
      advice.push('Continue prioritizing protein after hard workouts.');
    } else {
      advice.push('Excellent nutrition habits!');
      advice.push('You\'re fueling your body optimally for training.');
      advice.push('Keep up the great work!');
    }

    return advice;
  }

  /**
   * Get pre-race nutrition plan (for race week)
   */
  getRaceWeekNutritionPlan(): string[] {
    return [
      '3 days before: Increase carbs to 70% of calories (carb loading)',
      '2 days before: Continue carb loading, reduce fiber to avoid GI issues',
      '1 day before: Light, familiar meals. Hydrate well.',
      'Race morning: Eat 2-3 hours before. 200-300 calories of easily digestible carbs.',
      'During race: 30-60g carbs per hour after the first hour',
      'Post-race: Recovery drink within 30 min, then balanced meal',
    ];
  }
}

export default new NutritionService();
