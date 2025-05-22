import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function estimateStockoutTool({
  account_id,
  sku,
  days_range = 30
}: {
  account_id: string
  sku: string
  days_range?: number
}): Promise<{
  success: boolean
  answer?: string
  rows?: any[]
  metadata?: any
  error?: string
}> {
  const { data, error } = await supabase.rpc('estimate_stockout', {
    account_id_input: account_id,
    sku_input: sku,
    days_range
  })

  if (error || !data) {
    return {
      success: false,
      error: error?.message || 'No data returned'
    }
  }

  if (data.error) {
    return {
      success: false,
      error: data.error
    }
  }

  const rows = [data]

  const answer = `The product **${data.product_name}** (SKU: ${data.sku}) has ${data.quantity_available} units available.
Based on the last ${data.days_range} days, it sells **${data.average_daily_sold} per day**, so it is estimated to run out in **${data.estimated_days_remaining ?? 'N/A'} days**.`

  return {
    success: true,
    answer,
    rows,
    metadata: data
  }
}