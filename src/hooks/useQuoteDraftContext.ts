'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getQuoteDraftById, updateQuoteDraft } from '@/lib/supabase/quotes'
import type { Database } from '@/types/supabase'

interface Address {
  name?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  phone?: string
}

interface Item {
  sku: string
  product_name?: string
  quantity: number
  price?: number
  subtotal?: number
  weight_lbs?: number
  length?: number
  width?: number
  height?: number
  hazardous?: boolean
  stackable?: boolean
  freight_class?: string
}

interface Preferences {
  shipping_type?: 'courier' | 'ltl'
  delivery_speed?: 'standard' | 'express'
  insurance?: boolean
  signature_required?: boolean
}

export type QuoteDraft = {
  id: string
  account_id?: string
  user_id?: string
  created_at?: string
  updated_at?: string
  step?: number
  ship_from?: Address
  ship_to?: Address
  client?: {
    name?: string
    email?: string
  } | string
  items?: Item[]
  preferences?: Preferences
  summary?: any
  notes?: string
  status?: 'draft' | 'quoted' | 'converted' | 'cancelled'
}

interface QuoteDraftContextType {
  draft: QuoteDraft | null
  setDraft: (draft: QuoteDraft) => void
  updateDraft: (updates: Partial<QuoteDraft>) => Promise<void>
}

const QuoteDraftContext = createContext<QuoteDraftContextType | undefined>(undefined)
QuoteDraftContext.displayName = 'QuoteDraftContext'

interface ProviderProps {
  draftId: string
  children: ReactNode
}

export function QuoteDraftProvider({ draftId, children }: ProviderProps) {
  const [draft, setDraft] = useState<QuoteDraft | null>(null)

  useEffect(() => {
    async function fetchDraft() {
      if (!draftId) return
      try {
        const data = await getQuoteDraftById(draftId)
        if (data) {
          setDraft({
            ...(data as QuoteDraft),
            step: (data as QuoteDraft).step ?? 0,
            notes: (data as QuoteDraft).notes ?? '',
            status: (data as QuoteDraft).status ?? 'draft',
          })
        }
      } catch (error) {
        console.error('Failed to fetch draft:', error)
      }
    }
    fetchDraft()
  }, [draftId])

  const updateDraftHandler = async (updates: Partial<QuoteDraft>) => {
    if (!draft) return
    const safeUpdates: Partial<QuoteDraft> = {
      ...updates,
      account_id: updates.account_id === null ? undefined : updates.account_id,
      created_at: updates.created_at ?? undefined,
      updated_at: updates.updated_at ?? undefined,
    }

    await updateQuoteDraft(draft.id, safeUpdates)

    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        ...safeUpdates,
        step: safeUpdates.step ?? prev.step ?? 0,
        notes: safeUpdates.notes ?? prev.notes ?? '',
        status: safeUpdates.status ?? prev.status ?? 'draft',
      }
    })
  }
}

export function useQuoteDraft(): QuoteDraftContextType {
  const context = useContext(QuoteDraftContext)
  if (!context) {
    throw new Error('useQuoteDraft must be used within a QuoteDraftProvider')
  }
  return context
}