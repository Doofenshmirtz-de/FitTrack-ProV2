// Monitoring exports
export { initSentry, captureException, captureMessage, setUser as setSentryUser, addBreadcrumb } from './sentry'
export { 
  initPostHog, 
  captureEvent, 
  identifyUser, 
  resetUser, 
  capturePageView,
  AnalyticsEvents 
} from './posthog'

// Combined init function
export function initMonitoring() {
  // Import dynamically to avoid SSR issues
  if (typeof window !== 'undefined') {
    import('./sentry').then(({ initSentry }) => initSentry())
    import('./posthog').then(({ initPostHog }) => initPostHog())
  }
}
