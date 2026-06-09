// Type definitions for Supabase query results
type Profile = {
  birth_date?: string | null;
  sex?: 'male' | 'female' | 'other' | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  calorie_target_override?: number | null;
  fitness_goal?: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'endurance' | null;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
};

type FoodLog = {
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  logged_at?: string;
};

type DailySummary = {
  calories_burned?: number | null;
  steps?: number | null;
  sleep_minutes_total?: number | null;
  sleep_score?: number | null;
  active_minutes?: number | null;
  hrv_rmssd?: number | null;
  hrv_score?: number | null;
  resting_heart_rate?: number | null;
};

type WorkoutSet = {
  weight_kg?: number | null;
  reps?: number | null;
};

type WorkoutSession = {
  started_at?: string;
  total_volume_kg?: number | null;
  workout_sets?: WorkoutSet[];
};

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
    strongestLiftLastWeek: {
      exerciseName: string;
      weightKg: number;
      reps: number;
    } | null;
    estimatedTdee: number;
  };
}

/**
 * AI Context Builder for Edge Functions
 */
export async function buildAnonymizedContext(supabase: any, userId: string): Promise<AnonymizedAIContext> {
  const today = new Date().toISOString().split("T")[0];
  
  // Fetch today's daily summary
  const { data: dailySummaryRaw } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  // Fetch today's food logs
  const { data: foodLogsRaw } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("logged_at", `${today}T00:00:00Z`)
    .lte("logged_at", `${today}T23:59:59Z`);

  // Fetch profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Fetch last 7 days summaries
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: weeklySummariesRaw } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  // Fetch recent workouts
  const { data: recentWorkoutsRaw } = await supabase
    .from("workout_sessions")
    .select("*, workout_sets(*)")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(7);

  const dailySummary = dailySummaryRaw as DailySummary | null;
  const foodLogs = foodLogsRaw as FoodLog[] | null;
  const profile = profileRaw as Profile | null;
  const weeklySummaries = weeklySummariesRaw as DailySummary[] | null;
  const recentWorkouts = recentWorkoutsRaw as WorkoutSession[] | null;

  const age = profile?.birth_date
    ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
    : 30;

  const todaysMacros = foodLogs?.reduce(
    (acc: any, log: FoodLog) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein_g || 0),
      carbs: acc.carbs + (log.carbs_g || 0),
      fat: acc.fat + (log.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const weeklyCalories = weeklySummaries?.length
    ? weeklySummaries.reduce((sum: number, d: DailySummary) => sum + (d.calories_burned || 0), 0) / weeklySummaries.length
    : 0;

  const weeklyProtein = foodLogs?.length
    ? foodLogs.reduce((sum: number, log: FoodLog) => sum + (log.protein_g || 0), 0) / 7
    : 0;

  const workoutsThisWeek = recentWorkouts?.filter(
    (w: WorkoutSession) => w.started_at && new Date(w.started_at) > sevenDaysAgo
  ).length || 0;

  const totalVolumeKg = recentWorkouts?.reduce(
    (sum: number, w: WorkoutSession) => sum + (w.total_volume_kg || 0),
    0
  ) || 0;

  const muscleFrequency: Record<string, number> = {};

  const lastWorkout = recentWorkouts?.[0];
  const lastWorkoutDaysAgo = lastWorkout?.started_at
    ? Math.floor((Date.now() - new Date(lastWorkout.started_at).getTime()) / (1000 * 60 * 60 * 24))
    : -1;

  const bmr = profile?.sex === "female"
    ? 10 * (profile?.weight_kg || 70) + 6.25 * (profile?.height_cm || 175) - 5 * age - 161
    : 10 * (profile?.weight_kg || 70) + 6.25 * (profile?.height_cm || 175) - 5 * age + 5;
  
  const activityMultiplier = (dailySummary?.active_minutes || 0) > 60 ? 1.55 : 1.2;
  const estimatedTdee = Math.round(bmr * activityMultiplier + (dailySummary?.calories_burned || 0) * 0.1);

  return {
    todayMetrics: {
      caloriesConsumed: Math.round(todaysMacros.calories),
      caloriesTarget: profile?.calorie_target_override || estimatedTdee,
      caloriesBurned: dailySummary?.calories_burned || 0,
      proteinG: Math.round(todaysMacros.protein),
      carbsG: Math.round(todaysMacros.carbs),
      fatG: Math.round(todaysMacros.fat),
      stepsToday: dailySummary?.steps || 0,
      activeMinutes: dailySummary?.active_minutes || 0,
      sleepHours: dailySummary?.sleep_minutes_total ? dailySummary.sleep_minutes_total / 60 : 0,
      sleepScore: dailySummary?.sleep_score || 50,
      restingHeartRate: dailySummary?.resting_heart_rate || 60,
      hrvMorning: dailySummary?.hrv_rmssd || 50,
      recoveryScore: dailySummary?.hrv_score || 50,
    },
    weeklyTrends: {
      avgCaloriesConsumed: Math.round(weeklyCalories),
      avgProteinG: Math.round(weeklyProtein),
      workoutsCompleted: workoutsThisWeek,
      totalVolumeKg: Math.round(totalVolumeKg),
      muscleGroupFrequency: muscleFrequency,
      avgSleepHours: weeklySummaries?.length
        ? weeklySummaries.reduce((sum: number, d: DailySummary) => sum + (d.sleep_minutes_total || 0), 0) / weeklySummaries.length / 60
        : 0,
      avgHrv: weeklySummaries?.length
        ? weeklySummaries.reduce((sum: number, d: DailySummary) => sum + (d.hrv_rmssd || 0), 0) / weeklySummaries.length
        : 0,
      weightTrendKg: 0,
    },
    userProfile: {
      heightCm: profile?.height_cm || 175,
      weightKg: profile?.weight_kg || 70,
      age: age,
      fitnessGoal: (profile?.fitness_goal || "maintenance") as any,
      activityLevel: (profile?.activity_level || "moderate") as any,
    },
    recentTraining: {
      lastWorkoutDaysAgo: lastWorkoutDaysAgo,
      muscleGroupsLastWeek: Object.keys(muscleFrequency),
      strongestLiftLastWeek: lastWorkout && lastWorkout.workout_sets && lastWorkout.workout_sets.length > 0
        ? {
            exerciseName: "Exercise",
            weightKg: Math.max(...lastWorkout.workout_sets.map((s: WorkoutSet) => s.weight_kg || 0)),
            reps: Math.max(...lastWorkout.workout_sets.map((s: WorkoutSet) => s.reps || 0)),
          }
        : null,
      estimatedTdee: estimatedTdee,
    },
  };
}
