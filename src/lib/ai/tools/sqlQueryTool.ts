import { DynamicStructuredTool } from 'langchain/tools'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'



const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const sqlQueryTool = new DynamicStructuredTool({
  name: 'sql_query_tool',
  description: 'Run SQL queries using Supabase RPC',
  schema: z.object({
    query: z.string().describe('SQL SELECT query that filters by account_id')
  }),
  func: async ({ query }) => {
    const { data, error } = await supabase.rpc('run_dynamic_sql', { query })
    if (error) return `Error: ${error.message}`
    return JSON.stringify(data, null, 2)
  }
})