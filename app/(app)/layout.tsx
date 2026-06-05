import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/shared/BottomNav"
import { QuickAddFAB } from "@/components/shared/QuickAddFAB"
import { OfflineBanner } from "@/components/shared/OfflineBanner"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <>
      <OfflineBanner />
      <main className="max-w-app mx-auto px-4 pt-safe-top pb-24">
        {children}
      </main>
      <QuickAddFAB />
      <BottomNav />
    </>
  )
}
