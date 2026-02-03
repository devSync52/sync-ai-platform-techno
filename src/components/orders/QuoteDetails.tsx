'use client'

import { ServiceCard } from '@/components/quotes/ServiceCard'

type Service = {
  code: string
  name: string
  delivery_days: number
  cost: number
}

type Quote = {
  services: Service[]
}

type QuoteDetailsProps = {
  quote: Quote
}

export default function QuoteDetails({ quote }: QuoteDetailsProps) {
  return (
    <div className="space-y-4">
      {quote.services.map((service) => (
        <ServiceCard key={service.code} service={service} />
      ))}
    </div>
  )
}