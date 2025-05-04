'use client'

import { useState, useEffect, useTransition } from 'react'
import { Channel, ChannelMarketplace } from '@/types/supabase'
import { sendInviteAction } from '@/actions/sendInvite'
import { resendInviteAction } from '@/actions/resendInvite'
import ChannelDetailsModal from '@/components/modals/ChannelDetailsModal'
import { Tooltip } from 'react-tooltip'
import { toast } from 'sonner'
import Table from '@/components/ui/table'
import { SyncChannelsButton } from '@/components/buttons/SyncChannelsButton'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'

type InvitationSimple = {
  id: string
  channel_id: string
  email: string
  token: string
  status: string
  created_at?: string
}

interface ChannelsClientProps {
  channels: Channel[]
  marketplaces: ChannelMarketplace[]
  invitations: InvitationSimple[]
}

export default function ChannelsClient({ channels, marketplaces, invitations: initialInvitations }: ChannelsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>(channels)
  const [loading, setLoading] = useState(false)

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteChannelId, setInviteChannelId] = useState<string | null>(null)

  const [sendingId, setSendingId] = useState<string | null>(null)
  const [resendingId, setResendingId] = useState<string | null>(null)

  const [invitations, setInvitations] = useState<InvitationSimple[]>(initialInvitations || [])

  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)
  const [accountId, setAccountId] = useState<string | null>(null)
  const supabase = useSupabaseClient()
  const session = useSession()

  const handleOpenModal = (channel: Channel) => {
    setSelectedChannel(channel)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedChannel(null)
  }

  useEffect(() => {
    setLoading(true)

    const timeout = setTimeout(() => {
      const term = searchTerm.toLowerCase()

      const filtered = channels.filter((channel) =>
        channel.name.toLowerCase().includes(term) ||
        (channel.email?.toLowerCase().includes(term) ?? false)
      )

      setFilteredChannels(filtered)
      setCurrentPage(1)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchTerm, channels])

  useEffect(() => {
    if (!session) return;
  
    async function fetchAccountId() {
      const { data, error } = await supabase
        .from('accounts')
        .select('id')
        .eq('created_by_user_id', session?.user?.id || '')
        .maybeSingle();
  
      if (data?.id) setAccountId(data.id);
    }
  
    fetchAccountId();
  }, [session]);

  const resolveMarketplaceLogo = (name: string) => {
    const normalized = name.toLowerCase()
    if (normalized.includes('amazon')) return 'amazon'
    if (normalized.includes('wayfair')) return 'wayfair'
    if (normalized.includes('walmart')) return 'walmart'
    if (normalized.includes('ebay')) return 'ebay'
    return 'generic'
  }

  const findInvitationStatus = (channelId: string) => {
    const invitation = invitations?.find((inv) => inv.channel_id === channelId)
    return invitation?.status || 'No Invite'
  }

  const renderInvitationStatus = (status: string) => {
    let color = 'text-gray-500 border-gray-300'

    if (status.toLowerCase() === 'pending') {
      color = 'text-yellow-600 border-yellow-400'
    } else if (status.toLowerCase() === 'accepted') {
      color = 'text-green-600 border-green-400'
    } else if (status.toLowerCase() === 'expired') {
      color = 'text-red-600 border-red-400'
    }

    return (
      <span className={`inline-block px-3 py-1 text-xs font-semibold bg-white border rounded-full ${color}`}>
        {status}
      </span>
    )
  }

  const openInviteModal = (channel: Channel) => {
    setInviteEmail(channel.email || '')
    setInviteChannelId(channel.id)
    setInviteModalOpen(true)
  }

  const sendInvite = async () => {
    if (!inviteChannelId || !inviteEmail) return

    setSendingId(inviteChannelId)

    const result = await sendInviteAction({
      channelId: inviteChannelId,
      email: inviteEmail,
    })

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

    if (result.success) {
      toast.success('Invite resent successfully!')
    } else {
      toast.error(result.message)
    }

    setResendingId(null)
  }

  const paginatedChannels = filteredChannels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredChannels.length / itemsPerPage)

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-primary mb-6">Channels</h1>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <input
    type="text"
    placeholder="Search by name or email..."
    className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-400 text-sm"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  {accountId && <SyncChannelsButton accountId={accountId} />}
</div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Filtering channels...</div>
      ) : (
        <>
          <Table>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Name</th>
                <th className="p-3 text-left text-sm font-semibold">Email</th>
                <th className="p-3 text-left text-sm font-semibold">City</th>
                <th className="p-3 text-left text-sm font-semibold">Marketplaces</th>
                <th className="p-3 text-left text-sm font-semibold">Invite Status</th>
                <th className="p-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedChannels.length > 0 ? (
                paginatedChannels.map((channel) => {
                  const channelMarketplaces = (marketplaces || []).filter(
                    (marketplace) => marketplace.channel_id === channel.id
                  )

                  const status = findInvitationStatus(channel.id)

                  return (
                    <tr key={channel.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">{channel.name}</td>
                      <td className="py-3 px-4 text-gray-500">{channel.email ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{channel.city ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-500">
                        <div className="flex items-center gap-2">
                          {channelMarketplaces.length > 0 ? (
                            channelMarketplaces.map((mkt) => (
                              <div key={mkt.id}>
                                <img
                                  src={`/logos/${resolveMarketplaceLogo(mkt.marketplace_name)}.png`}
                                  alt={mkt.marketplace_name}
                                  data-tooltip-id={`tooltip-${mkt.id}`}
                                  data-tooltip-content={mkt.marketplace_name}
                                  className="h-6 w-6 object-contain rounded cursor-pointer"
                                />
                                <Tooltip id={`tooltip-${mkt.id}`} place="top" />
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No marketplace</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm">{renderInvitationStatus(status)}</td>
                      <td className="p-3 text-center space-x-2">
                        {status === 'pending' ? (
                          <button
                            onClick={() => handleResendInvite(channel.id)}
                            className="min-w-[110px] px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                            disabled={resendingId === channel.id}
                          >
                            {resendingId === channel.id ? 'Resending...' : 'Resend Invite'}
                          </button>
                        ) : (
                          <button
                            onClick={() => openInviteModal(channel)}
                            className="min-w-[110px] px-3 py-1 bg-[#3f2d90] hover:bg-[#3f2d90]/90 text-white text-xs rounded"
                          >
                            Send Invite
                          </button>
                        )}
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

          {/* Pagination */}
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

      {/* Modal View Details */}
      <ChannelDetailsModal
        channel={selectedChannel}
        open={isModalOpen}
        onClose={handleCloseModal}
        marketplaces={marketplaces}
      />

      {/* Modal Send Invite */}
      {inviteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Send Invite</h2>
            <input
              type="email"
              className="w-full border px-4 py-2 rounded mb-4 text-sm"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email address"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setInviteModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
              <button
  onClick={sendInvite}
  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
  disabled={sendingId !== null}
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