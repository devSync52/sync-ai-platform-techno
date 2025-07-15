import { useState, useEffect } from 'react'
import ImageUploaderCrop from './ImageUploaderCrop'
import { uploadAccountLogo } from '@/lib/upload'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Label } from './label'
import { useSupabase } from '@/components/supabase-provider'

const aspectOptions = [
  { label: '1:1', value: 1 },
  { label: '3:1', value: 3 },
  { label: '5:1', value: 5 },
  { label: '7:1', value: 7 }
]

export function CompanyLogoUploader({
  userId,
  existingUrl,
  onUploadComplete
}: {
  userId: string
  existingUrl?: string
  onUploadComplete?: (url: string) => void
}) {
  const [aspectRatio, setAspectRatio] = useState(3)
  const [accountId, setAccountId] = useState<string | null>(null)

  const supabase = useSupabase()

  useEffect(() => {
    const fetchAccountId = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('account_id')
        .eq('id', userId)
        .single()
      if (!error && data?.account_id) {
        setAccountId(data.account_id)
      }
    }
    fetchAccountId()
  }, [userId])

  return (
    <div className="space-y-4">
      <div>
        

      {accountId && (
        <ImageUploaderCrop
          title="Company Logo"
          aspectRatio={aspectRatio}
          initialImage={existingUrl}
          onUploadAction={async (file: File) => {
            console.log('[CompanyLogoUploader:start upload]', { file, accountId })
            const url = await uploadAccountLogo(file, `${accountId}-${Date.now()}`)
            console.log('[CompanyLogoUploader:success]', { url })

            await supabase
              .from('accounts')
              .update({ logo: url })
              .eq('id', accountId)

            if (onUploadComplete) {
              const versionedUrl = `${url}?v=${Date.now()}`
              onUploadComplete(versionedUrl)

              window.dispatchEvent(new CustomEvent('logo-updated', { detail: { logoUrl: versionedUrl } }))

              window.location.reload()
            }
          }}
        />
      )}
      {existingUrl && onUploadComplete && (
        <button
          type="button"
          onClick={() => onUploadComplete('')}
          className="mt-2 text-sm text-red-600 hover:underline flex items-center gap-1"
        >
          🗑️ Remove logo
        </button>
      )}
      <Label className="mt-2 mb-2 block">Crop Ratio</Label>
        <div className="flex gap-3 flex-wrap">
          {aspectOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md border w-[102px] transition text-center text-[14px]
                ${aspectRatio === opt.value ? 'bg-primary text-white border-primary' : 'bg-muted text-muted-foreground border-muted'}`}
              onClick={() => setAspectRatio(opt.value)}
            >
              <img
                src={`/placeholders/ratio-${opt.value}x1${aspectRatio === opt.value ? '-active' : ''}.svg`}
                alt={opt.label}
                className="w-16 h-16 object-contain opacity-80"
              />
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}