'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Json } from '@/types/supabase'

type QuoteDraft = {
  draftId?: string
  step1?: Json
  step2?: Json
  step3?: Json
  step4?: Json
  [key: string]: any
}

type QuoteDraftContextType = {
  draft: QuoteDraft
  updateDraft: (data: Partial<QuoteDraft>) => void
  clearDraft: () => void
}

const QuoteDraftContext = createContext<QuoteDraftContextType | undefined>(undefined)

export const QuoteDraftProvider = ({ children }: { children: ReactNode }) => {
  const [draft, setDraft] = useState<QuoteDraft>({})

  const updateDraft = (data: Partial<QuoteDraft>) => {
    setDraft(prev => ({ ...prev, ...data }))
  }

  const clearDraft = () => {
    setDraft({})
  }

  return (
    <QuoteDraftContext.Provider value={{ draft, updateDraft, clearDraft }}>
      {children}
    </QuoteDraftContext.Provider>
  )
}

export const useQuoteDraft = (): QuoteDraftContextType => {
  const context = useContext(QuoteDraftContext)
  if (!context) {
    throw new Error('useQuoteDraft must be used within a QuoteDraftProvider')
  }
  return context
}