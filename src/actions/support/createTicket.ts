'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createTicket({
  accountId,
  userId,
  subject,
  category,
  priority,
  description
}: {
  accountId: string
  userId: string
  subject: string
  category: string
  priority: string
  description: string
}) {
  const supabase = createServerComponentClient({ cookies })

  const { data: insertedTicket, error } = await supabase.from('saip_support_tickets').insert({
    account_id: accountId,
    user_id: userId,
    subject,
    category,
    priority,
    description
  }).select('id').single()

  if (error) {
    console.error('❌ Error creating ticket:', error.message)
    return { success: false }
  }

  if (insertedTicket?.id) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send_ticket_notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
        },
        body: JSON.stringify({ ticketId: insertedTicket.id }),
      });

      if (!response.ok) {
        console.error('❌ Failed to trigger ticket notification');
      }
    } catch (err) {
      console.error('❌ Error calling ticket notification:', err);
    }
  }

  return { success: true }
}