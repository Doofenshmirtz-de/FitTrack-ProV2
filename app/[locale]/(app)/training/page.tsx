"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dumbbell, Play, Calendar, Sparkles } from "lucide-react"
import { MuscleMap } from "@/components/training/MuscleMap"
import type { MuscleGroup, MuscleStatus } from "@/lib/calculations/muscles"

// Demo muscle data - in real app, this comes from workout history
const DEMO_MUSCLE_DATA: Record<MuscleGroup, MuscleStatus> = {
  chest: "fresh",
  shoulders: "trained_light",
  biceps: "fresh",
  triceps: "neglected",
  forearms: "fresh",
  abs: "trained_heavy",
  obliques: "fresh",
  upper_back: "recovering",
  lower_back: "fresh",
  lats: "recovering",
  glutes: "fresh",
  quads: "trained_heavy",
  hamstrings: "fresh",
  calves: "fresh",
}

export default function TrainingPage() {
  const handleMuscleClick = (muscle: MuscleGroup) => {
    console.log("Clicked muscle:", muscle)
  }

  const handleMuscleLongPress = (muscle: MuscleGroup) => {
    // Navigate to AI Coach with muscle context
    window.location.href = `/coach?context=muscle&muscle=${muscle}`
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

        <Card className="h-full hover:border-accent-secondary transition-colors cursor-pointer">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-accent-secondary/10 flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-accent-secondary" />
            </div>
            <h3 className="font-semibold mb-1">Programm wählen</h3>
            <p className="text-sm text-foreground-secondary">Strukturierte Pläne</p>
          </CardContent>
        </Card>
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
            muscleData={DEMO_MUSCLE_DATA}
            onMuscleClick={handleMuscleClick}
            onMuscleLongPress={handleMuscleLongPress}
          />
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Letzte Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-foreground-secondary">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-foreground-tertiary" />
            <p>Noch keine Workouts geloggt</p>
            <Link href="/training/workout/new">
              <Button variant="outline" className="mt-4">
                Erstes Workout starten
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}