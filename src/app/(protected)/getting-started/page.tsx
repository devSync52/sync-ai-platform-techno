'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useSupabase } from '@/components/supabase-provider'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SyncChannelsButton } from '@/components/buttons/SyncChannelsButton'
import { SyncOrdersButton } from '@/components/buttons/SyncOrdersButton'
import ImportProductsModal from '@/components/modals/ImportProductsModal'

interface Step {
  title: string
  description: string
  href: string
  key: string
  completed: boolean
  disabled: boolean
  actionLabel: string
}

export default function GettingStartedPage() {
  const supabase = useSupabase()
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [showProductModal, setShowProductModal] = useState(false)

  useEffect(() => {
    const fetchSetupStatus = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: userData } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user?.id)
        .maybeSingle()

      const accountId = userData?.account_id
      if (!accountId) {
        toast.error('Account ID not found')
        setLoading(false)
        return
      }

      setAccountId(accountId)

      const { data: accountData } = await supabase
        .from('accounts')
        .select('name')
        .eq('id', accountId)
        .maybeSingle()

      setCompanyName(accountData?.name ?? '')

      const [{ data: integrations }, { data: clients }, { data: inventory }, { data: orders }] =
        await Promise.all([
          supabase
            .from('account_integrations')
            .select('id')
            .eq('account_id', accountId)
            .eq('status', 'active')
            .limit(1),
          supabase.from('channels').select('id').eq('account_id', accountId).limit(1),
          supabase.from('sellercloud_products').select('id').eq('account_id', accountId).limit(1),
          supabase.from('sellercloud_orders').select('id').eq('account_id', accountId).limit(1),
        ])

      const hasIntegration = Boolean(integrations?.length)

      const stepsData: Step[] = [
        {
          key: 'integration',
          title: 'Connect a data source',
          description: 'Link your Sellercloud or Extensiv account.',
          href: '/settings/integrations',
          completed: hasIntegration,
          disabled: false,
          actionLabel: hasIntegration ? 'Connect another' : 'Go to step',
        },
        {
          key: 'clients',
          title: 'Import clients',
          description: 'Import your customer list from the connected platform.',
          href: '/channels',
          completed: Boolean(clients?.length),
          disabled: !hasIntegration,
          actionLabel: 'Go to step',
        },
        {
          key: 'inventory',
          title: 'Import inventory',
          description: 'Sync your product and stock data.',
          href: '/products',
          completed: Boolean(inventory?.length),
          disabled: !hasIntegration,
          actionLabel: 'Go to step',
        },
        {
          key: 'orders',
          title: 'Import orders',
          description: 'Pull in recent orders to enable AI insights.',
          href: '/orders',
          completed: Boolean(orders?.length),
          disabled: !hasIntegration,
          actionLabel: 'Go to step',
        },
      ]

      setSteps(stepsData)
      setLoading(false)
    }

    fetchSetupStatus()
  }, [supabase])

  const completedCount = steps.filter((s) => s.completed).length
  const allDone = completedCount === steps.length

  return (
    <div className="p-6 sm:p-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Getting Started
        </h1>
        <p className="text-gray-600 mt-2 max-w-xl">
          Follow these steps to activate your SynC AI experience. Once completed, your dashboard will be fully functional.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
        {steps.map((step) => (
          <div
            key={step.key}
            className={cn(
              'border rounded-2xl p-5 shadow-sm bg-white flex flex-col justify-between transition hover:shadow-md',
              step.completed ? 'border-green-500' : 'border-primary',
              step.disabled && 'opacity-50 pointer-events-none cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              {step.completed ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : (
                <AlertCircle className="text-primary" size={20} />
              )}
              <h2 className="font-semibold text-lg">{step.title}</h2>
            </div>

            <p className="text-sm text-gray-600 mb-4">{step.description}</p>

            {step.key === 'clients' && accountId ? (
              <div className="mt-auto">
                <SyncChannelsButton accountId={accountId} />
              </div>
            ) : step.key === 'inventory' && accountId ? (
              <div className="mt-auto">
                <Button onClick={() => setShowProductModal(true)}>
                  Import Product
                </Button>
              </div>
            ) : step.key === 'orders' && accountId ? (
              <div className="mt-auto">
                <SyncOrdersButton accountId={accountId} />
              </div>
            ) : (
              <Link
                href={step.href}
                className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-auto"
              >
                {step.actionLabel}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {showProductModal && accountId && (
        <ImportProductsModal
          accountId={accountId}
          companyName={companyName}
          onClose={() => setShowProductModal(false)}
        />
      )}

      {!loading && allDone && (
        <div className="mt-10 bg-green-100 text-green-800 px-4 py-3 rounded-xl font-medium shadow-sm border border-green-300">
          ✅ All steps completed. You're ready to use the full platform!
        </div>
      )}
    </div>
  )
}