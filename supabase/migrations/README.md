# FitTrack Pro - Database Migrations

## Ausführungsreihenfolge

Die Migrationen müssen in dieser Reihenfolge ausgeführt werden:

### 1. `001_initial_schema.sql`
**Grundlegende Tabellen und Struktur**

- profiles (erweitert auth.users)
- daily_targets (tägliche Ziele)
- health_raw (Health-Daten Rohwerte)
- daily_summaries (aggregierte Tagesdaten)
- food_logs (Ernährung)
- exercises (Übungsbibliothek)
- programs, program_days, program_day_exercises (Trainingsprogramme)
- workout_sessions, workout_sets (Workout-Logging)
- personal_records (PRs)
- ai_conversations (AI Coach Chat)
- body_measurements (Körpermaße)
- audit_logs (Sicherheit)

### 2. `002_row_level_security.sql`
**RLS Policies für alle Tabellen**

- Jede Tabelle bekommt RLS aktiviert
- Policies für "eigene Daten nur" (auth.uid() = user_id)
- Rekursive Policies für abhängige Tabellen (z.B. workout_sets via session)

### 3. `003_functions_and_triggers.sql`
**Automatisierung und Business Logic**

- `cleanup_old_health_data()` - 90-Tage Retention für health_raw
- `check_and_set_pr()` - PR-Erkennung bei Set-Einfügung
- `update_session_volume()` - Automatische Volumen-Berechnung
- `handle_new_user()` - Profil-Erstellung bei Signup
- `upsert_daily_summary()` - Daily Summary Aggregation
- `log_ai_interaction()` - Audit-Logging für AI

### 4. `004_optional_pg_partman_partitioning.sql` (OPTIONAL)
**Nur für High-Volume oder Self-Hosting**

Diese Migration ist **optional** und nur nötig wenn:
- > 1 Million Health-Daten-Einträge erwartet werden
- Oder Migration zu Self-Hosting/NAS geplant ist

**Für Supabase Cloud**: Nicht ausführen! Die einfache Tabelle aus 001 + `cleanup_old_health_data()` reicht.

## Migration ausführen

```bash
# Alle Migrationen (bis auf optionale)
npx supabase db push

# Oder einzeln:
npx supabase migration up 001_initial_schema.sql
npx supabase migration up 002_row_level_security.sql
npx supabase migration up 003_functions_and_triggers.sql

# Optional (nur bei Bedarf):
# npx supabase migration up 004_optional_pg_partman_partitioning.sql
```

## Fehlerbehebung

### Fehler: "schema 'partman' does not exist"
→ `004_optional_pg_partman_partitioning.sql` überspringen. Nicht für Supabase Cloud nötig.

### Fehler: "relation 'health_raw' already exists"
→ Migration wurde bereits ausgeführt. Mit `npx supabase db reset` zurücksetzen.

### Fehler: "extension 'pg_partman' already exists"
→ Normal, kann ignoriert werden.

## Wichtige Hinweise

1. **Reihenfolge ist kritisch**: 001 → 002 → 003
2. **004 ist optional**: Nur für High-Volume Szenarien
3. **Supabase Cloud**: Funktioniert ohne 004 vollständig
4. **Self-Hosting**: 004 kann später hinzugefügt werden
