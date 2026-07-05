"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useWorkoutSession } from "@/lib/queries/workoutHistory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Dumbbell, Clock, TrendingUp } from "lucide-react"

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function WorkoutHistoryDetailPage() {
  const params = useParams<{ id: string }>()
  const sessionId = params.id
  const { data: session, isLoading } = useWorkoutSession(sessionId)

  const setsByExercise = session?.workout_sets
    ? session.workout_sets.reduce((acc, set) => {
        const exerciseName = set.exercises?.name_de || set.exercises?.name || 'Unbekannte Übung'
        if (!acc[exerciseName]) {
          acc[exerciseName] = []
        }
        acc[exerciseName].push(set)
        return acc
      }, {} as Record<string, typeof session.workout_sets>)
    : {}

  const durationSeconds = session
    ? session.duration_seconds ?? Math.floor(
        (new Date(session.ended_at || Date.now()).getTime() - new Date(session.started_at).getTime()) / 1000
      )
    : 0

  return (
    <div className="space-y-6 pt-4 pb-safe-bottom">
      <header className="flex items-center gap-3">
        <Link href="/training">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-h1">Workout Details</h1>
          {session && <p className="text-foreground-secondary">{formatDate(session.started_at)}</p>}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse bg-elevated rounded-lg" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse bg-elevated rounded-lg" />
          ))}
        </div>
      ) : !session ? (
        <Card className="p-8 text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-foreground-tertiary" />
          <p className="text-foreground-secondary">Workout nicht gefunden</p>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-h2">{session.name || 'Workout'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center">
                  <Clock className="w-5 h-5 text-accent-primary mb-1" />
                  <span className="text-h3 font-mono">{formatDuration(durationSeconds)}</span>
                  <span className="text-caption text-foreground-secondary">Dauer</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <TrendingUp className="w-5 h-5 text-accent-secondary mb-1" />
                  <span className="text-h3 font-mono">{(session.total_volume_kg ?? 0).toLocaleString('de-DE')} kg</span>
                  <span className="text-caption text-foreground-secondary">Volumen</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Dumbbell className="w-5 h-5 text-accent-purple mb-1" />
                  <span className="text-h3 font-mono">{session.workout_sets?.length ?? 0}</span>
                  <span className="text-caption text-foreground-secondary">Sätze</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {Object.entries(setsByExercise).map(([exerciseName, sets]) => (
              <Card key={exerciseName}>
                <CardHeader>
                  <CardTitle className="text-h3">{exerciseName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sets
                      .sort((a, b) => a.set_number - b.set_number)
                      .map((set) => (
                        <div
                          key={set.id}
                          className="flex items-center justify-between p-3 bg-elevated rounded-lg"
                        >
                          <span className="text-foreground-secondary">Satz {set.set_number}</span>
                          <div className="flex items-center gap-4 font-mono text-foreground">
                            <span>{set.weight_kg ?? 0} kg</span>
                            <span>× {set.reps ?? 0}</span>
                            {set.is_pr && (
                              <span className="text-accent-primary font-medium">PR</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
