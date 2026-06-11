"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { AlertTriangle, Plus, RotateCcw, Star, Trash } from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import axiosInstance from "@/config/axios";
import { API_URL } from "@/utils/constants";

const defaultPackage = {
  inventoryId: "",
  name: "",
  weight: 3,
  dimension: {
    length: 3,
    width: 3,
    height: 2,
  },
  insurance: 100,
};

const defaultValues = {
  initiation: "",
  destination: "",
  packageList: {
    type: "pak",
    packages: [defaultPackage],
  },
};

const schema = yup.object({
  initiation: yup.string().required("Initiation address is required"),
  destination: yup.string().required("Destination address is required"),
  packageList: yup.object({
    type: yup.string().oneOf(["pak", "parcel"]).required("Package type is required"),
    packages: yup.array().of(yup.object({
      inventoryId: yup.string(),
      name: yup.string().required("Product name is required"),
      weight: yup.number().typeError(`Weight is required`).positive(`Weight must be greater than 0`).required(`Weight is required`),
      dimension: yup.object({
        length: yup.number().typeError(`Length is required`).positive(`Length must be greater than 0`).required(`Length is required`),
        width: yup.number().typeError(`Width is required`).positive(`Width must be greater than 0`).required(`Width is required`),
        height: yup.number().typeError(`Height is required`).positive(`Height must be greater than 0`).required(`Height is required`),
      }),
      insurance: yup.number().typeError("Insurance is required").min(0, "Insurance cannot be negative").required("Insurance is required"),
    })).min(1, "Add at least one package").required("Packages are required"),
  }),
});

const getAddressId = (address) => address?.id || address?._id || address?.addressId;
const getAddressLabel = (address) => {
  const name = address?.name || address?.company;
  return [name, address?.city, address?.postalcode].filter(Boolean).join(" - ") || getAddressId(address) || "Address";
};

const getInventoryId = (item) => {
  const id = item?.id || item?._id || item?.inventoryId;
  return id == null ? "" : String(id);
};
const getInventorySku = (item) => item?.productSku || item?.productId || item?.metadata?.ID || "";
const getInventoryName = (item) => item?.name || item?.metadata?.ProductName || getInventorySku(item) || "Inventory item";
const getInventoryLabel = (item) => [getInventoryName(item), getInventorySku(item)].filter(Boolean).join(" - ");

const getQuoteAddressValue = (value) => {
  if (!value) return "";
  if (typeof value == "string" || typeof value == "number") return String(value);
  return String(value.id || value._id || value.addressId || "");
};

const normalizePackage = (packageItem = {}) => ({
  inventoryId: packageItem.inventoryId || packageItem.inventory_id || packageItem.productId || "",
  name: packageItem.name || packageItem.productName || packageItem.product_name || "",
  weight: packageItem.weight ?? "",
  dimension: {
    length: packageItem.dimension?.length ?? packageItem.length ?? "",
    width: packageItem.dimension?.width ?? packageItem.width ?? "",
    height: packageItem.dimension?.height ?? packageItem.height ?? "",
  },
  insurance: packageItem.insurance ?? 0,
});

const normalizeQuoteValues = (order = {}) => {
  const packageList = order.packageList || order.package_list || order.packages || {};
  const packages = Array.isArray(packageList) ? packageList : packageList.packages;

  return {
    initiation: getQuoteAddressValue(order.initiation || order.initiation_id || order.origin || order.from),
    destination: getQuoteAddressValue(order.destination || order.destination_id || order.to),
    packageList: {
      type: packageList.type || order.packageType || order.package_type || "pak",
      packages: packages?.length ? packages.map(normalizePackage) : [defaultPackage],
    },
  };
};

function QuoteResults({ carriers }) {
  const serviceRows = carriers.flatMap((carrier) => ((carrier.services || []).map((service) => ({ carrier, service }))));
  const warningRows = carriers.filter((carrier) => !(carrier.services || []).length);
  const bestCharge = serviceRows.reduce((lowest, row) => {
    const charge = Number(row.service?.charge || 0);
    return lowest == null || charge < lowest ? charge : lowest;
  }, null);

  if (!carriers.length) return null;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b px-4 py-3 font-semibold text-slate-900">Select Service</div>
      <div className="divide-y divide-dashed divide-gray-200">
        {
          serviceRows.map(({ carrier, service }) => {
            const chargeDetails = service.charge_details || [];
            const isBestPrice = bestCharge != null && Number(service.charge || 0) == bestCharge;

            return (
              <div key={`${carrier.carrier_id}-${service.id}-${service.token}`} className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_320px]">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-slate-50 text-xs font-bold text-slate-700">
                    {(carrier.carrier_code || carrier.name || "CA").slice(0, 3).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-950">{service.name || service.code || carrier.name}</h3>
                    <div className="mt-1 grid gap-1 text-sm text-slate-700">
                      <div><span className="font-medium">Carrier:</span> {carrier.name || "-"}</div>
                      <div><span className="font-medium">Code:</span> {service.code || "-"}</div>
                      <div><span className="font-medium">ETA:</span> <span className="text-red-500">{service.eta || "Not Guaranteed"}</span></div>
                      <div><span className="font-medium">Zone:</span> {service.zone_id || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_180px] lg:grid-cols-1">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <span>Estimated Rate:</span>
                      <span className="text-red-500">{Number(service.freight || service.charge || 0).toFixed(2)}</span>
                    </div>

                    {chargeDetails.map((detail) => (
                      <div key={`${service.id}-${detail.code}`} className="flex justify-between gap-4 text-slate-500">
                        <span>{detail.name}:</span>
                        <span className="text-red-500">{Number(detail.price || 0).toFixed(2)}</span>
                      </div>
                    ))}

                    <div className="mt-2 border-t border-dashed border-slate-400 pt-2">
                      <div className="flex justify-between gap-4 text-base font-bold">
                        <span>Grand Total({carrier.currency?.code || "USD"}):</span>
                        <span className="text-red-500">{Number(service.charge || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <Button type="button" className={isBestPrice ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-green-600 text-white hover:bg-green-700"}>
                    {isBestPrice ? (
                      <>
                        <Star />
                        BEST PRICE
                      </>
                    ) : (
                      "Select"
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        }

        {
          warningRows.map((carrier) => (
            <div key={carrier.carrier_id || carrier.carrier_code} className="flex gap-3 px-4 py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-slate-50 text-xs font-bold text-slate-700">
                {(carrier.carrier_code || carrier.name || "CA").slice(0, 3).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 text-lg font-bold text-amber-600">
                  <AlertTriangle className="size-5" />
                  Warning({carrier.name || "Carrier"}):
                </div>
                <p className="text-sm text-red-500">{carrier.message || "This service is not available for the selected conditions."}</p>
                <p className="text-sm text-blue-600">Change the address or package details and generate a new quote.</p>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export default function GenerateQuoteForm({ quoteId }) {
  const [addresses, setAddresses] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingInventories, setLoadingInventories] = useState(true);
  const [loadingQuote, setLoadingQuote] = useState(Boolean(quoteId));
  const [quoteCarriers, setQuoteCarriers] = useState([]);
  const [quoteGenerated, setQuoteGenerated] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting }, } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "packageList.packages",
  });

  const initiation = useWatch({ control, name: "initiation" });
  const destination = useWatch({ control, name: "destination" });
  const packageType = useWatch({ control, name: "packageList.type" });

  const selectedInitiation = useMemo(() => addresses.find((address) => getAddressId(address) == initiation), [addresses, initiation]);
  const selectedDestination = useMemo(() => addresses.find((address) => getAddressId(address) == destination), [addresses, destination]);
  const formLocked = quoteGenerated;

  useEffect(() => {
    axiosInstance.get(API_URL.ADDRESSES_FETCH).then((response) => {
      if (response.data.success) {
        setAddresses(response.data?.data || []);
      } else {
        setAddresses([]);
      }
    }).catch((error) => {
      toast.error(error?.response?.data?.message || "Unable to fetch addresses", { id: "quote-addresses" });
    }).finally(() => {
      setLoadingAddresses(false);
    });
  }, []);

  useEffect(() => {
    const search = inventorySearch.trim();
    const timeoutId = setTimeout(() => {
      setLoadingInventories(true);
      axiosInstance.get(API_URL.INVENTORY, { params: { page: 1, rowCount: 100, ...(search ? { search } : {}) } }).then((response) => {
        const payload = response.data?.data ?? [];
        setInventories(Array.isArray(payload) ? payload : [payload].filter(Boolean));
      }).catch((error) => {
        toast.error(error?.response?.data?.message || "Unable to fetch inventory", { id: "quote-inventory" });
        setInventories([]);
      }).finally(() => {
        setLoadingInventories(false);
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inventorySearch]);

  useEffect(() => {
    if (!quoteId) return;

    axiosInstance.get(API_URL.ORDER_BY_ID(quoteId)).then((response) => {
      const order = response.data?.data?.order || response.data?.data || response.data?.order || {};
      reset(normalizeQuoteValues(order));
    }).catch((error) => {
      toast.error(error?.response?.data?.message || "Unable to fetch order details", { id: "quote-details" });
    }).finally(() => {
      setLoadingQuote(false);
    });
  }, [quoteId, reset]);

  const onSubmit = (data) => {
    const packageList = {
      ...data.packageList,
      packages: data.packageList.packages.map((packageItem) => {
        const { inventoryId, ...packagePayload } = packageItem;
        return inventoryId ? { ...packagePayload, inventoryId } : packagePayload;
      })
    };
    const payload = quoteId ? { ...data, packageList, quoteId } : { ...data, packageList };

    axiosInstance.post(API_URL.ORDER_QUOTE, payload).then((response) => {
      if (response.data.success) {
        const carriers = response.data?.data?.response || [];
        setQuoteCarriers(carriers);
        setQuoteGenerated(true);
        toast.success(response.data?.message || "Quote generated successfully", { id: "generate-quote" });
      } else {
        setQuoteCarriers([]);
        setQuoteGenerated(false);
        toast.error(response.data?.message || "Unable to generate quote", { id: "generate-quote" });
      }
    }).catch((error) => {
      setQuoteCarriers([]);
      setQuoteGenerated(false);
      toast.error(error?.response?.data?.message || "Unable to generate quote", { id: "generate-quote" });
    });
  };

  const handleResetQuote = () => {
    reset(defaultValues);
    setSelectedInventoryId("");
    setQuoteCarriers([]);
    setQuoteGenerated(false);
  };

  const getPackageFromInventory = (selectedInventory) => ({
    inventoryId: getInventoryId(selectedInventory),
    name: getInventoryName(selectedInventory),
    weight: selectedInventory.weight || selectedInventory.metadata?.Weight || 0,
    dimension: {
      length: selectedInventory.length || selectedInventory.metadata?.ShippingLength || 0,
      width: selectedInventory.width || selectedInventory.metadata?.ShippingWidth || 0,
      height: selectedInventory.height || selectedInventory.metadata?.ShippingHeight || 0,
    },
    insurance: selectedInventory.price || selectedInventory.metadata?.SitePrice || 0,
  });

  const handleInventoryChange = (inventoryId) => {
    const selectedInventory = inventories.find((item) => getInventoryId(item) == inventoryId);
    if (!selectedInventory) return;

    append(getPackageFromInventory(selectedInventory));
    setSelectedInventoryId("");
    setInventorySearch("");
  };

  return (
    <>
      <form className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Initiation Address
              <Controller control={control} name="initiation" render={({ field }) => (
                <Select disabled={loadingAddresses || loadingQuote || formLocked} value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full min-w-0">
                    <span className={`min-w-0 flex-1 truncate text-left ${selectedInitiation ? "" : "text-muted-foreground"}`}>
                      {selectedInitiation ? getAddressLabel(selectedInitiation) : loadingAddresses || loadingQuote ? "Loading..." : "Select initiation address"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={getAddressId(address)} value={getAddressId(address)}>
                        {getAddressLabel(address)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.initiation && <span className="text-xs text-destructive">{errors.initiation.message}</span>}
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Destination Address
              <Controller control={control} name="destination" render={({ field }) => (
                <Select disabled={loadingAddresses || loadingQuote || formLocked} value={field.value || ""} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full min-w-0">
                    <span className={`min-w-0 flex-1 truncate text-left ${selectedDestination ? "" : "text-muted-foreground"}`}>
                      {selectedDestination ? getAddressLabel(selectedDestination) : loadingAddresses || loadingQuote ? "Loading..." : "Select destination address"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={getAddressId(address)} value={getAddressId(address)}>
                        {getAddressLabel(address)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.destination && <span className="text-xs text-destructive">{errors.destination.message}</span>}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Package Type
              <Controller control={control} name="packageList.type" render={({ field }) => (
                <Select disabled={loadingQuote || formLocked} value={field.value || "pak"} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full min-w-0">
                    <span className="min-w-0 flex-1 truncate text-left capitalize">{packageType || "pak"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pak">Pak</SelectItem>
                    <SelectItem value="parcel">Parcel</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.packageList?.type && <span className="text-xs text-destructive">{errors.packageList.type.message}</span>}
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Packages</h2>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Input
                  className="w-full sm:w-56"
                  disabled={loadingQuote || loadingInventories || formLocked}
                  value={inventorySearch}
                  onChange={(event) => setInventorySearch(event.target.value)}
                  placeholder="Search inventory"
                />

                <Select disabled={loadingQuote || loadingInventories || formLocked} value={selectedInventoryId} onValueChange={handleInventoryChange}>
                  <SelectTrigger className="w-full min-w-0 sm:w-72">
                    <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">
                      {loadingInventories ? "Loading inventory..." : inventories.length ? "Choose inventory" : "No inventory found"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {inventories.map((item) => (
                      <SelectItem key={getInventoryId(item)} value={getInventoryId(item)}>
                        {getInventoryLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button type="button" variant="outline" disabled={loadingQuote || formLocked} onClick={() => append(defaultPackage)}>
                  <Plus />
                  Add Package
                </Button>
              </div>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="font-medium text-slate-900">Package {index + 1}</div>
                  <Button type="button" variant="outline" size="icon" disabled={loadingQuote || formLocked || fields.length == 1} onClick={() => remove(index)}>
                    <Trash />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <label className="grid gap-2 text-sm font-medium text-slate-700 lg:col-span-2">
                    Product Name
                    <Input disabled={loadingQuote || formLocked} {...register(`packageList.packages.${index}.name`)} placeholder="Product name" />
                    {errors.packageList?.packages?.[index]?.name && <span className="text-xs text-destructive">{errors.packageList.packages[index].name.message}</span>}
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Weight
                    <Input type="number" step="any" disabled={loadingQuote || formLocked} {...register(`packageList.packages.${index}.weight`)} placeholder="0.0" />
                    {errors.packageList?.packages?.[index]?.weight && <span className="text-xs text-destructive">{errors.packageList.packages[index].weight.message}</span>}
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Length
                    <Input type="number" step="any" disabled={loadingQuote || formLocked} {...register(`packageList.packages.${index}.dimension.length`)} placeholder="0.0" />
                    {errors.packageList?.packages?.[index]?.dimension?.length && <span className="text-xs text-destructive">{errors.packageList.packages[index].dimension.length.message}</span>}
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Width
                    <Input type="number" step="any" disabled={loadingQuote || formLocked} {...register(`packageList.packages.${index}.dimension.width`)} placeholder="0.0" />
                    {errors.packageList?.packages?.[index]?.dimension?.width && <span className="text-xs text-destructive">{errors.packageList.packages[index].dimension.width.message}</span>}
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Height
                    <Input type="number" step="any" disabled={loadingQuote || formLocked} {...register(`packageList.packages.${index}.dimension.height`)} placeholder="0.0" />
                    {errors.packageList?.packages?.[index]?.dimension?.height && <span className="text-xs text-destructive">{errors.packageList.packages[index].dimension.height.message}</span>}
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Insurance
                    <Input type="number" step="any" disabled={loadingQuote || formLocked} {...register(`packageList.packages.${index}.insurance`)} placeholder="0.0" />
                    {errors.packageList?.packages?.[index]?.insurance && <span className="text-xs text-destructive">{errors.packageList.packages[index].insurance.message}</span>}
                  </label>
                </div>
              </div>
            ))}

            {errors.packageList?.packages?.message && <span className="text-xs text-destructive">{errors.packageList.packages.message}</span>}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {formLocked && (
            <Button type="button" variant="outline" className="min-w-40 whitespace-nowrap px-4" onClick={handleResetQuote}>
              <RotateCcw />
              Reset Quote
            </Button>
          )}
          <Button type="submit" className="min-w-40 whitespace-nowrap px-4" disabled={loadingAddresses || loadingQuote || isSubmitting || formLocked}>
            {loadingQuote ? "Loading Quote..." : isSubmitting ? "Generating..." : "Generate Quote"}
          </Button>
        </div>
      </form>

      <QuoteResults carriers={quoteCarriers} />
    </>
  );
}
