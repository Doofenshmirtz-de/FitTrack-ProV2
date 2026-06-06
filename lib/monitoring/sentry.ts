import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  if (process.env.NODE_ENV === 'development') return

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.1,
    
    // Setting this option to true will print useful information to the console
    debug: process.env.NODE_ENV === 'development',
    
    replaysOnErrorSampleRate: 1.0,
    
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: false,
        blockAllMedia: false,
        maskAllInputs: true,
      }),
    ],

    // Filter out sensitive errors
    beforeSend(event) {
      // Don't send errors from local development
      if (process.env.NODE_ENV === 'development') {
        return null
      }

      // Filter out specific errors
      if (event.exception?.values?.some(e => 
        e.value?.includes('ResizeObserver loop limit exceeded') ||
        e.value?.includes('Network request failed')
      )) {
        return null
      }

      // Sanitize user data from URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(
          /(token|password|secret)=([^&]+)/gi,
          '$1=[FILTERED]'
        )
      }

      return event
    },
  })
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level)
}

export function setUser(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    })
  } else {
    Sentry.setUser(null)
  }
}

export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  })
}
