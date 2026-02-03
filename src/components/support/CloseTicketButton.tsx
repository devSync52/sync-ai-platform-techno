'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  ticketId: string
}

export default function CloseTicketButton({ ticketId }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/support/close-ticket/${ticketId}`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Ticket closed')
        location.reload()
      } else {
        toast.error('Failed to close ticket')
      }
    } catch (err) {
      toast.error('Unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleClose} disabled={isLoading}>
      {isLoading ? 'Closing...' : 'Close Ticket'}
    </Button>
  )
}
