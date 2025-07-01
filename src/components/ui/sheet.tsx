'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'

// Wrapper principal
interface SheetProps extends React.ComponentPropsWithoutRef<typeof Dialog.Root> {}
function Sheet({ children, ...props }: SheetProps) {
  return <Dialog.Root {...props}>{children}</Dialog.Root>
}

// Trigger para abrir
const SheetTrigger = Dialog.Trigger

// Conteúdo do modal lateral
function SheetContent({
  side = 'right',
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Dialog.Content> & {
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
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
      >
        <div className="p-6 space-y-4">
          {/* ✅ Título obrigatório para acessibilidade */}
          <SheetTitle>Customize your dashboard</SheetTitle>

          {/* Conteúdo passado ao Sheet */}
          {children}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  )
}

// Header genérico (opcional)
function SheetHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col space-y-1.5 p-6">{children}</div>
}

// Título acessível
const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
SheetTitle.displayName = 'SheetTitle'

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
}