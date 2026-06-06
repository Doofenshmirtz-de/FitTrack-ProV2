import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health Check Endpoint
 * 
 * Used for monitoring, deployment checks, and debugging.
 * Returns status of critical services: Database, Gemini API quota.
 * 
 * GET /api/health
 */

export async function GET() {
  const startTime = Date.now()
  
  // Check database connection
  const dbStatus = await checkDatabase()
  
  // Check Gemini API quota (if key is configured)
  const geminiStatus = await checkGeminiQuota()
  
  // Calculate response time
  const responseTime = Date.now() - startTime
  
  const healthy = dbStatus.healthy && geminiStatus.healthy
  
  const status = {
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    checks: {
      database: dbStatus,
      gemini: geminiStatus,
    },
  }
  
  return NextResponse.json(status, {
    status: healthy ? 200 : 503,
  })
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<{ healthy: boolean; latency?: string; error?: string }> {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    
    // Simple health check query
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1)
    
    const latency = Date.now() - startTime
    
    if (error) {
      return {
        healthy: false,
        latency: `${latency}ms`,
        error: error.message,
      }
    }
    
    return {
      healthy: true,
      latency: `${latency}ms`,
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
    }
  }
}

/**
 * Check Gemini API availability
 * Note: This doesn't make an actual API call to avoid quota consumption,
 * just verifies the API key is configured
 */
async function checkGeminiQuota(): Promise<{ healthy: boolean; message: string }> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  
  if (!apiKey) {
    return {
      healthy: false,
      message: 'API key not configured',
    }
  }
  
  // Key is present, assume healthy
  // Real quota checking would require a test API call
  return {
    healthy: true,
    message: 'API key configured',
  }
}
