import { useEffect, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'

type DashboardPreferences = {
  cardsOrder: string[]
  visibleCards: string[]
  saveOrder: (newOrder: string[]) => Promise<void>
  toggleCard: (cardId: string) => Promise<void>
  resetLayout: () => Promise<void>
  reloadPreferences: () => Promise<void>
  loading: boolean
}

export function useDashboardPreferences(userId: string): DashboardPreferences {
  const supabase = useSupabase()
  const [cardsOrder, setCardsOrder] = useState<string[]>([])
  const [visibleCards, setVisibleCards] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const defaultCards = [
    'total_orders',
    'total_sales',
    'average_ticket',
    'orders_shipped',
    'returns',
    'pending_orders',
    'new_orders_chart',
    'shipped_orders_chart',
    'sales_vs_previous_month_chart',
    'sales_by_marketplace_chart',
    'orders_per_day_chart',
    'top_selling_products_chart',
  ]

  const loadPrefs = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('dashboard_preferences')
      .select('cards_order, visible_cards')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('[DashboardPreferences] Load error:', error.message)
    }

    if (data) {
      setCardsOrder(data.cards_order ?? defaultCards)
      setVisibleCards(data.visible_cards ?? defaultCards)
    } else {
      setCardsOrder(defaultCards)
      setVisibleCards(defaultCards)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (userId) {
      loadPrefs()
    }
  }, [userId, supabase])

  const savePrefs = async (
    newOrder: string[] = cardsOrder,
    newVisible: string[] = visibleCards
  ) => {
    setCardsOrder(newOrder)
    setVisibleCards(newVisible)

    await supabase.from('dashboard_preferences').upsert({
      user_id: userId,
      cards_order: newOrder,
      visible_cards: newVisible,
      updated_at: new Date().toISOString(),
    })
  }

  const saveOrder = async (newOrder: string[]) => {
    await savePrefs(newOrder, visibleCards)
  }

  const toggleCard = async (cardId: string) => {
    const updated = visibleCards.includes(cardId)
      ? visibleCards.filter(id => id !== cardId)
      : [...visibleCards, cardId]

    await savePrefs(cardsOrder, updated)
  }

  const resetLayout = async () => {
    await savePrefs(defaultCards, defaultCards)
  }

  const reloadPreferences = async () => {
    await loadPrefs()
  }

  return {
    cardsOrder,
    visibleCards,
    saveOrder,
    toggleCard,
    resetLayout,
    reloadPreferences,
    loading,
  }
}

export type { DashboardPreferences }