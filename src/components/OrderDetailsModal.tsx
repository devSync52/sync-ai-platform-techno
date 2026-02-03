'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

interface OrderDetailsModalProps {
  orderId: string | null
  open: boolean
  onClose: () => void
}

export default function OrderDetailsModal({ orderId, open, onClose }: OrderDetailsModalProps) {
  const supabase = useSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (!orderId || !open) return

    setLoading(true)
    supabase
      .from('sellercloud_orders')
      .select('*')
      .eq('order_id', orderId)
      .single()
      .then(({ data, error }) => {
        if (!error) setOrder(data)
        setLoading(false)
      })
  }, [orderId, open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : order ? (
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <strong>Order ID:</strong> {order.order_id}
            </div>
            <div>
              <strong>Marketplace:</strong> {order.marketplace}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <span className="capitalize">{order.status}</span>
            </div>
            <div>
              <strong>Total:</strong> R$ {order.total_amount?.toFixed(2)}
            </div>
            <div>
              <strong>Order Date:</strong>{' '}
              {new Date(order.order_date).toLocaleString()}
            </div>
            {/* Adicione mais campos conforme desejar */}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Order not found.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}