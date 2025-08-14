'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
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

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    quoted: 'Quoted',
    converted: 'Converted',
    cancelled: 'Cancelled'
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      if (!user?.account_id) return

      const { data, error } = await supabase
        .from('saip_quote_drafts')
        .select('*')
        .eq('account_id', user.account_id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching quotes:', error)
      } else {
        setQuotes(data || [])
      }

      setLoading(false)
    }

    fetchQuotes()
  }, [supabase, user?.account_id])

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

  if (loading) return <p>Loading quotes...</p>

  return (
    <div className="border rounded-lg p-6 space-y-6 bg-white shadow">
      <h2 className="text-lg font-semibold">Quotes</h2>

      {quotes.length === 0 ? (
        <p className="text-sm text-gray-500">No quotes found.</p>
      ) : (
        <ul className="space-y-2">
          {quotes.map((quote) => (
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
                        Route: {quote.ship_from?.address?.city || 'N/A'}, {quote.ship_from?.address?.state || 'N/A'} → {quote.ship_to?.city || 'N/A'}, {quote.ship_to?.state || 'N/A'}
                      </span>
                      <span>Items: {quote.items?.length || 0}</span>
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