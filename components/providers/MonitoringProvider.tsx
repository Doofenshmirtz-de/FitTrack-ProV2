'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initMonitoring, capturePageView, AnalyticsEvents, captureEvent } from '@/lib/monitoring'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useSupabaseUser()

  // Initialize monitoring on mount
  useEffect(() => {
    initMonitoring()
  }, [])

  // Track page views
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      capturePageView(url)
    }
  }, [pathname, searchParams])

  // Track user changes
  useEffect(() => {
    if (user) {
      captureEvent(AnalyticsEvents.USER_LOGIN, {
        userId: user.id,
      })
    }
  }, [user])

  return <>{children}</>
}
