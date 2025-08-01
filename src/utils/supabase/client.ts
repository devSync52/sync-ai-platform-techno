import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase2'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)