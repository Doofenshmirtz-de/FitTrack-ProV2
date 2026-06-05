import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single()

  if (!profile?.onboarding_completed) {
    redirect("/onboarding")
  }

  // Fetch today's data
  const today = new Date().toISOString().split("T")[0]
  
  const { data: dailySummary } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single()

  return (
    <div className="space-y-6 pt-4">
      <header>
        <h1 className="text-h1">Dashboard</h1>
        <p className="text-foreground-secondary">
          {new Date().toLocaleDateString("de-DE", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-caption text-foreground-secondary uppercase">
              Recovery Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-display text-accent-primary">
              {dailySummary?.sleep_score ?? "--"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-caption text-foreground-secondary uppercase">
              Schritte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-display">
              {dailySummary?.steps?.toLocaleString() ?? "--"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-caption text-foreground-secondary uppercase">
              Kalorien
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-display">
              {dailySummary?.calories_burned?.toLocaleString() ?? "--"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-caption text-foreground-secondary uppercase">
              Schlaf (h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-display">
              {dailySummary?.sleep_minutes_total 
                ? (dailySummary.sleep_minutes_total / 60).toFixed(1) 
                : "--"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Willkommen zurück!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground-secondary">
            Dein Dashboard wird bald mit mehr Daten gefüllt sein. 
            Starte ein Workout oder logge deine erste Mahlzeit.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
