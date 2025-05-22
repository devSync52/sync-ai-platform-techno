"use client"

import { useRef, useState, useEffect } from 'react'
import { Loader2, Search } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  metadata?: {
    rows?: any[]
    usage?: any
  }
}

interface AIExpertChatProps {
  user_id: string
  account_id: string
  model?: 'gpt-4' | 'gpt-3.5-turbo'
}

export default function AIExpertChat({ user_id, account_id, model = 'gpt-3.5-turbo' }: AIExpertChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const supabase = useSupabaseClient()

  async function sendMessage() {
    if (!input.trim()) return
    const query = input
    setInput('')
    const newMessages = [...messages, { role: 'user' as const, content: query }]
    setMessages([...newMessages, { role: 'assistant', content: '...' }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, user_id, account_id, model })
      })

      const rawText = await res.text()
      let json = null
      try {
        json = JSON.parse(rawText)
      } catch {}

      const answer = json?.answer || rawText

      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: answer,
          metadata: json?.rows ? { rows: json.rows } : undefined
        }
        return updated
      })
    } catch (err) {
      console.error('[AIExpertChat] ❌ Error:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('ai_logs')
        .select('question, answer, metadata')
        .eq('user_id', user_id)
        .eq('account_id', account_id)
        .order('created_at', { ascending: true })
        .limit(10)

      if (error) {
        console.error('[AIExpertChat] ❌ Failed to fetch logs:', error.message)
        return
      }

      if (data) {
        const parsedMessages: Message[] = data.flatMap((log) => [
          { role: 'user', content: log.question },
          {
            role: 'assistant',
            content: log.answer,
            metadata:
              typeof log.metadata === 'string'
                ? JSON.parse(log.metadata)
                : log.metadata || {},
          }
        ])
        setMessages(parsedMessages)
        console.log('[AIExpertChat] 🧠 Logs restored:', parsedMessages)
      }
    }

    fetchLogs()
  }, [user_id, account_id])

  useEffect(() => {
    const el = chatRef.current
    if (el) requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }))
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Histórico e mensagens */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" ref={chatRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-lg px-4 py-2 text-sm whitespace-pre-wrap max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'}`}>
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
                    {msg.metadata.rows.map((row, ri) => (
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