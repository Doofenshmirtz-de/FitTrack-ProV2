import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiting abstraction for Docker compatibility
// Uses Upstash Redis on Vercel, local Redis in Docker

let ratelimit: Ratelimit | null = null

function getRateLimiter(): Ratelimit {
  if (ratelimit) return ratelimit

  if (process.env.USE_LOCAL_REDIS === 'true') {
    // Local Redis for Docker environment
    // Note: This would need @upstash/redis compatibility layer
    // For now, fallback to no rate limiting in local Docker
    throw new Error('Local Redis not implemented - use Upstash or disable rate limiting')
  }

  // Upstash Redis for Vercel (default)
  const redis = Redis.fromEnv()
  
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 s'),
    analytics: true,
  })

  return ratelimit
}

export async function rateLimiter(ip: string): Promise<boolean> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // Skip if no Redis config (Docker without Redis)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn('Rate limiting disabled - no Redis configured')
    return true
  }

  try {
    const limiter = getRateLimiter()
    const { success } = await limiter.limit(ip)
    return success
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - allow request on error
    return true
  }
}
