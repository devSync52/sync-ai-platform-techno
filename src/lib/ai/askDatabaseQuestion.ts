// src/lib/ai/askDatabaseQuestion.ts

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
Table: get_sellercloud_orders
- id: uuid
- account_id: uuid
- order_id: integer
- client_name: text
- marketplace_name: text
- total_amount: numeric
- order_date: timestamp
- status: text
`;

  const systemPrompt = `You are a data analyst assistant that answers questions using SQL.
Use only the table get_sellercloud_orders.
Always filter by account_id = '${account_id}'.
Today is ${new Date().toISOString().split('T')[0]}.
Return only SQL queries using SELECT. 
Always use ILIKE with wildcards (%) when filtering text fields like client_name or marketplace.
If filtering by order_id or other text fields that look like numbers, wrap the value in single quotes (e.g. order_id = '5010986').
No INSERT/UPDATE/DELETE statements.
Do not include placeholder values like 'your_account_id'.`;

  const totalPromptLength = systemPrompt.length + schema.length + question.length;
  const selectedModel = model ?? (totalPromptLength > 3000 ? 'gpt-4' : 'gpt-3.5-turbo');

  const completion = await openai.chat.completions.create({
    model: selectedModel,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt + '\n\nSchema:\n' + schema },
      { role: 'user', content: question },
    ],
  });

  const usage = completion.usage;

  let sql = completion.choices?.[0]?.message?.content ?? ''

  sql = sql
    .replace(/^```sql\s*/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .replace(/\u200B/g, '')
    .replace(/\s*;+\s*$/, '')
    .trim();

  if (!sql.toLowerCase().startsWith('select')) {
    return { success: false, error: 'Invalid SQL generated', sql };
  }

  const safeSql = sql.replace(/'your_account_id'/g, `'${account_id}'`);

  if (!safeSql.includes(account_id)) {
    return {
      success: false,
      error: 'The generated query is not secure (missing account_id).',
      sql: safeSql,
    };
  }

  const { data, error } = await supabase.rpc('run_dynamic_sql', {
    query: safeSql,
  });

  if (error) {
    return { success: false, error: error.message, sql: safeSql };
  }

  const rows = Array.isArray(data) ? data : data ? JSON.parse(data as any) : [];

  const rowsText = rows
    .map((r: Record<string, any>) => {
      return Object.entries(r)
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join(', ');
    })
    .join('\n');

  let answer = 'No results found.';

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
        {
          role: 'user',
          content: `Here is the SQL result:\n${rowsText}`,
        },
      ],
    });

    answer = summaryResponse.choices?.[0]?.message?.content?.trim() || answer;
  }

  const metadata = {
    usage: {
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
      total_tokens: usage?.total_tokens,
    },
  };

  await supabase.from('ai_logs').insert({
    user_id,
    account_id,
    question,
    sql: safeSql,
    answer,
    model: selectedModel,
    metadata: {
      rows,
      usage: completion?.usage || null
    }
  })

  return { success: true, answer, sql: safeSql, rows };
}
