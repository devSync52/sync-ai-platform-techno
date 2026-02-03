'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface Props {
  accountId: string
  companyName: string
  onClose: () => void
}

export default function ImportOrdersModal({ accountId, companyName, onClose }: Props) {
  const [source, setSource] = useState<'sellercloud' | 'extensiv' | 'project44'>('sellercloud')
  const [step, setStep] = useState<'select' | 'loading'>('select')
  const [isPending, startTransition] = useTransition()

  const handleImport = () => {
    if (source === 'project44') return // segurança extra

    setStep('loading')
    startTransition(async () => {
      const res = await fetch('/api/sync-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: accountId, source })
      })

      const result = await res.json()
      if (result.success) {
        toast.success(`✅ Imported ${result.imported || 0} orders from ${source}`)
      } else {
        toast.error(result.error || 'Failed to import orders')
      }

      setTimeout(() => {
        setStep('select')
        onClose()
      }, 1000)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
        {step === 'select' && (
          <>
            <h2 className="text-xl font-semibold text-center mb-2">
              Import orders for <span className="text-primary">{companyName}</span>
            </h2>
            <p className="text-sm text-center text-gray-900 mb-6">Select the import channel</p>
            <div className="flex items-center justify-center gap-6 mb-6">
              {(['sellercloud', 'extensiv', 'project44'] as const).map((option) => (
                <label
                  key={option}
                  className={`flex flex-col items-center gap-2 cursor-pointer border rounded-lg p-2 ${
                    source === option ? 'border-[#3f2d90]' : 'border-transparent'
                  } ${option === 'project44' ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="source"
                    value={option}
                    checked={source === option}
                    onChange={() => option !== 'project44' && setSource(option)}
                    className="hidden"
                  />
                  <Image
                    src={`/logos/${option}.png`}
                    alt={option}
                    width={90}
                    height={90}
                  />
                  <span className="text-xs capitalize">{option}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} className="text-sm">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={isPending || source === 'project44'}
                className="text-sm"
              >
                {isPending ? 'Importing...' : 'Confirm Import'}
              </Button>
            </div>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center p-6">
            <Image src="/illustrations/import.png" alt="Importing" width={250} height={152} />
            <p className="mt-6 text-base font-semibold text-center text-gray-800">
              Import in progress
            </p>
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