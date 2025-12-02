import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const warehouseId = params.id

    const { data, error } = await supabase
      .from('b1_v_warehouse_services_1')
      .select(`
        warehouse_service_id,
        warehouse_id,
        global_service_id,
        category,
        name,
        event,
        unit,
        rate_cents,
        rate_usd,
        active
      `)
      .eq('warehouse_id', warehouseId)
      .eq('active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('[warehouse_services] error', error)
      return NextResponse.json(
        { success: false, message: 'Failed to load warehouse services' },
        { status: 500 }
      )
    }

    const rows = (data ?? []).map((row) => ({
      id: row.global_service_id as string,          // esse é o que vamos usar na invoice
      warehouseServiceId: row.warehouse_service_id as string,
      warehouseId: row.warehouse_id as string,
      category: row.category as string,
      name: row.name as string,
      event: row.event as string,
      unit: row.unit as string,
      rateCents: Number(row.rate_cents ?? 0),
      rateUsd: Number(row.rate_usd ?? 0),
      active: !!row.active,
    }))

    return NextResponse.json({
      success: true,
      data: rows,
    })
  } catch (err: any) {
    console.error('[warehouse_services] unexpected', err)
    return NextResponse.json(
      { success: false, message: err?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}