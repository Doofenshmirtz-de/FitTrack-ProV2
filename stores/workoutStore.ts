import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
      }),
    }
  )
)