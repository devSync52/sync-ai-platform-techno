// src/lib/ai/langchain/tools/sqlQueryTool.ts
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const sqlQueryTool = new DynamicStructuredTool({
  name: 'sql_query_tool',
  description: 'Use this tool to run SQL queries on SynC database. Always filter by account_id.',
  schema: z.object({
    query: z.string().describe('SQL SELECT query filtered by account_id')
  }),
  func: async ({ query }: { query: string }) => {
    const { data, error } = await supabase.rpc('run_dynamic_sql', { query })
    if (error) return `Error: ${error.message}`
    return JSON.stringify(data ?? [])
  }
})