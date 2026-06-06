"use client"

import { useEffect, useState } from "react"
import { useRestTimer, formatRestTime } from "@/hooks/useRestTimer"
import { useWorkoutStore } from "@/stores/workoutStore"
import { SkipForward, Play } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export function RestTimer() {
  const { remainingSeconds, isActive, progress } = useRestTimer()
  const skipRest = useWorkoutStore(state => state.skipRest)

  if (!isActive) return null

  // Determine color based on remaining time
  const getColor = () => {
    if (remainingSeconds <= 10) return "text-accent-primary"
    if (remainingSeconds <= 30) return "text-accent-warning"
    return "text-foreground"
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-elevated border border-border rounded-xl p-4 shadow-lg">
      <div className="flex items-center gap-4">
        {/* Circular Progress */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#262626"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
              className={cn("transition-all duration-300", getColor())}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <SkipForward className="w-5 h-5 text-foreground-secondary" />
          </div>
        </div>

        {/* Timer Display */}
        <div className="flex-1">
          <p className="text-caption text-foreground-secondary uppercase tracking-wider">
            Pause
          </p>
          <p className={cn("text-display font-mono", getColor())}>
            {formatRestTime(remainingSeconds)}
          </p>
        </div>

        {/* Skip Button */}
        <button
          onClick={skipRest}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          Weiter
        </button>
      </div>
    </div>
  )
}

/**
 * Compact rest timer for inline display
 */
export function RestTimerCompact({ seconds, onComplete }: { seconds: number; onComplete?: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    if (!isRunning || remaining <= 0) return

    const timer = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          setIsRunning(false)
          onComplete?.()
          return 0
        }
        return r - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, remaining, onComplete])

  const toggle = () => setIsRunning(!isRunning)

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
        isRunning
          ? "bg-accent-warning/20 text-accent-warning"
          : "bg-elevated text-foreground-secondary hover:text-foreground"
      )}
    >
      {isRunning ? (
        <>
          <span className="font-mono">{formatRestTime(remaining)}</span>
          <span className="text-caption">Stop</span>
        </>
      ) : (
        <>
          <span>Rest: {formatRestTime(seconds)}</span>
        </>
      )}
    </button>
  )
}