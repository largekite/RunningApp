import { SleepRecommendation, WorkoutType, DailyWorkout } from '../context/types';

/**
 * Calculate sleep recommendation based on training load and upcoming workout
 */
export function getSleepRecommendation(
  weeklyMileage: number,
  tomorrowWorkout?: DailyWorkout,
  recentSleepHours?: number
): SleepRecommendation {
  let targetHours = 8;
  const tips: string[] = [];
  let reason = 'General recovery recommendation for runners.';

  // Base recommendation on weekly mileage
  if (weeklyMileage > 50) {
    targetHours = 9;
    reason = 'You\'re running 50+ miles this week. Extra sleep helps with recovery.';
  } else if (weeklyMileage > 40) {
    targetHours = 8.5;
    reason = 'High mileage week. Aim for extra sleep to optimize recovery.';
  } else if (weeklyMileage > 30) {
    targetHours = 8;
    reason = 'Moderate mileage. Standard 8 hours supports your training.';
  } else {
    targetHours = 7.5;
    reason = 'Light training week. 7-8 hours is sufficient.';
  }

  // Adjust for tomorrow's workout
  if (tomorrowWorkout) {
    if (tomorrowWorkout.type === 'long_run') {
      targetHours = Math.max(targetHours, 8);
      reason = 'Long run tomorrow! Get 8+ hours for peak performance.';
      tips.push('Set an earlier bedtime tonight.');
      tips.push('Avoid screens 30 minutes before bed.');
      tips.push('Keep your room cool (60-67°F is ideal).');
    } else if (tomorrowWorkout.type === 'tempo' || tomorrowWorkout.type === 'intervals') {
      targetHours = Math.max(targetHours, 8);
      reason = 'Hard workout tomorrow. Quality sleep improves performance.';
      tips.push('Aim for consistent sleep schedule.');
      tips.push('Limit caffeine after 2 PM.');
    } else if (tomorrowWorkout.type === 'rest') {
      reason = 'Rest day tomorrow. Use tonight to catch up on sleep if needed.';
      tips.push('Great opportunity to get extra rest.');
    }
  }

  // Account for sleep debt
  if (recentSleepHours && recentSleepHours < 7) {
    targetHours = Math.max(targetHours, 9);
    reason += ' You have recent sleep debt - aim for extra hours tonight.';
    tips.push('Prioritize catching up on sleep.');
    tips.push('Consider a short nap (20-30 min) if tired during the day.');
  }

  // General sleep hygiene tips
  if (tips.length < 3) {
    tips.push('Create a dark, quiet sleeping environment.');
    tips.push('Maintain a consistent sleep schedule.');
    tips.push('Avoid heavy meals close to bedtime.');
  }

  return {
    targetHours,
    reason,
    tips,
  };
}

/**
 * Get sleep advice based on recent sleep quality
 */
export function getSleepAdvice(averageHours: number, averageQuality: number): string[] {
  const advice: string[] = [];

  // Hours-based advice
  if (averageHours < 6) {
    advice.push('Critical: You\'re significantly under-sleeping.');
    advice.push('Sleep deprivation impairs recovery and increases injury risk.');
    advice.push('Make sleep your #1 priority this week.');
  } else if (averageHours < 7) {
    advice.push('You\'re not getting enough sleep for optimal training.');
    advice.push('Aim to increase sleep by 30-60 minutes per night.');
    advice.push('Try setting a bedtime alarm as a reminder.');
  } else if (averageHours < 8) {
    advice.push('Your sleep duration is decent but could be better.');
    advice.push('Try adding 15-30 more minutes per night.');
  } else {
    advice.push('Great sleep duration!');
    advice.push('Keep maintaining this consistent schedule.');
  }

  // Quality-based advice
  if (averageQuality < 2) {
    advice.push('Your sleep quality is poor.');
    advice.push('Consider factors: room temperature, noise, screen time before bed.');
    advice.push('Try a wind-down routine 30 minutes before sleep.');
  } else if (averageQuality < 3) {
    advice.push('Sleep quality could be improved.');
    advice.push('Focus on sleep hygiene: dark room, cool temp, no screens.');
  } else if (averageQuality >= 4) {
    advice.push('Excellent sleep quality!');
  }

  return advice;
}

/**
 * Get tips for better sleep
 */
export function getSleepHygieneTips(): string[] {
  return [
    'Keep your bedroom cool (60-67°F / 15-19°C)',
    'Make your room as dark as possible (blackout curtains, eye mask)',
    'Reduce noise (white noise machine, earplugs)',
    'Avoid screens 30-60 minutes before bed (blue light suppresses melatonin)',
    'Limit caffeine after 2 PM',
    'Avoid large meals 3 hours before bedtime',
    'Maintain consistent sleep/wake times, even on weekends',
    'Create a relaxing pre-bed routine (reading, stretching, meditation)',
    'Avoid alcohol before bed (impairs REM sleep)',
    'Exercise regularly, but not right before bed',
    'If you can\'t sleep after 20 min, get up and do a quiet activity',
    'Reserve your bed for sleep only (not work or TV)',
  ];
}

/**
 * Interpret sleep quality score
 */
export function interpretSleepQuality(score: 1 | 2 | 3 | 4 | 5): string {
  switch (score) {
    case 1:
      return 'Very Poor - Frequent waking, unable to fall asleep';
    case 2:
      return 'Poor - Restless, not refreshed in morning';
    case 3:
      return 'Fair - Some interruptions, mostly rested';
    case 4:
      return 'Good - Few interruptions, woke up refreshed';
    case 5:
      return 'Excellent - Uninterrupted, very well rested';
    default:
      return 'Unknown';
  }
}

/**
 * Calculate sleep debt over a period
 */
export function calculateSleepDebt(sleepHours: number[], targetHours: number = 8): {
  totalDebt: number;
  averageHours: number;
  needsRecovery: boolean;
} {
  if (sleepHours.length === 0) {
    return { totalDebt: 0, averageHours: 0, needsRecovery: false };
  }

  const total = sleepHours.reduce((sum, hours) => sum + hours, 0);
  const averageHours = total / sleepHours.length;
  const totalDebt = (targetHours * sleepHours.length) - total;
  const needsRecovery = totalDebt > 3; // More than 3 hours of debt

  return {
    totalDebt: Math.max(0, totalDebt),
    averageHours,
    needsRecovery,
  };
}
