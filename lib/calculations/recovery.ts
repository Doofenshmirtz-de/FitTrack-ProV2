import type { DailySummary, RecoveryScoreResult, WeeklyAvg } from '@/types'

/**
 * Calculate recovery score based on sleep, HRV, and resting heart rate
 * 
 * @param daily - Today's daily summary data
 * @param weeklyAvg - 7-day averages for trend comparison
 * @returns Recovery score (0-100) and estimated flag
 */
export function calculateRecoveryScore(
  daily: DailySummary,
  weeklyAvg: WeeklyAvg
): RecoveryScoreResult {
  // Default values if data is missing
  const hasSleep = daily.sleep_score !== null && daily.sleep_score !== undefined
  const hasHrv = daily.hrv_score !== null && daily.hrv_score !== undefined
  const hasRhr = daily.resting_heart_rate !== null && daily.resting_heart_rate !== undefined

  // Normalisierte Sub-Scores (0-100)
  const sleepScore = daily.sleep_score ?? 50
  const hrvScore = daily.hrv_score ?? 50
  const rhrScore = hasRhr 
    ? Math.max(0, 100 - (daily.resting_heart_rate! - 50))
    : 50

  // 7-Tage-Trend-Gewichtung
  const hrvTrend = daily.hrv_rmssd && weeklyAvg.avgHrv
    ? (daily.hrv_rmssd > weeklyAvg.avgHrv ? 1.1 : 0.9)
    : 1.0
  
  const sleepTrend = daily.sleep_score && weeklyAvg.avgSleepScore
    ? (daily.sleep_score > weeklyAvg.avgSleepScore ? 1.05 : 0.95)
    : 1.0

  // Gewichtete Formel
  const rawScore = (
    sleepScore * 0.35 * sleepTrend +
    hrvScore * 0.40 * hrvTrend +
    rhrScore * 0.25
  )

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)))

  return {
    score: finalScore,
    isEstimated: !hasSleep || !hasHrv || !hasRhr,
  }
}

export interface StrainResult {
  score: number // 0-21 (Whoop scale)
  level: 'light' | 'moderate' | 'high' | 'extreme'
}

/**
 * Calculate strain score based on active zone minutes
 * 
 * @param activeZoneMinutes - Total active zone minutes (fat burn + cardio + peak)
 * @returns Strain score (0-21) and level
 */
export function calculateStrainScore(activeZoneMinutes: number): StrainResult {
  const score = Math.min(21, Math.round(activeZoneMinutes / 15))
  
  let level: StrainResult['level']
  if (score < 7) level = 'light'
  else if (score < 14) level = 'moderate'
  else if (score < 19) level = 'high'
  else level = 'extreme'

  return { score, level }
}

/**
 * Get color class based on recovery score
 */
export function getRecoveryColor(score: number): string {
  if (score >= 67) return 'text-accent-primary'   // Green
  if (score >= 34) return 'text-accent-warning'   // Amber
  return 'text-accent-danger'                      // Red
}

/**
 * Get color class based on strain score
 */
export function getStrainColor(score: number): string {
  if (score <= 10) return 'text-accent-primary'   // Green
  if (score <= 15) return 'text-accent-warning'   // Amber
  return 'text-accent-danger'                      // Red
}
