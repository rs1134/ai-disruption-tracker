import { NextResponse } from 'next/server';
import {
  getTrendingCompanies,
  getTopDisruptionItem,
  getLastFetchTime,
  getKeywordCounts,
  getFeedItems,
} from '@/lib/db';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { extractLayoffNumbers, extractFundingAmount } from '@/lib/nlp';
import type { SidebarStats, TrendingCompany, FeedItem } from '@/types';

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
  const cached = cache.get<SidebarStats>(CACHE_KEYS.SIDEBAR_STATS);
  if (cached) {
    return NextResponse.json({ data: cached, cached: true, timestamp: new Date().toISOString() });
  }

  try {
    const [companyRows, allRows, lastFetch] = await Promise.all([
      getTrendingCompanies(10),
      getFeedItems(undefined, 200, 0),
      getLastFetchTime(),
    ]);

    const trendingCompanies: TrendingCompany[] = companyRows.map((r: Record<string, unknown>) => ({
      name: r.name as string,
      count: Number(r.count),
      sentiment: r.sentiment as TrendingCompany['sentiment'],
    }));

    const allItems = allRows.map(mapRow);

    // Aggregate layoff numbers
    let totalLayoffs: number | null = null;
    let totalFunding: string | null = null;
    let totalFundingNum = 0;

    for (const item of allItems) {
      if (item.category === 'Layoffs') {
        const n = extractLayoffNumbers(item.title + ' ' + item.content);
        if (n) totalLayoffs = (totalLayoffs ?? 0) + n;
      }
      if (item.category === 'Funding') {
        const f = extractFundingAmount(item.title + ' ' + item.content);
        if (f) {
          const val = parseFloat(f.replace(/[$BM]/g, ''));
          const mult = f.includes('B') ? 1000 : 1;
          totalFundingNum += val * mult;
        }
      }
    }

    if (totalFundingNum > 0) {
      totalFunding =
        totalFundingNum >= 1000
          ? `$${(totalFundingNum / 1000).toFixed(1)}B`
          : `$${totalFundingNum.toFixed(0)}M`;
    }

    const stats: SidebarStats = {
      trendingCompanies,
      totalLayoffs,
      totalFunding,
      lastRefreshed: lastFetch ? new Date(lastFetch as string).toISOString() : new Date().toISOString(),
      totalItems: allItems.length,
    };

    cache.set(CACHE_KEYS.SIDEBAR_STATS, stats, CACHE_TTL.TRENDING);

    return NextResponse.json({ data: stats, cached: false, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[API/trending]', err);
    return NextResponse.json(
      { error: 'Failed to fetch trending data', data: null, cached: false, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
