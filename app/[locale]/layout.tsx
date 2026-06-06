import { notFound } from "next/navigation"
import { getMessages } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { locales, type Locale } from "@/i18n"
import { MonitoringProvider } from "@/components/providers/MonitoringProvider"
import "../globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

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
      <body className={`${inter.variable} ${jetbrainsMono.variable} bg-background text-foreground antialiased min-h-screen font-sans`}>
        <NextIntlClientProvider locale={typedLocale} messages={messages}>
          <MonitoringProvider>
            {children}
          </MonitoringProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
