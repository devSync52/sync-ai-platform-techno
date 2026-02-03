import { Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function ClearChatButton({ sessionId, onClear }: { sessionId: string, onClear: () => void }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const handleClear = async () => {
    if (!confirm) {
      setConfirm(true)
      setTimeout(() => setConfirm(false), 3500) // confirmação expira em 3.5s
      return
    }
    setLoading(true)
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/history?session_id=${sessionId}`, {
      method: 'DELETE',
    })
    setLoading(false)
    setConfirm(false)
    onClear()
  }

  return (
    <button
      onClick={handleClear}
      className={`
        flex items-center gap-1 px-3 py-1.5 text-sm
        ${confirm ? 'bg-red-600 text-white' : 'bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600'}
        border transition
      `}
      disabled={loading}
    >
      <Trash2 className="w-4 h-4" />
      {loading
        ? 'Clearing...'
        : confirm
          ? 'Click again to confirm'
          : 'Clear history'}
    </button>
  )
}
