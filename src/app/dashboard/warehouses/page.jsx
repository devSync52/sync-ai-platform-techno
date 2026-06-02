"use client";

// import "@/styles/daypicker-custom.css";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Download, Plus, SquarePen, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DeleteWarehouseAction, ExportWarehousesAction, FetchWarehousesAction } from "@/services/actions/warehouses";
import WareHouseOperation from "./components/operation";
import { toast } from "react-hot-toast";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import DashboardPagination from "@/components/DashboardPagination";


export default function WarehousesPage() {
  const [viewOperation, setViewOperation] = useState({ show: false, details: null });
  const [deleteOperation, setDeleteOperation] = useState({ show: false, warehouse: null });
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const rowCount = 10;
  const dispatch = useDispatch();
  const { data: warehouses, loading, deleting, pagination, active: activeWarehouses } = useSelector((state) => state.warehouses);

  useEffect(() => {
    dispatch(FetchWarehousesAction({ page, rowCount }));
  }, [dispatch, page]);

  const statesCovered = useMemo(() => new Set((warehouses || []).map((warehouse) => warehouse.province?.name || warehouse.provinceName || warehouse.province).filter(Boolean)).size, [warehouses]);

  const handleDeleteWarehouse = () => {
    const warehouseId = deleteOperation.warehouse?.id;
    if (!warehouseId) return;

    dispatch(DeleteWarehouseAction(warehouseId)).then((response) => {
      toast.success(response.data?.message || 'Warehouse deleted successfully', { id: 'warehouse-delete' });
      setDeleteOperation({ show: false, warehouse: null });

      if (warehouses.length == 1 && page > 1) {
        setPage((currentPage) => Math.max(currentPage - 1, 1));
      } else {
        dispatch(FetchWarehousesAction({ page, rowCount }));
      }
    }).catch((error) => {
      toast.error(error?.response?.data?.message || 'Unable to delete warehouse', { id: 'warehouse-delete' });
    });
  };

  const handleExportWarehouses = () => {
    setExporting(true);

    dispatch(ExportWarehousesAction()).then((response) => {
      const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const disposition = response.headers?.['content-disposition'];
      const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] || 'warehouses.csv';

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Warehouses exported successfully', { id: 'warehouse-export' });
    }).catch((error) => {
      toast.error(error?.response?.data?.message || 'Unable to export warehouses', { id: 'warehouse-export' });
    }).finally(() => {
      setExporting(false);
    });
  };

  return (
    <div className="p-6 space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 mb-4">
          <h1 className="text-2xl font-bold text-primary">Warehouse Management</h1>
          <p>Manage your fulfillment centers and distribution points</p>
        </div>
        <div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div>
              <Button variant="outline" size="lg" type="button" onClick={handleExportWarehouses} disabled={exporting}>
                <Download />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
            <div>
              <Button size="lg" onClick={() => setViewOperation({ show: true, details: null })}>
                <Plus />
                Add Warehouse
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Total Clients */}

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">Total Warehouses</span>
          </div>

          <h2 className="text-4xl font-bold text-black leading-none">{pagination?.total ?? warehouses?.length ?? 0}</h2>

        </div>


        {/* Active */}

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">Active</span>
          </div>

          <h2 className="text-4xl font-bold text-green-500 leading-none">{activeWarehouses ?? 0}</h2>

        </div>

        {/* Inactive */}


        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[18px] text-[#4B5A8A] font-medium">States Covered</span>
          </div>

          <h2 className="text-4xl font-bold text-red-500 leading-none">{statesCovered}</h2>

        </div>

      </div>

      <Card className="p-4 bg-white">
        <div className="flex justify-between items-center mb-3">
          <div className="text-lg font-medium">All Warehouses</div>
          <div className="text-sm text-muted-foreground">
            Page {pagination?.page || page} of {pagination?.totalPages || 1}
          </div>

        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Warehouse Name</th>
                <th className="py-2 pr-3">Region</th>
                <th className="py-2 pr-3">Province</th>
                <th className="py-2 pr-3">City</th>
                <th className="py-2 pr-3">Postal Code</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Provider</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="py-6 text-center text-muted-foreground" colSpan={7}>Loading warehouses...</td>
                </tr>
              )}

              {!loading && !warehouses?.length && (
                <tr>
                  <td className="py-6 text-center text-muted-foreground" colSpan={7}>No warehouses found.</td>
                </tr>
              )}

              {
                !loading && warehouses?.map((warehouse, index) => (
                  <tr key={warehouse.id || index} className="border-b last:border-0">
                    <td className="py-2 pr-3">{warehouse.name || '-'}</td>
                    <td className="py-2 pr-3">{warehouse.region?.name}</td>
                    <td className="py-2 pr-3">{warehouse.province?.name}</td>
                    <td className="py-2 pr-3">{warehouse.address?.city || '-'}</td>
                    <td className="py-2 pr-3">{warehouse.address?.postalcode || '-'}</td>
                    <td className="py-2 pr-3">
                      <span className={`capitalize inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${warehouse.status == 'active' ? 'bg-green-50 text-green-700 inset-ring inset-ring-green-600/10' : 'bg-slate-100 text-slate-600 inset-ring inset-ring-slate-500/10'}`}>
                        {warehouse?.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{warehouse?.provider || '-'}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setViewOperation({ show: true, details: warehouse })}>
                          <SquarePen />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setDeleteOperation({ show: true, warehouse })}>
                          <Trash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <DashboardPagination
          pagination={pagination}
          itemCount={warehouses?.length || 0}
          currentPage={page}
          loading={loading}
          onPageChange={setPage}
        />
      </Card>

      {viewOperation.show && (
        <WareHouseOperation
          open={viewOperation.show}
          details={viewOperation.details}
          handleClose={() => setViewOperation({ show: false, details: null })}
        />
      )}

      <DeleteConfirmationModal
        open={deleteOperation.show}
        onOpenChange={() => setDeleteOperation({ show: false, warehouse: null })}
        title="Delete warehouse"
        description={`Are you sure you want to delete ${deleteOperation.warehouse?.name || 'this warehouse'}? This action cannot be undone.`}
        loading={deleting}
        onConfirm={handleDeleteWarehouse}
      />
    </div>
  );
}
