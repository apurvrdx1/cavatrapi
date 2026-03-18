import Fastify from 'fastify'
import { Server } from 'socket.io'
import { registerSocketHandlers } from './socket.js'

const app = Fastify({ logger: true })

const io = new Server(app.server, {
  cors: { origin: '*' },
})

io.on('connection', (socket) => {
  app.log.info(`socket connected: ${socket.id}`)
  registerSocketHandlers(io, socket)
})

app.get('/healthcheck', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

const PORT = Number(process.env['PORT'] ?? 3001)

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
