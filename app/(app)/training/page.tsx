"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Dumbbell, Play, Calendar } from "lucide-react"

export default function TrainingPage() {
  return (
    <div className="space-y-6 pt-4">
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
              <h3 className="font-semibold mb-1">Programme</h3>
              <p className="text-sm text-foreground-secondary">Strukturierte Pläne</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Muscle Map Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Muskelkarte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-[3/4] bg-elevated rounded-lg flex items-center justify-center">
            <div className="text-center text-foreground-secondary">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-foreground-tertiary" />
              <p>Muskelkarte wird hier angezeigt</p>
              <p className="text-sm text-foreground-tertiary mt-1">
                Starte ein Training, um deine Muskeln zu tracken
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Workouts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Letzte Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-foreground-secondary">
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
