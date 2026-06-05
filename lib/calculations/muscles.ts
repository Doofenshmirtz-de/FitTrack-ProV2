import { MUSCLE_GROUPS, type MuscleGroup, type MuscleStatus, type WorkoutSet, type Exercise } from '@/types'

export { MUSCLE_GROUPS }
export type { MuscleGroup, MuscleStatus }

interface MuscleTrainingData {
  muscle: MuscleGroup
  lastTrainedDate: Date | null
  totalVolumeKg: number // Last 7 days
  isRecoveryWeek: boolean
}

interface WorkoutSetWithExercise extends WorkoutSet {
  exercises: Exercise | null
}

/**
 * Calculate muscle status for the muscle map
 * 
 * @param data - Muscle training data
 * @returns Status for this muscle group
 */
export function calculateMuscleStatus(
  data: MuscleTrainingData
): MuscleStatus {
  // Recovery week: all muscles are "fresh"
  if (data.isRecoveryWeek) {
    return 'fresh'
  }

  // Never trained
  if (!data.lastTrainedDate) {
    return 'neglected'
  }

  const now = new Date()
  const daysSinceTraining = Math.floor(
    (now.getTime() - data.lastTrainedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Calculate weekly average volume (simplified)
  const avgVolume = data.totalVolumeKg / 7
  const isHighVolume = avgVolume > 1000 // Threshold for "high volume"

  // Trained today
  if (daysSinceTraining === 0) {
    return 'trained_heavy'
  }

  // 1-2 days ago
  if (daysSinceTraining <= 2) {
    return isHighVolume ? 'recovering' : 'trained_light'
  }

  // 3-5 days ago
  if (daysSinceTraining <= 5) {
    return 'fresh'
  }

  // > 7 days
  return 'neglected'
}

/**
 * Get human-readable label for muscle status
 * 
 * @param status - Muscle status
 * @returns German label
 */
export function getMuscleStatusLabel(status: MuscleStatus): string {
  const labels: Record<MuscleStatus, string> = {
    neglected: 'Vernachlässigt',
    recovering: 'Erholend',
    fresh: 'Bereit',
    trained_light: 'Leicht trainiert',
    trained_heavy: 'Schwer trainiert',
  }
  return labels[status]
}

/**
 * Get description for muscle status
 * 
 * @param status - Muscle status
 * @returns German description
 */
export function getMuscleStatusDescription(status: MuscleStatus): string {
  const descriptions: Record<MuscleStatus, string> = {
    neglected: 'Seit über 7 Tagen nicht trainiert',
    recovering: 'Erholungsphase nach intensivem Training',
    fresh: 'Bereit für intensives Training',
    trained_light: 'Vor kurzem leicht trainiert',
    trained_heavy: 'Heute bereits trainiert',
  }
  return descriptions[status]
}

/**
 * Get color for muscle status
 * 
 * @param status - Muscle status
 * @returns Tailwind color class
 */
export function getMuscleStatusColor(status: MuscleStatus): string {
  const colors: Record<MuscleStatus, string> = {
    neglected: 'fill-muscle-neglected',
    recovering: 'fill-muscle-recovering',
    fresh: 'fill-muscle-fresh',
    trained_light: 'fill-muscle-trained-light',
    trained_heavy: 'fill-muscle-trained-heavy',
  }
  return colors[status]
}

/**
 * Calculate muscle group frequency from sets
 * 
 * @param sets - Workout sets with exercise data
 * @returns Frequency map of muscle groups
 */
export function calculateMuscleFrequency(
  sets: WorkoutSetWithExercise[]
): Record<MuscleGroup, number> {
  const frequency: Record<string, number> = {}
  
  // Initialize all muscles to 0
  MUSCLE_GROUPS.forEach(muscle => {
    frequency[muscle] = 0
  })

  // Count muscle activations
  sets.forEach(set => {
    if (!set.exercises) return
    
    // Primary muscles count as 1
    set.exercises.muscle_primary?.forEach(muscle => {
      frequency[muscle] = (frequency[muscle] || 0) + 1
    })
    
    // Secondary muscles count as 0.5
    set.exercises.muscle_secondary?.forEach(muscle => {
      frequency[muscle] = (frequency[muscle] || 0) + 0.5
    })
  })

  return frequency as Record<MuscleGroup, number>
}

/**
 * Get display name for muscle group
 * 
 * @param muscle - Muscle group ID
 * @returns German display name
 */
export function getMuscleDisplayName(muscle: MuscleGroup): string {
  const names: Record<MuscleGroup, string> = {
    chest: 'Brust',
    shoulders: 'Schultern',
    biceps: 'Bizeps',
    triceps: 'Trizeps',
    forearms: 'Unterarme',
    abs: 'Bauch',
    obliques: 'Schräger Bauch',
    upper_back: 'Oberer Rücken',
    lower_back: 'Unterer Rücken',
    lats: 'Latissimus',
    glutes: 'Gesäß',
    quads: 'Quadrizeps',
    hamstrings: 'Beinbizeps',
    calves: 'Waden',
  }
  return names[muscle]
}
