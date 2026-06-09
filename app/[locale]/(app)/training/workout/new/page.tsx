"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useWorkoutStore } from "@/stores/workoutStore"
import { useWorkoutLock, useCheckPersistedWorkout } from "@/hooks/useWorkoutLock"
import { ExerciseCard } from "@/components/training/ExerciseCard"
import { RestTimer } from "@/components/training/RestTimer"
import { WorkoutLockModal } from "@/components/training/WorkoutLockModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Play, 
  Square, 
  Plus, 
  Clock,
  ChevronLeft,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { ExercisePicker } from "@/components/training/ExercisePicker"

export default function WorkoutPage() {
  const router = useRouter()
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  
  // Workout store
  const {
    status,
    startedAt,
    exercises,
    workoutName,
    startWorkout,
    endWorkout,
    reset,
    addExercise,
    finalizeWorkout,
  } = useWorkoutStore()

  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const supabase = createClient()

  // Multi-tab lock
  const isLockedByOtherTab = useWorkoutLock(status !== 'IDLE')

  // Check for persisted workout on mount
  const { hasPersistedWorkout, resumeWorkout, discardWorkout } = useCheckPersistedWorkout()

  useEffect(() => {
    if (hasPersistedWorkout && status === 'IDLE') {
      setShowResumeDialog(true)
    }
  }, [hasPersistedWorkout, status])

  // Calculate workout duration
  const duration = startedAt 
    ? Math.floor((Date.now() - startedAt) / 1000)
    : 0

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    startWorkout({ name: 'Freies Training' })
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    endWorkout()
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.id) {
        await finalizeWorkout(session.user.id)
      } else {
        console.error("User not found in session")
        reset()
      }
    } catch (e) {
      console.error("Failed to finalize workout", e)
      reset()
    }
    
    setIsCompleting(false)
    router.push('/training')
  }

  const handleTakeOver = () => {
    // The other tab will detect lock loss and pause
    // This tab continues with the workout
  }

  const handleResumePersisted = () => {
    resumeWorkout()
    setShowResumeDialog(false)
  }

  const handleDiscardPersisted = () => {
    discardWorkout()
    setShowResumeDialog(false)
  }

  // Resume dialog
  if (showResumeDialog) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-accent-warning" />
              <h2 className="text-h2">Training fortsetzen?</h2>
            </div>
            <p className="text-foreground-secondary">
              Ein vorheriges Training wurde nicht beendet. Möchtest du fortfahren oder neu starten?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDiscardPersisted} className="flex-1">
                Verwerfen
              </Button>
              <Button onClick={handleResumePersisted} className="flex-1">
                Fortsetzen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Lock modal when another tab has active workout
  if (isLockedByOtherTab) {
    return <WorkoutLockModal onTakeOver={handleTakeOver} />
  }

  // Workout not started
  if (status === 'IDLE') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-full bg-accent-primary/10 flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-accent-primary" />
          </div>
          <h1 className="text-h1">Training starten</h1>
          <p className="text-foreground-secondary">
            Bereit für dein Workout?
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/training">
            <Button variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <Button onClick={handleStart} size="lg">
            <Play className="w-5 h-5 mr-2" />
            Starten
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-app mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/training">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="font-semibold text-foreground">{workoutName}</h1>
                <div className="flex items-center gap-2 text-caption text-foreground-secondary">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono">{formatDuration(duration)}</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              <Square className="w-4 h-4 mr-2" />
              {isCompleting ? 'Speichern...' : 'Beenden'}
            </Button>
          </div>
        </div>
      </header>

      {/* Exercise List */}
      <main className="flex-1 max-w-app mx-auto w-full px-4 py-4 pb-32 space-y-4">
        {exercises.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-foreground-secondary mb-4">
              Noch keine Übungen hinzugefügt
            </p>
            <Button onClick={() => setShowExercisePicker(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Übung
            </Button>
          </Card>
        )}

        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.exerciseId}
            exercise={exercise}
            exerciseIndex={index}
            isActive={status === 'ACTIVE'}
            onCompleteSet={() => {}}
          />
        ))}

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowExercisePicker(true)}
          className="w-full py-4 border-2 border-dashed border-border rounded-xl text-foreground-secondary hover:text-foreground hover:border-border-focus transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Übung hinzufügen
        </button>
      </main>

      {/* Rest Timer */}
      <RestTimer />

      {/* Bottom Status */}
      <div className="fixed bottom-20 left-0 right-0 z-20 px-4">
        <div className="max-w-app mx-auto">
          <div className={cn(
            "bg-elevated border border-border rounded-lg px-4 py-2 flex items-center justify-between",
            status === 'RESTING' && "opacity-0"
          )}>
            <span className="text-caption text-foreground-secondary">
              {exercises.length} Übungen • {exercises.reduce((acc, e) => acc + e.sets.filter(s => s.isCompleted).length, 0)} Sätze
            </span>
            <span className={cn(
              "text-caption font-medium",
              status === 'ACTIVE' && "text-accent-primary"
            )}>
              {status === 'ACTIVE' && 'Bereit'}
            </span>
          </div>
        </div>
      </div>

      {showExercisePicker && (
        <ExercisePicker 
          onClose={() => setShowExercisePicker(false)}
          onSelect={(id, name) => {
            addExercise(id, name)
            setShowExercisePicker(false)
          }}
        />
      )}
    </div>
  )
}