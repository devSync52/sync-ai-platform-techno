'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

interface SheetProps extends React.ComponentPropsWithoutRef<typeof Dialog.Root> {}

function Sheet({ children, ...props }: SheetProps) {
  return <Dialog.Root {...props}>{children}</Dialog.Root>
}

const SheetTrigger = Dialog.Trigger

function SheetContent({
  side = 'right',
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Content> & { side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
      <Dialog.Content
        className={cn(
          'fixed z-50 bg-white shadow-lg transition-all',
          side === 'right' && 'inset-y-0 right-0 w-96',
          side === 'left' && 'inset-y-0 left-0 w-96',
          side === 'top' && 'inset-x-0 top-0 h-1/2',
          side === 'bottom' && 'inset-x-0 bottom-0 h-1/2',
          className
        )}
        {...props}
      />
    </Dialog.Portal>
  )
}

export { Sheet, SheetTrigger, SheetContent }