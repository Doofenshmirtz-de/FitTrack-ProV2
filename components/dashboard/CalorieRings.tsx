"use client"

import { cn } from "@/lib/utils/cn"

interface CalorieRingsProps {
  consumed: number
  burned: number
  target: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeConfig = {
  sm: { width: 100, strokeWidth: 8 },
  md: { width: 140, strokeWidth: 10 },
  lg: { width: 180, strokeWidth: 12 },
}

export function CalorieRings({
  consumed,
  burned,
  target,
  size = "md",
  className
}: CalorieRingsProps) {
  const config = sizeConfig[size]
  
  // Outer ring: Consumed vs Target
  const outerRadius = (config.width - config.strokeWidth) / 2
  const outerCircumference = outerRadius * 2 * Math.PI
  const consumedProgress = Math.min(consumed / target, 1) * outerCircumference
  
  // Inner ring: Burned vs Target
  const innerRadius = outerRadius - config.strokeWidth - 4
  const innerCircumference = innerRadius * 2 * Math.PI
  const burnedProgress = Math.min(burned / target, 1) * innerCircumference
  
  // Color logic
  const getConsumedColor = () => {
    const ratio = consumed / target
    if (ratio < 0.8) return "#10b981" // Under target - green
    if (ratio <= 1.1) return "#3b82f6" // On target - blue
    return "#ef4444" // Over target - red
  }
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={config.width} height={config.width} className="transform -rotate-90">
        {/* Outer ring background */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={outerRadius}
          fill="none"
          stroke="#262626"
          strokeWidth={config.strokeWidth}
        />
        {/* Outer ring progress (consumed) */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={outerRadius}
          fill="none"
          stroke={getConsumedColor()}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={outerCircumference}
          strokeDashoffset={outerCircumference - consumedProgress}
          className="transition-all duration-500 ease-out"
        />
        
        {/* Inner ring background */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={innerRadius}
          fill="none"
          stroke="#262626"
          strokeWidth={config.strokeWidth}
        />
        {/* Inner ring progress (burned) */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={innerRadius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={innerCircumference}
          strokeDashoffset={innerCircumference - burnedProgress}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-h2 font-bold text-foreground">
          {consumed}
        </span>
        <span className="text-caption text-foreground-secondary">
          / {target}
        </span>
      </div>
    </div>
  )
}

export function CalorieCard({
  consumed,
  burned,
  target,
}: Omit<CalorieRingsProps, 'size' | 'className'>) {
  const remaining = target - consumed
  
  return (
    <div className="bg-elevated rounded-xl p-4 border border-border">
      <div className="flex items-center gap-4">
        <CalorieRings consumed={consumed} burned={burned} target={target} size="md" />
        <div className="flex-1">
          <h3 className="text-caption uppercase text-foreground-secondary tracking-wider">
            Kalorien
          </h3>
          
          <div className="space-y-1 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-primary" />
              <span className="text-body-sm text-foreground-secondary">
                Verzehrt: <span className="text-foreground font-medium">{consumed}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-warning" />
              <span className="text-body-sm text-foreground-secondary">
                Verbrannt: <span className="text-foreground font-medium">{burned}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-secondary" />
              <span className="text-body-sm text-foreground-secondary">
                Ziel: <span className="text-foreground font-medium">{target}</span>
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-caption text-foreground-tertiary">
              {remaining > 0 
                ? `${remaining} kcal übrig`
                : `${Math.abs(remaining)} kcal über Ziel`
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
