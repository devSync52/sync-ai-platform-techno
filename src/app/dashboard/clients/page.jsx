"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from 'lucide-react';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { DeleteClientAction, FetchClientsAction, UpdateClientStatusAction } from "@/services/actions/clients";
import ClientOperation from "./components/operation";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

const CLIENT_STATUS_OPTIONS = ['active', 'inactive', 'suspended'];

export default function ClientsPage() {
  const [viewOperation, setViewOperation] = useState({ show: false, details: null });
  const [deleteOperation, setDeleteOperation] = useState({ show: false, client: null });
  const [page, setPage] = useState(1);
  const rowCount = 10;
  const dispatch = useDispatch();
  const { data: clients, loading, deleting, updatingStatus, pagination, states } = useSelector((state) => state.clients);

  useEffect(() => {
    dispatch(FetchClientsAction({ page, rowCount }));
  }, [dispatch, page]);

  const getClientId = (client) => client?.clientId || client?.id;
  const getClientName = (client) => [client?.profile?.firstName, client?.profile?.lastName].filter(Boolean).join(' ') || '-';
  const getClientStatus = (client) => client?.profile?.status || client?.status || 'inactive';

  const handleStatusChange = (client, status) => {
    const clientId = getClientId(client);
    if (!clientId || status == getClientStatus(client)) return;

    dispatch(UpdateClientStatusAction(clientId, status)).then((response) => {
      toast.success(response.data?.message || 'Client status updated successfully', { id: 'client-status' });
      dispatch(FetchClientsAction({ page, rowCount }));
    }).catch((error) => {
      toast.error(error?.response?.data?.message || 'Unable to update client status', { id: 'client-status' });
    });
  };

  const handleDeleteClient = () => {
    const clientId = getClientId(deleteOperation.client);
    if (!clientId) return;

    dispatch(DeleteClientAction(clientId)).then((response) => {
      toast.success(response.data?.message || 'Client deleted successfully', { id: 'client-delete' });
      setDeleteOperation({ show: false, client: null });

      if (clients.length == 1 && page > 1) {
        setPage((currentPage) => Math.max(currentPage - 1, 1));
      } else {
        dispatch(FetchClientsAction({ page, rowCount }));
      }
    }).catch((error) => {
      toast.error(error?.response?.data?.message || 'Unable to delete client', { id: 'client-delete' });
    });
  };

  return (
    <div className="p-6 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold text-primary">Client Management</h1>
          <p>Manage your logistics clients and their SLA profiles</p>
        </div>
        <div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div>
              <Button size="lg" onClick={() => setViewOperation({ show: true, details: null })}>
                <Plus />
                Add Client
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">Total Clients</span>
          </div>

          <h2 className="text-4xl font-bold text-black leading-none">{pagination?.total ?? clients?.length ?? 0}</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">Active</span>
          </div>

          <h2 className="text-4xl font-bold text-green-500 leading-none">{states?.active ?? 0}</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">Inactive</span>
          </div>

          <h2 className="text-4xl font-bold text-red-500 leading-none">{states?.inactive ?? 0}</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">Suspended</span>
          </div>

          <h2 className="text-4xl font-bold text-amber-500 leading-none">{states?.suspended ?? 0}</h2>
        </div>
      </div>

      <Card className="p-4 bg-white">
        <div className="flex justify-between items-center mb-3">
          <div className="text-lg font-medium">All Clients</div>
          <div className="text-sm text-muted-foreground">
            Page {pagination?.page || page} of {pagination?.totalPages || 1}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Client Code</th>
                <th className="py-2 pr-3">Client Name</th>
                <th className="py-2 pr-3">Contact Email</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="py-6 text-center text-muted-foreground" colSpan={6}>Loading clients...</td>
                </tr>
              )}

              {!loading && !clients?.length && (
                <tr>
                  <td className="py-6 text-center text-muted-foreground" colSpan={6}>No clients found.</td>
                </tr>
              )}

              {
                !loading && clients?.map((client, index) => {
                  const status = getClientStatus(client);
                  const statusClass = status == 'active'
                    ? 'bg-green-50 text-green-700 inset-ring inset-ring-green-600/10'
                    : status == 'suspended'
                      ? 'bg-amber-50 text-amber-700 inset-ring inset-ring-amber-600/10'
                      : 'bg-slate-100 text-slate-600 inset-ring inset-ring-slate-500/10';

                  return (
                    <tr key={getClientId(client) || index} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{client.clientCode || getClientId(client) || '-'}</td>
                      <td className="py-2 pr-3">{getClientName(client)}</td>
                      <td className="py-2 pr-3">{client?.profile?.email || '-'}</td>
                      <td className="py-2 pr-3">{[client?.profile?.countryCode, client?.profile?.phone].filter(Boolean).join(' ') || '-'}</td>
                      <td className="py-2 pr-3">
                        <Select value={status} onValueChange={(value) => handleStatusChange(client, value)} disabled={updatingStatus == getClientId(client)}>
                          <SelectTrigger className={`h-9 w-32 capitalize ${statusClass}`}>
                            <span>{updatingStatus == getClientId(client) ? 'Updating...' : status}</span>
                          </SelectTrigger>
                          <SelectContent>
                            {CLIENT_STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                <span className="capitalize">{option}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => setDeleteOperation({ show: true, client })}>
                            <Trash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination?.offset || 0) + (clients?.length ? 1 : 0)}-{(pagination?.offset || 0) + (clients?.length || 0)} of {pagination?.total || 0}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" disabled={loading || (pagination?.page || page) <= 1} onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}>
              Previous
            </Button>
            <Button variant="outline" type="button" disabled={loading || (pagination?.page || page) >= (pagination?.totalPages || 1)} onClick={() => setPage((currentPage) => currentPage + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      {viewOperation.show && (
        <ClientOperation
          open={viewOperation.show}
          details={viewOperation.details}
          handleClose={() => setViewOperation({ show: false, details: null })}
        />
      )}

      <DeleteConfirmationModal
        open={deleteOperation.show}
        onOpenChange={() => setDeleteOperation({ show: false, client: null })}
        title="Delete client"
        description={`Are you sure you want to delete ${getClientName(deleteOperation.client)}? This action cannot be undone.`}
        loading={deleting}
        onConfirm={handleDeleteClient}
      />
    </div>
  );
}
