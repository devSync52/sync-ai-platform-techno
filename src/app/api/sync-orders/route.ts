export async function POST(req: Request) {
  const body = await req.json();
  const { account_id, fromDate, toDate, source = 'sellercloud' } = body;

  const syncUrls: Record<'sellercloud' | 'extensiv', string> = {
    sellercloud: 'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/get_sellercloud_orders',
    extensiv: 'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/get_extensiv_orders'
  };
  
  if (!syncUrls[source as keyof typeof syncUrls]) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid source' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const response = await fetch(syncUrls[source as 'sellercloud' | 'extensiv'], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_id, fromDate, toDate })
  });

  const result = await response.json();

  return new Response(JSON.stringify(result), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  });
}