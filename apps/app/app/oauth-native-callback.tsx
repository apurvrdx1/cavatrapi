import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import * as WebBrowser from 'expo-web-browser'

// On native: dismisses the in-app browser and completes the OAuth session.
// On web: Clerk's ClerkProvider auto-handles the redirect callback from the URL;
// we just wait for isSignedIn and redirect to /mode.
export default function OAuthNativeCallback() {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (Platform.OS !== 'web') {
      WebBrowser.maybeCompleteAuthSession()
      return
    }
    // Web: ClerkProvider has processed the OAuth params by now.
    // isSignedIn flips to true → redirect to mode screen.
    if (isSignedIn) {
      router.replace('/mode')
    }
  }, [isSignedIn])

  return null
}
