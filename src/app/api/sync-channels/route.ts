export async function POST(request: Request) {
  try {
    const { account_id } = await request.json()

    const response = await fetch(
      'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/get_sellercloud_orders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id }),
      }
    )

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}