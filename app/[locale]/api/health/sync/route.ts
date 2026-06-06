import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  HealthPayloadSchema, 
  type HealthPayload,
  calculateSleepScore,
  calculateHRVScore,
  convertZoneMinutes,
} from '@/lib/health/syncValidator'

/**
 * Health Connect Sync Endpoint
 * 
 * Receives aggregated daily health data from the Android Companion App
 * or Trusted Web Activity (TWA). Validates, stores in daily_summaries
 * (UPSERT logic), and broadcasts Realtime events.
 * 
 * POST /api/health/sync
 * Authorization: Bearer <supabase_jwt_token>
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = await createClient()
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // 2. Parse and validate the payload
    const body = await request.json()
    const parsed = HealthPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: parsed.error.flatten(),
          message: 'Invalid health data format'
        },
        { status: 400 }
      )
    }

    const data: HealthPayload = parsed.data

    // 3. Prepare daily summary data
    const sleepScore = data.sleep ? calculateSleepScore(data.sleep) : null
    const hrvScore = data.heartRate?.hrvRmssd 
      ? calculateHRVScore(data.heartRate.hrvRmssd) 
      : null
    const zones = convertZoneMinutes(data.heartRate?.zoneMinutes)

    // 4. UPSERT into daily_summaries (ON CONFLICT UPDATE)
    const { data: summaryResult, error: summaryError } = await supabase
      .from('daily_summaries')
      .upsert({
        user_id: user.id,
        date: data.date,
        // Activity metrics
        steps: data.steps ?? null,
        calories_burned: data.caloriesBurned ?? null,
        active_minutes: data.activeMinutes ?? null,
        distance_km: data.distanceMeters ? data.distanceMeters / 1000 : null,
        floors_climbed: data.floorsClimbed ?? null,
        // Sleep data
        sleep_minutes_total: data.sleep?.totalMinutes ?? null,
        sleep_minutes_deep: data.sleep?.deepMinutes ?? null,
        sleep_minutes_rem: data.sleep?.remMinutes ?? null,
        sleep_minutes_light: data.sleep?.lightMinutes ?? null,
        sleep_minutes_awake: data.sleep?.awakeMinutes ?? null,
        sleep_score: sleepScore,
        // Heart rate data
        resting_heart_rate: data.heartRate?.resting ?? null,
        hrv_rmssd: data.heartRate?.hrvRmssd ?? null,
        hrv_score: hrvScore,
        hr_zone_1_minutes: zones.hrZone1,
        hr_zone_2_minutes: zones.hrZone2,
        hr_zone_3_minutes: zones.hrZone3,
        // Other
        spo2_avg: data.spo2 ?? null,
        weight_kg: data.weight ?? null,
        updated_at: new Date().toISOString(),
      } as never, {
        onConflict: 'user_id,date',
        ignoreDuplicates: false, // Update on conflict
      })
      .select()
      .single()

    if (summaryError) {
      console.error('Daily summary upsert error:', summaryError)
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to sync daily summary' },
        { status: 500 }
      )
    }

    // 5. Store snapshot in health_raw for audit/history
    // Store the complete payload as JSON for traceability
    const { error: rawError } = await supabase
      .from('health_raw')
      .insert({
        time: new Date().toISOString(),
        user_id: user.id,
        metric_type: 'daily_snapshot',
        value: JSON.stringify(data),
        source: 'health_connect',
      } as never)

    if (rawError) {
      // Log but don't fail - raw data is for audit only
      console.warn('Health raw insert error (non-critical):', rawError)
    }

    // 6. Update profile's last sync timestamp
    await supabase
      .from('profiles')
      .update({
        health_connect_last_sync: new Date().toISOString(),
        health_connect_enabled: true,
      } as never)
      .eq('id', user.id)

    // 7. Broadcast Realtime event
    const channel = supabase.channel('health_updates')
    await channel.send({
      type: 'broadcast',
      event: 'new_health_data',
      payload: {
        userId: user.id,
        date: data.date,
        summary: {
          steps: data.steps,
          caloriesBurned: data.caloriesBurned,
          sleepScore,
          hrvScore,
        },
      },
    })

    // 8. Return success response
    return NextResponse.json({
      success: true,
      synced: {
        date: data.date,
        summaryId: (summaryResult as { id?: string } | null)?.id,
        metrics: {
          steps: data.steps,
          calories: data.caloriesBurned,
          sleep: data.sleep?.totalMinutes,
          sleepScore,
          hrvScore,
        },
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Health sync error:', error)
    
    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: isDevelopment && error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 * Android Companion App / TWA may send OPTIONS first
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

/**
 * GET handler for health check
 * Used by Companion App to verify endpoint availability
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/health/sync',
    version: '1.0',
    timestamp: new Date().toISOString(),
  })
}
