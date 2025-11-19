import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

type BarcodeTierRow = {
  client_account_id: string;
  cf_tier: string;
  orders: number;
  units: string | number;
  rate_usd: string | number | null;
  total_usd: string | number | null;
};

export async function GET(
  req: NextRequest,
  { params }: { params: { clientID: string } },
) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const clientId = params.clientID;

  // A UI já manda period/start/end, por enquanto só ler e ignorar
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const page = Number(searchParams.get('page') ?? '1');
  const pageSize = Number(searchParams.get('pageSize') ?? '50');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing clientID in route params' },
      { status: 400 },
    );
  }

  // Base query na view agregada por cliente + tier
  let query = supabase
    .from('b1_v_barcode_tiered_summary_by_client')
    .select('*')
    .eq('client_account_id', clientId)
    .order('cf_tier', { ascending: true });

  // Filtro de texto simples pelo nome do tier (cf_tier)
  if (q) {
    query = query.filter('cf_tier', 'ilike', `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching handling usage:', error);
    return NextResponse.json(
      { error: 'Failed to load handling usage' },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as BarcodeTierRow[];

  // Paginação em memória (a view deve ter poucas linhas por cliente)
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paged = rows.slice(start, end);

  // Monta items no formato genérico de usage
  const items = paged.map((r, idx) => {
    const units = Number(r.units ?? 0);
    const rate = Number(r.rate_usd ?? 0);
    const amount = Number(r.total_usd ?? units * rate);

    return {
      id: `handling-${r.client_account_id}-${r.cf_tier}-${idx}`,
      occurred_at: null, // agregados (não por dia)
      ref_id: r.cf_tier, // tier como "referência"
      kind: 'handling' as const,
      type: 'handling' as const,
      description: r.cf_tier,
      quantity: units,
      unit: 'unit',
      rate,
      amount,
      status: 'pending' as const,
      metadata: {
        orders: r.orders,
      },
    };
  });

  const totalHandling = rows.reduce(
    (sum, r) => sum + Number(r.total_usd ?? 0),
    0,
  );

  return NextResponse.json({
    items,
    summary: {
      total_usd: totalHandling,
      pending_usd: totalHandling,
      invoiced_usd: 0,
      by_type: {
        storage_usd: 0,
        shipping_usd: 0,
        extra_usd: 0,
        handling_usd: totalHandling,
      },
    },
    pagination: {
      page,
      pageSize,
      totalItems: rows.length,
      totalPages: Math.max(1, Math.ceil(rows.length / pageSize)),
    },
  });
}