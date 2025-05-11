import { askDatabaseQuestion } from '@/lib/ai/askDatabaseQuestion'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { question, account_id, user_id } = await req.json()

  if (!question || !account_id || !user_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const result = await askDatabaseQuestion({ question, account_id, user_id })

  if (!result.success || !result.answer) {
    return NextResponse.json({ error: result.error || 'Query failed', sql: result.sql }, { status: 500 })
  }

  return NextResponse.json({
    answer: result.answer,
    sql: result.sql,
    rows: result.rows ?? []
  })
}