import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from './index'

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const typedLocale = locale as Locale
  if (!locales.includes(typedLocale)) notFound()

  return {
    locale: typedLocale,
    messages: (await import(`../messages/${typedLocale}.json`)).default
  }
})
