'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-browser'

export function useDashboardPreferences(userId: string) {
  const [cardsOrder, setCardsOrder] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('dashboard_preferences')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })

      if (error) {
        console.error('Error loading dashboard preferences', error)
        return
      }

      const order = data.map((item) => item.card_id)
      setCardsOrder(order)
      setLoading(false)
    }

    fetchPreferences()
  }, [userId])

  const saveOrder = async (newOrder: string[]) => {
    setCardsOrder(newOrder)

    for (let i = 0; i < newOrder.length; i++) {
      await supabase
        .from('dashboard_preferences')
        .update({ position: i })
        .eq('user_id', userId)
        .eq('card_id', newOrder[i])
    }
  }

  return { cardsOrder, saveOrder, loading }
}