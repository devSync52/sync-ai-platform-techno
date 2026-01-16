import React from 'react'
import QuoteWizard from '@/components/orders/OrderWizard'

// @ts-ignore
export default async function Page({ params }) {
  return (
    <div className="flex flex-col w-full md:flex-column min-h-screen bg-muted/40">
      <main className="justify-start p-6">
        <QuoteWizard />
      </main>
    </div>
  )
}