import { NextResponse } from 'next/server'
import { sendQuoteEmail } from '@/lib/emails/sendQuoteEmail'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, quote, items } = await req.json()

    if (!email || !quote || !items) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    const result = await sendQuoteEmail({ to: email, quote, items })

    if ('error' in result) {
      return NextResponse.json({ error: 'Failed to send quote' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('❌ Error sending quote email:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
