'use client'

import { cn } from '@/lib/utils'

interface AIChatPreviewProps {
  autoReply?: boolean
  accessOrders?: boolean
  accessInventory?: boolean
  accessSales?: boolean
}

export default function AIChatPreview({
  autoReply = false,
  accessOrders = false,
  accessInventory = false,
  accessSales = false,
}: AIChatPreviewProps) {
  const messages = []

  if (autoReply) {
    messages.push({ from: 'user', text: 'Hi, can someone help me?' })
    messages.push({
      from: 'ai',
      text: "Hello! I'm your company's virtual assistant. How can I help you today?",
    })
  }

  if (accessOrders) {
    messages.push({ from: 'user', text: "What's the status of order #1234?" })
    messages.push({
      from: 'ai',
      text: 'Order #1234 was shipped today at 11 AM. Estimated delivery: tomorrow.',
    })
  }

  if (accessInventory) {
    messages.push({ from: 'user', text: 'Do you have product XYZ in stock?' })
    messages.push({
      from: 'ai',
      text: 'Yes! We currently have 82 units of product XYZ available.',
    })
  }

  if (accessSales) {
    messages.push({ from: 'user', text: 'How were sales this week?' })
    messages.push({
      from: 'ai',
      text: 'You sold 129 items this week, totaling $5,780.00.',
    })
  }

  if (messages.length === 0) {
    messages.push({
      from: 'ai',
      text: 'AI is active, but no permissions have been enabled to answer questions yet.',
    })
  }

  return (
    <div className="relative z-30 mt-6 overflow-visible border-primary border-separate">
      <div className="max-w-lg mx-auto p-4 rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
        <h2 className="text-base font-semibold mb-2">AI Chat Preview</h2>
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                'max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap',
                msg.from === 'user'
                  ? 'ml-auto bg-muted text-foreground'
                  : 'mr-auto bg-primary text-primary-foreground'
              )}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}