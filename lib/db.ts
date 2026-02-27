import { neon, neonConfig, type NeonQueryFunction } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Node.js environments (API routes, not Edge runtime)
neonConfig.webSocketConstructor = ws;

// Lazy singleton – safe to import at build time when DATABASE_URL may not exist.
let _sql: NeonQueryFunction<false, false> | null = null;

function db(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  _sql = neon(url);
  return _sql;
}

// ── Feed Items ───────────────────────────────────────────────

export async function upsertFeedItem(item: {
  id: string;
  type: 'tweet' | 'news';
  title: string;
  content: string;
  author: string;
  source: string;
  url: string;
  imageUrl?: string;
  engagementScore: number;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  category: string;
  sentiment: string;
  tags: string[];
  publishedAt: string;
}) {
  const sql = db();
  return sql`
    INSERT INTO feed_items (
      id, type, title, content, author, source, url, image_url,
      engagement_score, likes, reposts, replies, views,
      category, sentiment, tags, published_at, expires_at
    ) VALUES (
      ${item.id}, ${item.type}, ${item.title}, ${item.content},
      ${item.author}, ${item.source}, ${item.url}, ${item.imageUrl ?? null},
      ${item.engagementScore}, ${item.likes}, ${item.reposts},
      ${item.replies}, ${item.views}, ${item.category}, ${item.sentiment},
      ${item.tags}, ${item.publishedAt},
      NOW() + INTERVAL '24 hours'
    )
    ON CONFLICT (id) DO UPDATE SET
      engagement_score = EXCLUDED.engagement_score,
      likes            = EXCLUDED.likes,
      reposts          = EXCLUDED.reposts,
      replies          = EXCLUDED.replies,
      views            = EXCLUDED.views,
      expires_at       = NOW() + INTERVAL '24 hours'
  `;
}

export async function getFeedItems(
  type?: 'tweet' | 'news',
  limit = 50,
  offset = 0
) {
  const sql = db();
  if (type) {
    return sql`
      SELECT * FROM feed_items
      WHERE type = ${type} AND expires_at > NOW()
      ORDER BY engagement_score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }
  return sql`
    SELECT * FROM feed_items
    WHERE expires_at > NOW()
    ORDER BY engagement_score DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export async function getTopDisruptionItem() {
  const sql = db();
  const rows = await sql`
    SELECT * FROM feed_items
    WHERE expires_at > NOW() AND category != 'General'
    ORDER BY engagement_score DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

// ── Trending Companies ───────────────────────────────────────

export async function upsertTrendingCompany(name: string, sentiment: string) {
  const sql = db();
  return sql`
    INSERT INTO trending_companies (name, count, sentiment, expires_at)
    VALUES (${name}, 1, ${sentiment}, NOW() + INTERVAL '24 hours')
    ON CONFLICT (name) DO UPDATE SET
      count     = trending_companies.count + 1,
      sentiment = EXCLUDED.sentiment,
      last_seen = NOW(),
      expires_at = NOW() + INTERVAL '24 hours'
  `;
}

export async function getTrendingCompanies(limit = 10) {
  const sql = db();
  return sql`
    SELECT name, count, sentiment
    FROM trending_companies
    WHERE expires_at > NOW()
    ORDER BY count DESC
    LIMIT ${limit}
  `;
}

// ── Fetch Logs ───────────────────────────────────────────────

export async function logFetch(
  type: string,
  status: 'success' | 'error' | 'partial',
  count: number,
  error?: string,
  durationMs?: number
) {
  const sql = db();
  return sql`
    INSERT INTO fetch_logs (type, status, count, error, duration_ms)
    VALUES (${type}, ${status}, ${count}, ${error ?? null}, ${durationMs ?? null})
  `;
}

export async function getRecentFetchLogs(limit = 20) {
  const sql = db();
  return sql`
    SELECT * FROM fetch_logs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

export async function getLastFetchTime() {
  const sql = db();
  const rows = await sql`
    SELECT created_at FROM fetch_logs
    WHERE status = 'success'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0]?.created_at ?? null;
}

// ── Stats ────────────────────────────────────────────────────

export async function getFeedStats() {
  const sql = db();
  const [totals, categories, sentiments, sources] = await Promise.all([
    sql`
      SELECT type, COUNT(*) as count
      FROM feed_items
      WHERE expires_at > NOW()
      GROUP BY type
    `,
    sql`
      SELECT category, COUNT(*) as count
      FROM feed_items
      WHERE expires_at > NOW()
      GROUP BY category
      ORDER BY count DESC
    `,
    sql`
      SELECT sentiment, COUNT(*) as count
      FROM feed_items
      WHERE expires_at > NOW()
      GROUP BY sentiment
    `,
    sql`
      SELECT source, COUNT(*) as count
      FROM feed_items
      WHERE expires_at > NOW()
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `,
  ]);
  return { totals, categories, sentiments, sources };
}

export async function getKeywordCounts() {
  const sql = db();
  return sql`
    SELECT unnest(tags) as keyword, COUNT(*) as count
    FROM feed_items
    WHERE expires_at > NOW()
    GROUP BY keyword
    ORDER BY count DESC
    LIMIT 30
  `;
}

// ── Cleanup ──────────────────────────────────────────────────

export async function cleanupExpired() {
  const sql = db();
  const [items, companies] = await Promise.all([
    sql`DELETE FROM feed_items WHERE expires_at < NOW()`,
    sql`DELETE FROM trending_companies WHERE expires_at < NOW()`,
  ]);
  return { items, companies };
}
