'use server'

export async function resendInviteAction({
  channelId,
}: {
  channelId: string
}) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend_channel_invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({ channelId }),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Unknown error')

    return {
      success: true,
      message: result.message || 'Invite resent successfully',
    }
  } catch (err: any) {
    console.error('[resendInviteAction] Erro ao reenviar convite:', err.message)
    return {
      success: false,
      message: err.message,
    }
  }
}