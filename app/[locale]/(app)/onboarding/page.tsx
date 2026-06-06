"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, ChevronRight, ChevronLeft, Activity } from "lucide-react"

const fitnessGoals = [
  { value: "muscle_gain", label: "Muskelaufbau", description: "Fokus auf Kraft und Masse" },
  { value: "fat_loss", label: "Fettabbau", description: "Gewicht reduzieren und definieren" },
  { value: "maintenance", label: "Gewicht halten", description: "Aktuelles Gewicht beibehalten" },
  { value: "endurance", label: "Ausdauer", description: "Kardiovaskuläre Fitness verbessern" },
]

const activityLevels = [
  { value: "sedentary", label: "Wenig aktiv", description: "Bürojob, kaum Sport" },
  { value: "light", label: "Leicht aktiv", description: "1-2x Sport pro Woche" },
  { value: "moderate", label: "Moderat aktiv", description: "3-4x Sport pro Woche" },
  { value: "active", label: "Sehr aktiv", description: "5-6x Sport pro Woche" },
  { value: "very_active", label: "Extrem aktiv", description: "Täglich intensives Training" },
]

const sexOptions = [
  { value: "male", label: "Männlich" },
  { value: "female", label: "Weiblich" },
  { value: "other", label: "Divers" },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Step 1: Body data
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [sex, setSex] = useState<"male" | "female" | "other" | "">("")

  // Step 2: Goals
  const [fitnessGoal, setFitnessGoal] = useState("")
  const [activityLevel, setActivityLevel] = useState("")

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  const validateStep1 = () => {
    const heightNum = parseFloat(height)
    const weightNum = parseFloat(weight)
    const birthYear = new Date(birthDate).getFullYear()
    const currentYear = new Date().getFullYear()
    const age = currentYear - birthYear

    if (!height || heightNum < 100 || heightNum > 250) return false
    if (!weight || weightNum < 30 || weightNum > 300) return false
    if (!birthDate || age < 13 || age > 120) return false
    if (!sex) return false

    return true
  }

  const validateStep2 = () => {
    return fitnessGoal && activityLevel
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleComplete = async () => {
    setIsLoading(true)

    const supabase = createClient()

    // Calculate age from birth date
    const birthYear = new Date(birthDate).getFullYear()
    const currentYear = new Date().getFullYear()
    const age = currentYear - birthYear

    // Update profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        height_cm: parseFloat(height),
        weight_kg: parseFloat(weight),
        birth_date: birthDate,
        sex: (sex || null) as "male" | "female" | "other" | null,
        fitness_goal: (fitnessGoal || null) as "muscle_gain" | "fat_loss" | "maintenance" | "endurance" | null,
        activity_level: (activityLevel || null) as "sedentary" | "light" | "moderate" | "active" | "very_active" | null,
        onboarding_completed: true,
      } as never)
      .eq("id", user.id)

    if (error) {
      console.error("Error updating profile:", error)
      setIsLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col p-4 pt-safe-top">
      <div className="max-w-app w-full mx-auto flex-1 flex flex-col">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption text-foreground-secondary">
              Schritt {step} von {totalSteps}
            </span>
            <span className="text-caption text-foreground-secondary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Body Data */}
        {step === 1 && (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-h1">Dein Körper</CardTitle>
              <CardDescription>
                Diese Daten helfen uns, deine Kalorienziele zu berechnen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Größe (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    min="100"
                    max="250"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Gewicht (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    min="30"
                    max="300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Geburtsdatum</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label>Geschlecht</Label>
                <div className="grid grid-cols-3 gap-2">
                  {sexOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSex(option.value as any)}
                      className={`
                        p-3 rounded-lg border text-sm font-medium transition-colors
                        ${sex === option.value
                          ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                          : "border-border bg-elevated text-foreground-secondary hover:text-foreground"
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-h1">Deine Ziele</CardTitle>
              <CardDescription>
                Wähle deine Fitness-Ziele und Aktivitätslevel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Fitness-Ziel</Label>
                <div className="grid gap-2">
                  {fitnessGoals.map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setFitnessGoal(goal.value)}
                      className={`
                        p-4 rounded-lg border text-left transition-colors
                        ${fitnessGoal === goal.value
                          ? "border-accent-primary bg-accent-primary/10"
                          : "border-border bg-elevated hover:border-border-focus"
                        }
                      `}
                    >
                      <div className={`
                        font-medium mb-1
                        ${fitnessGoal === goal.value ? "text-accent-primary" : "text-foreground"}
                      `}>
                        {goal.label}
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        {goal.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Aktivitätslevel</Label>
                <div className="grid gap-2">
                  {activityLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setActivityLevel(level.value)}
                      className={`
                        p-4 rounded-lg border text-left transition-colors
                        ${activityLevel === level.value
                          ? "border-accent-primary bg-accent-primary/10"
                          : "border-border bg-elevated hover:border-border-focus"
                        }
                      `}
                    >
                      <div className={`
                        font-medium mb-1
                        ${activityLevel === level.value ? "text-accent-primary" : "text-foreground"}
                      `}>
                        {level.label}
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        {level.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Health Connect */}
        {step === 3 && (
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-h1">Health Connect</CardTitle>
              <CardDescription>
                Verbinde deine Gesundheitsdaten für automatisches Tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-accent-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-accent-secondary" />
                </div>
                <h3 className="text-h2 mb-2">Automatisches Tracking</h3>
                <p className="text-foreground-secondary max-w-sm mx-auto">
                  Mit Health Connect können wir Schritte, Schlaf, Herzfrequenz 
                  und mehr automatisch synchronisieren.
                </p>
              </div>

              <div className="bg-elevated rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Wird synchronisiert:</h4>
                <ul className="text-sm text-foreground-secondary space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-primary" />
                    Schritte und Aktivität
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-primary" />
                    Schlafdaten
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-primary" />
                    Herzfrequenz und HRV
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-primary" />
                    Verbrannte Kalorien
                  </li>
                </ul>
              </div>

              <p className="text-sm text-foreground-tertiary text-center">
                Du kannst Health Connect später in den Einstellungen einrichten.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              disabled={isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
          )}
          
          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              className="flex-1"
              disabled={step === 1 ? !validateStep1() : !validateStep2()}
            >
              Weiter
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                "Los geht's!"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
