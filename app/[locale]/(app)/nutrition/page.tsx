"use client"

import { useState, Suspense, lazy } from "react"
import { Plus, Barcode, Search, Camera, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FoodSearch } from "@/components/nutrition/FoodSearch"
import { FoodEntryForm } from "@/components/nutrition/FoodEntryForm"
import type { OFFProduct } from "@/types"

// Dynamically import BarcodeScanner to avoid prerendering issues
const BarcodeScanner = lazy(() => import("@/components/nutrition/BarcodeScanner").then(mod => ({ default: mod.BarcodeScanner })))

export default function NutritionPage() {
  const [showScanner, setShowScanner] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<OFFProduct | null>(null)

  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false)
    // Fetch product details
    const { searchByBarcode } = await import("@/lib/food/openFoodFacts")
    const product = await searchByBarcode(barcode)
    if (product) {
      setSelectedProduct(product)
    }
  }

  const handleProductSelect = (product: OFFProduct) => {
    setShowSearch(false)
    setSelectedProduct(product)
  }

  const handleSaveFood = async (data: {
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
  }) => {
    // TODO: Save to Supabase
    console.log("Saving food:", data)
    setSelectedProduct(null)
  }

  // Summary data (placeholder - will come from useDashboardData)
  const consumed = 0
  const protein = 0
  const carbs = 0
  const fat = 0
  const target = 2500

  return (
    <div className="space-y-6 pt-4 pb-safe-bottom">
      <header>
        <h1 className="text-h1">Ernährung</h1>
        <p className="text-foreground-secondary">{today}</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-caption text-foreground-secondary uppercase">
              Kalorien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2">{consumed} / {target}</div>
            <div className="text-caption text-foreground-tertiary">kcal</div>
            {/* Progress bar */}
            <div className="mt-2 h-2 bg-overlay rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-primary rounded-full transition-all"
                style={{ width: `${Math.min((consumed / target) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-caption text-foreground-secondary uppercase">
              Makros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex justify-between text-body-sm">
              <span className="text-foreground-secondary">Protein</span>
              <span className="font-medium">{protein}g</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-foreground-secondary">Kohlenhydrate</span>
              <span className="font-medium">{carbs}g</span>
            </div>
            <div className="flex justify-between text-body-sm">
              <span className="text-foreground-secondary">Fett</span>
              <span className="font-medium">{fat}g</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Food Options */}
      {!selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h2">Mahlzeit hinzufügen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => setShowScanner(true)}
              className="w-full flex items-center gap-4 p-4 bg-elevated hover:bg-overlay rounded-lg transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                <Barcode className="w-6 h-6 text-accent-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Barcode scannen</p>
                <p className="text-body-sm text-foreground-secondary">
                  Schnell mit Kamera scannen
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary" />
            </button>

            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-4 p-4 bg-elevated hover:bg-overlay rounded-lg transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-accent-secondary/10 flex items-center justify-center">
                <Search className="w-6 h-6 text-accent-secondary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Produkt suchen</p>
                <p className="text-body-sm text-foreground-secondary">
                  In Open Food Facts Datenbank
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary" />
            </button>

            <Link href="/nutrition/add?mode=photo">
              <div className="w-full flex items-center gap-4 p-4 bg-elevated hover:bg-overlay rounded-lg transition-colors text-left">
                <div className="w-12 h-12 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-accent-purple" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Foto analysieren</p>
                  <p className="text-body-sm text-foreground-secondary">
                    KI erkennt dein Gericht
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground-tertiary" />
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Barcode Scanner */}
      {showScanner && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-white">Kamera wird initialisiert...</div>}>
          <BarcodeScanner
            onScan={handleBarcodeScan}
            onClose={() => setShowScanner(false)}
          />
        </Suspense>
      )}

      {/* Food Search */}
      {showSearch && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader className="sticky top-0 bg-elevated z-10 flex-row items-center justify-between">
            <CardTitle className="text-h2">Produkt suchen</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)}>
              Schließen
            </Button>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center py-8 text-foreground-secondary">Suche wird geladen...</div>}>
              <FoodSearch onSelect={handleProductSelect} />
            </Suspense>
          </CardContent>
        </Card>
      )}

      {/* Food Entry Form */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="text-h2">Produktdetails</CardTitle>
          </CardHeader>
          <CardContent>
            <FoodEntryForm
              product={selectedProduct}
              onSave={handleSaveFood}
              onCancel={() => setSelectedProduct(null)}
            />
          </CardContent>
        </Card>
      )}

      {/* Today's Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Heutige Mahlzeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-foreground-secondary">
            <p>Noch keine Mahlzeiten geloggt</p>
            <p className="text-body-sm mt-1">
              Füge deine erste Mahlzeit oben hinzu
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
