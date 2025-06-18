import { useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useSyncAgent } from '@/hooks/useSyncAgent'

export default function AIExpertChat({ accountId, sessionId, userType }: {
  accountId: string
  sessionId: string
  userType: string
}) {
  const chatRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const { askQuestion, response, loading } = useSyncAgent()

  const sendMessage = async () => {
    if (!input.trim()) return

    const newUserMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, newUserMessage])
    setInput('')

    await askQuestion(input, { accountId, sessionId, userType })
  }

  useEffect(() => {
    if (!loading && response) {
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    }
  }, [response, loading])

  return (
    <div className="flex flex-col h-full">
      {/* Histórico e mensagens */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" ref={chatRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`rounded-lg px-4 py-2 text-sm whitespace-pre-wrap max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
            {msg.metadata?.rows && msg.metadata.rows.length > 0 && (
              <div className="overflow-x-auto mt-2 w-full">
                <table className="text-sm border w-full">
                  <thead>
                    <tr>
                      {Object.keys(msg.metadata.rows[0]).map((key) => (
                        <th key={key} className="border px-2 py-1 bg-white text-left">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {msg.metadata.rows.map((row: any, ri: number) => (
                      <tr key={ri}>
                        {Object.entries(row).map(([key, val], ci) => (
                          <td key={ci} className="border px-2 py-1">
                            {typeof val === 'number' && ['total_amount', 'total_revenue', 'price', 'value', 'site_price'].some(k => key.toLowerCase().includes(k))
                              ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                              : val?.toLocaleString?.() || String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Campo de entrada */}
      <div className="border-t p-4 flex items-center gap-2">
        <button
          onClick={() => setSearchOpen((s) => !s)}
          className="text-gray-500 hover:text-gray-800"
        >
          <Search className="w-5 h-5" />
        </button>
        {searchOpen && (
          <input
            className="flex-1 border px-3 py-2 rounded text-sm"
            placeholder="Search in history... (not yet functional)"
          />
        )}
        <input
          className="flex-1 border px-3 py-2 rounded text-sm"
          placeholder="Ask your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
        />
        <button
          onClick={sendMessage}
          className="bg-primary text-white px-4 py-2 rounded text-sm"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Ask'}
        </button>
      </div>
    </div>
  )
}