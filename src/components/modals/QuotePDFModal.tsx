'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Calendar } from 'lucide-react'

interface Props {
  open: boolean
  onCloseAction: () => void
  quote: any
  items: any[]
  shipFrom: any
  shipTo: any
}

export default function QuotePdfModal({ open, onCloseAction, quote, items = [], shipFrom = {}, shipTo = {} }: Props) {
  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-3xl w-full bg-white font-sans text-sm print:bg-white print:text-black">
        <div className="flex justify-center pt-4">
          <img src="/logo_SynC_purple_red.png" alt="Sync Logo" className="h-30" />
        </div>
        <DialogHeader>
          <DialogTitle className="sr-only">Quote Details</DialogTitle>
        </DialogHeader>

        <div className="bg-primary text-white p-4 flex justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs uppercase opacity-80">
              <FileText className="w-3 h-3" /> Quote ID
            </div>
            <span className="text-lg font-semibold">{quote?.id}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs uppercase opacity-80">
              <FileText className="w-3 h-3" /> Status
            </div>
            <span className="text-lg font-semibold capitalize">{quote?.status}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs uppercase opacity-80">
              <Calendar className="w-3 h-3" /> Created At
            </div>
            <span className="text-lg font-semibold">{quote?.created_at?.split('T')[0]}</span>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 px-4">
          <div>
            <p className="font-semibold text-lg">Ship From</p>
            <p className="text-xs">{shipFrom?.name}</p>
            <p className="text-xs">{shipFrom?.address?.line1}</p>
            <p className="text-xs">
              {shipFrom?.address?.city}, {shipFrom?.address?.state} - {shipFrom?.address?.country}
            </p>
            <p className="text-xs">{shipFrom?.address?.zip_code}</p>
          </div>
          <div>
            <p className="font-semibold text-lg">Ship To</p>
            <p className="text-xs">{shipTo?.full_name}</p>
            <p className="text-xs">{shipTo?.address_line1}</p>
            <p className="text-xs">
              {shipTo?.city}, {shipTo?.state} - {shipTo?.country}
            </p>
            <p className="text-xs">{shipTo?.zip_code}</p>
          </div>
        </section>

        <table className="w-full text-xs border mt-6 mb-4">
          <thead className="bg-primary/10 text-primary font-semibold text-left">
            <tr>
              <th className="px-3 py-2 border">SKU</th>
              <th className="px-3 py-2 border">Product</th>
              <th className="px-3 py-2 border">Qty</th>
              <th className="px-3 py-2 border">Dimensions (L×W×H)</th>
              <th className="px-3 py-2 border">Weight (lbs)</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(items) && items.length > 0 ? (
              items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 border">{item.sku}</td>
                  <td className="px-3 py-2 border">{item.product_name}</td>
                  <td className="px-3 py-2 border">{item.quantity}</td>
                  <td className="px-3 py-2 border">{item.length}×{item.width}×{item.height}</td>
                  <td className="px-3 py-2 border">{item.weight_lbs}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-2">No items available.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="border border-primary rounded-lg px-4 py-4 mt-4 bg-primary/5 text-primary">
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Selected Shipping Service
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold">Service</p>
              <p>{quote?.selected_service?.code || '—'} ({quote?.selected_service?.description || '—'})</p>
            </div>
            <div>
              <p className="font-semibold">Estimated Cost</p>
              <p>${quote?.selected_service?.total || '—'}</p>
            </div>
            <div>
              <p className="font-semibold">Delivery Time</p>
              <p>{quote?.selected_service?.deliveryDays || '—'} business days</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={() => window.print()} className="border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded">
            Print Quote
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}