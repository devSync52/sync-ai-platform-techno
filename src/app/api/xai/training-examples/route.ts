import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { account_id, prompt, reply, category } = await req.json()

  if (!account_id || !prompt || !reply || !category) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
  }

  const { error } = await supabase.from('xai_training_examples').insert({
    account_id,
    prompt,
    reply,
    category,
    approved: true,
  })

  if (error) {
    console.error('[xai/training-examples] Error inserting example:', error.message)
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
      .from('xai_training_examples')
      .select('id, prompt, reply, category')
      .eq('account_id', accountId)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(50)
  
    if (error) {
      console.error('[xai/training-examples] GET error:', error.message)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  
    return new Response(JSON.stringify({ examples: data }), { status: 200 })
  }

  export async function DELETE(req: Request) {
    const { id } = await req.json()
  
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })
    }
  
    const { error } = await supabase
      .from('xai_training_examples')
      .delete()
      .eq('id', id)
  
    if (error) {
      console.error('[xai/training-examples] DELETE error:', error.message)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  }