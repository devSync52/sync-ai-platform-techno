'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Cropper from 'react-easy-crop'
import { useCallback, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { getCroppedImg } from '@/lib/getCroppedImg'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload } from 'lucide-react'

export interface EditAvatarModalProps {
  open: boolean
  onClose: () => void
  title: string
}

export default function EditAvatarModal({ open, onClose, title }: EditAvatarModalProps) {
  const [image, setImage] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!image || !croppedAreaPixels) return
    const croppedBlob = await getCroppedImg(image, croppedAreaPixels)
  
    if (!croppedBlob) {
      console.error('Cropped image is null')
      return
    }
  
    const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' })
    console.log('[Avatar Saved] ✅', file)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!image ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <Input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Upload className="w-5 h-5" />
              <span className="text-sm">Upload an image</span>
            </label>
          ) : (
            <>
              <div className="relative w-full aspect-square bg-muted overflow-hidden rounded-md">
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}