"use client"

import { Footprints } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface StepsWidgetProps {
  steps: number
  goal?: number
  className?: string
}

export function StepsWidget({ steps, goal = 10000, className }: StepsWidgetProps) {
  const progress = Math.min((steps / goal) * 100, 100)
  
  return (
    <div className={cn("bg-elevated rounded-xl p-4 border border-border", className)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
          <Footprints className="w-5 h-5 text-accent-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-caption uppercase text-foreground-secondary tracking-wider">
            Schritte
          </h3>
          <p className="text-h2 font-bold text-foreground mt-1">
            {steps.toLocaleString()}
          </p>
          <p className="text-body-sm text-foreground-secondary">
            Ziel: {goal.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3">
        <div className="h-2 bg-overlay rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-caption text-foreground-tertiary">
            {Math.round(progress)}%
          </span>
          <span className="text-caption text-foreground-tertiary">
            {(goal - steps).toLocaleString()} übrig
          </span>
        </div>
      </div>
    </div>
  )
}
