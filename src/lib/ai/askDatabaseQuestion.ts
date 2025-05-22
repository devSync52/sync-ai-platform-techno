import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function askDatabaseQuestion({
  question,
  account_id,
  user_id,
  model,
}: {
  question: string
  account_id: string
  user_id: string
  model?: 'gpt-4' | 'gpt-3.5-turbo'
}): Promise<{
  success: boolean
  answer?: string
  sql?: string
  rows?: any[]
  error?: string
}> {
  const schema = `
Table: view_all_orders
- id: uuid
- account_id: uuid
- order_id: text
- order_date: timestamp
- ship_date: timestamp
- client_name: text
- marketplace_name: text
- status: text
- total_amount: numeric

Table: view_all_order_items_unified
- id: uuid
- order_id: uuid
- sku: text
- quantity: integer
- unit_price: numeric

Table: view_products_dashboard
- id: uuid
- account_id: uuid
- sku: text
- product_name: text
- quantity_available: integer
- quantity_physical: integer
- site_price: numeric

Table: view_sku_sales_per_day
- date: date
- account_id: uuid
- sku: text
- total_sold: integer
- client_name text
`

const systemPrompt = `You are a data analyst assistant that answers questions using SQL.

📌 VIEWS AVAILABLE:
Use only the following views:
- view_all_orders (id, account_id, order_id, order_date, ship_date, client_name, marketplace_name, status, total_amount)
- view_all_order_items_unified (id, order_id, sku, quantity, unit_price)
- view_products_dashboard (id, account_id, sku, product_name, quantity_available, quantity_physical, site_price)
- view_sku_sales_per_day (date, account_id, sku, client_name, total_sold)

📌 FILTERING RULES:
- Always filter using: account_id = '${account_id}'
- Today is: ${new Date().toISOString().split('T')[0]}
- Use only SELECT statements. Never use INSERT/UPDATE/DELETE.
- Use ILIKE with wildcards (%) when filtering text fields like client_name, sku, or marketplace.
- Wrap numeric-looking text fields like order_id in single quotes (e.g. '5010986').

📌 JOINING RULES:
- If joining order items with orders, use: JOIN view_all_order_items_unified oi ON oi.order_id = o.id
- Always use o.order_date instead of oi.order_date when referencing order dates.

📌 SPECIAL CASES:
- To check order status by order ID:
  - Use view_all_orders
  - Return status, order_date, ship_date, client_name, marketplace_name, and total_amount
- To count orders yesterday or today:
  - Filter using: DATE(order_date) = CURRENT_DATE - interval '1 day' or CURRENT_DATE
- When ranking by client, marketplace, or product, always include both the label (e.g., client_name) and the metric (e.g., COUNT(*) or SUM(total_amount)) in the SELECT.

- To find low stock products:
  - Use quantity_available < 10 in view_products_dashboard

- To estimate stockout days:
  - 1. Get quantity_available from view_products_dashboard using account_id and sku
  - 2. Calculate average daily sold from view_sku_sales_per_day (last 30 days)
  - 3. Use: days_remaining = quantity_available / average_daily_sold (avoid division by 0)
  - When using GROUP BY, make sure all selected fields that are not aggregates (like SUM, AVG, COUNT) are included in the GROUP BY clause.
  - To use quantity_available when calculating reorder point, always JOIN view_sku_sales_per_day with view_products_dashboard using sku and account_id.

- To compute sales trends or velocity:
  - Use view_sku_sales_per_day
  - Group by date and sku

- When the user asks about a specific company or client (e.g. "FTTF"), filter using: client_name ILIKE '%<client_name>%'
- When using sku from both views, always prefix with p.sku or s.sku to avoid ambiguity.
- For PO forecast or reorder estimation, join view_sku_sales_per_day (s) with view_products_dashboard (p) using sku and account_id, and group by p.sku and p.quantity_available.

📌 RESPONSE TONE:
- Never mention SQL, datasets, rows, or technical terms
- Respond in a natural, business-friendly tone

📌 RESPONSE RULES:
- Never respond with explanations, summaries, or conclusions.
- Always return only valid SQL queries starting with SELECT.
- Never include narrative, markdown, or natural language in your response.

Do not use placeholder values like 'your_account_id'.`;

  const totalPromptLength = systemPrompt.length + schema.length + question.length
  const selectedModel = model ?? (totalPromptLength > 3000 ? 'gpt-4' : 'gpt-3.5-turbo')

  const completion = await openai.chat.completions.create({
    model: selectedModel,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt + '\n\nSchema:\n' + schema },
      { role: 'user', content: question },
    ],
  })

  const usage = completion.usage
  let sql = completion.choices?.[0]?.message?.content ?? ''

  sql = sql
    .replace(/^```sql\s*/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .replace(/\u200B/g, '')
    .replace(/\s*;+\s*$/, '')
    .trim()

  if (!sql.toLowerCase().startsWith('select')) {
    return { success: false, error: 'Invalid SQL generated', sql }
  }

  const safeSql = sql.replace(/'your_account_id'/g, `'${account_id}'`)
  console.log('[askDatabaseQuestion] ✅ SQL gerado:', safeSql)

  if (!safeSql.includes(account_id)) {
    return {
      success: false,
      error: 'The generated query is not secure (missing account_id).',
      sql: safeSql,
    }
  }

  const { data, error } = await supabase.rpc('run_dynamic_sql', { query: safeSql })
  console.log('[askDatabaseQuestion] 📅 Resultado da query:', data)

  if (error) {
    console.error('[askDatabaseQuestion] ❌ Erro ao executar SQL:', error.message)
    return { success: false, error: error.message, sql: safeSql }
  }

  const rows = Array.isArray(data) ? data : data ? JSON.parse(data as any) : []

  const maxRowsForSummary = 50
  const limitedRows = rows.slice(0, maxRowsForSummary)
  const rowsText = limitedRows
    .map((r: Record<string, any>) => Object.entries(r).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', '))
    .join('\n')

  let answer = 'No results found.'

  if (rows.length) {
    const summaryResponse = await openai.chat.completions.create({
      model: selectedModel,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You are a friendly business assistant. Based on the data below, answer clearly and naturally. Do not mention SQL, datasets, or technical terms. Respond in plain English with business-friendly language.',
        },
        { role: 'user', content: `Here is the SQL result:\n${rowsText}` },
      ],
    })

    answer = summaryResponse.choices?.[0]?.message?.content?.trim() || answer

    if (rows.length > maxRowsForSummary) {
      answer += `\n\n*Note: Only the first ${maxRowsForSummary} rows were used to generate this summary.*`
    }
  }

  const metadata = {
    usage: {
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
      total_tokens: usage?.total_tokens,
    },
    rows,
  }

  await supabase.from('ai_logs').insert({
    user_id,
    account_id,
    question,
    sql: safeSql,
    answer,
    model: selectedModel,
    metadata,
  })

  return { success: true, answer, sql: safeSql, rows }
}