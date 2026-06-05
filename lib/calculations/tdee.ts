import type { DailySummary } from '@/types'

export interface UserProfile {
  sex: 'male' | 'female' | 'other'
  weightKg: number
  heightCm: number
  age: number
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * 
 * @param profile - User profile data
 * @param healthDaily - Daily health data from Health Connect
 * @returns Calculated TDEE in kcal
 */
export function calculateTDEE(
  profile: UserProfile,
  healthDaily: Pick<DailySummary, 'activeMinutes' | 'calories_burned'>
): number {
  // Mifflin-St. Jeor BMR mit dynamischem Geschlecht
  const sexModifier = profile.sex === 'female' ? -161 :
                      profile.sex === 'other' ? -78 : 5

  const bmr = 10 * profile.weightKg
    + 6.25 * profile.heightCm
    - 5 * profile.age
    + sexModifier

  // Aktivitätsfaktor aus Health Connect Active Minutes
  const activityMultiplier =
    (healthDaily.activeMinutes ?? 0) < 30  ? 1.2  :
    (healthDaily.activeMinutes ?? 0) < 60  ? 1.375 :
    (healthDaily.activeMinutes ?? 0) < 90  ? 1.55  :
    (healthDaily.activeMinutes ?? 0) < 120 ? 1.725 : 1.9

  const totalBurned = healthDaily.calories_burned ?? 0
  
  return Math.round(bmr * activityMultiplier + (totalBurned * 0.1))
}

/**
 * Calculate BMR only (Basal Metabolic Rate)
 * 
 * @param profile - User profile data
 * @returns BMR in kcal
 */
export function calculateBMR(profile: UserProfile): number {
  const sexModifier = profile.sex === 'female' ? -161 :
                      profile.sex === 'other' ? -78 : 5

  return Math.round(
    10 * profile.weightKg
    + 6.25 * profile.heightCm
    - 5 * profile.age
    + sexModifier
  )
}

/**
 * Get macro distribution based on fitness goal
 * 
 * @param tdee - Total daily energy expenditure
 * @param goal - Fitness goal
 * @returns Recommended macros in grams
 */
export function getMacroTargets(
  tdee: number,
  goal: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'endurance'
): { protein: number; carbs: number; fat: number } {
  switch (goal) {
    case 'muscle_gain':
      // Higher protein and carbs for muscle building
      return {
        protein: Math.round(tdee * 0.3 / 4),
        carbs: Math.round(tdee * 0.45 / 4),
        fat: Math.round(tdee * 0.25 / 9),
      }
    case 'fat_loss':
      // Lower carbs, higher protein for satiety and muscle retention
      return {
        protein: Math.round(tdee * 0.35 / 4),
        carbs: Math.round(tdee * 0.3 / 4),
        fat: Math.round(tdee * 0.35 / 9),
      }
    case 'endurance':
      // Higher carbs for energy
      return {
        protein: Math.round(tdee * 0.2 / 4),
        carbs: Math.round(tdee * 0.55 / 4),
        fat: Math.round(tdee * 0.25 / 9),
      }
    case 'maintenance':
    default:
      // Balanced macros
      return {
        protein: Math.round(tdee * 0.25 / 4),
        carbs: Math.round(tdee * 0.45 / 4),
        fat: Math.round(tdee * 0.3 / 9),
      }
  }
}

/**
 * Calculate 1RM using Epley formula
 * 
 * @param weight - Weight in kg
 * @param reps - Number of reps performed
 * @returns Estimated 1RM in kg
 */
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

/**
 * Calculate volume for a set
 * 
 * @param weight - Weight in kg
 * @param reps - Number of reps
 * @returns Volume (weight * reps)
 */
export function calculateSetVolume(weight: number, reps: number): number {
  return weight * reps
}
