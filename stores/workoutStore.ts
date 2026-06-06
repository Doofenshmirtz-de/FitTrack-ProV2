import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { addToQueue } from '@/lib/offline/offlineQueue'
import { setupOnlineSync } from '@/lib/offline/sync'

export type WorkoutStatus = 'IDLE' | 'ACTIVE' | 'RESTING' | 'COMPLETING'

export interface ExerciseSet {
  id: string
  setNumber: number
  weightKg: number
  reps: number
  rpe?: number
  isWarmup: boolean
  isCompleted: boolean
  isDropset?: boolean
}

export interface ActiveExercise {
  exerciseId: string
  name: string
  sets: ExerciseSet[]
}

interface WorkoutState {
  // State
  sessionId: string | null
  status: WorkoutStatus
  startedAt: number | null
  exercises: ActiveExercise[]
  currentRestEndsAt: number | null
  programId?: string
  programDayId?: string
  workoutName: string
  rpeOverall?: number

  // Actions
  startWorkout: (params?: { programId?: string; programDayId?: string; name?: string }) => void
  addExercise: (exerciseId: string, name: string) => void
  logSet: (exerciseIndex: number, set: Omit<ExerciseSet, 'id' | 'isCompleted'>) => void
  completeSet: (exerciseIndex: number, setId: string, restSeconds: number) => void
  skipRest: () => void
  endWorkout: () => void
  reset: () => void
  deleteSet: (exerciseIndex: number, setId: string) => void
  updateSet: (exerciseIndex: number, setId: string, updates: Partial<ExerciseSet>) => void
  reorderExercises: (fromIndex: number, toIndex: number) => void
  setRpeOverall: (rpe: number) => void
  finalizeWorkout: (userId: string) => Promise<{ success: boolean; queued: boolean; error?: string }>
  getTotalVolume: () => number
}

const initialState = {
  sessionId: null,
  status: 'IDLE' as WorkoutStatus,
  startedAt: null,
  exercises: [],
  currentRestEndsAt: null,
  programId: undefined,
  programDayId: undefined,
  workoutName: 'Freies Training',
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startWorkout: ({ programId, programDayId, name } = {}) => {
        set({
          sessionId: crypto.randomUUID(),
          status: 'ACTIVE',
          startedAt: Date.now(),
          exercises: [],
          currentRestEndsAt: null,
          programId,
          programDayId,
          workoutName: name || 'Freies Training',
        })
      },

      addExercise: (exerciseId, name) => {
        const { exercises } = get()
        set({
          exercises: [
            ...exercises,
            { exerciseId, name, sets: [] }
          ]
        })
      },

      logSet: (exerciseIndex, newSet) => {
        const { exercises, status } = get()
        if (status !== 'ACTIVE') return

        const exercise = exercises[exerciseIndex]
        if (!exercise) return

        const updatedExercises = [...exercises]
        updatedExercises[exerciseIndex] = {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              ...newSet,
              id: crypto.randomUUID(),
              isCompleted: false,
            }
          ]
        }

        set({ exercises: updatedExercises })
      },

      completeSet: (exerciseIndex, setId, restSeconds) => {
        const { exercises } = get()
        
        const updatedExercises = [...exercises]
        const exercise = updatedExercises[exerciseIndex]
        
        if (!exercise) return

        const setIndex = exercise.sets.findIndex(s => s.id === setId)
        if (setIndex === -1) return

        exercise.sets[setIndex] = {
          ...exercise.sets[setIndex],
          isCompleted: true
        }

        set({
          exercises: updatedExercises,
          status: 'RESTING',
          currentRestEndsAt: Date.now() + (restSeconds * 1000)
        })
      },

      skipRest: () => {
        set({
          status: 'ACTIVE',
          currentRestEndsAt: null
        })
      },

      endWorkout: () => {
        set({
          status: 'COMPLETING'
        })
      },

      reset: () => {
        set(initialState)
      },

      deleteSet: (exerciseIndex, setId) => {
        const { exercises } = get()
        
        const updatedExercises = [...exercises]
        const exercise = updatedExercises[exerciseIndex]
        
        if (!exercise) return

        exercise.sets = exercise.sets.filter(s => s.id !== setId)
        
        // Renumber sets
        exercise.sets.forEach((set, idx) => {
          set.setNumber = idx + 1
        })

        set({ exercises: updatedExercises })
      },

      updateSet: (exerciseIndex, setId, updates) => {
        const { exercises } = get()
        
        const updatedExercises = [...exercises]
        const exercise = updatedExercises[exerciseIndex]
        
        if (!exercise) return

        const setIndex = exercise.sets.findIndex(s => s.id === setId)
        if (setIndex === -1) return

        exercise.sets[setIndex] = {
          ...exercise.sets[setIndex],
          ...updates
        }

        set({ exercises: updatedExercises })
      },

      reorderExercises: (fromIndex, toIndex) => {
        const { exercises } = get()
        
        const updatedExercises = [...exercises]
        const [moved] = updatedExercises.splice(fromIndex, 1)
        updatedExercises.splice(toIndex, 0, moved)

        set({ exercises: updatedExercises })
      },

      setRpeOverall: (rpe) => {
        set({ rpeOverall: rpe })
      },

      getTotalVolume: () => {
        const { exercises } = get()
        return exercises.reduce((total, exercise) => {
          return total + exercise.sets.reduce((setTotal, set) => {
            return set.isCompleted && !set.isWarmup 
              ? setTotal + (set.weightKg * set.reps)
              : setTotal
          }, 0)
        }, 0)
      },

      finalizeWorkout: async (userId: string) => {
        const state = get()
        
        if (!state.sessionId || !state.startedAt) {
          return { success: false, queued: false, error: 'No active workout' }
        }

        const totalVolume = get().getTotalVolume()
        const endedAt = Date.now()

        const workoutPayload = {
          sessionId: state.sessionId,
          userId,
          programId: state.programId,
          programDayId: state.programDayId,
          name: state.workoutName,
          startedAt: new Date(state.startedAt).toISOString(),
          endedAt: new Date(endedAt).toISOString(),
          exercises: state.exercises,
          totalVolumeKg: totalVolume,
          rpeOverall: state.rpeOverall
        }

        try {
          // Prüfen ob online
          const isOnline = typeof navigator !== 'undefined' && navigator.onLine

          if (!isOnline) {
            // Offline: zur Queue hinzufügen
            await addToQueue('workout_complete', workoutPayload)
            set({ ...initialState, status: 'IDLE' })
            return { success: true, queued: true }
          }

          // Online: direkt sync versuchen
          try {
            const { flushOfflineQueue } = await import('@/lib/offline/sync')
            await flushOfflineQueue()
            
            // Nach dem Flush prüfen ob noch pending
            const { getQueueStats } = await import('@/lib/offline/offlineQueue')
            const stats = await getQueueStats()
            
            if (stats.pending === 0) {
              set({ ...initialState, status: 'IDLE' })
              return { success: true, queued: false }
            }
          } catch {
            // Sync fehlgeschlagen, zur Queue hinzufügen
            await addToQueue('workout_complete', workoutPayload)
            set({ ...initialState, status: 'IDLE' })
            return { success: true, queued: true }
          }

          set({ ...initialState, status: 'IDLE' })
          return { success: true, queued: false }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          // Bei Fehler zur Queue hinzufügen für späteren Retry
          try {
            await addToQueue('workout_complete', workoutPayload)
            set({ ...initialState, status: 'IDLE' })
            return { success: true, queued: true }
          } catch {
            return { success: false, queued: false, error: errorMessage }
          }
        }
      }
    }),
    {
      name: 'fittrack-workout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        status: state.status,
        startedAt: state.startedAt,
        exercises: state.exercises,
        programId: state.programId,
        programDayId: state.programDayId,
        workoutName: state.workoutName,
        rpeOverall: state.rpeOverall,
      }),
      onRehydrateStorage: () => {
        // Setup online sync listener beim Rehydrate
        if (typeof window !== 'undefined') {
          setupOnlineSync()
        }
        return (state) => {
          // Nach Rehydrate: Prüfen ob unvollständiges Workout existiert
          if (state?.status === 'ACTIVE' || state?.status === 'RESTING') {
            console.log('[WorkoutStore] Unfinished workout detected:', state.sessionId)
          }
        }
      }
    }
  )
)