"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorkoutStore } from '@/stores/workoutStore'

const WORKOUT_CHANNEL = 'fittrack_workout_sync'
const HEARTBEAT_INTERVAL = 5000
const LOCK_TIMEOUT = 6000

interface WorkoutMessage {
  type: 'WORKOUT_STARTED' | 'WORKOUT_ACTIVE' | 'WORKOUT_ENDED'
  sessionId?: string
  timestamp: number
}

/**
 * Prevents multiple workout sessions across tabs using BroadcastChannel
 * 
 * Usage:
 *   const isLocked = useWorkoutLock(isWorkoutActive)
 *   
 *   if (isLockedByOtherTab) {
 *     return <BlockModal />
 *   }
 */
export function useWorkoutLock(isActive: boolean): boolean {
  const [isLockedByOtherTab, setIsLockedByOtherTab] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageTime = useRef<number>(0)
  const sessionId = useWorkoutStore(state => state.sessionId)

  const clearTimers = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    // Check for BroadcastChannel support
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      console.warn('BroadcastChannel not supported, multi-tab lock disabled')
      return
    }

    // Create channel
    const channel = new BroadcastChannel(WORKOUT_CHANNEL)
    channelRef.current = channel

    if (isActive && sessionId) {
      // This tab is active - send heartbeat
      channel.postMessage({
        type: 'WORKOUT_STARTED',
        sessionId,
        timestamp: Date.now(),
      } as WorkoutMessage)

      heartbeatRef.current = setInterval(() => {
        channel.postMessage({
          type: 'WORKOUT_ACTIVE',
          sessionId,
          timestamp: Date.now(),
        } as WorkoutMessage)
      }, HEARTBEAT_INTERVAL)

      return () => {
        clearTimers()
        channel.postMessage({
          type: 'WORKOUT_ENDED',
          timestamp: Date.now(),
        } as WorkoutMessage)
        channel.close()
      }
    } else {
      // This tab is inactive - listen for other tabs
      channel.onmessage = (event: MessageEvent<WorkoutMessage>) => {
        const { data } = event
        
        if (data.type === 'WORKOUT_STARTED' || data.type === 'WORKOUT_ACTIVE') {
          // Another tab has an active workout
          if (data.sessionId && data.sessionId !== sessionId) {
            setIsLockedByOtherTab(true)
            lastMessageTime.current = Date.now()

            // Reset timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }

            // Auto-release lock if no heartbeat received
            timeoutRef.current = setTimeout(() => {
              const timeSinceLastMessage = Date.now() - lastMessageTime.current
              if (timeSinceLastMessage >= LOCK_TIMEOUT) {
                setIsLockedByOtherTab(false)
              }
            }, LOCK_TIMEOUT + 1000)
          }
        }

        if (data.type === 'WORKOUT_ENDED') {
          setIsLockedByOtherTab(false)
          clearTimers()
        }
      }

      return () => {
        clearTimers()
        channel.close()
      }
    }
  }, [isActive, sessionId, clearTimers])

  return isLockedByOtherTab
}

/**
 * Hook to check if we should resume a persisted workout
 * Called on app startup
 */
export function useCheckPersistedWorkout(): {
  hasPersistedWorkout: boolean
  resumeWorkout: () => void
  discardWorkout: () => void
} {
  const [hasPersistedWorkout, setHasPersistedWorkout] = useState(false)
  
  const status = useWorkoutStore(state => state.status)
  const exercises = useWorkoutStore(state => state.exercises)
  const reset = useWorkoutStore(state => state.reset)

  useEffect(() => {
    // Check if there's a persisted workout that's not completed
    const isPersisted = status !== 'IDLE' && exercises.length > 0
    setHasPersistedWorkout(isPersisted)
  }, [status, exercises])

  const resumeWorkout = useCallback(() => {
    // Workout is already loaded from persistence
    setHasPersistedWorkout(false)
  }, [])

  const discardWorkout = useCallback(() => {
    reset()
    setHasPersistedWorkout(false)
  }, [reset])

  return {
    hasPersistedWorkout,
    resumeWorkout,
    discardWorkout,
  }
}