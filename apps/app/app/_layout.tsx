import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Cavatrapi' }} />
      <Stack.Screen name="game/[gameId]" options={{ title: 'Game', headerShown: false }} />
      <Stack.Screen name="lobby/index" options={{ title: 'Find a Match' }} />
      <Stack.Screen name="profile/index" options={{ title: 'Profile' }} />
    </Stack>
  )
}
