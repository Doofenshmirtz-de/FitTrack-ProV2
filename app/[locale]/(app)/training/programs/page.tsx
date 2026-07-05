"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePrograms, useProgramDays, getProgramDayExercises } from "@/lib/queries/workoutHistory"
import { useWorkoutStore } from "@/stores/workoutStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronDown, ChevronRight, Dumbbell, Play, Calendar } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const difficultyLabel: Record<string, string> = {
  beginner: 'Anfänger',
  intermediate: 'Fortgeschritten',
  advanced: 'Experte',
}

const goalLabel: Record<string, string> = {
  hypertrophy: 'Hypertrophie',
  strength: 'Kraft',
  endurance: 'Ausdauer',
  general: 'Allgemein',
}

export default function ProgramsPage() {
  const router = useRouter()
  const { data: programs = [], isLoading } = usePrograms()
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null)
  const [startingDayId, setStartingDayId] = useState<string | null>(null)
  const { startWorkout, addExercise } = useWorkoutStore()

  const { data: days = [] } = useProgramDays(expandedProgramId)

  const toggleProgram = (programId: string) => {
    setExpandedProgramId((current) => (current === programId ? null : programId))
  }

  const startProgramDay = async (programId: string, programDayId: string, dayName: string) => {
    setStartingDayId(programDayId)

    const dayExercises = await getProgramDayExercises(programDayId)

    startWorkout({ programId, programDayId, name: dayName })

    for (const exercise of dayExercises) {
      addExercise(exercise.exercise_id, exercise.exercises.name_de || exercise.exercises.name)
    }

    setStartingDayId(null)
    router.push('/training/workout/new')
  }

  return (
    <div className="space-y-6 pt-4 pb-safe-bottom">
      <header className="flex items-center gap-3">
        <Link href="/training">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-h1">Programme</h1>
          <p className="text-foreground-secondary">Strukturierte Trainingspläne</p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-elevated" />
          ))}
        </div>
      ) : programs.length === 0 ? (
        <Card className="p-8 text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-foreground-tertiary" />
          <p className="text-foreground-secondary">Noch keine Programme vorhanden</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => (
            <Card
              key={program.id}
              className={cn(
                "overflow-hidden transition-colors",
                expandedProgramId === program.id && "border-accent-primary"
              )}
            >
              <CardHeader className="p-4">
                <button
                  onClick={() => toggleProgram(program.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="space-y-1">
                    <CardTitle className="text-h2">{program.name}</CardTitle>
                    <p className="text-caption text-foreground-secondary">
                      {difficultyLabel[program.difficulty || ''] || program.difficulty} • {goalLabel[program.goal || ''] || program.goal}
                    </p>
                  </div>
                  {expandedProgramId === program.id ? (
                    <ChevronDown className="w-5 h-5 text-foreground-secondary" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-foreground-secondary" />
                  )}
                </button>
              </CardHeader>

              {expandedProgramId === program.id && (
                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  {program.description && (
                    <p className="text-sm text-foreground-secondary">{program.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <Calendar className="w-4 h-4" />
                      <span>{program.days_per_week} Tage/Woche</span>
                    </div>
                  </div>

                  {days.length === 0 ? (
                    <p className="text-center text-foreground-secondary py-4">Tage laden...</p>
                  ) : (
                    <div className="space-y-2">
                      {days.map((day) => (
                        <div
                          key={day.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            day.is_rest_day
                              ? "border-border bg-background"
                              : "border-border bg-elevated"
                          )}
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              Tag {day.day_number}: {day.name || 'Training'}
                            </p>
                            {day.is_rest_day && (
                              <p className="text-caption text-foreground-secondary">Ruhetag</p>
                            )}
                          </div>

                          {!day.is_rest_day && (
                            <Button
                              size="sm"
                              onClick={() => startProgramDay(program.id, day.id, day.name || `${program.name} Tag ${day.day_number}`)}
                              disabled={startingDayId === day.id}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              {startingDayId === day.id ? 'Startet...' : 'Starten'}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
