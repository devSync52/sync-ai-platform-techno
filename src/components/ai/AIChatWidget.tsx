"use client"

import { useState } from "react"
import { Bot } from "lucide-react"
import AIChatPreview from "@/components/ai/AIChatPreview"

export default function AIChatWidget() {
    const [open, setOpen] = useState(false)
  
    return (
      <>
        <button
          onClick={() => setOpen(!open)}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-primary text-primary-foreground p-4 shadow-lg hover:bg-primary/90 transition"
        >
          <Bot className="w-5 h-5" />
        </button>
  
        {open && (
          <div className="fixed bottom-20 right-6 w-80 max-h-[80vh] overflow-y-auto z-40">
            <AIChatPreview
              autoReply={true}
              accessOrders={true}
              accessInventory={true}
              accessSales={true}
            />
          </div>
        )}
      </>
    )
  }
