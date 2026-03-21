import { useEffect } from 'react'
import { Platform, View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useClerk } from '@clerk/clerk-expo'
import * as WebBrowser from 'expo-web-browser'

// On native: dismisses the in-app browser and completes the OAuth session.
// On web: clerk.handleRedirectCallback() processes the OAuth params in the URL,
// activates the session, then we redirect to /mode.
export default function OAuthNativeCallback() {
  const router = useRouter()
  const clerk = useClerk()

  useEffect(() => {
    if (Platform.OS !== 'web') {
      WebBrowser.maybeCompleteAuthSession()
      return
    }

    async function handleWebCallback() {
      try {
        await clerk.handleRedirectCallback(
          {},
          (to: string) => {
            router.replace(to as '/')
            return Promise.resolve()
          },
        )
      } catch {
        router.replace('/')
      }
    }

    void handleWebCallback()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#7dd3fc', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#1e293b" />
    </View>
  )
}
