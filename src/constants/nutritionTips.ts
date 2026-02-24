import { NutritionTip, WorkoutType } from '../context/types';

/**
 * Nutrition tips database
 * Provides context-aware nutrition advice based on workout type
 */
export const nutritionTips: NutritionTip[] = [
  // Long Run Tips
  {
    id: 'long_run_1',
    workoutType: 'long_run',
    title: 'Fuel During Your Long Run',
    description:
      'For runs over 90 minutes, consume 30-60g of carbohydrates per hour to maintain energy.',
    timing: 'during run',
    recommendations: [
      'Energy gels (1 every 45 min)',
      'Sports drinks with electrolytes',
      'Chews or gummies',
      'Real food: dates, bananas, pretzels',
    ],
  },
  {
    id: 'long_run_2',
    workoutType: 'long_run',
    title: 'Pre-Long Run Nutrition',
    description:
      'Eat a carb-rich meal 2-3 hours before your run. Keep it familiar and easy to digest.',
    timing: '2-3 hours before',
    recommendations: [
      'Oatmeal with banana and honey',
      'Toast with peanut butter and jam',
      'Bagel with cream cheese',
      'Energy bar with water',
    ],
  },
  {
    id: 'long_run_3',
    workoutType: 'long_run',
    title: 'Hydration is Key',
    description:
      'Drink 16-20 oz of water 2 hours before your run. Carry water or plan routes with water stops.',
    timing: '2 hours before',
    recommendations: [
      'Water with electrolyte tabs',
      'Sports drinks for runs >60 min',
      'Aim for 6-8 oz every 20 minutes',
    ],
  },

  // Easy Run Tips
  {
    id: 'easy_run_1',
    workoutType: 'easy_run',
    title: 'Light Pre-Run Snack',
    description: 'For easy runs under 60 minutes, a light snack 30-60 minutes before is sufficient.',
    timing: '30-60 minutes before',
    recommendations: ['Banana', 'Small energy bar', 'Toast with jam', 'Handful of pretzels'],
  },
  {
    id: 'easy_run_2',
    workoutType: 'easy_run',
    title: 'Post-Run Recovery',
    description:
      'After easy runs, have a balanced meal with carbs and protein within 2 hours.',
    timing: 'within 2 hours after',
    recommendations: [
      'Chicken and rice',
      'Pasta with lean meat',
      'Smoothie with protein powder',
      'Eggs and toast',
    ],
  },

  // Tempo Run Tips
  {
    id: 'tempo_1',
    workoutType: 'tempo',
    title: 'Pre-Tempo Fuel',
    description:
      'Eat a moderate carb meal 2-3 hours before. Avoid heavy fats that slow digestion.',
    timing: '2-3 hours before',
    recommendations: [
      'Oatmeal with berries',
      'Toast with honey',
      'Rice cakes with jam',
      'Small smoothie',
    ],
  },
  {
    id: 'tempo_2',
    workoutType: 'tempo',
    title: 'Post-Tempo Recovery',
    description:
      'Consume 20-30g of protein within 30 minutes post-workout for muscle recovery.',
    timing: 'within 30 minutes after',
    recommendations: [
      'Protein shake',
      'Greek yogurt with granola',
      'Chocolate milk',
      'Recovery bar',
    ],
  },

  // Intervals Tips
  {
    id: 'intervals_1',
    workoutType: 'intervals',
    title: 'Quick-Digesting Carbs',
    description:
      'Before high-intensity intervals, eat easily digestible carbs 60-90 minutes prior.',
    timing: '60-90 minutes before',
    recommendations: ['Banana', 'White bread with honey', 'Sports drink', 'Energy gel'],
  },
  {
    id: 'intervals_2',
    workoutType: 'intervals',
    title: 'Post-Workout Protein',
    description:
      'Intervals break down muscle. Aim for 20-25g protein post-workout to aid repair.',
    timing: 'within 30 minutes after',
    recommendations: [
      'Protein shake with banana',
      'Turkey sandwich',
      'Cottage cheese and fruit',
      'Eggs and toast',
    ],
  },

  // Recovery Run Tips
  {
    id: 'recovery_1',
    workoutType: 'recovery',
    title: 'Light and Easy',
    description:
      'Recovery runs are short and easy. No special fueling needed, just stay hydrated.',
    timing: 'before and after',
    recommendations: [
      'Regular balanced meals',
      'Water before and after',
      'Focus on whole foods',
      'Anti-inflammatory foods (berries, nuts)',
    ],
  },

  // Rest Day Tips
  {
    id: 'rest_1',
    workoutType: 'rest',
    title: 'Rest Day Nutrition',
    description:
      'Rest days are for recovery. Focus on whole foods, vegetables, and adequate protein.',
    timing: 'throughout day',
    recommendations: [
      'Colorful vegetables',
      'Lean proteins',
      'Healthy fats (avocado, nuts)',
      'Complex carbs (sweet potato, quinoa)',
      'Stay hydrated with water',
    ],
  },
  {
    id: 'rest_2',
    workoutType: 'rest',
    title: 'Anti-Inflammatory Foods',
    description:
      'Help your body recover with anti-inflammatory foods rich in omega-3s and antioxidants.',
    timing: 'throughout day',
    recommendations: [
      'Fatty fish (salmon, mackerel)',
      'Berries and cherries',
      'Turmeric and ginger',
      'Dark leafy greens',
      'Nuts and seeds',
    ],
  },
];

/**
 * Get a random nutrition tip for a specific workout type
 */
export function getNutritionTip(workoutType: WorkoutType): NutritionTip {
  const tips = nutritionTips.filter((tip) => tip.workoutType === workoutType);
  const randomIndex = Math.floor(Math.random() * tips.length);
  return tips[randomIndex] || nutritionTips[0];
}

/**
 * Get all nutrition tips for a specific workout type
 */
export function getAllTipsForWorkout(workoutType: WorkoutType): NutritionTip[] {
  return nutritionTips.filter((tip) => tip.workoutType === workoutType);
}

/**
 * Calculate hydration needs based on run distance
 */
export function calculateHydrationNeeds(distanceMiles: number): {
  preRun: string;
  during: string;
  postRun: string;
} {
  if (distanceMiles < 5) {
    return {
      preRun: '16 oz water 2 hours before',
      during: 'Not needed for short runs',
      postRun: '20-24 oz for every lb lost',
    };
  } else if (distanceMiles < 10) {
    return {
      preRun: '16-20 oz water 2 hours before',
      during: '6-8 oz every 20 minutes',
      postRun: '20-24 oz for every lb lost',
    };
  } else {
    return {
      preRun: '20 oz water + electrolytes 2 hours before',
      during: '6-10 oz every 15-20 minutes with electrolytes',
      postRun: '24 oz for every lb lost + recovery drink',
    };
  }
}
