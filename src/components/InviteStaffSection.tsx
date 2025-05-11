'use client'

import { useState, useEffect } from 'react'
import { sendStaffInviteAction } from '@/actions/sendStaffInviteAction'
import { resendInviteAction } from '@/actions/resendInviteAction'
import { revokeInviteAction } from '@/actions/revokeInviteAction'
import { toast } from 'sonner'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'

interface StaffUser {
  id: string
  email: string
  role: string
  account_id: string
  created_at: string
  invite_status?: string
  invite_sent_at?: string
}

export default function InviteStaffSection({ accountId }: { accountId: string }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff-user')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [team, setTeam] = useState<StaffUser[]>([])
  const session = useSession()
  const supabase = useSupabaseClient()

  const fetchTeam = async () => {
    const { data, error } = await supabase
      .from('invited_staff_view')
      .select('*')
      .eq('account_id', accountId)

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
      role,
      accountId,
      invitedBy: session.user.id,
    })

    if (result.success) {
      toast.success('Invitation sent successfully!')
      setEmail('')
      setRole('staff-user')
      fetchTeam()
    } else {
      toast.error(result.message || 'Failed to send invitation')
    }

    setLoading(false)
  }

  const handleResend = async (email: string) => {
    setResending(email)
    const result = await resendInviteAction({ email })
    if (result.success) {
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
    if (result.success) {
      toast.success('Invitation revoked!')
      fetchTeam()
    } else {
      toast.error(result.message || 'Failed to revoke')
    }
    setRevoking(null)
  }

  const renderRole = (role: string) => {
    return role === 'staff-admin' ? 'Admin' : 'User'
  }

  const renderStatus = (status: string | undefined) => {
    let color = 'bg-gray-100 text-gray-600 border border-gray-300'
    let label = 'Unknown'

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
        <select
          className="w-full border px-4 py-2 rounded text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="staff-user">Staff - User</option>
          <option value="staff-admin">Staff - Admin</option>
        </select>
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
                className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded"
              >
                <div>
                  <p className="font-medium text-sm">{member.email}</p>
                  <p className="text-xs text-gray-500">
                    {renderRole(member.role)} • Invited on {formatDate(member.invite_sent_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {renderStatus(member.invite_status)}

                  {['sent', 'accepted'].includes(member.invite_status?.toLowerCase() || '') && (
  <>
    <button
      onClick={() => handleResend(member.email)}
      disabled={resending === member.email}
      className="text-xs text-blue-700 border border-blue-300 px-3 py-1 rounded-full hover:bg-blue-50 transition"
    >
      {resending === member.email ? 'Resending...' : 'Resend'}
    </button>

    <button
      onClick={() => handleRevoke(member.email)}
      disabled={revoking === member.email}
      className="text-xs text-red-700 border border-red-300 px-3 py-1 rounded-full hover:bg-red-50 transition"
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
    </div>
  )
}
