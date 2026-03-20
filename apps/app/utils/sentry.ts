// Native (iOS/Android) — loaded by Metro on non-web platforms
import * as Sentry from '@sentry/react-native'

export function initSentry(dsn: string | undefined) {
  Sentry.init({ dsn, tracesSampleRate: 0, enabled: !!dsn })
}
