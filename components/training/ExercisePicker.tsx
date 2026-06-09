"use client"

import { useState, useEffect } from "react"
import { Search, X, Dumbbell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Exercise {
  id: string
  name: string
  name_de: string | null
  category: string
  equipment: string | null
}

interface ExercisePickerProps {
  onClose: () => void
  onSelect: (exerciseId: string, name: string) => void
}

export function ExercisePicker({ onClose, onSelect }: ExercisePickerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Initialize Supabase client inside the component
  const supabase = createClient()

  useEffect(() => {
    async function fetchExercises() {
      setIsLoading(true)
      let query = supabase
        .from('exercises')
        .select('id, name, name_de, category, equipment')
        .order('name', { ascending: true })
      
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,name_de.ilike.%${searchQuery}%`)
      }
      
      const { data, error } = await query.limit(50)
      if (!error && data) {
        setExercises(data as Exercise[])
      }
      setIsLoading(false)
    }

    const timer = setTimeout(fetchExercises, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, supabase])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background/95 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
          <Input 
            autoFocus
            className="w-full pl-9" 
            placeholder="Übung suchen..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <p className="text-center text-foreground-secondary mt-10">Lade Übungen...</p>
        ) : exercises.length === 0 ? (
          <p className="text-center text-foreground-secondary mt-10">Keine Übungen gefunden</p>
        ) : (
          exercises.map((ex) => (
            <Card 
              key={ex.id} 
              className="cursor-pointer hover:border-accent-primary transition-colors"
              onClick={() => onSelect(ex.id, ex.name_de || ex.name)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{ex.name_de || ex.name}</h3>
                  <p className="text-caption text-foreground-secondary">
                    {ex.category} {ex.equipment ? `• ${ex.equipment}` : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
