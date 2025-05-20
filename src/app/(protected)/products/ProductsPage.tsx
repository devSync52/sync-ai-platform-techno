'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ImportProductsModal from '@/components/modals/ImportProductsModal'
import ImportProductsClient from './ImportProductsClient'

interface Props {
  accountId: string
  companyName: string
}

export default function ProductsPage({ accountId, companyName }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Products List</h1>
        <Button onClick={() => setShowModal(true)}>Import Products</Button>
      </div>

      <ImportProductsClient accountId={accountId} />

      {showModal && (
        <ImportProductsModal
          accountId={accountId}
          companyName={companyName}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}