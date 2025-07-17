import { format } from 'date-fns'

interface MessageBubbleProps {
  message: {
    id: string
    sender_id: string
    message: string
    created_at: string
    internal_note: boolean
  }
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const bubbleClass = isOwn
    ? 'bg-primary text-white self-end'
    : message.internal_note
    ? 'bg-yellow-100 text-yellow-900 border border-yellow-300 self-start'
    : 'bg-muted text-foreground self-start'

  const senderLabel = message.internal_note
    ? 'Internal note'
    : isOwn
    ? 'You'
    : 'Support'

  return (
    <div className={`max-w-md w-fit rounded-lg px-4 py-2 text-sm ${bubbleClass}`}>
      <div className="font-semibold text-xs mb-1">{senderLabel}</div>
      <p>{message.message}</p>
      <div className="text-xs text-muted-foreground mt-1 text-right">
        {format(new Date(message.created_at), 'yyyy-MM-dd HH:mm')}
      </div>
    </div>
  )
}