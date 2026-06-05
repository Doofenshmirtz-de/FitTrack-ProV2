-- ============================================================
-- Default Training Programs (Templates)
-- ============================================================

-- Insert base exercises first (global exercises with user_id = NULL)
INSERT INTO exercises (name, name_de, category, equipment, muscle_primary, muscle_secondary, force_type, is_custom) VALUES
-- Chest
('Bench Press', 'Bankdrücken', 'strength', 'barbell', ARRAY['chest'], ARRAY['shoulders', 'triceps'], 'push', false),
('Incline Bench Press', 'Schrägbankdrücken', 'strength', 'barbell', ARRAY['chest', 'shoulders'], ARRAY['triceps'], 'push', false),
('Dumbbell Flyes', 'Kurzhantelfliege', 'strength', 'dumbbell', ARRAY['chest'], ARRAY['shoulders'], 'push', false),
('Cable Crossover', 'Kabel-Crossover', 'strength', 'cable', ARRAY['chest'], ARRAY[], 'push', false),
('Push Ups', 'Liegestütze', 'strength', 'bodyweight', ARRAY['chest'], ARRAY['shoulders', 'triceps'], 'push', false),

-- Back
('Deadlift', 'Kreuzheben', 'strength', 'barbell', ARRAY['lower_back', 'glutes', 'hamstrings'], ARRAY['upper_back', 'forearms'], 'pull', false),
('Pull Ups', 'Klimmzüge', 'strength', 'bodyweight', ARRAY['lats', 'biceps'], ARRAY['upper_back', 'forearms'], 'pull', false),
('Barbell Row', 'Rudern mit Langhantel', 'strength', 'barbell', ARRAY['upper_back', 'lats'], ARRAY['biceps', 'lower_back'], 'pull', false),
('Cable Row', 'Kabel-Rudern', 'strength', 'cable', ARRAY['upper_back', 'lats'], ARRAY['biceps'], 'pull', false),
('Lat Pulldown', 'Latzug', 'strength', 'cable', ARRAY['lats'], ARRAY['biceps', 'upper_back'], 'pull', false),

-- Shoulders
('Overhead Press', 'Schulterdrücken', 'strength', 'barbell', ARRAY['shoulders'], ARRAY['triceps', 'upper_back'], 'push', false),
('Dumbbell Lateral Raise', 'Seitheben', 'strength', 'dumbbell', ARRAY['shoulders'], ARRAY[], 'push', false),
('Face Pull', 'Face Pulls', 'strength', 'cable', ARRAY['shoulders', 'upper_back'], ARRAY[], 'pull', false),
('Arnold Press', 'Arnold Press', 'strength', 'dumbbell', ARRAY['shoulders'], ARRAY['triceps'], 'push', false),

-- Arms - Biceps
('Barbell Curl', 'Langhantelcurls', 'strength', 'barbell', ARRAY['biceps'], ARRAY['forearms'], 'pull', false),
('Dumbbell Curl', 'Kurzhantelcurls', 'strength', 'dumbbell', ARRAY['biceps'], ARRAY['forearms'], 'pull', false),
('Hammer Curl', 'Hammercurls', 'strength', 'dumbbell', ARRAY['biceps', 'forearms'], ARRAY[], 'pull', false),
('Preacher Curl', 'Preacher-Curls', 'strength', 'machine', ARRAY['biceps'], ARRAY['forearms'], 'pull', false),

-- Arms - Triceps
('Triceps Pushdown', 'Trizeps-Pushdowns', 'strength', 'cable', ARRAY['triceps'], ARRAY[], 'push', false),
('Overhead Triceps Extension', 'Überkopf-Trizeps', 'strength', 'dumbbell', ARRAY['triceps'], ARRAY[], 'push', false),
('Close Grip Bench Press', 'Enghanddrücken', 'strength', 'barbell', ARRAY['triceps', 'chest'], ARRAY['shoulders'], 'push', false),
('Skullcrushers', 'Skullcrusher', 'strength', 'barbell', ARRAY['triceps'], ARRAY[], 'push', false),

-- Legs - Quads
('Squat', 'Kniebeuge', 'strength', 'barbell', ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'calves'], 'squat', false),
('Leg Press', 'Beinpresse', 'strength', 'machine', ARRAY['quads', 'glutes'], ARRAY['hamstrings'], 'squat', false),
('Leg Extension', 'Beinstrecker', 'strength', 'machine', ARRAY['quads'], ARRAY[], 'push', false),
('Goblet Squat', 'Goblet Squat', 'strength', 'dumbbell', ARRAY['quads', 'glutes'], ARRAY['hamstrings'], 'squat', false),
('Lunges', 'Ausfallschritte', 'strength', 'dumbbell', ARRAY['quads', 'glutes'], ARRAY['hamstrings', 'calves'], 'squat', false),
('Bulgarian Split Squat', 'Bulgarian Split Squat', 'strength', 'dumbbell', ARRAY['quads', 'glutes'], ARRAY['hamstrings'], 'squat', false),

-- Legs - Hamstrings/Glutes
('Romanian Deadlift', 'Rumänisches Kreuzheben', 'strength', 'barbell', ARRAY['hamstrings', 'glutes'], ARRAY['lower_back'], 'hinge', false),
('Leg Curl', 'Beinbeuger', 'strength', 'machine', ARRAY['hamstrings'], ARRAY[], 'pull', false),
('Hip Thrust', 'Hip Thrust', 'strength', 'barbell', ARRAY['glutes'], ARRAY['hamstrings'], 'hinge', false),
('Good Morning', 'Good Morning', 'strength', 'barbell', ARRAY['hamstrings', 'lower_back'], ARRAY['glutes'], 'hinge', false),

-- Legs - Calves
('Standing Calf Raise', 'Wadenheben stehend', 'strength', 'machine', ARRAY['calves'], ARRAY[], 'push', false),
('Seated Calf Raise', 'Wadenheben sitzend', 'strength', 'machine', ARRAY['calves'], ARRAY[], 'push', false),

-- Core
('Plank', 'Plank', 'strength', 'bodyweight', ARRAY['abs'], ARRAY['lower_back'], 'static', false),
('Crunches', 'Crunches', 'strength', 'bodyweight', ARRAY['abs'], ARRAY[], 'push', false),
('Leg Raises', 'Beinheben', 'strength', 'bodyweight', ARRAY['abs', 'lower_back'], ARRAY[], 'push', false),
('Russian Twist', 'Russian Twist', 'strength', 'bodyweight', ARRAY['abs', 'obliques'], ARRAY[], 'static', false),
('Ab Wheel', 'Ab Wheel', 'strength', 'bodyweight', ARRAY['abs', 'lower_back'], ARRAY['shoulders'], 'push', false),

-- Cardio
('Running', 'Laufen', 'cardio', 'bodyweight', ARRAY['quads', 'calves'], ARRAY['hamstrings', 'glutes'], 'squat', false),
('Cycling', 'Radfahren', 'cardio', 'machine', ARRAY['quads'], ARRAY['calves', 'glutes'], 'squat', false),
('Rowing', 'Rudern', 'cardio', 'machine', ARRAY['upper_back', 'lats', 'quads'], ARRAY['biceps', 'hamstrings'], 'pull', false);

-- ============================================================
-- Program 1: Push/Pull/Legs (6 Days)
-- ============================================================
WITH ppl AS (
  INSERT INTO programs (name, description, days_per_week, difficulty, goal, is_template, is_active, user_id)
  VALUES ('Push/Pull/Legs', 'Klassischer 6er-Split für maximales Volumen. Push: Brust, Schultern, Trizeps. Pull: Rücken, Bizeps. Legs: Beine.', 6, 'intermediate', 'hypertrophy', true, false, NULL)
  RETURNING id
),
days AS (
  INSERT INTO program_days (program_id, day_number, name, is_rest_day, sort_order)
  SELECT 
    ppl.id,
    unnest(ARRAY[1, 2, 3, 4, 5, 6]) as day_number,
    unnest(ARRAY['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B']) as name,
    unnest(ARRAY[false, false, false, false, false, false]) as is_rest_day,
    unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
  FROM ppl
  RETURNING id, day_number, program_id
)
-- Push A: Day 1
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['6-8', '8-12', '10-15', '12-15', '12-15']) as reps_target,
  unnest(ARRAY[180, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Bench Press', 'Overhead Press', 'Incline Bench Press', 'Dumbbell Lateral Raise', 'Triceps Pushdown')
) e
WHERE d.day_number = 1;

-- Pull A: Day 2
WITH ppl AS (SELECT id FROM programs WHERE name = 'Push/Pull/Legs' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM ppl) AND day_number = 2)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['5-6', '8-10', '10-12', '8-12', '12-15']) as reps_target,
  unnest(ARRAY[180, 120, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Deadlift', 'Pull Ups', 'Barbell Row', 'Face Pull', 'Barbell Curl')
) e;

-- Legs A: Day 3
WITH ppl AS (SELECT id FROM programs WHERE name = 'Push/Pull/Legs' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM ppl) AND day_number = 3)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['6-8', '8-10', '10-15', '12-15', '10-12', '15-20']) as reps_target,
  unnest(ARRAY[180, 120, 90, 90, 60, 45]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Leg Extension', 'Standing Calf Raise')
) e;

-- Push B: Day 4
WITH ppl AS (SELECT id FROM programs WHERE name = 'Push/Pull/Legs' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM ppl) AND day_number = 4)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['8-10', '8-12', '10-15', '12-15', '12-15']) as reps_target,
  unnest(ARRAY[120, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Incline Bench Press', 'Dumbbell Lateral Raise', 'Arnold Press', 'Cable Crossover', 'Overhead Triceps Extension')
) e;

-- Pull B: Day 5
WITH ppl AS (SELECT id FROM programs WHERE name = 'Push/Pull/Legs' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM ppl) AND day_number = 5)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['8-10', '10-12', '10-12', '12-15', '12-15']) as reps_target,
  unnest(ARRAY[120, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Barbell Row', 'Lat Pulldown', 'Cable Row', 'Hammer Curl', 'Preacher Curl')
) e;

-- Legs B: Day 6
WITH ppl AS (SELECT id FROM programs WHERE name = 'Push/Pull/Legs' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM ppl) AND day_number = 6)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['8-10', '8-10', '12-15', '12-15', '10-12', '15-20']) as reps_target,
  unnest(ARRAY[120, 120, 90, 90, 60, 45]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Leg Press', 'Hip Thrust', 'Bulgarian Split Squat', 'Good Morning', 'Leg Extension', 'Seated Calf Raise')
) e;

-- ============================================================
-- Program 2: Upper/Lower (4 Days)
-- ============================================================
WITH ul AS (
  INSERT INTO programs (name, description, days_per_week, difficulty, goal, is_template, is_active, user_id)
  VALUES ('Upper/Lower', 'Effizienter 4-Tage Split mit Fokus auf zusammengefasste Frequenz. Ideal für Zeit-effizientes Training.', 4, 'intermediate', 'strength', true, false, NULL)
  RETURNING id
),
days AS (
  INSERT INTO program_days (program_id, day_number, name, is_rest_day, sort_order)
  SELECT 
    ul.id,
    unnest(ARRAY[1, 2, 3, 4]) as day_number,
    unnest(ARRAY['Upper A', 'Lower A', 'Upper B', 'Lower B']) as name,
    unnest(ARRAY[false, false, false, false]) as is_rest_day,
    unnest(ARRAY[1, 2, 3, 4]) as sort_order
  FROM ul
  RETURNING id, day_number
)
-- Upper A
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['6-8', '8-10', '8-10', '10-12', '10-12', '12-15']) as reps_target,
  unnest(ARRAY[180, 120, 120, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Bench Press', 'Barbell Row', 'Overhead Press', 'Lat Pulldown', 'Barbell Curl', 'Triceps Pushdown')
) e
WHERE d.day_number = 1;

-- Lower A
WITH ul AS (SELECT id FROM programs WHERE name = 'Upper/Lower' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM ul) AND day_number = 2)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['5-6', '6-8', '8-10', '10-12', '12-15']) as reps_target,
  unnest(ARRAY[180, 180, 120, 90, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Squat', 'Romanian Deadlift', 'Leg Press', 'Leg Curl', 'Standing Calf Raise')
) e;

-- Upper B
WITH ul AS (SELECT id FROM programs WHERE name = 'Upper/Lower' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM ul) AND day_number = 3)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['8-10', '8-10', '10-12', '10-12', '12-15', '12-15']) as reps_target,
  unnest(ARRAY[120, 120, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Incline Bench Press', 'Pull Ups', 'Arnold Press', 'Cable Row', 'Hammer Curl', 'Overhead Triceps Extension')
) e;

-- Lower B
WITH ul AS (SELECT id FROM programs WHERE name = 'Upper/Lower' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM ul) AND day_number = 4)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['6-8', '8-10', '10-12', '12-15', '15-20']) as reps_target,
  unnest(ARRAY[180, 120, 90, 90, 45]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Leg Press', 'Hip Thrust', 'Bulgarian Split Squat', 'Leg Extension', 'Seated Calf Raise')
) e;

-- ============================================================
-- Program 3: Full Body (3 Days)
-- ============================================================
WITH fb AS (
  INSERT INTO programs (name, description, days_per_week, difficulty, goal, is_template, is_active, user_id)
  VALUES ('Full Body', 'Perfekt für Einsteiger oder Zeit-begrenzte Athleten. Drei komplette Ganzkörper-Einheiten pro Woche.', 3, 'beginner', 'general', true, false, NULL)
  RETURNING id
),
days AS (
  INSERT INTO program_days (program_id, day_number, name, is_rest_day, sort_order)
  SELECT 
    fb.id,
    unnest(ARRAY[1, 2, 3]) as day_number,
    unnest(ARRAY['Full Body A', 'Full Body B', 'Full Body C']) as name,
    unnest(ARRAY[false, false, false]) as is_rest_day,
    unnest(ARRAY[1, 2, 3]) as sort_order
  FROM fb
  RETURNING id, day_number
)
-- Full Body A
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[3, 3, 3, 3, 2, 2, 2]) as sets_target,
  unnest(ARRAY['8-10', '8-10', '10-12', '10-12', '10-12', '12-15', '12-15']) as reps_target,
  unnest(ARRAY[120, 120, 90, 90, 60, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Squat', 'Bench Press', 'Barbell Row', 'Overhead Press', 'Lat Pulldown', 'Barbell Curl', 'Triceps Pushdown')
) e
WHERE d.day_number = 1;

-- Full Body B
WITH fb AS (SELECT id FROM programs WHERE name = 'Full Body' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM fb) AND day_number = 2)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[3, 3, 3, 3, 2, 2, 2]) as sets_target,
  unnest(ARRAY['6-8', '6-8', '8-10', '10-12', '10-12', '12-15', '12-15']) as reps_target,
  unnest(ARRAY[180, 180, 120, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Deadlift', 'Leg Press', 'Incline Bench Press', 'Pull Ups', 'Face Pull', 'Hammer Curl', 'Overhead Triceps Extension')
) e;

-- Full Body C
WITH fb AS (SELECT id FROM programs WHERE name = 'Full Body' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM fb) AND day_number = 3)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[3, 3, 3, 3, 3, 2, 2]) as sets_target,
  unnest(ARRAY['6-8', '8-10', '8-10', '10-12', '10-12', '12-15', '12-15']) as reps_target,
  unnest(ARRAY[180, 120, 120, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Romanian Deadlift', 'Goblet Squat', 'Cable Row', 'Dumbbell Lateral Raise', 'Lat Pulldown', 'Dumbbell Curl', 'Close Grip Bench Press')
) e;

-- ============================================================
-- Program 4: Hypertrophy Focus (6 Days - PPL Variante)
-- ============================================================
WITH hyp AS (
  INSERT INTO programs (name, description, days_per_week, difficulty, goal, is_template, is_active, user_id)
  VALUES ('Hypertrophy Focus', 'Volumen-basierter 6er-Split mit hoher Reps und kurzen Pausen. Für maximales Muskelwachstum optimiert.', 6, 'advanced', 'hypertrophy', true, false, NULL)
  RETURNING id
),
days AS (
  INSERT INTO program_days (program_id, day_number, name, is_rest_day, sort_order)
  SELECT 
    hyp.id,
    unnest(ARRAY[1, 2, 3, 4, 5, 6]) as day_number,
    unnest(ARRAY['Chest/Triceps', 'Back/Biceps', 'Legs/Calves', 'Chest/Shoulders', 'Back/Traps', 'Legs/Glutes']) as name,
    unnest(ARRAY[false, false, false, false, false, false]) as is_rest_day,
    unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
  FROM hyp
  RETURNING id, day_number
)
-- Day 1: Chest/Triceps
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 4, 3, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['8-10', '10-12', '12-15', '15-20', '10-12', '12-15', '15-20']) as reps_target,
  unnest(ARRAY[120, 90, 60, 60, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Bench Press', 'Incline Bench Press', 'Dumbbell Flyes', 'Cable Crossover', 'Close Grip Bench Press', 'Triceps Pushdown', 'Overhead Triceps Extension')
) e
WHERE d.day_number = 1;

-- Day 2: Back/Biceps
WITH hyp AS (SELECT id FROM programs WHERE name = 'Hypertrophy Focus' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM hyp) AND day_number = 2)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 4, 3, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['6-8', '8-10', '10-12', '12-15', '8-10', '10-12', '12-15']) as reps_target,
  unnest(ARRAY[180, 120, 90, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Barbell Row', 'Pull Ups', 'Cable Row', 'Face Pull', 'Barbell Curl', 'Hammer Curl', 'Preacher Curl')
) e;

-- Day 3: Legs/Calves
WITH hyp AS (SELECT id FROM programs WHERE name = 'Hypertrophy Focus' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM hyp) AND day_number = 3)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 3, 3, 3, 3, 4, 3]) as sets_target,
  unnest(ARRAY['8-10', '10-12', '12-15', '15-20', '10-12', '12-15', '15-20']) as reps_target,
  unnest(ARRAY[150, 120, 90, 60, 90, 60, 45]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Squat', 'Leg Press', 'Bulgarian Split Squat', 'Leg Extension', 'Leg Curl', 'Standing Calf Raise', 'Seated Calf Raise')
) e;

-- Day 4: Chest/Shoulders
WITH hyp AS (SELECT id FROM programs WHERE name = 'Hypertrophy Focus' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM hyp) AND day_number = 4)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 4, 3, 3, 4, 3, 3]) as sets_target,
  unnest(ARRAY['8-10', '10-12', '12-15', '15-20', '12-15', '15-20', '15-20']) as reps_target,
  unnest(ARRAY[120, 90, 60, 60, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Incline Bench Press', 'Cable Crossover', 'Dumbbell Flyes', 'Push Ups', 'Overhead Press', 'Dumbbell Lateral Raise', 'Arnold Press')
) e;

-- Day 5: Back/Traps
WITH hyp AS (SELECT id FROM programs WHERE name = 'Hypertrophy Focus' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM hyp) AND day_number = 5)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 4, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['6-8', '8-10', '10-12', '12-15', '12-15', '15-20']) as reps_target,
  unnest(ARRAY[180, 120, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Deadlift', 'Barbell Row', 'Lat Pulldown', 'Cable Row', 'Face Pull', 'Pull Ups')
) e;

-- Day 6: Legs/Glutes
WITH hyp AS (SELECT id FROM programs WHERE name = 'Hypertrophy Focus' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM hyp) AND day_number = 6)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[4, 4, 3, 3, 3, 3, 4]) as sets_target,
  unnest(ARRAY['8-10', '10-12', '12-15', '15-20', '10-12', '12-15', '12-15']) as reps_target,
  unnest(ARRAY[150, 120, 90, 60, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6, 7]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Leg Press', 'Hip Thrust', 'Bulgarian Split Squat', 'Leg Extension', 'Romanian Deadlift', 'Leg Curl', 'Standing Calf Raise')
) e;

-- ============================================================
-- Program 5: Strength Base (4 Days - 5/3/1 inspiriert)
-- ============================================================
WITH str AS (
  INSERT INTO programs (name, description, days_per_week, difficulty, goal, is_template, is_active, user_id)
  VALUES ('Strength Base', 'Kraftfokussierter 4-Tage Split mit niedrigen Reps und hohen Gewichten. Basierend auf 5/3/1 Prinzipien.', 4, 'intermediate', 'strength', true, false, NULL)
  RETURNING id
),
days AS (
  INSERT INTO program_days (program_id, day_number, name, is_rest_day, sort_order)
  SELECT 
    str.id,
    unnest(ARRAY[1, 2, 3, 4]) as day_number,
    unnest(ARRAY['Squat Day', 'Bench Day', 'Deadlift Day', 'Press Day']) as name,
    unnest(ARRAY[false, false, false, false]) as is_rest_day,
    unnest(ARRAY[1, 2, 3, 4]) as sort_order
  FROM str
  RETURNING id, day_number
)
-- Day 1: Squat Day
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[5, 3, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['3-5', '6-8', '6-8', '8-10', '10-12', '15-20']) as reps_target,
  unnest(ARRAY[240, 120, 120, 90, 90, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl', 'Leg Extension', 'Standing Calf Raise')
) e
WHERE d.day_number = 1;

-- Day 2: Bench Day
WITH str AS (SELECT id FROM programs WHERE name = 'Strength Base' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM str) AND day_number = 2)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[5, 3, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['3-5', '6-8', '8-10', '8-10', '10-12', '12-15']) as reps_target,
  unnest(ARRAY[240, 120, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Bench Press', 'Incline Bench Press', 'Dumbbell Lateral Raise', 'Triceps Pushdown', 'Overhead Triceps Extension', 'Face Pull')
) e;

-- Day 3: Deadlift Day
WITH str AS (SELECT id FROM programs WHERE name = 'Strength Base' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM str) AND day_number = 3)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[5, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['3-5', '6-8', '6-8', '10-12', '12-15']) as reps_target,
  unnest(ARRAY[300, 120, 120, 90, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Deadlift', 'Barbell Row', 'Lat Pulldown', 'Barbell Curl', 'Hammer Curl')
) e;

-- Day 4: Press Day
WITH str AS (SELECT id FROM programs WHERE name = 'Strength Base' LIMIT 1),
days AS (SELECT id FROM program_days WHERE program_id = (SELECT id FROM str) AND day_number = 4)
INSERT INTO program_day_exercises (program_day_id, exercise_id, sets_target, reps_target, rest_seconds, sort_order)
SELECT 
  d.id,
  e.id,
  unnest(ARRAY[5, 3, 3, 3, 3, 3]) as sets_target,
  unnest(ARRAY['3-5', '6-8', '8-10', '8-10', '10-12', '12-15']) as reps_target,
  unnest(ARRAY[240, 120, 90, 90, 60, 60]) as rest_seconds,
  unnest(ARRAY[1, 2, 3, 4, 5, 6]) as sort_order
FROM days d
CROSS JOIN LATERAL (
  SELECT id FROM exercises WHERE name IN ('Overhead Press', 'Arnold Press', 'Pull Ups', 'Dumbbell Lateral Raise', 'Triceps Pushdown', 'Cable Row')
) e;
