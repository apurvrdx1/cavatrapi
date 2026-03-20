import * as SecureStore from 'expo-secure-store'

const STORAGE_KEY = 'cavatrapi_guest_username'
const WORDS = [
  'Knight', 'Bishop', 'Rook', 'Pawn', 'Castle',
  'Queen', 'King', 'Gambit', 'Checkmate', 'Endgame',
]

function generate(): string {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  const num = Math.floor(Math.random() * 90) + 10 // 10–99
  return `${word}${num}`
}

export async function getOrCreateGuestUsername(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(STORAGE_KEY)
    if (existing) return existing
  } catch {
    // SecureStore unavailable on web — fall through to generate
  }

  const username = generate()

  try {
    await SecureStore.setItemAsync(STORAGE_KEY, username)
  } catch {
    // On web, persist in localStorage instead
    try {
      localStorage.setItem(STORAGE_KEY, username)
    } catch {
      // Ignore — guest name will regenerate next visit
    }
  }

  return username
}
