'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function FollowupSettingsEditor({ accountId }: { accountId: string }) {
  const [askFeedback, setAskFeedback] = useState(true)
  const [suggestRelated, setSuggestRelated] = useState(true)
  const [sendFollowup, setSendFollowup] = useState(true)
  const [escalateCount, setEscalateCount] = useState(3)

  useEffect(() => {
    const fetchFollowup = async () => {
      const res = await fetch(`/api/xai/followup?account_id=${accountId}`)
      const json = await res.json()
      setAskFeedback(!!json.ask_feedback)
      setSuggestRelated(!!json.suggest_related_questions)
      setSendFollowup(!!json.send_followup_question)
      setEscalateCount(json.escalate_after_unanswered_count ?? 0)
    }

    fetchFollowup()
  }, [accountId])

  const handleSave = async () => {
    const res = await fetch('/api/xai/followup', {
      method: 'POST',
      body: JSON.stringify({
        account_id: accountId,
        ask_feedback: askFeedback,
        suggest_related_questions: suggestRelated,
        send_followup_question: sendFollowup,
        escalate_after_unanswered_count: escalateCount,
      }),
    })

    if (res.ok) toast.success('Follow-up settings saved!')
    else toast.error('Failed to save follow-up settings')
  }

  return (
    <div className="space-y-6">
      {/* Descrição com explicação de cada item */}
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          Customize how the assistant behaves after answering a question. These settings define whether it will continue the conversation, ask for feedback, or escalate to a human.
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <strong className="text-foreground">Send follow-up question:</strong> After answering, the AI may ask “Do you need help with anything else?”
          </li>
          <li>
            <strong className="text-foreground">Suggest related questions:</strong> Offers suggestions like “Would you like to see a stock forecast for this SKU?”
          </li>
          <li>
            <strong className="text-foreground">Ask for feedback:</strong> Asks “Was this answer helpful?” to improve its future behavior.
          </li>
          <li>
            <strong className="text-foreground">Transfer after 3 unanswered replies:</strong> Automatically offers to escalate to a human if the user stops responding.
          </li>
        </ul>
      </div>

      {/* Formulário de switches */}
      <div className="bg-white border rounded-md p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center border-b pb-3">
          <span>Ask for feedback</span>
          <Switch checked={askFeedback} onCheckedChange={setAskFeedback} />
        </div>
        <div className="flex justify-between items-center border-b pb-3">
          <span>Suggest related questions</span>
          <Switch checked={suggestRelated} onCheckedChange={setSuggestRelated} />
        </div>
        <div className="flex justify-between items-center border-b pb-3">
          <span>Send follow-up question</span>
          <Switch checked={sendFollowup} onCheckedChange={setSendFollowup} />
        </div>
        <div className="flex justify-between items-center border-b pb-3">
          <span>Escalate to human after N unanswered</span>
          <Input
            type="number"
            min={0}
            className="w-24"
            value={escalateCount}
            onChange={(e) => setEscalateCount(parseInt(e.target.value))}
          />
        </div>

        <div className="pt-4">
          <Button onClick={handleSave}>Save Follow-up Settings</Button>
        </div>
      </div>
    </div>
  )
}