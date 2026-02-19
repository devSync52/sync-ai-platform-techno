'use client'

import { useEffect, useMemo, useState } from 'react'
import Table from '@/components/ui/table'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, X } from 'lucide-react'

type AuthType = 'local' | 'wms_extensiv'
type CustomerRole = 'client'
type CustomerStatus = 'active' | 'disabled'

type CustomerUser = {
  id: string
  name: string | null
  email: string
  role: string
  created_at: string | null
  last_login_at: string | null
  has_logged_in: boolean | null
  auth_type: AuthType
  wms_user_identifier: string | null
  status: CustomerStatus
}

type FormState = {
  name: string
  email: string
  role: CustomerRole
  authType: AuthType
  temporaryPassword: string
  wmsUserIdentifier: string
  status: CustomerStatus
}

interface ChannelsClientProps {
  accountId: string
}

const defaultForm: FormState = {
  name: '',
  email: '',
  role: 'client',
  authType: 'local',
  temporaryPassword: '',
  wmsUserIdentifier: '',
  status: 'active',
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function getAuthTypeLabel(authType: AuthType) {
  if (authType === 'local') return 'Local'
  return 'Extensive WMS-based'
}

export default function ChannelsClient({ accountId }: ChannelsClientProps) {
  const [customers, setCustomers] = useState<CustomerUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerUser | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/customers', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to load customers')
      }
      setCustomers((payload.customers ?? []) as CustomerUser[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [accountId])

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return customers
    return customers.filter((customer) => {
      return (
        (customer.name ?? '').toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      )
    })
  }, [customers, search])

  const openCreateModal = () => {
    setEditingCustomer(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEditModal = (customer: CustomerUser) => {
    setEditingCustomer(customer)
    setForm({
      name: customer.name ?? '',
      email: customer.email,
      role: 'client',
      authType: customer.auth_type ?? 'local',
      temporaryPassword: '',
      wmsUserIdentifier: customer.wms_user_identifier ?? '',
      status: customer.status ?? 'active',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCustomer(null)
    setForm(defaultForm)
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return false
    }

    if (!form.email.trim()) {
      toast.error('Email is required')
      return false
    }

    if (form.authType === 'local' && !editingCustomer && form.temporaryPassword.trim().length < 8) {
      toast.error('Temporary Password must be at least 8 characters')
      return false
    }

    if (form.authType === 'wms_extensiv' && !form.wmsUserIdentifier.trim()) {
      toast.error('WMS User Identifier is required for Extensive WMS-based auth')
      return false
    }

    return true
  }

  const saveCustomer = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError(null)

    try {
      const isEdit = Boolean(editingCustomer)
      const endpoint = isEdit ? `/api/customers/${editingCustomer?.id}` : '/api/customers'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          authType: form.authType,
          temporaryPassword: form.authType === 'local' ? form.temporaryPassword : undefined,
          wmsUserIdentifier: form.authType === 'wms_extensiv' ? form.wmsUserIdentifier : undefined,
          status: form.status,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to save customer')
      }

      const saved = payload.customer as CustomerUser

      if (isEdit) {
        setCustomers((prev) => prev.map((row) => (row.id === saved.id ? saved : row)))
        toast.success('Customer updated successfully')
      } else {
        setCustomers((prev) => [saved, ...prev])
        if (payload.warning) {
          toast.warning(payload.warning)
        } else {
          toast.success('Customer created successfully')
        }
      }

      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  const deleteCustomer = async (customer: CustomerUser) => {
    const confirmDelete = window.confirm(`Delete customer user ${customer.email}?`)
    if (!confirmDelete) return

    setDeletingId(customer.id)
    setError(null)
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: 'DELETE' })
      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to delete customer')
      }

      setCustomers((prev) => prev.filter((row) => row.id !== customer.id))
      toast.success('Customer deleted successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Customers</h1>
          <p className="text-sm text-gray-500">Manage customer users and authentication type.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading customers...</div>
        ) : (
          <Table>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Name</th>
                <th className="p-3 text-left text-sm font-semibold">Email</th>
                <th className="p-3 text-left text-sm font-semibold">Role/Type</th>
                <th className="p-3 text-left text-sm font-semibold">Auth Type</th>
                <th className="p-3 text-left text-sm font-semibold">WMS User Identifier</th>
                <th className="p-3 text-left text-sm font-semibold">Status</th>
                <th className="p-3 text-left text-sm font-semibold">Last Login</th>
                <th className="p-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{customer.name || '-'}</td>
                    <td className="py-3 px-4 text-sm">{customer.email}</td>
                    <td className="py-3 px-4 text-sm">Customer User</td>
                    <td className="py-3 px-4 text-sm">{getAuthTypeLabel(customer.auth_type)}</td>
                    <td className="py-3 px-4 text-sm">{customer.wms_user_identifier || '-'}</td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          customer.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatDate(customer.last_login_at)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="inline-flex items-center gap-1 rounded border border-primary px-2 py-1 text-xs text-primary hover:bg-primary/5"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCustomer(customer)}
                          disabled={deletingId === customer.id}
                          className="inline-flex items-center gap-1 rounded border border-red-500 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          {deletingId === customer.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    No customer users found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" aria-modal="true" role="dialog">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCustomer ? 'Edit Customer User' : 'Create Customer User'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Customer User Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Role/Type</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as CustomerRole }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="client">Customer User</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Authentication Type</label>
                <select
                  value={form.authType}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      authType: e.target.value as AuthType,
                      temporaryPassword: '',
                      wmsUserIdentifier: '',
                    }))
                  }
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="local">Local (Platform-managed credentials)</option>
                  <option value="wms_extensiv">Extensive WMS-based (Authenticate via WMS)</option>
                </select>
              </div>

              {form.authType === 'local' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password</label>
                  <input
                    type="text"
                    value={form.temporaryPassword}
                    onChange={(e) => setForm((prev) => ({ ...prev, temporaryPassword: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder={editingCustomer ? 'Optional: enter to reset password' : 'Minimum 8 characters'}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {editingCustomer
                      ? 'Leave empty to keep existing password.'
                      : 'This password will be sent to the customer by email.'}
                  </p>
                </div>
              )}

              {form.authType === 'wms_extensiv' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">WMS User Identifier</label>
                  <input
                    type="text"
                    value={form.wmsUserIdentifier}
                    onChange={(e) => setForm((prev) => ({ ...prev, wmsUserIdentifier: e.target.value }))}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Enter WMS user identifier"
                  />
                </div>
              )}

              {editingCustomer && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as CustomerStatus }))}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveCustomer}
                disabled={saving}
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
