import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { account_id, personality_text } = await req.json()

  if (!account_id || !personality_text) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  const { error } = await supabase
    .from('xai_personality_profiles')
    .upsert({ account_id, personality_text }, { onConflict: 'account_id' })

  if (error) {
    console.error('[xai/personality] Error saving personality:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('account_id')
  
    if (!accountId) {
      return new Response(JSON.stringify({ error: 'Missing account_id' }), { status: 400 })
    }
  
    const { data, error } = await supabase
      .from('xai_personality_profiles')
      .select('personality_text')
      .eq('account_id', accountId)
      .maybeSingle()
  
    if (error) {
      console.error('[xai/personality] GET error:', error.message)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  
    return new Response(JSON.stringify(data || {}), { status: 200 })
  }