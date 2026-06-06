// i18n constants and types
export const locales = ['de', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'de'
