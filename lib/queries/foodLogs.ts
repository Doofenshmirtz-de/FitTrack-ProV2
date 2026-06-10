"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { FoodLog } from "@/types"

/**
 * Fetch detailed food logs for today
 */
async function fetchTodayFoodLogsList(): Promise<FoodLog[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", user.id)
    .gte("logged_at", `${today}T00:00:00Z`)
    .lte("logged_at", `${today}T23:59:59Z`)
    .order("logged_at", { ascending: false })
  
  if (error) {
    console.error("Error fetching food logs list:", error)
    throw error
  }
  
  return data as FoodLog[]
}

/**
 * Hook to get today's food logs list
 */
export function useTodayFoodLogs() {
  return useQuery({
    queryKey: ["food-logs-list", "today"],
    queryFn: fetchTodayFoodLogsList,
    staleTime: 1000 * 60, // 1 minute
  })
}

/**
 * Delete a specific food log
 */
export function useDeleteFoodLog() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (logId: string) => {
      const { error } = await supabase
        .from("food_logs")
        .delete()
        .eq("id", logId)
      
      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate both the list and the dashboard summary so everything updates!
      queryClient.invalidateQueries({ queryKey: ["food-logs-list", "today"] })
      queryClient.invalidateQueries({ queryKey: ["food-logs", "today"] })
      queryClient.invalidateQueries({ queryKey: ["daily-summary", "today"] })
    },
  })
}
