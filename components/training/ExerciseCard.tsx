"use client"

import { useState } from "react"
import { MoreVertical, Trash2, GripVertical } from "lucide-react"

import { Input } from "@/components/ui/input"
import { useWorkoutStore, type ExerciseSet, type ActiveExercise } from "@/stores/workoutStore"
import { cn } from "@/lib/utils/cn"

interface ExerciseCardProps {
  exercise: ActiveExercise
  exerciseIndex: number
  isActive: boolean
  onCompleteSet: (setId: string, restSeconds: number) => void
  previousBest?: { weightKg: number; reps: number }
}

const REST_PRESETS = [
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
  { label: "90s", value: 90 },
  { label: "3m", value: 180 },
  { label: "5m", value: 300 },
]

export function ExerciseCard({
  exercise,
  exerciseIndex,
  isActive,
  onCompleteSet: _onCompleteSet,
  previousBest,
}: ExerciseCardProps) {
  const { logSet, deleteSet, updateSet, completeSet } = useWorkoutStore()
  const [showMenu, setShowMenu] = useState(false)

  const handleAddSet = () => {
    const nextSetNumber = exercise.sets.length + 1
    logSet(exerciseIndex, {
      setNumber: nextSetNumber,
      weightKg: exercise.sets.length > 0 
        ? exercise.sets[exercise.sets.length - 1].weightKg 
        : 0,
      reps: exercise.sets.length > 0 
        ? exercise.sets[exercise.sets.length - 1].reps 
        : 0,
      isWarmup: false,
    })
  }

  const handleSetChange = (setId: string, field: keyof ExerciseSet, value: number | boolean) => {
    updateSet(exerciseIndex, setId, { [field]: value })
  }

  return (
    <div className="bg-elevated rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-foreground-tertiary cursor-move" />
          <h3 className="font-semibold text-foreground">{exercise.name}</h3>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-overlay rounded-lg transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-foreground-secondary" />
        </button>
      </div>

      {/* Sets */}
      <div className="p-4 space-y-3">
        {exercise.sets.map((set, setIndex) => (
          <SetRow
            key={set.id}
            set={set}
            setIndex={setIndex}
            isActive={isActive}
            previousBest={previousBest}
            onChange={(field, value) => handleSetChange(set.id, field, value)}
            onComplete={(restSeconds) => completeSet(exerciseIndex, set.id, restSeconds)}
            onDelete={() => deleteSet(exerciseIndex, set.id)}
          />
        ))}

        {/* Add Set Button */}
        <button
          onClick={handleAddSet}
          className="w-full py-3 border-2 border-dashed border-border rounded-lg text-foreground-secondary hover:text-foreground hover:border-border-focus transition-colors"
        >
          + Satz hinzufügen
        </button>
      </div>
    </div>
  )
}

interface SetRowProps {
  set: ExerciseSet
  setIndex: number
  isActive: boolean
  previousBest?: { weightKg: number; reps: number }
  onChange: (field: keyof ExerciseSet, value: number | boolean) => void
  onComplete: (restSeconds: number) => void
  onDelete: () => void
}

function SetRow({ set, setIndex, isActive, previousBest, onChange, onComplete, onDelete }: SetRowProps) {
  const [selectedRest, setSelectedRest] = useState(90)

  const isPR = previousBest && 
    set.weightKg > previousBest.weightKg && 
    set.reps >= previousBest.reps

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg transition-colors",
      set.isCompleted ? "bg-accent-primary/10" : "bg-overlay",
      set.isWarmup && "opacity-75"
    )}>
      {/* Set Number */}
      <span className={cn(
        "w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium flex-shrink-0",
        set.isCompleted
          ? "bg-accent-primary text-white"
          : set.isWarmup
            ? "bg-accent-warning text-white"
            : "bg-border text-foreground-secondary"
      )}>
        {set.setNumber}
      </span>

      {/* Weight Input */}
      <div className="flex-1 min-w-0">
        <label className="text-caption text-foreground-tertiary">kg</label>
        <Input
          type="number"
          value={set.weightKg || ""}
          onChange={(e) => onChange("weightKg", parseFloat(e.target.value) || 0)}
          disabled={set.isCompleted || !isActive}
          className="h-10 text-center font-mono"
          step="0.5"
        />
      </div>

      {/* Reps Input */}
      <div className="flex-1 min-w-0">
        <label className="text-caption text-foreground-tertiary">reps</label>
        <Input
          type="number"
          value={set.reps || ""}
          onChange={(e) => onChange("reps", parseInt(e.target.value) || 0)}
          disabled={set.isCompleted || !isActive}
          className="h-10 text-center font-mono"
        />
      </div>

      {/* RPE Input (optional) */}
      <div className="w-16 hidden sm:block">
        <label className="text-caption text-foreground-tertiary">RPE</label>
        <Input
          type="number"
          value={set.rpe || ""}
          onChange={(e) => onChange("rpe", parseFloat(e.target.value) || 0)}
          disabled={set.isCompleted || !isActive}
          className="h-10 text-center font-mono"
          min="0"
          max="10"
          step="0.5"
          placeholder="-"
        />
      </div>

      {/* Previous Best Indicator */}
      {previousBest && setIndex === 0 && !set.isCompleted && (
        <div className="hidden md:flex flex-col items-center text-caption text-foreground-secondary">
          <span>PR</span>
          <span className="font-mono">{previousBest.weightKg}×{previousBest.reps}</span>
        </div>
      )}

      {/* Complete Button */}
      {isActive && !set.isCompleted && (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {REST_PRESETS.slice(0, 3).map((preset) => (
              <button
                key={preset.value}
                onClick={() => {
                  setSelectedRest(preset.value)
                  onComplete(preset.value)
                }}
                className={cn(
                  "px-2 py-1 rounded text-caption font-medium transition-colors",
                  selectedRest === preset.value
                    ? "bg-accent-primary text-white"
                    : "bg-background text-foreground-secondary hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed Check */}
      {set.isCompleted && (
        <div className="flex items-center gap-2">
          <span className="text-accent-primary font-medium">✓</span>
          {isPR && (
            <span className="text-accent-purple text-caption font-medium">PR!</span>
          )}
        </div>
      )}

      {/* Delete Button */}
      {!set.isCompleted && (
        <button
          onClick={onDelete}
          className="p-2 text-foreground-tertiary hover:text-accent-danger transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}