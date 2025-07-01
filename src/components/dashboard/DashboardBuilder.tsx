// components/dashboard/DashboardBuilder.tsx
'use client'

import { useEffect } from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  userId: string
}

const CARD_LABELS: Record<string, string> = {
  total_orders: 'Total Orders',
  total_sales: 'Sales',
  average_ticket: 'Average Ticket',
  orders_shipped: 'Orders Shipped',
  returns: 'Returns',
  pending_orders: 'Pending Orders',
  sales_vs_previous_month_chart: 'Sales vs Previous Month',
  sales_by_marketplace_chart: 'Sales by Marketplace',
  orders_per_day_chart: 'Orders per Day',
  low_stock_alert_chart: 'Low Stock Alert',
  reorder_forecast_chart: 'Reorder Forecast',
}

export default function DashboardBuilder({ userId }: Props) {
  const {
    cardsOrder,
    visibleCards,
    saveOrder,
    toggleCard,
    resetLayout,
    loading,
  } = useDashboardPreferences(userId)

  useEffect(() => {
    if (!loading) {
      saveOrder(cardsOrder) // garantir que a ordem seja salva na primeira montagem
    }
  }, [cardsOrder])

  const hiddenCards = cardsOrder.filter((id) => !visibleCards.includes(id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">Visible Cards</h3>
        <Button variant="link" className="text-red-500 p-0 h-auto" onClick={resetLayout}>
          Reset layout
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {visibleCards.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between border rounded-md p-3 bg-white shadow-sm"
              >
                <span className="text-sm font-medium text-gray-800">{CARD_LABELS[id] ?? id}</span>
                <button
                  onClick={() => toggleCard(id)}
                  className="text-muted-foreground hover:text-red-500"
                  title="Hide"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {hiddenCards.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-muted-foreground pt-4">Hidden Cards</h4>
              <div className="grid grid-cols-2 gap-3">
                {hiddenCards.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between border rounded-md p-3 bg-muted"
                  >
                    <span className="text-sm text-muted-foreground">{CARD_LABELS[id] ?? id}</span>
                    <button
                      onClick={() => toggleCard(id)}
                      className="text-muted-foreground hover:text-green-600"
                      title="Show"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}