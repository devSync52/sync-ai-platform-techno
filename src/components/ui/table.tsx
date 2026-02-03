'use client'

import { ReactNode, HTMLAttributes } from 'react'


interface TableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export default function Table({ children, className = '', ...props }: TableProps) {
  return (
    <div
      className={`overflow-x-auto bg-white rounded-lg shadow-md text-gray-600 ${className}`}
      {...props}
    >
      <table className="min-w-full table-auto border-collapse">
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children, className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  )
}

export function TableCell({ children, className = '', ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`p-3 text-sm ${className}`} {...props}>
      {children}
    </td>
  )
}

export function TableHeader({ children, className = '', ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`p-3 text-left text-xs font-semibold uppercase text-gray-500 ${className}`} {...props}>
      {children}
    </th>
  )
}