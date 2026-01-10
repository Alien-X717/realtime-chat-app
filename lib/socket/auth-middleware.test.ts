/**
 * @vitest-environment node
 */
import { createServer } from 'http'

import { Server as SocketIOServer } from 'socket.io'
import type { Socket as ClientSocket } from 'socket.io-client';
import { io as Client } from 'socket.io-client'
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'

import { generateAccessToken } from '../auth/jwt'

import { authMiddleware } from './auth-middleware'


describe('Socket.io Authentication Middleware', () => {
  const testUserId = '123e4567-e89b-12d3-a456-426614174000'
  const testEmail = 'test@example.com'

  let io: SocketIOServer
  let httpServer: ReturnType<typeof createServer>
  let clientSocket: ClientSocket
  let port: number

  // Set test secrets
  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key'
  })

  afterEach(() => {
    return new Promise<void>((resolve) => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect()
      }
      if (io) {
        io.close()
      }
      if (httpServer) {
        httpServer.close(() => resolve())
      } else {
        resolve()
      }
    })
  })

  describe('Authentication with valid token', () => {
    it('should allow connection with valid token in auth object', () => {
      return new Promise<void>((resolve, reject) => {
        // Create HTTP server
        httpServer = createServer()
        io = new SocketIOServer(httpServer)

        // Apply auth middleware
        io.use(authMiddleware)

        // Listen for connections
        io.on('connection', (socket) => {
          try {
            // Verify user data is attached to socket
            expect(socket.data.user).toBeDefined()
            expect(socket.data.user.userId).toBe(testUserId)
            expect(socket.data.user.email).toBe(testEmail)
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        // Start server
        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          // Generate valid token
          const validToken = generateAccessToken({
            userId: testUserId,
            email: testEmail,
          })

          // Connect client with token in auth object
          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: validToken,
            },
          })

          clientSocket.on('connect_error', reject)
        })
      })
    })

    it('should allow connection with valid token in Bearer format', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', (socket) => {
          try {
            expect(socket.data.user).toBeDefined()
            expect(socket.data.user.userId).toBe(testUserId)
            expect(socket.data.user.email).toBe(testEmail)
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          const validToken = generateAccessToken({
            userId: testUserId,
            email: testEmail,
          })

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: `Bearer ${validToken}`,
            },
          })

          clientSocket.on('connect_error', reject)
        })
      })
    })

    it('should preserve socket properties while adding user data', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', (socket) => {
          try {
            expect(socket.id).toBeDefined()
            expect(socket.handshake).toBeDefined()
            expect(socket.data.user).toBeDefined()
            expect(socket.data.user.userId).toBe(testUserId)
            expect(socket.data.user.email).toBe(testEmail)
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          const validToken = generateAccessToken({
            userId: testUserId,
            email: testEmail,
          })

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: validToken,
            },
          })

          clientSocket.on('connect_error', reject)
        })
      })
    })
  })

  describe('Authentication with invalid token', () => {
    it('should reject connection with invalid token', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', () => {
          reject(new Error('Connection should have been rejected'))
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: 'invalid.token.here',
            },
          })

          clientSocket.on('connect_error', (error) => {
            try {
              expect(error.message).toBe('Authentication failed')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
        })
      })
    })

    it('should reject connection with expired token', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', () => {
          reject(new Error('Connection should have been rejected'))
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          const expiredToken =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.invalid'

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: expiredToken,
            },
          })

          clientSocket.on('connect_error', (error) => {
            try {
              expect(error.message).toBe('Authentication failed')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
        })
      })
    })

    it('should reject connection with malformed Bearer token', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', () => {
          reject(new Error('Connection should have been rejected'))
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: 'Bearer invalid.token',
            },
          })

          clientSocket.on('connect_error', (error) => {
            try {
              expect(error.message).toBe('Authentication failed')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
        })
      })
    })
  })

  describe('Authentication with missing token', () => {
    it('should reject connection with no token provided', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', () => {
          reject(new Error('Connection should have been rejected'))
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          clientSocket = Client(`http://localhost:${port}`)

          clientSocket.on('connect_error', (error) => {
            try {
              expect(error.message).toBe('Authentication failed')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
        })
      })
    })

    it('should reject connection with empty token string', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', () => {
          reject(new Error('Connection should have been rejected'))
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: '',
            },
          })

          clientSocket.on('connect_error', (error) => {
            try {
              expect(error.message).toBe('Authentication failed')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
        })
      })
    })

    it('should reject connection with whitespace-only token', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', () => {
          reject(new Error('Connection should have been rejected'))
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: '   ',
            },
          })

          clientSocket.on('connect_error', (error) => {
            try {
              expect(error.message).toBe('Authentication failed')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
        })
      })
    })
  })

  describe('Token extraction from different auth formats', () => {
    it('should extract token from auth.token field', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', (socket) => {
          try {
            expect(socket.data.user.userId).toBe(testUserId)
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          const validToken = generateAccessToken({
            userId: testUserId,
            email: testEmail,
          })

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: validToken,
            },
          })

          clientSocket.on('connect_error', reject)
        })
      })
    })

    it('should extract token from Bearer prefix', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', (socket) => {
          try {
            expect(socket.data.user.userId).toBe(testUserId)
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          const validToken = generateAccessToken({
            userId: testUserId,
            email: testEmail,
          })

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: `Bearer ${validToken}`,
            },
          })

          clientSocket.on('connect_error', reject)
        })
      })
    })

    it('should handle token with extra whitespace', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', (socket) => {
          try {
            expect(socket.data.user.userId).toBe(testUserId)
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          const validToken = generateAccessToken({
            userId: testUserId,
            email: testEmail,
          })

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: `  ${validToken}  `,
            },
          })

          clientSocket.on('connect_error', reject)
        })
      })
    })
  })

  describe('Error handling', () => {
    it('should provide clear error message for authentication failure', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: 'invalid-token',
            },
          })

          clientSocket.on('connect_error', (error) => {
            try {
              expect(error).toBeDefined()
              expect(error.message).toBe('Authentication failed')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
        })
      })
    })

    it('should not leak sensitive information in error messages', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          clientSocket = Client(`http://localhost:${port}`)

          clientSocket.on('connect_error', (error) => {
            try {
              expect(error.message).toBe('Authentication failed')
              expect(error.message).not.toContain('JWT')
              expect(error.message).not.toContain('secret')
              expect(error.message).not.toContain('token')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
        })
      })
    })
  })

  describe('Integration with JWT utilities', () => {
    it('should use verifyAccessToken from jwt module', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', (socket) => {
          try {
            expect(socket.data.user.userId).toBe(testUserId)
            expect(socket.data.user.email).toBe(testEmail)
            expect(socket.data.user.iat).toBeDefined()
            expect(socket.data.user.exp).toBeDefined()
            resolve()
          } catch (error) {
            reject(error)
          }
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          const validToken = generateAccessToken({
            userId: testUserId,
            email: testEmail,
          })

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: validToken,
            },
          })

          clientSocket.on('connect_error', reject)
        })
      })
    })

    it('should reject tokens signed with wrong secret', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        io.on('connection', () => {
          reject(new Error('Connection should have been rejected'))
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          const validToken = generateAccessToken({
            userId: testUserId,
            email: testEmail,
          })

          // Change secret to simulate token from different source
          const originalSecret = process.env.JWT_ACCESS_SECRET
          process.env.JWT_ACCESS_SECRET = 'different-secret'

          clientSocket = Client(`http://localhost:${port}`, {
            auth: {
              token: validToken,
            },
          })

          clientSocket.on('connect_error', (error) => {
            // Restore secret
            process.env.JWT_ACCESS_SECRET = originalSecret

            try {
              expect(error.message).toBe('Authentication failed')
              resolve()
            } catch (e) {
              reject(e)
            }
          })
        })
      })
    })
  })

  describe('Concurrent connections', () => {
    it('should handle multiple authenticated connections simultaneously', () => {
      return new Promise<void>((resolve, reject) => {
        httpServer = createServer()
        io = new SocketIOServer(httpServer)
        io.use(authMiddleware)

        const connectedUsers = new Set<string>()
        const expectedUserIds = [
          '123e4567-e89b-12d3-a456-426614174001',
          '123e4567-e89b-12d3-a456-426614174002',
          '123e4567-e89b-12d3-a456-426614174003',
        ]

        io.on('connection', (socket) => {
          connectedUsers.add(socket.data.user.userId)

          if (connectedUsers.size === expectedUserIds.length) {
            try {
              expectedUserIds.forEach((userId) => {
                expect(connectedUsers.has(userId)).toBe(true)
              })
              resolve()
            } catch (error) {
              reject(error)
            }
          }
        })

        httpServer.listen(() => {
          const address = httpServer.address()
          port = typeof address === 'object' && address ? address.port : 3000

          expectedUserIds.forEach((userId) => {
            const token = generateAccessToken({
              userId,
              email: `user${userId}@example.com`,
            })

            Client(`http://localhost:${port}`, {
              auth: { token },
            })
          })
        })
      })
    })
  })
})
