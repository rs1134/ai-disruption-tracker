-- AI Disruption Tracker - PostgreSQL Schema
-- Compatible with Neon, Supabase, or any PostgreSQL 14+ instance

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Feed Items Table (tweets + news articles)
-- ============================================================
CREATE TABLE IF NOT EXISTS feed_items (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('tweet', 'news')),
  title         TEXT NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  author        TEXT NOT NULL DEFAULT '',
  source        TEXT NOT NULL DEFAULT '',
  url           TEXT NOT NULL,
  image_url     TEXT,
  engagement_score FLOAT NOT NULL DEFAULT 0,
  likes         INTEGER NOT NULL DEFAULT 0,
  reposts       INTEGER NOT NULL DEFAULT 0,
  replies       INTEGER NOT NULL DEFAULT 0,
  views         INTEGER NOT NULL DEFAULT 0,
  category      TEXT NOT NULL DEFAULT 'General'
                  CHECK (category IN (
                    'Layoffs', 'Funding', 'Product Launch',
                    'Regulation', 'Breakthrough', 'Acquisition', 'General'
                  )),
  sentiment     TEXT NOT NULL DEFAULT 'neutral'
                  CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  tags          TEXT[] NOT NULL DEFAULT '{}',
  published_at  TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_feed_items_type ON feed_items (type);
CREATE INDEX IF NOT EXISTS idx_feed_items_category ON feed_items (category);
CREATE INDEX IF NOT EXISTS idx_feed_items_sentiment ON feed_items (sentiment);
CREATE INDEX IF NOT EXISTS idx_feed_items_published_at ON feed_items (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_engagement ON feed_items (engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_expires_at ON feed_items (expires_at);

-- ============================================================
-- Trending Companies Table
-- ============================================================
CREATE TABLE IF NOT EXISTS trending_companies (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  count         INTEGER NOT NULL DEFAULT 1,
  sentiment     TEXT NOT NULL DEFAULT 'neutral'
                  CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_trending_companies_count ON trending_companies (count DESC);
CREATE INDEX IF NOT EXISTS idx_trending_companies_expires_at ON trending_companies (expires_at);

-- ============================================================
-- Fetch Logs Table
-- ============================================================
CREATE TABLE IF NOT EXISTS fetch_logs (
  id         SERIAL PRIMARY KEY,
  type       TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  count      INTEGER NOT NULL DEFAULT 0,
  error      TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fetch_logs_created_at ON fetch_logs (created_at DESC);

-- ============================================================
-- Auto-cleanup function (called by cron or pg_cron)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_items()
RETURNS void AS $$
BEGIN
  DELETE FROM feed_items WHERE expires_at < NOW();
  DELETE FROM trending_companies WHERE expires_at < NOW();
  -- Keep only last 500 fetch logs
  DELETE FROM fetch_logs
  WHERE id NOT IN (
    SELECT id FROM fetch_logs ORDER BY created_at DESC LIMIT 500
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Optional: Schedule auto-cleanup every hour with pg_cron
-- (Only available on Supabase or self-hosted Postgres with pg_cron)
-- ============================================================
-- SELECT cron.schedule('cleanup-expired-items', '0 * * * *', 'SELECT cleanup_expired_items()');
