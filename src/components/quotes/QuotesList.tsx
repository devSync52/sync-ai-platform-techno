'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import QuotePdfModal from '@/components/modals/QuotePDFModal'
import { Trash2 } from 'lucide-react'

export function QuotesList() {
  const supabase = useSupabase()
  const user = useCurrentUser()
  const router = useRouter()
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null)
  const [selectedQuoteWithAccount, setSelectedQuoteWithAccount] = useState<any | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [sendingQuoteId, setSendingQuoteId] = useState<string | null>(null)
  const [creatorEmails, setCreatorEmails] = useState<Record<string, string>>({})
  const [searchTerm, setSearchTerm] = useState('')

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    quoted: 'Quoted',
    converted: 'Converted',
    cancelled: 'Cancelled'
  };

  const getSellercloudStatusLabel = (quote: any) => {
    if (quote.sellercloud_status === 'success') {
      if (quote.sellercloud_order_id) {
        return `Sent to Sellercloud • Order #${quote.sellercloud_order_id}`;
      }
      return 'Sent to Sellercloud';
    }
    if (quote.sellercloud_status === 'error') {
      return 'Error sending to Sellercloud';
    }
    return 'Not sent to Sellercloud';
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user?.id || !user.account_id) return
  
      try {
        let query = supabase
          .from('saip_quote_drafts')
          .select('*')
          .eq('account_id', user.account_id)
          .order('created_at', { ascending: false })
  
        // By default, client sees all quotes for the account (no extra filter).
        // Staff-client can only see quotes they created.
        if (user.role === 'staff-client') {
          query = query.eq('user_id', user.id)
        }
  
        const { data, error } = await query
  
        if (error) {
          console.error('❌ Error fetching quotes:', error)
        } else {
          const quotesData = data || []
          setQuotes(quotesData)

          // Fetch creator emails for the quotes
          const userIds = Array.from(
            new Set(
              quotesData
                .map((q) => q.user_id)
                .filter((id: string | null | undefined) => !!id)
            )
          )

          if (userIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
              .from('users_minimal')
              .select('id, email')
              .in('id', userIds)

            if (usersError) {
              console.error('❌ Error fetching quote creators:', usersError)
            } else if (usersData) {
              const map: Record<string, string> = {}
              usersData.forEach((u: any) => {
                if (u.id && u.email) {
                  map[u.id] = u.email
                }
              })
              setCreatorEmails(map)
            }
          }
        }
      } finally {
        setLoading(false)
      }
    }
  
    fetchQuotes()
  }, [supabase, user?.id, user?.account_id, user?.role, user?.created_by_user_id])

  const handleOpenQuoteModal = async (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId)
    if (!quote) return

    const { data: account } = await supabase
      .from('accounts')
      .select('id, name, logo')
      .eq('id', quote.account_id)
      .single()

    const quoteWithAccount = {
      ...quote,
      account,
    }

    setSelectedQuoteId(quoteId)
    setSelectedQuoteWithAccount(quoteWithAccount)
    setIsOpen(true)
  }

  const handleSendToSellercloud = async (quoteId: string) => {
    try {
      setSendingQuoteId(quoteId)
      const res = await fetch('/api/quotes/sellercloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ draftId: quoteId }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        console.error('❌ Error sending quote to Sellercloud:', data)
        toast('Failed to send quote to Sellercloud', {
          description: data?.error || 'Please try again in a moment.',
        })
      } else {
        const sellercloudOrderId =
          data?.data?.sellercloudOrderId ??
          data?.sellercloudOrderId ??
          null

        // Persiste no banco; sem isso, após refresh o fetch volta com status antigo.
        const { error: persistError } = await supabase
          .from('saip_quote_drafts')
          .update({
            sellercloud_status: 'success',
            sellercloud_order_id: sellercloudOrderId,
          })
          .eq('id', quoteId)

        if (persistError) {
          console.error('❌ Error persisting Sellercloud status:', persistError)
          toast('Sent, but failed to save status', {
            description: 'The quote was sent, but the status could not be saved. Please refresh and try again.',
          })
        }

        // Atualiza a lista local para refletir o retorno da API
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === quoteId
              ? {
                  ...q,
                  sellercloud_status: 'success',
                  sellercloud_order_id: sellercloudOrderId,
                }
              : q
          )
        )

        toast('Quote sent to Sellercloud', {
          description: sellercloudOrderId
            ? `Sellercloud ID: ${sellercloudOrderId}`
            : 'The quote was successfully sent.',
        })
      }
    } catch (error) {
      console.error('❌ Unexpected error sending quote to Sellercloud:', error)
      toast('Unexpected error', {
        description: 'There was a problem sending the quote. Please try again.',
      })
    } finally {
      setSendingQuoteId(null)
    }
  }

  const filteredQuotes = quotes.filter((quote) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const pieces: string[] = []
    pieces.push(dayjs(quote.created_at).format('YYYY-MM-DD'))
    if (quote.ship_to?.full_name) pieces.push(String(quote.ship_to.full_name))
    if (quote.ship_to?.email) pieces.push(String(quote.ship_to.email))
    if (quote.ship_from?.address?.city) pieces.push(String(quote.ship_from.address.city))
    if (quote.ship_from?.address?.state) pieces.push(String(quote.ship_from.address.state))
    if (quote.ship_to?.city) pieces.push(String(quote.ship_to.city))
    if (quote.ship_to?.state) pieces.push(String(quote.ship_to.state))
    if (creatorEmails[quote.user_id]) pieces.push(String(creatorEmails[quote.user_id]))
    if (quote.status) pieces.push(String(quote.status))
    const haystack = pieces.join(' ').toLowerCase()
    return haystack.includes(term)
  })

  if (loading) return <p>Loading quotes...</p>

  return (
    <div className="border rounded-lg p-6 space-y-6 bg-white shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold">Quotes</h2>
        <input
          type="text"
          placeholder="Search quotes..."
          className="w-full sm:w-64 border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredQuotes.length === 0 ? (
        <p className="text-sm text-gray-500">No quotes found.</p>
      ) : (
        <ul className="space-y-2">
          {filteredQuotes.map((quote) => (
            <li
              key={quote.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] sm:items-center bg-gray-50 px-4 py-3 rounded gap-y-2 gap-x-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-sm break-words">
                      <span>{dayjs(quote.created_at).format('YYYY-MM-DD')}</span>
                    </p>
                    <p className="font-medium text-base break-words">
                      #{quote.ship_to?.full_name || 'Unnamed'} • {quote.ship_to?.email || 'No email'}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>
                        Route: {quote.ship_from?.address?.city || 'N/A'},{' '}
                        {quote.ship_from?.address?.state || 'N/A'} → {quote.ship_to?.city || 'N/A'},{' '}
                        {quote.ship_to?.state || 'N/A'}
                      </span>
                      <span>Items: {quote.items?.length || 0}</span>
                      {user?.role === 'client' && creatorEmails[quote.user_id] && (
                        <div className="w-full text-xs mt-1">
                          <span className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            Created by {creatorEmails[quote.user_id]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-white px-2 py-1 rounded-full font-medium whitespace-nowrap"
                    style={{
                      backgroundColor:
                        quote.status === 'quoted'
                          ? '#3B82F6' // blue
                          : quote.status === 'converted'
                          ? '#10B981' // green
                          : quote.status === 'cancelled'
                          ? '#EF4444' // red
                          : '#FBBF24' // yellow for draft or fallback
                    }}
                  >
                    {statusLabels[String(quote.status).toLowerCase()] || 'Unknown'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
                {quote.sellercloud_status === 'success' ? (
                  <>
                    <div className="px-3 py-1 rounded-full bg-green-600 text-white text-xs font-medium shadow-sm">
                      Sent to SynC
                    </div>
                    <Button
                      variant="outline"
                      className="bg-white"
                      size="sm"
                      title="Export this quote as PDF"
                      onClick={() => handleOpenQuoteModal(quote.id)}
                    >
                      View PDF
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" onClick={() => router.push(`/orders/quotes/${quote.id}`)}>
                      View / Edit Quote
                    </Button>
                    <Button
                      variant="outline"
                      className="bg-white"
                      size="sm"
                      title="Export this quote as PDF"
                      onClick={() => handleOpenQuoteModal(quote.id)}
                    >
                      View PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={sendingQuoteId === quote.id}
                      onClick={() => handleSendToSellercloud(quote.id)}
                    >
                      {sendingQuoteId === quote.id ? 'Sending…' : 'Send to SynC (OMS)'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete Quote"
                      onClick={async () => {
                        const confirmDelete = confirm('Are you sure you want to delete this quote?')
                        if (!confirmDelete) return
                        const { error } = await supabase.from('saip_quote_drafts').delete().eq('id', quote.id)
                        if (error) {
                          console.error('❌ Error deleting quote:', error)
                        } else {
                          setQuotes(prev => prev.filter(q => q.id !== quote.id))
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {selectedQuoteWithAccount && (
       <QuotePdfModal
         open={isOpen}
         onCloseAction={() => setIsOpen(false)}
         quote={selectedQuoteWithAccount}
         items={selectedQuoteWithAccount.items || []}
         shipFrom={selectedQuoteWithAccount.ship_from || {}}
         shipTo={selectedQuoteWithAccount.ship_to || {}}
       />
      )}
    </div>
  )
}