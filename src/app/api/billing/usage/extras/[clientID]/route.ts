
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// If you have generated Database types, you can import and use them:
// import type { Database } from '@/lib/database.types';

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getDateRange(searchParams: URLSearchParams) {
  const today = new Date();
  const period = (searchParams.get('period') || 'last_7_days').toLowerCase();

  if (period === 'custom') {
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const startISO = start ?? toISODate(new Date(today.getTime() - 6 * 24 * 3600 * 1000));
    const endISO = end ?? toISODate(today);
    return { startISO, endISO };
  }

  const presets: Record<string, number> = {
    last_7_days: 6,
    last_30_days: 29,
    last_90_days: 89,
  };
  const back = presets[period] ?? 6;
  const start = new Date(today.getTime() - back * 24 * 3600 * 1000);
  return { startISO: toISODate(start), endISO: toISODate(today) };
}

export async function GET(req: Request, { params }: { params: { clientID: string } }) {
  try {
    const { clientID } = params;
    const url = new URL(req.url);
    const sp = url.searchParams;

    const { startISO, endISO } = getDateRange(sp);
    const q = (sp.get('q') || '').trim();
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(sp.get('pageSize') || '50', 10)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createRouteHandlerClient({ cookies });

    // Base query: supplies/materials usage for a single client within a date range
    let query = supabase
      .from('b1_v_usage_supplies')
      .select('*', { count: 'exact' })
      .eq('client_account_id', clientID)
      .gte('occurred_at', `${startISO} 00:00:00+00`)
      .lte('occurred_at', `${endISO} 23:59:59+00`);

    if (q) {
      // Search in description and ref_id
      query = query.or(
        `description.ilike.%${q}%,ref_id.ilike.%${q}%`
      );
    }

    const { data: rows, error, count } = await query
      .order('occurred_at', { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Normalize response to the UI shape
    const items = (rows || []).map((r) => ({
      occurred_at: r.occurred_at,
      ref_id: r.ref_id,
      description: r.description,
      quantity: r.quantity,
      unit: r.unit ?? 'unit',
      rate_usd: r.rate_usd,
      amount_usd: r.amount_usd,
      status: 'pending',
      kind: 'extra', // Supplies/Materials are tracked as "extras"
      source: 'storage',
    }));

    // Summary (selected period)
    const periodTotal = (rows || []).reduce((acc: number, r: any) => acc + Number(r.amount_usd ?? 0), 0);

    const summary = {
      total_usd: periodTotal,
      pending_usd: periodTotal, // everything comes in pending by default
      invoiced_usd: 0,
      by_type: {
        storage_usd: 0,
        handling_usd: 0,
        shipping_usd: 0,
        extra_usd: periodTotal,
      },
      count: count ?? items.length,
      page,
      pageSize,
      startISO,
      endISO,
    };

    return NextResponse.json({ success: true, items, summary });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}