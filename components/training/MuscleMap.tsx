"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { 
  MUSCLE_GROUPS, 
  type MuscleGroup, 
  type MuscleStatus,
  getMuscleDisplayName,
  getMuscleStatusLabel,
  getMuscleStatusDescription,
} from "@/lib/calculations/muscles"
import { cn } from "@/lib/utils/cn"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"

type View = "front" | "back"

interface MuscleMapProps {
  muscleData: Record<MuscleGroup, MuscleStatus>
  onMuscleClick?: (muscle: MuscleGroup) => void
  onMuscleLongPress?: (muscle: MuscleGroup) => void
  className?: string
}

const STATUS_COLORS: Record<MuscleStatus, string> = {
  neglected: "#ef4444",      // red
  recovering: "#f97316",     // orange
  fresh: "#22c55e",          // green
  trained_light: "#3b82f6", // blue
  trained_heavy: "#8b5cf6",  // purple
}

export function MuscleMap({ 
  muscleData, 
  onMuscleClick, 
  onMuscleLongPress,
  className 
}: MuscleMapProps) {
  const [view, setView] = useState<View>("front")
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  // Map muscle IDs between front and back views
  const getMuscleId = (muscle: MuscleGroup, isBack: boolean): string => {
    if (muscle === "calves" && isBack) return "muscle-calves-back"
    return `muscle-${muscle}`
  }

  // Handle muscle interaction
  const handleMuscleClick = useCallback((muscle: MuscleGroup) => {
    setSelectedMuscle(selectedMuscle === muscle ? null : muscle)
    onMuscleClick?.(muscle)
  }, [selectedMuscle, onMuscleClick])

  const handleMouseDown = useCallback((muscle: MuscleGroup) => {
    longPressTimer.current = setTimeout(() => {
      onMuscleLongPress?.(muscle)
      longPressTimer.current = null
    }, 800)
  }, [onMuscleLongPress])

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // Apply colors to SVG paths
  useEffect(() => {
    if (!svgRef.current) return

    Object.entries(muscleData).forEach(([muscle, status]) => {
      const frontId = getMuscleId(muscle as MuscleGroup, false)
      const backId = getMuscleId(muscle as MuscleGroup, true)
      
      const color = STATUS_COLORS[status]
      
      // Apply to front view elements
      const frontEl = svgRef.current?.querySelector(`#${frontId}`)
      if (frontEl) {
        (frontEl as SVGPathElement).style.fill = color
        frontEl.setAttribute("data-status", status)
      }
      
      // Apply to back view elements
      const backEl = svgRef.current?.querySelector(`#${backId}`)
      if (backEl) {
        (backEl as SVGPathElement).style.fill = color
        backEl.setAttribute("data-status", status)
      }
    })
  }, [muscleData])

  const selectedInfo = selectedMuscle ? {
    name: getMuscleDisplayName(selectedMuscle),
    status: muscleData[selectedMuscle],
    label: getMuscleStatusLabel(muscleData[selectedMuscle]),
    description: getMuscleStatusDescription(muscleData[selectedMuscle]),
  } : null

  return (
    <div className={cn("space-y-4", className)}>
      {/* View Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setView("front")}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            view === "front"
              ? "bg-accent-primary text-white"
              : "bg-elevated text-foreground-secondary hover:text-foreground"
          )}
        >
          Vorderseite
        </button>
        <button
          onClick={() => setView("back")}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors",
            view === "back"
              ? "bg-accent-primary text-white"
              : "bg-elevated text-foreground-secondary hover:text-foreground"
          )}
        >
          Rückseite
        </button>
      </div>

      {/* SVG Map */}
      <div className="relative aspect-[1/2] max-w-[280px] mx-auto bg-elevated rounded-xl p-4">
        <svg
          ref={svgRef}
          viewBox="0 0 200 400"
          className="w-full h-full"
          style={{ maxHeight: "400px" }}
        >
          {view === "front" ? (
            <FrontView 
              muscleData={muscleData}
              onClick={handleMuscleClick}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            />
          ) : (
            <BackView 
              muscleData={muscleData}
              onClick={handleMuscleClick}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            />
          )}
        </svg>

        {/* View indicator */}
        <div className="absolute top-2 right-2 text-caption text-foreground-tertiary uppercase">
          {view === "front" ? "Vorn" : "Hinten"}
        </div>
      </div>

      {/* Selected Muscle Info */}
      {selectedInfo && (
        <div className="bg-elevated rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{selectedInfo.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: STATUS_COLORS[selectedInfo.status] }}
                />
                <span className="text-body-sm text-foreground-secondary">
                  {selectedInfo.label}
                </span>
              </div>
              <p className="text-caption text-foreground-tertiary mt-2">
                {selectedInfo.description}
              </p>
            </div>
            <button
              onClick={() => selectedMuscle && onMuscleLongPress?.(selectedMuscle)}
              className="p-2 bg-accent-purple/10 rounded-lg text-accent-purple hover:bg-accent-purple/20 transition-colors"
              title="AI Coach fragen"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div 
            key={status}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-elevated"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-caption text-foreground-secondary">
              {getMuscleStatusLabel(status as MuscleStatus)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ViewProps {
  muscleData: Record<MuscleGroup, MuscleStatus>
  onClick: (muscle: MuscleGroup) => void
  onMouseDown: (muscle: MuscleGroup) => void
  onMouseUp: () => void
}

function FrontView({ muscleData, onClick, onMouseDown, onMouseUp }: ViewProps) {
  return (
    <g>
      {/* Shoulders */}
      <MusclePath 
        muscle="shoulders" 
        d="M45,65 Q60,60 70,70 L70,85 Q60,90 50,85 Q40,80 45,65 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="shoulders" 
        d="M130,70 Q140,60 155,65 Q160,80 150,85 Q140,90 130,85 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Chest */}
      <MusclePath 
        muscle="chest" 
        d="M70,70 Q100,65 130,70 L125,110 Q100,115 75,110 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Biceps */}
      <MusclePath 
        muscle="biceps" 
        d="M40,85 Q55,90 60,110 L55,140 Q45,135 40,110 Q38,95 40,85 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="biceps" 
        d="M140,110 Q145,90 160,85 Q162,95 160,110 Q155,135 145,140 L140,110 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Forearms */}
      <MusclePath 
        muscle="forearms" 
        d="M35,140 Q45,145 50,170 L45,200 Q35,195 32,165 Q30,150 35,140 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="forearms" 
        d="M150,170 Q155,145 165,140 Q170,150 168,165 Q165,195 155,200 L150,170 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Abs */}
      <MusclePath 
        muscle="abs" 
        d="M80,115 Q100,110 120,115 L115,155 Q100,160 85,155 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="abs" 
        d="M82,160 Q100,155 118,160 L115,195 Q100,200 85,195 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Obliques */}
      <MusclePath 
        muscle="obliques" 
        d="M75,115 L65,130 L70,160 Q80,155 82,150 L78,115 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="obliques" 
        d="M118,150 L125,115 L135,130 L130,160 Q120,155 118,150 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Quads */}
      <MusclePath 
        muscle="quads" 
        d="M60,200 Q80,195 90,210 L88,280 Q75,285 65,275 Q55,240 60,200 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="quads" 
        d="M110,210 Q120,195 140,200 Q145,240 135,275 Q125,285 112,280 L110,210 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Calves */}
      <MusclePath 
        muscle="calves" 
        d="M70,290 Q80,285 85,300 L82,360 Q75,365 70,360 Q65,325 70,290 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="calves" 
        d="M115,300 Q120,285 130,290 Q135,325 130,360 Q125,365 118,360 L115,300 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
    </g>
  )
}

function BackView({ muscleData, onClick, onMouseDown, onMouseUp }: ViewProps) {
  return (
    <g>
      {/* Upper Back */}
      <MusclePath 
        muscle="upper_back" 
        d="M70,70 Q100,65 130,70 L125,100 Q100,105 75,100 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Lats */}
      <MusclePath 
        muscle="lats" 
        d="M60,100 Q75,105 80,130 L75,180 Q65,175 60,150 Q55,120 60,100 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="lats" 
        d="M120,130 Q125,105 140,100 Q145,120 140,150 Q135,175 125,180 L120,130 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Lower Back */}
      <MusclePath 
        muscle="lower_back" 
        d="M85,105 Q100,110 115,105 L112,150 Q100,155 88,150 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Rear Delts */}
      <MusclePath 
        muscle="shoulders" 
        d="M45,70 Q60,65 70,75 L65,95 Q50,90 48,80 Q45,75 45,70 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="shoulders" 
        d="M130,75 Q140,65 155,70 Q155,75 152,80 Q150,90 135,95 L130,75 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Triceps */}
      <MusclePath 
        muscle="triceps" 
        d="M40,95 Q55,100 60,120 L55,155 Q45,150 40,125 Q38,110 40,95 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="triceps" 
        d="M140,120 Q145,100 160,95 Q162,110 160,125 Q155,150 145,155 L140,120 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Glutes */}
      <MusclePath 
        muscle="glutes" 
        d="M65,180 Q85,175 95,195 L90,220 Q75,225 65,215 Q60,200 65,180 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="glutes" 
        d="M105,195 Q115,175 135,180 Q140,200 135,215 Q125,225 110,220 L105,195 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Hamstrings */}
      <MusclePath 
        muscle="hamstrings" 
        d="M65,220 Q80,215 90,235 L88,290 Q75,295 65,285 Q60,260 65,220 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="hamstrings" 
        d="M110,235 Q120,215 135,220 Q140,260 135,285 Q125,295 112,290 L110,235 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />

      {/* Calves */}
      <MusclePath 
        muscle="calves" 
        d="M70,300 Q80,295 85,310 L82,365 Q75,370 70,365 Q65,335 70,300 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
      <MusclePath 
        muscle="calves" 
        d="M115,310 Q120,295 130,300 Q135,335 130,365 Q125,370 118,365 L115,310 Z"
        {...{ onClick, onMouseDown, onMouseUp }}
      />
    </g>
  )
}

interface MusclePathProps {
  muscle: MuscleGroup
  d: string
  onClick: (muscle: MuscleGroup) => void
  onMouseDown: (muscle: MuscleGroup) => void
  onMouseUp: () => void
}

function MusclePath({ muscle, d, onClick, onMouseDown, onMouseUp }: MusclePathProps) {
  return (
    <path
      d={d}
      id={`muscle-${muscle}`}
      className="muscle-path"
      fill="#262626"
      stroke="#404040"
      strokeWidth="0.5"
      onClick={() => onClick(muscle)}
      onMouseDown={() => onMouseDown(muscle)}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={() => onMouseDown(muscle)}
      onTouchEnd={() => {
        onMouseUp()
        onClick(muscle)
      }}
      style={{ transition: "fill 300ms ease" }}
    />
  )
}