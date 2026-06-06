/**
 * Muscle status calculation utilities
 */

export type MuscleStatus = 
  | 'trained_heavy'   // Today
  | 'trained_light'   // 1-2 days + low volume
  | 'recovering'      // 1-2 days + high volume
  | 'fresh'           // 3-5 days or recovery week
  | 'neglected'       // >7 days without recovery week

/**
 * Get muscle status based on last trained date and volume
 * 
 * @param lastTrained - Date of last training for this muscle
 * @param volumeKg - Training volume in kg
 * @param isRecoveryWeek - Whether current program week is recovery week
 * @returns Muscle status for visualization
 */
export function getMuscleStatus(
  lastTrained: Date,
  volumeKg: number,
  isRecoveryWeek: boolean
): MuscleStatus {
  const daysSinceLast = Math.floor(
    (Date.now() - lastTrained.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Recovery week: All muscles are fresh, no "neglected" status
  if (isRecoveryWeek) {
    return 'fresh'
  }

  // Today
  if (daysSinceLast === 0) {
    return 'trained_heavy'
  }

  // 1-2 days
  if (daysSinceLast <= 2) {
    return volumeKg > 80 ? 'recovering' : 'trained_light'
  }

  // 3-5 days
  if (daysSinceLast <= 5) {
    return 'fresh'
  }

  // >7 days: Neglected (unless recovery week)
  return 'neglected'
}

/**
 * Get color for muscle status (for SVG muscle map)
 */
export function getMuscleStatusColor(status: MuscleStatus): string {
  const colors: Record<MuscleStatus, string> = {
    'trained_heavy': '#8b5cf6',   // Purple
    'trained_light': '#3b82f6',   // Blue
    'recovering': '#f97316',      // Orange
    'fresh': '#22c55e',           // Green
    'neglected': '#ef4444',       // Red
  }
  return colors[status]
}

/**
 * Get display label for muscle status
 */
export function getMuscleStatusLabel(status: MuscleStatus): string {
  const labels: Record<MuscleStatus, string> = {
    'trained_heavy': 'Heute trainiert',
    'trained_light': 'Kürzlich trainiert',
    'recovering': 'Erholung',
    'fresh': 'Frisch',
    'neglected': 'Vernachlässigt',
  }
  return labels[status]
}

/**
 * Calculate if a muscle should be trained today based on status
 * and workout preferences
 */
export function shouldTrainMuscle(
  status: MuscleStatus,
  isRecoveryWeek: boolean,
  allowTwicePerWeek: boolean = false
): boolean {
  if (isRecoveryWeek) {
    return status === 'fresh' || status === 'neglected'
  }

  if (status === 'fresh' || status === 'neglected') {
    return true
  }

  if (allowTwicePerWeek && (status === 'trained_light' || status === 'recovering')) {
    return true
  }

  return false
}
