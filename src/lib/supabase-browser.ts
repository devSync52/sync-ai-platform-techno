import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { supabaseConfig } from './supabase-config'

export const supabase = createBrowserClient<Database>(
  supabaseConfig.supabaseUrl,
  supabaseConfig.supabaseAnonKey
)