'use server'

export async function sendInviteAction({
  channelId,
  email
}: {
  channelId: string
  email: string
}) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send_channel_invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({ channelId, email })
    })
    console.log('[sendInviteAction] Dados enviados:', { channelId, email })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Unknown error')

    return {
      success: true,
      invitation: result.invitation || null // pode vir com dados úteis do backend
    }
  } catch (err: any) {
    console.error('[sendInviteAction] Erro ao enviar convite:', err.message)
    return {
      success: false,
      message: err.message
    }
  }
}