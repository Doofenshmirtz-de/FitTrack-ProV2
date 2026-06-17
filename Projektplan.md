# FitTrack Pro — Vollständiger Technischer Projektplan
## Version: 3.0 · Stand: Juni 2026
### Stack: Next.js 16 · Supabase · Gemini · Health Connect REST API · Vercel

---

## Inhaltsverzeichnis

1. [Projektübersicht](#1-projektübersicht)
2. [Tech Stack](#2-tech-stack)
3. [Design-System & UI/UX Spezifikation](#3-design-system--uiux-spezifikation)
4. [Systemarchitektur](#4-systemarchitektur)
5. [Datenschutz-Strategie für den AI-Coach](#5-datenschutz-strategie-für-den-ai-coach)
6. [Datenbank-Design (Supabase)](#6-datenbank-design-supabase)
7. [API-Integrationen](#7-api-integrationen)
8. [Feature-Module](#8-feature-module)
9. [State-Management & App-Logik](#9-state-management--app-logik)
10. [PWA & Offline-Strategie](#10-pwa--offline-strategie)
11. [Fehlerfälle, Edge Cases & Resilienz](#11-fehlerfälle-edge-cases--resilienz)
12. [Projektstruktur](#12-projektstruktur)
13. [Sicherheit](#13-sicherheit)
14. [Testing & Qualitätssicherung](#14-testing--qualitätssicherung)
15. [Monitoring, Observability & Alerting](#15-monitoring-observability--alerting)
16. [CI/CD & Deployment](#16-cicd--deployment)
17. [Internationalisierung (i18n)](#17-internationalisierung-i18n)
18. [Business-Logik & Berechnungen](#18-business-logik--berechnungen)
19. [Environment Variables](#19-environment-variables)
20. [Migrationsoffenheit: Docker & NAS](#20-migrationsoffenheit-docker--nas)
21. [MVP Scope & Roadmap](#21-mvp-scope--roadmap)

---

## 1. Projektübersicht

FitTrack Pro ist eine persönliche Progressive Web App (PWA), die drei Gesundheitsdimensionen in einem einzigen Whoop-inspirierten Dashboard vereint:

- **Ernährung**: Barcode-Scanner, Texteingabe, KI-Foto-Erkennung
- **Krafttraining**: Freies Logging + strukturierte Programme, interaktive Muskelkarte
- **Health-Daten**: Live-Sync via Google Health Connect API (Android On-Device) — kein Hersteller-Lock-in

Ein serverbasierter AI-Coach (Google Gemini) analysiert alle drei Datenströme und gibt personalisierte, datenschutzkonforme Empfehlungen.

- **Design-Vorbild**: Whoop (dunkles Theme, metriklastig, minimalistisch)
- **Trainings-Vorbild**: Repcount (alles scrollbar, keine Screen-Wechsel pro Übung)
- **Alleiniger Nutzer**: Privat, ein Benutzer
- **Hosting**: Vercel (primär, fester Bestandteil)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage + TimescaleDB)
- **Sprachen**: Deutsch (Default) und Englisch
- **Migrationsoffenheit**: Der gesamte Stack ist Docker-ready für zukünftige Migration auf eigenes NAS / VPS

---

## 2. Tech Stack

| Layer | Technologie | Begründung |
|-------|-------------|------------|
| Framework | Next.js 16 (App Router) | Neuster Standard, Server Components, API Routes, native Vercel-Integration, PWA-Support |
| Sprache | TypeScript 5 | Typsicherheit für komplexe Health-Datenstrukturen |
| Styling | Tailwind CSS v4 | Utility-First, perfekt für Dark-Mode / Whoop-Ästhetik |
| UI Components | shadcn/ui | Headless, vollständig anpassbar, kein Vendor-Lock-in |
| Charts | Recharts + D3.js | Recharts für Standard-Charts, D3 für SVG-Muskelkarte |
| State Management | Zustand | Leichtgewichtig, ideal für lokalen App-State mit persist Middleware |
| Server State / Cache | TanStack Query v5 | API-Caching, Background-Sync, Offline-Fallback |
| Auth | Supabase Auth | Email/PW + Google OAuth |
| Datenbank | Supabase PostgreSQL + TimescaleDB Extension | TimescaleDB für Zeitreihendaten, PostgreSQL für App-Daten |
| Realtime | Supabase Realtime | Live-Updates bei Health-Daten-Eingang |
| AI Coach | Google Gemini 2.0 Flash | Multimodal (Text + Bild), kosteneffizient |
| Food API | Open Food Facts API | Kostenlos, 3M+ Produkte, Barcode + Nährwerte |
| Barcode | @zxing/browser | In-Browser-Barcode-Scanner, kein Backend nötig |
| Health Data | Google Health REST API | Server-to-Server Cloud API für Fit/Health-Daten, kein Lock-in auf mobile Endgeräte |
| PWA | next-pwa + Workbox | Service Worker, Offline-Fallback, Background Sync |
| Offline Queue | Dexie.js (IndexedDB) | Lokaler Datenpuffer bei fehlender Serververbindung |
| Deployment | Vercel | Native Next.js-Support, Edge Functions, Cron Jobs |
| CI/CD | GitHub Actions | Lint → Typecheck → Unit Tests → E2E Tests → Deploy |
| Testing | Vitest + Playwright | Unit-Tests für Logik, E2E für kritische User-Journeys |
| Monitoring | Sentry + PostHog | Error-Tracking + DSGVO-konforme Analytics |
| Rate Limiting | Vercel KV / Upstash Redis | 5 Requests/Sekunde pro Route |

**Migrationsoffenheit (Docker-Ready):**
Der gesamte Stack ist so gewählt, dass er später ohne Vendor-Lock-in auf einem eigenen NAS oder VPS via Docker Compose betrieben werden kann. Vercel bleibt der primäre Host für MVP und V1.

---

## 3. Design-System & UI/UX Spezifikation

### 3.1 Farbpalette (Whoop-inspiriert)

| Token | Hex | Verwendung |
|-------|-----|------------|
| `--bg-base` | `#0a0a0a` | App-Hintergrund |
| `--bg-elevated` | `#141414` | Cards, Bottom Sheet, Modals |
| `--bg-overlay` | `#1a1a1a` | Hover-States, Input-Hintergrund |
| `--border-subtle` | `#262626` | Trennlinien, Borders |
| `--border-focus` | `#404040` | Fokus-Ringe |
| `--text-primary` | `#ffffff` | Haupttext, Überschriften |
| `--text-secondary` | `#a1a1aa` | Labels, Beschreibungen |
| `--text-tertiary` | `#71717a` | Placeholder, disabled |
| `--accent-primary` | `#10b981` | Erfolg, Aktiv, Recovery (Emerald) |
| `--accent-secondary` | `#3b82f6` | Info, Links, Training (Blue) |
| `--accent-warning` | `#f59e0b` | Warnung, Moderate Strain (Amber) |
| `--accent-danger` | `#ef4444` | Fehler, High Strain, Neglected (Red) |
| `--accent-purple` | `#8b5cf6` | PR, Personal Bests, AI-Coach (Violet) |

**Chart-Farben (Dark Mode, 8 unterscheidbare):**
`#10b981`, `#3b82f6`, `#f59e0b`, `#ef4444`, `#8b5cf6`, `#06b6d4`, `#f97316`, `#ec4899`

### 3.2 Typografie

- **Primary Font**: `Inter` (Google Fonts, weights 400, 500, 600, 700)
- **Mono Font**: `JetBrains Mono` (Zahlen, Metriken, Timer)
- **Base Size**: `16px` (1rem)
- **Line Height**: `1.5` (Body), `1.2` (Headings)

| Token | Size | Weight | Line-Height | Verwendung |
|-------|------|--------|-------------|------------|
| `display` | `2.5rem` (40px) | 700 | 1.1 | Dashboard-Score-Werte |
| `h1` | `1.5rem` (24px) | 600 | 1.2 | Screen-Titel |
| `h2` | `1.25rem` (20px) | 600 | 1.3 | Section-Header |
| `h3` | `1.125rem` (18px) | 500 | 1.3 | Card-Titel |
| `body` | `1rem` (16px) | 400 | 1.5 | Fließtext |
| `body-sm` | `0.875rem` (14px) | 400 | 1.5 | Sekundärer Text |
| `caption` | `0.75rem` (12px) | 500 | 1.4 | Labels, Badges |
| `mono-lg` | `1.5rem` (24px) | 500 | 1.0 | Timer, große Zahlen |
| `mono-sm` | `0.875rem` (14px) | 400 | 1.0 | Kleine Metriken |

### 3.3 Spacing-System

- **Base**: `4px` (Tailwind-Standard)
- **Scale**: 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), 8 (32px), 10 (40px), 12 (48px), 16 (64px)
- **Max Content Width**: `640px` (Mobile-First, zentriert auf Desktop)
- **Safe Area**: `env(safe-area-inset-*)` für iOS Notch
- **Bottom Nav Height**: `64px` + Safe Area
- **Page Padding**: `16px` (mobile), `24px` (tablet >640px)

### 3.4 Komponenten-Verhalten

**Skeleton Screen:**
- Farbe: `#1a1a1a` (leicht heller als Background)
- Animation: Shimmer (linear-gradient von links nach rechts, 1.5s, ease-in-out, infinite)
- Border-Radius: gemäß Zielkomponente (meist `12px` oder `9999px`)

**Error State:**
- Toast-Notification (oben, slide-in, 4s auto-dismiss)
- Hintergrund: `--bg-elevated` mit rotem Left-Border (`--accent-danger`)
- Icon: Alert-Circle
- Retry-Button inline bei wiederholbaren Aktionen

**Empty State:**
- Icon (Lucide) + Titel + Beschreibung + CTA-Button
- Keine Illustrationen (Text-First, minimalistisch)
- Beispiel Muskelkarte: "Noch keine Daten. Starte dein erstes Training."

### 3.5 Animationen

- **Slide-Transition zwischen Screens**: `300ms`, `cubic-bezier(0.4, 0, 0.2, 1)`
- **PR-Badge**: Scale `0.8 → 1.0` (400ms, spring), optional Confetti-Partikel (5 Stück, 1s)
- **Bottom Sheet**: Slide-up `transform: translateY(100%) → 0`, `300ms`, `ease-out`
- **Toast**: Slide-down + Fade, `200ms`
- **Rest-Timer Ring**: CSS `stroke-dashoffset` Animation, linear
- **Page Load**: Staggered Fade-In für Dashboard-Widgets (50ms Delay pro Widget)

### 3.6 Navigation

**Bottom Navigation (5 Tabs):**
1. Dashboard (Home)
2. Ernährung
3. Training
4. Coach (AI)
5. Profil

**FAB (Floating Action Button):**
- Kontextabhängig: Nur auf Dashboard, Ernährung und Training sichtbar
- Dashboard: "+ Schnellaktion" (Mahlzeit, Training, Coach)
- Ernährung: "+ Mahlzeit"
- Training: "+ Workout starten"
- Versteckt bei Scroll-down, sichtbar bei Scroll-up

**Profil-Tab:** Enthält große Debug-Section mit:
- Verbindungsstatus (Supabase Realtime, Health Connect, Gemini)
- Manueller "Reconnect"-Button für Supabase Realtime
- Lokales Error-Log des Service Workers
- Queue-Status (Offline-Items)

### 3.7 Muskelkarte Interaktion

- **Tap**: Bottom Sheet öffnet sich mit Info-Panel (letztes Training, Volumen diese Woche, Button "AI Coach fragen")
- **Long-Press**: Direkter Sprung zum AI-Coach mit vorbefülltem Kontext: "Ich habe [Muskel] vernachlässigt"
- **Desktop Hover**: Tooltip mit Quick-Info, Tap-Verhalten wie Mobile

### 3.8 Workout-Logger UI

- **Layout**: Alles scrollbar auf einer Seite (Repcount-Style)
- **Header**: Workout-Name + Timer (sticky, bleibt beim Scrollen oben fixiert)
- **Set-Reihen**: Pro Übung eine Card, darin die Sets untereinander
- **Input**: Gewicht + Reps inline, RPE-Slider darunter
- **Rest-Timer**: Startet automatisch nach Set-Abschluss, als kleiner Sticky-Banner unten
- **Previous Best**: Inline-Badge über dem Input-Feld

---

## 4. Systemarchitektur

```
┌────────────────────────────────────────────────────────────────┐
│                      USER (Android / PWA)                         │
│                                                                  │
│  ┌─────────────────────────┐   ┌──────────────────────────┐    │
│  │  Next.js 15 App Router   │   │  Service Worker (Workbox) │   │
│  │  Zustand + TanStack Query│   │  IndexedDB Queue (Dexie)  │   │
│  └────────────┬────────────┘   └─────────────┬────────────┘    │
└───────────────│──────────────────────────────│─────────────────┘
                │ HTTPS                         │ Offline → Sync
                ▼                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Next.js API Routes (Vercel)                   │
│                                                                    │
│  /api/health/*       /api/ai/*        /api/food/*                 │
│  (Sync Payload)      (chat, food-     (Open Food Facts           │
│                      vision)          Proxy)                     │
└───────┬──────────────────┬───────────────────┬───────────────────┘
        │                  │                   │
        ▼                  ▼                   ▼
┌──────────────┐  ┌────────────────┐  ┌──────────────────┐
│   Supabase    │  │  Gemini API    │  │  Open Food Facts │
│               │  │  (multimodal)  │  │  API             │
│  - Auth       │  │                │  │  (Barcode/Search)│
│  - PostgreSQL │  │  [Nur anon.    │  └──────────────────┘
│  - TimescaleDB│  │   Metriken!]   │
│  - Realtime   │  └────────────────┘
│  - Storage    │
└──────────────┘
        ▲
        │ POST /api/health/sync (aggregierte Health-Daten)
┌──────────────────┐
│  Google Health    │
│  Connect API      │
│  (Android On-     │
│   Device)         │
└──────────────────┘
```

**Datenfluß: Health Connect → Dashboard (Live)**
```
Health Connect (Android)
    → Aggregierte Tagesdaten (Schritte, HR, Schlaf, Kalorien)
        → POST /api/health/sync (aus TWA / Companion App)
            → Payload validieren (Zod)
            → Rohdaten in health_raw (TimescaleDB) schreiben
            → Aggregation in daily_summaries triggern
            → Supabase Realtime Event auslösen
                → TanStack Query Cache invalidieren
                    → Dashboard aktualisiert sich live
```

---

## 5. Datenschutz-Strategie für den AI-Coach

**Prinzip: „Anonymisierter Kontext-Layer"**

### Was NIEMALS an Gemini gesendet wird:
- Name, E-Mail-Adresse, Benutzername
- Geburtsdatum (nur Alter als Zahl)
- Exakter Standort
- Rohe Health-Zeitreihendaten
- Mahlzeiten-Fotos (nur die daraus extrahierten Nährwerte)
- Supabase User-ID oder sonstige Identifier

### Was AN Gemini gesendet wird:

```typescript
// Wird in einer Supabase Edge Function ausgeführt (Deno)
interface AnonymizedAIContext {
  todayMetrics: {
    caloriesConsumed: number;
    caloriesTarget: number;
    caloriesBurned: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    stepsToday: number;
    activeMinutes: number;
    sleepHours: number;
    sleepScore: number;          // 0-100
    restingHeartRate: number;
    hrvMorning: number;
    recoveryScore: number;       // berechnet aus HRV + Schlaf + RHR
  };
  weeklyTrends: {
    avgCaloriesConsumed: number;
    avgProteinG: number;
    workoutsCompleted: number;
    totalVolumeKg: number;
    muscleGroupFrequency: Record<string, number>; // {"chest": 2, "back": 1}
    avgSleepHours: number;
    avgHrv: number;
    weightTrendKg: number;       // Differenz zu Vorwoche
  };
  userProfile: {
    heightCm: number;
    weightKg: number;
    age: number;
    fitnessGoal: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'endurance';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  };
  recentTraining: {
    lastWorkoutDaysAgo: number;
    muscleGroupsLastWeek: string[];
    strongestLiftLastWeek: { exerciseName: string; weightKg: number; reps: number };
    estimatedTdee: number;       // Berechnet aus Health-Aktivität + BMR
  };
}
```

### Server-Side Proxy Pattern

```
Client (Browser / App)
    │
    │  POST https://<supabase-project>.supabase.co/functions/v1/ai-coach
    │  Body: { message: "Was sollte ich heute essen?" }
    │
    ▼
Supabase Edge Function (Deno)
    │
    ├── Supabase DB: Metriken für heute + Woche direkt aus lokaler Datenbank abfragen
    ├── anonymizedContext = buildContext(rawData)  ← filtert alle PII
    ├── systemPrompt + anonymizedContext + userMessage → Gemini API
    │
    ▼
Gemini API
    │
    ▼
Response → Client
```

---

## 6. Datenbank-Design (Supabase)

### 6.1 Skalierungs-Strategie (Tiered Storage)

| Schicht | Technologie | Inhalt | Retention |
|---------|-------------|--------|-----------|
| Raw Layer | TimescaleDB Hypertable | Health-Rohdaten pro Minute | 90 Tage, dann gelöscht |
| Aggregated Layer | PostgreSQL | Tägliche Summaries (HRV, Steps, Sleep) | Permanent |
| App Layer | PostgreSQL | Mahlzeiten, Workouts, Profile | Permanent |

TimescaleDB komprimiert nach 30 Tagen automatisch und reduziert Speicher um bis zu 95%.

### 6.2 TimescaleDB Setup

```sql
-- Extension aktivieren (Supabase Dashboard → Extensions)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Hypertable für Health-Rohdaten
CREATE TABLE health_raw (
  time         TIMESTAMPTZ      NOT NULL,
  user_id      UUID             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type  TEXT             NOT NULL,
  value        NUMERIC(10, 4)   NOT NULL,
  source       TEXT             DEFAULT 'health_connect'
);

SELECT create_hypertable('health_raw', 'time', chunk_time_interval => INTERVAL '1 day');

-- Automatische Kompression nach 30 Tagen
ALTER TABLE health_raw SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'user_id, metric_type',
  timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('health_raw', INTERVAL '30 days');

-- Rohdaten nach 90 Tagen löschen (Summaries bleiben erhalten)
SELECT add_retention_policy('health_raw', INTERVAL '90 days');

-- Index für schnelle Abfragen
CREATE INDEX ON health_raw (user_id, metric_type, time DESC);
```

### 6.3 Vollständiges Schema

```sql
-- ============================================================
-- PROFILES (erweitert auth.users)
-- ============================================================
CREATE TABLE profiles (
  id                      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name            TEXT,
  height_cm               NUMERIC(5, 2),
  weight_kg               NUMERIC(5, 2),
  birth_date              DATE,
  sex                     TEXT        CHECK (sex IN ('male', 'female', 'other')),
  fitness_goal            TEXT        CHECK (fitness_goal IN (
                                        'muscle_gain', 'fat_loss', 'maintenance', 'endurance'
                                      )),
  activity_level          TEXT        CHECK (activity_level IN (
                                        'sedentary', 'light', 'moderate', 'active', 'very_active'
                                      )),
  -- Health Connect Status
  health_connect_enabled  BOOLEAN     DEFAULT FALSE,
  health_connect_last_sync TIMESTAMPTZ,
  -- Kalorienziel (überschreibt TDEE-Berechnung, optional)
  calorie_target_override INTEGER,
  protein_target_g        INTEGER,
  onboarding_completed    BOOLEAN     DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY TARGETS (flexible tägliche Ziele)
-- ============================================================
CREATE TABLE daily_targets (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date              DATE    NOT NULL,
  calories_target   INTEGER,
  protein_target_g  INTEGER,
  carbs_target_g    INTEGER,
  fat_target_g      INTEGER,
  note              TEXT,
  UNIQUE (user_id, date)
);

CREATE INDEX ON daily_targets (user_id, date DESC);

-- ============================================================
-- DAILY SUMMARIES (Health aggregiert, permanent)
-- ============================================================
CREATE TABLE daily_summaries (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date              DATE    NOT NULL,
  -- Aktivität
  steps             INTEGER,
  calories_burned   INTEGER,
  active_minutes    INTEGER,
  distance_km       NUMERIC(6, 3),
  floors_climbed    INTEGER,
  -- Schlaf
  sleep_minutes_total  INTEGER,
  sleep_minutes_deep   INTEGER,
  sleep_minutes_rem    INTEGER,
  sleep_minutes_light  INTEGER,
  sleep_minutes_awake  INTEGER,
  sleep_score          NUMERIC(4, 2),  -- 0-100
  sleep_start          TIME,
  sleep_end            TIME,
  -- Herzfrequenz
  resting_heart_rate   INTEGER,
  hrv_rmssd            NUMERIC(6, 2),
  hrv_score            NUMERIC(4, 2),  -- normalisiert 0-100
  -- Zonen (Minuten in Zone 1/2/3/4/5)
  hr_zone_1_minutes    INTEGER,
  hr_zone_2_minutes    INTEGER,
  hr_zone_3_minutes    INTEGER,
  -- Sonstige
  spo2_avg             NUMERIC(5, 2),
  weight_kg            NUMERIC(5, 2),
  UNIQUE (user_id, date)
);

CREATE INDEX ON daily_summaries (user_id, date DESC);

-- ============================================================
-- FOOD TRACKING
-- ============================================================
CREATE TABLE food_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  meal_type        TEXT        NOT NULL CHECK (meal_type IN (
                                 'breakfast', 'lunch', 'dinner', 'snack'
                               )),
  food_name        TEXT        NOT NULL,
  brand_name       TEXT,
  quantity_g       NUMERIC(7, 2) NOT NULL DEFAULT 100,
  calories         NUMERIC(7, 2) NOT NULL,
  protein_g        NUMERIC(6, 2) NOT NULL DEFAULT 0,
  carbs_g          NUMERIC(6, 2) NOT NULL DEFAULT 0,
  fat_g            NUMERIC(6, 2) NOT NULL DEFAULT 0,
  fiber_g          NUMERIC(6, 2),
  sugar_g          NUMERIC(6, 2),
  sodium_mg        NUMERIC(7, 2),
  barcode          TEXT,
  openfoodfacts_id TEXT,
  photo_url        TEXT,
  ai_estimated     BOOLEAN     DEFAULT FALSE,
  ai_confidence    NUMERIC(3, 2),
  notes            TEXT
);

CREATE INDEX ON food_logs (user_id, logged_at DESC);
CREATE INDEX ON food_logs (user_id, (logged_at::DATE));

-- ============================================================
-- ÜBUNGS-BIBLIOTHEK
-- ============================================================
CREATE TABLE exercises (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL,
  name_de          TEXT,
  category         TEXT    NOT NULL CHECK (category IN (
                             'strength', 'cardio', 'flexibility', 'plyometric'
                           )),
  equipment        TEXT    CHECK (equipment IN (
                             'barbell', 'dumbbell', 'cable', 'machine',
                             'bodyweight', 'kettlebell', 'bands', 'other'
                           )),
  muscle_primary   TEXT[]  NOT NULL DEFAULT '{}',
  muscle_secondary TEXT[]  DEFAULT '{}',
  force_type       TEXT    CHECK (force_type IN ('push', 'pull', 'static', 'hinge', 'squat')),
  instructions     TEXT,
  video_url        TEXT,
  is_custom        BOOLEAN DEFAULT FALSE,
  user_id          UUID    REFERENCES profiles(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON exercises (is_custom, user_id);
CREATE INDEX ON exercises USING GIN (muscle_primary);

-- ============================================================
-- TRAININGSPROGRAMME
-- ============================================================
CREATE TABLE programs (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            TEXT    NOT NULL,
  description     TEXT,
  duration_weeks  INTEGER,
  days_per_week   INTEGER,
  difficulty      TEXT    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  goal            TEXT    CHECK (goal IN ('hypertrophy', 'strength', 'endurance', 'general')),
  is_active       BOOLEAN DEFAULT FALSE,
  is_template     BOOLEAN DEFAULT FALSE,
  is_recovery_week BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE program_days (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID    NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  day_number  INTEGER NOT NULL,
  name        TEXT,
  is_rest_day BOOLEAN DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE program_day_exercises (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_day_id  UUID    NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
  exercise_id     UUID    NOT NULL REFERENCES exercises(id),
  sets_target     INTEGER,
  reps_target     TEXT,
  rest_seconds    INTEGER,
  weight_note     TEXT,
  superset_group  INTEGER,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- WORKOUT-SESSIONS
-- ============================================================
CREATE TABLE workout_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id      UUID        REFERENCES programs(id),
  program_day_id  UUID        REFERENCES program_days(id),
  name            TEXT,
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
  ) STORED,
  notes           TEXT,
  rpe_overall     INTEGER     CHECK (rpe_overall BETWEEN 1 AND 10),
  total_volume_kg NUMERIC(10, 2),
  health_strain   NUMERIC(5, 2),
  location        TEXT        CHECK (location IN ('gym', 'home', 'outdoor', 'other'))
);

CREATE INDEX ON workout_sessions (user_id, started_at DESC);

CREATE TABLE workout_sets (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID        NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id      UUID        NOT NULL REFERENCES exercises(id),
  set_number       INTEGER     NOT NULL,
  reps             INTEGER,
  weight_kg        NUMERIC(6, 2),
  duration_seconds INTEGER,
  distance_m       NUMERIC(8, 2),
  rpe              NUMERIC(3, 1) CHECK (rpe BETWEEN 0 AND 10),
  is_warmup        BOOLEAN     DEFAULT FALSE,
  is_dropset       BOOLEAN     DEFAULT FALSE,
  is_pr            BOOLEAN     DEFAULT FALSE,
  recorded_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON workout_sets (session_id);
CREATE INDEX ON workout_sets (exercise_id, weight_kg DESC);

-- ============================================================
-- PERSONAL RECORDS
-- ============================================================
CREATE TABLE personal_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id  UUID        NOT NULL REFERENCES exercises(id),
  pr_type      TEXT        NOT NULL CHECK (pr_type IN ('1rm', 'max_reps', 'max_volume')),
  value        NUMERIC(8, 2) NOT NULL,
  achieved_at  TIMESTAMPTZ NOT NULL,
  set_id       UUID        REFERENCES workout_sets(id),
  UNIQUE (user_id, exercise_id, pr_type)
);

-- ============================================================
-- AI-KONVERSATIONEN
-- ============================================================
CREATE TABLE ai_conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT        NOT NULL,
  context_snapshot JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON ai_conversations (user_id, created_at DESC);

-- ============================================================
-- BODY MEASUREMENTS
-- ============================================================
CREATE TABLE body_measurements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg   NUMERIC(5, 2),
  body_fat_pct NUMERIC(4, 2),
  muscle_mass_kg NUMERIC(5, 2),
  chest_cm    NUMERIC(5, 2),
  waist_cm    NUMERIC(5, 2),
  hips_cm     NUMERIC(5, 2),
  arms_cm     NUMERIC(5, 2),
  thighs_cm   NUMERIC(5, 2),
  notes       TEXT
);

-- ============================================================
-- AUDIT LOG (Sicherheit)
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL,
  resource    TEXT        NOT NULL,
  details     JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON audit_logs (user_id, created_at DESC);
```

### 6.4 Row Level Security (RLS)

```sql
-- Für alle User-Tabellen aktivieren
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_targets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises           ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- Standard-Policy: eigene Daten
CREATE POLICY "own_data_only" ON food_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Exercises: eigene ODER globale sehen
CREATE POLICY "exercises_visible" ON exercises
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "exercises_own_write" ON exercises
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Audit Logs: nur eigene lesen
CREATE POLICY "audit_own_only" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());
```

### 6.5 Hilfs-Funktionen & Trigger

```sql
-- Auto-PR-Erkennung beim Einfügen eines Sets
CREATE OR REPLACE FUNCTION check_and_set_pr()
RETURNS TRIGGER AS $$
DECLARE
  current_max NUMERIC;
  user_id_val UUID;
BEGIN
  SELECT s.user_id INTO user_id_val
  FROM workout_sessions s WHERE s.id = NEW.session_id;

  -- 1RM-Check (Epley-Formel)
  SELECT COALESCE(MAX(value), 0) INTO current_max
  FROM personal_records
  WHERE user_id = user_id_val
    AND exercise_id = NEW.exercise_id
    AND pr_type = '1rm';

  IF NEW.weight_kg * (1 + NEW.reps / 30.0) > current_max THEN
    NEW.is_pr := TRUE;
    INSERT INTO personal_records (user_id, exercise_id, pr_type, value, achieved_at, set_id)
    VALUES (user_id_val, NEW.exercise_id, '1rm',
            NEW.weight_kg * (1 + NEW.reps / 30.0), NEW.recorded_at, NEW.id)
    ON CONFLICT (user_id, exercise_id, pr_type)
    DO UPDATE SET value = EXCLUDED.value, achieved_at = EXCLUDED.achieved_at, set_id = EXCLUDED.set_id;
  END IF;

  -- max_reps PR (gleiches Gewicht, mehr Reps)
  SELECT COALESCE(MAX(value), 0) INTO current_max
  FROM personal_records
  WHERE user_id = user_id_val
    AND exercise_id = NEW.exercise_id
    AND pr_type = 'max_reps';

  IF NEW.reps > current_max THEN
    INSERT INTO personal_records (user_id, exercise_id, pr_type, value, achieved_at, set_id)
    VALUES (user_id_val, NEW.exercise_id, 'max_reps', NEW.reps, NEW.recorded_at, NEW.id)
    ON CONFLICT (user_id, exercise_id, pr_type)
    DO UPDATE SET value = EXCLUDED.value, achieved_at = EXCLUDED.achieved_at, set_id = EXCLUDED.set_id;
  END IF;

  -- max_volume PR (höchstes Set-Volumen)
  SELECT COALESCE(MAX(value), 0) INTO current_max
  FROM personal_records
  WHERE user_id = user_id_val
    AND exercise_id = NEW.exercise_id
    AND pr_type = 'max_volume';

  IF (NEW.reps * NEW.weight_kg) > current_max THEN
    INSERT INTO personal_records (user_id, exercise_id, pr_type, value, achieved_at, set_id)
    VALUES (user_id_val, NEW.exercise_id, 'max_volume', NEW.reps * NEW.weight_kg, NEW.recorded_at, NEW.id)
    ON CONFLICT (user_id, exercise_id, pr_type)
    DO UPDATE SET value = EXCLUDED.value, achieved_at = EXCLUDED.achieved_at, set_id = EXCLUDED.set_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_check_pr
  BEFORE INSERT ON workout_sets
  FOR EACH ROW EXECUTE FUNCTION check_and_set_pr();

-- Total Volume bei Session-Ende berechnen
CREATE OR REPLACE FUNCTION update_session_volume()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE workout_sessions
  SET total_volume_kg = (
    SELECT COALESCE(SUM(reps * weight_kg), 0)
    FROM workout_sets
    WHERE session_id = NEW.session_id AND NOT is_warmup
  )
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_volume
  AFTER INSERT OR UPDATE OR DELETE ON workout_sets
  FOR EACH STATEMENT EXECUTE FUNCTION update_session_volume();
```

---

## 7. API-Integrationen

### 7.1 Health Data Sync (generisch — kein Hersteller-Lock-in)

Anstatt auf einen einzelnen Anbieter (Fitbit) zu setzen, nutzt FitTrack Pro einen **generischen Sync-Endpunkt**, der von Google Health Connect (Android On-Device) oder später von anderen Health-Datenquellen befüllt werden kann.

**Architektur:**
- Die PWA wird als **Trusted Web Activity (TWA)** oder über eine **simplere Companion-App** auf Android verpackt
- Health Connect liest die Daten lokal auf dem Gerät aus
- Die Companion-App pushed aggregierte Tagesdaten an `/api/health/sync`
- Kein OAuth-Fluss, keine Webhooks, keine Hersteller-API-Abhängigkeit

**Sync-Endpunkt:**

```typescript
// app/api/health/sync/route.ts
import { z } from 'zod';

const HealthPayloadSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  steps: z.number().int().optional(),
  caloriesBurned: z.number().int().optional(),
  activeMinutes: z.number().int().optional(),
  activeZoneMinutes: z.number().int().optional(), // für Strain Score
  sleep: z.object({
    totalMinutes: z.number(),
    deepMinutes: z.number().optional(),
    remMinutes: z.number().optional(),
    lightMinutes: z.number().optional(),
    awakeMinutes: z.number().optional(),
    score: z.number().optional() // 0-100
  }).optional(),
  heartRate: z.object({
    resting: z.number().optional(),
    avg: z.number().optional(),
    hrvRmssd: z.number().optional(),
    zoneMinutes: z.record(z.string(), z.number()).optional()
  }).optional(),
  weight: z.number().optional()
});

export async function POST(req: Request) {
  const session = await getAuthSession(req);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const body = await req.json();
  const parsed = HealthPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Batch-Insert in TimescaleDB + Aggregation triggern
  await insertHealthData(session.user.id, parsed.data);
  await updateDailySummary(session.user.id, parsed.data);

  // Realtime Event auslösen
  await supabase.channel('health_updates').send({
    type: 'broadcast',
    event: 'new_data',
    payload: { userId: session.user.id, date: parsed.data.date }
  });

  return Response.json({ success: true, synced: parsed.data.date });
}
```

**Android Companion (Konzept):**
```kotlin
// Minimaler Kotlin-Code für die Companion-App
// Liest Health Connect → POST an /api/health/sync mit Auth-Token
class HealthSyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val healthData = readHealthConnectData() // Android Health Connect SDK
        val token = getStoredAuthToken() // Aus PWA SharedPreferences

        val response = httpClient.post("https://fittrack-pro.vercel.app/api/health/sync") {
            header("Authorization", "Bearer $token")
            setBody(healthData)
        }

        return if (response.status == HttpStatusCode.OK) Result.success() else Result.retry()
    }
}
```

### 7.2 Open Food Facts API

**Barcode-Scan Flow:**

```typescript
import { BrowserMultiFormatReader } from '@zxing/browser';

const reader = new BrowserMultiFormatReader();
reader.decodeFromVideoDevice(undefined, videoRef.current, async (result) => {
  if (result) {
    const barcode = result.getText();
    const food = await fetchFoodByBarcode(barcode);
    onFoodFound(food);
  }
});
```

**Nährwert-Mapping:**

```typescript
function mapOpenFoodFactsToFoodLog(product: OFFProduct): FoodEntry {
  const n = product.nutriments;
  return {
    food_name:    product.product_name,
    brand_name:   product.brands,
    barcode:      product.code,
    openfoodfacts_id: product._id,
    calories:     n['energy-kcal_100g'] ?? n['energy_100g'] / 4.184,
    protein_g:    n['proteins_100g'],
    carbs_g:      n['carbohydrates_100g'],
    fat_g:        n['fat_100g'],
    fiber_g:      n['fiber_100g'],
    sugar_g:      n['sugars_100g'],
    sodium_mg:    (n['sodium_100g'] ?? 0) * 1000,
  };
}
```

### 7.3 Google Gemini API

**AI-Coach Chat:**

```typescript
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { message, conversationHistory } = await req.json();
  const userId = await getAuthenticatedUserId(req);
  const context = await buildAnonymizedContext(userId);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: `You are FitTrack Pro, a personal health assistant...`,
  });

  // Max. 10 Nachrichten Kontext
  const chat = model.startChat({ history: conversationHistory.slice(-10) });
  const result = await chat.sendMessage(message);
  await saveConversation(userId, message, result.response.text(), context);
  return Response.json({ reply: result.response.text() });
}
```

**Food Vision (Foto → Kalorien):**

```typescript
export async function POST(req: Request) {
  const formData = await req.formData();
  const imageFile = formData.get('image') as File;
  const imageBytes = await imageFile.arrayBuffer();
  const base64Image = Buffer.from(imageBytes).toString('base64');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent([
    { inlineData: { mimeType: imageFile.type, data: base64Image } },
    `Analyze this meal photo. Return ONLY valid JSON...`
  ]);

  const text = result.response.text();
  const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

  // Food-Namen werden via lokale Mapping-Tabelle übersetzt
  return Response.json(translateFoodItems(parsed));
}
```

---

## 8. Feature-Module

### 8.1 Dashboard (Home)

**Widgets (Whoop-Style, Dark Mode):**

| Widget | Datenquelle | Visualisierung |
|--------|-------------|----------------|
| Recovery Score | HRV + Schlaf + RHR | Großer Ring (0-100%) mit Farbe Grün/Gelb/Rot |
| Strain Score | active_zone_minutes | Gauge (0-21, Whoop-Skala) |
| Kalorien heute | food_logs + calories_burned | Doppelter Ring (consumed vs. burned vs. TDEE) |
| Schlaf letzte Nacht | daily_summaries | Kreisdiagramm + Schlafphasen-Balken |
| Herzfrequenz | health_raw | 24h Line Chart mit Zonen-Coloring |
| Schritte heute | daily_summaries | Progress Bar vs. Tagesziel (10.000) |
| HRV Trend | daily_summaries | 7-Tage Sparkline |
| Heutige Aktivitäten | workout_sessions + Health | Aktivitätsliste mit Dauer/Kalorien |
| Wöchentlicher Streak | workout_sessions | Kalender-Heatmap |

### 8.2 Ernährung

**Mahlzeit hinzufügen — drei Wege:**

1. **BARCODE**: Kamera → @zxing scannt EAN/UPC → Open Food Facts API → Menge eingeben → Speichern
2. **SUCHE**: Debounced Open Food Facts Search → Ergebnisliste → Auswählen → Menge → Speichern
3. **FOTO-KI**: Bild an /api/ai/food-vision → Gemini gibt JSON → Interaktive Liste zum Bestätigen/Editieren → Speichern (ai_estimated = true)

**Draft-System:** Nicht abgeschickte Mahlzeit-Eingaben werden automatisch als Draft in IndexedDB gespeichert.

### 8.3 Krafttraining

**Aktives Workout (Repcount-Style, scrollbar):**

1. Workout starten (frei oder aus Programm)
2. Übung auswählen / vorbelegt
3. Set-Reihe mit Previous-Best-Anzeige
4. Rest-Timer startet automatisch (Hintergrund + Push-Notification)
5. Workout beenden → Gesamtvolumen, Dauer, RPE

**Muskelkarte (SVG):**

| Status | Farbe | Bedingung |
|--------|-------|-----------|
| neglected | `#ef4444` | >7 Tage kein Training |
| recovering | `#f97316` | 1-2 Tage + hohes Volumen |
| fresh | `#22c55e` | 3-5 Tage seit Training |
| trained_light | `#3b82f6` | 1-2 Tage + geringes Volumen |
| trained_heavy | `#8b5cf6` | Heute trainiert |

**Deload/Recovery Week:** Manuell im Programm als `is_recovery_week = true` markierbar. In dieser Woche werden Muskeln als "fresh" dargestellt (keine "neglected"-Warnung).

### 8.4 AI Coach

- **Chat-Interface**: Persistente Konversation (max. 10 Nachrichten Kontext)
- **Kontext-Chips**: „Heute", „Diese Woche", „Ernährung", „Training", „Schlaf", „Muskelkarte"
- **Proaktive Daily Summary**: Täglicher Cron Job, generiert morgens um 7:00 Uhr
- **Fallback bei Gemini-Ausfall**: "Der AI-Coach ist temporär nicht verfügbar. Bitte gib deine Frage manuell ein oder versuche es später erneut."

### 8.5 Profil & Einstellungen

- **Sprach-Toggle**: DE (Default) / EN
- **Debug-Section**: Verbindungsstatus, manueller Reconnect, lokales Error-Log, Queue-Status
- **Daten-Export**: JSON + CSV als ZIP (DSGVO-konform)
- **Monatlicher Export-Reminder**: In-App-Notification "Erstelle dein monatliches Backup"
- **Konto löschen**: DSGVO-konform, cascades alles

---

## 9. State-Management & App-Logik

### 9.1 Workout-State-Maschine

```
IDLE
  → START_WORKOUT → ACTIVE

ACTIVE
  → SELECT_EXERCISE → EXERCISE_SELECTED
  → ADD_SET → SET_ACTIVE
  → COMPLETE_SET → RESTING
  → END_WORKOUT → COMPLETING → SYNCING → IDLE

EXERCISE_SELECTED
  → ADD_SET → SET_ACTIVE
  → CANCEL → ACTIVE

SET_ACTIVE
  → LOG_SET → RESTING
  → SKIP_SET → ACTIVE

RESTING
  → TIMER_EXPIRED → SET_ACTIVE
  → SKIP_REST → SET_ACTIVE
  → END_WORKOUT → COMPLETING

COMPLETING
  → CONFIRM_END → SYNCING
  → CANCEL → ACTIVE

SYNCING
  → SYNC_SUCCESS → IDLE
  → SYNC_FAIL → QUEUED (Offline)
```

**App-Kill während Workout:** Session-Daten werden alle 30 Sekunden in IndexedDB (Dexie) persistiert. Beim App-Start wird geprüft: `if (unfinishedSession) → Prompt "Workout fortsetzen?"`

### 9.2 Multi-Tab-Sperre (BroadcastChannel)

Statt fehleranfälligem `localStorage` wird der **BroadcastChannel API** genutzt. Tabs kommunizieren in Echtzeit. Stürzt ein Tab ab, verschwindet er automatisch aus dem Kanal — keine "Geister-Locks".

```typescript
// hooks/useWorkoutLock.ts
import { useEffect, useState } from 'react';

const WORKOUT_CHANNEL = 'fittrack_workout_sync';

export function useWorkoutLock(isActive: boolean) {
  const [isLockedByOtherTab, setIsLockedByOtherTab] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel(WORKOUT_CHANNEL);

    // Wenn dieser Tab das Workout startet, anderen Tabs Bescheid geben
    if (isActive) {
      channel.postMessage({ type: 'WORKOUT_STARTED' });
      // Heartbeat alle 5 Sekunden
      const interval = setInterval(() => {
        channel.postMessage({ type: 'WORKOUT_ACTIVE' });
      }, 5000);
      return () => {
        clearInterval(interval);
        channel.postMessage({ type: 'WORKOUT_ENDED' });
        channel.close();
      };
    }

    // Wenn dieser Tab inaktiv ist, auf Nachrichten hören
    channel.onmessage = (event) => {
      if (event.data.type === 'WORKOUT_STARTED' || event.data.type === 'WORKOUT_ACTIVE') {
        setIsLockedByOtherTab(true);
      } else if (event.data.type === 'WORKOUT_ENDED') {
        setIsLockedByOtherTab(false);
      }
    };

    // Nach 6 Sekunden ohne Heartbeat den Lock automatisch lösen
    let timeout: NodeJS.Timeout;
    if (isLockedByOtherTab) {
      timeout = setTimeout(() => setIsLockedByOtherTab(false), 6000);
    }

    return () => {
      clearTimeout(timeout);
      channel.close();
    };
  }, [isActive, isLockedByOtherTab]);

  return isLockedByOtherTab;
}
```

### 9.3 Zustand-Store (Zustand + Persist)

```typescript
// stores/workoutStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExerciseSet = {
  id: string; // Temporäre UUID für lokales Tracking
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  isWarmup: boolean;
  isCompleted: boolean;
};

export type ActiveExercise = {
  exerciseId: string;
  name: string;
  sets: ExerciseSet[];
};

interface WorkoutState {
  // State
  sessionId: string | null;
  status: 'IDLE' | 'ACTIVE' | 'RESTING' | 'COMPLETING';
  startedAt: number | null;
  exercises: ActiveExercise[];
  currentRestEndsAt: number | null;

  // Actions
  startWorkout: (programId?: string) => void;
  addExercise: (exerciseId: string, name: string) => void;
  logSet: (exerciseIndex: number, set: Omit<ExerciseSet, 'id' | 'isCompleted'>) => void;
  completeSet: (exerciseIndex: number, setId: string, restSeconds: number) => void;
  skipRest: () => void;
  endWorkout: () => void;
  reset: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      status: 'IDLE',
      startedAt: null,
      exercises: [],
      currentRestEndsAt: null,

      startWorkout: () => set({ 
        sessionId: crypto.randomUUID(), 
        status: 'ACTIVE', 
        startedAt: Date.now(),
        exercises: [] 
      }),

      addExercise: (exerciseId, name) => set((state) => ({
        exercises: [...state.exercises, { exerciseId, name, sets: [] }]
      })),

      logSet: (exerciseIndex, newSet) => set((state) => {
        const exercises = [...state.exercises];
        exercises[exerciseIndex].sets.push({
          ...newSet,
          id: crypto.randomUUID(),
          isCompleted: false
        });
        return { exercises };
      }),

      completeSet: (exerciseIndex, setId, restSeconds) => set((state) => {
        const exercises = [...state.exercises];
        const setIndex = exercises[exerciseIndex].sets.findIndex(s => s.id === setId);
        if (setIndex > -1) {
          exercises[exerciseIndex].sets[setIndex].isCompleted = true;
        }
        return { 
          exercises, 
          status: 'RESTING', 
          currentRestEndsAt: Date.now() + (restSeconds * 1000) 
        };
      }),

      skipRest: () => set({ status: 'ACTIVE', currentRestEndsAt: null }),

      endWorkout: () => set({ status: 'COMPLETING' }),

      reset: () => set({ 
        sessionId: null, status: 'IDLE', startedAt: null, exercises: [], currentRestEndsAt: null 
      })
    }),
    {
      name: 'fittrack-workout-storage', // Gespeichert in localStorage als Fallback bei App-Kill
    }
  )
);
```

### 9.4 Zustand vs. Server-State

- **Workout-Sets**: Lokal in Zustand + IndexedDB, erst am Workout-Ende Batch-Insert in Supabase
- **Food-Logs**: Sofort in Supabase (optimistisch im UI), da einfache CRUD-Operation
- **Dashboard-Daten**: TanStack Query mit Stale-Time 60s

### 9.5 Rest-Timer (Hintergrund)

- **Technik**: Service Worker + Web Push API (Notification API für PWA)
- **Ablauf**: Timer läuft im Service Worker, zeigt Notification bei Ablauf
- **Konfiguration**: Default 90s (Kraft), 60s (Hypertrophie), 180s (Kraft/Compound), custom

---

## 10. PWA & Offline-Strategie

### 10.1 Service Worker (Workbox)

```typescript
// next.config.ts — PWA-Konfiguration
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'food-api', expiration: { maxAgeSeconds: 86400 } }
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
    },
    {
      urlPattern: /\/api\/(food|workout|nutrition|health)\/.*/i,
      handler: 'NetworkFirst',
      options: { cacheName: 'app-api', expiration: { maxAgeSeconds: 300 } }
    },
  ],
});
```

### 10.2 Offline-Queue (Dexie.js)

```typescript
interface PendingOperation {
  id?: number;
  type: 'food_log' | 'workout_set' | 'workout_session';
  payload: unknown;
  timestamp: number;
  retryCount: number;
}

class OfflineQueueDB extends Dexie {
  pending!: Dexie.Table<PendingOperation, number>;
  constructor() {
    super('FitTrackProOfflineQueue');
    this.version(1).stores({ pending: '++id, type, timestamp' });
  }
}

export const offlineQueue = new OfflineQueueDB();

// Batch-Sync bei Wiederverbindung
export async function flushOfflineQueue(): Promise<void> {
  const items = await offlineQueue.pending.orderBy('timestamp').toArray();

  // Batch-Sync: 10 Items pro Request
  const batchSize = 10;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      await syncBatch(batch);
      for (const item of batch) {
        await offlineQueue.pending.delete(item.id!);
      }
    } catch {
      for (const item of batch) {
        await offlineQueue.pending.update(item.id!, { 
          retryCount: item.retryCount + 1 
        });
      }
    }
  }

  // Fehlgeschlagene Items (>3 Retries) in Fehlerliste verschieben
  const failed = await offlineQueue.pending.where('retryCount').above(3).toArray();
  // ... in separate failed-Table verschieben
}

window.addEventListener('online', flushOfflineQueue);
```

### 10.3 PWA Manifest

```json
{
  "name": "FitTrack Pro",
  "short_name": "FitTrack",
  "description": "Dein persönlicher Health Companion",
  "theme_color": "#0a0a0a",
  "background_color": "#0a0a0a",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## 11. Fehlerfälle, Edge Cases & Resilienz

| Szenario | Verhalten | UI-Feedback |
|----------|-----------|-------------|
| **Health Connect Deaktivierung** | Letzte bekannte Daten bleiben sichtbar | Stale-Badge: "Letzte Sync: vor 2h" + Reconnect-Button |
| **Gemini API Ausfall** | Fallback-Antwort | Toast: "AI-Coach temporär nicht verfügbar. Bitte manuell eingeben." |
| **Open Food Facts Down** | Sofort manuelle Eingabe | Modal schließt sich, Input-Feld fokussiert |
| **Supabase Realtime Disconnect** | Manueller Reconnect in Debug | Offline-Banner + Reconnect-Button in Einstellungen → Debug |
| **Offline → Online Merge** | Beide Sets behalten (da nur fertige Workouts gesynct) | Kein Konflikt, da Workout-Session atomar |
| **Queue-Overflow** | Batch-Sync (10 Items), max. 3 Retries, dann Fehlerliste | Badge auf Profil-Icon zeigt fehlgeschlagene Items |
| **Service Worker Fehler** | Stilles Logging lokal | Kein User-Feedback, Log in Debug-Section sichtbar |
| **Multi-Tab Workout** | BroadcastChannel-Sperre | Blockierendes Modal: "Workout läuft in anderem Tab" |
| **App-Kill während Workout** | Session persistiert in IndexedDB (Zustand persist) | Beim Neustart: "Workout fortsetzen?" Dialog |
| **Health Sync Payload ungültig** | Zod-Validation lehnt ab | 400 Error, Companion-App retry mit Exponential Backoff |

---

## 12. Projektstruktur

```
fittrack-pro/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Shell: Bottom Nav + Header
│   │   ├── page.tsx                # Dashboard / Home
│   │   ├── nutrition/
│   │   │   ├── page.tsx            # Tages-Log
│   │   │   ├── add/page.tsx        # Mahlzeit hinzufügen
│   │   │   ├── stats/page.tsx      # Wöchentliche Makro-Trends
│   │   │   └── [date]/page.tsx     # Vergangener Tag
│   │   ├── training/
│   │   │   ├── page.tsx            # Training Übersicht + Muskelkarte
│   │   │   ├── workout/
│   │   │   │   ├── new/page.tsx    # Freies Training starten
│   │   │   │   └── [sessionId]/page.tsx  # Aktives Workout
│   │   │   ├── programs/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [programId]/page.tsx
│   │   │   ├── exercises/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [exerciseId]/page.tsx
│   │   │   └── stats/page.tsx
│   │   ├── coach/page.tsx          # AI-Coach Chat
│   │   └── profile/page.tsx        # Profil & Einstellungen
│   └── api/
│       ├── health/
│       │   └── sync/route.ts       # Generischer Health Sync (Health Connect)
│       ├── ai/
│       │   ├── chat/route.ts
│       │   ├── food-vision/route.ts
│       │   └── daily-summary/route.ts
│       ├── food/
│       │   ├── search/route.ts
│       │   └── barcode/[code]/route.ts
│       └── health/route.ts         # Health Check Endpoint
│
├── components/
│   ├── ui/                         # shadcn/ui Basis
│   ├── dashboard/
│   ├── nutrition/
│   ├── training/
│   ├── coach/
│   └── shared/
│       ├── BottomNav.tsx
│       ├── OfflineBanner.tsx
│       ├── QuickAddFAB.tsx
│       └── MetricCard.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── health/
│   │   └── syncValidator.ts        # Zod-Schemas für Health Payload
│   ├── ai/
│   ├── food/
│   ├── offline/
│   └── crypto/
│
├── hooks/
│   ├── useWorkoutLock.ts           # BroadcastChannel Multi-Tab-Sperre
│   └── ...
│
├── stores/
│   ├── workoutStore.ts             # Zustand + Persist (typisiert)
│   └── nutritionStore.ts
│
├── types/
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── tests/
│   ├── unit/                       # Vitest
│   └── e2e/                        # Playwright
│
└── public/
    ├── manifest.json
    ├── icons/
    └── assets/
        ├── muscle-map-front.svg
        └── muscle-map-back.svg
```

---

## 13. Sicherheit

| Bereich | Maßnahme |
|---------|----------|
| Health Sync | Auth-Token (Supabase JWT) im Header, Zod-Validation, keine PII im Payload |
| Supabase RLS | Alle User-Tabellen: Nur eigene Daten |
| API Routes | Alle sensiblen Endpunkte: Supabase Auth Session-Check + Zod-Validation |
| Gemini API Key | Nur serverseitig (Vercel Environment) |
| AI Prompts | Context Builder filtert alle PII |
| Food-Fotos | Werden nicht persistiert |
| HTTPS | Vercel erzwingt SSL; HSTS aktiviert |
| CSP | `default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://*.supabase.co https://world.openfoodfacts.org data: blob:; connect-src 'self' https://*.supabase.co https://world.openfoodfacts.org https://generativelanguage.googleapis.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self';` |
| Rate Limiting | 5 Requests/Sekunde pro Route via Vercel KV / Upstash Redis |
| Brute-Force | IP-basiert: Max. 10 Login-Versuche / 5 Minuten |
| CSRF | SameSite=Lax Cookies + zusätzlicher `X-CSRF-Token` Header für Mutations |
| Input Validation | Zod für alle API-Inputs; React Hook Form + Zod für Client-Formulare |
| Audit Logging | AI-Chat-Anfragen + Health-Sync-Zugriffe in `audit_logs` |
| DSGVO Export | ZIP mit JSON (vollständig) + CSV-Dateien pro Tabelle |

**Token Encryption (nicht mehr für Fitbit, aber für zukünftige OAuth-Integrationen):**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
  const decipher = createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final()
  ]).toString('utf8');
}
```

---

## 14. Testing & Qualitätssicherung

### 14.1 Unit Tests (Vitest)

- **Abdeckung**: Alle `lib/` Helper, Stores, Hooks
- **Ziel**: >80% Coverage für Business-Logik
- **Tools**: Vitest + React Testing Library + MSW (API Mocking)

### 14.2 E2E Tests (Playwright)

**Kritische User-Journeys (müssen grün sein vor Deploy):**

1. **Auth-Flow**: Register → Onboarding → Dashboard-Landing
2. **Workout-Flow**: Training starten → Übung auswählen → Set loggen (80kg × 8) → Rest-Timer → Workout beenden → Dashboard zeigt Volumen
3. **Ernährungs-Flow**: Mahlzeit hinzufügen (Barcode-Suche) → Makro-Ringe aktualisieren → Tages-Log anzeigen
4. **AI-Coach-Flow**: Chat öffnen → Frage stellen → Antwort enthält TDEE → Kontext-Chips funktionieren
5. **Offline-Flow**: Netzwerk trennen → Set loggen → Online gehen → Sync erfolgreich → Daten in DB

### 14.3 Performance-Budget

| Metrik | Ziel |
|--------|------|
| Lighthouse Score | ≥90 (Mobile) |
| Time to Interactive (TTI) | <3s auf 3G |
| First Contentful Paint (FCP) | <1.5s |
| Bundle Size (Initial) | <200KB gzipped |
| Bundle Size (Lazy Loaded) | <500KB total |

---

## 15. Monitoring, Observability & Alerting

### 15.1 Error Tracking

- **Sentry**: Frontend + Backend Errors, Source Maps, Release-Tracking
- **Scope**: Alle unhandled Exceptions + manuelles Logging bei Gemini-Fallback

### 15.2 Analytics

- **PostHog**: DSGVO-konform (EU-Hosting), Feature-Usage, Funnel-Analysis
- **Events**: Workout-Start, Food-Log, AI-Chat-Open, Health-Connect-Sync

### 15.3 Health Checks

**Endpoint**: `GET /api/health`

```typescript
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    geminiQuota: await checkGeminiQuota(),
    redis: await checkRedisConnection(),
  };

  const healthy = Object.values(checks).every(Boolean);
  return Response.json({ status: healthy ? 'ok' : 'degraded', checks }, { 
    status: healthy ? 200 : 503 
  });
}
```

### 15.4 Alerting

| Bedingung | Kanal | Aktion |
|-----------|-------|--------|
| `/api/health/sync` 24h keine Requests | Email | "Health-Sync unterbrochen prüfen" |
| AI-Chat Fehlerrate >5% / 1h | Email | Gemini-Quota oder API-Problem prüfen |
| Health Check FAIL >5 Min | Email | Supabase/Vercel-Status prüfen |
| Error-Rate >1% / 1h | Sentry Alert | Release-Rollback erwägen |

---

## 16. CI/CD & Deployment

### 16.1 GitHub Actions

```yaml
name: CI/CD → Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run build

  e2e:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  deploy:
    needs: [quality, e2e]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 16.2 Vercel Cron Jobs

```json
{
  "crons": [
    {
      "path": "/api/ai/daily-summary",
      "schedule": "0 7 * * *"
    }
  ]
}
```

**Cron-Authentifizierung**: `CRON_SECRET` im Header `X-Vercel-Cron-Secret`.

### 16.3 Supabase Migrations

```bash
# Lokale Entwicklung
npx supabase start
npx supabase db diff --use-migra -f migration_name

# Deployment (direkt Production)
npx supabase db push --linked
```

**Schema-Versioning**: `package.json` Version + `schema_migrations` Tabelle. Bei Breaking Changes: `Expand/Contract` Pattern.

---

## 17. Internationalisierung (i18n)

### 17.1 Setup

- **Library**: `next-intl`
- **Sprachen**: Deutsch (Default), Englisch
- **Wechsel**: Toggle in Einstellungen (nicht Browser-Locale)
- **Default**: DE

### 17.2 Lokalisierungsregeln

| Aspekt | Regel |
|--------|-------|
| UI-Texte | Vollständig übersetzt via `next-intl` JSON-Dateien |
| Food-Namen (AI Vision) | Lokale Mapping-Tabelle: `en → de` (z.B. "Chicken Breast" → "Hähnchenbrust") |
| Datumsformat | `DD.MM.YYYY` (DE), `MM/DD/YYYY` (EN) |
| Interne Speicherung | ISO `YYYY-MM-DD` |
| Zahlenformat | Komma für Dezimalen (80,5 kg) — beide Sprachen |
| Einheiten | Nur metrisch (kg, cm, kcal) |
| Übungsbibliothek | `name_de` primär, `name` sekundär (EN) |

---

## 18. Business-Logik & Berechnungen

### 18.1 TDEE-Berechnung

```typescript
function calculateTDEE(profile: UserProfile, healthDaily: DailySummary): number {
  // Mifflin-St. Jeor BMR mit dynamischem Geschlecht
  const sexModifier = profile.sex === 'female' ? -161 : 
                      profile.sex === 'other' ? -78 : 5;

  const bmr = 10 * profile.weightKg
    + 6.25 * profile.heightCm
    - 5 * profile.age
    + sexModifier;

  // Aktivitätsfaktor aus Health Connect Active Minutes
  const activityMultiplier =
    healthDaily.activeMinutes < 30  ? 1.2  :
    healthDaily.activeMinutes < 60  ? 1.375 :
    healthDaily.activeMinutes < 90  ? 1.55  :
    healthDaily.activeMinutes < 120 ? 1.725 : 1.9;

  const totalBurned = healthDaily.caloriesBurned;
  return Math.round(bmr * activityMultiplier + (totalBurned * 0.1));
}
```

### 18.2 Kalorienziel-Override

- **Speicherort**: Tabelle `daily_targets` (nicht `profiles`)
- **Logik**: Wenn Eintrag für heute existiert → verwenden. Sonst TDEE berechnen.
- **UI**: Override wird als "Manuell" markiert, jederzeit löschbar.

### 18.3 Recovery Score (komplex)

```typescript
function calculateRecoveryScore(daily: DailySummary, weeklyAvg: WeeklyAvg): number {
  // Normalisierte Sub-Scores (0-100)
  const sleepScore = daily.sleep_score ?? 50;
  const hrvScore = daily.hrv_score ?? 50;
  const rhrScore = Math.max(0, 100 - (daily.resting_heart_rate - 50));

  // 7-Tage-Trend-Gewichtung
  const hrvTrend = daily.hrv_rmssd > weeklyAvg.avgHrv ? 1.1 : 0.9;
  const sleepTrend = daily.sleep_score > weeklyAvg.avgSleepScore ? 1.05 : 0.95;

  // Gewichtete Formel
  const rawScore = (
    sleepScore * 0.35 * sleepTrend +
    hrvScore * 0.40 * hrvTrend +
    rhrScore * 0.25
  );

  return Math.min(100, Math.max(0, Math.round(rawScore)));
}
```

### 18.4 Strain Score

- **Basis**: Health Connect `active_zone_minutes` (Fat Burn + Cardio + Peak)
- **Skalierung**: 0-21 (Whoop-kompatibel)
- **Formel**: `Math.min(21, (activeZoneMinutes / 15))`

### 18.5 PR-Erkennung

Alle drei PR-Typen parallel:
- **1RM**: Epley-Formel (`weight * (1 + reps/30)`)
- **max_reps**: Meiste Wiederholungen mit gleichem Gewicht
- **max_volume**: Höchstes Set-Volumen (`reps * weight`)

### 18.6 Muskelkarten-Logik

| Status | Bedingung |
|--------|-----------|
| neglected | >7 Tage kein Training UND keine aktive Recovery Week |
| recovering | 1-2 Tage seit Training + Volumen > 80% des Wochendurchschnitts |
| fresh | 3-5 Tage seit Training |
| trained_light | 1-2 Tage + Volumen ≤ 80% |
| trained_heavy | Heute trainiert |

**Recovery Week**: `programs.is_recovery_week = true` setzt alle Muskeln auf "fresh" (keine neglected-Warnung).

---

## 19. Environment Variables

```bash
# ── Supabase ─────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # Nur serverseitig!

# ── Google Gemini ─────────────────────────────────────
GOOGLE_GEMINI_API_KEY=AIzaSy...          # Nur serverseitig!

# ── Encryption (für zukünftige OAuth-Integrationen) ─────
ENCRYPTION_KEY=<64-char hex string>      # openssl rand -hex 32

# ── Rate Limiting (Vercel KV / Upstash) ───────────────
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ── Sentry ───────────────────────────────────────────
SENTRY_DSN=https://...@....ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=...

# ── PostHog ──────────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# ── App ───────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://fittrack-pro.vercel.app
CRON_SECRET=<random secret>              # Vercel Cron Auth
```

---

## 20. Migrationsoffenheit: Docker & NAS

Der gesamte Stack ist für eine **spätere Migration auf eigenes NAS / VPS** vorbereitet, ohne dass Vercel jetzt verlassen werden muss.

### 20.1 Docker-Ready Architektur

Falls du später von Vercel wegmigrieren möchtest, ist der Stack vollständig dockerisierbar:

```yaml
# docker-compose.yml (Referenz für zukünftige Migration)
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Cron-Job als separater Container (statt Vercel Cron)
  cron:
    build: .
    command: node cron/daily-summary.js
    environment:
      - CRON_SECRET=${CRON_SECRET}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
    depends_on:
      - app

volumes:
  redis_data:
```

### 20.2 Migrationsschritte (zukünftig)

| Komponente | Vercel (aktuell) | Docker/NAS (zukünftig) |
|------------|------------------|------------------------|
| Hosting | Vercel | Node.js Container + Nginx |
| Cron Jobs | `vercel.json` | `node-cron` oder Linux `crontab` |
| Rate Limiting | Upstash Redis / Vercel KV | Lokaler Redis-Container |
| Edge Functions | Vercel Edge | Standard Node.js Runtime |
| Datenbank | Supabase Cloud | Supabase Self-Hosted oder PostgreSQL-Container |

### 20.3 Code-Vorbereitung

- **Keine Vercel-spezifischen Imports** in Business-Logik (nur in `app/api/` Routes)
- **Environment-Variablen** sind alle über `.env` konfigurierbar
- **Next.js Runtime**: Standard `nodejs` (keine Edge-Runtime-Lock-ins)
- **Keine Vercel-spezifischen APIs** (wie `@vercel/kv`) in Core-Code

---

## 21. MVP Scope & Roadmap

### MVP (V1) — Vollständiger Core

**Phase 1: Foundation (COMPLETED ✅)**
- [x] Supabase Setup: Schema, Migrations, RLS (Standard PostgreSQL - Partitioning optional)
- [x] Auth: Login / Register / Session Management
- [x] Profil-Onboarding: 3-Step Wizard (Körperdaten, Ziel, Aktivitätslevel)
- [x] Design-System: Tailwind Config, Whoop Dark-Mode, shadcn/ui Komponenten
- [x] Bottom Navigation + FAB (Floating Action Button)

**Phase 2: Core Features (TEILWEISE ABGESCHLOSSEN 🚧)**
- [x] Dashboard: Recovery Ring, Strain Gauge, Kalorien-Doppel-Ring, Steps Widget, Sleep Widget
- [x] Workout-Logger: Zustand Store mit Persist Middleware, State-Maschine (IDLE→ACTIVE→RESTING→COMPLETING)
- [x] Workout-Logger: Multi-Tab-Lock via BroadcastChannel, Rest-Timer mit Notifications
- [x] Muskelkarte: SVG Front/Back Views, 14 Muskelgruppen, 5 Status-Farben, Tap/Long-Press Interaktion
- [ ] Health Connect Integration: `/api/health/sync` Endpunkt mit Zod-Validation
- [ ] Health Data: Schema für Herzfrequenz, Schritte, Schlaf, Kalorien
- [x] Ernährung: Hybrid-Suche (BLS Datenbank + Open Food Facts API Fallback), Food Log Listenansicht mit Edit/Delete
- [x] Ernährung: Food Entry Form mit Mengen-Eingabe (g, ml, Liter, kg) und Makro-Berechnung
- [ ] Trainingsprogramme: 5 Templates (PPL, Upper/Lower, Full Body, Hypertrophy, Strength), 35 Übungen
- [x] AI Coach: Gemini 2.5 Flash API, Anonymisierter Kontext-Builder (inkl. Mahlzeiten-Daten), Chat-UI

**Phase 3: AI, API & Polish (NEUER FOKUS 🚀)**
- [x] **Coach Flow (Gemini & Supabase Edge)**: Gemini 2.5 Flash integriert. Datenschutz-konformer System Prompt. Supabase Edge Functions für Chat-Logik.
- [ ] **Nutrition Flow (Gemini Vision)**: AI-Foto-Erkennung einbauen (Bild → Gemini schätzt Essen/Gramm → Mapping auf Food-DB).
- [ ] **Dashboard & Coach (Health API)**: Google Health API (Fit / Connect) anbinden, um echte Live-Daten für Schritte, Schlaf und Vitalwerte in die App zu streamen.
- [ ] **Workout Flow (Vervollständigung)**: Übungsdatenbank (Supabase) mit Suchfunktion, Modals und echter Set/Rep-Speicherung implementieren.
- [ ] Offline-Queue: Dexie.js IndexedDB Integration + Batch-Sync
- [ ] PWA: next-pwa Setup, Service Worker, Manifest
- [ ] Testing: Vitest Unit-Tests, Playwright E2E aktivieren, sobald Features stehen
- [ ] Vercel Deployment + Environment Variables Setup

### V2 — Post-MVP

- [ ] Proaktive AI-Benachrichtigungen (Cron: 7 Uhr Summary Push)
- [ ] Erweiterte Programm-Verwaltung (eigene Programme, Drag & Drop)
- [ ] Detaillierte Schlafanalyse (Phasen-Timeline, Trends)
- [ ] Körpermaß-Tracking (Gewicht-Kurve, Körperfett)
- [ ] Trainingsstatistiken V2: PR-Timeline, Volumenprogression
- [ ] Barcode-Scanner: Selbst erstellte Lebensmittel / eigene DB
- [ ] Daten-Export (CSV: Mahlzeiten, Workouts)
- [ ] Apple Health / iOS HealthKit Integration
- [ ] Garmin / Polar / Coros Integration (generischer Sync)
- [ ] Supabase DB Optimierung: Archivierungs-Policy für alte Workout-Daten
- [ ] Self-Hosting: Vollständige Docker-Compose für NAS

---

*Erstellt für FitTrack Pro — Version 3.0 — Juni 2026*

