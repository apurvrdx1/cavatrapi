import { Resend } from 'resend'

// ─── Client ───────────────────────────────────────────────────────────────────
const apiKey = process.env['RESEND_API_KEY']
const FROM = process.env['RESEND_FROM'] ?? 'Cavatrapi <noreply@cavatrapi.com>'

const resend = apiKey ? new Resend(apiKey) : null

function isConfigured(): boolean {
  return !!resend
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface GameResultEmailInput {
  to: string
  username: string
  won: boolean
  opponentName: string
  mode: string
  moveCount: number
}

/**
 * Send a post-game result email.
 * Fire-and-forget safe: returns void, logs on error.
 */
export async function sendGameResultEmail(input: GameResultEmailInput): Promise<void> {
  if (!resend || !isConfigured()) return

  const subject = input.won
    ? `You defeated ${input.opponentName}! 🏆`
    : `Good game against ${input.opponentName}`

  const html = `
    <h2>${input.won ? 'Victory!' : 'Game Over'}</h2>
    <p>Hi ${input.username},</p>
    <p>
      You ${input.won ? 'won' : 'lost'} a <strong>${input.mode.replace('_', ' ')}</strong> game
      against <strong>${input.opponentName}</strong> in ${input.moveCount} moves.
    </p>
    <p><a href="https://cavatrapi.com">Play again →</a></p>
  `

  const { error } = await resend.emails.send({ from: FROM, to: input.to, subject, html })
  if (error) console.error('[email] sendGameResultEmail failed:', error)
}
