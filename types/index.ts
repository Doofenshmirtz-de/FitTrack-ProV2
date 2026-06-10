// ============================================================
// FitTrack Pro - TypeScript Types
// ============================================================

// ============================================================
// Muscle Groups
// ============================================================
export const MUSCLE_GROUPS = [
  'chest',           // Brust
  'shoulders',       // Schultern
  'biceps',          // Bizeps
  'triceps',         // Trizeps
  'forearms',        // Unterarme
  'abs',             // Bauch
  'obliques',        // Schräger Bauch
  'upper_back',      // Oberer Rücken
  'lower_back',      // Unterer Rücken
  'lats',            // Latissimus
  'glutes',          // Gesäß
  'quads',           // Quadrizeps
  'hamstrings',      // Beinbizeps
  'calves',          // Waden
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export type MuscleStatus = 
  | 'neglected'      // >7 days no training
  | 'recovering'     // 1-2 days + high volume
  | 'fresh'          // 3-5 days since training
  | 'trained_light'  // 1-2 days + low volume
  | 'trained_heavy'; // Today

// ============================================================
// Database Types
// ============================================================
export interface Profile {
  id: string;
  display_name: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  birth_date: string | null; // ISO date
  sex: 'male' | 'female' | 'other' | null;
  fitness_goal: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'endurance' | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  health_connect_enabled: boolean;
  health_connect_last_sync: string | null; // ISO timestamp
  calorie_target_override: number | null;
  protein_target_g: number | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string; // ISO date
  // Activity
  steps: number | null;
  calories_burned: number | null;
  active_minutes: number | null;
  distance_km: number | null;
  floors_climbed: number | null;
  // Sleep
  sleep_minutes_total: number | null;
  sleep_minutes_deep: number | null;
  sleep_minutes_rem: number | null;
  sleep_minutes_light: number | null;
  sleep_minutes_awake: number | null;
  sleep_score: number | null; // 0-100
  sleep_start: string | null; // TIME
  sleep_end: string | null; // TIME
  // Heart rate
  resting_heart_rate: number | null;
  hrv_rmssd: number | null;
  hrv_score: number | null; // 0-100
  // Zones
  hr_zone_1_minutes: number | null;
  hr_zone_2_minutes: number | null;
  hr_zone_3_minutes: number | null;
  // Other
  spo2_avg: number | null;
  weight_kg: number | null;
  created_at: string;
  updated_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  logged_at: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  brand_name: string | null;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  barcode: string | null;
  openfoodfacts_id: string | null;
  photo_url: string | null;
  ai_estimated: boolean;
  ai_confidence: number | null;
  notes: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  name_de: string | null;
  category: 'strength' | 'cardio' | 'flexibility' | 'plyometric';
  equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands' | 'other' | null;
  muscle_primary: MuscleGroup[];
  muscle_secondary: MuscleGroup[];
  force_type: 'push' | 'pull' | 'static' | 'hinge' | 'squat' | null;
  instructions: string | null;
  video_url: string | null;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Program {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  duration_weeks: number | null;
  days_per_week: number | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  goal: 'hypertrophy' | 'strength' | 'endurance' | 'general' | null;
  is_active: boolean;
  is_template: boolean;
  is_recovery_week: boolean;
  created_at: string;
}

export interface ProgramDay {
  id: string;
  program_id: string;
  day_number: number;
  name: string | null;
  is_rest_day: boolean;
  sort_order: number;
}

export interface ProgramDayExercise {
  id: string;
  program_day_id: string;
  exercise_id: string;
  sets_target: number | null;
  reps_target: string | null;
  rest_seconds: number | null;
  weight_note: string | null;
  superset_group: number | null;
  sort_order: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  program_id: string | null;
  program_day_id: string | null;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  notes: string | null;
  rpe_overall: number | null; // 1-10
  total_volume_kg: number | null;
  health_strain: number | null;
  location: 'gym' | 'home' | 'outdoor' | 'other' | null;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  distance_m: number | null;
  rpe: number | null; // 0-10
  is_warmup: boolean;
  is_dropset: boolean;
  is_pr: boolean;
  recorded_at: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  pr_type: '1rm' | 'max_reps' | 'max_volume';
  value: number;
  achieved_at: string;
  set_id: string | null;
}

export interface AIConversation {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system_daily';
  content: string;
  context_snapshot: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// Workout Store Types
// ============================================================
export interface ExerciseSet {
  id: string; // Temp UUID for local tracking
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup: boolean;
  isCompleted: boolean;
}

export interface ActiveExercise {
  exerciseId: string;
  name: string;
  sets: ExerciseSet[];
}

export type WorkoutStatus = 'IDLE' | 'ACTIVE' | 'RESTING' | 'COMPLETING';

// ============================================================
// Health Connect Types
// ============================================================
export interface HealthPayload {
  date: string; // YYYY-MM-DD
  steps?: number;
  caloriesBurned?: number;
  activeMinutes?: number;
  activeZoneMinutes?: number;
  sleep?: {
    totalMinutes: number;
    deepMinutes?: number;
    remMinutes?: number;
    lightMinutes?: number;
    awakeMinutes?: number;
    score?: number; // 0-100
  };
  heartRate?: {
    resting?: number;
    avg?: number;
    hrvRmssd?: number;
    zoneMinutes?: Record<string, number>;
  };
  weight?: number;
}

// ============================================================
// AI Context Types
// ============================================================
export interface AnonymizedAIContext {
  todayMetrics: {
    caloriesConsumed: number;
    caloriesTarget: number;
    caloriesBurned: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    stepsToday: number;
    activeMinutes: number;
    sleepHours: number;
    sleepScore: number;
    restingHeartRate: number;
    hrvMorning: number;
    recoveryScore: number;
    todayMeals: string[];
  };
  weeklyTrends: {
    avgCaloriesConsumed: number;
    avgProteinG: number;
    workoutsCompleted: number;
    totalVolumeKg: number;
    muscleGroupFrequency: Record<string, number>;
    avgSleepHours: number;
    avgHrv: number;
    weightTrendKg: number;
  };
  userProfile: {
    heightCm: number;
    weightKg: number;
    age: number;
    fitnessGoal: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'endurance';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  };
  recentTraining: {
    lastWorkoutDaysAgo: number;
    muscleGroupsLastWeek: string[];
    strongestLiftLastWeek: { exerciseName: string; weightKg: number; reps: number } | null;
    estimatedTdee: number;
  };
}

// ============================================================
// Food Vision Types
// ============================================================
export interface FoodVisionResult {
  items: {
    name: string;
    confidence: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    portion_description: string;
  }[];
}

// ============================================================
// Open Food Facts Types
// ============================================================
export interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_de?: string;
  brands: string | null;
  _id: string;
  id?: string;
  image_url?: string;
  image_front_small_url?: string;
  image_front_url?: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    'energy_100g'?: number;
    'proteins_100g'?: number;
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
    'fiber_100g'?: number;
    'sugars_100g'?: number;
    'sodium_100g'?: number;
  };
}

// ============================================================
// Offline Queue Types
// ============================================================
export interface PendingOperation {
  id?: number;
  type: 'food_log' | 'workout_set' | 'workout_session';
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

// ============================================================
// Recovery Score
// ============================================================
export interface RecoveryScoreResult {
  score: number;
  isEstimated: boolean;
}

export interface WeeklyAvg {
  avgSleepScore?: number | null;
  avgHrv?: number | null;
}
