"use client"

import { Moon } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface SleepStage {
  minutes: number
  label: string
  color: string
}

interface SleepWidgetProps {
  totalMinutes: number
  score: number | null
  stages?: {
    deep: number
    rem: number
    light: number
    awake: number
  }
  className?: string
}

export function SleepWidget({
  totalMinutes,
  score,
  stages,
  className
}: SleepWidgetProps) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  // Calculate sleep composition for visualization
  const hasStages = stages && (stages.deep + stages.rem + stages.light + stages.awake) > 0
  
  const sleepStages: SleepStage[] = hasStages && stages ? [
    { minutes: stages.deep, label: "Tief", color: "#8b5cf6" },  // purple
    { minutes: stages.rem, label: "REM", color: "#3b82f6" },     // blue
    { minutes: stages.light, label: "Leicht", color: "#06b6d4" }, // cyan
    { minutes: stages.awake, label: "Wach", color: "#f59e0b" },  // amber
  ] : []
  
  const totalStageMinutes = sleepStages.reduce((sum, s) => sum + s.minutes, 0)
  
  const getScoreColor = (s: number | null) => {
    if (s === null) return "text-foreground-tertiary"
    if (s >= 80) return "text-accent-primary"
    if (s >= 60) return "text-accent-secondary"
    if (s >= 40) return "text-accent-warning"
    return "text-accent-danger"
  }
  
  return (
    <div className={cn("bg-elevated rounded-xl p-4 border border-border", className)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-secondary/10 flex items-center justify-center">
          <Moon className="w-5 h-5 text-accent-secondary" />
        </div>
        <div className="flex-1">
          <h3 className="text-caption uppercase text-foreground-secondary tracking-wider">
            Schlaf
          </h3>
          <p className="text-h2 font-bold text-foreground mt-1">
            {hours}h {minutes > 0 ? `${minutes}m` : ""}
          </p>
          {score !== null && (
            <p className={cn("text-body-sm font-medium", getScoreColor(score))}>
              Score: {score}/100
            </p>
          )}
        </div>
      </div>
      
      {/* Sleep stages bar */}
      {hasStages && totalStageMinutes > 0 && (
        <div className="mt-4">
          <div className="h-3 bg-overlay rounded-full overflow-hidden flex">
            {sleepStages.map((stage, index) => {
              const percentage = (stage.minutes / totalStageMinutes) * 100
              if (percentage < 1) return null
              
              return (
                <div
                  key={stage.label}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: stage.color,
                    marginLeft: index > 0 ? "1px" : "0"
                  }}
                  title={`${stage.label}: ${Math.round(percentage)}%`}
                />
              )
            })}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {sleepStages.filter(s => s.minutes > 0).map(stage => {
              const percentage = Math.round((stage.minutes / totalStageMinutes) * 100)
              return (
                <div key={stage.label} className="flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="text-caption text-foreground-secondary">
                    {stage.label} {percentage}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
