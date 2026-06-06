"use client"

import { cn } from "@/lib/utils/cn"

interface StrainGaugeProps {
  score: number | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeConfig = {
  sm: { width: 80, strokeWidth: 6, fontSize: "1.5rem" },
  md: { width: 120, strokeWidth: 8, fontSize: "2rem" },
  lg: { width: 160, strokeWidth: 10, fontSize: "2.5rem" },
}

// Whoop-style strain: 0-21 scale
const MAX_STRAIN = 21

export function StrainGauge({ 
  score, 
  size = "md",
  className 
}: StrainGaugeProps) {
  const config = sizeConfig[size]
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  
  // Calculate color based on strain (Whoop style)
  const getColor = (s: number | null) => {
    if (s === null) return "#71717a" // gray
    if (s <= 10) return "#10b981" // green (light)
    if (s <= 15) return "#f59e0b" // amber (moderate)
    return "#ef4444" // red (high)
  }
  
  const color = getColor(score)
  const progress = score !== null ? (score / MAX_STRAIN) * circumference : 0
  
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
        {/* Progress circle - only show up to 75% for visual style */}
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
          {score !== null ? score.toFixed(1) : "--"}
        </span>
      </div>
    </div>
  )
}

export function StrainCard({ score }: Omit<StrainGaugeProps, 'size' | 'className'>) {
  const getLabel = (s: number | null) => {
    if (s === null) return "Keine Daten"
    if (s <= 10) return "Leicht"
    if (s <= 14) return "Moderat"
    if (s <= 18) return "Hoch"
    return "Extrem"
  }
  
  const getDescription = (s: number | null) => {
    if (s === null) return "Warte auf Aktivitätsdaten"
    if (s <= 10) return "Alltägliche Belastung"
    if (s <= 14) return "Aktiver Tag"
    if (s <= 18) return "Intensive Aktivität"
    return "Maximale Anstrengung"
  }
  
  return (
    <div className="bg-elevated rounded-xl p-4 border border-border">
      <div className="flex items-center gap-4">
        <StrainGauge score={score} size="md" />
        <div className="flex-1">
          <h3 className="text-caption uppercase text-foreground-secondary tracking-wider">
            Strain Score
          </h3>
          <p className="text-h2 font-semibold mt-1">{getLabel(score)}</p>
          <p className="text-body-sm text-foreground-secondary">
            {getDescription(score)}
          </p>
        </div>
      </div>
    </div>
  )
}
