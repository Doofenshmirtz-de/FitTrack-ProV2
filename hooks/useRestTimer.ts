"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorkoutStore } from '@/stores/workoutStore'

interface RestTimerState {
  remainingSeconds: number
  isActive: boolean
  progress: number // 0-100
}

/**
 * Rest Timer Hook
 * 
 * Manages rest time between sets with:
 * - Countdown display
 * - Background timer (works when tab is inactive)
 * - Push notification when timer expires
 * 
 * Usage:
 *   const { remainingSeconds, isActive, progress } = useRestTimer()
 */
export function useRestTimer(): RestTimerState {
  const currentRestEndsAt = useWorkoutStore(state => state.currentRestEndsAt)
  const status = useWorkoutStore(state => state.status)
  const skipRest = useWorkoutStore(state => state.skipRest)
  
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [totalRestSeconds, setTotalRestSeconds] = useState(0)
  const notificationSent = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate remaining time
  useEffect(() => {
    if (!currentRestEndsAt || status !== 'RESTING') {
      setRemainingSeconds(0)
      notificationSent.current = false
      return
    }

    const calculateRemaining = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((currentRestEndsAt - now) / 1000))
      
      setRemainingSeconds(remaining)
      
      // Store initial rest duration for progress calculation
      if (totalRestSeconds === 0 && remaining > 0) {
        setTotalRestSeconds(remaining)
      }

      // Timer expired
      if (remaining === 0 && !notificationSent.current) {
        notificationSent.current = true
        sendTimerNotification()
        // Auto-skip rest after expiration
        setTimeout(() => skipRest(), 1000)
      }

      return remaining
    }

    // Initial calculation
    calculateRemaining()

    // Set up interval
    timerRef.current = setInterval(calculateRemaining, 100)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentRestEndsAt, status, skipRest, totalRestSeconds])

  // Reset total seconds when rest starts
  useEffect(() => {
    if (status === 'RESTING' && currentRestEndsAt) {
      const initialRemaining = Math.ceil((currentRestEndsAt - Date.now()) / 1000)
      if (initialRemaining > 0) {
        setTotalRestSeconds(initialRemaining)
      }
    } else {
      setTotalRestSeconds(0)
    }
  }, [status, currentRestEndsAt])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const sendTimerNotification = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FitTrack Pro', {
        body: 'Pause beendet - bereit für den nächsten Satz!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'rest-timer',
        requireInteraction: false,
      })
    }
    
    // Also try to play a sound if available
    try {
      const audio = new Audio('/sounds/timer-complete.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {
        // Ignore audio play errors (e.g., user hasn't interacted)
      })
    } catch {
      // Audio not supported
    }
  }, [])

  // Calculate progress (0-100)
  const progress = totalRestSeconds > 0 
    ? ((totalRestSeconds - remainingSeconds) / totalRestSeconds) * 100 
    : 0

  return {
    remainingSeconds,
    isActive: status === 'RESTING' && remainingSeconds > 0,
    progress: Math.min(100, Math.max(0, progress)),
  }
}

/**
 * Format seconds to MM:SS
 */
export function formatRestTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Preset rest times based on training type
 */
export const REST_PRESETS = {
  strength: 180,    // 3 min - heavy compound lifts
  hypertrophy: 90,  // 1.5 min - moderate weight
  endurance: 60,    // 1 min - lighter weight, higher reps
  dropset: 30,      // 30 sec - minimal rest for dropsets
  warmup: 60,       // 1 min - between warmups
} as const

export type RestPresetKey = keyof typeof REST_PRESETS