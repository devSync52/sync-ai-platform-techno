import { useCallback } from 'react'

export interface SessionPreview {
  session_id: string
  last_activity: string
  last_question: string
}

export function useSessionHistory(apiUrl: string) {
  const fetchSessions = useCallback(
    async (userId: string): Promise<SessionPreview[]> => {
      try {
        const url = `${apiUrl.replace(/\/$/, '')}/chat/sessions?user_id=${userId}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch sessions')
        const data = await res.json()
        return Array.isArray(data) ? data : []
      } catch (err) {
        console.error('[useSessionHistory] Error:', err)
        return []
      }
    },
    [apiUrl]
  )
  return { fetchSessions }
}