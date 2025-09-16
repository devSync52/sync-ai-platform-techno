import { useState, useCallback } from 'react'

export interface ChatMetadata {
  type?: 'chart'
  title?: string
  labels?: string[]
  datasets?: { label: string; data: number[] }[]
  summary?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  metadata?: ChatMetadata
}

export interface AskOptions {
  userId: string
  accountId: string
  sessionId: string
  userType: 'owner' | 'client' | 'end_client'
}

export function useSyncAgent(apiUrl: string) {
  const [loading, setLoading] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [partialResponse, setPartialResponse] = useState<string | null>(null)

  const askQuestion = useCallback(
    async (
      question: string,
      options: AskOptions,
      onProgress?: (chunk: string) => void
    ): Promise<string | null> => {
      setLoading(true)
      setThinking(true)
      setPartialResponse('')
      try {
        const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || apiUrl).replace(/\/$/, '')
        const res = await fetch(`${apiBaseUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            account_id: options.accountId,
            session_id: options.sessionId,
            user_id: options.userId,
            user_type: options.userType,
          }),
        })
        if (!res.ok) throw new Error('API Error')

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No stream reader')

        let result = ''
        const decoder = new TextDecoder('utf-8')
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          result += chunk
          setPartialResponse(result)
          if (onProgress) onProgress(result)
        }
        setPartialResponse(null)
        return result
      } catch (err) {
        console.error('[useSyncAgent] askQuestion error:', err)
        setPartialResponse(null)
        return 'There was an error with the AI agent.'
      } finally {
        setThinking(false)
        setLoading(false)
      }
    },
    [apiUrl]
  )

  const getHistory = useCallback(
    async (sessionId: string): Promise<ChatMessage[]> => {
      try {
        const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || apiUrl).replace(/\/$/, '')
        const res = await fetch(`${apiBaseUrl}/chat/history?session_id=${sessionId}`)
        if (!res.ok) throw new Error('History API error')
        const data = await res.json()
        return Array.isArray(data) ? data : []
      } catch (err) {
        console.error('[useSyncAgent] getHistory error:', err)
        return []
      }
    },
    [apiUrl]
  )

  return {
    askQuestion,
    loading,
    thinking,
    partialResponse,
    getHistory,
  }
}
