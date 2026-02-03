'use server'

export async function importProductsByAccountAction(
  accountId: string,
  source: 'sellercloud' | 'extensiv'
) {
  try {
    // 🔁 Define qual função chamar com base na origem
    const functionPath =
      source === 'sellercloud'
        ? 'import_sellercloud_products'
        : source === 'extensiv'
        ? 'sync_extensiv_products'
        : null

    if (!functionPath) {
      throw new Error('Invalid source selected')
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionPath}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`
        },
        body: JSON.stringify({ account_id: accountId })
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to import products')
    }

    return {
      success: true,
      ...result
    }
  } catch (err: any) {
    console.error('[importProductsByAccountAction] Erro:', err.message)
    return {
      success: false,
      message: err.message
    }
  }
}