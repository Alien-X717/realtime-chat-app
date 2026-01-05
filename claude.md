# Claude Context - Realtime Chat App

## Project Overview
Real-time scalable chat application built with Next.js, Socket.io, PostgreSQL, Redis, and Drizzle ORM.

## Git Workflow

### Commit Convention
Use conventional commits format:
- `feat: description` - New features
- `fix: description` - Bug fixes
- `chore: description` - Maintenance tasks
- `docs: description` - Documentation updates
- `test: description` - Test additions/modifications
- `refactor: description` - Code refactoring

### Commit Strategy
- Create commits for each feature or fix
- Keep commits atomic and focused
- Write clear, descriptive commit messages

### Branch Strategy
- **NEVER merge directly to main**
- Always create feature branches for new work
- Branch naming: `feat-description` or `fix-description`
- Raise PR (Pull Request) to merge to main
- Delete feature branches after successful merge

### Pre-Push Checklist
- **ALWAYS run typecheck before pushing to remote**: `yarn typecheck`
- Ensure tests pass: `yarn test`
- Fix any linting errors

## Code Practices

### Package Manager
- **Use yarn exclusively** (not npm or pnpm)

### Testing
- Follow TDD (Test-Driven Development)
- Write tests before implementation
- Test frameworks: Vitest (unit/integration), Playwright (E2E)

### TypeScript
- Strict mode enabled
- No `any` types unless absolutely necessary
- Prefer type inference where possible
- Run `yarn typecheck` before committing

### Code Style
- Use Prettier for formatting
- Use ESLint for linting
- Follow Next.js and React best practices

### File Structure
- Components in `components/` with feature-based organization
- Business logic in `lib/`
- API routes in `app/api/`
- Database queries in `lib/db/`

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **UI**: Shadcn UI, Tailwind CSS
- **Backend**: Next.js API Routes, Socket.io
- **Database**: PostgreSQL + Drizzle ORM
- **Cache/PubSub**: Redis (ioredis)
- **Testing**: Vitest, Playwright
- **Auth**: JWT (httpOnly cookies)

## Important Notes
- Use Redis Streams for message buffering (not Kafka initially)
- Implement rate limiting at multiple layers
- E2E encryption is post-MVP
- File uploads start local, migrate to S3 later
