import { NextResponse } from 'next/server'
import { sendQuoteEmail } from '@/lib/emails/sendQuoteEmail'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const { email, quote, items } = await req.json()

    if (!email || !quote || !items) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // We assume sendQuoteEmail will throw if something goes wrong.
    await sendQuoteEmail({ to: email, quote, items })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('❌ Error sending quote email:', err)
    return NextResponse.json({ error: 'Failed to send quote email' }, { status: 500 })
  }
}
