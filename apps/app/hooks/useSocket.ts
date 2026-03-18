import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

// In dev, server runs on localhost:3001
const SERVER_URL = __DEV__ ? 'http://localhost:3001' : 'https://api.cavatrapi.com'

let sharedSocket: Socket | null = null

function getSocket(): Socket {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(SERVER_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return sharedSocket
}

export function useSocket() {
  const socketRef = useRef<Socket>(getSocket())

  useEffect(() => {
    const socket = socketRef.current
    if (!socket.connected) socket.connect()

    return () => {
      // Don't disconnect on unmount — keep alive for the session
    }
  }, [])

  return socketRef.current
}

export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect()
    sharedSocket = null
  }
}
