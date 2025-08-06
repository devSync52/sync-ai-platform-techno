import React from 'react'
import { renderToBuffer, Document, Page, Text } from '@react-pdf/renderer'
import { resend } from '@/lib/resend/resend'

export async function sendQuoteEmail({ quote, items, to }: { quote: any; items: any[]; to: string }) {
  try {
    console.log('📨 Preparing to send email to:', to)
    console.log('🧾 Quote:', quote)
    console.log('📦 Items:', items)

    const element = React.createElement(
      Document,
      null,
      React.createElement(Page, null, React.createElement(Text, null, `Quote ID: ${quote.id}`))
    )
    const pdfBuffer = await renderToBuffer(element)

    const subject = `Quote #${quote.id} - SynC Platform`

    const html = `
      <p>Hello,</p>
      <p>Attached is your shipping quote.</p>
      <p>You can also <a href="https://app.syncplatform.com/quotes/view/${quote.id}">view it online</a>.</p>
      <p>Thank you,<br/>SynC Fulfillment</p>
    `

    const { error } = await resend.emails.send({
      from: 'cotacoes@syncplatform.com',
      to,
      subject,
      html,
      attachments: [
        {
          filename: `Quote-${quote.id}.pdf`,
          content: pdfBuffer.toString('base64'),
          contentType: 'application/pdf'
        }
      ]
    })

    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    console.error('❌ Error inside sendQuoteEmail:', error)
    return { error: 'Failed to send email' }
  }
}