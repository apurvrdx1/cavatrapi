import Fastify from 'fastify'
import { Server } from 'socket.io'

const app = Fastify({ logger: true })

// Socket.io attaches directly to the underlying Node http server (no Fastify v5 plugin needed)
const io = new Server(app.server, {
  cors: { origin: '*' },
})

io.on('connection', (socket) => {
  app.log.info(`socket connected: ${socket.id}`)
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
