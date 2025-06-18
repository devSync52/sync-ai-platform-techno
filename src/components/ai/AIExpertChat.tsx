import { useState, useEffect, useRef } from 'react'
import { useSyncAgent, ChatMessage } from '@/hooks/useSyncAgent'
import { Loader2, Clipboard, ClipboardCheck } from 'lucide-react'
import { QuickPrompts } from './QuickPrompts'
import { ChatChart } from './charts/chatChart'

interface AIExpertChatProps {
  user_id: string
  account_id: string
  user_type: 'owner' | 'client' | 'end_client'
  session_id: string
  apiUrl: string
}

function BotMessageWithCopy({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }
  return (
    <div className="relative group flex items-center">
      <div className="rounded-lg px-4 py-2 text-sm whitespace-pre-wrap max-w-[85%] bg-gray-100 text-gray-900">
        {content}
      </div>
      <button
        onClick={handleCopy}
        className="ml-2 p-1 opacity-60 hover:opacity-100 transition"
        title="Copy answer"
      >
        {copied ? (
          <ClipboardCheck className="w-4 h-4 text-green-600" />
        ) : (
          <Clipboard className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

export default function AIExpertChat({
  user_id,
  account_id,
  user_type,
  session_id,
  apiUrl,
}: AIExpertChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const {
    askQuestion,
    loading,
    thinking,
    partialResponse,
    getHistory,
  } = useSyncAgent(apiUrl)
  const chatRef = useRef<HTMLDivElement>(null)

  const handleQuickPrompt = (prompt: string) => setInput(prompt)

  useEffect(() => {
    if (session_id) {
      getHistory(session_id).then(setMessages)
    }
  }, [session_id, getHistory])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, partialResponse])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    setMessages((msgs) => [...msgs, userMsg])
    setInput('')

    let aiMessage = ''
    await askQuestion(
      input,
      {
        userId: user_id,
        accountId: account_id,
        sessionId: session_id,
        userType: user_type,
      },
      (partial) => {
        aiMessage = partial
      }
    )
    setMessages((msgs) => [
      ...msgs,
      { role: 'assistant', content: aiMessage },
    ])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Histórico */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" ref={chatRef}>
      {messages.map((msg, i) => (
  <div
    key={i}
    className={`flex flex-col ${
      msg.role === 'user' ? 'items-end' : 'items-start'
    }`}
  >
    {msg.role === 'assistant' ? (
      <>
        {msg.metadata?.type === 'chart' ? (
          <ChatChart metadata={msg.metadata} />
        ) : (
          <BotMessageWithCopy content={msg.content} />
        )}
      </>
    ) : (
      <div className="rounded-lg px-4 py-2 text-sm whitespace-pre-wrap max-w-[85%] bg-primary text-white">
        {msg.content}
      </div>
    )}
  </div>
))}

        {/* Thinking... */}
        {thinking && !partialResponse && (
          <div className="flex flex-col items-start">
            <div className="rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-900 max-w-[85%] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking…</span>
            </div>
          </div>
        )}

        {/* Streaming */}
        {thinking && partialResponse && (
          <div className="flex flex-col items-start">
            <div className="rounded-lg px-4 py-2 text-sm bg-gray-100 text-gray-900 max-w-[85%] flex items-center gap-2">
              <span>{partialResponse}</span>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <QuickPrompts onPrompt={handleQuickPrompt} />

      {/* Campo de entrada */}
      <div className="border-t p-4 flex items-center gap-2">
        <input
          className="flex-1 border px-3 py-2 rounded text-sm"
          placeholder="Ask your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
          disabled={loading}
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