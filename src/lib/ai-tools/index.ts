// src/lib/ai-tools/index.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const tools = {
  get_recent_orders: {
    description: 'Get the most recent orders from the current account',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'How many recent orders to return'
        }
      },
      required: []
    },
    handler: async ({ accountId, args }: { accountId: string; args: any }) => {
      const { limit = 2 } = args

      const { data: orders } = await supabase
        .from('get_sellercloud_orders')
        .select('order_source_order_id, status, marketplace, order_date')
        .eq('account_id', accountId)
        .order('order_date', { ascending: false })
        .limit(limit)

      if (!orders || orders.length === 0) {
        return 'No recent orders found for this account.'
      }

      return orders.map((o) =>
        `Order ${o.order_source_order_id} (${o.marketplace}) - Status: ${o.status}`
      ).join('\n')
    }
  },

  get_total_sales_by_client: {
    description: 'Calculate total sales for a specific client by name and optional date range',
    parameters: {
      type: 'object',
      properties: {
        client_name: {
          type: 'string',
          description: 'The name of the client'
        },
        date_start: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        date_end: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        }
      },
      required: ['client_name']
    },
    handler: async ({ accountId, args }: { accountId: string; args: any }) => {
      const { client_name, date_start, date_end } = args
      console.log('[get_total_sales_by_client] Params:', { accountId, args })
      let query = supabase
        .from('get_sellercloud_orders')
        .select('total_amount')
        .eq('account_id', accountId)
        .ilike('client_name', `%${client_name}%`)

      if (date_start) {
        query = query.gte('order_date', `${date_start}T00:00:00`)
      }

      if (date_end) {
        query = query.lte('order_date', `${date_end}T23:59:59`)
      }

      const { data } = await query

      if (!data || data.length === 0) {
        return `No orders found for client "${client_name}" in the given date range.`
      }

      const total = data.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      return `The total sales for client "${client_name}" is $${total.toFixed(2)}.`
    }
  }
}
