'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

export function SyncProductsButton({
  channelId,
  source,
}: {
  channelId: string
  source: string
}) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/sync-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId, source }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage(`✅ ${data.upserted} products imported.`)
      } else {
        setMessage(`❌ ${data.error || 'Failed to sync.'}`)
      }
    } catch {
      setMessage('❌ Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSync}
        disabled={loading || !channelId}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm text-white bg-[#3f2d90] hover:bg-[#3f2d90]/90"
      >
        <RotateCcw className={loading ? 'animate-spin' : ''} size={16} />
        {loading ? 'Importing...' : 'Import Products'}
      </button>
      {message && <span className="text-sm">{message}</span>}
    </div>
  )
}