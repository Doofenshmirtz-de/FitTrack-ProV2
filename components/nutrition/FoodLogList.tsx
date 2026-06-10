"use client"

import { useTodayFoodLogs, useDeleteFoodLog } from "@/lib/queries/foodLogs"
import { Trash2, Loader2, Utensils } from "lucide-react"

export function FoodLogList() {
  const { data: logs, isLoading, isError } = useTodayFoodLogs()
  const deleteMutation = useDeleteFoodLog()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-foreground-secondary">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Lade Mahlzeiten...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-8 text-status-error">
        Fehler beim Laden der Mahlzeiten.
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-foreground-secondary">
        <p>Noch keine Mahlzeiten geloggt</p>
        <p className="text-body-sm mt-1">
          Füge deine erste Mahlzeit oben hinzu
        </p>
      </div>
    )
  }

  // Group by meal_type
  const groupedLogs = {
    breakfast: logs.filter(l => l.meal_type === "breakfast"),
    lunch: logs.filter(l => l.meal_type === "lunch"),
    dinner: logs.filter(l => l.meal_type === "dinner"),
    snack: logs.filter(l => l.meal_type === "snack"),
  }

  const mealTypeLabels: Record<string, string> = {
    breakfast: "Frühstück",
    lunch: "Mittagessen",
    dinner: "Abendessen",
    snack: "Snacks",
  }

  return (
    <div className="space-y-6">
      {(Object.entries(groupedLogs) as [string, typeof logs][]).map(([type, items]) => {
        if (items.length === 0) return null

        const totalCals = items.reduce((sum, item) => sum + item.calories, 0)

        return (
          <div key={type} className="space-y-3">
            <div className="flex justify-between items-center text-body-sm font-medium text-foreground-secondary uppercase tracking-wider mb-2">
              <span>{mealTypeLabels[type]}</span>
              <span>{totalCals} kcal</span>
            </div>

            <div className="space-y-2">
              {items.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
                  <div className="w-10 h-10 rounded bg-overlay flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5 text-foreground-tertiary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{log.food_name}</p>
                    <p className="text-body-sm text-foreground-secondary">
                      {log.quantity_g}g • {log.protein_g}g P • {log.carbs_g}g C • {log.fat_g}g F
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold">{log.calories} kcal</span>
                    <button
                      onClick={() => {
                        if (confirm("Möchtest du diesen Eintrag wirklich löschen?")) {
                          deleteMutation.mutate(log.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-2 text-foreground-tertiary hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
