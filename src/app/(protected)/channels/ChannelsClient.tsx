'use client'

import { useEffect, useMemo, useState } from 'react'
import Table from '@/components/ui/table'
import { toast } from 'sonner'
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from 'lucide-react'
import { SyncChannelsButton } from '@/components/buttons/SyncChannelsButton'

type AuthType = 'local' | 'wms_extensiv'
type SourceType = 'local' | 'sellercloud' | 'extensiv'
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
  source?: 'local' | 'sellercloud'
  origin?: string
  phone?: string | null
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
  company_name?: string | null
}

type FormState = {
  name: string
  email: string
  role: CustomerRole
  authType: AuthType
  temporaryPassword: string
  wmsUserIdentifier: string
  status: CustomerStatus
  source: SourceType
  companyId: string
  companyName: string
  firstName: string
  lastName: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  customerType: 'wholesale' | 'retail'
  contactPassword: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

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
  source: 'local',
  companyId: '',
  companyName: '',
  firstName: '',
  lastName: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  customerType: 'wholesale',
  contactPassword: '',
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function getAuthTypeLabel(authType: AuthType) {
  if (authType === 'local') return 'Local'
  return 'Extensive WMS-based'
}

function getOriginLabel(origin?: string) {
  if (origin === 'sellercloud') return 'Sellercloud'
  if (origin === 'manual') return 'Manual'
  if (origin === 'extensiv') return 'Extensiv'
  return origin || '-'
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ChannelsClient({ accountId }: ChannelsClientProps) {
  const [customers, setCustomers] = useState<CustomerUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerUser | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [modalError, setModalError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false)

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
    setFormErrors({})
    setModalError(null)
    setShowTemporaryPassword(false)
    setModalOpen(true)
  }

  const openEditModal = (customer: CustomerUser) => {
    if (customer.source === 'sellercloud') {
      toast.info('Sellercloud customers are read-only in this list.')
      return
    }

    setEditingCustomer(customer)
    setForm({
      name: customer.name ?? '',
      email: customer.email,
      role: 'client',
      authType: customer.auth_type ?? 'local',
      temporaryPassword: '',
      wmsUserIdentifier: customer.wms_user_identifier ?? '',
      status: customer.status ?? 'active',
      source: (customer.origin as SourceType) ?? 'local',
      companyId: customer.wms_user_identifier ?? '',
      companyName: customer.company_name ?? customer.name ?? '',
      firstName: customer.name?.split(' ')?.[0] ?? '',
      lastName: customer.name?.split(' ')?.slice(1).join(' ') ?? '',
      phone: customer.phone ?? '',
      address1: customer.address1 ?? '',
      address2: customer.address2 ?? '',
      city: customer.city ?? '',
      state: customer.state ?? '',
      postalCode: customer.postal_code ?? '',
      country: customer.country ?? 'US',
      customerType: 'wholesale',
      contactPassword: '',
    })
    setFormErrors({})
    setModalError(null)
    setShowTemporaryPassword(false)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCustomer(null)
    setForm(defaultForm)
    setFormErrors({})
    setModalError(null)
    setShowTemporaryPassword(false)
  }

  const validateForm = () => {
    const nextErrors: FormErrors = {}

    const isPlatform = form.source === 'sellercloud' || form.source === 'extensiv'

    if (!form.name.trim()) {
      nextErrors.name = 'Name is required.'
    } else if (form.name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.'
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (form.authType === 'local' && !isPlatform) {
      if (!editingCustomer && !form.temporaryPassword.trim()) {
        nextErrors.temporaryPassword = 'Temporary Password is required for Local auth.'
      } else if (form.temporaryPassword.trim() && form.temporaryPassword.trim().length < 8) {
        nextErrors.temporaryPassword = 'Temporary Password must be at least 8 characters.'
      }
    }

    if (form.authType === 'wms_extensiv' || isPlatform) {
      if (!form.wmsUserIdentifier.trim()) {
        nextErrors.wmsUserIdentifier = 'WMS User Identifier is required for WMS auth.'
      } else if (form.wmsUserIdentifier.trim().length < 3) {
        nextErrors.wmsUserIdentifier = 'WMS User Identifier must be at least 3 characters.'
      }
    }

    if (isPlatform) {
      if (!form.companyName.trim()) nextErrors.companyName = 'Company name is required.'
      if (form.source === 'extensiv' && !form.companyId.trim()) nextErrors.companyId = 'Customer ID is required.'
      if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.'
      if (!form.phone.trim()) nextErrors.phone = 'Phone is required.'
      if (!form.address1.trim()) nextErrors.address1 = 'Address line 1 is required.'
      if (!form.city.trim()) nextErrors.city = 'City is required.'
      if (!form.state.trim()) nextErrors.state = 'State/Province is required.'
      if (!form.postalCode.trim()) nextErrors.postalCode = 'Postal code is required.'
      if (!form.country.trim()) nextErrors.country = 'Country is required.'
      if (form.source === 'sellercloud' && !form.customerType) nextErrors.customerType = 'Customer type is required.'
      if (form.source === 'extensiv' && !form.contactPassword.trim()) {
        nextErrors.contactPassword = 'Temp password for contact is required for Extensiv.'
      }
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const saveCustomer = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError(null)
    setModalError(null)

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
          source: form.source,
          companyId: form.companyId,
          companyName: form.companyName,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          address1: form.address1,
          address2: form.address2,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          country: form.country,
          customerType: form.customerType,
          contactPassword: form.contactPassword,
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
      const message = err instanceof Error ? err.message : 'Failed to save customer'
      setModalError(message)
    } finally {
      setSaving(false)
    }
  }

  const deleteCustomer = async (customer: CustomerUser) => {
    if (customer.source === 'sellercloud') {
      toast.info('Sellercloud customers are read-only in this list.')
      return
    }

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
        <div className="flex items-center gap-3">
          <SyncChannelsButton accountId={accountId} onSynced={loadCustomers} />
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      {error && !modalOpen && (
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
                <th className="p-3 text-left text-sm font-semibold">Source</th>
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
                    <td className="py-3 px-4 text-sm">
                      {customer.source === 'sellercloud' ? 'Sellercloud Customer' : 'Customer User'}
                    </td>
                    <td className="py-3 px-4 text-sm">{getOriginLabel(customer.origin)}</td>
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
                      {customer.source === 'sellercloud' ? (
                        <div className="text-center text-xs text-gray-400">Read-only</div>
                      ) : (
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
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-500">
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
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col">
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

            {modalError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {modalError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Customer User Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const value = e.target.value
                    setForm((prev) => ({ ...prev, name: value }))
                    if (modalError) setModalError(null)
                    if (formErrors.name) {
                      setFormErrors((prev) => ({ ...prev, name: undefined }))
                    }
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-sm ${
                    formErrors.name ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter customer name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      const value = e.target.value
                      setForm((prev) => ({ ...prev, email: value }))
                      if (modalError) setModalError(null)
                      if (formErrors.email) {
                        setFormErrors((prev) => ({ ...prev, email: undefined }))
                      }
                    }}
                    className={`w-full rounded-md border px-3 py-2 text-sm ${
                      formErrors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="customer@example.com"
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => {
                      const value = e.target.value as SourceType
                      setForm((prev) => ({
                        ...prev,
                        source: value,
                        // enforce WMS auth for platform customers
                        authType: value === 'local' ? prev.authType : 'wms_extensiv',
                      }))
                    }}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="local">Manual / Local</option>
                    <option value="sellercloud">Sellercloud</option>
                    <option value="extensiv">Extensiv</option>
                  </select>
                </div>
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
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      authType: e.target.value as AuthType,
                      temporaryPassword: '',
                      wmsUserIdentifier: '',
                    }))
                    if (modalError) setModalError(null)
                    setShowTemporaryPassword(false)
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  disabled={form.source !== 'local'}
                >
                  <option value="local">Local (Platform-managed credentials)</option>
                  <option value="wms_extensiv">Extensive WMS-based (Authenticate via WMS)</option>
                </select>
              </div>

              {form.authType === 'local' && form.source === 'local' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password</label>
                  <div className="relative">
                    <input
                      type={showTemporaryPassword ? 'text' : 'password'}
                      value={form.temporaryPassword}
                      onChange={(e) => {
                        const value = e.target.value
                        setForm((prev) => ({ ...prev, temporaryPassword: value }))
                        if (modalError) setModalError(null)
                        if (formErrors.temporaryPassword) {
                          setFormErrors((prev) => ({ ...prev, temporaryPassword: undefined }))
                        }
                      }}
                      className={`w-full rounded-md border px-3 py-2 pr-10 text-sm ${
                        formErrors.temporaryPassword ? 'border-red-500' : ''
                      }`}
                      placeholder={editingCustomer ? 'Optional: enter to reset password' : 'Minimum 8 characters'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTemporaryPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                      aria-label={showTemporaryPassword ? 'Hide password' : 'Show password'}
                    >
                      {showTemporaryPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formErrors.temporaryPassword && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.temporaryPassword}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {editingCustomer
                      ? 'Leave empty to keep existing password.'
                      : 'This password will be sent to the customer by email.'}
                  </p>
                </div>
              )}

              {(form.authType === 'wms_extensiv' || form.source !== 'local') && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">WMS User Identifier</label>
                  <input
                    type="text"
                    value={form.wmsUserIdentifier}
                    onChange={(e) => {
                      const value = e.target.value
                      setForm((prev) => ({ ...prev, wmsUserIdentifier: value }))
                      if (modalError) setModalError(null)
                      if (formErrors.wmsUserIdentifier) {
                        setFormErrors((prev) => ({ ...prev, wmsUserIdentifier: undefined }))
                      }
                    }}
                    className={`w-full rounded-md border px-3 py-2 text-sm ${
                      formErrors.wmsUserIdentifier ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter WMS user identifier"
                  />
                  {formErrors.wmsUserIdentifier && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.wmsUserIdentifier}</p>
                  )}
                </div>
              )}

              {form.source !== 'local' && (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Platform Customer Details ({form.source === 'sellercloud' ? 'Sellercloud' : 'Extensiv'})
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Customer ID</label>
                  <input
                    type="text"
                    value={form.companyId}
                    onChange={(e) => setForm((prev) => ({ ...prev, companyId: e.target.value }))}
                    className={`w-full rounded-md border px-3 py-2 text-sm ${
                      formErrors.companyId ? 'border-red-500' : ''
                    }`}
                    placeholder={
                      form.source === 'sellercloud'
                        ? 'Optional: leave blank to auto-use first Sellercloud company'
                        : 'Unique code in WMS'
                    }
                  />
                      {formErrors.companyId && <p className="mt-1 text-xs text-red-600">{formErrors.companyId}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Company Name</label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          formErrors.companyName ? 'border-red-500' : ''
                        }`}
                        placeholder="Business name"
                      />
                      {formErrors.companyName && (
                        <p className="mt-1 text-xs text-red-600">{formErrors.companyName}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          formErrors.firstName ? 'border-red-500' : ''
                        }`}
                      />
                      {formErrors.firstName && <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          formErrors.phone ? 'border-red-500' : ''
                        }`}
                        placeholder="+1 555 555 5555"
                      />
                      {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Address 1</label>
                      <input
                        type="text"
                        value={form.address1}
                        onChange={(e) => setForm((prev) => ({ ...prev, address1: e.target.value }))}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          formErrors.address1 ? 'border-red-500' : ''
                        }`}
                      />
                      {formErrors.address1 && <p className="mt-1 text-xs text-red-600">{formErrors.address1}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Address 2</label>
                      <input
                        type="text"
                        value={form.address2}
                        onChange={(e) => setForm((prev) => ({ ...prev, address2: e.target.value }))}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          formErrors.city ? 'border-red-500' : ''
                        }`}
                      />
                      {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">State / Province</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          formErrors.state ? 'border-red-500' : ''
                        }`}
                      />
                      {formErrors.state && <p className="mt-1 text-xs text-red-600">{formErrors.state}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Postal Code</label>
                      <input
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => setForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          formErrors.postalCode ? 'border-red-500' : ''
                        }`}
                      />
                      {formErrors.postalCode && <p className="mt-1 text-xs text-red-600">{formErrors.postalCode}</p>}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                        className={`w-full rounded-md border px-3 py-2 text-sm ${
                          formErrors.country ? 'border-red-500' : ''
                        }`}
                        placeholder="US"
                      />
                      {formErrors.country && <p className="mt-1 text-xs text-red-600">{formErrors.country}</p>}
                    </div>
                    {form.source === 'sellercloud' && (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Customer Type</label>
                        <select
                          value={form.customerType}
                          onChange={(e) => setForm((prev) => ({ ...prev, customerType: e.target.value as 'wholesale' | 'retail' }))}
                          className={`w-full rounded-md border px-3 py-2 text-sm ${
                            formErrors.customerType ? 'border-red-500' : ''
                          }`}
                        >
                          <option value="wholesale">Wholesale</option>
                          <option value="retail">Retail</option>
                        </select>
                        {formErrors.customerType && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.customerType}</p>
                        )}
                      </div>
                    )}
                    {form.source === 'extensiv' && (
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Contact Temp Password</label>
                        <input
                          type="text"
                          value={form.contactPassword}
                          onChange={(e) => setForm((prev) => ({ ...prev, contactPassword: e.target.value }))}
                          className={`w-full rounded-md border px-3 py-2 text-sm ${
                            formErrors.contactPassword ? 'border-red-500' : ''
                          }`}
                          placeholder="Required by Extensiv"
                        />
                        {formErrors.contactPassword && (
                          <p className="mt-1 text-xs text-red-600">{formErrors.contactPassword}</p>
                        )}
                      </div>
                    )}
                  </div>
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

            <div className="mt-6 flex justify-end gap-2 shrink-0">
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
