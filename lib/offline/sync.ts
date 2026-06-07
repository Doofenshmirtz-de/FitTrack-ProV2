import { createClient } from '@/lib/supabase/client'
import {
  offlineQueue,
  removeFromQueue,
  updateRetryCount,
  moveToFailed,
  type PendingOperation
} from './offlineQueue'
import type { ActiveExercise } from '@/stores/workoutStore'

const BATCH_SIZE = 10
const MAX_RETRIES = 3

interface WorkoutSessionPayload {
  sessionId: string
  userId: string
  programId?: string
  programDayId?: string
  name: string
  startedAt: string
  endedAt: string
  exercises: ActiveExercise[]
  totalVolumeKg: number
  rpeOverall?: number
}

interface FoodLogPayload {
  userId: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodName: string
  brandName?: string
  quantityG: number
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sugarG?: number
  sodiumMg?: number
  barcode?: string
  openfoodfactsId?: string
  photoUrl?: string
  notes?: string
}

// Haupt-Sync-Funktion
export async function flushOfflineQueue(): Promise<{
  synced: number
  failed: number
  remaining: number
}> {
  const supabase = createClient()
  const items = await offlineQueue.pending
    .orderBy('timestamp')
    .toArray()

  let synced = 0
  let failed = 0

  // Batch-Verarbeitung
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    
    for (const item of batch) {
      try {
        await syncItem(supabase, item)
        await removeFromQueue(item.id!)
        synced++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (item.retryCount >= MAX_RETRIES) {
          await moveToFailed(item, errorMessage)
          failed++
        } else {
          await updateRetryCount(item.id!, errorMessage)
        }
      }
    }
  }

  const remaining = await offlineQueue.pending.count()
  
  return { synced, failed, remaining }
}

// Einzelnes Item synchronisieren
async function syncItem(supabase: ReturnType<typeof createClient>, item: PendingOperation): Promise<void> {
  switch (item.type) {
    case 'food_log':
      await syncFoodLog(supabase, item.payload as FoodLogPayload)
      break
    case 'workout_complete':
      await syncWorkoutSession(supabase, item.payload as WorkoutSessionPayload)
      break
    default:
      throw new Error(`Unknown operation type: ${item.type}`)
  }
}

// Food Log synchronisieren
async function syncFoodLog(
  supabase: ReturnType<typeof createClient>,
  payload: FoodLogPayload
): Promise<void> {
  const { error } = await supabase.from('food_logs').insert({
    user_id: payload.userId,
    meal_type: payload.mealType,
    food_name: payload.foodName,
    brand_name: payload.brandName,
    quantity_g: payload.quantityG,
    calories: payload.calories,
    protein_g: payload.proteinG,
    carbs_g: payload.carbsG,
    fat_g: payload.fatG,
    fiber_g: payload.fiberG,
    sugar_g: payload.sugarG,
    sodium_mg: payload.sodiumMg,
    barcode: payload.barcode,
    openfoodfacts_id: payload.openfoodfactsId,
    photo_url: payload.photoUrl,
    notes: payload.notes
  } as never)

  if (error) throw error
}

// Workout Session synchronisieren (atomar: Session + Sets)
async function syncWorkoutSession(
  supabase: ReturnType<typeof createClient>,
  payload: WorkoutSessionPayload
): Promise<void> {
  // 1. Session erstellen
  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      id: payload.sessionId,
      user_id: payload.userId,
      program_id: payload.programId,
      program_day_id: payload.programDayId,
      name: payload.name,
      started_at: payload.startedAt,
      ended_at: payload.endedAt,
      total_volume_kg: payload.totalVolumeKg
    } as never)
    .select('id')
    .single()

  if (sessionError) throw sessionError

  // 2. Alle Sets einfügen
  const setsToInsert = payload.exercises.flatMap((exercise) =>
    exercise.sets
      .filter(set => set.isCompleted)
      .map((set, setIndex) => ({
        session_id: (session as { id: string }).id,
        exercise_id: exercise.exerciseId,
        set_number: setIndex + 1,
        reps: set.reps,
        weight_kg: set.weightKg,
        rpe: set.rpe,
        is_warmup: set.isWarmup,
        is_dropset: false,
        recorded_at: new Date(Date.parse(payload.startedAt) + setIndex * 1000).toISOString()
      }))
  )

  if (setsToInsert.length > 0) {
    const { error: setsError } = await supabase
      .from('workout_sets')
      .insert(setsToInsert as never)

    if (setsError) {
      // Rollback: Session löschen wenn Sets fehlschlagen
      await supabase.from('workout_sessions').delete().eq('id', (session as { id: string }).id)
      throw setsError
    }
  }
}

// Online-Event Listener
export function setupOnlineSync(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('online', async () => {
    console.log('[OfflineQueue] Back online - starting sync...')
    const result = await flushOfflineQueue()
    console.log(`[OfflineQueue] Sync complete: ${result.synced} synced, ${result.failed} failed, ${result.remaining} remaining`)
    
    // Event für UI auslösen
    window.dispatchEvent(new CustomEvent('offlinesync:complete', { detail: result }))
  })
}

// Manuelle Sync-Funktion (für Debug/Force-Sync)
export async function forceSync(): Promise<{
  success: boolean
  result: { synced: number; failed: number; remaining: number }
}> {
  try {
    const result = await flushOfflineQueue()
    return { success: true, result }
  } catch (error) {
    console.error('[OfflineQueue] Force sync failed:', error)
    return { 
      success: false, 
      result: { synced: 0, failed: 0, remaining: await offlineQueue.pending.count() } 
    }
  }
}
