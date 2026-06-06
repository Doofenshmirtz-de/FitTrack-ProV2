-- ============================================================
-- Migration: Optional pg_partman Partitioning für health_raw
-- Datum: Juni 2026
-- 
-- HINWEIS: Diese Migration ist OPTIONAL und nur nötig wenn:
-- 1. Supabase Cloud Postgres 17+ verwendet wird
-- 2. pg_partman Extension verfügbar ist (muss in Dashboard aktiviert werden)
-- 3. Große Datenmengen (> 1M Einträge) erwartet werden
--
-- Für MVP/Early Stage: Die einfache health_raw Tabelle aus 001_initial_schema.sql
-- reicht vollkommen aus. Die 90-Day Retention wird via cleanup_old_health_data()
-- Funktion erledigt (siehe 003_functions_and_triggers.sql).
-- ============================================================

-- Prüfe ob pg_partman verfügbar ist, sonst Migration abbrechen
DO $$
DECLARE
    partman_available BOOLEAN;
    partman_schema TEXT;
BEGIN
    -- Prüfe ob pg_partman Extension existiert
    SELECT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'pg_partman'
    ) INTO partman_available;
    
    IF NOT partman_available THEN
        RAISE NOTICE 'pg_partman Extension nicht verfügbar. Überspringe Partitioning-Migration.';
        RAISE NOTICE 'Die einfache health_raw Tabelle aus 001_initial_schema.sql wird verwendet.';
        RETURN;
    END IF;
    
    -- Prüfe ob Extension bereits im public Schema installiert ist
    SELECT extnamespace::regnamespace::text INTO partman_schema
    FROM pg_extension 
    WHERE extname = 'pg_partman';
    
    IF partman_schema IS NULL THEN
        -- Installiere pg_partman im public Schema (nicht partman Schema, das existiert nicht)
        CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA public;
        RAISE NOTICE 'pg_partman Extension installiert im public Schema';
    ELSE
        RAISE NOTICE 'pg_partman bereits installiert im Schema: %', partman_schema;
    END IF;
END $$;

-- Prüfe ob pg_cron verfügbar ist (optional, für automatische Maintenance)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        RAISE NOTICE 'pg_cron Extension aktiviert';
    ELSE
        RAISE NOTICE 'pg_cron nicht verfügbar. Manuelle Maintenance nötig (siehe Funktion cleanup_old_health_data).';
    END IF;
END $$;

-- ============================================================
-- Migration zu partitionierter Tabelle (nur wenn pg_partman verfügbar)
-- ============================================================
DO $$
DECLARE
    has_partman BOOLEAN;
    has_partitioned_table BOOLEAN;
BEGIN
    -- Prüfe ob pg_partman wirklich installiert ist
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_partman'
    ) INTO has_partman;
    
    -- Prüfe ob Tabelle bereits partitioniert ist
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'health_raw' 
        AND schemaname = 'public'
    ) INTO has_partitioned_table;
    
    -- Wenn pg_partman nicht da ist oder Tabelle nicht existiert, abbrechen
    IF NOT has_partman THEN
        RAISE NOTICE 'pg_partman nicht installiert. Partitioning übersprungen.';
        RETURN;
    END IF;
    
    IF NOT has_partitioned_table THEN
        RAISE NOTICE 'health_raw Tabelle nicht gefunden. Bitte 001_initial_schema.sql zuerst ausführen.';
        RETURN;
    END IF;
    
    -- Prüfe ob Tabelle bereits partitioniert ist
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'health_raw'
        AND n.nspname = 'public'
        AND c.relkind = 'p'  -- p = partitioned table
    ) THEN
        RAISE NOTICE 'health_raw ist bereits partitioniert. Migration übersprungen.';
        RETURN;
    END IF;
    
    -- Migration: Konvertiere bestehende Tabelle zu partitionierter Tabelle
    -- Achtung: Dies erfordert einen kurzen Lock auf die Tabelle!
    RAISE NOTICE 'Starte Migration zu partitionierter Tabelle...';
    
    -- 1. Sichere Daten
    CREATE TABLE IF NOT EXISTS _health_raw_temp AS 
    SELECT * FROM health_raw;
    
    -- 2. Lösche alte Tabelle (CASCADE für Foreign Keys)
    DROP TABLE health_raw CASCADE;
    
    -- 3. Erstelle neue partitionierte Tabelle
    CREATE TABLE health_raw (
        time         TIMESTAMPTZ      NOT NULL,
        user_id      UUID             NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        metric_type  TEXT             NOT NULL,
        value        NUMERIC(10, 4)   NOT NULL,
        source       TEXT             DEFAULT 'health_connect',
        CONSTRAINT health_raw_pkey PRIMARY KEY (time, user_id, metric_type)
    ) PARTITION BY RANGE (time);
    
    -- 4. Konfiguriere pg_partman (im public Schema)
    PERFORM public.create_parent(
        p_parent_table := 'public.health_raw',
        p_control := 'time',
        p_type := 'native',
        p_interval := '1 day',
        p_premake := 7,
        p_start_partition := (CURRENT_DATE - INTERVAL '30 days')::text
    );
    
    -- 5. Retention Policy: 90 Tage
    UPDATE public.part_config 
    SET retention = '90 days', 
        retention_keep_table = false,
        retention_keep_index = false
    WHERE parent_table = 'public.health_raw';
    
    -- 6. Stelle Daten wieder her
    INSERT INTO health_raw (time, user_id, metric_type, value, source)
    SELECT time, user_id, metric_type, value, source
    FROM _health_raw_temp
    ON CONFLICT (time, user_id, metric_type) DO NOTHING;
    
    -- 7. Lösche temporäre Tabelle
    DROP TABLE _health_raw_temp;
    
    -- 8. RLS Policy neu erstellen (wegen CASCADE DROP)
    ALTER TABLE health_raw ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "health_raw_own_only" ON health_raw
        FOR ALL USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    
    -- 9. Indexe neu erstellen
    CREATE INDEX idx_health_raw_user_metric_time 
        ON health_raw (user_id, metric_type, time DESC);
    
    CREATE INDEX idx_health_raw_metric_time 
        ON health_raw (metric_type, time DESC);
    
    -- 10. Cron Job für Maintenance (nur wenn pg_cron verfügbar)
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'health_raw_partman_maintenance',
            '0 3 * * *',
            'SELECT public.run_maintenance(p_parent_table := ''public.health_raw'', p_analyze := false)'
        );
        RAISE NOTICE 'Cron Job für tägliche Maintenance erstellt';
    END IF;
    
    -- 11. Initial Maintenance
    PERFORM public.run_maintenance(
        p_parent_table := 'public.health_raw',
        p_analyze := true
    );
    
    RAISE NOTICE 'Migration zu partitionierter Tabelle abgeschlossen!';
END $$;

-- Kommentar für Dokumentation
COMMENT ON TABLE health_raw IS 
    'Health-Rohdaten. Optional partitioniert mit pg_partman (90 Tage Retention). '
    'Für MVP: Einfache Tabelle mit cleanup_old_health_data() Funktion. '
    'Für High-Volume: Partition by Range (time) - 1 Tag pro Partition.';

-- ============================================================
-- Hilfsfunktion: Manuelle Migration anstoßen (falls gewünscht)
-- ============================================================
CREATE OR REPLACE FUNCTION migrate_to_partitioned_health_raw()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result TEXT;
BEGIN
    -- Diese Funktion kann manuell aufgerufen werden, um die Migration zu wiederholen
    -- oder um zu prüfen ob pg_partman verfügbar ist
    
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_partman') THEN
        RETURN 'pg_partman nicht verfügbar. Migration nicht möglich.';
    END IF;
    
    -- Prüfe aktueller Status
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'health_raw'
        AND n.nspname = 'public'
        AND c.relkind = 'p'
    ) THEN
        RETURN 'Tabelle ist bereits partitioniert.';
    END IF;
    
    RETURN 'Migration kann durchgeführt werden. Führe 004_optional_pg_partman_partitioning.sql erneut aus.';
END;
$$;

-- ============================================================
-- Migrations-Checkliste & Status
-- ============================================================
-- pg_partman verfügbar? SELECT * FROM pg_available_extensions WHERE name = 'pg_partman';
-- pg_partman installiert? SELECT * FROM pg_extension WHERE extname = 'pg_partman';
-- Tabelle partitioniert? SELECT relkind FROM pg_class WHERE relname = 'health_raw';
--          r = ordinary table, p = partitioned table
-- Maintenance Status? SELECT * FROM public.part_config WHERE parent_table = 'public.health_raw';
-- ============================================================
