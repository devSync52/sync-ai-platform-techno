import { TicketCard } from './TicketCard'

interface TicketListProps {
  tickets: {
    id: string
    subject: string
    account_name: string
    category: string
    priority: string
    status: string
    created_at: string
  }[]
}

export default function TicketList({ tickets }: TicketListProps) {
  if (!tickets.length) {
    return <p className="text-muted-foreground">No tickets yet.</p>
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  )
}