'use client'

import { useState } from 'react'
import { X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { parseISO } from 'date-fns'

export interface FilterBarProps {
  title: string
  placeholder?: string
  searchTerm: string
  onSearch: (value: string) => void
  onReset: () => void
  totalCount: number
  filteredCount: number
  filters: {
    label: string
    value: string
    onChange: (value: string) => void
    type?: 'text' | 'date'
    options?: string[]
  }[]
}

export default function FilterBar({
  title,
  placeholder,
  searchTerm,
  onSearch,
  onReset,
  totalCount,
  filteredCount,
  filters
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const hasFiltersActive = filters.some(f => f.value && f.value !== 'All')

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Title + Total */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <h2 className="text-lg font-bold text-primary">Filters</h2><br />
      </div>

      {/* Filters + Search */}
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-end">
        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={`${placeholder}`}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-64"
        />

        {/* Toggle filters (mobile) */}
        <Button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden flex items-center gap-1 text-sm text-white border border-gray-300 rounded px-3 py-2"
        >
          <Filter className="w-6 h-6" />
          Filters
        </Button>

        {/* Filters (desktop or mobile toggle) */}
        <div className={`flex flex-wrap gap-2 ${showFilters ? 'block' : 'hidden sm:flex'}`}>
        {filters.map((filter, index) => {
  if (filter.type === 'date') {
    return (
      <DatePicker
        key={index}
        selected={filter.value ? parseISO(filter.value) : null}
        onChange={(date: Date | null) => filter.onChange(date?.toISOString().split('T')[0] || '')}
        placeholderText={filter.label}
        dateFormat="MM/dd/yyyy"
        className="border border-gray-300 rounded px-2 py-2 text-sm"
      />
    )
  }
  return (
    <select
      key={index}
      value={filter.value}
      onChange={(e) => filter.onChange(e.target.value)}
      className="border border-gray-300 rounded px-2 py-2 text-sm bg-white"
    >
      {filter.options?.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
})}
        </div>

        {/* Reset button */}
        {hasFiltersActive && (
          <Button
            onClick={onReset}
            className="flex items-center gap-1 text-sm text-white"
          >
            <X className="w-4 h-4" />
            Clear filters
          </Button>
        )}
        <span className="text-sm text-gray-500">
          Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong>
        </span>
      </div>
    </div>
  )
}
