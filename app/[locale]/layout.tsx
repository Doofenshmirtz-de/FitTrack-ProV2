import { notFound } from "next/navigation"
import { getMessages } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { locales, type Locale } from "@/i18n"
import { MonitoringProvider } from "@/components/providers/MonitoringProvider"
import { QueryProvider } from "@/components/providers/QueryProvider"
import "../globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!locales.includes(locale as Locale)) {
    notFound()
  }
  const messages = await getMessages({ locale: locale as Locale })

  return {
    title: messages.metadata.title as string,
    description: messages.metadata.description as string,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: messages.metadata.title as string,
    },
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const typedLocale = locale as Locale
  const messages = await getMessages({ locale: typedLocale })

  return (
    <html lang={typedLocale} className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} bg-background text-foreground antialiased min-h-screen font-sans`}>
        <NextIntlClientProvider locale={typedLocale} messages={messages}>
          <QueryProvider>
            <MonitoringProvider>
              {children}
            </MonitoringProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
