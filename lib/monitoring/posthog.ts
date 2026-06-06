import posthog from 'posthog-js'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com'

export function initPostHog() {
  if (typeof window === 'undefined') return
  if (!POSTHOG_KEY) {
    console.warn('[PostHog] No API key provided')
    return
  }

  // Only initialize in production or if explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ENABLE_POSTHOG_DEV) {
    return
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false, // We capture manually for better control
    capture_pageleave: true,
    
    // Disable autocapture for privacy (manual event tracking only)
    autocapture: false,
    
    // GDPR compliance
    opt_out_capturing_by_default: false,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug()
      }
    },
  })
}

export function captureEvent(
  eventName: string, 
  properties?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.capture(eventName, properties)
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.identify(userId, traits)
}

export function resetUser() {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.reset()
}

export function capturePageView(url?: string) {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.capture('$pageview', {
    $current_url: url || window.location.href,
  })
}

// Pre-defined events for FitTrack Pro
export const AnalyticsEvents = {
  // Auth
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Workouts
  WORKOUT_STARTED: 'workout_started',
  WORKOUT_COMPLETED: 'workout_completed',
  WORKOUT_CANCELLED: 'workout_cancelled',
  EXERCISE_ADDED: 'exercise_added',
  SET_LOGGED: 'set_logged',
  
  // Nutrition
  FOOD_LOGGED: 'food_logged',
  BARCODE_SCANNED: 'barcode_scanned',
  FOOD_SEARCHED: 'food_searched',
  
  // AI Coach
  COACH_MESSAGE_SENT: 'coach_message_sent',
  COACH_CONTEXT_USED: 'coach_context_used',
  
  // Health
  HEALTH_SYNC_COMPLETED: 'health_sync_completed',
  
  // App
  OFFLINE_MODE_ENTERED: 'offline_mode_entered',
  SYNC_COMPLETED: 'sync_completed',
  LANGUAGE_CHANGED: 'language_changed',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
  SYNC_FAILED: 'sync_failed',
} as const

export type AnalyticsEventType = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]
