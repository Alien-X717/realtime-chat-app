import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import Redis from 'ioredis'

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = Number(process.env.PORT) || 3000

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === 'production'
          ? process.env.NEXT_PUBLIC_APP_URL
          : 'http://localhost:3000',
      credentials: true,
    },
  })

  // Set up Redis adapter for horizontal scaling
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  const pubClient = new Redis(redisUrl)
  const subClient = pubClient.duplicate()

  Promise.all([pubClient, subClient]).then(() => {
    io.adapter(createAdapter(pubClient, subClient))
    console.log('✓ Socket.io Redis adapter initialized')
  })

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(`✓ Client connected: ${socket.id}`)

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`✗ Client disconnected: ${socket.id}, reason: ${reason}`)
    })

    // Add more socket event handlers here as we build features
  })

  // Start server
  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`✓ Ready on http://${hostname}:${port}`)
      console.log(`✓ Socket.io server ready`)
    })
})
