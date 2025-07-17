'use client'

import { useState, useTransition } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function NewSupportTicketForm({ accountId, userId }: { accountId: string; userId: string }) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('account')
  const [priority, setPriority] = useState('normal')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = useSupabase()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject || !description) {
      toast.error('Please fill in all required fields')
      return
    }

    startTransition(async () => {
      const { error } = await supabase.from('saip_support_tickets').insert({
        account_id: accountId,
        user_id: userId,
        subject,
        category,
        priority,
        description
      })

      if (error) {
        console.error('❌ Error creating ticket:', error.message)
        toast.error('❌ Failed to create ticket')
      } else {
        toast.success('✅ Ticket created')
        router.push('/support')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Subject</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit Ticket'}
        </Button>
      </div>
    </form>
  )
}