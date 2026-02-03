'use client'

import { useTransition, useState } from 'react'
import { toast } from 'sonner'
import { importProductsByChannelAction } from '@/actions/importProductsByChannel'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Props {
  channelId: string
  companyName: string
}

export function ImportProductsButton({ channelId, companyName }: Props) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleImport = () => {
    startTransition(async () => {
      const result = await importProductsByChannelAction(channelId)

      if (result.success) {
        toast.success(`Imported ${result.upserted} products for ${companyName}`)
      } else {
        toast.error(result.message || 'Failed to import products')
      }

      setOpen(false)
    })
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="text-xs"
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import Products'}
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">
              Import products for {companyName}?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              This will fetch and update all products linked to this channel from Sellercloud.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-sm"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                className="text-sm"
                disabled={isPending}
              >
                {isPending ? 'Importing...' : 'Confirm Import'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}