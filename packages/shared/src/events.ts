// ─── Socket.io event name constants ──────────────────────────────────────────
// Used by both server and app to prevent string literal drift.

// Client → Server
export const SOCKET_EVENTS = {
  JOIN_GAME: 'join_game',
  SUBMIT_MOVE: 'submit_move',
  REQUEST_AI_MOVE: 'request_ai_move',
  RESIGN: 'resign',
  CREATE_PRIVATE_GAME: 'create_private_game',
  JOIN_PRIVATE_GAME: 'join_private_game',
  LEAVE_QUEUE: 'leave_queue',
} as const

// Server → Client
export const SERVER_EVENTS = {
  GAME_STATE: 'game_state',
  MOVE_ACCEPTED: 'move_accepted',
  MOVE_REJECTED: 'move_rejected',
  GAME_OVER: 'game_over',
  TURN_STARTED: 'turn_started',
  GAME_CREATED: 'game_created',
  OPPONENT_DISCONNECTED: 'opponent_disconnected',
  OPPONENT_RECONNECTED: 'opponent_reconnected',
  PRIVATE_GAME_CREATED: 'private_game_created',
  PRIVATE_GAME_ERROR: 'private_game_error',
} as const
