'use client'

import { useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ImportOrdersModal from '@/components/modals/ImportOrdersModal'

interface Props {
  accountId: string
  companyName: string
  onImported?: () => void
}

export function SyncOrdersButton({
  accountId,
  companyName = '',
  onImported,
}: {
  accountId: string
  companyName?: string
  onImported?: () => void
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 text-white bg-[#3f2d90] hover:bg-[#3f2d90]/90"
      >
        <RefreshCcw className="h-4 w-4" />
        SynC Orders
      </Button>

      {showModal && (
        <ImportOrdersModal
          accountId={accountId}
          companyName={companyName}
          onImported={onImported}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
