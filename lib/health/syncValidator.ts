import { z } from 'zod'

/**
 * Health Connect Sync Validator
 * 
 * Validates aggregated daily health data from Android Health Connect
 * via the Companion App or TWA (Trusted Web Activity)
 */

// Sleep data schema
export const SleepSchema = z.object({
  totalMinutes: z.number().int().min(0).max(1440),
  deepMinutes: z.number().int().min(0).max(1440).optional(),
  remMinutes: z.number().int().min(0).max(1440).optional(),
  lightMinutes: z.number().int().min(0).max(1440).optional(),
  awakeMinutes: z.number().int().min(0).max(1440).optional(),
  score: z.number().min(0).max(100).optional(),
})

// Heart rate data schema
export const HeartRateSchema = z.object({
  resting: z.number().int().min(30).max(250).optional(),
  avg: z.number().int().min(30).max(250).optional(),
  hrvRmssd: z.number().min(0).max(200).optional(),
  zoneMinutes: z.record(z.string(), z.number().int().min(0)).optional(),
})

// Main health payload schema
export const HealthPayloadSchema = z.object({
  // Required date (YYYY-MM-DD)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  }),

  // Activity metrics
  steps: z.number().int().min(0).optional(),
  caloriesBurned: z.number().int().min(0).optional(),
  activeMinutes: z.number().int().min(0).max(1440).optional(),
  activeZoneMinutes: z.number().int().min(0).max(1440).optional(),
  distanceMeters: z.number().min(0).optional(),
  floorsClimbed: z.number().int().min(0).optional(),

  // Sleep data
  sleep: SleepSchema.optional(),

  // Heart rate data
  heartRate: HeartRateSchema.optional(),

  // Weight in kg
  weight: z.number().min(20).max(500).optional(),

  // SpO2 average (0-100%)
  spo2: z.number().min(50).max(100).optional(),
})

// Type inference for TypeScript
export type HealthPayload = z.infer<typeof HealthPayloadSchema>
export type SleepData = z.infer<typeof SleepSchema>
export type HeartRateData = z.infer<typeof HeartRateSchema>

/**
 * Calculate sleep score from sleep stages if not provided
 */
export function calculateSleepScore(sleep: SleepData): number {
  if (sleep.score) return sleep.score

  const total = sleep.totalMinutes
  const deep = sleep.deepMinutes ?? total * 0.15 // ~15% deep sleep is average
  const rem = sleep.remMinutes ?? total * 0.25  // ~25% REM is average

  // Quality scoring based on sleep composition
  const deepPercent = (deep / total) * 100
  const remPercent = (rem / total) * 100

  // Optimal ranges: Deep 15-25%, REM 20-30%
  const deepScore = Math.max(0, 100 - Math.abs(deepPercent - 20) * 4)
  const remScore = Math.max(0, 100 - Math.abs(remPercent - 25) * 4)

  // Duration score: 7-9 hours optimal
  const hours = total / 60
  const durationScore = hours >= 7 && hours <= 9
    ? 100
    : hours < 7
      ? (hours / 7) * 100
      : Math.max(0, 100 - (hours - 9) * 20)

  return Math.round((deepScore * 0.3 + remScore * 0.3 + durationScore * 0.4))
}

/**
 * Calculate HRV score from RMSSD value
 */
export function calculateHRVScore(hrvRmssd: number): number {
  // Typical HRV ranges: <20 (poor) to >80 (excellent) for RMSSD in ms
  if (hrvRmssd < 20) return 30
  if (hrvRmssd > 80) return 100
  
  // Linear interpolation between 20-80
  return Math.round(((hrvRmssd - 20) / 60) * 70 + 30)
}

/**
 * Convert activity zone minutes to HR zone minutes
 * Map Google's active zones to our HR zones
 */
export function convertZoneMinutes(
  zoneMinutes: Record<string, number> | undefined
): { hrZone1: number; hrZone2: number; hrZone3: number } {
  if (!zoneMinutes) {
    return { hrZone1: 0, hrZone2: 0, hrZone3: 0 }
  }

  // Google Health Connect zones:
  // FAT_BURN -> Zone 1/2
  // CARDIO -> Zone 2/3
  // PEAK -> Zone 4/5
  
  const fatBurn = zoneMinutes['FAT_BURN'] ?? 0
  const cardio = zoneMinutes['CARDIO'] ?? 0
  const peak = zoneMinutes['PEAK'] ?? 0

  return {
    hrZone1: Math.round(fatBurn * 0.6),
    hrZone2: Math.round(fatBurn * 0.4 + cardio * 0.7),
    hrZone3: Math.round(cardio * 0.3 + peak),
  }
}
