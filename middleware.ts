import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimiter } from '@/lib/rate-limit'
import { locales, defaultLocale } from '@/i18n'

// Rate limit exempt paths
const RATE_LIMIT_EXEMPT = [
  '/api/health',  // Health check endpoint
  '/_next',
  '/favicon',
  '/icons',
  '/manifest',
]

function getLocale(request: NextRequest): string {
  // Check for locale cookie first
  const localeCookie = request.cookies.get('NEXT_LOCALE')?.value
  if (localeCookie && locales.includes(localeCookie as typeof locales[number])) {
    return localeCookie
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0].split('-')[0]
    if (locales.includes(preferred as typeof locales[number])) {
      return preferred
    }
  }

  return defaultLocale
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if pathname is missing locale
  const pathnameIsMissingLocale = locales.every(
    locale => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  // Handle locale redirect
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)
    
    // Skip API routes, static files, and Next.js internals
    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.includes('.') ||
      pathname.startsWith('/icons/') ||
      pathname.startsWith('/manifest') ||
      pathname.startsWith('/screenshots/')
    ) {
      // Continue with session/rate limiting for API routes
    } else {
      // Redirect to locale-prefixed path
      return NextResponse.redirect(
        new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url)
      )
    }
  }

  // First, update Supabase session
  const response = await updateSession(request)

  // Check if path should be rate limited
  const path = request.nextUrl.pathname
  const shouldRateLimit = !RATE_LIMIT_EXEMPT.some(exempt => 
    path.startsWith(exempt)
  )

  // Apply rate limiting to API routes
  if (shouldRateLimit && path.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1'
    const allowed = await rateLimiter(ip)

    if (!allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '1',
        }
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
