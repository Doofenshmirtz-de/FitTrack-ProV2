import type { DailySummary, Profile, FoodLog } from "@/types"
import type { AnonymizedAIContext } from "@/types"
import { createClient } from "@/lib/supabase/server"

/**
 * AI Context Builder
 * 
 * Collects and anonymizes user data for AI Coach queries.
 * Removes all PII (Personally Identifiable Information) before sending to Gemini.
 * 
 * This function is called server-side only from /api/ai/chat
 */

export async function buildAnonymizedContext(userId: string): Promise<AnonymizedAIContext> {
  const supabase = await createClient()

  // Get today's date
  const today = new Date().toISOString().split("T")[0]
  
  // Fetch today's daily summary
  const { data: dailySummary } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single()

  // Fetch today's food logs
  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("logged_at", `${today}T00:00:00Z`)
    .lte("logged_at", `${today}T23:59:59Z`)

  // Fetch profile (needed for age calculation)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  // Fetch last 7 days summaries for weekly trends
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data: weeklySummaries } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", userId)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false })

  // Fetch recent workouts
  const { data: recentWorkouts } = await supabase
    .from("workout_sessions")
    .select("*, workout_sets(*)")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(7)

  // Calculate age from birth_date
  const age = profile?.birth_date
    ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
    : 30 // Default

  // Calculate today's totals from food logs
  const todaysMacros = foodLogs?.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein_g || 0),
      carbs: acc.carbs + (log.carbs_g || 0),
      fat: acc.fat + (log.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fat: 0 }

  // Calculate weekly averages
  const weeklyCalories = weeklySummaries?.length
    ? weeklySummaries.reduce((sum, d) => sum + (d.calories_burned || 0), 0) / weeklySummaries.length
    : 0

  const weeklySteps = weeklySummaries?.length
    ? weeklySummaries.reduce((sum, d) => sum + (d.steps || 0), 0) / weeklySummaries.length
    : 0

  const weeklyProtein = foodLogs?.length
    ? foodLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0) / 7
    : 0

  // Count workouts this week
  const workoutsThisWeek = recentWorkouts?.filter(
    w => new Date(w.started_at) > sevenDaysAgo
  ).length || 0

  // Calculate total volume this week
  const totalVolumeKg = recentWorkouts?.reduce(
    (sum, w) => sum + (w.total_volume_kg || 0),
    0
  ) || 0

  // Determine muscle group frequency
  const muscleFrequency: Record<string, number> = {}
  recentWorkouts?.forEach(workout => {
    workout.workout_sets?.forEach((set: any) => {
      // Note: We'd need to join with exercises table to get muscle groups
      // For now, simplified tracking
    })
  })

  // Find last workout days ago
  const lastWorkout = recentWorkouts?.[0]
  const lastWorkoutDaysAgo = lastWorkout
    ? Math.floor((Date.now() - new Date(lastWorkout.started_at).getTime()) / (1000 * 60 * 60 * 24))
    : -1

  // Calculate estimated TDEE (simplified)
  const bmr = profile?.sex === "female"
    ? 10 * (profile?.weight_kg || 70) + 6.25 * (profile?.height_cm || 175) - 5 * age - 161
    : 10 * (profile?.weight_kg || 70) + 6.25 * (profile?.height_cm || 175) - 5 * age + 5
  
  const activityMultiplier = (dailySummary?.active_minutes || 0) > 60 ? 1.55 : 1.2
  const estimatedTdee = Math.round(bmr * activityMultiplier + (dailySummary?.calories_burned || 0) * 0.1)

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
        ? weeklySummaries.reduce((sum, d) => sum + (d.sleep_minutes_total || 0), 0) / weeklySummaries.length / 60
        : 0,
      avgHrv: weeklySummaries?.length
        ? weeklySummaries.reduce((sum, d) => sum + (d.hrv_rmssd || 0), 0) / weeklySummaries.length
        : 0,
      weightTrendKg: 0, // Would require weight tracking over time
    },
    userProfile: {
      heightCm: profile?.height_cm || 175,
      weightKg: profile?.weight_kg || 70,
      age: age,
      fitnessGoal: (profile?.fitness_goal || "maintenance") as AnonymizedAIContext["userProfile"]["fitnessGoal"],
      activityLevel: (profile?.activity_level || "moderate") as AnonymizedAIContext["userProfile"]["activityLevel"],
    },
    recentTraining: {
      lastWorkoutDaysAgo: lastWorkoutDaysAgo,
      muscleGroupsLastWeek: Object.keys(muscleFrequency),
      strongestLiftLastWeek: lastWorkout && lastWorkout.workout_sets?.length > 0
        ? {
            exerciseName: "Exercise", // Would need exercise name lookup
            weightKg: Math.max(...lastWorkout.workout_sets.map((s: any) => s.weight_kg || 0)),
            reps: Math.max(...lastWorkout.workout_sets.map((s: any) => s.reps || 0)),
          }
        : null,
      estimatedTdee: estimatedTdee,
    },
  }
}