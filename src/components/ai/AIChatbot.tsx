'use client'

import { useState } from 'react'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'

export default function AIChatbot() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = useSupabaseClient()
  const user = useUser()

  async function sendMessage() {
    if (!input.trim() || !user) return

    const query = input
    setInput('')
    const newMessages = [...messages, { role: 'user', content: query }]
    setMessages([...newMessages, { role: 'assistant', content: '' }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, user_id: user.id })
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      let fullMessage = ''

      if (!reader) throw new Error('No response stream received.')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullMessage += chunk

        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullMessage }
          return updated
        })
      }
    } catch (err) {
      console.error('[AIChatbot] ❌ Error streaming response:', err)
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {messages.map((msg, i) => (
  <div
    key={i}
    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
  >
    <div
      className={`inline-block max-w-[75%] text-xs p-2 rounded whitespace-pre-wrap leading-tight ${
        msg.role === 'user'
          ? 'bg-gray-30 text-right rounded-br-none'
          : 'bg-gray-100 text-left rounded-bl-none'
      }`}
    >
      {msg.content}
    </div>
  </div>
))}
      </div>

      {/* Formulário de envio */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!loading) sendMessage()
        }}
        className="border-t p-4"
      >
        <input
          className="w-full border p-3 rounded mb-2"
          placeholder="Ask about orders, stock..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}