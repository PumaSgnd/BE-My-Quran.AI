-- Extension untuk UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Cache jadwal shalat
CREATE TABLE IF NOT EXISTS prayer_times_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    tz TEXT NOT NULL,
    "date" DATE NOT NULL,
    method TEXT NOT NULL,
    madhab TEXT NOT NULL,
    hlr TEXT NOT NULL,
    offsets JSONB NOT NULL DEFAULT '{}'::jsonb,
    offsets_hash TEXT NOT NULL,
    result JSONB NOT NULL,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ptc_unique ON prayer_times_cache (
    "date",
    lat,
    lng,
    tz,
    method,
    madhab,
    hlr,
    offsets_hash
);
-- Preferensi user
CREATE TABLE IF NOT EXISTS user_prayer_prefs (
    user_id UUID PRIMARY KEY,
    method TEXT NOT NULL DEFAULT 'MWL',
    madhab TEXT NOT NULL DEFAULT 'Shafi',
    hlr TEXT NOT NULL DEFAULT 'MiddleOfTheNight',
    offsets JSONB NOT NULL DEFAULT '{}'::jsonb,
    adhan JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);