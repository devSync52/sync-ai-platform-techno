// 'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWarehouseInfo } from '@/lib/data/warehouses'

type QuoteShipFromSectionProps = {
  accountId: string
}

export function QuoteShipFromSection({ accountId }: QuoteShipFromSectionProps) {
  const [warehouse, setWarehouse] = useState<{
    name: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    zip_code: string
    country: string
  } | null>(null)

  useEffect(() => {
    async function fetchWarehouse() {
      const data = await getWarehouseInfo(accountId)
      setWarehouse({
        name: data.name ?? '',
        address_line_1: data.address_line_1 ?? '',
        address_line_2: data.address_line_2 ?? '',
        city: data.city ?? '',
        state: data.state ?? '',
        zip_code: data.zip_code ?? '',
        country: data.country ?? '',
      })
    }
    if (accountId) fetchWarehouse()
  }, [accountId])

  if (!warehouse) return <p>Loading warehouse info...</p>

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Ship From (Warehouse)</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Warehouse Name</Label>
          <Input value={warehouse.name} readOnly />
        </div>
        <div>
          <Label>Address 1</Label>
          <Input value={warehouse.address_line_1} readOnly />
        </div>
        <div>
          <Label>Address 2</Label>
          <Input value={warehouse.address_line_2 || ''} readOnly />
        </div>
        <div>
          <Label>City</Label>
          <Input value={warehouse.city} readOnly />
        </div>
        <div>
          <Label>State</Label>
          <Input value={warehouse.state} readOnly />
        </div>
        <div>
          <Label>ZIP Code</Label>
          <Input value={warehouse.zip_code} readOnly />
        </div>
        <div>
          <Label>Country</Label>
          <Input value={warehouse.country} readOnly />
        </div>
      </CardContent>
    </Card>
  )
}