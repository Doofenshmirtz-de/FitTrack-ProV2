/**
 * Muscle status calculation utilities
 */

export type MuscleStatus = 
  | 'trained_heavy'   // Today
  | 'trained_light'   // 1-2 days + low volume
  | 'recovering'      // 1-2 days + high volume
  | 'fresh'           // 3-5 days or recovery week
  | 'neglected'       // >7 days without recovery week

export type MuscleGroup = 
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'upper_back'
  | 'lower_back'
  | 'lats'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'

// All muscle groups for iteration
export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'shoulders', 
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'upper_back',
  'lower_back',
  'lats',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
]

// German display names for muscles
const MUSCLE_DISPLAY_NAMES_DE: Record<MuscleGroup, string> = {
  'chest': 'Brust',
  'shoulders': 'Schultern',
  'biceps': 'Bizeps',
  'triceps': 'Trizeps',
  'forearms': 'Unterarme',
  'abs': 'Bauch',
  'obliques': 'Schräge Bauchmuskeln',
  'upper_back': 'Oberer Rücken',
  'lower_back': 'Unterer Rücken',
  'lats': 'Latissimus',
  'glutes': 'Gesäß',
  'quads': 'Quadrizeps',
  'hamstrings': 'Hamstrings',
  'calves': 'Waden',
}

// English display names for muscles
const MUSCLE_DISPLAY_NAMES_EN: Record<MuscleGroup, string> = {
  'chest': 'Chest',
  'shoulders': 'Shoulders',
  'biceps': 'Biceps',
  'triceps': 'Triceps',
  'forearms': 'Forearms',
  'abs': 'Abs',
  'obliques': 'Obliques',
  'upper_back': 'Upper Back',
  'lower_back': 'Lower Back',
  'lats': 'Lats',
  'glutes': 'Glutes',
  'quads': 'Quads',
  'hamstrings': 'Hamstrings',
  'calves': 'Calves',
}

/**
 * Get display name for a muscle group
 * @param muscle - The muscle group
 * @param locale - Language locale (default: 'de')
 * @returns Display name for the muscle
 */
export function getMuscleDisplayName(muscle: MuscleGroup, locale: 'de' | 'en' = 'de'): string {
  return locale === 'de' 
    ? MUSCLE_DISPLAY_NAMES_DE[muscle] 
    : MUSCLE_DISPLAY_NAMES_EN[muscle]
}

// Status descriptions
const STATUS_DESCRIPTIONS_DE: Record<MuscleStatus, string> = {
  'trained_heavy': 'Heute intensiv trainiert',
  'trained_light': 'Kürzlich leicht trainiert',
  'recovering': 'Erholungsphase nach intensivem Training',
  'fresh': 'Bereit für Training',
  'neglected': 'Lange nicht trainiert',
}

const STATUS_DESCRIPTIONS_EN: Record<MuscleStatus, string> = {
  'trained_heavy': 'Trained heavy today',
  'trained_light': 'Recently trained light',
  'recovering': 'Recovering from intense training',
  'fresh': 'Ready for training',
  'neglected': 'Not trained for a while',
}

/**
 * Get description for muscle status
 * @param status - The muscle status
 * @param locale - Language locale (default: 'de')
 * @returns Description text for the status
 */
export function getMuscleStatusDescription(status: MuscleStatus, locale: 'de' | 'en' = 'de'): string {
  return locale === 'de'
    ? STATUS_DESCRIPTIONS_DE[status]
    : STATUS_DESCRIPTIONS_EN[status]
}

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
