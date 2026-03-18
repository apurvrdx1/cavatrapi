import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="lobby/index" options={{ headerShown: false }} />
      <Stack.Screen name="game/[gameId]" options={{ headerShown: false }} />
      <Stack.Screen name="assets/index" options={{ title: 'Asset Pack' }} />
    </Stack>
  )
}
