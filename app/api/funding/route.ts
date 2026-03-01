import { NextRequest, NextResponse } from 'next/server';
import { ensureFundingTable, getFundingRounds, seedFundingData } from '@/lib/funding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await ensureFundingTable();

    // Auto-seed on first request
    await seedFundingData();

    const sp = req.nextUrl.searchParams;
    const opts = {
      search:   sp.get('search')   ?? '',
      industry: sp.get('industry') ?? '',
      stage:    sp.get('stage')    ?? '',
      location: sp.get('location') ?? '',
      year:     sp.get('year')     ?? '',
      sort:     sp.get('sort')     ?? 'date',
      order:    sp.get('order')    ?? 'desc',
      limit:    Math.min(Number(sp.get('limit') ?? 200), 500),
      offset:   Number(sp.get('offset') ?? 0),
    };

    const rounds = await getFundingRounds(opts);

    return NextResponse.json({ rounds, total: rounds.length });
  } catch (err) {
    console.error('[/api/funding] error:', err);
    return NextResponse.json({ error: 'Failed to fetch funding rounds' }, { status: 500 });
  }
}
