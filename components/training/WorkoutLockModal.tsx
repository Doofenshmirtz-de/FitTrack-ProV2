"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Dumbbell } from "lucide-react"

interface WorkoutLockModalProps {
  onTakeOver: () => void
}

export function WorkoutLockModal({ onTakeOver }: WorkoutLockModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent-warning/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-accent-warning" />
          </div>
          <CardTitle className="text-h1">Training aktiv</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground-secondary text-center">
            Ein Workout läuft bereits in einem anderen Tab oder Fenster. Du kannst das aktive Training übernehmen, um hier fortzufahren.
          </p>

          <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
            <Dumbbell className="w-8 h-8 text-accent-primary" />
            <div>
              <p className="font-medium">Training läuft...</p>
              <p className="text-caption text-foreground-secondary">
                Synchronisiert über alle Tabs
              </p>
            </div>
          </div>

          <Button onClick={onTakeOver} className="w-full">
            Training übernehmen
          </Button>

          <p className="text-caption text-foreground-tertiary text-center">
            Das andere Tab wird automatisch pausiert
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
