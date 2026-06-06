import type { Locale } from "@/i18n"

export default function AuthLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: Locale }
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
