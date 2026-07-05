"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useNewPRsInRange, useExerciseNames } from "@/lib/queries/workoutHistory"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Dumbbell, Clock, Flame, CheckCircle2, TrendingUp, CloudOff } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export default function WorkoutSummaryPage() {
  const searchParams = useSearchParams()

  const name = searchParams.get('name') || 'Workout'
  const durationSeconds = parseInt(searchParams.get('duration') || '0', 10)
  const volume = parseFloat(searchParams.get('volume') || '0')
  const exerciseCount = parseInt(searchParams.get('exercises') || '0', 10)
  const setCount = parseInt(searchParams.get('sets') || '0', 10)
  const startedAt = searchParams.get('startedAt')
  const endedAt = searchParams.get('endedAt')
  const queued = searchParams.get('queued') === '1'

  const { data: newPRs = [] } = useNewPRsInRange(startedAt, endedAt)
  const { data: exerciseNames = {} } = useExerciseNames(newPRs.map((pr) => pr.exercise_id))

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const prTypeLabel = (type: string) => {
    switch (type) {
      case '1rm': return 'Geschätztes 1RM'
      case 'max_reps': return 'Max. Reps'
      case 'max_volume': return 'Max. Volumen'
      default: return type
    }
  }

  return (
    <div className="min-h-screen flex flex-col p-4 pb-safe-bottom">
      <div className="max-w-app mx-auto w-full space-y-6 pt-4">
        <header className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-accent-primary" />
          </div>
          <h1 className="text-h1">Geschafft!</h1>
          <p className="text-foreground-secondary">{name} abgeschlossen</p>
          {queued && (
            <p className="inline-flex items-center gap-2 text-caption text-accent-warning bg-accent-warning/10 px-3 py-1 rounded-full">
              <CloudOff className="w-4 h-4" />
              Offline gespeichert – wird synchronisiert
            </p>
          )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Clock className="w-6 h-6 text-accent-primary mb-2" />
              <span className="text-h2 font-mono">{formatDuration(durationSeconds)}</span>
              <span className="text-caption text-foreground-secondary">Dauer</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <TrendingUp className="w-6 h-6 text-accent-secondary mb-2" />
              <span className="text-h2 font-mono">{volume.toLocaleString('de-DE')} kg</span>
              <span className="text-caption text-foreground-secondary">Volumen</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Dumbbell className="w-6 h-6 text-accent-purple mb-2" />
              <span className="text-h2 font-mono">{setCount}</span>
              <span className="text-caption text-foreground-secondary">Sätze</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Flame className="w-6 h-6 text-accent-warning mb-2" />
              <span className="text-h2 font-mono">{exerciseCount}</span>
              <span className="text-caption text-foreground-secondary">Übungen</span>
            </CardContent>
          </Card>
        </div>

        {/* New PRs */}
        <Card className={cn(newPRs.length > 0 && "border-accent-primary")}>
          <CardHeader className="flex-row items-center gap-3">
            <Trophy className={cn("w-6 h-6", newPRs.length > 0 ? "text-accent-primary" : "text-foreground-secondary")} />
            <CardTitle className="text-h2">
              {newPRs.length > 0 ? `${newPRs.length} neue PRs` : 'Keine neuen PRs'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {newPRs.length === 0 ? (
              <p className="text-foreground-secondary text-center py-4">
                Nächstes Mal knacke ich einen Rekord!
              </p>
            ) : (
              <ul className="space-y-2">
                {newPRs.map((pr) => (
                  <li
                    key={pr.id}
                    className="flex items-center justify-between p-3 bg-accent-primary/10 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent-primary" />
                      <div>
                        <p className="font-medium text-foreground">{prTypeLabel(pr.pr_type)}</p>
                        <p className="text-caption text-foreground-secondary">{exerciseNames[pr.exercise_id] || pr.exercise_id}</p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-accent-primary">
                      {pr.value.toLocaleString('de-DE')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-4">
          <Link href="/training" className="flex-1">
            <Button variant="outline" className="w-full">
              Zur Übersicht
            </Button>
          </Link>
          <Link href="/training/workout/new" className="flex-1">
            <Button className="w-full">
              Nächstes Workout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
