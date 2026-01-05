# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 2: Authentication System (In Progress)

#### Added
- Password hashing utilities using Argon2id algorithm
  - `hashPassword()` - Hash passwords with secure defaults
  - `verifyPassword()` - Verify password against hash
  - `validatePassword()` - Validate password strength (8+ chars, uppercase, lowercase, number, special char)
  - 13 comprehensive tests ✓
- JWT authentication utilities
  - `generateAccessToken()` - Generate short-lived access tokens (15min)
  - `generateRefreshToken()` - Generate long-lived refresh tokens (7 days)
  - `verifyAccessToken()` - Verify and decode access tokens
  - `verifyRefreshToken()` - Verify and decode refresh tokens
  - 12 comprehensive tests ✓

#### Dependencies
- argon2@0.44.0 - Password hashing
- jsonwebtoken@9.0.3 - JWT generation and verification
- cookie@1.1.1 - Cookie parsing

### Phase 1: Project Setup & Infrastructure (Complete)

#### Added
- **Project Foundation**
  - Next.js 14.1.1 with TypeScript and App Router
  - Tailwind CSS v4 with PostCSS
  - Shadcn UI component library
  - Git repository with conventional commit format

- **Testing Infrastructure**
  - Vitest for unit and integration tests
  - Playwright for E2E tests
  - happy-dom as test environment
  - @testing-library/react for component testing
  - Test utilities and setup files

- **Database & ORM**
  - PostgreSQL database (realtime_chat_app)
  - Drizzle ORM with TypeScript
  - Complete database schema (7 tables):
    - users
    - conversations
    - conversation_participants
    - messages
    - message_assets (file attachments with metadata)
    - message_reactions
    - read_receipts
  - Database migrations setup
  - Database initialization script

- **Real-time Infrastructure**
  - Socket.io server with custom Next.js server
  - Redis adapter for horizontal scaling
  - ioredis client for Redis operations
  - Connection handling and logging

- **Configuration**
  - Environment variables setup (.env.local)
  - TypeScript strict mode
  - ESLint configuration
  - Development and production scripts

#### Scripts
- `dev` - Start development server with hot reload
- `build` - Build for production
- `start` - Start production server
- `lint` - Run ESLint
- `typecheck` - Run TypeScript type checking
- `test` - Run Vitest tests
- `test:e2e` - Run Playwright E2E tests
- `db:init` - Initialize database
- `db:generate` - Generate database migrations
- `db:migrate` - Apply database migrations
- `db:push` - Push schema to database
- `db:studio` - Open Drizzle Studio

## [0.1.0] - 2025-01-06

### Initial Release
- Project initialization
- Git repository setup
- Development environment configuration
