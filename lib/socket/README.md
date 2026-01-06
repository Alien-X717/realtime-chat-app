# Socket.io Authentication Middleware

This module provides authentication middleware for Socket.io connections using JWT tokens.

## Usage

```typescript
import { Server as SocketIOServer } from 'socket.io'
import { authMiddleware } from './lib/socket/auth-middleware'

const io = new SocketIOServer(httpServer)

// Apply authentication middleware
io.use(authMiddleware)

// All connections after this point will be authenticated
io.on('connection', (socket) => {
  // Access authenticated user data
  const user = socket.data.user
  console.log(`User ${user.email} connected`)
})
```

## Client-Side Usage

```typescript
import { io } from 'socket.io-client'

// Connect with token in auth object
const socket = io('http://localhost:3000', {
  auth: {
    token: accessToken, // or 'Bearer ' + accessToken
  },
})

socket.on('connect', () => {
  console.log('Connected to server')
})

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message)
})
```

## Features

- **JWT Token Verification**: Uses existing JWT utilities to verify access tokens
- **Flexible Token Format**: Supports both direct tokens and Bearer format
- **Type Safety**: Full TypeScript support with socket.data.user typing
- **Security**: Generic error messages to avoid leaking sensitive information
- **Comprehensive Tests**: Full test coverage with multiple scenarios

## Token Extraction

The middleware extracts tokens from the `socket.handshake.auth` object and supports:

- Direct token: `{ auth: { token: "xyz" } }`
- Bearer format: `{ auth: { token: "Bearer xyz" } }`
- Automatic whitespace trimming

## Error Handling

All authentication failures return a generic "Authentication failed" message to avoid leaking sensitive information about why the authentication failed.

## Testing

Run tests with:

```bash
yarn test lib/socket/auth-middleware.test.ts
```
