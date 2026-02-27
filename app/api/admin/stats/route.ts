import { NextRequest, NextResponse } from 'next/server';
import { getFeedStats, getRecentFetchLogs, getLastFetchTime } from '@/lib/db';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import type { AdminStats, Category, Sentiment } from '@/types';

export const runtime = 'nodejs';

function requireAdmin(request: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return true; // No secret configured – allow in dev
  const auth = request.headers.get('x-admin-secret');
  return auth === adminSecret;
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cached = cache.get<AdminStats>(CACHE_KEYS.ADMIN_STATS);
  if (cached) {
    return NextResponse.json({ data: cached, cached: true, timestamp: new Date().toISOString() });
  }

  try {
    const [stats, logs, lastFetch] = await Promise.all([
      getFeedStats(),
      getRecentFetchLogs(30),
      getLastFetchTime(),
    ]);

    const totalsMap: Record<string, number> = {};
    for (const r of stats.totals as Record<string, unknown>[]) {
      totalsMap[r.type as string] = Number(r.count);
    }

    const categoryBreakdown = {} as Record<Category, number>;
    for (const r of stats.categories as Record<string, unknown>[]) {
      categoryBreakdown[r.category as Category] = Number(r.count);
    }

    const sentimentBreakdown = {} as Record<Sentiment, number>;
    for (const r of stats.sentiments as Record<string, unknown>[]) {
      sentimentBreakdown[r.sentiment as Sentiment] = Number(r.count);
    }

    const topSources = (stats.sources as Record<string, unknown>[]).map((r) => ({
      source: r.source as string,
      count: Number(r.count),
    }));

    const adminStats: AdminStats = {
      totalPosts: totalsMap['tweet'] ?? 0,
      totalNews: totalsMap['news'] ?? 0,
      lastFetch: lastFetch ? new Date(lastFetch as string).toISOString() : null,
      fetchLogs: (logs as Record<string, unknown>[]).map((r) => ({
        id: Number(r.id),
        type: r.type as string,
        status: r.status as string,
        count: Number(r.count),
        error: (r.error as string) ?? null,
        createdAt: (r.created_at as Date).toISOString(),
      })),
      categoryBreakdown,
      sentimentBreakdown,
      topSources,
    };

    cache.set(CACHE_KEYS.ADMIN_STATS, adminStats, CACHE_TTL.ADMIN);

    return NextResponse.json({ data: adminStats, cached: false, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[API/admin/stats]', err);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats', data: null, cached: false, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
