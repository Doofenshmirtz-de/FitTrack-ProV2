-- Migration: 006_bls_foods
-- Description: Create BLS foods table and search indices

CREATE TABLE public.bls_foods (
    id TEXT PRIMARY KEY, -- The BLS Code (e.g. F110000)
    food_name TEXT NOT NULL,
    calories NUMERIC NOT NULL,
    protein_g NUMERIC NOT NULL,
    carbs_g NUMERIC NOT NULL,
    fat_g NUMERIC NOT NULL,
    fiber_g NUMERIC,
    sugar_g NUMERIC,
    sodium_mg NUMERIC
);

-- Full text search for quick lookups
ALTER TABLE public.bls_foods ADD COLUMN fts tsvector GENERATED ALWAYS AS (to_tsvector('german', food_name)) STORED;
CREATE INDEX bls_foods_fts_idx ON public.bls_foods USING gin(fts);

-- Row level security
ALTER TABLE public.bls_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "BLS foods are readable by everyone"
    ON public.bls_foods FOR SELECT
    USING (true);

-- Insert some basic test data so the search works immediately
INSERT INTO public.bls_foods (id, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg) VALUES
('TEST_APFEL', 'Apfel, roh', 52, 0.3, 11.4, 0.4, 2.0, 10.4, 2),
('TEST_BANANE', 'Banane, roh', 93, 1.1, 20.0, 0.2, 2.0, 17.3, 1),
('TEST_EI', 'Hühnerei, roh', 154, 11.9, 0.6, 11.2, 0, 0.6, 140),
('TEST_HAFER', 'Haferflocken', 372, 13.5, 58.7, 7.0, 10.0, 0.7, 5),
('TEST_REIS', 'Reis, unpoliert, roh', 353, 7.4, 74.1, 2.2, 2.2, 0.8, 5);
