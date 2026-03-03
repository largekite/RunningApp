// Core Data Types for 50-Mile Training App

export type WorkoutType = 'easy_run' | 'long_run' | 'tempo' | 'intervals' | 'recovery' | 'rest' | 'strides' | 'fartlek' | 'hill_repeats' | 'cross_training';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Units = 'miles' | 'km';
export type RPE = 1 | 2 | 3 | 4 | 5; // Rate of Perceived Exertion
export type QualityScore = 1 | 2 | 3 | 4 | 5;

// Training Plan Interfaces
export interface TrainingPlan {
  id: string;
  goalDistance: number; // 50 miles for ultramarathon
  startDate: string;
  raceDate: string;
  currentWeek: number;
  totalWeeks: number;
  baseWeeklyMileage: number;
  peakWeeklyMileage: number;
  weeks: WeeklyPlan[];
}

export interface WeeklyPlan {
  weekNumber: number;
  totalMileage: number;
  focus: string; // e.g., "Base Building", "Peak Week", "Taper"
  workouts: DailyWorkout[];
}

export interface WorkoutSegment {
  name: string;         // e.g., 'Warm-up', 'Main Set', 'Cool-down'
  distance?: number;    // miles
  duration?: number;    // minutes
  pace?: string;        // target pace (min:sec per mile)
  description: string;  // what to do
}

export interface DailyWorkout {
  id: string;
  date: string; // ISO date string
  type: WorkoutType;
  targetDistance?: number; // in miles or km
  targetPace?: string; // e.g., "8:30" (min:sec per mile)
  targetDuration?: number; // in minutes
  notes?: string;
  segments?: WorkoutSegment[]; // Structured warm-up / main set / cool-down breakdown
  modified?: boolean; // True if workout was adjusted by adaptive algorithm
  modificationReason?: string;
}

// Activity Check-In Interface
export interface ActivityCheckIn {
  id: string;
  date: string; // ISO date string
  workoutId: string;
  completed: boolean;
  actualDistance?: number;
  actualDuration?: number; // in minutes
  actualPace?: string; // calculated average pace
  perceivedEffort?: RPE; // 1-5 scale
  notes?: string;
  // Sleep tracking
  sleepHours?: number;
  sleepQuality?: QualityScore; // 1-5 scale
  // Nutrition tracking
  nutritionScore?: QualityScore; // 1-5 scale
  nutritionNotes?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// User Profile Interface
export interface UserProfile {
  id: string;
  name: string;
  experienceLevel: ExperienceLevel;
  currentWeeklyMileage: number;
  longestRun: number;
  goalFinishTime?: string; // e.g., "3:45:00" — target race finish time
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  units: Units;
  startDay: number; // 0 = Sunday, 1 = Monday, etc.
  notificationsEnabled: boolean;
  reminderTime?: string; // e.g., "07:00"
}

// Nutrition Tip Interface
export interface NutritionTip {
  id: string;
  workoutType: WorkoutType;
  title: string;
  description: string;
  timing?: string; // e.g., "2-3 hours before", "within 30 min after"
  recommendations?: string[];
}

// Sleep Recommendation Interface
export interface SleepRecommendation {
  targetHours: number;
  reason: string;
  tips?: string[];
}

// Weekly Summary Stats
export interface WeeklySummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalPlannedMiles: number;
  totalActualMiles: number;
  completionRate: number; // percentage 0-100
  averagePace?: string;
  averageSleepHours?: number;
  averageSleepQuality?: number;
  averageNutritionScore?: number;
  averageRPE?: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  longestRun?: number;
}

// App State Interface (for Context)
export interface AppState {
  user: UserProfile | null;
  trainingPlan: TrainingPlan | null;
  checkIns: { [date: string]: ActivityCheckIn }; // Keyed by date string
  currentDate: string; // ISO date string for "today"
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}

// Action Types for State Management
export type AppAction =
  | { type: 'SET_USER'; payload: UserProfile }
  | { type: 'UPDATE_USER'; payload: Partial<UserProfile> }
  | { type: 'SET_TRAINING_PLAN'; payload: TrainingPlan }
  | { type: 'UPDATE_TRAINING_PLAN'; payload: Partial<TrainingPlan> }
  | { type: 'ADD_CHECK_IN'; payload: ActivityCheckIn }
  | { type: 'UPDATE_CHECK_IN'; payload: { date: string; checkIn: Partial<ActivityCheckIn> } }
  | { type: 'DELETE_CHECK_IN'; payload: string } // date string
  | { type: 'SET_CHECK_INS'; payload: { [date: string]: ActivityCheckIn } }
  | { type: 'SET_CURRENT_DATE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_APP' };

// Adaptation Algorithm Input
export interface AdaptationInput {
  plannedWorkout: DailyWorkout;
  recentCheckIns: ActivityCheckIn[];
  currentWeek: number;
  totalWeeks: number;
  weeklyMileage: number[];
}

// Adaptation Algorithm Output
export interface AdaptationResult {
  adjustedWorkout: DailyWorkout;
  reason?: string;
  recommendations?: string[];
}

// Progress Stats
export interface ProgressStats {
  totalWeeksCompleted: number;
  totalMilesRun: number;
  longestRunToDate: number;
  averageWeeklyMileage: number;
  totalWorkoutsCompleted: number;
  totalWorkoutsPlanned: number;
  overallCompletionRate: number;
  currentStreak: number; // consecutive days with check-ins
  injuryFreeDays: number;
  personalRecords: PersonalRecords;
}

export interface PersonalRecords {
  fastest5K?: { pace: string; date: string };
  fastest10K?: { pace: string; date: string };
  fastestHalfMarathon?: { pace: string; date: string };
  longestRun?: { distance: number; date: string };
}

// Navigation Types (for React Navigation)
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  CheckIn: { workout: DailyWorkout };
  WorkoutDetail: { workout: DailyWorkout; checkIn?: ActivityCheckIn };
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Progress: undefined;
  Settings: undefined;
};
