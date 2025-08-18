'use client'

import { useState, useEffect } from 'react'
import { sendStaffInviteAction } from '@/actions/sendStaffInviteAction'
import { resendInviteAction } from '@/actions/resendInviteAction'
import { revokeInviteAction } from '@/actions/revokeInviteAction'
import { updateUserRoleAction } from '@/actions/updateUserRoleAction'
import { toast } from 'sonner'
import { useSession, useSupabase } from '@/components/supabase-provider'

interface StaffUser {
  id: string
  email: string
  role: string
  account_id: string
  created_at: string
  invite_status?: string
  invite_sent_at?: string
  has_logged_in?: boolean
  last_login_at?: string | null
}

export function InviteStaffSection({ accountId }: { accountId: string }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff-user')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [team, setTeam] = useState<StaffUser[]>([])
  const session = useSession()
  const supabase = useSupabase()

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<StaffUser | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    console.log('[Session Claims]', {
      id: session?.user?.id,
      role: session?.user?.role,
      app_metadata: session?.user?.app_metadata,
      user_metadata: session?.user?.user_metadata
    })
    const fetchCurrentUserRole = async () => {
      if (!session?.user?.id) return
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()
      if (data?.role) {
        setCurrentUserRole(data.role)
        if (data?.role === 'client') {
          setRole('staff-client')
        }
      }
    }

    fetchCurrentUserRole()
  }, [session?.user?.id])

  const fetchTeam = async () => {
    const { data, error } = await supabase
      .from('invited_staff_view_v3')
      .select('*', { head: false, count: 'exact' })
      .eq('account_id', accountId)
      .abortSignal(new AbortController().signal)
    
    if (!error) setTeam(data || [])
  }

  useEffect(() => {
    fetchTeam()
  }, [accountId])

  const handleInvite = async () => {
    if (!email || !role || !session?.user?.id || !accountId) {
      toast.error('Missing required fields.')
      return
    }

    setLoading(true)
    const result = await sendStaffInviteAction({
      email,
      role: role as 'staff-user' | 'staff-admin' | 'staff-client' | 'admin',
      accountId,
      invitedBy: session.user.id,
    })

    if (result?.success) {
      toast.success('Invitation sent successfully!')
      setEmail('')
      setRole(currentUserRole === 'client' ? 'staff-client' : 'staff-user')
      fetchTeam()
    } else {
      toast.error(result.message || 'Failed to send invitation')
    }

    setLoading(false)
  }

  const handleResend = async (email: string) => {
    setResending(email)
  
    const member = team.find((m) => m.email === email)
  
    if (!member || !session?.user?.id) {
      toast.error('Missing data to resend invitation.')
      setResending(null)
      return
    }
  
    const result = await sendStaffInviteAction({
      email,
      role: member.role as 'staff-user' | 'staff-admin' | 'staff-client' | 'admin',
      accountId,
      invitedBy: session.user.id,
    })
  
    if (result?.success) {
      toast.success('Invitation resent!')
      fetchTeam()
    } else {
      toast.error(result.message || 'Failed to resend')
    }
  
    setResending(null)
  }

  const handleRevoke = async (email: string) => {
    setRevoking(email)
    const result = await revokeInviteAction({ email })
    if (result?.success) {
      toast.success('Invitation revoked!')
      fetchTeam()
    } else {
      toast.error(result.message || 'Failed to revoke')
    }
    setRevoking(null)
  }

  const renderRole = (role: string) => {
    if (role === 'staff-admin') return 'Admin'
    if (role === 'staff-client') return 'Staff - Client'
    return 'User'
  }

  const renderStatus = (status: string | undefined) => {
    let color = 'bg-gray-100 text-gray-600 border border-gray-300'
    let label: React.ReactNode = 'Unknown'
    const normalized = status?.toLowerCase()
    if (normalized === 'accepted') {
      color = 'bg-green-100 text-green-700 border border-green-300'
      label = 'Accepted'
    } else if (normalized === 'expired') {
      color = 'bg-red-100 text-red-700 border border-red-300'
      label = 'Expired'
    } else if (normalized === 'revoked') {
      color = 'bg-gray-300 text-gray-700 border border-gray-400'
      label = 'Revoked'
    } else if (normalized === 'sent') {
      color = 'bg-yellow-100 text-yellow-700 border border-yellow-300'
      label = 'Pending'
    }
    return <span className={`text-xs px-3 py-1 rounded-full ${color}`}>{label}</span>
  }

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="border rounded-lg p-6 space-y-6 bg-white shadow">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Invite New Team Member</h2>
        <input
          type="email"
          placeholder="Email address"
          className="w-full border px-4 py-2 rounded text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {currentUserRole === 'client' ? (
          <select
            className="w-full border px-4 py-2 rounded text-sm"
            value="staff-client"
            disabled
          >
            <option value="staff-client">Staff - Client</option>
          </select>
        ) : (
          <select
            className="w-full border px-4 py-2 rounded text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="staff-user">Staff - User</option>
            <option value="staff-admin">Staff - Admin</option>
          </select>
        )}
        <button
          onClick={handleInvite}
          disabled={loading}
          className="px-4 py-2 bg-[#3f2d90] text-white rounded hover:bg-[#3f2d90]/90 text-sm"
        >
          {loading ? 'Sending...' : 'Send Invitation'}
        </button>
      </div>

      <div className="pt-6 border-t">
        <h3 className="text-md font-medium mb-4">Current Team</h3>
        {team.length === 0 ? (
          <p className="text-sm text-gray-500">No team members found.</p>
        ) : (
          <ul className="space-y-2">
            {team.map((member) => (
              <li
                key={member.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] sm:items-center bg-gray-50 px-4 py-3 rounded gap-y-2 gap-x-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-sm break-words">{member.email}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        
                        <span>Invited on {formatDate(member.invite_sent_at)}</span>
                      </div>
                    </div>
                    {member.last_login_at && (
                      <div className="text-xs text-gray-500 sm:text-right mt-1 sm:mt-0">
                        Last login: {new Date(member.last_login_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {renderStatus(member.invite_status)}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {['sent', 'accepted'].includes((member.invite_status || '').toLowerCase()) && (
                    <>
                      <button
                        onClick={() => handleResend(member.email)}
                        disabled={resending === member.email}
                        className="text-xs text-blue-700 border border-blue-300 px-3 py-1 rounded-full hover:bg-blue-50 transition whitespace-nowrap"
                      >
                        {resending === member.email ? 'Resending...' : 'Resend'}
                      </button>

                      <button
                        onClick={() => handleRevoke(member.email)}
                        disabled={revoking === member.email}
                        className="text-xs text-red-700 border border-red-300 px-3 py-1 rounded-full hover:bg-red-50 transition whitespace-nowrap"
                      >
                        {revoking === member.email ? 'Revoking...' : 'Revoke'}
                      </button>
                    </>
                  )}
                  
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && selectedMember && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg space-y-4">
            <h2 className="text-lg font-semibold">Edit Role</h2>
            <select
              className="w-full border px-4 py-2 rounded text-sm"
              value={selectedMember.role}
              onChange={async (e) => {
                const newRole = e.target.value
                console.log('[UpdateRole]', {
                  selectedMember,
                  accountId,
                  newRole
                })
                const { success, error } = await updateUserRoleAction({
                  userId: selectedMember.id,
                  newRole
                })

                console.log('[UpdateRole:result]', { success, error })

                if (success) {
                  toast.success('Role updated!')
                  fetchTeam()
                  setIsModalOpen(false)
                  setSelectedMember(null)
                } else {
                  toast.error('Failed to update role.')
                }
              }}
            >
              <option value="staff-user">Staff - User</option>
              <option value="staff-admin">Staff - Admin</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-sm text-gray-600 px-3 py-1 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}