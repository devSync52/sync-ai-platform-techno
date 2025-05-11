'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

export function SyncChannelsButton({ accountId }: { accountId: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/sync-customers', {
        method: 'POST',
        body: JSON.stringify({ account_id: accountId })
      })

      const data = await res.json()

      if (data.success) {
        setMessage(`✅ ${data.upserted} channels synced`)
      } else {
        setMessage(`❌ ${data.error || 'Sync failed'}`)
      }
    } catch {
      setMessage('❌ Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4 mt-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm text-white bg-[#3f2d90] hover:bg-[#3f2d90]/90"
      >
        <RotateCcw className={loading ? 'animate-spin' : ''} size={16} />
        {loading ? 'Syncing...' : 'Sync Customers'}
      </button>

      {message && <span className="text-sm">{message}</span>}
    </div>
  )
}