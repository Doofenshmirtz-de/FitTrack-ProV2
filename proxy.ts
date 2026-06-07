import { type NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/i18n'

function getLocale(request: NextRequest): string {
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (localeCookie && locales.includes(localeCookie as typeof locales[number])) {
    return localeCookie
  }

  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0].split('-')[0]
    if (locales.includes(preferred as typeof locales[number])) {
      return preferred
    }
  }

  return defaultLocale
}

/**
 * Next.js 16 proxy.ts - Synchronous edge routing
 * 
 * IMPORTANT: Next.js 16 proxy.ts can only perform:
 * - rewrites (NextResponse.rewrite)
 * - redirects (NextResponse.redirect)  
 * - header modifications (request.headers, response.headers)
 * 
 * NO async operations, NO response body modifications, NO database calls
 * 
 * Authentication is handled by:
 * 1. Route handlers (API routes) - server-side auth checks
 * 2. Server Components - auth via cookies
 * 3. Client Components - auth via Supabase client
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if pathname is missing locale
  const pathnameIsMissingLocale = locales.every(
    locale => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Add x-next-intl-locale header for next-intl
  const locale = getLocale(request)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-next-intl-locale', locale)

  // Handle locale redirect
  if (pathnameIsMissingLocale) {
    // Skip API routes, static files, and Next.js internals
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.includes('.') ||
      pathname.startsWith('/icons/') ||
      pathname.startsWith('/manifest') ||
      pathname.startsWith('/screenshots/')
    ) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        }
      })
    }
    
    // Redirect to locale-prefixed path
    return NextResponse.redirect(
      new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url)
    )
  }

  // Continue to next handler with the header
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
