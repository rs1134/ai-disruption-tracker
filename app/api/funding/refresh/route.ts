import { NextResponse } from 'next/server';
import { ensureFundingTable, seedFundingData } from '@/lib/funding';
import { fetchAndStoreFundingRounds } from '@/lib/fundingFetcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    await ensureFundingTable();
    // Always ensure seed data exists
    const seeded = await seedFundingData();
    // Fetch fresh rounds from RSS
    const result = await fetchAndStoreFundingRounds();
    return NextResponse.json({ ok: true, seeded, ...result });
  } catch (err) {
    console.error('[/api/funding/refresh] error:', err);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
