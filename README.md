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

## Features

- **Training**: Workout-Logger, Trainingsprogramme, Muskelkarte
- **Ernährung**: Barcode-Scanner, KI-Foto-Erkennung, Makro-Tracking
- **Health**: Health Connect Integration, Recovery Score, Schlaf-Tracking
- **AI Coach**: Personalisierter Coach mit anonymisiertem Kontext

## Getting Started

### Prerequisites: Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Copy your Project URL and Anon Key from **Project Settings** → **API**

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>

# Run migrations
npm run supabase:db:push

# Start development server
npm run dev
```

## Project Structure

```
fittrack-pro/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (app)/              # Protected app routes
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── shared/             # Shared components
│   ├── dashboard/          # Dashboard widgets
│   ├── nutrition/          # Nutrition components
│   └── training/           # Training components
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── calculations/       # Business logic
│   ├── ai/                 # AI integration
│   └── utils/              # Utilities
├── stores/                 # Zustand stores
├── types/                  # TypeScript types
└── supabase/
    ├── migrations/         # Database migrations
    └── seed/               # Seed data
```

## Development

- `npm run dev` - Start development server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript check
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy!

## License

Private - All rights reserved.
