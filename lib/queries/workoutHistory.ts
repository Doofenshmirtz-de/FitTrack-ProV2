import { useQuery, useQueries } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type Exercise = Database['public']['Tables']['exercises']['Row']

export interface PersonalRecord {
  id: string
  user_id: string
  exercise_id: string
  pr_type: '1rm' | 'max_reps' | 'max_volume'
  value: number
  achieved_at: string
  set_id: string | null
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  workout_sets: WorkoutSet[]
}

export interface LastWorkoutSet {
  weight_kg: number
  reps: number
  rpe: number | null
  recorded_at: string
}

export interface MuscleVolume {
  muscle: string
  volumeKg: number
  lastTrainedAt: string
}

export interface ProgramDay {
  id: string
  program_id: string
  day_number: number
  name: string | null
  is_rest_day: boolean
  sort_order: number
}

export interface ProgramDayExercise {
  id: string
  program_day_id: string
  exercise_id: string
  sets_target: number | null
  reps_target: string | null
  rest_seconds: number | null
  weight_note: string | null
  superset_group: number | null
  sort_order: number
  exercises: {
    id: string
    name: string
    name_de: string | null
  }
}

const queryKeys = {
  lastSet: (exerciseId: string) => ['workoutHistory', 'lastSet', exerciseId] as const,
  recentWorkouts: (limit: number) => ['workoutHistory', 'recentWorkouts', limit] as const,
  personalRecords: ['workoutHistory', 'personalRecords'] as const,
  newPRs: (start: string, end: string) => ['workoutHistory', 'newPRs', start, end] as const,
  muscleVolume: ['workoutHistory', 'muscleVolume'] as const,
}

export async function getLastWorkoutSet(
  exerciseId: string
): Promise<LastWorkoutSet | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('workout_sets')
    .select('weight_kg, reps, rpe, recorded_at, workout_sessions!inner(user_id)')
    .eq('exercise_id', exerciseId)
    .eq('is_warmup', false)
    .eq('workout_sessions.user_id', session.user.id)
    .gt('weight_kg', 0)
    .gt('reps', 0)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  const result = data as unknown as {
    weight_kg: number | null
    reps: number | null
    rpe: number | null
    recorded_at: string
  }

  return {
    weight_kg: result.weight_kg ?? 0,
    reps: result.reps ?? 0,
    rpe: result.rpe ?? null,
    recorded_at: result.recorded_at,
  }
}

export function useLastWorkoutSet(exerciseId: string | null) {
  return useQuery({
    queryKey: exerciseId ? queryKeys.lastSet(exerciseId) : ['workoutHistory', 'lastSet', 'none'],
    queryFn: () => {
      if (!exerciseId) return null
      return getLastWorkoutSet(exerciseId)
    },
    enabled: !!exerciseId,
    staleTime: 5 * 60 * 1000,
  })
}

export async function getRecentWorkouts(
  limit: number = 10
): Promise<WorkoutSessionWithSets[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*, workout_sets(*)')
    .eq('user_id', session.user.id)
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error('Failed to load recent workouts', error)
    return []
  }

  return data as WorkoutSessionWithSets[]
}

export function useRecentWorkouts(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.recentWorkouts(limit),
    queryFn: () => getRecentWorkouts(limit),
    staleTime: 60 * 1000,
  })
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', session.user.id)
    .order('achieved_at', { ascending: false })

  if (error || !data) {
    console.error('Failed to load personal records', error)
    return []
  }

  return data as PersonalRecord[]
}

export function usePersonalRecords() {
  return useQuery({
    queryKey: queryKeys.personalRecords,
    queryFn: getPersonalRecords,
    staleTime: 5 * 60 * 1000,
  })
}

export async function getNewPRsInRange(
  startedAt: string,
  endedAt: string
): Promise<PersonalRecord[]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('personal_records')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('achieved_at', startedAt)
    .lte('achieved_at', endedAt)
    .order('achieved_at', { ascending: false })

  if (error || !data) {
    console.error('Failed to load new PRs', error)
    return []
  }

  return data as PersonalRecord[]
}

export function useNewPRsInRange(startedAt: string | null, endedAt: string | null) {
  return useQuery({
    queryKey: startedAt && endedAt ? queryKeys.newPRs(startedAt, endedAt) : ['workoutHistory', 'newPRs', 'none'],
    queryFn: () => {
      if (!startedAt || !endedAt) return []
      return getNewPRsInRange(startedAt, endedAt)
    },
    enabled: !!startedAt && !!endedAt,
    staleTime: 60 * 1000,
  })
}

export async function getMuscleVolumeByGroup(
  daysBack: number = 7
): Promise<Record<string, MuscleVolume>> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return {}

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('workout_sets')
    .select('weight_kg, reps, recorded_at, exercises!inner(muscle_primary, muscle_secondary), workout_sessions!inner(user_id)')
    .eq('workout_sessions.user_id', session.user.id)
    .eq('is_warmup', false)
    .gt('weight_kg', 0)
    .gt('reps', 0)
    .gte('recorded_at', since)

  if (error || !data) {
    console.error('Failed to load muscle volume', error)
    return {}
  }

  const rows = data as unknown as Array<{
    weight_kg: number | null
    reps: number | null
    recorded_at: string
    exercises: Pick<Exercise, 'muscle_primary' | 'muscle_secondary'>
  }>

  const volumes: Record<string, MuscleVolume> = {}

  for (const row of rows) {
    const exercise = row.exercises
    const weight = row.weight_kg ?? 0
    const reps = row.reps ?? 0
    const volume = weight * reps
    const recordedAt = row.recorded_at

    const muscles = [
      ...(exercise.muscle_primary ?? []),
      ...(exercise.muscle_secondary ?? []).map(m => `${m}_secondary`),
    ]

    for (const muscle of muscles) {
      const isSecondary = muscle.endsWith('_secondary')
      const cleanMuscle = isSecondary ? muscle.replace('_secondary', '') : muscle
      const contribution = isSecondary ? volume * 0.5 : volume

      const existing = volumes[cleanMuscle]
      if (!existing || recordedAt > existing.lastTrainedAt) {
        volumes[cleanMuscle] = {
          muscle: cleanMuscle,
          volumeKg: (existing?.volumeKg ?? 0) + contribution,
          lastTrainedAt: recordedAt,
        }
      } else {
        existing.volumeKg += contribution
      }
    }
  }

  return volumes
}

export function useMuscleVolumeByGroup(daysBack: number = 7) {
  return useQuery({
    queryKey: [...queryKeys.muscleVolume, daysBack],
    queryFn: () => getMuscleVolumeByGroup(daysBack),
    staleTime: 5 * 60 * 1000,
  })
}

export async function getExerciseNames(exerciseIds: string[]): Promise<Record<string, string>> {
  if (exerciseIds.length === 0) return {}

  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, name_de')
    .in('id', exerciseIds)

  if (error || !data) {
    console.error('Failed to load exercise names', error)
    return {}
  }

  return (data as Exercise[]).reduce((map, exercise) => {
    map[exercise.id] = exercise.name_de || exercise.name
    return map
  }, {} as Record<string, string>)
}

export function useExerciseNames(exerciseIds: string[]) {
  return useQuery({
    queryKey: ['exercises', 'names', ...exerciseIds],
    queryFn: () => getExerciseNames(exerciseIds),
    enabled: exerciseIds.length > 0,
    staleTime: 60 * 60 * 1000,
  })
}

export async function getPrograms(): Promise<Database['public']['Tables']['programs']['Row'][]> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return []

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .or(`user_id.eq.${session.user.id},is_template.eq.true`)
    .order('name', { ascending: true })

  if (error || !data) {
    console.error('Failed to load programs', error)
    return []
  }

  return data
}

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: getPrograms,
    staleTime: 5 * 60 * 1000,
  })
}

export async function getProgramDays(programId: string): Promise<ProgramDay[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('program_days')
    .select('*')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    console.error('Failed to load program days', error)
    return []
  }

  return data as ProgramDay[]
}

export function useProgramDays(programId: string | null) {
  return useQuery({
    queryKey: ['programs', 'days', programId],
    queryFn: () => getProgramDays(programId!),
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  })
}

export async function getProgramDayExercises(programDayId: string): Promise<ProgramDayExercise[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('program_day_exercises')
    .select('*, exercises(id, name, name_de)')
    .eq('program_day_id', programDayId)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    console.error('Failed to load program day exercises', error)
    return []
  }

  return data as ProgramDayExercise[]
}

export function useProgramDayExercises(programDayId: string | null) {
  return useQuery({
    queryKey: ['programs', 'dayExercises', programDayId],
    queryFn: () => getProgramDayExercises(programDayId!),
    enabled: !!programDayId,
    staleTime: 5 * 60 * 1000,
  })
}

export interface WorkoutSessionDetail extends WorkoutSession {
  workout_sets: (WorkoutSet & {
    exercises: Pick<Exercise, 'id' | 'name' | 'name_de'>
  })[]
}

export async function getWorkoutSession(sessionId: string): Promise<WorkoutSessionDetail | null> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*, workout_sets(*, exercises(id, name, name_de))')
    .eq('id', sessionId)
    .eq('user_id', session.user.id)
    .single()

  if (error || !data) {
    console.error('Failed to load workout session', error)
    return null
  }

  return data as WorkoutSessionDetail
}

export function useWorkoutSession(sessionId: string) {
  return useQuery({
    queryKey: ['workoutHistory', 'session', sessionId],
    queryFn: () => getWorkoutSession(sessionId),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePreviousSetsForExercises(exerciseIds: string[]) {
  const queries = useQueries({
    queries: exerciseIds.map((id) => ({
      queryKey: queryKeys.lastSet(id),
      queryFn: () => getLastWorkoutSet(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const previousSetsByExercise: Record<string, { weightKg: number; reps: number; recordedAt?: string }[]> = {}

  exerciseIds.forEach((id, index) => {
    const result = queries[index]
    previousSetsByExercise[id] = result.data
      ? [{ weightKg: result.data.weight_kg, reps: result.data.reps, recordedAt: result.data.recorded_at }]
      : []
  })

  return {
    previousSetsByExercise,
    isLoading: queries.some((q) => q.isLoading),
  }
}
