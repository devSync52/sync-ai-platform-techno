"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { AlertTriangle, CreditCard, Loader2, Plus, RefreshCwIcon, RotateCcw, Tag, Trash, Wallet } from "lucide-react";
import { toast } from "react-hot-toast";
import axiosInstance from "@/config/axios";
import { API_URL, PROJECT_URL } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import CarrierBrand from "@/components/carrier-brand";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import InventoryAutocomplete from "@/components/InventoryAutocomplete";
import { FetchLabelQuotesAction } from "@/services/actions/orders";
import { FetchWalletAction } from "@/services/actions/wallet";

const defaultPackage = {
  inventoryId: "",
  name: "Package",
  weight: 3,
  dimension: {
    length: 3,
    width: 3,
    height: 2,
  },
  insurance: 0,
};

const defaultValues = {
  initiation: "",
  destination: "",
  option: {
    reference_number: "",
    memo: "",
  },
  packageList: {
    type: "pak",
    packages: [defaultPackage],
  },
};

const QUOTE_PAGE_LIMIT = 10;

const schema = yup.object({
  initiation: yup.string().required("Sender address is required"),
  destination: yup.string().required("Recipient address is required"),
  option: yup.object({
    reference_number: yup.string(),
    memo: yup.string(),
  }),
  packageList: yup.object({
    type: yup.string().oneOf(["env", "pak", "parcel"]).required("Package type is required"),
    packages: yup.array().of(yup.object({
      inventoryId: yup.string(),
      name: yup.string().required("Package name is required"),
      weight: yup.number().typeError("Weight is required").positive("Weight must be greater than 0").required("Weight is required"),
      dimension: yup.object({
        length: yup.number().typeError("Length is required").positive("Length must be greater than 0").required("Length is required"),
        width: yup.number().typeError("Width is required").positive("Width must be greater than 0").required("Width is required"),
        height: yup.number().typeError("Height is required").positive("Height must be greater than 0").required("Height is required"),
      }),
      insurance: yup.number().typeError("Insurance must be numeric").min(0, "Insurance cannot be negative"),
    })).min(1, "Add at least one package").required("Packages are required"),
  }),
});

const formatMoney = (amount, currency = "USD") => {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "USD").toUpperCase(),
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const getInventoryId = (item) => {
  const id = item?.id || item?._id || item?.inventoryId;
  return id == null ? "" : String(id);
};
const getInventoryName = (item) => item?.name || item?.metadata?.ProductName || item?.productSku || "Inventory item";

const normalizePriceBands = (response) => {
  const payload = response.data?.data ?? [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.prices)) return payload.prices;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const getServiceBaseAmount = (service) => Number(service?.charge ?? service?.freight ?? 0);
const getMatchingPriceBand = (priceBands, amount) => {
  const value = Number(amount || 0);
  return (priceBands || []).find((priceBand) => {
    const minPrice = Number(priceBand?.minPrice ?? 0);
    const maxPrice = Number(priceBand?.maxPrice ?? 0);
    return (priceBand?.status || "active") === "active" && value >= minPrice && value <= maxPrice;
  });
};
const getServiceCharge = (service, priceBands) => {
  const priceBand = getMatchingPriceBand(priceBands, getServiceBaseAmount(service));
  return priceBand ? Number(priceBand?.serviceCharge ?? priceBand?.price ?? 0) : 0;
};

const getServiceTotal = (service, priceBands) => getServiceBaseAmount(service) + getServiceCharge(service, priceBands);

const getQuoteCarriers = (payload) => {
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.data?.response)) return payload.data.response;
  if (Array.isArray(payload?.carriers)) return payload.carriers;
  return [];
};

const getQuoteLabel = (quote) => {
  const destination = quote.destination?.name || quote.destination?.company || quote.destination?.city || "Destination";
  return `Quote ${quote.id?.slice(0, 8) || ""} - ${destination}`;
};

const normalizeQuotePackages = (quote) => {
  const packages = quote.packageLists?.map((item) => ({
    inventoryId: item.inventory?.id || item.inventoryId || "",
    name: getInventoryName(item.inventory),
    weight: item.inventory?.weight || 0,
    dimension: {
      length: item.inventory?.length || 0,
      width: item.inventory?.width || 0,
      height: item.inventory?.height || 0,
    },
    insurance: item.insurance || item.inventory?.price || 0,
  })) || [];

  return packages.length ? packages : [defaultPackage];
};

export default function LabelGeneratorPage() {
  const dispatch = useDispatch();
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [activeQuoteId, setActiveQuoteId] = useState("");
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [services, setServices] = useState([]);
  const [priceBands, setPriceBands] = useState([]);
  const [quoting, setQuoting] = useState(false);
  const [generatingKey, setGeneratingKey] = useState("");
  const { summary: wallet = { balance: 0 }, loading: walletLoading } = useSelector((state) => state.wallet || {});
  const {
    labelQuotes = [],
    labelQuotesLoading,
    labelQuotesPagination = { page: 1, totalPages: 1, total: 0 },
  } = useSelector((state) => state.orders || {});

  const { register, handleSubmit, control, reset, getValues, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "packageList.packages",
  });

  const walletBalance = Number(wallet.balance || 0);
  const lowBalance = walletBalance < 10;

  const fetchWallet = useCallback(async () => {
    try {
      return await dispatch(FetchWalletAction());
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to fetch wallet balance", { id: "label-wallet" });
      throw error;
    }
  }, [dispatch]);

  const fetchLabelQuotes = useCallback(async (page = 1, append = false) => {
    try {
      return await dispatch(FetchLabelQuotesAction({ page, limit: QUOTE_PAGE_LIMIT }, { append }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to fetch saved quotes", { id: "label-quotes" });
      throw error;
    }
  }, [dispatch]);

  const refreshLabelQuotes = useCallback(() => fetchLabelQuotes(1, false), [fetchLabelQuotes]);

  const loadMoreLabelQuotes = useCallback(() => {
    if (labelQuotesLoading || labelQuotesPagination.page >= labelQuotesPagination.totalPages) return;
    fetchLabelQuotes(labelQuotesPagination.page + 1, true);
  }, [fetchLabelQuotes, labelQuotesLoading, labelQuotesPagination.page, labelQuotesPagination.totalPages]);

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchWallet(),
        refreshLabelQuotes(),
        axiosInstance.get(API_URL.PRICES).then((response) => {
          setPriceBands(normalizePriceBands(response));
        }).catch(() => {
          setPriceBands([]);
        }),
      ]);
    };

    loadInitialData();
  }, [fetchWallet, refreshLabelQuotes]);

  const serviceRows = useMemo(() => services.flatMap((carrier) => (carrier.services || []).map((service) => {
    const serviceCharge = getServiceCharge(service, priceBands);
    const total = getServiceBaseAmount(service) + serviceCharge;
    return {
      carrier,
      service,
      serviceCharge,
      total,
      currency: carrier.currency?.code || "USD",
    };
  })), [services, priceBands]);
  const warningRows = useMemo(() => services.filter((carrier) => !(carrier.services || []).length), [services]);
  const bestServiceTotal = useMemo(() => {
    return serviceRows.reduce((lowest, row) => lowest == null || row.total < lowest ? row.total : lowest, null);
  }, [serviceRows]);

  const onQuote = async (data) => {
    setQuoting(true);
    setServices([]);
    try {
      const response = await axiosInstance.post(API_URL.ORDER_QUOTE, {
        ...data,
        quoteId: activeQuoteId || undefined,
      });
      const carriers = response.data?.data?.response || [];
      setActiveQuoteId(response.data?.data?.order?.id || "");
      setServices(carriers);
      refreshLabelQuotes();
      toast.success(carriers.length ? "Quote generated. Select a service to create the label." : "No carrier services returned.", { id: "label-quote" });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to generate quote", { id: "label-quote" });
    } finally {
      setQuoting(false);
    }
  };

  const handleGenerateLabel = async ({ carrier, service, serviceCharge, total, currency }) => {
    if (walletBalance < total) {
      toast.error(`Insufficient wallet balance. Required ${formatMoney(total, currency)}.`, { id: "label-generate" });
      return;
    }

    const key = `${carrier.carrier_id}-${service.id}-${service.token}`;
    setGeneratingKey(key);

    try {
      const values = getValues();
      const response = await axiosInstance.post(API_URL.ORDER_LABELS, {
        ...values,
        quoteId: activeQuoteId || undefined,
        selectedService: {
          id: service.id,
          token: service.token,
          code: service.code,
          name: service.name || service.code || carrier.name,
          charge: getServiceBaseAmount(service),
          serviceCharge,
          total,
          currency,
          carrierId: carrier.carrier_id,
          carrierCode: carrier.carrier_code,
          carrierName: carrier.name,
        },
      });

      toast.success(response.data?.message || "Label generated successfully", { id: "label-generate" });
      setServices([]);
      setActiveQuoteId("");
      setSelectedQuote(null);
      reset(defaultValues);
      await Promise.all([fetchWallet(), refreshLabelQuotes()]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to generate label", { id: "label-generate" });
    } finally {
      setGeneratingKey("");
    }
  };

  const handleInventoryChange = (selectedInventory) => {
    if (!selectedInventory) return;

    append({
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
    setSelectedInventoryId("");
  };

  const handleQuoteSelect = (quote) => {
    setActiveQuoteId(quote.id);
    setSelectedQuote(quote);
    reset({
      initiation: quote.initiation?.id || quote.initiationId || "",
      destination: quote.destination?.id || quote.destinationId || "",
      option: {
        reference_number: "",
        memo: "",
      },
      packageList: {
        type: quote.orderType || "pak",
        packages: normalizeQuotePackages(quote),
      },
    });
    setServices(getQuoteCarriers(quote.metadeta));
    toast.success("Saved quote loaded. Select a service to generate the label.", { id: "label-quote-load" });
  };

  const handleResetForm = () => {
    reset(defaultValues);
    setServices([]);
    setActiveQuoteId("");
    setSelectedQuote(null);
  };

  return (
    <div className="space-y-6 p-6">
      {lowBalance && (
        <div className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-bold">Low credit balance: {formatMoney(walletBalance)} remaining</p>
              <p className="mt-1 text-sm text-amber-800">You need enough wallet balance before generating a label.</p>
            </div>
          </div>
          <Link href={PROJECT_URL.DASHBOARD_CREDIT_WALLET} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-700 px-3 text-sm font-medium text-white transition hover:bg-amber-800">
              <Wallet className="size-4" />
              Top Up
          </Link>
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-[#2d2047] bg-[#140821] text-white shadow-xl shadow-purple-950/10">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_310px] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-purple-100">
              <Tag className="size-4" />
              Label workspace
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Label Generator</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#cdbfe2]">
              Load a saved quote or build a shipment from saved addresses, then generate the label using wallet credits.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a995c9]">Available credits</p>
            <div className="mt-3 text-3xl font-bold">{walletLoading ? "Loading..." : formatMoney(walletBalance)}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={PROJECT_URL.DASHBOARD_CREDIT_WALLET} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-[#1b0c2b] transition hover:bg-purple-50">
                <Wallet className="size-4" />
                Top Up
              </Link>
              <Button type="button" variant="outline" className="h-9 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={fetchWallet}>
                <RefreshCwIcon className="size-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="rounded-lg border border-gray-200 bg-white shadow-sm xl:self-start">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-950">Saved Quotes</h2>
            <p className="text-sm text-gray-500">Ready for label generation.</p>
          </div>
          <Button variant="outline" size="icon" onClick={refreshLabelQuotes} disabled={labelQuotesLoading}>
            <RefreshCwIcon className={`size-4 ${labelQuotesLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {labelQuotesLoading && labelQuotes.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm font-semibold text-gray-500">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading saved quotes
          </div>
        ) : labelQuotes.length === 0 ? (
          <div className="px-5 py-8 text-sm text-gray-500">No saved quotes are waiting for label generation.</div>
        ) : (
          <div id="saved-quotes-scroll" className="max-h-[620px] overflow-y-auto">
            <InfiniteScroll
              dataLength={labelQuotes.length}
              next={loadMoreLabelQuotes}
              hasMore={labelQuotesPagination.page < labelQuotesPagination.totalPages}
              loader={(
                <div className="flex items-center justify-center px-5 py-4 text-sm font-semibold text-gray-500">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Loading more quotes
                </div>
              )}
              scrollableTarget="saved-quotes-scroll"
            >
          <div className="divide-y divide-gray-100">
            {labelQuotes.map((quote) => (
              <button
                key={quote.id}
                type="button"
                className={`block w-full px-5 py-4 text-left transition hover:bg-purple-50/60 ${activeQuoteId === quote.id ? "bg-purple-50" : "bg-white"}`}
                onClick={() => handleQuoteSelect(quote)}
              >
                <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-950">{getQuoteLabel(quote)}</p>
                  <p className="mt-1 text-sm text-gray-500">{formatDate(quote.createdAt)}</p>
                </div>
                  <span className={`rounded-lg px-2 py-1 text-xs font-bold ${activeQuoteId === quote.id ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    {activeQuoteId === quote.id ? "Loaded" : "Use"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-gray-500">
                  <span className="rounded-md bg-gray-50 px-2 py-1">{quote.packageLists?.length || 0} package(s)</span>
                  <span className="rounded-md bg-gray-50 px-2 py-1">{quote.orderType || "pak"}</span>
                </div>
              </button>
            ))}
          </div>
            </InfiniteScroll>
          </div>
        )}
      </aside>

      <div className="space-y-6">
      <form className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit(onQuote)}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">Create Shipping Label</h2>
            <p className="mt-1 text-sm text-gray-500">Choose saved addresses, package details, then select a quoted service.</p>
          </div>
          <Button type="button" variant="outline" onClick={handleResetForm}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-gray-700">
            From address
            <Controller control={control} name="initiation" render={({ field }) => (
              <AddressAutocomplete
                error={Boolean(errors.initiation)}
                helperText={errors.initiation?.message}
                label="From address"
                onChange={field.onChange}
                placeholder="From address"
                selectedAddressOption={selectedQuote?.initiation}
                value={field.value || ""}
              />
            )} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-gray-700">
            To address
            <Controller control={control} name="destination" render={({ field }) => (
              <AddressAutocomplete
                error={Boolean(errors.destination)}
                helperText={errors.destination?.message}
                label="To address"
                onChange={field.onChange}
                placeholder="To address"
                selectedAddressOption={selectedQuote?.destination}
                value={field.value || ""}
              />
            )} />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr_1fr]">
          <label className="grid gap-2 text-sm font-medium text-gray-700">
            Package type
            <Controller control={control} name="packageList.type" render={({ field }) => (
              <Select value={field.value || "pak"} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <span className="capitalize">{field.value || "pak"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="env">Envelope</SelectItem>
                  <SelectItem value="pak">Pak</SelectItem>
                  <SelectItem value="parcel">Parcel</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </label>

          <label className="grid gap-2 text-sm font-medium text-gray-700">
            Reference number
            <Input {...register("option.reference_number")} placeholder="Optional reference" />
          </label>

          <label className="grid gap-2 text-sm font-medium text-gray-700">
            Memo
            <Input {...register("option.memo")} placeholder="Optional memo" />
          </label>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#5b6b9c]">Packages</h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="w-full sm:w-72">
                <InventoryAutocomplete
                  value={selectedInventoryId}
                  onChange={handleInventoryChange}
                  placeholder="Choose inventory"
                />
              </div>
              <Button type="button" variant="outline" onClick={() => append(defaultPackage)}>
                <Plus className="size-4" />
                Add Package
              </Button>
            </div>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold text-gray-950">Package {index + 1}</p>
                <Button type="button" variant="outline" size="icon" disabled={fields.length === 1} onClick={() => remove(index)}>
                  <Trash className="size-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-6">
                <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                  Name
                  <Input {...register(`packageList.packages.${index}.name`)} placeholder="Package name" />
                </label>
                <label className="grid gap-2 text-sm font-medium text-gray-700">
                  Weight
                  <Input type="number" step="any" {...register(`packageList.packages.${index}.weight`)} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-gray-700">
                  Length
                  <Input type="number" step="any" {...register(`packageList.packages.${index}.dimension.length`)} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-gray-700">
                  Width
                  <Input type="number" step="any" {...register(`packageList.packages.${index}.dimension.width`)} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-gray-700">
                  Height
                  <Input type="number" step="any" {...register(`packageList.packages.${index}.dimension.height`)} />
                </label>
                <label className="grid gap-2 text-sm font-medium text-gray-700">
                  Insurance
                  <Input type="number" step="any" {...register(`packageList.packages.${index}.insurance`)} />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={quoting}>
            {quoting ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
            Generate Rates
          </Button>
        </div>
      </form>

      {(serviceRows.length > 0 || warningRows.length > 0) && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-gray-950">Select Service</h2>
            <p className="text-sm text-gray-500">Generating a label deducts the grand total from wallet credits.</p>
          </div>
          <div className="divide-y divide-gray-100">
            {serviceRows.map((row) => {
              const key = `${row.carrier.carrier_id}-${row.service.id}-${row.service.token}`;
              const canAfford = walletBalance >= row.total;
              const chargeDetails = row.service.charge_details || [];
              const isBestPrice = bestServiceTotal != null && row.total === bestServiceTotal;
              return (
                <div key={key} className="grid gap-4 p-5 lg:grid-cols-[1fr_300px]">
                  <div className="flex gap-3">
                    <CarrierBrand name={row.carrier.name || row.carrier.carrier_code || "Carrier"} showName={false} logoClassName="h-12 w-12 rounded-lg p-1.5" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-950">{row.service.name || row.service.code || row.carrier.name}</h3>
                        {isBestPrice && <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">BEST PRICE</span>}
                      </div>
                    <div className="mt-2 grid gap-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">Carrier: <CarrierBrand name={row.carrier.name || "-"} /></div>
                      <div>Code: {row.service.code || "-"}</div>
                        <div>ETA: <span className="text-red-500">{row.service.eta || "Not Guaranteed"}</span></div>
                        <div>Zone: {row.service.zone_id || "-"}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <span>Estimated Rate:</span>
                        <span className="text-red-500">{formatMoney(getServiceBaseAmount(row.service), row.currency)}</span>
                      </div>
                      {chargeDetails.map((detail) => (
                        <div key={`${key}-${detail.code}`} className="flex justify-between gap-4 text-gray-500">
                          <span>{detail.name}:</span>
                          <span className="text-red-500">{formatMoney(detail.price, row.currency)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between gap-4 text-gray-500">
                        <span>Service Charge:</span>
                        <span className="text-red-500">{formatMoney(row.serviceCharge, row.currency)}</span>
                      </div>
                      <div className="mt-2 border-t border-dashed border-slate-300 pt-2">
                        <div className="flex justify-between gap-4 text-base font-bold">
                          <span>Grand Total({row.currency}):</span>
                          <span className="text-red-500">{formatMoney(row.total, row.currency)}</span>
                        </div>
                      </div>
                    </div>
                    <Button type="button" className={`w-full ${isBestPrice ? "bg-amber-500 text-white hover:bg-amber-600" : ""}`} disabled={!canAfford || generatingKey === key} onClick={() => handleGenerateLabel(row)}>
                      {generatingKey === key ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                      {canAfford ? "Generate Label" : "Insufficient Balance"}
                    </Button>
                  </div>
                </div>
              );
            })}
            {warningRows.map((carrier) => (
              <div key={carrier.carrier_id || carrier.carrier_code || carrier.name} className="flex gap-3 p-5">
                <CarrierBrand name={carrier.name || carrier.carrier_code || "Carrier"} showName={false} logoClassName="h-12 w-12 rounded-lg p-1.5" />
                <div>
                  <div className="flex items-center gap-2 text-lg font-bold text-amber-600">
                    <AlertTriangle className="size-5" />
                    <span className="inline-flex items-center gap-1">Warning (<CarrierBrand name={carrier.name || "Carrier"} logoClassName="h-6 w-6" />):</span>
                  </div>
                  <p className="text-sm text-red-500">{carrier.message || "This service is not available for the selected conditions."}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
      </div>
    </div>
  );
}
