// Web — loaded by Metro/webpack on web platform only
import * as Sentry from '@sentry/react'

export function initSentry(dsn: string | undefined) {
  Sentry.init({ dsn, tracesSampleRate: 0, enabled: !!dsn })
}
