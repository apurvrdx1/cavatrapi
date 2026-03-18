import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'

// In dev, server runs on localhost:3001. In prod, the Fly.io URL.
const SERVER_URL = __DEV__ ? 'http://localhost:3001' : 'https://cavatrapi-server.fly.dev'

// Reconnect config — generous attempts + delay to handle Fly.io cold wake (~3-5s)
const RECONNECT_ATTEMPTS = 10
const RECONNECT_DELAY_MS = 2000

let sharedSocket: Socket | null = null

function getSocket(token: string | null): Socket {
  if (sharedSocket && sharedSocket.connected) return sharedSocket

  // Disconnect stale socket if token changed or it's disconnected
  if (sharedSocket) {
    sharedSocket.disconnect()
    sharedSocket = null
  }

  sharedSocket = io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: RECONNECT_ATTEMPTS,
    reconnectionDelay: RECONNECT_DELAY_MS,
    reconnectionDelayMax: 8000,
    // Clerk JWT passed as socket.io handshake auth — server verifies on connection
    auth: token ? { token } : {},
  })

  return sharedSocket
}

export function useSocket() {
  const token = useAuthStore((s) => s.token)
  const socketRef = useRef<Socket>(getSocket(token))

  useEffect(() => {
    // Re-create socket if token changed (user signed in / out)
    const current = socketRef.current
    const currentAuth = current.auth as Record<string, unknown>
    const needsReconnect = !current.connected || currentAuth['token'] !== token
    if (needsReconnect) {
      current.disconnect()
      sharedSocket = null
      socketRef.current = getSocket(token)
    }

    if (!socketRef.current.connected) {
      socketRef.current.connect()
    }

    return () => {
      // Keep socket alive across component unmounts
    }
  }, [token])

  return socketRef.current
}

export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect()
    sharedSocket = null
  }
}
