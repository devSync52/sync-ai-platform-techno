'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { ScrollText, Sparkles, Repeat2 } from 'lucide-react'
import TrainingExamplesEditor from '@/components/xai/TrainingExamplesEditor'
import PersonalityEditor from '@/components/xai/PersonalityEditor'
import FollowupSettingsEditor from '@/components/xai/FollowupSettingsEditor'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'training', name: 'Training', icon: ScrollText },
  { id: 'personality', name: 'Personality', icon: Sparkles },
  { id: 'followup', name: 'Follow-up', icon: Repeat2 },
]

export default function XAISettingsPage() {
  const supabase = useSupabase()
  const [accountId, setAccountId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('training')

  useEffect(() => {
    const fetchAccountId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', user.id)
        .maybeSingle()

      setAccountId(data?.account_id || null)
    }

    fetchAccountId()
  }, [supabase])

  if (!accountId) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <aside className="w-full md:w-60 border-r bg-white shadow-sm py-6 px-4">
        <h2 className="text-2xl font-bold mb-4">AI Settings</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center w-full gap-2 px-3 py-2 rounded-md text-base font-medium',
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/40 text-muted-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10">
        {activeTab === 'training' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Training Examples</h1>
            <TrainingExamplesEditor accountId={accountId} />
          </>
        )}

        {activeTab === 'personality' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Personality</h1>
            <PersonalityEditor accountId={accountId} />
          </>
        )}

        {activeTab === 'followup' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Follow-up Settings</h1>
            <FollowupSettingsEditor accountId={accountId} />
          </>
        )}
      </main>
    </div>
  )
}