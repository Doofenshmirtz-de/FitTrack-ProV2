"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine)

    const handleOffline = () => setIsOffline(true)
    const handleOnline = () => setIsOffline(false)

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-accent-warning text-black px-4 py-2">
      <div className="max-w-app mx-auto flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Offline - Daten werden lokal gespeichert</span>
      </div>
    </div>
  )
}
