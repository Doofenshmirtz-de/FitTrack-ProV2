"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Camera, Upload, X, Loader2, Save, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"

interface FoodItem {
  name: string
  confidence: number
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  portion_description: string
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export default function AddFoodPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<FoodItem[] | null>(null)
  const [mealType, setMealType] = useState<MealType>("snack")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      setImagePreview(evt.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const analyzeImage = async () => {
    if (!imagePreview) return
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const base64Data = imagePreview.split(",")[1]
      const mimeType = imagePreview.split(";")[0].split(":")[1]

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/food-vision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze image")
      }

      const data = await response.json()
      setResult(data.items || [])
    } catch (error) {
      console.error(error)
      alert("Fehler bei der Bildanalyse. Bitte erneut versuchen.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveItems = async () => {
    if (!result || result.length === 0) return
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session?.user?.id) throw new Error("No active session")

      const userId = sessionData.session.user.id

      for (const item of result) {
        const { error } = await supabase.from("food_logs").insert({
          user_id: userId,
          food_name: item.name,
          calories: item.calories,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
          meal_type: mealType,
          logged_at: new Date().toISOString(),
          ai_estimated: true,
          ai_confidence: item.confidence,
        } as never)
        if (error) throw error
      }

      alert(`${result.length} Mahlzeit(en) erfolgreich gespeichert!`)
      queryClient.invalidateQueries({ queryKey: ["food-logs", "today"] })
      queryClient.invalidateQueries({ queryKey: ["daily-summary", "today"] })
      router.push("/nutrition")
    } catch (_err) {
      console.error(_err)
      alert("Fehler beim Speichern der Mahlzeiten.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-4 pb-safe-bottom px-4 max-w-app mx-auto">
      <header className="flex items-center gap-4">
        <Link href="/nutrition">
          <Button variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-h2">Mahlzeit per Foto scannen</h1>
      </header>

      {!imagePreview ? (
        <Card className="border-dashed border-2 bg-background/50">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent-purple/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-accent-purple" />
            </div>
            <p className="text-foreground-secondary text-center max-w-[250px]">
              Mache ein Foto von deinem Teller, und die KI erkennt die Kalorien.
            </p>
            <div className="flex gap-4 mt-4">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageSelect}
              />
              <Button onClick={() => fileInputRef.current?.click()} size="lg">
                <Upload className="w-4 h-4 mr-2" />
                Foto auswählen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="relative rounded-xl overflow-hidden aspect-square bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={imagePreview} 
              alt="Food Preview" 
              className="w-full h-full object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col">
                <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                <p className="text-white font-medium">Analysiere Bild...</p>
              </div>
            )}
          </div>

          {!result && !isLoading && (
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setImagePreview(null)} className="flex-1">
                Neues Foto
              </Button>
              <Button onClick={analyzeImage} className="flex-1">
                <Sparkles className="w-4 h-4 mr-2" />
                Analysieren
              </Button>
            </div>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Erkannte Lebensmittel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-elevated rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-caption text-foreground-secondary">{item.portion_description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent-primary">{item.calories} kcal</p>
                      <p className="text-caption text-foreground-tertiary">P: {item.protein_g}g | C: {item.carbs_g}g | F: {item.fat_g}g</p>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 mt-4 border-t border-border space-y-4">
                  <div>
                    <label className="text-caption uppercase text-foreground-secondary tracking-wider block mb-2">Mahlzeit</label>
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        {v: "breakfast" as MealType, l: "Frühstück"}, 
                        {v: "lunch" as MealType, l: "Mittag"}, 
                        {v: "dinner" as MealType, l: "Abend"}, 
                        {v: "snack" as MealType, l: "Snack"}
                      ]).map(type => (
                        <button
                          key={type.v}
                          onClick={() => setMealType(type.v)}
                          className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                            mealType === type.v
                              ? "bg-accent-primary text-white"
                              : "bg-elevated text-foreground-secondary"
                          }`}
                        >
                          {type.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => {setResult(null); setImagePreview(null)}} className="flex-1">
                      Verwerfen
                    </Button>
                    <Button onClick={handleSaveItems} disabled={isLoading} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Speichern
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
