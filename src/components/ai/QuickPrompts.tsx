'use client'

import { useState, useRef, useEffect } from 'react'

type PromptCategory = {
  key: string
  label: string
  color: string
  prompts: string[]
}

const CATEGORIES: PromptCategory[] = [
  {
    key: 'orders',
    label: 'Orders',
    color: 'bg-green-200 text-green-900',
    prompts: [
      'How many orders were placed yesterday?',
      'What’s the status of order number 5011644 and track number?',
      'How many orders were delivered last month?',
      'List all orders from last week.',
      'How many orders did I have on Amazon this month?',
      'Show recent orders from client FTTF.',
      'Check the status of each order sold yesterday per marketplace and inform if each order has been processed, shipped, or delivered?'
    ]
  },
  {
    key: 'clients',
    label: 'Clients',
    color: 'bg-yellow-200 text-yellow-900',
    prompts: [
      'Show total sales for client FTTF this month.',
      'Which client had the most orders last month?',
      'Sales summary by customer'
    ]
  },
  {
    key: 'marketplaces',
    label: 'Marketplaces',
    color: 'bg-purple-200 text-purple-900',
    prompts: [
      'Sales summary by Marketplaces last month',
      'Which marketplace generated the highest revenue this month?',
      'What is the marketplace with the most orders last month?',
      'Compare sales between Amazon and Walmart this week.'
    ]
  },
  {
    key: 'inventory',
    label: 'Inventory',
    color: 'bg-cyan-200 text-cyan-900',
    prompts: [
      'What is my current inventory for SKU PT001UF?',
      'What’s the comparative sales volume of SKU EN001 versus last month',
      'What is the daily sales velocity for SKU PT001UF?',
      'Which SKUs are at risk of stockout within the next 30 days?',
      'List all products that are below reorder point.',
      'How many orders were shipped from Houston this month?'
    ]
  },
  {
    key: 'reports',
    label: 'Reports',
    color: 'bg-indigo-200 text-indigo-900',
    prompts: [
      'Generate a sales overview report for the last 30 days.',
      'What kind of reports can you generate for me?',
      'Show revenue trend by client this month vs. last month.',
      'Show a summary of order statuses this week.',
      'Can you provide a summary of my top-selling products and replenishment recommendations?'
    ]
  },
  {
    key: 'forecasts',
    label: 'Forecasts',
    color: 'bg-blue-100 text-blue-900',
    prompts: [
      'How many days of inventory coverage do I have for SKU PT001UF?',
      'Will a PO placed today arrive in time to prevent stockout?',
      'What SKUs will run out of stock within the next 60 days?',
      'Estimate when SKU EN001 will sell out based on current sales.'
    ]
  },
  {
    key: 'alerts',
    label: 'Alerts',
    color: 'bg-pink-200 text-pink-900',
    prompts: [
      'Which SKUs need urgent replenishment?'
    ]
  },
]

const CATEGORIES_CLIENT: PromptCategory[] = [
  {
    key: 'orders',
    label: 'Orders',
    color: 'bg-green-200 text-green-900',
    prompts: [
      'what items are in the order 5012312.',
      'Has order number 5011644 status?',
      'How many orders were delivered last month?'
    ]
  },
  {
    key: 'inventory',
    label: 'Inventory',
    color: 'bg-cyan-200 text-cyan-900',
    prompts: [
      'What is my current inventory for SKU PT001UF?',
      'Which SKUs are at risk of stockout?',
      'How many units of SKU EN001 do I have left?'
    ]
  },
  {
    key: 'shipping',
    label: 'Shipping',
    color: 'bg-blue-100 text-blue-900',
    prompts: [
      'When was my last order shipped?',
      'Which carrier is delivering order 5011644?',
      'What is the tracking number for my order 5012380?'
    ]
  }
]

interface QuickPromptsProps {
  onPrompt: (prompt: string) => void
  isClient?: boolean
}

export function QuickPrompts({ onPrompt, isClient }: QuickPromptsProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fecha prompts ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        openCategory &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenCategory(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openCategory])

  return (
    <div className="w-full border-t bg-white" ref={containerRef} style={{ position: 'sticky', bottom: 0, zIndex: 30 }}>
      <div className="flex gap-2 px-2 py-2 overflow-x-auto">
        {(isClient ? CATEGORIES_CLIENT : CATEGORIES).map((cat) => (
          <button
            key={cat.key}
            className={`px-3 py-1 text-sm rounded font-semibold transition ${cat.color} ${openCategory === cat.key ? 'ring-1 ring-primary' : ''}`}
            onClick={() => setOpenCategory(openCategory === cat.key ? null : cat.key)}
            type="button"
          >
            {cat.label}
          </button>
        ))}
      </div>
      {/* Prompts da categoria aberta */}
      {openCategory && (
        <div className="px-2 pb-2 pt-1 animate-fade-in">
          <div className="rounded bg-gray-50 border p-2 shadow max-h-36 overflow-y-auto flex flex-col gap-2">
            {(isClient ? CATEGORIES_CLIENT : CATEGORIES).find((cat) => cat.key === openCategory)?.prompts.map((prompt) => (
              <button
                key={prompt}
                className="text-left w-full px-3 py-2 bg-white rounded hover:bg-primary/10 border border-gray-200 text-sm transition"
                onClick={() => {
                  onPrompt(prompt)
                  setOpenCategory(null)
                }}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickPrompts