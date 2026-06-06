"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent-danger/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-accent-danger" />
          </div>
          <CardTitle className="text-h1">Fehler</CardTitle>
          <CardDescription>
            Bei der Authentifizierung ist ein Fehler aufgetreten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground-secondary text-center">
            Bitte versuche es erneut oder kontaktiere den Support, wenn das Problem weiterhin besteht.
          </p>
          <div className="flex gap-2">
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full">
                Zum Login
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">
                Startseite
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
