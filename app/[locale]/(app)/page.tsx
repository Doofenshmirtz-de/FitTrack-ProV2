"use client"

import { RecoveryCard } from "@/components/dashboard/RecoveryRing"
import { StrainCard } from "@/components/dashboard/StrainGauge"
import { CalorieCard } from "@/components/dashboard/CalorieRings"
import { StepsWidget } from "@/components/dashboard/StepsWidget"
import { SleepWidget } from "@/components/dashboard/SleepWidget"
import { useDashboardData } from "@/lib/queries/dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const {
    isLoading,
    isError,
    summary,
    food,
    recovery,
    strain,
    calorieTarget,
  } = useDashboardData()

  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  if (isError) {
    return (
      <div className="space-y-6 pt-4">
        <header>
          <h1 className="text-h1">Dashboard</h1>
          <p className="text-foreground-secondary">{today}</p>
        </header>
        <div className="p-4 bg-accent-danger/10 border border-accent-danger/20 rounded-lg">
          <p className="text-accent-danger">
            Fehler beim Laden der Daten. Bitte versuche es später erneut.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4 pb-safe-bottom">
      <header>
        <h1 className="text-h1">Dashboard</h1>
        <p className="text-foreground-secondary">{today}</p>
      </header>

      {/* Main Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <RecoveryCard 
              score={recovery.score} 
              isEstimated={recovery.isEstimated} 
            />
            <StrainCard 
              score={strain.score} 
            />
          </>
        )}
      </div>

      {/* Nutrition & Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </>
        ) : (
          <>
            <CalorieCard
              consumed={Math.round(food.calories)}
              burned={summary?.calories_burned || 0}
              target={calorieTarget}
            />
            <StepsWidget
              steps={summary?.steps || 0}
              goal={10000}
            />
          </>
        )}
      </div>

      {/* Sleep */}
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        <SleepWidget
          totalMinutes={summary?.sleep_minutes_total || 0}
          score={summary?.sleep_score}
          stages={
            summary?.sleep_minutes_total
              ? {
                  deep: summary.sleep_minutes_deep || 0,
                  rem: summary.sleep_minutes_rem || 0,
                  light: summary.sleep_minutes_light || 0,
                  awake: summary.sleep_minutes_awake || 0,
                }
              : undefined
          }
        />
      )}

      {/* Empty State Message */}
      {!isLoading && !summary && (
        <div className="bg-elevated rounded-xl p-6 border border-border text-center">
          <p className="text-foreground-secondary mb-2">
            Noch keine Health-Daten vorhanden
          </p>
          <p className="text-body-sm text-foreground-tertiary">
            Verbinde Health Connect in den Einstellungen, um automatisch Daten zu synchronisieren.
          </p>
        </div>
      )}
    </div>
  )
}
