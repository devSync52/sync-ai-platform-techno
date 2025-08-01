import  createServerClient  from '@/utils/supabase/serverClient'
import { Database } from '@/types/supabase'

// Extended QuoteDraft type definition to include all columns explicitly.
export type QuoteDraft = {
  id?: string
  contact_id?: string | null
  quote_number?: string | null
  created_at?: string | null
  updated_at?: string | null
  notes?: string | null
  status?: string | null
  account_id?: string | null
  user_id?: string | null
  step?: number | null
  client?: any
  ship_from?: any
  ship_to?: any
  items?: any
  preferences?: any
  summary?: any
}

export async function getQuoteDraftById(id: string): Promise<QuoteDraft> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('saip_quote_drafts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw error || new Error('Draft not found')

  return data
}

export async function updateQuoteDraft(id: string, updates: Partial<QuoteDraft>) {
  const supabase = createServerClient()
  const { error } = await supabase
    .from('saip_quote_drafts')
    .update({
      ...updates,
      updated_at: updates.updated_at ?? new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}