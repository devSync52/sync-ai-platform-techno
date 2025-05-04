'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'

export default function ClientsPage() {
  const supabase = useSupabaseClient()
  const session = useSession()

  const [clients, setClients] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<'full_name' | 'email'>('full_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    if (!session) return

    async function fetchClients() {
      const { data, error } = await supabase.from('profile').select('*')
      if (error) {
        console.error('Error fetching clients:', error)
        return
      }

      let filtered = data.filter((c: any) =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )

      let sorted = filtered.sort((a: any, b: any) => {
        const aVal = a[sortColumn] || ''
        const bVal = b[sortColumn] || ''
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      })

      setClients(sorted)
    }

    fetchClients()
  }, [session, searchTerm, sortColumn, sortDirection])

  const paginatedClients = clients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(clients.length / itemsPerPage)

  function handleSort(column: typeof sortColumn) {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  function renderSortIcon(column: typeof sortColumn) {
    if (sortColumn !== column) return '⇅'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Clients</h2>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="py-3 px-4 text-left font-medium cursor-pointer" onClick={() => handleSort('full_name')}>
                Name {renderSortIcon('full_name')}
              </th>
              <th className="py-3 px-4 text-left font-medium cursor-pointer" onClick={() => handleSort('email')}>
                Email {renderSortIcon('email')}
              </th>
              <th className="py-3 px-4 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedClients.map((client, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">{client.full_name}</td>
                <td className="py-3 px-4 text-gray-600">{client.email}</td>
                <td className="py-3 px-4 text-sm">
                  <button className="text-blue-600 hover:underline inline-flex items-center gap-1">
                    <Info size={14} /> Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center p-4 text-sm">
          <span className="text-gray-600">
            Showing {itemsPerPage * (currentPage - 1) + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, clients.length)} of {clients.length}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
