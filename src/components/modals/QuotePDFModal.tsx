'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Calendar } from 'lucide-react'
import { useState, useRef } from 'react'

interface Props {
  open: boolean
  onCloseAction: () => void
  quote: any
  items: any[]
  shipFrom: any
  shipTo: any
}

export default function QuotePdfModal({ open, onCloseAction, quote, items = [], shipFrom = {}, shipTo = {} }: Props) {
  // Temporarily log to validate if account.name is coming correctly
  console.log('🧾 Quote Account Name:', quote?.account?.name)
  const [isEmailModalOpen, setEmailModalOpen] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  const accountName = quote?.account?.name || quote?.account_id || 'SynC'
  const accountLogo = quote?.account?.logo_url || quote?.account?.logo || null

  const templateColor = (quote?.account?.template as string | undefined) || undefined
  const primaryColor = templateColor || '#3f2d90'
  const softPrimaryColor = primaryColor.startsWith('#') && primaryColor.length === 7
    ? `${primaryColor}15`
    : primaryColor

  const getOmsStatusText = () => {
    const status = quote?.sellercloud_status
    const orderId = quote?.sellercloud_order_id

    if (status === 'success') {
      if (orderId) {
        return `SynC OMS status: Sent• Order #${orderId}`
      }
      return 'SynC OMS status: Sent'
    }

    if (status === 'error') {
      return 'SynC OMS status: Error sending — please contact support.'
    }

    return 'SynC OMS status: Not yet sent to SynC OMS.'
  }

  const selectedService = quote?.selected_service || {}
  const serviceName =
    selectedService.description ||
    selectedService.carrier_service_name ||
    selectedService.service_type ||
    selectedService.code ||
    '—'

  const carrierName =
    selectedService.carrier ||
    selectedService.carrier_code ||
    ''

  return (
    <Dialog open={open} onOpenChange={onCloseAction}>
      <DialogContent className="w-[calc(100%-1.5rem)] sm:w-full md:max-w-3xl bg-white font-sans text-sm print:bg-white print:text-black rounded-md sm:rounded-xl max-h-[85vh] overflow-y-auto print:w-[95%] print:max-w-none print:mx-auto print:h-auto print:max-h-none print:overflow-visible print:rounded-none print:shadow-none">
        <div className="flex justify-center pt-3 sm:pt-4">
          <div className="flex flex-col items-center gap-2">
            {accountLogo ? (
              <img
                src={accountLogo}
                alt={accountName}
                className="h-12 sm:h-16 object-contain print:h-12"
              />
            ) : (
              <h1
                className="text-2xl sm:text-3xl font-bold text-center"
                style={{ color: primaryColor }}
              >
                {accountName}
              </h1>
            )}
          </div>
        </div>
        <DialogHeader>
          <DialogTitle className="sr-only">Quote Details</DialogTitle>
        </DialogHeader>

        <div
          className="text-white p-4 flex justify-between gap-4 print:bg-white print:text-black print:border-b print:border-black/10 print:pt-0 print:text-base"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs uppercase opacity-80">
              <FileText className="w-3 h-3 print:text-sm" /> Quote ID
            </div>
            <span className="text-lg font-semibold print:text-xs">{quote?.id}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs uppercase opacity-80">
              <FileText className="w-3 h-3 print:text-sm" /> Status
            </div>
            <span className="text-lg font-semibold capitalize print:text-xs">{quote?.status}</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs uppercase opacity-80">
              <Calendar className="w-3 h-3 print:text-sm" /> Created At
            </div>
            <span className="text-lg font-semibold print:text-xs">{quote?.created_at?.split('T')[0]}</span>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 px-4 print:grid print:grid-cols-2 print:gap-8 print:break-inside-avoid">
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

        <div className="mt-6 mb-4 -mx-4 px-4 overflow-x-auto print:overflow-visible print:mx-0 print:px-0 print:break-inside-avoid">
          <table className="min-w-full text-xs border">
            <thead
              className="font-semibold text-left"
              style={{ backgroundColor: softPrimaryColor, color: primaryColor }}
            >
              <tr>
                <th className="px-3 py-2 border">SKU</th>
                <th className="px-3 py-2 border">Product</th>
                <th className="px-3 py-2 border">Dimensions (L×W×H)</th>
                <th className="px-3 py-2 border">Weight (lbs)</th>
                <th className="px-3 py-2 border">Qty</th>
                <th className="px-3 py-2 border">Unit Price</th>
                <th className="px-3 py-2 border">Subtotal</th>

              </tr>
            </thead>
            <tbody>
              {Array.isArray(items) && items.length > 0 ? (
                items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 border">{item.sku}</td>
                    <td className="px-3 py-2 border">
                      {typeof item.product_name === 'string'
                        ? item.product_name.length > 50
                          ? `${item.product_name.slice(0, 50)}…`
                          : item.product_name
                        : '—'}
                    </td>
                    <td className="px-3 py-2 border">{item.length}×{item.width}×{item.height}</td>
                    <td className="px-3 py-2 border">{item.weight_lbs}</td>
                    <td className="px-3 py-2 border">{item.quantity}</td>
                    <td className="px-3 py-2 border">
                      {typeof item.price === 'number'
                        ? `$${item.price.toFixed(2)}`
                        : item.price || '—'}
                    </td>
                    <td className="px-3 py-2 border">
                      {(() => {
                        const unit = typeof item.price === 'number' ? item.price : Number(item.price || 0)
                        const qty = Number(item.quantity || 0)
                        const subtotal = typeof item.subtotal === 'number' ? item.subtotal : unit * qty
                        if (!subtotal || !isFinite(subtotal)) return '—'
                        return `$${subtotal.toFixed(2)}`
                      })()}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-2">No items available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {items.length > 0 && (
          <div
            className=" rounded-md border px-6 py-4 text-sm text-gray-700 w-full max-w-md ml-auto print:break-inside-avoid"
            style={{ borderColor: softPrimaryColor }}
          >
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">${items.reduce((sum, item) => sum + (item.subtotal || 0), 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">Shipping cost</span>
              <span className="font-medium">${Number(quote?.selected_service?.total || 0).toFixed(2)}</span>
            </div>
            <div
              className="flex justify-between border-t pt-2 mt-2"
              style={{ borderColor: softPrimaryColor }}
            >
              <span className="text-gray-700 font-semibold">Total</span>
              <span className="font-bold" style={{ color: primaryColor }}>
                ${(
                  items.reduce((sum, item) => sum + (item.subtotal || 0), 0) +
                  Number(quote?.selected_service?.total || 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div
          className="border rounded-lg px-4 py-4 mt-4 print:bg-white print:text-black print:border-black/10 print:break-inside-avoid"
          style={{ borderColor: softPrimaryColor, backgroundColor: softPrimaryColor, color: primaryColor }}
        >
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Selected Shipping Service
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold">Service</p>
              <p>{carrierName ? `${carrierName} — ${serviceName}` : serviceName}</p>
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

        <div className="flex justify-end mt-4 gap-2 print:hidden">
          {/* 
          <button
            onClick={() => setEmailModalOpen(true)}
            className="border border-primary text-primary hover:bg-primary/10 px-4 py-2 rounded"
          >
            Send Quote by Email
          </button>
          */}
          <button
            onClick={() => {
              const element = document.body;
              const originalTitle = document.title;
              document.title = `quote_${quote?.id || 'sync'}.pdf`;
              window.print();
              document.title = originalTitle;
            }}
            className="border px-4 py-2 rounded hover:bg-gray-50"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            Download PDF
          </button>
          <button
            onClick={() => window.print()}
            className="border px-4 py-2 rounded hover:bg-gray-50"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            Print Quote
          </button>
        </div>

        {isEmailModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
              <h2 className="text-lg font-semibold mb-4">Send Quote</h2>
              <input
                type="email"
                placeholder="Enter recipient email"
                ref={emailInputRef}
                className="w-full border border-gray-300 px-3 py-2 rounded mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const email = emailInputRef.current?.value
                    if (!email) return alert('Please enter an email.')
                    console.log('📨 Sending quote email to:', email)
                    console.log('🧾 Quote:', quote)
                    console.log('📦 Items:', items)
                    // 🔧 Trigger send email logic here
                    fetch('/api/send-quote', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email,
                        quote,
                        items,
                      }),
                    })
                      .then((res) => {
                        if (!res.ok) throw new Error('Failed to send email.')
                        alert('Quote sent successfully!')
                      })
                      .catch((err) => {
                        console.error(err)
                        alert('Error sending quote.')
                      })
                      .finally(() => setEmailModalOpen(false))
                  }}
                  className="px-4 py-2 rounded text-white hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 sm:mt-8 text-xs text-center text-gray-400 print:text-black/40 print:mt-4">
          <p>Document generated by SynC AI Platform</p>
          <p className="mt-1">{getOmsStatusText()}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}