'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Modal = Dialog.Root
export const ModalTrigger = Dialog.Trigger

export function ModalContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      <Dialog.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-lg',
          className
        )}
      >
        <Dialog.Title asChild>
          <span className="sr-only">Modal Title</span>
        </Dialog.Title>
        <div className="absolute right-4 top-4">
          <Dialog.Close asChild>
            <button aria-label="Close">
              <X className="h-5 w-5 text-gray-500 hover:text-gray-800" />
            </button>
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}