import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const userId = url.searchParams.get("state")

  if (!code || !userId) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/health/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing Google Client credentials" }, { status: 500 })
  }

  try {
    // Exchange auth code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokens.error || "Failed to exchange token")
    }

    const supabase = await createClient()

    // Upsert into google_tokens table
    const { error } = await supabase.from("google_tokens").upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, // Only provided on first auth or prompt=consent
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scope: tokens.scope,
    }, { onConflict: 'user_id' })

    if (error) throw error

    // Redirect back to dashboard with success param
    return NextResponse.redirect(new URL("/dashboard?health_sync=success", request.url))
  } catch (error) {
    console.error("Health OAuth error:", error)
    return NextResponse.redirect(new URL("/dashboard?health_sync=error", request.url))
  }
}
