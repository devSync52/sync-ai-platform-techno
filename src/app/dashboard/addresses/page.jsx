"use client";

import { useEffect, useState } from "react";
import { Plus, SquarePen, Trash } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import DashboardPagination from "@/components/DashboardPagination";
import { DeleteAddressAction, FetchAddressesAction } from "@/services/actions/addresses";
import AddressOperation from "./component/operation";

const rowCount = 10;

const getAddressId = (address) => address?.id || address?._id || address?.addressId;
const getRegionName = (address) => address?.region?.name || address?.regionName || address?.region_id || address?.region || "-";
const getProvinceName = (address) => address?.province?.name || address?.provinceName || address?.province || "-";

export default function AddressesPage() {
    const [page, setPage] = useState(1);
    const [operation, setOperation] = useState({ show: false, details: null });
    const [deleteOperation, setDeleteOperation] = useState({ show: false, address: null });
    const dispatch = useDispatch();
    const { data: addresses, loading, deleting, pagination, states } = useSelector((state) => state.addresses);

    useEffect(() => {
        dispatch(FetchAddressesAction({ limit: rowCount, page }));
    }, [dispatch, page]);

    const handleDeleteAddress = () => {
        const addressId = getAddressId(deleteOperation.address);
        if (!addressId) return;

        dispatch(DeleteAddressAction(addressId)).then((response) => {
            toast.success(response.data?.message || "Address deleted successfully", { id: "address-delete" });
            setDeleteOperation({ show: false, address: null });

            if (addresses.length == 1 && page > 1) {
                setPage((currentPage) => Math.max(currentPage - 1, 1));
            } else {
                dispatch(FetchAddressesAction({ limit: rowCount, page }));
            }
        }).catch((error) => {
            toast.error(error?.response?.data?.message || "Unable to delete address", { id: "address-delete" });
        });
    };

    return (
        <div className="space-y-6 py-6 px-4 xl:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-primary">Address Book</h1>
                    <p>Manage saved ship-to and bill-to contact addresses</p>
                </div>
                <Button size="lg" onClick={() => setOperation({ show: true, details: null })}>
                    <Plus />
                    Add Address
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <span className="text-[18px] font-medium text-[#4B5A8A]">Total Addresses</span>
                    </div>
                    <h2 className="text-4xl font-bold leading-none text-black">{pagination?.total ?? addresses.length ?? 0}</h2>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <span className="text-[18px] font-medium text-[#4B5A8A]">Commercial</span>
                    </div>
                    <h2 className="text-4xl font-bold leading-none text-green-500">{states?.commercial ?? 0}</h2>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="mb-5 flex items-center gap-3">
                        <span className="text-[18px] font-medium text-[#4B5A8A]">Residential</span>
                    </div>
                    <h2 className="text-4xl font-bold leading-none text-blue-500">{states?.residential ?? 0}</h2>
                </div>
            </div>

            <Card className="bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="text-lg font-medium">All Addresses</div>
                    <div className="text-sm text-muted-foreground">
                        Page {pagination?.page || page} of {pagination?.totalPages || 1}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead className="text-muted-foreground">
                            <tr className="border-b text-left">
                                <th className="py-2 pr-3">Name</th>
                                <th className="py-2 pr-3">Company</th>
                                <th className="py-2 pr-3">Region</th>
                                <th className="py-2 pr-3">Province</th>
                                <th className="py-2 pr-3">City</th>
                                <th className="py-2 pr-3">Postal Code</th>
                                <th className="py-2 pr-3">Phone</th>
                                <th className="py-2 pr-3">Type</th>
                                <th className="py-2 pr-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={9}>Loading addresses...</td>
                                </tr>
                            )}

                            {!loading && !addresses.length && (
                                <tr>
                                    <td className="py-6 text-center text-muted-foreground" colSpan={9}>No addresses found.</td>
                                </tr>
                            )}

                            {!loading && addresses.map((address, index) => (
                                <tr key={getAddressId(address) || index} className="border-b last:border-0">
                                    <td className="py-2 pr-3 font-medium">{address.name || "-"}</td>
                                    <td className="py-2 pr-3">{address.company || "-"}</td>
                                    <td className="py-2 pr-3">{address?.region?.name}</td>
                                    <td className="py-2 pr-3">{address?.province?.name}</td>
                                    <td className="py-2 pr-3">{address.city || "-"}</td>
                                    <td className="py-2 pr-3">{address.postalcode || address.postalCode || "-"}</td>
                                    <td className="py-2 pr-3">{address.phone || address.mobilePhone || address.phone || "-"}</td>
                                    <td className="py-2 pr-3">
                                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-sm font-medium capitalize text-slate-600 inset-ring inset-ring-slate-500/10">
                                            {address.type || "-"}
                                        </span>
                                    </td>
                                    <td className="py-2 pr-3">
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" onClick={() => setOperation({ show: true, details: address })}>
                                                <SquarePen />
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => setDeleteOperation({ show: true, address })}>
                                                <Trash />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <DashboardPagination
                    pagination={pagination}
                    itemCount={addresses.length}
                    currentPage={page}
                    loading={loading}
                    onPageChange={setPage}
                />
            </Card>

            {operation.show && (
                <AddressOperation
                    open={operation.show}
                    details={operation.details}
                    handleClose={() => setOperation({ show: false, details: null })}
                    onSaved={() => dispatch(FetchAddressesAction({ limit: rowCount, page }))}
                />
            )}

            <DeleteConfirmationModal
                open={deleteOperation.show}
                onOpenChange={() => setDeleteOperation({ show: false, address: null })}
                title="Delete address"
                description={`Are you sure you want to delete ${deleteOperation.address?.name || "this address"}? This action cannot be undone.`}
                loading={deleting}
                onConfirm={handleDeleteAddress}
            />
        </div>
    );
}
