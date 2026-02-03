'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Loader2 } from 'lucide-react'

interface HistoryItem {
  id: string
  question: string
  answer: string
  created_at: string
}

interface ChatHistoryProps {
  user_id: string
  account_id: string
}

export default function ChatHistory({ user_id, account_id }: ChatHistoryProps) {
  const supabase = useSupabaseClient()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      const { data, error } = await supabase
        .from('ai_logs')
        .select('id, question, answer, created_at')
        .eq('account_id', account_id)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error) setHistory(data as HistoryItem[])
      setLoading(false)
    }

    fetchHistory()
  }, [user_id, account_id])

  const filtered = keyword.trim()
    ? history.filter(h =>
        h.question.toLowerCase().includes(keyword.toLowerCase()) ||
        h.answer.toLowerCase().includes(keyword.toLowerCase())
      )
    : history

  return (
    <div className="p-4 border-t bg-gray-50">
      <input
        type="text"
        className="w-full mb-2 border px-3 py-2 rounded text-sm"
        placeholder="Search previous questions..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="animate-spin w-5 h-5 text-gray-500" />
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {filtered.map((item) => (
            <div key={item.id} className="text-sm border rounded p-3 bg-white">
              <p className="font-semibold text-gray-800 mb-1">{item.question}</p>
              <p className="text-gray-600 line-clamp-3 whitespace-pre-wrap">{item.answer}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          ))}

          {filtered.length === 0 && <p className="text-gray-500 text-sm">No results found.</p>}
        </div>
      )}
    </div>
  )
}