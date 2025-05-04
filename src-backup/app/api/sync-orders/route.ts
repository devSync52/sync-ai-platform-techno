export async function POST(req: Request) {
  const body = await req.json();
  const { account_id, fromDate, toDate } = body;

  if (!account_id) {
    return new Response(JSON.stringify({ success: false, error: 'Missing account_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const response = await fetch(
    'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/get_sellercloud_orders',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id, fromDate, toDate })
    }
  );

  const result = await response.json();

  return new Response(JSON.stringify(result), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  });
}