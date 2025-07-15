'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function uploadImageToSupabase(file: File, path: string): Promise<string> {
  console.log('[uploadImageToSupabase:start]', { path });
  const { data, error } = await supabase.storage.from('img').upload(path, file, {
    upsert: true,
    contentType: file.type
  })
  console.log('[uploadImageToSupabase:upload result]', { data, error });

  if (error) throw new Error(error.message)

  return supabase.storage.from('img').getPublicUrl(path).data.publicUrl
}


// Make sure `accountId` is the real account UUID, not the user ID
export async function uploadAccountLogo(file: File, accountId: string): Promise<string> {
  const path = `logo-${accountId}.jpg`
  const url = await uploadImageToSupabase(file, path)

  console.log('[uploadAccountLogo]', { path, url, accountId })

  const { error } = await supabase
    .from('accounts')
    .update({ logo: url })
    .eq('id', accountId)

  if (error) {
    console.error('❌ Error updating logo in accounts:', error.message)
  } else {
    console.log('✅ Logo updated in accounts')
  }

  return `${url}?v=${Date.now()}`
}

export async function uploadUserAvatar(file: File, userId: string): Promise<string> {
  const path = `avatar-${userId}.jpg`
  const url = await uploadImageToSupabase(file, path)

  const { error } = await supabase
    .from('users')
    .update({ logo_url: url })
    .eq('id', userId)

  if (error) console.error('❌ Error updating avatar in users:', error.message)

  return `${url}?v=${Date.now()}`
}