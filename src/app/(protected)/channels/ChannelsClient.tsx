'use client'

import { useState, useEffect } from 'react'
import { Channel, ChannelMarketplace } from '@/types/supabase2'
import { sendInviteAction } from '@/actions/sendInvite'
import { resendInviteAction } from '@/actions/resendInvite'
import { toast } from 'sonner'
import Table from '@/components/ui/table'
import { useSupabase } from '@/components/supabase-provider'

interface InvitationSimple {
  id: string
  channel_id: string
  email: string
  token: string
  status: string
  created_at?: string
  source: string
}

interface ChannelsClientProps {
  accountId: string
  channels: Channel[]
  marketplaces: ChannelMarketplace[]
  invitations: InvitationSimple[]
}

const sourceOptions = [
  { value: '', label: 'All sources' },
  { value: 'sellercloud', label: 'Sellercloud' },
  { value: 'extensiv', label: 'Extensiv' }
]

export default function ChannelsClient({
  accountId,
  channels,
  marketplaces,
  invitations: initialInvitations,
}: ChannelsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>(channels)
  const [loading, setLoading] = useState(false)
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteChannelId, setInviteChannelId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<InvitationSimple[]>(initialInvitations || [])

  const [markupModalOpen, setMarkupModalOpen] = useState(false)
  const [selectedChannelForMarkup, setSelectedChannelForMarkup] = useState<Channel | null>(null)
  const [markupValue, setMarkupValue] = useState('')
  const [savingMarkup, setSavingMarkup] = useState(false)
  const [markupAccountId, setMarkupAccountId] = useState<string | null>(null)

  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)

  const supabase = useSupabase()

  useEffect(() => {
    setLoading(true)
    const timeout = setTimeout(() => {
      const term = searchTerm.toLowerCase()
      const filtered = channels.filter((channel) => {
        const matchesTerm =
          channel.name.toLowerCase().includes(term) ||
          (channel.email?.toLowerCase().includes(term) ?? false)
        const matchesSource =
          !sourceFilter || channel.source === sourceFilter
        return matchesTerm && matchesSource
      })
      setFilteredChannels(filtered)
      setCurrentPage(1)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchTerm, channels, sourceFilter])

  const findInvitation = (channelId: string) => {
    return invitations?.find((inv) => inv.channel_id === channelId) || null
  }

  const findInvitationStatus = (channelId: string) => {
    const invitation = findInvitation(channelId)
    if (!invitation) return 'No Invite'
    if (invitation.status === 'accepted') return 'Accepted'
    // Nova verificação: se o usuário já fez login, considerar aceito
    if (invitation.status === 'pending' && invitation.token === null) return 'Accepted'
    return invitation.status
  }

  const renderInvitationStatus = (status: string) => {
    let color = 'text-gray-500 border-gray-300'
    if (status.toLowerCase() === 'pending') color = 'text-yellow-600 border-yellow-400'
    else if (status.toLowerCase() === 'accepted') color = 'text-green-600 border-green-400'
    else if (status.toLowerCase() === 'expired') color = 'text-red-600 border-red-400'

    return (
      <span className={`inline-block px-3 py-1 text-xs font-semibold bg-white border rounded-full ${color}`}>
        {status}
      </span>
    )
  }

  const renderSourceTag = (source?: string | null) => {
    if (!source) return null
    let color = 'bg-gray-200 text-gray-700 border-gray-300'
    if (source === 'sellercloud') color = 'bg-blue-500 text-white py-1'
    else if (source === 'extensiv') color = 'bg-purple-600 text-white py-1'
    return (
      <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded ${color}`}>
        {source.charAt(0).toUpperCase() + source.slice(1)}
      </span>
    )
  }

  const openInviteModal = (channel: Channel) => {
    setInviteEmail(channel.email || '')
    setInviteChannelId(channel.id)
    setInviteModalOpen(true)
  }

  const openMarkupModal = async (channel: Channel) => {
    setSelectedChannelForMarkup(channel)
    setMarkupValue('')
    setMarkupAccountId(null)
    setMarkupModalOpen(true)

    // Resolve the account for this channel:
    // we look for a child account whose parent_account_id = current accountId
    // and whose name matches the channel name.
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, shipping_markup_percent')
        .eq('parent_account_id', accountId)
        .eq('name', channel.name)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching account for channel markup:', error)
        return
      }

      if (!data || data.length === 0) {
        console.warn(
          'No child account found for channel. Expected accounts.parent_account_id = accountId and accounts.name = channel.name',
          { accountId, channelName: channel.name },
        )
        return
      }

      const acc = data[0]
      console.log('Resolved account for channel markup:', {
        accountId: acc.id,
        shipping_markup_percent: acc.shipping_markup_percent,
      })
      setMarkupAccountId(acc.id)

      if (acc.shipping_markup_percent != null) {
        setMarkupValue(String(acc.shipping_markup_percent))
      }
    } catch (err) {
      console.error('Unexpected error fetching account for channel markup:', err)
    }
  }

  const handleSaveMarkup = async () => {
    if (!selectedChannelForMarkup) return

    const accountIdForMarkup = markupAccountId

    if (!accountIdForMarkup) {
      toast.error('This channel is not linked to a child account for markup.')
      console.warn(
        'No markupAccountId resolved for selected channel. Not updating any account for markup:',
        selectedChannelForMarkup,
      )
      return
    }

    const raw = markupValue.replace(',', '.')
    const percent = Number(raw)
    if (Number.isNaN(percent) || percent < 0) {
      toast.error('Please enter a valid percentage (0 or greater).')
      return
    }

    try {
      setSavingMarkup(true)
      const { error } = await supabase
        .from('accounts')
        .update({ shipping_markup_percent: percent })
        .eq('id', accountIdForMarkup)

      if (error) {
        console.error('Error updating shipping markup:', error)
        toast.error('Failed to update shipping markup.')
      } else {
        toast.success('Shipping markup updated successfully.')
        setMarkupModalOpen(false)
        setSelectedChannelForMarkup(null)
        setMarkupValue('')
        setMarkupAccountId(null)
      }
    } catch (err) {
      console.error('Unexpected error updating shipping markup:', err)
      toast.error('Unexpected error updating shipping markup.')
    } finally {
      setSavingMarkup(false)
    }
  }

  const sendInvite = async () => {
    if (!inviteChannelId || !inviteEmail) return
    setSendingId(inviteChannelId)
    const result = await sendInviteAction({ channelId: inviteChannelId, email: inviteEmail })

    if (result.success) {
      setInvitations((prev) => [...prev, result.invitation])
      toast.success('Invitation sent successfully!')
    } else {
      toast.error(result.message)
    }

    setInviteModalOpen(false)
    setSendingId(null)
  }

  const handleResendInvite = async (channelId: string) => {
    setResendingId(channelId)
    const result = await resendInviteAction({ channelId })

    if (result.success) toast.success('Invite resent successfully!')
    else toast.error(result.message)

    setResendingId(null)
  }

  const handleRevokeInvite = async (channelId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) return

    const result = await fetch('/api/invitations/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    })

    const data = await result.json()
    if (data.success) {
      toast.success('Invite revoked')
      setInvitations(prev => prev.filter(inv => inv.channel_id !== channelId))
    } else {
      toast.error(data.message || 'Failed to revoke invite')
    }
  }

  const paginatedChannels = filteredChannels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )
  const totalPages = Math.ceil(filteredChannels.length / itemsPerPage)

  return (
    <div className="p-6">
      <h1 className="text-xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6">Customers</h1>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-primary/30 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm w-full max-w-xs"
        >
          {sourceOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Filtering channels...</div>
      ) : (
        <>
          <Table>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Name</th>
                <th className="p-3 text-left text-sm font-semibold">Source</th>
                <th className="p-3 text-left text-sm font-semibold">Email</th>
                <th className="p-3 text-left text-sm font-semibold">Country</th>
                <th className="p-3 text-left text-sm font-semibold">City</th>
                <th className="p-3 text-left text-sm font-semibold">Invite Status</th>
                <th className="p-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedChannels.length > 0 ? (
                paginatedChannels.map((channel) => {
                  const status = findInvitationStatus(channel.id)

                  return (
                    <tr key={channel.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500 text-sm uppercase">{channel.name}</td>
                      <td className="py-3 px-4">{renderSourceTag(channel.source)}</td>
                      <td className="py-3 px-4 text-gray-500">{channel.email ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{channel.country ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{channel.city ?? '-'}</td>
                      <td className="p-3 text-sm">{renderInvitationStatus(status)}</td>
                      <td className="p-3 text-center align-top">
                        <div className="flex flex-col items-center gap-1">
                          {['pending', 'accepted'].includes(status.toLowerCase()) ? (
                            <>
                              {status.toLowerCase() === 'pending' && (
                                <button
                                  onClick={() => handleResendInvite(channel.id)}
                                  className="w-full px-3 py-2 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                                  disabled={resendingId === channel.id}
                                >
                                  {resendingId === channel.id ? 'Resending...' : 'Resend Invite'}
                                </button>
                              )}
                              <button
                                onClick={() => handleRevokeInvite(channel.id)}
                                className="w-full px-3 py-2 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                              >
                                Revoke
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openInviteModal(channel)}
                              className="w-full px-3 py-2 bg-[#3f2d90] hover:bg-[#3f2d90]/90 text-white text-xs rounded"
                            >
                              Send Invite
                            </button>
                          )}

                          <button
                            onClick={() => openMarkupModal(channel)}
                            className="w-full px-3 py-2 border border-[#3f2d90] text-[#3f2d90] text-xs rounded hover:bg-[#3f2d90]/5"
                          >
                            Edit
                          </button>

                          {/* Mostrar email do convite se existir */}
                          {findInvitation(channel.id)?.email && (
                            <div className="mt-2 text-[11px] text-gray-500 italic max-w-[150px] break-words">
                              Sent to: {findInvitation(channel.id)?.email}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">
                    No channels found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <span className="text-gray-700 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {markupModalOpen && selectedChannelForMarkup && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              Shipping markup for {selectedChannelForMarkup.name}
            </h2>
            <label className="block text-sm font-medium mb-1">
              Markup percentage (%)
            </label>
            <input
              key={selectedChannelForMarkup?.id || 'markup-input'}
              type="number"
              min={0}
              step="0.01"
              className="w-full border px-4 py-3 rounded mb-2 text-sm"
              value={markupValue}
              onChange={(e) => setMarkupValue(e.target.value)}
              placeholder="e.g. 15 for 15%"
            />
            <p className="text-[11px] text-gray-500 mb-4">
              This percentage will be applied on top of the carrier rate when showing quotes for this customer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setMarkupModalOpen(false)
                  setSelectedChannelForMarkup(null)
                  setMarkupValue('')
                  setMarkupAccountId(null)
                }}
                className="px-4 py-3 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMarkup}
                className={`px-4 py-3 rounded text-sm ${
                  savingMarkup
                    ? 'bg-[#3f2d90]/60 text-white cursor-not-allowed'
                    : 'bg-[#3f2d90] text-white hover:bg-[#3f2d90]/90'
                }`}
                disabled={savingMarkup}
              >
                {savingMarkup ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" aria-modal="true" role="dialog">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Invite Channel</h2>
            <input
              type="email"
              className="w-full border px-4 py-3 rounded mb-4 text-sm"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-3 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={sendInvite}
                className={`px-4 py-3 rounded text-sm ${
                  sendingId ? 'bg-green-400 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                disabled={!!sendingId}
              >
                {sendingId ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}