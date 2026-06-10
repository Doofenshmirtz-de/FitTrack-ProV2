"use client"

import { useState } from "react"
import { useTodayFoodLogs, useDeleteFoodLog, useUpdateFoodLog } from "@/lib/queries/foodLogs"
import { Trash2, Loader2, Utensils, Pencil, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"

export function FoodLogList() {
  const { data: logs, isLoading, isError } = useTodayFoodLogs()
  const deleteMutation = useDeleteFoodLog()
  const updateMutation = useUpdateFoodLog()

  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [editMealType, setEditMealType] = useState<string>("")

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

  const startEditing = (log: typeof logs[0]) => {
    setEditingLogId(log.id)
    setEditQuantity(log.quantity_g)
    setEditMealType(log.meal_type)
  }

  const saveEdit = (log: typeof logs[0]) => {
    if (!editQuantity || editQuantity <= 0) return

    // Calculate new macros proportionally
    const ratio = editQuantity / log.quantity_g
    const updates = {
      quantity_g: editQuantity,
      meal_type: editMealType as "breakfast" | "lunch" | "dinner" | "snack",
      calories: Math.round(log.calories * ratio),
      protein_g: Number((log.protein_g * ratio).toFixed(1)),
      carbs_g: Number((log.carbs_g * ratio).toFixed(1)),
      fat_g: Number((log.fat_g * ratio).toFixed(1)),
    }

    updateMutation.mutate({ id: log.id, updates }, {
      onSuccess: () => setEditingLogId(null)
    })
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
              {items.map((log) => {
                const isEditing = editingLogId === log.id

                return (
                  <div key={log.id} className={`flex items-center gap-3 p-3 bg-elevated rounded-lg transition-colors ${isEditing ? 'ring-2 ring-accent-primary' : ''}`}>
                    <div className="w-10 h-10 rounded bg-overlay flex items-center justify-center shrink-0">
                      <Utensils className="w-5 h-5 text-foreground-tertiary" />
                    </div>
                    
                    {isEditing ? (
                      <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <p className="font-medium text-foreground truncate">{log.food_name}</p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(Number(e.target.value))}
                            className="h-8 w-20 text-sm"
                          />
                          <span className="text-sm text-foreground-secondary">g / ml</span>
                          
                          <select
                            value={editMealType}
                            onChange={(e) => setEditMealType(e.target.value)}
                            className="h-8 rounded-md border border-overlay bg-elevated px-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent-primary flex-1"
                          >
                            <option value="breakfast">Frühstück</option>
                            <option value="lunch">Mittagessen</option>
                            <option value="dinner">Abendessen</option>
                            <option value="snack">Snack</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{log.food_name}</p>
                        <p className="text-body-sm text-foreground-secondary">
                          {log.quantity_g}g • {log.protein_g}g P • {log.carbs_g}g C • {log.fat_g}g F
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 shrink-0">
                      {!isEditing && <span className="font-semibold mr-2">{log.calories} kcal</span>}
                      
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(log)}
                            disabled={updateMutation.isPending}
                            className="p-2 text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                          >
                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setEditingLogId(null)}
                            disabled={updateMutation.isPending}
                            className="p-2 text-foreground-tertiary hover:bg-overlay rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(log)}
                            className="p-2 text-foreground-tertiary hover:text-foreground hover:bg-overlay rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Möchtest du diesen Eintrag wirklich löschen?")) {
                                deleteMutation.mutate(log.id)
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-foreground-tertiary hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
                          >
                            {deleteMutation.isPending && deleteMutation.variables === log.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
