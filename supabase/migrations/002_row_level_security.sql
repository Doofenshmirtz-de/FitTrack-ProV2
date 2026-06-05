-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all user tables
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_targets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises           ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_days        ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_day_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_raw          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES: Users can only access their own profile
-- ============================================================
CREATE POLICY "profiles_own_only" ON profiles
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- DAILY TARGETS: Own data only
-- ============================================================
CREATE POLICY "daily_targets_own_only" ON daily_targets
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DAILY SUMMARIES: Own data only
-- ============================================================
CREATE POLICY "daily_summaries_own_only" ON daily_summaries
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- HEALTH RAW: Own data only
-- ============================================================
CREATE POLICY "health_raw_own_only" ON health_raw
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- FOOD LOGS: Own data only
-- ============================================================
CREATE POLICY "food_logs_own_only" ON food_logs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- EXERCISES: Global exercises (user_id IS NULL) OR own custom exercises
-- ============================================================
CREATE POLICY "exercises_select_visible" ON exercises
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "exercises_own_write" ON exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercises_own_update" ON exercises
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercises_own_delete" ON exercises
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- PROGRAMS: Own data only
-- ============================================================
CREATE POLICY "programs_own_only" ON programs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PROGRAM DAYS: Access via parent program
-- ============================================================
CREATE POLICY "program_days_own_only" ON program_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programs 
      WHERE programs.id = program_days.program_id 
      AND programs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM programs 
      WHERE programs.id = program_days.program_id 
      AND programs.user_id = auth.uid()
    )
  );

-- ============================================================
-- PROGRAM DAY EXERCISES: Access via parent program
-- ============================================================
CREATE POLICY "program_day_exercises_own_only" ON program_day_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM program_days pd
      JOIN programs p ON p.id = pd.program_id
      WHERE pd.id = program_day_exercises.program_day_id 
      AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_days pd
      JOIN programs p ON p.id = pd.program_id
      WHERE pd.id = program_day_exercises.program_day_id 
      AND p.user_id = auth.uid()
    )
  );

-- ============================================================
-- WORKOUT SESSIONS: Own data only
-- ============================================================
CREATE POLICY "workout_sessions_own_only" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- WORKOUT SETS: Access via parent session
-- ============================================================
CREATE POLICY "workout_sets_own_only" ON workout_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_sessions 
      WHERE workout_sessions.id = workout_sets.session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions 
      WHERE workout_sessions.id = workout_sets.session_id 
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- ============================================================
-- PERSONAL RECORDS: Own data only
-- ============================================================
CREATE POLICY "personal_records_own_only" ON personal_records
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AI CONVERSATIONS: Own data only
-- ============================================================
CREATE POLICY "ai_conversations_own_only" ON ai_conversations
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- BODY MEASUREMENTS: Own data only
-- ============================================================
CREATE POLICY "body_measurements_own_only" ON body_measurements
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AUDIT LOGS: Only own logs (mainly for transparency)
-- ============================================================
CREATE POLICY "audit_logs_own_only" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- No insert/update/delete policies for audit_logs - these are system-generated
