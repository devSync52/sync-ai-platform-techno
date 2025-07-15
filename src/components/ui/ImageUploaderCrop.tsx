'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/getCroppedImg'
import { Slider } from './slider'
import { Button } from './button'
import { Input } from './input'
import Image from 'next/image'

interface Props {
  aspectRatio?: number
  title?: string
  onUploadAction: (file: File) => void
  initialImage?: string | null
}

export default function ImageUploaderCrop({
  aspectRatio = 1,
  title = 'Upload image',
  onUploadAction,
  initialImage = null
}: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
    const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
    setPreviewUrl(URL.createObjectURL(blob))
    onUploadAction(file)
    setImageSrc(null)
  }

  return (
    <div className="space-y-3">
      <label className="font-semibold text-sm">{title}</label>
      {previewUrl && (
        <div className="w-48 h-48 relative border rounded">
          <Image src={previewUrl} alt="preview" fill className="object-contain rounded" />
        </div>
      )}
      <Input type="file" accept="image/*" onChange={onFileChange} />

      {imageSrc && (
        <>
          <div className="relative h-72 bg-muted rounded overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="pt-2 space-y-2">
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={([val]) => setZoom(val)}
            />
            <Button onClick={handleCropSave}>Save Cropped Image</Button>
          </div>
        </>
      )}
    </div>
  )
}