'use client'

import { ReactNode } from 'react'

interface ChatTableProps {
  children: ReactNode
}

export function ChatTable({ children }: ChatTableProps) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow text-sm text-gray-700 border border-gray-0">
      <table className="min-w-full table-auto">{children}</table>
    </div>
  )
}

export function ChatTableHeader({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-0 border-b">{children}</thead>
}

export function ChatTableRow({ children }: { children: ReactNode }) {
  return <tr className="border-b">{children}</tr>
}

export function ChatTableHead({ children }: { children: ReactNode }) {
  return (
    <th className="text-left font-semibold p-2 whitespace-nowrap bg-white">
      {children}
    </th>
  )
}

export function ChatTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function ChatTableCell({ children }: { children: ReactNode }) {
  return (
    <td className="p-2 text-sm text-gray-800 whitespace-nowrap">{children}</td>
  )
}