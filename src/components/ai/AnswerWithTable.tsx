'use client'

import {
  ChatTable,
  ChatTableBody,
  ChatTableCell,
  ChatTableHead,
  ChatTableHeader,
  ChatTableRow
} from '@/components/ui/chat-table'

interface AnswerWithTableProps {
  message: string
  rows: Record<string, any>[]
}

export default function AnswerWithTable({ message, rows }: AnswerWithTableProps) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-gray-700">{message}</p>
  }

  const headers = Object.keys(rows[0])

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">{message}</p>
      <ChatTable>
        <ChatTableHeader>
          <ChatTableRow>
            {headers.map((key) => (
              <ChatTableHead key={key}>{key.replace(/_/g, ' ')}</ChatTableHead>
            ))}
          </ChatTableRow>
        </ChatTableHeader>
        <ChatTableBody>
          {rows.map((row, i) => (
            <ChatTableRow key={i}>
              {headers.map((key) => (
                <ChatTableCell key={key}>{String(row[key] ?? '')}</ChatTableCell>
              ))}
            </ChatTableRow>
          ))}
        </ChatTableBody>
      </ChatTable>
    </div>
  )
}