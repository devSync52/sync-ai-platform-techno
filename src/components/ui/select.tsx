"use client"

import * as React from "react"
import {
  Select as RadixSelect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectPortal,
  SelectViewport,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectIcon,
} from "@radix-ui/react-select"

import { cn } from "@/lib/utils"
import { Check, ChevronDown } from "lucide-react"

const Select = RadixSelect

const Trigger = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  React.ComponentPropsWithoutRef<typeof SelectTrigger>
>(({ className, children, ...props }, ref) => (
  <SelectTrigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-gray200 bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectIcon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
))
Trigger.displayName = "SelectTrigger"

const Content = React.forwardRef<
  React.ElementRef<typeof SelectContent>,
  React.ComponentPropsWithoutRef<typeof SelectContent>
>(({ className, children, ...props }, ref) => (
  <SelectPortal>
    <SelectContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
        className
      )}
      {...props}
    >
      <SelectScrollUpButton className="flex cursor-default items-center justify-center py-1 text-muted-foreground">
        ↑
      </SelectScrollUpButton>
      <SelectViewport className="p-1">{children}</SelectViewport>
      <SelectScrollDownButton className="flex cursor-default items-center justify-center py-1 text-muted-foreground">
        ↓
      </SelectScrollDownButton>
    </SelectContent>
  </SelectPortal>
))
Content.displayName = "SelectContent"

const Item = React.forwardRef<
  React.ElementRef<typeof SelectItem>,
  React.ComponentPropsWithoutRef<typeof SelectItem>
>(({ className, children, ...props }, ref) => (
  <SelectItem
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check className="h-4 w-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>{children}</SelectItemText>
  </SelectItem>
))
Item.displayName = "SelectItem"

export {
  Select,
  Trigger as SelectTrigger,
  SelectValue,
  Content as SelectContent,
  Item as SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
}