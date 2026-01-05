# API Documentation

## Authentication Endpoints

### POST /api/auth/signup
**Status:** 🚧 In Development

Register a new user account.

**Request Body:**
```json
{
  "username": "string (required, unique)",
  "email": "string (required, unique, valid email)",
  "password": "string (required, min 8 chars, must meet strength requirements)",
  "displayName": "string (optional)"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "createdAt": "timestamp"
  },
  "accessToken": "string"
}
```

**Errors:**
- 400: Invalid input, password too weak, username/email already exists
- 500: Server error

---

### POST /api/auth/login
**Status:** 🚧 In Development

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "displayName": "string"
  },
  "accessToken": "string"
}
```

**Sets Cookies:**
- `refreshToken` - HttpOnly, 7 days expiry

**Errors:**
- 400: Invalid input
- 401: Invalid credentials
- 500: Server error

---

### POST /api/auth/logout
**Status:** 🚧 In Development

Logout user and clear tokens.

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
**Status:** 🚧 In Development

Get current authenticated user information.

**Headers:**
- `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "displayName": "string",
  "status": "string",
  "createdAt": "timestamp"
}
```

**Errors:**
- 401: Unauthorized (invalid or expired token)
- 500: Server error

---

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*()_+-=[]{}; ':"\\|,.<>/?)

---

## Authentication Flow

1. **Signup**: User registers → Receives access token and refresh token (cookie)
2. **Login**: User authenticates → Receives access token and refresh token (cookie)
3. **Access Protected Routes**: Include access token in Authorization header
4. **Token Refresh**: When access token expires (15min), use refresh token to get new access token
5. **Logout**: Clear tokens on client and server

---

## Rate Limiting

- **Messages**: 30 messages per minute per user
- **API Requests**: TBD
- **Socket Connections**: 10 connections per hour per user

---

## WebSocket Events

### Authentication
**Status:** 🚧 In Development

Socket.io connections must include valid JWT token for authentication.

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: '<accessToken>'
  }
});
```

---

*More endpoints will be documented as they are implemented.*
