import { resend } from '@/lib/resend/resend'

type AuthType = 'local' | 'wms_extensiv'

export async function sendCustomerCredentialsEmail(params: {
  to: string
  customerName: string
  authType: AuthType
  password: string
  wmsUserIdentifier?: string | null
}) {
  const { to, customerName, authType, password, wmsUserIdentifier } = params
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  if (!resendApiKey || resendApiKey === 'your_resend_api_key') {
    throw new Error(
      'Email service not configured: set RESEND_API_KEY in your environment.',
    )
  }

  const authTypeLabel =
    authType === 'local'
      ? 'Local (Platform-managed credentials)'
      : 'Extensive WMS-based (Authenticate via WMS)'

  const html = `
    <p>Hello ${customerName || 'Customer'},</p>
    <p>Your SynC AI Platform user account has been created.</p>
    <p><strong>Login Email:</strong> ${to}</p>
    <p><strong>Temporary Password:</strong> ${password}</p>
    <p><strong>Authentication Type:</strong> ${authTypeLabel}</p>
    ${
      authType === 'wms_extensiv'
        ? `<p><strong>WMS User Identifier:</strong> ${wmsUserIdentifier || '-'}</p>`
        : ''
    }
    <p>Please log in and change your password after first sign-in.</p>
  `

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: 'Your SynC AI Platform login credentials',
    html,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
