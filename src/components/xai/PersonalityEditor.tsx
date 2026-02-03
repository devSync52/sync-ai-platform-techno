'use client'

import { useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function PersonalityEditor({ accountId }: { accountId: string }) {
  const [personality, setPersonality] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔁 Buscar personalidade salva
  useEffect(() => {
    const fetchPersonality = async () => {
      setLoading(true)
      const res = await fetch(`/api/xai/personality?account_id=${accountId}`)
      const json = await res.json()
      if (json.personality_text) {
        setPersonality(json.personality_text)
      }
      setLoading(false)
    }

    fetchPersonality()
  }, [accountId])

  const handleSave = async () => {
    const res = await fetch('/api/xai/personality', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId, personality_text: personality }),
    })

    if (res.ok) toast.success('Saved!')
    else toast.error('Error saving personality')
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2 space-y-2">
        <p>
          Define how your AI assistant should behave when interacting with your team or clients.
        </p>

        <div>
          <strong className="text-foreground">Examples:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>“Friendly and helpful, like a customer service agent who understands logistics.”</li>
            <li>“Concise and professional, answering only what is needed with clarity.”</li>
            <li>“Warm and proactive, suggesting inventory or shipping improvements.”</li>
          </ul>
        </div>

        <p>
          The more specific you are, the better the assistant will respond to your tone and goals.
        </p>
      </div>

      <Textarea
        value={personality}
        onChange={(e) => setPersonality(e.target.value)}
        placeholder="Ex: Friendly and proactive, like a smart logistics consultant who always looks for improvements."
        className="h-40 bg-white"
        disabled={loading}
      />

      <Button onClick={handleSave} disabled={loading}>
        Save Personality
      </Button>
    </div>
  )
}