import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import { tools } from '@/lib/ai-tools'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(req: Request) {
  const { message, user_id } = await req.json()

  if (!message || !user_id) {
    return new Response(JSON.stringify({ error: 'Missing message or user_id' }), { status: 400 })
  }

  const { data: userData } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user_id)
    .single()

  const accountId = userData?.account_id

  const { data: contextData } = await supabase
    .from('account_context')
    .select('prompt_context')
    .eq('account_id', accountId)
    .maybeSingle()

  const { data: settingsData } = await supabase
    .from('ai_settings')
    .select('model')
    .eq('account_id', accountId)
    .maybeSingle()

  const contextText = contextData?.prompt_context || 'You are a helpful assistant.'
  const model = settingsData?.model || (message.length < 300 ? 'gpt-3.5-turbo-1106' : 'gpt-4-0613')

  const today = new Date().toISOString().split('T')[0]

  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${contextText}\n\nToday is ${today}. Use this as reference for relative dates like "yesterday" or "last week".`
    },
    { role: 'user', content: message }
  ]

  const functions = Object.entries(tools).map(([name, def]) => ({
    name,
    description: def.description,
    parameters: def.parameters
  }))

  const response = await openai.chat.completions.create({
    model,
    stream: true,
    messages,
    functions,
    function_call: 'auto'
  })

  const stream = OpenAIStream(response as any, {
    async onCompletion(finalText: string) {
      await supabase.from('ai_logs').insert({
        account_id: accountId,
        user_id,
        question: message,
        answer: finalText,
        model
      })
    },
    experimental_onFunctionCall: async ({ name, arguments: args }) => {
      const tool = tools[name as keyof typeof tools]
      if (!tool) return 'Function not implemented.'
      return tool.handler({ accountId, args })
    }
  })

  return new StreamingTextResponse(stream)
}