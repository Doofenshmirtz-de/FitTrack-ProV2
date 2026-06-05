-- ============================================================
-- FitTrack Pro - Initial Schema Migration
-- Native PostgreSQL Partitioning (pg_partman) + Full Schema
-- ============================================================
-- 
-- IMPORTANT: Before running this migration, enable these extensions 
-- in Supabase Dashboard (Database → Extensions):
--   1. pg_partman - Partition management
--   2. pg_cron - Cron job scheduling
--
-- If these are not enabled, the migration will fail.
-- ============================================================

-- Enable Required Extensions
-- Note: pg_partman and pg_cron not needed for MVP (low data volume)
--       Can be added later for partitioning if data volume grows

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
-- HEALTH RAW - Rohdaten Snapshots
-- ============================================================
-- Note: For MVP, using standard table without partitioning.
--       Partitioning (native or pg_partman) can be added later if data volume requires it.
--       Current data volume: ~1 entry/day = ~90 rows/retention period (negligible)

CREATE TABLE health_raw (
  time         TIMESTAMPTZ      NOT NULL,
  user_id      UUID             NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type  TEXT             NOT NULL,
  value        NUMERIC(10, 4)   NOT NULL,
  source       TEXT             DEFAULT 'health_connect',
  PRIMARY KEY (time, user_id, metric_type)
);

-- Index for fast time-series queries
CREATE INDEX idx_health_raw_user_metric_time ON health_raw (user_id, metric_type, time DESC);

-- Index for efficient cleanup of old data
CREATE INDEX idx_health_raw_time ON health_raw (time);

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
  -- Metadata
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
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
-- Note: Index on date portion removed due to IMMUTABLE requirement
-- Use DATE_TRUNC in queries instead: WHERE DATE_TRUNC('day', logged_at) = '2024-01-01'

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
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint for valid muscle groups
  CONSTRAINT valid_muscle_groups CHECK (
    muscle_primary <@ ARRAY[
      'chest', 'shoulders', 'biceps', 'triceps', 'forearms',
      'abs', 'obliques', 'upper_back', 'lower_back', 'lats',
      'glutes', 'quads', 'hamstrings', 'calves'
    ]::text[]
  )
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
  role        TEXT        NOT NULL CHECK (role IN ('user', 'assistant', 'system_daily')),
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
