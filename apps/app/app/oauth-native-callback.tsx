import { useEffect } from 'react'
import * as WebBrowser from 'expo-web-browser'

// Clerk OAuth redirect target — completes the native WebBrowser auth session.
// On web this is a no-op; on native it dismisses the in-app browser.
export default function OAuthNativeCallback() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession()
  }, [])

  return null
}
