export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  
    const { account_id } = JSON.parse(req.body);
  
    const response = await fetch(
      'https://euzjrgnyzfgldubqglba.supabase.co/functions/v1/get_sellercloud_orders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id })
      }
    );
  
    const data = await response.json();
    res.status(response.status).json(data);
  }