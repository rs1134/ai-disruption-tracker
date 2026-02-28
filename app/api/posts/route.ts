import { NextRequest, NextResponse } from 'next/server';
import { getFeedItems } from '@/lib/db';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { refreshAllData } from '@/lib/refreshData';
import type { FeedItem } from '@/types';

export const runtime = 'nodejs';
// Allow up to 60 s – needed when an on-demand refresh is triggered inline
export const maxDuration = 60;

function mapRow(row: Record<string, unknown>): FeedItem {
  return {
    id: row.id as string,
    type: row.type as 'tweet' | 'news',
    title: row.title as string,
    content: row.content as string,
    author: row.author as string,
    source: row.source as string,
    url: row.url as string,
    imageUrl: (row.image_url as string) ?? undefined,
    engagementScore: Number(row.engagement_score),
    likes: Number(row.likes),
    reposts: Number(row.reposts),
    replies: Number(row.replies),
    views: Number(row.views),
    category: row.category as FeedItem['category'],
    sentiment: row.sentiment as FeedItem['sentiment'],
    tags: (row.tags as string[]) ?? [],
    publishedAt: (row.published_at as Date).toISOString(),
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'tweet' | 'news' | null;
  const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100);
  const offset = Number(searchParams.get('offset') ?? '0');

  const cacheKey = type ? CACHE_KEYS[`FEED_${type.toUpperCase() as 'TWEETS' | 'NEWS'}`] : CACHE_KEYS.FEED_ALL;

  // Return from in-process cache when available (first-page requests only)
  const cached = cache.get<FeedItem[]>(cacheKey);
  if (cached && offset === 0) {
    return NextResponse.json({
      data: cached.slice(0, limit),
      cached: true,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const rows = await getFeedItems(type ?? undefined, limit, offset);
    let items = rows.map(mapRow);

    // ── On-demand auto-refresh ──────────────────────────────────────────────
    // If the DB returned no live items on the first page it means all records
    // have expired (35-min TTL).  Trigger a fresh fetch inline so the user
    // always sees up-to-date content without needing a paid Vercel cron plan.
    if (items.length === 0 && offset === 0) {
      console.log('[API/posts] No live items – triggering on-demand refresh…');
      try {
        await refreshAllData();
        // Re-query with fresh data
        const freshRows = await getFeedItems(type ?? undefined, limit, offset);
        items = freshRows.map(mapRow);
      } catch (refreshErr) {
        console.error('[API/posts] On-demand refresh failed:', refreshErr);
        // Fall through and return empty – better than crashing
      }
    }
    // ───────────────────────────────────────────────────────────────────────

    // Cache first page
    if (offset === 0) {
      cache.set(cacheKey, items, CACHE_TTL.FEED);
    }

    return NextResponse.json({
      data: items,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[API/posts]', err);
    return NextResponse.json(
      { error: 'Failed to fetch posts', data: [], cached: false, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
