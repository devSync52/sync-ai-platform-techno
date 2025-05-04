export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const account_id = searchParams.get('account_id');
  
    if (!account_id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing account_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  
    const response = await fetch(
      `https://euzjrgnyzfgldubqglba.supabase.co/rest/v1/account_integrations?select=last_synced_at&account_id=eq.${account_id}&type=eq.sellercloud`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
        }
      }
    );
  
    const data = await response.json();
    const last = data?.[0]?.last_synced_at ?? null;
  
    return new Response(JSON.stringify({ success: true, last_synced_at: last }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }