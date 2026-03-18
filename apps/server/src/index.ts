import Fastify from 'fastify'
import cors from '@fastify/cors'
import { Server } from 'socket.io'
import { registerSocketHandlers } from './socket.js'
import { verifySocketToken } from './auth.js'

const app = Fastify({ logger: true })

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:8081')
  .split(',')
  .map((o) => o.trim())

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'), false)
    }
  },
})

const io = new Server(app.server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
})

io.on('connection', async (socket) => {
  // Verify Clerk JWT — fails open (guest) if token is absent or invalid
  const token = socket.handshake.auth['token'] as string | undefined
  const user = await verifySocketToken(token)

  app.log.info(`socket connected: ${socket.id} userId=${user?.userId ?? 'guest'}`)
  registerSocketHandlers(io, socket, user)
})

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

const PORT = Number(process.env['PORT'] ?? 3001)

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
