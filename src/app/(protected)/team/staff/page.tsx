'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { toast } from 'sonner'
import { Loader2, RefreshCcw } from 'lucide-react'
import { sendStaffInvite } from '@/lib/sendStaffInviteClient'

interface StaffUser {
  id: string
  name?: string
  email: string
  role: string
  created_at: string
  accepted: boolean
}

export default function StaffPage() {
  const supabase = useSupabaseClient()
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingInviteTo, setSendingInviteTo] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'staff-admin' | 'staff-user'>('staff-user')
  const [sending, setSending] = useState(false)

  const fetchStaff = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('list_staff_with_auth_status')
    if (error) {
      toast.error('Failed to load staff list')
      setLoading(false)
      return
    }
    setStaffList(data)
    setLoading(false)
  }

  const sendInvite = async (email?: string, role?: 'admin' | 'staff-admin' | 'staff-user') => {
    const inviteEmail = email || newEmail
    const inviteRole = role || newRole
    if (!inviteEmail || !inviteRole) return
  
    setSendingInviteTo(inviteEmail)
  
    const res = await fetch('/api/staff-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
  
    let data
try {
  data = await res.json()
} catch {
  toast.error('Unexpected server error.')
  return
}
  
    if (data.success) {
      toast.success(data.message)
      if (!email) setDialogOpen(false)
      if (!email) setNewEmail('')
      fetchStaff()
    } else {
      toast.error(data.message)
    }
  
    setSendingInviteTo(null)
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Team Members</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <button className="px-4 py-2 bg-primary text-white rounded-md">+ Add New User</button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  className="w-full border px-3 py-2 rounded-md"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                >
                  <option value="staff-user">Staff – User</option>
                  <option value="staff-admin">Staff – Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button onClick={() => sendInvite()} disabled={sending}>
                {sending ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr className="text-left">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2">{user.name || '-'}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2 capitalize">{user.role.replace('-', ' ')}</td>
                  <td className="px-4 py-2">
                    {user.accepted ? (
                      <span className="text-green-600 font-medium">Accepted</span>
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {!user.accepted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendInvite(user.email, user.role as 'admin' | 'staff-admin' | 'staff-user')}
                        disabled={sendingInviteTo === user.email}
                        className="flex items-center gap-2"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        {sendingInviteTo === user.email ? 'Sending...' : 'Resend Invite'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}