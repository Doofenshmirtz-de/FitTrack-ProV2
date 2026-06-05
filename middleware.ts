import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimiter } from '@/lib/rate-limit'

// Rate limit exempt paths
const RATE_LIMIT_EXEMPT = [
  '/api/health',  // Health check endpoint
  '/_next',
  '/favicon',
  '/icons',
  '/manifest',
]

export async function middleware(request: NextRequest) {
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

  // Auth redirect for protected routes
  if (path.startsWith('/(app)')) {
    // Protected routes - handled by layout
    // Session check is done in updateSession
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
