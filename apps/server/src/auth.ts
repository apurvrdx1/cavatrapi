import { createClerkClient, verifyToken } from '@clerk/backend'

// ─── Clerk client (for user lookups) ─────────────────────────────────────────
const clerkSecretKey = process.env['CLERK_SECRET_KEY']

if (!clerkSecretKey) {
  console.warn('[auth] CLERK_SECRET_KEY not set — JWT verification disabled')
}

const clerkClient = clerkSecretKey
  ? createClerkClient({ secretKey: clerkSecretKey })
  : null

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerifiedUser {
  userId: string
  username: string | null
}

// ─── Verification ─────────────────────────────────────────────────────────────

/**
 * Verify a Clerk JWT from the socket handshake auth.
 * Returns VerifiedUser if valid, null if missing/invalid or Clerk is unconfigured.
 *
 * Fails open: unauthenticated connections are allowed (guests).
 * Only authenticated users have their game sessions persisted to Supabase.
 */
export async function verifySocketToken(token: string | undefined): Promise<VerifiedUser | null> {
  if (!clerkSecretKey || !token) return null

  try {
    const payload = await verifyToken(token, { secretKey: clerkSecretKey })
    const userId = payload.sub

    if (!clerkClient) return { userId, username: null }

    // Fetch display name from Clerk
    const user = await clerkClient.users.getUser(userId)
    const username =
      user.username ??
      user.firstName ??
      user.emailAddresses[0]?.emailAddress ??
      null

    return { userId, username }
  } catch {
    // Token expired, invalid, or network error — treat as guest
    return null
  }
}
