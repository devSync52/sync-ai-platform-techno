// src/lib/supabase-browser.ts
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'

let client: SupabaseClient | undefined

export function getSupabaseBrowserClient() {
  if (!client) {
    client = createPagesBrowserClient()
  }
  return client
}