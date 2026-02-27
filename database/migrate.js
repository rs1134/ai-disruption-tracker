#!/usr/bin/env node
// Run with: DATABASE_URL="..." node database/migrate.js

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const { Client, neonConfig } = require('@neondatabase/serverless');
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws;

  const client = new Client(databaseUrl);

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    // Each statement runs individually to avoid PL/pgSQL splitting issues
    const statements = [
      // Tables
      `CREATE TABLE IF NOT EXISTS feed_items (
        id               TEXT PRIMARY KEY,
        type             TEXT NOT NULL CHECK (type IN ('tweet', 'news')),
        title            TEXT NOT NULL,
        content          TEXT NOT NULL DEFAULT '',
        author           TEXT NOT NULL DEFAULT '',
        source           TEXT NOT NULL DEFAULT '',
        url              TEXT NOT NULL,
        image_url        TEXT,
        engagement_score FLOAT NOT NULL DEFAULT 0,
        likes            INTEGER NOT NULL DEFAULT 0,
        reposts          INTEGER NOT NULL DEFAULT 0,
        replies          INTEGER NOT NULL DEFAULT 0,
        views            INTEGER NOT NULL DEFAULT 0,
        category         TEXT NOT NULL DEFAULT 'General'
                           CHECK (category IN (
                             'Layoffs','Funding','Product Launch',
                             'Regulation','Breakthrough','Acquisition','General'
                           )),
        sentiment        TEXT NOT NULL DEFAULT 'neutral'
                           CHECK (sentiment IN ('positive','negative','neutral')),
        tags             TEXT[] NOT NULL DEFAULT '{}',
        published_at     TIMESTAMPTZ NOT NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
      )`,

      `CREATE TABLE IF NOT EXISTS trending_companies (
        id         SERIAL PRIMARY KEY,
        name       TEXT NOT NULL UNIQUE,
        count      INTEGER NOT NULL DEFAULT 1,
        sentiment  TEXT NOT NULL DEFAULT 'neutral'
                     CHECK (sentiment IN ('positive','negative','neutral')),
        last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
      )`,

      `CREATE TABLE IF NOT EXISTS fetch_logs (
        id          SERIAL PRIMARY KEY,
        type        TEXT NOT NULL,
        status      TEXT NOT NULL CHECK (status IN ('success','error','partial')),
        count       INTEGER NOT NULL DEFAULT 0,
        error       TEXT,
        duration_ms INTEGER,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,

      // Indexes for feed_items
      `CREATE INDEX IF NOT EXISTS idx_feed_items_type        ON feed_items (type)`,
      `CREATE INDEX IF NOT EXISTS idx_feed_items_category    ON feed_items (category)`,
      `CREATE INDEX IF NOT EXISTS idx_feed_items_sentiment   ON feed_items (sentiment)`,
      `CREATE INDEX IF NOT EXISTS idx_feed_items_published   ON feed_items (published_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_feed_items_engagement  ON feed_items (engagement_score DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_feed_items_expires     ON feed_items (expires_at)`,

      // Indexes for trending_companies
      `CREATE INDEX IF NOT EXISTS idx_trending_count   ON trending_companies (count DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_trending_expires ON trending_companies (expires_at)`,

      // Index for fetch_logs
      `CREATE INDEX IF NOT EXISTS idx_fetch_logs_created ON fetch_logs (created_at DESC)`,
    ];

    console.log(`🔄 Running ${statements.length} migration statements...`);
    let ok = 0;
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        ok++;
      } catch (err) {
        if (err.message?.includes('already exists')) {
          ok++; // idempotent — fine
        } else {
          console.warn(`⚠️  Warning: ${err.message}`);
        }
      }
    }

    console.log(`✅ Migration complete — ${ok}/${statements.length} statements succeeded`);
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

migrate();
