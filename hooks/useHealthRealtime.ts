"use client"

import { useEffect, useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

/**
 * Health Realtime Hook
 * 
 * Listens for broadcast events from the /api/health/sync endpoint
 * and invalidates relevant TanStack Query cache entries.
 * 
 * Usage:
 *   useHealthRealtime() // Auto-enabled when user is logged in
 */

export function useHealthRealtime() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const handleHealthUpdate = useCallback(
    (payload: {
      payload: {
        userId: string
        date: string
        summary: {
          steps?: number
          caloriesBurned?: number
          sleepScore?: number
          hrvScore?: number
        }
      }
    }) => {
      console.log("Health data updated:", payload)

      // Invalidate daily summary cache
      queryClient.invalidateQueries({
        queryKey: ["daily-summary", payload.payload.date],
      })

      // Invalidate dashboard data
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
      })

      // Invalidate health raw data
      queryClient.invalidateQueries({
        queryKey: ["health-raw"],
      })
    },
    [queryClient]
  )

  useEffect(() => {
    // Subscribe to health_updates channel
    const channel = supabase
      .channel("health_updates")
      .on(
        "broadcast",
        { event: "new_health_data" },
        handleHealthUpdate
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Connected to health updates")
        }
        if (status === "CHANNEL_ERROR") {
          console.error("Health updates connection error")
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [supabase, handleHealthUpdate])
}

/**
 * Hook to get current subscription status
 * Useful for showing connection state in UI
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting")

  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel("health_updates")
      .subscribe((state) => {
        if (state === "SUBSCRIBED") {
          setStatus("connected")
        } else if (state === "CHANNEL_ERROR") {
          setStatus("error")
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return status
}
