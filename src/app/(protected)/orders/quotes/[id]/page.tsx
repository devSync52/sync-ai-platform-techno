import React from 'react'
import QuoteWizard from '@/components/quotes/QuoteWizard'

// @ts-ignore
export default async function Page({ params }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-muted/40">
      <main className="justify-start p-6">
        <QuoteWizard />
      </main>
    </div>
  )
}