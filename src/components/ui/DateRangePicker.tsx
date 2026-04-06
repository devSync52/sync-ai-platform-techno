'use client'

import { CalendarIcon } from 'lucide-react'
import { DateRangePicker as ReactDateRangePicker } from 'react-date-range';
import { DateRange } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { Button } from './button';
import { useEffect, useMemo, useState } from 'react';
import moment from 'moment-timezone';

interface DateRangePickerProps {
  date: DateRange | undefined
  setDate: (range: DateRange | undefined) => void
}

const PRIMARY = '#3f2d90'

export function DateRangePicker({ date, setDate }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [internal, setInternal] = useState<DateRange | undefined>(date)

  useEffect(() => {
    setInternal(date)
  }, [date])

  const label = date?.from && date?.to ? `${moment(date.from).format('MMM DD, YYYY')} - ${moment(date.to).format('MMM DD, YYYY')}` : 'Select date range'

  const selectionRange = useMemo(() => ({
    startDate: new Date(internal?.from || new Date()),
    endDate: new Date(internal?.to || new Date()),
    key: 'selection',
  }), [internal])

  const handleApply = () => {
    setDate(internal);
    setOpen(false)
  }
  const handleCancel = () => {
    setInternal(date);
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className='inline-flex items-center gap-2 h-[36px] px-4 rounded-[4px] border border-gray-400 bg-white font-[13px] leading-[20px]'>
          <CalendarIcon style={{ width: 15, height: 15, color: '#757575', flexShrink: 0 }} />
          {label}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={6} className='p-0 w-auto rounded-md border border-gray-400 overflow-hidden z-50 bg-white shadow-lg shadow-slate-200'>
        {/* Calendar */}
        <div style={{ padding: '12px 16px' }}>
          <ReactDateRangePicker
            ranges={[selectionRange]}
            onChange={(ranges) => setInternal({ from: ranges.selection.startDate, to: ranges.selection.endDate })}
            maxDate={new Date()}
            moveRangeOnFirstSelection={false}
            months={2}
            direction="horizontal"
            rangeColors={[PRIMARY]}
          />
        </div>

        <div style={{ height: 1, background: '#e0e0e0' }} />

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 16px' }}>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
