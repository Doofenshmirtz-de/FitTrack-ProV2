"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { DailySummary, Profile } from "@/types"
import { calculateRecoveryScore, calculateStrainScore } from "@/lib/calculations/recovery"
import { calculateTDEE, type UserProfile } from "@/lib/calculations/tdee"
import { useHealthRealtime } from "@/hooks/useHealthRealtime"

/**
 * Fetch today's daily summary
 */
async function fetchTodaySummary(): Promise<DailySummary | null> {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single()
  
  if (error && error.code !== "PGRST116") { // PGRST116 = not found
    console.error("Error fetching daily summary:", error)
    throw error
  }
  
  return data
}

/**
 * Fetch user profile
 */
async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  
  if (error) {
    console.error("Error fetching profile:", error)
    throw error
  }
  
  return data
}

/**
 * Fetch today's food logs
 */
async function fetchTodayFoodLogs(): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  
  const { data, error } = await supabase
    .from("food_logs")
    .select("calories, protein_g, carbs_g, fat_g")
    .eq("user_id", user.id)
    .gte("logged_at", `${today}T00:00:00Z`)
    .lte("logged_at", `${today}T23:59:59Z`)
  
  if (error) {
    console.error("Error fetching food logs:", error)
    throw error
  }
  
  return data.reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories || 0),
      protein: acc.protein + (log.protein_g || 0),
      carbs: acc.carbs + (log.carbs_g || 0),
      fat: acc.fat + (log.fat_g || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

/**
 * Fetch weekly averages for recovery calculation
 */
async function fetchWeeklyAverages(): Promise<{
  avgHrv: number
  avgSleepScore: number
}> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { avgHrv: 0, avgSleepScore: 50 }
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data, error } = await supabase
    .from("daily_summaries")
    .select("hrv_rmssd, sleep_score")
    .eq("user_id", user.id)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0])
    .not("hrv_rmssd", "is", null)
    .not("sleep_score", "is", null)
  
  if (error || !data || data.length === 0) {
    return { avgHrv: 0, avgSleepScore: 50 }
  }
  
  const validHrv = data.filter(d => d.hrv_rmssd !== null)
  const validSleep = data.filter(d => d.sleep_score !== null)
  
  return {
    avgHrv: validHrv.length > 0
      ? validHrv.reduce((sum, d) => sum + (d.hrv_rmssd || 0), 0) / validHrv.length
      : 0,
    avgSleepScore: validSleep.length > 0
      ? validSleep.reduce((sum, d) => sum + (d.sleep_score || 0), 0) / validSleep.length
      : 50,
  }
}

/**
 * Main dashboard data hook
 * Combines all necessary data for the dashboard
 */
export function useDashboardData() {
  // Enable realtime updates
  useHealthRealtime()
  
  // Fetch today's summary
  const summaryQuery = useQuery({
    queryKey: ["daily-summary", "today"],
    queryFn: fetchTodaySummary,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
  
  // Fetch profile
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
  
  // Fetch food logs
  const foodQuery = useQuery({
    queryKey: ["food-logs", "today"],
    queryFn: fetchTodayFoodLogs,
    staleTime: 1000 * 60, // 1 minute
  })
  
  // Fetch weekly averages (for recovery calculation)
  const weeklyQuery = useQuery({
    queryKey: ["weekly-averages"],
    queryFn: fetchWeeklyAverages,
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!summaryQuery.data, // Only fetch if we have summary data
  })
  
  // Calculate derived metrics
  const recovery = summaryQuery.data && weeklyQuery.data
    ? calculateRecoveryScore(summaryQuery.data, {
        avgHrv: weeklyQuery.data.avgHrv,
        avgSleepScore: weeklyQuery.data.avgSleepScore,
      })
    : { score: null, isEstimated: true }
  
  const strain = summaryQuery.data?.active_minutes
    ? calculateStrainScore(summaryQuery.data.active_minutes)
    : { score: null, level: "unknown" as const }
  
  const calorieTarget = profileQuery.data && summaryQuery.data
    ? calculateTDEE(
        {
          sex: profileQuery.data.sex || "male",
          weightKg: profileQuery.data.weight_kg || 70,
          heightCm: profileQuery.data.height_cm || 175,
          age: profileQuery.data.birth_date
            ? new Date().getFullYear() - new Date(profileQuery.data.birth_date).getFullYear()
            : 30,
        },
        {
          activeMinutes: summaryQuery.data.active_minutes || 0,
          caloriesBurned: summaryQuery.data.calories_burned || 0,
        }
      )
    : 2500 // Default fallback
  
  return {
    // Loading states
    isLoading: summaryQuery.isLoading || profileQuery.isLoading,
    isError: summaryQuery.isError || profileQuery.isError,
    
    // Raw data
    summary: summaryQuery.data,
    profile: profileQuery.data,
    food: foodQuery.data || { calories: 0, protein: 0, carbs: 0, fat: 0 },
    
    // Derived metrics
    recovery,
    strain,
    calorieTarget,
    
    // Refetch functions
    refetch: () => {
      summaryQuery.refetch()
      profileQuery.refetch()
      foodQuery.refetch()
    },
  }
}

/**
 * Hook for fetching historical data (charts)
 */
export function useHistoricalData(days: number = 7) {
  return useQuery({
    queryKey: ["historical-data", days],
    queryFn: async () => {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: true })
      
      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 30,
  })
}
