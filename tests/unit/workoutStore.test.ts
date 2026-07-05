import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useWorkoutStore } from '@/stores/workoutStore'

vi.mock('@/lib/offline/offlineQueue', async () => {
  const actual = await vi.importActual('@/lib/offline/offlineQueue')
  return {
    ...(actual as object),
    addToQueue: vi.fn().mockResolvedValue(undefined),
    getQueueStats: vi.fn().mockResolvedValue({ pending: 0, failed: 0, oldestPending: null }),
  }
})

vi.mock('@/lib/offline/sync', () => ({
  setupOnlineSync: vi.fn(),
  flushOfflineQueue: vi.fn().mockResolvedValue({ synced: 0, failed: 0, remaining: 0 }),
  forceSync: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }),
    },
  }),
}))

let uuidCounter = 0

describe('workoutStore', () => {
  beforeEach(() => {
    uuidCounter = 0
    Object.defineProperty(window, 'crypto', {
      writable: true,
      value: {
        randomUUID: () => `test-uuid-${++uuidCounter}`,
        getRandomValues: (arr: Uint8Array) => arr,
      },
    })

    useWorkoutStore.getState().reset()
    useWorkoutStore.setState({
      sessionId: null,
      status: 'IDLE',
      startedAt: null,
      exercises: [],
      currentRestEndsAt: null,
      programId: undefined,
      programDayId: undefined,
      workoutName: 'Freies Training',
    })
  })

  afterEach(() => {
    useWorkoutStore.persist.clearStorage()
  })

  it('starts with IDLE state', () => {
    const state = useWorkoutStore.getState()
    expect(state.status).toBe('IDLE')
    expect(state.exercises).toHaveLength(0)
    expect(state.sessionId).toBeNull()
  })

  it('starts a free workout', () => {
    const { startWorkout } = useWorkoutStore.getState()
    startWorkout({ name: 'Push A' })

    const state = useWorkoutStore.getState()
    expect(state.status).toBe('ACTIVE')
    expect(state.workoutName).toBe('Push A')
    expect(state.sessionId).toBe('test-uuid-1')
    expect(state.startedAt).toBeDefined()
    expect(state.exercises).toHaveLength(0)
  })

  it('adds an exercise without initial sets', () => {
    const { startWorkout, addExercise } = useWorkoutStore.getState()
    startWorkout()
    addExercise('ex-1', 'Bankdrücken')

    const state = useWorkoutStore.getState()
    expect(state.exercises).toHaveLength(1)
    expect(state.exercises[0].exerciseId).toBe('ex-1')
    expect(state.exercises[0].name).toBe('Bankdrücken')
    expect(state.exercises[0].sets).toHaveLength(0)
  })

  it('adds an exercise with last set pre-filled', () => {
    const { startWorkout, addExercise } = useWorkoutStore.getState()
    startWorkout()
    addExercise('ex-1', 'Bankdrücken', { weightKg: 80, reps: 8, rpe: 8 })

    const state = useWorkoutStore.getState()
    expect(state.exercises[0].sets).toHaveLength(1)
    expect(state.exercises[0].sets[0].weightKg).toBe(80)
    expect(state.exercises[0].sets[0].reps).toBe(8)
    expect(state.exercises[0].sets[0].rpe).toBe(8)
  })

  it('logs and completes a set with rest timer', () => {
    const { startWorkout, addExercise, logSet, completeSet } = useWorkoutStore.getState()
    startWorkout()
    addExercise('ex-1', 'Bankdrücken')
    logSet(0, { setNumber: 1, weightKg: 80, reps: 8, isWarmup: false })

    const setId = useWorkoutStore.getState().exercises[0].sets[0].id
    completeSet(0, setId, 90)

    const state = useWorkoutStore.getState()
    expect(state.exercises[0].sets[0].isCompleted).toBe(true)
    expect(state.status).toBe('RESTING')
    expect(state.currentRestEndsAt).toBeGreaterThan(Date.now())
  })

  it('calculates total volume correctly', () => {
    const { startWorkout, addExercise, logSet, completeSet, getTotalVolume, skipRest } = useWorkoutStore.getState()
    startWorkout()
    addExercise('ex-1', 'Bankdrücken')
    logSet(0, { setNumber: 1, weightKg: 80, reps: 8, isWarmup: false })

    const firstSetId = useWorkoutStore.getState().exercises[0].sets[0].id
    completeSet(0, firstSetId, 60)
    skipRest()
    logSet(0, { setNumber: 2, weightKg: 80, reps: 7, isWarmup: false })

    const secondSetId = useWorkoutStore.getState().exercises[0].sets[1].id
    completeSet(0, secondSetId, 60)

    expect(getTotalVolume()).toBe(80 * 8 + 80 * 7)
  })

  it('skips rest and returns to active state', () => {
    const { startWorkout, addExercise, logSet, completeSet, skipRest } = useWorkoutStore.getState()
    startWorkout()
    addExercise('ex-1', 'Bankdrücken')
    logSet(0, { setNumber: 1, weightKg: 80, reps: 8, isWarmup: false })
    completeSet(0, 'test-uuid-1234', 60)
    skipRest()

    const state = useWorkoutStore.getState()
    expect(state.status).toBe('ACTIVE')
    expect(state.currentRestEndsAt).toBeNull()
  })

  it('does not allow logging sets when not active', () => {
    const { logSet } = useWorkoutStore.getState()
    logSet(0, { setNumber: 1, weightKg: 80, reps: 8, isWarmup: false })

    const state = useWorkoutStore.getState()
    expect(state.status).toBe('IDLE')
    expect(state.exercises).toHaveLength(0)
  })

  it('finalizes a workout online and returns summary', async () => {
    const { startWorkout, addExercise, logSet, completeSet, finalizeWorkout } = useWorkoutStore.getState()
    startWorkout()
    addExercise('ex-1', 'Bankdrücken')
    logSet(0, { setNumber: 1, weightKg: 80, reps: 8, isWarmup: false })

    const setId = useWorkoutStore.getState().exercises[0].sets[0].id
    completeSet(0, setId, 60)

    const result = await finalizeWorkout('user-1')

    expect(result.success).toBe(true)
    expect(result.queued).toBe(false)
    expect(result.summary).toBeDefined()
    expect(result.summary!.sets).toBe(1)
    expect(result.summary!.totalVolumeKg).toBe(80 * 8)
    expect(result.summary!.exercises).toBe(1)

    const state = useWorkoutStore.getState()
    expect(state.status).toBe('IDLE')
    expect(state.exercises).toHaveLength(0)
  })

  it('queues a workout when offline', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    })

    const { startWorkout, addExercise, logSet, completeSet, finalizeWorkout } = useWorkoutStore.getState()
    startWorkout()
    addExercise('ex-1', 'Bankdrücken')
    logSet(0, { setNumber: 1, weightKg: 80, reps: 8, isWarmup: false })

    const setId = useWorkoutStore.getState().exercises[0].sets[0].id
    completeSet(0, setId, 60)

    const result = await finalizeWorkout('user-1')

    expect(result.success).toBe(true)
    expect(result.queued).toBe(true)
    expect(result.summary).toBeDefined()

    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    })
  })
})
