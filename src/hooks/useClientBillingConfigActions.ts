'use client'

import { useCallback, useState } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import type { BillingConfig } from '@/types/billing'
import {
  fetchClientServicesEffective,
  setClientServiceOverride,
  setClientServiceVisibility,
  unsetClientServiceOverride,
  type ClientServiceEffective,
} from '@/lib/supabase/billing'

const toCents = (usd: number) => Math.round((usd ?? 0) * 100)

export type BillingFormState = {
  billingActive: boolean
  method: 'prepaid' | 'postpaid'
  minMonthlyFee: number
  discountPct: number
  taxExempt: boolean
  taxId: string
  invoiceCycle: 'monthly' | 'biweekly' | 'weekly'
  cutDay: number
  templatePrimary: string
}

export type ServiceCatalogRow = {
  id: string
  name: string
  category: string
  unit: string
  defaultRate?: number
  active?: boolean
}

export type ServiceOverrideRow = {
  clientId: string
  planServiceId: string
  overrideRate?: number
  activeOverride?: boolean
}

type UseClientBillingConfigActionsArgs = {
  parentAccountId: string
  clientId: string
}

export function useClientBillingConfigActions({
  parentAccountId,
  clientId,
}: UseClientBillingConfigActionsArgs) {
  const supabase = useSupabase()

  const [savingConfig, setSavingConfig] = useState(false)
  const [savingOverrides, setSavingOverrides] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  /**
   * Salva a config de alto nível do cliente (aba Billing / Discounts / Taxes / Cycle / Template).
   * Usa a API `/api/billing/configs/[clientId]` que você já criou.
   */
  const saveConfig = useCallback(
    async (form: BillingFormState): Promise<BillingConfig | null> => {
      try {
        setSavingConfig(true)
        setLastError(null)

        const payload = {
          parent_account_id: parentAccountId,
          billing_active: form.billingActive,
          billing_method: form.method,
          min_monthly_fee_cents: toCents(form.minMonthlyFee),
          discount_pct: form.discountPct,
          tax_exempt: form.taxExempt,
          tax_id: form.taxId,
          invoice_cycle: form.invoiceCycle,
          cut_off_day: form.cutDay,
          template_primary_color: form.templatePrimary,
        }

        console.log('[billing] saveConfig payload:', {
          clientId,
          parentAccountId,
          payload,
        })

        const res = await fetch(`/api/billing/configs/${clientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          let msg = 'Failed to save config.'
          try {
            const errJson = await res.json()
            if (errJson?.error) msg = errJson.error
          } catch {
            // ignore
          }
          setLastError(msg)
          throw new Error(msg)
        }

        let updated: BillingConfig | null = null
        try {
          const json = await res.json()
          updated = (json?.data ?? null) as BillingConfig | null
        } catch {
          // ignore
        }

        return updated
      } catch (e) {
        console.error('[billing] saveConfig failed:', e)
        if (!lastError) setLastError('Failed to save config.')
        return null
      } finally {
        setSavingConfig(false)
      }
    },
    [clientId, lastError]
  )

  /**
   * Salva overrides de serviços (aba Pricing Overrides):
   * - Visibilidade (hide/show)
   * - Rate override em cents
   * Depois recarrega a lista efetiva e retorna.
   */
  const saveOverrides = useCallback(
    async (args: {
      selectedWarehouseId: string
      servicesCatalog: ServiceCatalogRow[]
      overrides: ServiceOverrideRow[]
    }): Promise<ClientServiceEffective[] | null> => {
      const { selectedWarehouseId, servicesCatalog, overrides } = args

      if (!selectedWarehouseId) return null

      try {
        setSavingOverrides(true)
        setLastError(null)

        for (const srv of servicesCatalog) {
          const ov = overrides.find(o => o.planServiceId === srv.id)

          const desiredVisible = !(ov?.activeOverride === false)

          await setClientServiceVisibility(supabase, {
            parentAccountId,
            clientAccountId: clientId,
            warehouseId: selectedWarehouseId,
            serviceId: srv.id,
            visible: desiredVisible,
          })

          if (ov && typeof ov.overrideRate === 'number') {
            await setClientServiceOverride(supabase, {
              parentAccountId,
              clientAccountId: clientId,
              warehouseId: selectedWarehouseId,
              serviceId: srv.id,
              rateCents: Math.round(ov.overrideRate * 100),
            })
          } else {
            await unsetClientServiceOverride(supabase, {
              parentAccountId,
              clientAccountId: clientId,
              warehouseId: selectedWarehouseId,
              serviceId: srv.id,
            })
          }
        }

        const list = await fetchClientServicesEffective(
          supabase,
          parentAccountId,
          clientId,
          selectedWarehouseId
        )

        return list ?? []
      } catch (e) {
        console.error('[billing] saveOverrides failed:', e)
        setLastError('Failed to save overrides.')
        return null
      } finally {
        setSavingOverrides(false)
      }
    },
    [supabase, parentAccountId, clientId]
  )

  return {
    saveConfig,
    saveOverrides,
    savingConfig,
    savingOverrides,
    lastError,
  }
}