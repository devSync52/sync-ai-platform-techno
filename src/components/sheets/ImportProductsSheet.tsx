'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ImportProductsSheetProps {
  channelId?: string // agora opcional
}

export function ImportProductsSheet({ channelId }: ImportProductsSheetProps) {
  const [loading, setLoading] = useState(false)

  const onImport = async (source: string) => {
    if (!channelId) {
      toast.error('Channel ID not provided.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: channelId, source }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Imported products from ${source}`)
      } else {
        toast.error(data.error || 'Import failed')
      }
    } catch (error) {
      toast.error('Unexpected error during import.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Import Products</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="space-y-4 p-4">
          <h2 className="text-lg font-semibold">Select source to import</h2>
          <Button
            onClick={() => onImport('sellercloud')}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Importing...' : 'Import from Sellercloud'}
          </Button>
          <Button
            onClick={() => onImport('extensiv')}
            disabled={loading}
            className="w-full"
            variant="secondary"
          >
            {loading ? 'Importing...' : 'Import from Extensiv'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}