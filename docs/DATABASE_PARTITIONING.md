# Database Schema Documentation

## Overview

FitTrack Pro uses a standard PostgreSQL schema via Supabase. Time-series data is handled with simple table structure - partitioning can be added later if data volume requires it.

## Data Retention

### `health_raw` Table (90 Days)

Health data snapshots are automatically cleaned up after 90 days:

```sql
-- Manual cleanup (runs automatically via cron if configured)
SELECT cleanup_old_health_data();

-- Check how many records would be deleted
SELECT COUNT(*) FROM health_raw 
WHERE time < NOW() - INTERVAL '90 days';
```

### Retention Configuration

To enable automatic cleanup via pg_cron (optional):

```sql
-- Enable pg_cron extension first in Supabase Dashboard
-- Then schedule the cleanup job
SELECT cron.schedule('cleanup_health_data', '0 4 * * *', 
    'SELECT cleanup_old_health_data();'
);
```

## Future Partitioning (Optional)

If data volume grows significantly, you can migrate to partitioning:

### Option 1: Native PostgreSQL Partitioning

```sql
-- 1. Create new partitioned table
CREATE TABLE health_raw_partitioned (
  time TIMESTAMPTZ NOT NULL,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC(10, 4) NOT NULL,
  source TEXT DEFAULT 'health_connect',
  PRIMARY KEY (time, user_id, metric_type)
) PARTITION BY RANGE (time);

-- 2. Create monthly partitions
CREATE TABLE health_raw_y2024m01 PARTITION OF health_raw_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- 3. Migrate data
INSERT INTO health_raw_partitioned SELECT * FROM health_raw;

-- 4. Swap tables
ALTER TABLE health_raw RENAME TO health_raw_old;
ALTER TABLE health_raw_partitioned RENAME TO health_raw;
```

### Option 2: pg_partman (Advanced)

For automatic partition management:

1. Enable `pg_partman` extension in Supabase Dashboard
2. Configure automatic partition creation:

```sql
SELECT partman.create_parent(
    'public.health_raw',
    'time',
    'native',
    'daily',
    p_premake := 7
);
```

## Performance Optimization

### Current Indexes

```sql
-- Time-series queries (user + metric + time range)
CREATE INDEX idx_health_raw_user_metric_time 
ON health_raw (user_id, metric_type, time DESC);

-- Efficient date-based cleanup
CREATE INDEX idx_health_raw_time 
ON health_raw (time);
```

### Query Optimization Tips

```sql
-- Good: Uses index efficiently
SELECT * FROM health_raw 
WHERE user_id = '...' 
  AND metric_type = 'steps'
  AND time > NOW() - INTERVAL '7 days'
ORDER BY time DESC;

-- Avoid: Functions on indexed columns
-- Instead of: WHERE logged_at::DATE = '2024-01-01'
-- Use: WHERE logged_at >= '2024-01-01' AND logged_at < '2024-01-02'
```

## Monitoring

### Table Sizes

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Row Counts (Approximate)

```sql
SELECT 
  relname as table_name,
  n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

## See Also

- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Supabase Extensions](https://supabase.com/docs/guides/database/extensions)
- [pg_partman documentation](https://github.com/pgpartman/pg_partman) (for future use)
