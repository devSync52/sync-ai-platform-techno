// src/app/api/ai/agent/route.ts
import { NextResponse } from 'next/server'
import { runSyncAgent } from '@/lib/ai/langchain/syncAgent'

export async function POST(req: Request) {
  try {
    const { question, account_id, session_id } = await req.json()

    if (!question || !account_id || !session_id) {
      return NextResponse.json(
        { error: 'Missing required fields: question, account_id, and session_id' },
        { status: 400 }
      )
    }

    const output = await runSyncAgent(question, account_id, session_id)

    return NextResponse.json({ output })
  } catch (err: any) {
    console.error('[Agent Route] ❌ Error:', err)
    return NextResponse.json({ error: 'Agent error' }, { status: 500 })
  }
}