"use client"

import { cn } from "@/lib/utils/cn"

interface RecoveryRingProps {
  score: number | null
  isEstimated?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeConfig = {
  sm: { width: 80, strokeWidth: 6, fontSize: "1.5rem" },
  md: { width: 120, strokeWidth: 8, fontSize: "2rem" },
  lg: { width: 160, strokeWidth: 10, fontSize: "2.5rem" },
}

export function RecoveryRing({ 
  score, 
  isEstimated = false, 
  size = "md",
  className 
}: RecoveryRingProps) {
  const config = sizeConfig[size]
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  
  // Calculate color based on score
  const getColor = (s: number | null) => {
    if (s === null) return "#71717a" // zinc-500 (gray)
    if (s >= 67) return "#10b981" // emerald-500 (green)
    if (s >= 34) return "#f59e0b" // amber-500 (yellow)
    return "#ef4444" // red-500 (red)
  }
  
  const color = getColor(score)
  const progress = score !== null ? (score / 100) * circumference : 0
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={config.width}
        height={config.width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="font-bold text-foreground"
          style={{ fontSize: config.fontSize }}
        >
          {score !== null ? score : "--"}
        </span>
        {isEstimated && score !== null && (
          <span className="text-xs text-foreground-secondary">~</span>
        )}
      </div>
    </div>
  )
}

export function RecoveryCard({ 
  score, 
  isEstimated = false 
}: Omit<RecoveryRingProps, 'size' | 'className'>) {
  const getLabel = (s: number | null) => {
    if (s === null) return "Keine Daten"
    if (s >= 67) return "Optimal"
    if (s >= 34) return "Moderat"
    return "Ermüdend"
  }
  
  const getDescription = (s: number | null) => {
    if (s === null) return "Synchronisiere Health Connect"
    if (s >= 67) return "Bereit für intensives Training"
    if (s >= 34) return "Moderates Training empfohlen"
    return "Priorisiere Erholung"
  }
  
  return (
    <div className="bg-elevated rounded-xl p-4 border border-border">
      <div className="flex items-center gap-4">
        <RecoveryRing score={score} isEstimated={isEstimated} size="md" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-caption uppercase text-foreground-secondary tracking-wider">
              Recovery Score
            </h3>
            {isEstimated && (
              <span 
                className="text-xs text-foreground-tertiary" 
                title="Basierend auf unvollständigen Daten"
              >
                (geschätzt)
              </span>
            )}
          </div>
          <p className="text-h2 font-semibold mt-1">{getLabel(score)}</p>
          <p className="text-body-sm text-foreground-secondary">
            {getDescription(score)}
          </p>
        </div>
      </div>
    </div>
  )
}
