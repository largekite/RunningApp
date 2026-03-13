// Core Data Types for 50-Mile Training App

export type WorkoutType =
  | 'easy_run' | 'long_run' | 'tempo' | 'intervals' | 'recovery'
  | 'rest' | 'strides' | 'fartlek' | 'hill_repeats' | 'cross_training'
  | 'benchmark';

export type InjurySeverity = 'mild' | 'moderate' | 'severe';
export type BodyPart = 'knee' | 'hip' | 'ankle' | 'shin' | 'foot' | 'calf' | 'hamstring' | 'quad' | 'back' | 'it_band' | 'plantar' | 'other';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type Units = 'miles' | 'km';
export type RPE = 1 | 2 | 3 | 4 | 5; // Rate of Perceived Exertion
export type QualityScore = 1 | 2 | 3 | 4 | 5;
export type HRZone = 1 | 2 | 3 | 4 | 5;
export type RacePriority = 'A' | 'B' | 'C';

// Shoe Tracking
export interface RunningShoe {
  id: string;
  name: string;
  brand?: string;
  startingMiles: number;
  maxMiles: number;
  purchaseDate?: string;
  retired: boolean;
  notes?: string;
}

// Heart Rate Zone info
export interface HRZoneInfo {
  zone: HRZone;
  name: string;          // e.g. 'Recovery', 'Aerobic', 'Tempo', 'Threshold', 'VO2max'
  minBpm: number;
  maxBpm: number;
  color: string;
  description: string;
}

// Hydration
export interface HydrationEntry {
  id: string;
  time: string;      // ISO timestamp
  amountMl: number;
}

export interface HydrationLog {
  date: string;             // YYYY-MM-DD
  entries: HydrationEntry[];
  goalMl: number;
}

// Body Weight
export interface BodyWeightEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  weightKg: number;
  notes?: string;
}

// Saved Routes
export interface RouteCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface SavedRoute {
  id: string;
  name: string;
  coordinates: RouteCoordinate[];
  distanceMiles: number;
  elevationGainFt: number;
  createdAt: string;
  notes?: string;
}

// Race Events (multiple goal races)
export interface RaceEvent {
  id: string;
  name: string;
  date: string;           // YYYY-MM-DD
  distance: number;       // miles
  priority: RacePriority; // A = goal race, B = tune-up, C = for fun
  notes?: string;
}

// Benchmark / Time Trial Results
export interface BenchmarkResult {
  id: string;
  date: string;           // YYYY-MM-DD
  distanceMiles: number;  // e.g. 1.0, 3.1 (5K), 6.2 (10K)
  durationMinutes: number;
  pacePerMile: string;    // min:sec
  notes?: string;
}

// Training Plan Interfaces
export interface TrainingPlan {
  id: string;
  goalDistance: number;
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
  focus: string;
  workouts: DailyWorkout[];
}

export interface WorkoutSegment {
  name: string;
  distance?: number;
  duration?: number;
  pace?: string;
  description: string;
}

export interface DailyWorkout {
  id: string;
  date: string;
  type: WorkoutType;
  targetDistance?: number;
  targetPace?: string;
  targetDuration?: number;
  notes?: string;
  segments?: WorkoutSegment[];
  modified?: boolean;
  modificationReason?: string;
}

// Activity Check-In Interface
export interface ActivityCheckIn {
  id: string;
  date: string;
  workoutId: string;
  completed: boolean;
  actualDistance?: number;
  actualDuration?: number;
  actualPace?: string;
  perceivedEffort?: RPE;
  notes?: string;
  shoeId?: string;
  // Heart rate
  avgHR?: number;
  maxHR?: number;
  hrZone?: HRZone;
  // Elevation
  elevationGainFt?: number;
  elevationLossFt?: number;
  // Sleep tracking
  sleepHours?: number;
  sleepQuality?: QualityScore;
  // Nutrition tracking
  nutritionScore?: QualityScore;
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
  goalFinishTime?: string;
  maxHR?: number;       // bpm — for HR zone calculation
  restingHR?: number;   // bpm — for HR reserve method
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  units: Units;
  startDay: number;
  notificationsEnabled: boolean;
  reminderTime?: string;
  healthSyncEnabled?: boolean;
  stravaConnected?: boolean;
}

// Nutrition Tip Interface
export interface NutritionTip {
  id: string;
  workoutType: WorkoutType;
  title: string;
  description: string;
  timing?: string;
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
  completionRate: number;
  averagePace?: string;
  averageSleepHours?: number;
  averageSleepQuality?: number;
  averageNutritionScore?: number;
  averageRPE?: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  longestRun?: number;
}

// KStride session
export interface KStrideSession {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

// App State Interface (for Context)
export interface AppState {
  user: UserProfile | null;
  trainingPlan: TrainingPlan | null;
  checkIns: { [date: string]: ActivityCheckIn };
  injuries: InjuryLog[];
  shoes: RunningShoe[];
  hydrationLogs: { [date: string]: HydrationLog };
  bodyWeightEntries: BodyWeightEntry[];
  savedRoutes: SavedRoute[];
  raceEvents: RaceEvent[];
  benchmarkResults: BenchmarkResult[];
  kstrideSession: KStrideSession | null;
  currentDate: string;
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
  | { type: 'DELETE_CHECK_IN'; payload: string }
  | { type: 'SET_CHECK_INS'; payload: { [date: string]: ActivityCheckIn } }
  | { type: 'ADD_INJURY'; payload: InjuryLog }
  | { type: 'RESOLVE_INJURY'; payload: string }
  | { type: 'SET_INJURIES'; payload: InjuryLog[] }
  | { type: 'ADD_SHOE'; payload: RunningShoe }
  | { type: 'UPDATE_SHOE'; payload: RunningShoe }
  | { type: 'SET_SHOES'; payload: RunningShoe[] }
  // Hydration
  | { type: 'SET_HYDRATION_LOG'; payload: HydrationLog }
  | { type: 'SET_HYDRATION_LOGS'; payload: { [date: string]: HydrationLog } }
  // Body weight
  | { type: 'ADD_BODY_WEIGHT'; payload: BodyWeightEntry }
  | { type: 'SET_BODY_WEIGHTS'; payload: BodyWeightEntry[] }
  // Routes
  | { type: 'ADD_ROUTE'; payload: SavedRoute }
  | { type: 'DELETE_ROUTE'; payload: string }
  | { type: 'SET_ROUTES'; payload: SavedRoute[] }
  // Race events
  | { type: 'ADD_RACE_EVENT'; payload: RaceEvent }
  | { type: 'UPDATE_RACE_EVENT'; payload: RaceEvent }
  | { type: 'DELETE_RACE_EVENT'; payload: string }
  | { type: 'SET_RACE_EVENTS'; payload: RaceEvent[] }
  // Benchmarks
  | { type: 'ADD_BENCHMARK'; payload: BenchmarkResult }
  | { type: 'DELETE_BENCHMARK'; payload: string }
  | { type: 'SET_BENCHMARKS'; payload: BenchmarkResult[] }
  // KStride
  | { type: 'SET_KSTRIDE_SESSION'; payload: KStrideSession | null }
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
  currentStreak: number;
  injuryFreeDays: number;
  personalRecords: PersonalRecords;
}

export interface PersonalRecords {
  fastest5K?: { pace: string; date: string };
  fastest10K?: { pace: string; date: string };
  fastestHalfMarathon?: { pace: string; date: string };
  longestRun?: { distance: number; date: string };
}

// Injury Tracking
export interface InjuryLog {
  id: string;
  date: string;
  bodyPart: BodyPart;
  severity: InjurySeverity;
  description?: string;
  resolved: boolean;
  resolvedDate?: string;
}

// Navigation Types (for React Navigation)
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  CheckIn: {
    workout: DailyWorkout;
    prefill?: {
      distance: string;
      duration: string;
      pace: string;
      elevationGainFt?: number;
      elevationLossFt?: number;
    };
  };
  WorkoutDetail: { workout: DailyWorkout; checkIn?: ActivityCheckIn };
  Injuries: undefined;
  Shoes: undefined;
  TrainingLoad: undefined;
  Strength: { workoutType?: WorkoutType };
  RaceCalendar: undefined;
  Hydration: undefined;
  Benchmark: undefined;
  BodyWeight: undefined;
  PRDashboard: undefined;
  SavedRoutes: undefined;
  LiveRun: { workout: DailyWorkout };
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Progress: undefined;
  Stats: undefined;
  Settings: undefined;
};
