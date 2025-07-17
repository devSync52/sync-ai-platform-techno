import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies as getCookies } from 'next/headers'
import TicketDetail from '@/components/support/TicketDetail'

// @ts-ignore
export default async function TicketPage({ params }) {
    const { ticketId } = params;
    const supabase = createServerComponentClient({ cookies: () => getCookies() });
    const { data: ticket } = await supabase
      .from('saip_support_tickets')
      .select('status')
      .eq('id', ticketId)
      .maybeSingle();
  
    const isClosed = ticket?.status === 'closed';
  
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Link
          href="/support"
          className="inline-flex items-center text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to tickets
        </Link>
  
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Ticket Detail</h1>
        </div>
  
        <div className="border shadow-md bg-white rounded-2xl p-6 gap-4">
          <TicketDetail ticketId={ticketId} />
        </div>
      </div>
    );
  }
