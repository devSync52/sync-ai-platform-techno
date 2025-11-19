'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { PostgrestError } from '@supabase/supabase-js'
import QuoteStepsHeader, { QuoteStepsHeaderProps } from './QuoteStepsHeader'
import { Step1ClientSelection } from './steps/Step1ClientSelection'
import { Step2WarehouseSelection } from './steps/Step2WarehouseSelection'
import Step3ShippingDetails from './steps/Step3ShippingDetails'
import Step4PackageDetails from './steps/Step4PackageDetails'
import Step5DeliveryPreferences from './steps/Step5DeliveryPreferences'
import { StepSelectService } from './steps/StepSelectService'

type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

const supabase = createClientComponentClient<Database>()

export default function QuoteWizard() {
  const { id: quoteId } = useParams()
  const [quoteData, setQuoteData] = useState<Database['public']['Tables']['saip_quote_drafts']['Row'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!quoteId) return

    const fetchQuote = async () => {
      const { data, error } = await supabase
        .from('saip_quote_drafts')
        .select('*')
        .eq('id', Array.isArray(quoteId) ? quoteId[0] : quoteId)
        .single()

      if (error) {
        setError(error)
      } else {
        setQuoteData(data)
      }

      setLoading(false)
    }

    fetchQuote()
  }, [quoteId])

  // Estado para manter o client atualizado
  const [clientId, setClientId] = useState<string | null>(
    typeof quoteData?.client === 'string' ? quoteData.client : quoteData?.client?.toString() ?? null
  )

  useEffect(() => {
    if (currentStep === 3) {
      console.log('🚚 Itens carregados:', quoteData?.items)
    }
  }, [currentStep, quoteData])

  if (loading)
    return (
      <div className="flex h-[60vh] items-center justify-center px-3 text-sm text-muted-foreground">
        Loading...
      </div>
    )

  if (error)
    return (
      <div className="px-3 py-4 text-sm text-destructive">
        Error loading quote: {error.message}
      </div>
    )

  return (
    <div className="min-h-screen px-3 py-3 md:px-6 md:py-6 pb-[env(safe-area-inset-bottom)]">
      {/* Sticky / scrollable steps header on mobile */}
      <div className="sticky top-[env(safe-area-inset-top)] z-30 -mx-3 border-b bg-background/90 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:backdrop-blur-0">
        <div className="overflow-x-auto px-3 md:overflow-visible md:px-0">
          <QuoteStepsHeader currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto mt-3 max-w-5xl md:mt-4">
        {currentStep === 0 && (
          <Step1ClientSelection
            draftId={quoteData!.id}
            initialClient={clientId}
            onClientChange={(newClientId) => setClientId(newClientId)}
            onNext={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 1 && (
          <Step2WarehouseSelection
            draftId={quoteData!.id}
            initialWarehouse={quoteData!.ship_from as string | null}
            onWarehouseChange={(warehouseId) => {
              setQuoteData((prev) => (prev ? { ...prev, warehouse_id: warehouseId } : prev))
            }}
            onNext={() => setCurrentStep(2)}
            onBack={() => setCurrentStep(0)}
          />
        )}
        {currentStep === 2 && (
          <Step3ShippingDetails
            draftId={quoteData!.id}
            initialShipTo={quoteData!.ship_to}
            initialPreferences={quoteData!.preferences}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <Step4PackageDetails
            draftId={quoteData!.id}
            initialItems={(quoteData!.items as any[]) || []}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <Step5DeliveryPreferences
            draftId={quoteData!.id}
            initialPreferences={quoteData!.preferences || {}}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 5 && (
          <StepSelectService
            draftId={quoteData!.id}
            onBack={() => setCurrentStep(4)}
          />
        )}
      </div>
    </div>
  )
}