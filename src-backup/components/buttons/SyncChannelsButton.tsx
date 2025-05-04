'use client'

import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

export function SyncChannelsButton({ accountId }: { accountId: string }) {
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLastSync() {
      try {
        const res = await fetch(`/api/last-sync?account_id=${accountId}&entity=channels`)
        const data = await res.json()
        if (data.success) setLastSync(data.last_synced_at)
      } catch {
        setLastSync(null)
      }
    }
    fetchLastSync()
  }, [accountId])

  const handleSync = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/sync-channels', {
        method: 'POST',
        body: JSON.stringify({ account_id: accountId })
      })
      const data = await res.json()
      if (data.success) {
        setMessage(`✅ ${data.upserted} channels synced`)
        setLastSync(new Date().toISOString())
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
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm bg-primary text-white hover:bg-primary/90"
      >
        <RotateCcw className={loading ? 'animate-spin' : ''} size={16} />
        {loading ? 'Syncing...' : 'Sync Channels'}
      </button>
      {lastSync && (
        <span className="text-xs text-gray-500">Last sync: {new Date(lastSync).toLocaleString()}</span>
      )}
      {message && <span className="text-sm">{message}</span>}
    </div>
  )
}