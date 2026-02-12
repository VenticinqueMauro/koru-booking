# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Koru Booking is a distributed booking/appointments system with 3 independent components:
1. **Widget** (Vanilla TypeScript + Koru SDK) - Embeddable booking interface for end customers
2. **Backend API** (Node.js + Express + Prisma + Supabase) - Business logic and persistence
3. **Backoffice** (React SPA) - Admin panel for managing services, schedules, and bookings

## Development Commands

### Root Level (Monorepo)
```bash
npm run build:backoffice   # Build backoffice only
npm run build:widget       # Build widget only
npm run deploy             # Deploy frontend (backoffice + widget) to Cloudflare Pages
npm run deploy:backend     # Deploy backend to Vercel
npm run deploy:backoffice  # Deploy backoffice only to Cloudflare Pages
npm run deploy:widget      # Deploy widget only to Cloudflare Pages
```

### Backend (cd backend/)
```bash
npm run dev                    # Start dev server with hot reload (port 4000)
npm run start                  # Start production server
npm run prisma:generate        # Generate Prisma client
npm run prisma:push            # Push schema to database
npm run prisma:migrate         # Create and run migrations
npm run prisma:migrate:deploy  # Deploy migrations in production
npm run prisma:studio          # Open Prisma Studio GUI
npm run prisma:seed            # Seed database with sample data
npm run db:setup               # Full setup: generate + migrate + seed
npm run type-check             # TypeScript check without build
```

### Widget (cd widget/)
```bash
npm run dev          # Start dev server (port 3001)
npm run build        # Build for production (outputs UMD + ES modules)
npm run preview      # Preview production build
npm run type-check   # TypeScript check without build
```

### Backoffice (cd backoffice/)
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # TypeScript check without build
```

## Architecture Key Concepts

### 1. Slot Calculation Algorithm
The backend's `SlotCalculator` (`backend/src/services/slotCalculator.ts`) is the core of the booking system:
- Generates available time slots based on service duration and business hours
- Filters out occupied slots by checking existing bookings
- Applies buffer time after each service (prep/cleanup time)
- Considers break times defined in schedules
- Prevents showing past time slots for same-day bookings

### 2. Race Condition Prevention
The system uses Prisma transactions to prevent double-bookings:
- When creating a booking, the database is locked during the transaction
- Unique constraint on `(serviceId, date, time)` in the Booking table
- If two users try to book the same slot simultaneously, only one succeeds

### 3. Widget Integration with Koru SDK
The widget extends `KoruWidget` from `@redclover/koru-sdk`:
- **Development mode**: Bypasses Koru auth when running on localhost
- **Production mode**: Full Koru SDK authentication and config loading
- The widget is framework-agnostic (Vanilla JS) and can be embedded anywhere

### 4. Backoffice Without Koru SDK
**IMPORTANT**: The backoffice was recently decoupled from Koru SDK:
- It is now open access without authentication
- Do NOT add `@redclover/koru-react-sdk` dependency back
- Future authentication will be implemented separately

### 5. Frontend Deployment to Cloudflare Pages
Frontend components (backoffice and widget) deploy to Cloudflare Pages:

**Prerequisites:**
```bash
npm install -g wrangler
wrangler login
```

**Deployment Process:**
1. **Deploy both frontends**: `npm run deploy`
   - Builds both widget and backoffice
   - Deploys each to Cloudflare Pages

2. **Deploy individually**:
   - Backoffice: `npm run deploy:backoffice`
   - Widget: `npm run deploy:widget`

**Configuration:**
- `backoffice/public/_headers` - Security headers and cache control
- `backoffice/public/_redirects` - SPA routing (all routes to index.html)
- `widget/public/_headers` - CORS headers for embedding
- `widget/public/_redirects` - Demo page routing

**Production URLs:**
- Backoffice: https://koru-booking-backoffice.pages.dev
- Widget: https://koru-booking-widget.pages.dev

**Environment Variables (configure in Cloudflare dashboard):**
- Backoffice: `VITE_BACKEND_API_URL` pointing to Vercel backend
- Widget: `VITE_BACKEND_API_URL`, `VITE_KORU_WEBSITE_ID`, `VITE_KORU_APP_ID`, `VITE_KORU_URL`

**Note:** Production deployments are made to the `master` branch, which automatically updates these URLs with the latest code.

**Troubleshooting:**
- If `wrangler` command not found: `npm install -g wrangler`
- If authentication error: `wrangler login`
- First deployment creates projects automatically

### 6. Backend Deployment on Vercel

**CRITICAL**: The backend has a dual-repository setup for deployment:

**Repository Configuration:**
- **Production repo (private)**: `Red-Clover-Consultoria/koru-booking`
  - Main repository, owned by the company
  - Remote name: `origin`
  - URL: https://github.com/Red-Clover-Consultoria/koru-booking.git

- **Mirror repo (public)**: `VenticinqueMauro/koru-booking`
  - Public mirror for automated deployments
  - Remote name: `personal`
  - URL: https://github.com/VenticinqueMauro/koru-booking.git
  - Connected to Vercel for auto-deploy

**Why this setup?**
- Vercel auto-deploys from GitHub repositories
- The personal mirror repo is kept synchronized to trigger Vercel deployments
- All development happens in the company repo, then synced to personal repo

**MANDATORY WORKFLOW - Push to BOTH repos:**

After ANY code change:

```bash
# 1. Commit changes locally
git add .
git commit -m "your commit message"

# 2. Push to company repo (origin)
git push origin master

# 3. Push to personal repo (personal) - REQUIRED for Vercel backend auto-deploy
git push personal master
```

**Important:**
- ALWAYS push to both remotes (`origin` and `personal`) to keep repos synchronized
- Vercel auto-deploys backend from the `personal` repo
- If you forget to push to `personal`, backend changes won't deploy

**Manual backend deployment:**
```bash
npm run deploy:backend  # Deploy backend to Vercel manually
```

**To verify remote configuration:**
```bash
git remote -v
```

Expected output:
```
origin    https://github.com/Red-Clover-Consultoria/koru-booking.git (fetch)
origin    https://github.com/Red-Clover-Consultoria/koru-booking.git (push)
personal  https://github.com/VenticinqueMauro/koru-booking.git (fetch)
personal  https://github.com/VenticinqueMauro/koru-booking.git (push)
```

## Database Schema

### Key Models (Prisma)

**Service**: Services offered (e.g., "Haircut", "Consultation")
- `duration` (int): Service duration in minutes
- `buffer` (int): Post-service buffer time in minutes
- `active` (boolean): Whether service is available for booking

**Schedule**: Weekly schedule (7 records, one per day)
- `dayOfWeek` (0-6): Sunday=0, Saturday=6
- `startTime`/`endTime`: Business hours (HH:mm format)
- `breakStart`/`breakEnd`: Optional lunch break
- `enabled`: Whether day is available

**Booking**: Customer reservations
- Unique constraint on `(serviceId, date, time)` prevents conflicts
- `status`: 'confirmed' | 'cancelled' | 'completed'
- Includes customer data: name, email, phone, notes

## Environment Configuration

### Backend (.env)
```
DATABASE_URL=postgresql://...           # Supabase PostgreSQL URL
RESEND_API_KEY=re_xxxxx                # Resend API key from https://resend.com/api-keys
EMAIL_FROM=noreply@example.com         # Must be from a verified domain in Resend
```

**Note**: Admin notification email is configured per account in `WidgetSettings.notifyEmail`, not in environment variables.

### Widget (.env)
Widget uses Koru SDK authentication in production:
```
VITE_KORU_WEBSITE_ID=xxx
VITE_KORU_APP_ID=xxx
VITE_KORU_URL=https://www.korusuite.com
VITE_BACKEND_API_URL=http://localhost:4000/api
```

### Backoffice (.env)
```
VITE_BACKEND_API_URL=http://localhost:4000/api
```

**Production** (`.env.production`):
```
VITE_BACKEND_API_URL=https://koru-booking-backend.vercel.app/api
```

## Important Implementation Details

### Email Notifications
- Sent asynchronously after booking creation (non-blocking)
- Two emails sent: customer confirmation + admin notification
- Uses Resend API (modern email service for developers)
- Email sender must be from a verified domain in Resend dashboard
- Email failures don't prevent booking creation

### Time Slot Generation
- Default interval: 15 minutes
- Configurable via `WidgetSettings.stepInterval` (15/30/60)
- Slots generated between `startTime` and `endTime`
- Excludes break periods and past times

### Widget Display Modes
- **Modal**: Floating trigger button opens overlay (default)
- **Inline**: Widget embedded directly in page
- Configurable position: bottom-right, bottom-left, top-right, top-left
- Customizable accent color for branding

### API Client Architecture
Both widget and backoffice use centralized API clients:
- Widget: `widget/src/api/client.ts`
- Backoffice: `backoffice/src/api/api.ts`
- All API URLs read from environment variables
- Axios-based with error handling

## Critical Notes

1. **Never re-add Koru SDK to backoffice** - It was intentionally removed to make it open access
2. **Unique constraints** - The `(serviceId, date, time)` constraint is essential for preventing double-bookings
3. **Transaction usage** - Always use Prisma transactions when checking availability + creating bookings
4. **Production API URL** - Backend deployed on Vercel: https://koru-booking-backend.vercel.app/api
5. **Deployment** - Frontend on Cloudflare Pages, Backend on Vercel (auto-deploy from GitHub)

## Repository Cleanliness Policy

**IMPORTANT**: Keep the repository clean and minimal. Follow these guidelines:

### ❌ DO NOT Create:
- **Analysis documents** (ANALYSIS.md, AUDIT.md, REVIEW.md, etc.)
- **Redundant documentation** - Information should only exist in one place
- **Temporary testing files** (debug.html, test.html, scratch.js, etc.)
- **Migration guides** for completed migrations
- **Summary documents** (SUMMARY.md, CHANGELOG.md unless actively maintained)
- **Architecture documents** that duplicate README/CLAUDE.md content
- **Multiple .md files** covering the same topic
- **Specification files** (spec.md, requirements.md) after implementation is complete

### ✅ Allowed Documentation:
Each folder should have **maximum 1-2 essential .md files**:

**Root:**
- `README.md` - Main project documentation
- `CLAUDE.md` - Instructions for Claude Code (this file)

**Backend:**
- `README.md` - Backend-specific documentation
- `SETUP_SUPABASE.md` - Production setup guide (technical reference)
- `MIGRATION_CHECKLIST.md` - Production migration guide (technical reference)

**Backoffice/Widget:**
- `README.md` only

### 🗂️ File Organization:
- Keep source code in `src/` directories
- Build outputs go to `dist/` (git-ignored)
- Configuration files in root of each component
- No loose files in root unless essential

### 🧹 Before Committing:
1. Remove any temporary/debug files
2. Consolidate redundant documentation
3. Update existing docs instead of creating new ones
4. Verify .gitignore excludes build artifacts and temp files

## Git Commit Guidelines

### Commit Message Format
- Use conventional commit format: `type: description`
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`
- Keep first line under 72 characters
- Include detailed description in body if needed

### ❌ DO NOT Include:
- **Claude Code attribution footer** - Do NOT add the following to commits:
  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```
- Emoji in commit messages (except conventional commit scopes if used)
- Marketing language or unnecessary praise
- Redundant information already in code changes

### ✅ Good Commit Message Example:
```
refactor: simplify auth to use Koru roles directly

Remove role mapping layer and use Koru Suite roles as source of truth.
Fixes authentication issue where Koru admin users received 403 errors.

Backend changes:
- Remove role mapping in userSyncService
- Update middleware to validate role directly

Frontend changes:
- Add computed isAdmin property
- Update components to use isAdmin
```

## Common Development Workflows

### Adding a New Service Field
1. Update `backend/prisma/schema.prisma`
2. Run `npm run prisma:push` or `npm run prisma:migrate`
3. Update TypeScript types in `backend/src/types/`
4. Update API endpoints in `backend/src/routes/`
5. Update frontend components consuming the API

### Testing Slot Calculation
1. Seed database with test data: `npm run prisma:seed`
2. Start backend: `npm run dev`
3. Test endpoint: `GET http://localhost:4000/api/slots?serviceId=xxx&date=2024-01-15`
4. Verify slots respect business hours, breaks, and existing bookings

### Deploying Changes

**Full deployment workflow:**

1. **Commit changes locally**
   ```bash
   git add .
   git commit -m "your commit message"
   ```

2. **Push to BOTH git remotes** (CRITICAL)
   ```bash
   git push origin master      # Company repo
   git push personal master    # Personal repo (triggers Vercel backend auto-deploy)
   ```

3. **Deploy frontend components to Cloudflare Pages**
   ```bash
   npm run deploy              # Deploys both backoffice and widget to Cloudflare
   ```
   Or deploy individually:
   ```bash
   npm run deploy:backoffice   # Backoffice only
   npm run deploy:widget       # Widget only
   ```

**Important Notes:**
- Backend auto-deploys when pushed to `personal` remote (Vercel watches this repo)
- Frontend (backoffice/widget) requires manual Cloudflare Pages deploy via `npm run deploy`
- ALWAYS push to both remotes (`origin` and `personal`) to keep repos synchronized
- Manual backend deploy: `npm run deploy:backend` (if needed)
