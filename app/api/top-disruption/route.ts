import { NextResponse } from 'next/server';
import { getTopDisruptionItem } from '@/lib/db';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import type { FeedItem } from '@/types';

export const runtime = 'nodejs';

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

export async function GET() {
  const cached = cache.get<FeedItem | null>(CACHE_KEYS.TOP_DISRUPTION);
  if (cached !== null) {
    return NextResponse.json({ data: cached, cached: true, timestamp: new Date().toISOString() });
  }

  try {
    const row = await getTopDisruptionItem();
    const item = row ? mapRow(row as Record<string, unknown>) : null;

    cache.set(CACHE_KEYS.TOP_DISRUPTION, item, CACHE_TTL.TRENDING);

    return NextResponse.json({ data: item, cached: false, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[API/top-disruption]', err);
    return NextResponse.json(
      { error: 'Failed to fetch top disruption', data: null, cached: false, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
