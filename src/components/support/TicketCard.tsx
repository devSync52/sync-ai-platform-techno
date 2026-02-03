import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface TicketCardProps {
  ticket: {
    id: string
    subject: string
    account_name: string
    category: string
    priority: string
    status: string
    created_at: string
  }
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Link
      href={`/support/${ticket.id}`}
      className="block border rounded-xl p-4 hover:bg-muted transition mb-4"
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{ticket.subject}</h3>
        <Badge
          className="capitalize"
          variant={ticket.status === 'open' ? 'default' : 'secondary'}
        >
          {ticket.status}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground">{ticket.account_name}</div>

      <div className="text-sm text-muted-foreground mt-1 capitalize">
        {ticket.category} • Priority:{' '}
        <Badge
          className="capitalize"
          variant={
            ticket.priority === 'urgent'
              ? 'destructive'
              : ticket.priority === 'high'
              ? 'secondary'
              : ticket.priority === 'normal'
              ? 'outline'
              : 'default'
          }
        >
          {ticket.priority}
        </Badge>
      </div>

      <div className="text-xs text-muted-foreground mt-2">
        Created at: {format(new Date(ticket.created_at), 'yyyy-MM-dd HH:mm')}
      </div>
    </Link>
  )
}