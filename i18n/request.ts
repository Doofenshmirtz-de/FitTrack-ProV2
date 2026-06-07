import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from './index'

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming `locale` parameter is valid
  const locale = await requestLocale
  const typedLocale = locale as Locale
  if (!locale || !locales.includes(typedLocale)) notFound()

  return {
    locale: typedLocale,
    messages: (await import(`../messages/${typedLocale}.json`)).default
  }
})
