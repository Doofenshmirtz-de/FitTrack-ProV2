"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { Profile } from "@/types"
import { 
  LogOut, 
  Settings, 
  User, 
  Activity,
  Database,
  Wifi,
  AlertCircle,
  ChevronRight
} from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      setProfile(data)
      setIsLoading(false)
    }

    loadProfile()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pt-4">
        <div className="h-8 w-48 bg-elevated rounded animate-pulse" />
        <div className="h-32 bg-elevated rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-4">
      <header>
        <h1 className="text-h1">Profil</h1>
      </header>

      {/* User Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-accent-primary/10 text-accent-primary text-xl">
                {profile?.display_name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-h2">{profile?.display_name || "User"}</h2>
              <p className="text-foreground-secondary">
                {profile?.fitness_goal ? (
                  <>
                    Ziel: {profile.fitness_goal === "muscle_gain" && "Muskelaufbau"}
                    {profile.fitness_goal === "fat_loss" && "Fettabbau"}
                    {profile.fitness_goal === "maintenance" && "Gewicht halten"}
                    {profile.fitness_goal === "endurance" && "Ausdauer"}
                  </>
                ) : (
                  "Kein Ziel gesetzt"
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-h3">{profile?.weight_kg || "--"}</div>
              <div className="text-caption text-foreground-secondary">kg</div>
            </div>
            <div className="text-center border-x border-border">
              <div className="text-h3">{profile?.height_cm || "--"}</div>
              <div className="text-caption text-foreground-secondary">cm</div>
            </div>
            <div className="text-center">
              <div className="text-h3">
                {profile?.birth_date 
                  ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
                  : "--"
                }
              </div>
              <div className="text-caption text-foreground-secondary">Jahre</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-elevated transition-colors">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-foreground-secondary" />
              <span>Kontodaten</span>
            </div>
            <ChevronRight className="h-4 w-4 text-foreground-tertiary" />
          </button>

          <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-elevated transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-foreground-secondary" />
              <span>Ziele anpassen</span>
            </div>
            <ChevronRight className="h-4 w-4 text-foreground-tertiary" />
          </button>
        </CardContent>
      </Card>

      {/* Debug Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h2 text-foreground-secondary">Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg bg-elevated">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-accent-primary" />
              <span>Supabase Realtime</span>
            </div>
            <span className="text-caption text-accent-primary">Verbunden</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-elevated">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-accent-primary" />
              <span>Health Connect</span>
            </div>
            <span className="text-caption text-accent-primary">
              {profile?.health_connect_enabled ? "Verbunden" : "Nicht verbunden"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-elevated">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-accent-primary" />
              <span>Queue Status</span>
            </div>
            <span className="text-caption text-accent-primary">0 Items</span>
          </div>

          <Button variant="outline" className="w-full mt-2">
            Manuelles Reconnect
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button 
        variant="outline" 
        className="w-full text-accent-danger border-accent-danger/20 hover:bg-accent-danger/10"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Abmelden
      </Button>
    </div>
  )
}
