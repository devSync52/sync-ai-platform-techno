import ImageUploaderCrop from './ImageUploaderCrop'
import { uploadImageToSupabase } from '@/lib/upload'

export function ProfilePictureUploader({ userId, existingUrl }: { userId: string, existingUrl?: string }) {
  return (
    <ImageUploaderCrop
      title="Profile Picture"
      aspectRatio={1}
      initialImage={existingUrl}
      onUploadAction={async (file: File) => {
        const url = await uploadImageToSupabase(file, `profiles/${userId}.jpg`)
        console.log('✅ Profile image uploaded to:', url)
        window.location.reload()
      }}
    />
  )
}