import { RotateCw } from 'lucide-react'
import moment from 'moment-timezone'

type Session = {
  session_id: string
  last_activity: string
  last_question: string
}

interface ChatHistoryListProps {
  currentSessionId: string
  onSelectSession: (sessionId: string) => void
  onClose: () => void
  sessions: Session[]
}

export default function ChatHistoryList({ currentSessionId, onSelectSession, onClose, sessions }: ChatHistoryListProps) {
  return (
    <div className="flex-1 flex flex-col px-3 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Your conversations</h3>
      </div>
      {
        sessions.length > 0 ? (
          <ul className="flex-1 space-y-2 overflow-y-auto">
            {
              sessions.map((s) => (
                <li key={s.session_id}>
                  <button className={`w-full flex items-center gap-2 px-3 py-4 rounded-lg border transition bg-white hover:bg-gray-100  ${s.session_id == currentSessionId ? 'border-primary bg-primary/10 text-sm font-semibold' : 'border-gray-200'}`} onClick={() => onSelectSession(s.session_id)}>
                    <span className="flex-1 text-left truncate text-sm font-semibold">
                      {s.last_question ? s.last_question.length > 40 ? s.last_question.slice(0, 40) + '...' : s.last_question : 'No question'}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {s.last_activity ? moment(s.last_activity).fromNow() : 'now'}
                    </span>
                    {
                      s.session_id == currentSessionId && (
                        <span className="ml-1 inline-block bg-primary text-white text-[10px] px-2 rounded-full">
                          current
                        </span>
                      )
                    }
                  </button>
                </li>
              ))
            }
          </ul>
        ) : (
          <div className="text-gray-400 text-center py-8">
            No conversations found.
          </div>
        )
      }
      <button className="mt-4 text-xs text-gray-500 hover:text-primary flex items-center gap-1 justify-center" onClick={onClose}>
        <RotateCw className="w-3 h-3" /> Back to chat
      </button>
    </div>
  )
}