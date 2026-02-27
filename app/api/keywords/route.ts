import { NextResponse } from 'next/server';
import { getKeywordCounts } from '@/lib/db';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

export const runtime = 'nodejs';

export async function GET() {
  const cached = cache.get(CACHE_KEYS.KEYWORD_COUNTS);
  if (cached) {
    return NextResponse.json({ data: cached, cached: true, timestamp: new Date().toISOString() });
  }

  try {
    const rows = await getKeywordCounts();
    const keywords = rows.map((r: Record<string, unknown>) => ({
      keyword: r.keyword as string,
      count: Number(r.count),
    }));

    cache.set(CACHE_KEYS.KEYWORD_COUNTS, keywords, CACHE_TTL.KEYWORDS);

    return NextResponse.json({ data: keywords, cached: false, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[API/keywords]', err);
    return NextResponse.json(
      { error: 'Failed to fetch keywords', data: [], cached: false, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
