"use client"

import { useState } from "react"
import { Minus, Plus, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OFFProduct } from "@/types"
import { mapOFFToFoodLog } from "@/lib/food/openFoodFacts"

interface FoodEntryFormProps {
  product: OFFProduct
  onSave: (data: {
    food_name: string
    brand_name: string | null
    barcode: string
    openfoodfacts_id: string
    quantity_g: number
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
    fiber_g: number | null
    sugar_g: number | null
    sodium_mg: number | null
    meal_type: "breakfast" | "lunch" | "dinner" | "snack"
  }) => void
  onCancel: () => void
}

const MEAL_TYPES = [
  { value: "breakfast", label: "Frühstück" },
  { value: "lunch", label: "Mittagessen" },
  { value: "dinner", label: "Abendessen" },
  { value: "snack", label: "Snack" },
]

export function FoodEntryForm({ product, onSave, onCancel }: FoodEntryFormProps) {
  const [quantity, setQuantity] = useState(100)
  const [unit, setUnit] = useState<"g" | "ml" | "kg" | "Liter">("g")
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack")

  // Calculate actual grams based on unit
  const getMultiplier = (u: string) => {
    if (u === "kg" || u === "Liter") return 1000;
    return 1; // g and ml
  }
  
  const quantityInGrams = quantity * getMultiplier(unit)

  // Calculate macros based on quantity in grams
  const foodData = mapOFFToFoodLog(product, quantityInGrams)

  const adjustQuantity = (delta: number) => {
    // If unit is kg or Liter, delta should be smaller (e.g. 0.1 instead of 10)
    const isLargeUnit = unit === "kg" || unit === "Liter"
    const step = isLargeUnit ? (delta > 0 ? 0.1 : -0.1) : delta
    const minVal = isLargeUnit ? 0.1 : 10
    
    // We handle precision issues with rounding for large units
    const newQuantity = Math.max(minVal, isLargeUnit 
      ? Math.round((quantity + step) * 10) / 10 
      : quantity + step
    )
    setQuantity(newQuantity)
  }

  const handleSave = () => {
    onSave({
      ...foodData,
      meal_type: mealType,
    })
  }

  return (
    <div className="space-y-6">
      {/* Product info */}
      <div className="flex items-start gap-4">
        {product.image_front_small_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.image_front_small_url}
            alt={product.product_name}
            className="w-20 h-20 rounded-lg object-cover bg-elevated"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-elevated flex items-center justify-center">
            <span className="text-foreground-tertiary text-2xl">🍽️</span>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground">{foodData.food_name}</h3>
          {foodData.brand_name && (
            <p className="text-body-sm text-foreground-secondary">{foodData.brand_name}</p>
          )}
          <p className="text-caption text-foreground-tertiary mt-1">
            Barcode: {foodData.barcode}
          </p>
        </div>
      </div>

      {/* Meal type */}
      <div>
        <Label className="text-caption uppercase text-foreground-secondary tracking-wider">
          Mahlzeit
        </Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setMealType(type.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                mealType === type.value
                  ? "bg-accent-primary text-white"
                  : "bg-elevated text-foreground-secondary hover:text-foreground"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <Label className="text-caption uppercase text-foreground-secondary tracking-wider">
          Menge
        </Label>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustQuantity(-10)}
            disabled={quantity <= (unit === "kg" || unit === "Liter" ? 0.1 : 10)}
            className="shrink-0"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input
            type="number"
            value={quantity}
            step={unit === "kg" || unit === "Liter" ? "0.1" : "1"}
            onChange={(e) => setQuantity(Math.max(unit === "kg" || unit === "Liter" ? 0.1 : 1, parseFloat(e.target.value) || 0))}
            className="text-center font-bold flex-1"
          />
          <select 
            value={unit} 
            onChange={(e) => setUnit(e.target.value as "g" | "ml" | "kg" | "Liter")}
            className="flex h-10 w-24 items-center justify-between rounded-md border border-overlay bg-elevated px-3 py-2 text-sm ring-offset-background placeholder:text-foreground-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="kg">kg</option>
            <option value="Liter">Liter</option>
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustQuantity(10)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Macros preview */}
      <div className="bg-elevated rounded-xl p-4">
        <h4 className="text-caption uppercase text-foreground-secondary tracking-wider mb-3">
          Nährwerte
        </h4>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-h3 font-bold text-foreground">{Math.round(foodData.calories)}</p>
            <p className="text-caption text-foreground-secondary">kcal</p>
          </div>
          <div>
            <p className="text-h3 font-bold text-foreground">{foodData.protein_g.toFixed(1)}g</p>
            <p className="text-caption text-foreground-secondary">Protein</p>
          </div>
          <div>
            <p className="text-h3 font-bold text-foreground">{foodData.carbs_g.toFixed(1)}g</p>
            <p className="text-caption text-foreground-secondary">Kohlenhydrate</p>
          </div>
          <div>
            <p className="text-h3 font-bold text-foreground">{foodData.fat_g.toFixed(1)}g</p>
            <p className="text-caption text-foreground-secondary">Fett</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Abbrechen
        </Button>
        <Button onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Speichern
        </Button>
      </div>
    </div>
  )
}
