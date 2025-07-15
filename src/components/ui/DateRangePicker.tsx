'use client'

import * as React from 'react'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DayPicker, DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface DateRangePickerProps {
  date: DateRange | undefined
  setDate: (range: DateRange | undefined) => void
}

const predefinedRanges = [
    {
      label: 'Last 7 days',
      range: {
        from: subDays(new Date(), 6),
        to: new Date(),
      },
    },
    {
      label: 'Last 15 days',
      range: {
        from: subDays(new Date(), 14),
        to: new Date(),
      },
    },
    {
      label: 'Last 30 days',
      range: {
        from: subDays(new Date(), 29),
        to: new Date(),
      },
    },
    {
      label: 'This month',
      range: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
    },
    {
      label: 'Last month',
      range: {
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1)),
      },
    },
  ]

export function DateRangePicker({ date, setDate }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  function formatLabel(range: DateRange | undefined) {
    if (!range?.from || !range?.to) return 'Select a date range'
    return `${format(range.from, 'dd MMM yyyy')} – ${format(range.to, 'dd MMM yyyy')}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-auto justify-start text-left font-normal text-sm"><p>Selected period</p>
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span>{formatLabel(date)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[95vw] md:w-full max-w-[700px] flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0 px-2 py-4 md:p-4 rounded-xl shadow-xl border bg-white z-[9999] mr-4 overflow-x-auto max-h-[90vh] overflow-y-auto">
        {/* Botões laterais */}
        <div className="w-full md:w-44 border-r md:pr-4">
          <div className="flex flex-row flex-wrap gap-2 md:flex-col md:gap-2 md:mb-0 mb-2 md:justify-start justify-center">
            {predefinedRanges.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="text-xs md:text-sm whitespace-nowrap px-3 py-1 border border-muted rounded-full text-primary hover:bg-muted"
                onClick={() => {
                  setDate(item.range)
                  setOpen(false)
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Calendário e ações */}
        <div className="w-full flex flex-col items-center space-y-3 text-xs">
          <DayPicker
            initialFocus
            mode="range"
            numberOfMonths={2}
            selected={date}
            onSelect={setDate}
            showOutsideDays={false}
            modifiersClassNames={{
              selected: 'bg-primary text-white',
              range_start: 'bg-primary text-white',
              range_end: 'bg-primary text-white',
              range_middle: 'bg-primary/10 text-black',
              today: '',
            }}
            className="flex justify-center flex-col md:flex-row text-sm"
            classNames={{
              months: 'flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 text-primary font-bold',
              month: 'space-y-2',
              caption: 'text-center font-medium',
              head_cell: 'text-muted-foreground w-8 text-[12px]',
              cell: 'w-8 h-8 text-center text-sm p-0',
              day: 'h-8 w-8 p-0 font-normal text-center aria-selected:opacity-100',
            }}
          />
          <div className="flex justify-end gap-2 w-full pt-2 border-t">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}