import { useEffect, useState } from 'react'
import { Loader2, Plus, RotateCw } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'

type Session = {
  session_id: string
  last_activity: string
  last_question: string
}

interface ChatHistoryListProps {
  userId: string
  currentSessionId: string
  onSelectSession: (sessionId: string) => void
  onNewSession: () => void
  onClose: () => void
}

export default function ChatHistoryList({
  userId,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onClose,
}: ChatHistoryListProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)
    try {
      const api = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
      const res = await fetch(`${api}/chat/sessions?user_id=${userId}`)
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setSessions(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError('Failed to load conversations')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return (
    <div className="flex-1 flex flex-col px-3 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Your conversations</h3>

      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : sessions.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No conversations found.</div>
      ) : (
        <ul className="flex-1 space-y-2 overflow-y-auto">
          {sessions.map((s) => (
            <li key={s.session_id}>
              <button
                className={`
                  w-full flex items-center gap-2 px-3 py-4 rounded-lg border
                  transition bg-white hover:bg-gray-100
                  ${s.session_id === currentSessionId ? 'border-primary bg-primary/10 text-sm font-semibold' : 'border-gray-200'}
                `}
                onClick={() => onSelectSession(s.session_id)}
              >
                <span className="flex-1 text-left truncate text-sm font-semibold">
                  {s.last_question
                    ? s.last_question.length > 40
                      ? s.last_question.slice(0, 40) + '...'
                      : s.last_question
                    : 'No question'}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {s.last_activity
                    ? (() => {
                        try {
                          return formatDistanceToNow(parseISO(s.last_activity), { addSuffix: true })
                        } catch {
                          return 'now'
                        }
                      })()
                    : 'now'}
                </span>
                {s.session_id === currentSessionId && (
                  <span className="ml-1 inline-block bg-primary text-white text-[10px] px-2 rounded-full">
                    current
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        className="mt-4 text-xs text-gray-500 hover:text-primary flex items-center gap-1 justify-center"
        onClick={onClose}
      >
        <RotateCw className="w-3 h-3" /> Back to chat
      </button>
    </div>
  )
}