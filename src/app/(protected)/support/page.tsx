'use client'

import { useEffect, useState } from 'react'
import { useSession, useSupabase } from '@/components/supabase-provider'
import { TicketCard } from '@/components/support/TicketCard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'


export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = useSupabase()
  const session = useSession()
  const user = session?.user
  const [tickets, setTickets] = useState<any[]>([])
  const [accountId, setAccountId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  useEffect(() => {
    const loadTickets = async () => {
      if (!user?.id) return

      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .maybeSingle()

      if (userError || !userRecord?.account_id) {
        console.error('❌ Failed to fetch user account_id:', userError?.message)
        return
      }

      setAccountId(userRecord.account_id)

      let query = supabase
        .from('saip_support_tickets')
        .select('*, accounts(name)')
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      if (priorityFilter) {
        query = query.eq('priority', priorityFilter)
      }

      const { data: ticketsData, error: ticketError } = await query

      if (ticketError) {
        console.error('❌ Failed to fetch tickets:', ticketError.message)
        return
      }

      const enrichedTickets = ticketsData.map((ticket: any) => ({
        ...ticket,
        account_name: ticket.accounts?.name,
      }))
      setTickets(enrichedTickets)
    }

    loadTickets()
  }, [supabase, user?.id, statusFilter, priorityFilter])

  if (!accountId) return <p className="text-destructive">Loading session…</p>

  const filteredTickets = tickets.filter((ticket: any) =>
    ticket.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <Link href="/support/new">
          <Button variant="default">+ New Ticket</Button>
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by client or subject"
          className="border rounded px-3 py-2 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-4 mb-4">
        <select
          className="border rounded px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
        <select
          className="border rounded px-3 py-2"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <p className="text-muted-foreground">No tickets yet.</p>
      ) : (
        <div className="border shadow-md bg-white rounded-2xl p-6 gap-4">
          {filteredTickets.map((ticket: any) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  )
}