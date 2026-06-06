# FitTrack Pro

Eine persönliche Progressive Web App (PWA) für Fitness-Tracking mit Next.js, Supabase und AI-Integration.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State**: Zustand
- **AI**: Google Gemini
- **Charts**: Recharts + D3.js
- **i18n**: next-intl (Deutsch/Englisch)
- **Monitoring**: Sentry + PostHog

## Features

- **Training**: Workout-Logger, Trainingsprogramme, Muskelkarte
- **Ernährung**: Barcode-Scanner, KI-Foto-Erkennung, Makro-Tracking
- **Health**: Health Connect Integration, Recovery Score, Schlaf-Tracking
- **AI Coach**: Personalisierter Coach mit anonymisiertem Kontext
- **Offline**: Queue-basierte Offline-Synchronisation

## Getting Started

### Prerequisites: Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Copy your Project URL and Anon Key from **Project Settings** → **API**
3. Enable TimescaleDB extension in **Database** → **Extensions**

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see Environment Variables below)

# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Run migrations
npm run supabase:db:push

# Seed initial data (exercises, programs)
npm run db:seed

# Start development server
npm run dev
```

## Environment Variables

### Required Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → API | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → API | Anon/Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → API | Service role key (server-only) |

### AI & APIs

| Variable | Source | Description |
|----------|--------|-------------|
| `GOOGLE_GEMINI_API_KEY` | Google AI Studio | Gemini API key (server-only) |

### Monitoring & Analytics (Optional)

| Variable | Source | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Project → DSN | Error tracking |
| `SENTRY_AUTH_TOKEN` | Sentry → Auth Tokens | Release management |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog Project | Analytics key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog Settings | API host (default: https://eu.i.posthog.com) |

### Vercel Deployment (CI/CD)

| Variable | Source | Description |
|----------|--------|-------------|
| `VERCEL_TOKEN` | Vercel → Settings → Tokens | Deployment token |
| `VERCEL_ORG_ID` | Vercel Project → Settings | Organization ID |
| `VERCEL_PROJECT_ID` | Vercel Project → Settings | Project ID |

### Other

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Random string for cron job authentication |
| `ENCRYPTION_KEY` | 64-char hex for OAuth token encryption (optional) |
| `UPSTASH_REDIS_REST_URL` | For rate limiting (optional) |
| `UPSTASH_REDIS_REST_TOKEN` | For rate limiting (optional) |

### E2E Testing

| Variable | Description |
|----------|-------------|
| `TEST_USER_EMAIL` | Test account email for Playwright |
| `TEST_USER_PASSWORD` | Test account password for Playwright |
| `PLAYWRIGHT_TEST_BASE_URL` | Base URL for tests (default: http://localhost:3000) |

### Complete .env.example

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Gemini
GOOGLE_GEMINI_API_KEY=AIzaSy...

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://...@....ingest.sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...

# PostHog (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Rate Limiting (optional)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Vercel (CI/CD)
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...

# App
CRON_SECRET=your-cron-secret-here
NEXT_PUBLIC_APP_URL=https://fittrack-pro.vercel.app

# E2E Tests
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

## Project Structure

```
fittrack-pro/
├── app/
│   ├── [locale]/           # i18n locale routing
│   │   ├── (app)/          # Protected app routes
│   │   ├── (auth)/         # Auth routes (login, register)
│   │   ├── api/            # API routes
│   │   └── auth/           # Auth callbacks
│   ├── globals.css         # Global styles
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── shared/             # Shared components
│   ├── dashboard/          # Dashboard widgets
│   ├── nutrition/          # Nutrition components
│   ├── training/           # Training components
│   ├── providers/          # Context providers
│   └── coach/              # AI Coach components
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── calculations/       # Business logic
│   ├── ai/                 # AI integration
│   ├── offline/            # Offline queue (Dexie.js)
│   ├── monitoring/         # Sentry + PostHog
│   └── utils/              # Utilities
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
├── messages/               # i18n translations (de/en)
├── tests/
│   ├── e2e/                # Playwright tests
│   └── unit/               # Vitest tests
├── types/                  # TypeScript types
└── supabase/
    ├── migrations/         # Database migrations
    └── seed/               # Seed data
```

## Development

```bash
# Start development server
npm run dev

# Run ESLint
npm run lint

# Run TypeScript check
npm run type-check

# Run unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Start Supabase locally
npm run supabase:start

# Stop Supabase locally
npm run supabase:stop

# Reset local database
npm run supabase:db:reset

# Push migrations to production
npm run supabase:db:push
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs:

1. **Code Quality**: ESLint + TypeScript check
2. **Unit Tests**: Vitest with coverage
3. **E2E Tests**: Playwright with 5 critical user journeys
4. **Build**: Production build
5. **Deploy**: Auto-deploy to Vercel (main branch)

### Required GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions** and add:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_GEMINI_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN` (optional)
- `NEXT_PUBLIC_POSTHOG_KEY` (optional)
- `TEST_USER_EMAIL` (for E2E)
- `TEST_USER_PASSWORD` (for E2E)

## i18n (Internationalization)

The app supports German (default) and English:

- Locale routing: `/de/dashboard`, `/en/dashboard`
- Automatic language detection based on browser/Accept-Language
- Language switcher in Profile settings
- Full translations in `messages/de.json` and `messages/en.json`

## Offline Support

FitTrack Pro works offline using Dexie.js (IndexedDB):

- **Workout Sessions**: Saved locally, synced when online
- **Food Logs**: Queued for batch sync
- **Auto-Sync**: Triggered when connection restored
- **Manual Sync**: Available in Profile → Debug

## Security

- **CSP Headers**: Configured in `next.config.ts`
- **Rate Limiting**: Via Upstash Redis or Vercel KV
- **RLS**: Row Level Security on all Supabase tables
- **API Keys**: Server-only (never exposed to client)
- **AI Context**: Anonymized before sending to Gemini

## Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel Dashboard
3. Push to `main` branch triggers auto-deploy

### Manual

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy
vercel --prod
```

## Phase 3 Features (Completed)

- [x] Offline Queue (Dexie.js) with Workout-Session-Sync
- [x] i18n (next-intl) with Server Components
- [x] CSP Security Headers
- [x] GitHub Actions CI/CD
- [x] Sentry Error Tracking
- [x] PostHog Analytics
- [x] Playwright E2E Tests (5 critical journeys)
- [x] Vitest Unit Tests

## License

Private - All rights reserved.
