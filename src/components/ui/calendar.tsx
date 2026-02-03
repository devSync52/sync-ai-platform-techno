'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { cn } from '@/lib/utils'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-gray-500 rounded-md w-9 font-normal text-xs',
        row: 'flex w-full mt-2',
        cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary/10 rounded-md hover:bg-primary/5',
        day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
        day_selected: 'bg-primary text-white hover:bg-primary',
        day_today: 'text-primary',
        day_outside: 'text-gray-400 opacity-50',
        day_disabled: 'text-gray-300 opacity-50',
        ...classNames,
      }}
      showOutsideDays
      fixedWeeks
      {...props}
    />
  )
}

Calendar.displayName = 'Calendar'

export { Calendar }