import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const {
    account_id,
    ask_feedback,
    suggest_related_questions,
    send_followup_question,
    escalate_after_unanswered_count,
  } = await req.json()

  if (!account_id) {
    return new Response(JSON.stringify({ error: 'Missing account_id' }), { status: 400 })
  }

  const { error } = await supabase
    .from('xai_followup_settings')
    .upsert(
      {
        account_id,
        ask_feedback,
        suggest_related_questions,
        send_followup_question,
        escalate_after_unanswered_count,
      },
      { onConflict: 'account_id' }
    )

  if (error) {
    console.error('[xai/followup] Error saving follow-up:', error.message)
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
      .from('xai_followup_settings')
      .select(
        'ask_feedback, suggest_related_questions, send_followup_question, escalate_after_unanswered_count'
      )
      .eq('account_id', accountId)
      .maybeSingle()
  
    if (error) {
      console.error('[xai/followup] GET error:', error.message)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
  
    return new Response(JSON.stringify(data || {}), { status: 200 })
  }