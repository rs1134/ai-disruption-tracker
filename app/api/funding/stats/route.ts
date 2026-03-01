import { NextResponse } from 'next/server';
import { ensureFundingTable, getFundingStats, seedFundingData } from '@/lib/funding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureFundingTable();
    await seedFundingData();
    const stats = await getFundingStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[/api/funding/stats] error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
