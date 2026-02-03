'use client'

import { useEffect, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { toast } from 'sonner'

const categories = ['Order', 'Clients', 'Marketplaces', 'Inventory', 'Reports', 'Forecasts', 'Alerts']

interface Example {
  id: string
  category: string
  prompt: string
  reply: string
}

export default function TrainingExamplesEditor({ accountId }: { accountId: string }) {
  const [prompt, setPrompt] = useState('')
  const [reply, setReply] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [examples, setExamples] = useState<Example[]>([])
  const [loading, setLoading] = useState(false)

  const fetchExamples = async () => {
    setLoading(true)
    const res = await fetch(`/api/xai/training-examples?account_id=${accountId}`)
    const json = await res.json()
    setExamples(json.examples || [])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!prompt || !reply || !category) return toast.error('Please fill all fields')

    const res = await fetch('/api/xai/training-examples', {
      method: 'POST',
      body: JSON.stringify({ account_id: accountId, prompt, reply, category }),
    })

    if (res.ok) {
      toast.success('Example saved!')
      setPrompt('')
      setReply('')
      setCategory(categories[0])
      fetchExamples()
    } else {
      toast.error('Failed to save example')
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/xai/training-examples', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    })
  
    if (res.ok) {
      toast.success('Example deleted!')
      fetchExamples()
    } else {
      toast.error('Failed to delete example')
    }
  }

  useEffect(() => {
    fetchExamples()
  }, [accountId])

  const grouped = examples.reduce((acc, ex) => {
    if (!acc[ex.category]) acc[ex.category] = []
    acc[ex.category].push(ex)
    return acc
  }, {} as Record<string, Example[]>)

  return (
    <div className="space-y-8">
      <div className="bg-white border rounded-md p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Add New Example</h2>
        <div className="grid gap-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea placeholder="User prompt..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          <Textarea placeholder="Expected reply..." value={reply} onChange={(e) => setReply(e.target.value)} />
          <Button onClick={handleSubmit}>Save Example</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading examples...</p>
      ) : (
        Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <h3 className="text-lg font-bold mb-2">{cat}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((ex) => (
                <div key={ex.id} className="bg-white border rounded-md p-4 shadow-sm">
                  <p className="text-sm"><strong>User:</strong> {ex.prompt}</p>
                  <p className="text-sm text-muted-foreground"><strong>Bot:</strong> {ex.reply}</p>
                  <div className="flex gap-2 mt-2">
  <Button
    size="sm"
    variant="destructive"
    onClick={() => handleDelete(ex.id)}
  >
    Delete
  </Button>
</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}