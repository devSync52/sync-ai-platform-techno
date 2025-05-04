import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/utils/supabase/server';

interface ChannelMarketplace {
  id: string;
  channel_id: string;
  marketplace_code: string;
  marketplace_name: string;
  logo_url: string;
}

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient();

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return NextResponse.json({ success: false, error: 'Missing channelId' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('channel_marketplaces')
    .select('*')
    .eq('channel_id', channelId);

  if (error) {
    console.error('Erro ao buscar marketplaces:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const marketplaces = data.map((r: ChannelMarketplace) => ({
    id: r.id,
    code: r.marketplace_code,
    name: r.marketplace_name,
    logo: r.logo_url
  }));

  return NextResponse.json({ success: true, marketplaces });
}