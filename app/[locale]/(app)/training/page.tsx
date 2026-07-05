"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dumbbell, Play, Calendar, Sparkles, TrendingUp, Clock } from "lucide-react"
import { MuscleMap } from "@/components/training/MuscleMap"
import { MUSCLE_GROUPS, getMuscleStatus, type MuscleGroup, type MuscleStatus } from "@/lib/calculations/muscles"
import { useRecentWorkouts, useMuscleVolumeByGroup } from "@/lib/queries/workoutHistory"

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function getMuscleStatusFromVolume(
  volumeData: Record<string, { volumeKg: number; lastTrainedAt: string }>
): Record<MuscleGroup, MuscleStatus> {
  const result: Record<MuscleGroup, MuscleStatus> = {} as Record<MuscleGroup, MuscleStatus>

  for (const muscle of MUSCLE_GROUPS) {
    const data = volumeData[muscle]
    if (!data) {
      result[muscle] = 'fresh'
      continue
    }

    result[muscle] = getMuscleStatus(
      new Date(data.lastTrainedAt),
      data.volumeKg,
      false
    )
  }

  return result
}

export default function TrainingPage() {
  const { data: recentWorkouts = [], isLoading: isLoadingWorkouts } = useRecentWorkouts(5)
  const { data: muscleVolume = {} } = useMuscleVolumeByGroup(7)

  const muscleData = getMuscleStatusFromVolume(muscleVolume)

  const handleMuscleClick = (muscle: MuscleGroup) => {
    window.location.href = `/coach?context=muscle&muscle=${muscle}`
  }

  const completedSetsForSession = (session: typeof recentWorkouts[number]) => {
    return session.workout_sets?.filter((set) => !set.is_warmup).length ?? 0
  }

  return (
    <div className="space-y-6 pt-4 pb-safe-bottom">
      <header>
        <h1 className="text-h1">Training</h1>
        <p className="text-foreground-secondary">Trainingsprogramme und Muskelkarte</p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/training/workout/new">
          <Card className="h-full hover:border-accent-primary transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center mb-3">
                <Play className="h-6 w-6 text-accent-primary" />
              </div>
              <h3 className="font-semibold mb-1">Workout starten</h3>
              <p className="text-sm text-foreground-secondary">Freies Training</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/training/programs">
          <Card className="h-full hover:border-accent-secondary transition-colors cursor-pointer">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-accent-secondary/10 flex items-center justify-center mb-3">
                <Calendar className="h-6 w-6 text-accent-secondary" />
              </div>
              <h3 className="font-semibold mb-1">Programm wählen</h3>
              <p className="text-sm text-foreground-secondary">Strukturierte Pläne</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Muscle Map */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-h2">Muskelkarte</CardTitle>
          <Link href="/coach">
            <Button variant="outline" size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Coach fragen
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <MuscleMap
            muscleData={muscleData}
            onMuscleClick={handleMuscleClick}
          />
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Letzte Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingWorkouts ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-elevated rounded-lg" />
              ))}
            </div>
          ) : recentWorkouts.length === 0 ? (
            <div className="text-center py-8 text-foreground-secondary">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-foreground-tertiary" />
              <p>Noch keine Workouts geloggt</p>
              <Link href="/training/workout/new">
                <Button variant="outline" className="mt-4">
                  Erstes Workout starten
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((session) => {
                const durationSeconds = session.duration_seconds ?? Math.floor(
                  (new Date(session.ended_at || Date.now()).getTime() - new Date(session.started_at).getTime()) / 1000
                )
                const sets = completedSetsForSession(session)
                const volume = session.total_volume_kg ?? 0

                return (
                  <Link
                    key={session.id}
                    href={`/training/workout/history/${session.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 bg-elevated rounded-lg border border-border hover:border-accent-primary transition-colors">
                      <div>
                        <p className="font-medium text-foreground">{session.name || 'Workout'}</p>
                        <p className="text-caption text-foreground-secondary">{formatDate(session.started_at)}</p>
                      </div>
                      <div className="flex items-center gap-4 text-caption text-foreground-secondary">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono">{formatDuration(durationSeconds)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-mono">{volume.toLocaleString('de-DE')} kg</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Dumbbell className="w-4 h-4" />
                          <span className="font-mono">{sets}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
