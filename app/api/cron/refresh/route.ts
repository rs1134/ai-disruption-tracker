import { NextRequest, NextResponse } from 'next/server';
import { refreshAllData } from '@/lib/refreshData';

// Vercel Cron / manual refresh handler
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Protect cron endpoint
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await refreshAllData();

    return NextResponse.json({
      success: true,
      duration: results.durationMs,
      results: { tweets: results.tweets, news: results.news, errors: results.errors },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const msg = (err as Error).message;
    console.error('[Cron] Refresh failed:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
