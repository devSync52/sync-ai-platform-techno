

'use client'

import { Button } from '@/components/ui/button'
import { DownloadIcon, MailIcon, CheckCircleIcon } from 'lucide-react'

type QuoteActionsProps = {
  onSimulateRate?: () => void
  onConfirmOrder?: () => void
  isLoading?: boolean
}

export function QuoteActions({ onSimulateRate, onConfirmOrder, isLoading }: QuoteActionsProps) {
  return (
    <div className="mt-8 flex flex-col md:flex-row gap-4">
      <Button variant="outline" onClick={() => {/* TODO: export PDF */}}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        Download PDF
      </Button>
      <Button variant="outline" onClick={() => {/* TODO: send email */}}>
        <MailIcon className="w-4 h-4 mr-2" />
        Send by Email
      </Button>
      <Button onClick={onSimulateRate} disabled={isLoading}>
        Simulate Freight
      </Button>
      <Button onClick={onConfirmOrder} variant="secondary" disabled={isLoading}>
        <CheckCircleIcon className="w-4 h-4 mr-2" />
        Confirm & Create Order
      </Button>
    </div>
  )
}