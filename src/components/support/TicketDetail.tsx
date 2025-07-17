'use client'

import { useEffect, useState } from 'react'
import { useSupabase, useSession } from '@/components/supabase-provider'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { MessageBubble } from './MessageBubble'

interface TicketDetailProps {
  ticketId: string
}

interface Message {
  id: string
  sender_id: string
  message: string
  created_at: string
  internal_note: boolean
}

export default function TicketDetail({ ticketId }: TicketDetailProps) {
  const supabase = useSupabase()
  const session = useSession()
  const user = session?.user
  const role = user?.user_metadata?.role
  const isStaff = ['staff-user', 'staff-admin', 'admin'].includes(role)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInternal, setIsInternal] = useState(false)
  const [ticketInfo, setTicketInfo] = useState<{
    subject: string
    status: string
    category: string
    priority: string
  } | null>(null)
  const [initialMessage, setInitialMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('saip_support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching messages:', error.message)
      } else {
        setMessages(data)
      }
    }

    const fetchTicketInfo = async () => {
      const { data, error } = await supabase
        .from('saip_support_tickets')
        .select('subject, status, category, priority, description')
        .eq('id', ticketId)
        .single()
      if (error) {
        console.error('❌ Error fetching ticket info:', error.message)
      } else {
        setTicketInfo(data)
        setInitialMessage(data.description || null)
      }
    }

    fetchTicketInfo()
    fetchMessages()
  }, [supabase, ticketId])

  const handleReply = async () => {
    if (!newMessage.trim()) return
    setIsLoading(true)

    if (!user?.id) {
      console.error('❌ Cannot send message: user ID is undefined.')
      setIsLoading(false)
      return
    }

    const { error } = await supabase.from('saip_support_messages').insert({
      ticket_id: ticketId,
      sender_id: user.id,
      message: newMessage,
      internal_note: isInternal
    })

    if (!error) {
      setNewMessage('')
      const { data } = await supabase
        .from('saip_support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      setMessages(data ?? [])
      setIsInternal(false)
    }

    setIsLoading(false)
  }

  const handleCloseTicket = async () => {
    setIsLoading(true)
    const token = session?.access_token
    if (!token) {
      console.error('No access token found.')
      return
    }

    const res = await fetch(`/api/support/close-ticket/${ticketId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (res.ok) {
      setTicketInfo((prev) => prev ? { ...prev, status: 'closed' } : prev)
    } else {
      const err = await res.json()
      console.error('❌ Failed to close ticket:', err?.error || res.statusText)
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      {ticketInfo && (
        <div className="border p-4 rounded-md bg-background space-y-2">
          <h2 className="text-xl font-semibold">{ticketInfo.subject}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md capitalize">{ticketInfo.status}</span>
            <span className="px-2 py-1 bg-muted rounded-md capitalize">{ticketInfo.category}</span>
            <span
              className={`px-2 py-1 rounded-md capitalize ${
                ticketInfo.priority?.toLowerCase() === 'urgent'
                  ? 'bg-red-100 text-red-800'
                  : ticketInfo.priority?.toLowerCase() === 'high'
                  ? 'bg-orange-100 text-orange-800'
                  : ticketInfo.priority?.toLowerCase() === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {ticketInfo.priority}
            </span>
          </div>
        </div>
      )}
      {initialMessage && (
        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground whitespace-pre-line">
          <div className="font-semibold mb-1">Initial message</div>
          {initialMessage}
        </div>
      )}    
      <div className="space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
        ))}
      </div>

      <div className="pt-4 space-y-2">
        <Textarea
          rows={4}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Write your reply..."
        />
        {isStaff && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="internalNote"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            <label htmlFor="internalNote" className="text-sm">
              Internal note (only visible to staff)
            </label>
          </div>
        )}<div className="flex justify-between">
        <Button onClick={handleReply} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Message'}
        </Button>
        {isStaff && ticketInfo?.status !== 'closed' && (
          <Button
            variant="destructive"
            onClick={handleCloseTicket}
            disabled={isLoading}
          >
            {isLoading ? 'Closing...' : 'Close Ticket'}
          </Button>
        )}</div>
      </div>
    </div>
  )
}