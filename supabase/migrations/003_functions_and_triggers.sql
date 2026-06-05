-- ============================================================
-- Helper Functions & Triggers
-- ============================================================

-- ============================================================
-- Data Retention for health_raw (90 days)
-- ============================================================
-- Note: Using simple DELETE instead of partitioning for MVP
--       Can be upgraded to pg_partman partitioning if data volume grows

-- Function to clean up old health data (run periodically via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_old_health_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM health_raw 
    WHERE time < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % old health records', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule via pg_cron if available (uncomment when needed)
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
--         PERFORM cron.schedule('cleanup_health_data', '0 4 * * *', 
--             'SELECT cleanup_old_health_data();'
--         );
--     END IF;
-- END $$;

-- ============================================================
-- Auto-PR-Erkennung beim Einfügen eines Sets
-- ============================================================
CREATE OR REPLACE FUNCTION check_and_set_pr()
RETURNS TRIGGER AS $$
DECLARE
  current_max NUMERIC;
  user_id_val UUID;
BEGIN
  -- Get user_id from parent session
  SELECT s.user_id INTO user_id_val
  FROM workout_sessions s WHERE s.id = NEW.session_id;

  -- Skip PR check for non-strength exercises or empty weight/reps
  IF NEW.weight_kg IS NULL OR NEW.reps IS NULL OR NEW.weight_kg <= 0 OR NEW.reps <= 0 THEN
    RETURN NEW;
  END IF;

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
  -- Only check if weight is within 1kg of existing PR
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

-- ============================================================
-- Total Volume bei Session-Ende oder Set-Änderung berechnen
-- ============================================================
CREATE OR REPLACE FUNCTION update_session_volume()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the session's total_volume_kg
  UPDATE workout_sessions
  SET total_volume_kg = (
    SELECT COALESCE(SUM(reps * weight_kg), 0)
    FROM workout_sets
    WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) AND NOT is_warmup
  )
  WHERE id = COALESCE(NEW.session_id, OLD.session_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_volume_on_insert
  AFTER INSERT ON workout_sets
  FOR EACH ROW EXECUTE FUNCTION update_session_volume();

CREATE TRIGGER tr_update_volume_on_update
  AFTER UPDATE ON workout_sets
  FOR EACH ROW EXECUTE FUNCTION update_session_volume();

CREATE TRIGGER tr_update_volume_on_delete
  AFTER DELETE ON workout_sets
  FOR EACH ROW EXECUTE FUNCTION update_session_volume();

-- ============================================================
-- Profile Auto-Creation bei User Signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, onboarding_completed)
  VALUES (NEW.id, NEW.email, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger auf auth.users (wird bei Supabase Auth automatisch ausgeführt)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Updated At Trigger Function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that need updated_at tracking
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summaries_updated_at
  BEFORE UPDATE ON daily_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Audit Log Function for AI Conversations
-- ============================================================
CREATE OR REPLACE FUNCTION log_ai_interaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource, details)
  VALUES (
    NEW.user_id, 
    'ai_' || NEW.role, 
    'ai_conversations',
    jsonb_build_object(
      'conversation_id', NEW.id,
      'role', NEW.role,
      'has_context', NEW.context_snapshot IS NOT NULL
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_ai_conversation_insert
  AFTER INSERT ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION log_ai_interaction();

-- ============================================================
-- Daily Summary Upsert Function
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_daily_summary(
  p_user_id UUID,
  p_date DATE,
  p_steps INTEGER DEFAULT NULL,
  p_calories_burned INTEGER DEFAULT NULL,
  p_active_minutes INTEGER DEFAULT NULL,
  p_distance_km NUMERIC DEFAULT NULL,
  p_sleep_minutes_total INTEGER DEFAULT NULL,
  p_sleep_score NUMERIC DEFAULT NULL,
  p_resting_heart_rate INTEGER DEFAULT NULL,
  p_hrv_rmssd NUMERIC DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO daily_summaries (
    user_id, date, steps, calories_burned, active_minutes, distance_km,
    sleep_minutes_total, sleep_score, resting_heart_rate, hrv_rmssd
  )
  VALUES (
    p_user_id, p_date, p_steps, p_calories_burned, p_active_minutes, p_distance_km,
    p_sleep_minutes_total, p_sleep_score, p_resting_heart_rate, p_hrv_rmssd
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    steps = COALESCE(EXCLUDED.steps, daily_summaries.steps),
    calories_burned = COALESCE(EXCLUDED.calories_burned, daily_summaries.calories_burned),
    active_minutes = COALESCE(EXCLUDED.active_minutes, daily_summaries.active_minutes),
    distance_km = COALESCE(EXCLUDED.distance_km, daily_summaries.distance_km),
    sleep_minutes_total = COALESCE(EXCLUDED.sleep_minutes_total, daily_summaries.sleep_minutes_total),
    sleep_score = COALESCE(EXCLUDED.sleep_score, daily_summaries.sleep_score),
    resting_heart_rate = COALESCE(EXCLUDED.resting_heart_rate, daily_summaries.resting_heart_rate),
    hrv_rmssd = COALESCE(EXCLUDED.hrv_rmssd, daily_summaries.hrv_rmssd),
    updated_at = NOW()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
