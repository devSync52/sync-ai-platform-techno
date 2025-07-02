'use client'

import { useState, useTransition } from 'react'
import { importProductsByAccountAction } from '@/actions/importProducts'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface Props {
  accountId: string
  companyName: string
  onCloseAction: () => void
}

export default function ImportProductsModal({
  accountId,
  companyName,
  onCloseAction
}: Props) {
  const [source, setSource] = useState<'sellercloud' | 'extensiv'>('sellercloud')
  const [step, setStep] = useState<'select' | 'loading'>('select')
  const [isPending, startTransition] = useTransition()

  const handleImport = () => {
    setStep('loading')
    startTransition(async () => {
      const result = await importProductsByAccountAction(accountId, source)
      if (result.success) {
        toast.success(`✅ Imported ${result.upserted} products for ${companyName}`)
      } else {
        toast.error(result.message || 'Failed to import products')
      }
      setTimeout(() => {
        setStep('select')
        onCloseAction()
      }, 1000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
        {step === 'select' && (
          <>
            <h2 className="text-xl font-semibold text-center mb-2">
              Import products for <span className="text-primary">{companyName}</span>?
            </h2>
            <p className="text-sm text-center text-gray-900 mb-6">Select the import channel</p>
            <div className="flex items-center justify-center gap-6 mb-6">
              {/* ✅ Sellercloud */}
              <label
                className={`flex flex-col items-center gap-2 cursor-pointer border rounded-md p-2 transition ${
                  source === 'sellercloud' ? 'ring-2 ring-primary bg-gray-50' : 'opacity-60'
                }`}
              >
                <input
                  type="radio"
                  name="source"
                  value="sellercloud"
                  checked={source === 'sellercloud'}
                  onChange={() => setSource('sellercloud')}
                  className="hidden"
                />
                <Image src="/logos/sellercloud.png" alt="Sellercloud" width={90} height={90} />
                <span className="text-xs">Sellercloud</span>
              </label>

              {/* ✅ Extensiv */}
              <label
                className={`flex flex-col items-center gap-2 cursor-pointer border rounded-md p-2 transition ${
                  source === 'extensiv' ? 'ring-2 ring-primary bg-gray-50' : 'opacity-60'
                }`}
              >
                <input
                  type="radio"
                  name="source"
                  value="extensiv"
                  checked={source === 'extensiv'}
                  onChange={() => setSource('extensiv')}
                  className="hidden"
                />
                <Image src="/logos/extensiv.png" alt="Extensiv" width={90} height={90} />
                <span className="text-xs">Extensiv</span>
              </label>

              {/* ❌ Project44 ainda desativado */}
              <label className="flex flex-col items-center gap-2 opacity-40 cursor-not-allowed">
                <input type="radio" name="source" disabled />
                <Image src="/logos/project44.png" alt="Project44" width={90} height={90} />
                <span className="text-xs">Project 44</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onCloseAction} className="text-sm">Cancel</Button>
              <Button onClick={handleImport} disabled={isPending} className="text-sm">
                {isPending ? 'Importing...' : 'Confirm Import'}
              </Button>
            </div>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center p-6">
            <Image src="/illustrations/import.png" alt="Importing" width={250} height={152} />
            <p className="mt-6 text-base font-semibold text-center text-gray-800">Import in progress</p>
            <p className="text-sm text-center text-gray-500">
              Please wait a moment, we will notify you when it is completed.
            </p>
            <Loader2 className="h-5 w-5 mt-4 animate-spin text-gray-900" />
          </div>
        )}
      </div>
    </div>
  )
}