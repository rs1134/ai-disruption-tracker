import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const auth = request.headers.get('x-admin-secret');
    if (auth !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const cronSecret = process.env.CRON_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const res = await fetch(`${baseUrl}/api/cron/refresh`, {
      headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    });

    if (!res.ok) {
      throw new Error(`Refresh returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
