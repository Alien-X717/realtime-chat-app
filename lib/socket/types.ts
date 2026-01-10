import type { AccessTokenPayload } from '../auth/jwt'

/**
 * Augment Socket.io's Socket interface to include user data
 * The user property is added by the auth middleware after successful authentication
 */
declare module 'socket.io' {
  interface SocketData {
    user: AccessTokenPayload
  }
}
