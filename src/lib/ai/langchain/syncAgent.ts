// src/lib/ai/langchain/syncAgent.ts

import { ChatOpenAI } from '@langchain/openai'
import { BufferMemory } from 'langchain/memory'
import { initializeAgentExecutorWithOptions } from 'langchain/agents'
import { DynamicStructuredTool } from 'langchain/tools'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { tools } from './tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const llm = new ChatOpenAI({
  temperature: 0.2,
  modelName: 'gpt-3.5-turbo-1106',
})

const systemPrompt = `You are a data analyst assistant that answers questions using SQL.
Use only the views: view_all_orders, view_all_order_items_unified, view_products_dashboard, view_sku_sales_per_day.
Always filter by account_id.
Return only SELECT queries.
`;

export async function runSyncAgent(question: string, account_id: string, sessionId: string) {
  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: 'chat_history',
  })

  const executor = await initializeAgentExecutorWithOptions(tools, llm, {
    agentType: 'openai-functions',
    agentArgs: {
      prefix: systemPrompt
    },
    memory,
  })

  const input = `${question}. Use account_id = '${account_id}'`
  const result = await executor.invoke({ input })
  return result.output
}