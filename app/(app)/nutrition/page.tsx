"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Utensils } from "lucide-react"

export default function NutritionPage() {
  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="space-y-6 pt-4">
      <header>
        <h1 className="text-h1">Ernährung</h1>
        <p className="text-foreground-secondary">{today}</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-caption text-foreground-secondary uppercase">
              Kalorien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2">0 / 2500</div>
            <div className="text-caption text-foreground-tertiary">kcal</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-caption text-foreground-secondary uppercase">
              Protein
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2">0 / 150</div>
            <div className="text-caption text-foreground-tertiary">g</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-caption text-foreground-secondary uppercase">
              Kohlenhydrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h2">0 / 300</div>
            <div className="text-caption text-foreground-tertiary">g</div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center mx-auto mb-4">
            <Utensils className="h-8 w-8 text-foreground-tertiary" />
          </div>
          <h3 className="text-h2 mb-2">Noch keine Mahlzeiten</h3>
          <p className="text-foreground-secondary mb-6 max-w-xs mx-auto">
            Füge deine erste Mahlzeit hinzu, um deine Makronährstoffe zu tracken.
          </p>
          <Link href="/nutrition/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Mahlzeit hinzufügen
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
