'use client'

import { ReactNode } from 'react'

interface TableProps {
  children: ReactNode
}

export default function Table({ children }: TableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-md text-gray-600">
      <table className="min-w-full table-auto border-collapse ">
        {children}
      </table>
    </div>
  )
}