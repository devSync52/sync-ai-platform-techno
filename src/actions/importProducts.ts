'use server'

import { syncExtensivProductsAction } from '@/actions/extensivProducts'

export async function importProductsByAccountAction(
  accountId: string,
  source: 'sellercloud' | 'extensiv' | 'magaya'
) {
  try {
    // Extensiv sync runs in-process (no Edge function)
    if (source === 'extensiv') {
      const result = await syncExtensivProductsAction({ accountId })
      if (!result.success) throw new Error(result.message || 'Failed to import products')
      return { success: true, ...result }
    }

    // Other sources still use their Edge functions
    const functionPath =
      source === 'sellercloud'
        ? 'import_sellercloud_products'
        : source === 'magaya'
          ? 'sync_magaya_products'
          : null

    if (!functionPath) throw new Error('Invalid source selected')

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({ account_id: accountId }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to import products')
    }

    return { success: true, ...result }
  } catch (err: any) {
    console.error('[importProductsByAccountAction] Erro:', err.message)
    return { success: false, message: err.message }
  }
}
