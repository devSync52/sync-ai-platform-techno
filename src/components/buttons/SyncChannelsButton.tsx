'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import ImportCustomersModal from '@/components/modals/ImportCustomersModal'

export function SyncChannelsButton({ accountId, companyName }: { accountId: string, companyName: string }) {
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Callback opcional do modal (se quiser mostrar mensagem pós-sync)
  const handleClose = () => {
    setShowModal(false)
    setMessage('✅ Sync finished!') // ou personalize se quiser
    // Pode refetchar a tabela de channels aqui se necessário
  }

  return (
    <div className="flex items-center gap-4 mt-2">
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm text-white bg-[#3f2d90] hover:bg-[#3f2d90]/90"
      >
        <RotateCcw size={16} />
        SynC Customers
      </button>

      {message && <span className="text-sm">{message}</span>}

      {showModal && (
        <ImportCustomersModal
          accountId={accountId}
          companyName={companyName}
          onClose={handleClose}
        />
      )}
    </div>
  )
}