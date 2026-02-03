'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import ImportProductsModal from '@/components/modals/ImportProductsModal'
import ImportProductsClient from './ImportProductsClient'

interface Props {
  accountId: string
  companyName: string
  userRole: string
}

export default function ProductsPage({ accountId, companyName, userRole }: Props) {
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
  }, [accountId, companyName, userRole])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Inventory list</h1>
        {userRole !== 'client' && (
          <Button onClick={() => setShowModal(true)}>Import Product</Button>
        )}
      </div>

      <ImportProductsClient
        accountId={accountId}
        companyName={companyName}
        userRole={userRole}
      />

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