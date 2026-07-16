"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link2, Pencil, Zap, PanelsLeftBottom, } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useDispatch, useSelector } from "react-redux";
import { FetchIntegrationsAction } from "@/services/actions/integrations";
import ConfigurationComponent from "./component/configuration";
import axiosInstance from "@/config/axios";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { API_URL } from "@/utils/constants";
import CarrierBrand from "@/components/carrier-brand";

const carriers = [
    {
        name: "USPS",
        slug: "USPS",
        subtitle: "United States Postal Service",
        icon: "US",
        logo: "US",
        logoClass: "bg-slate-100 text-slate-950",
        color: "bg-slate-100",
        url: "https://api.usps.com/",
        development: "https://developers.usps.com/",
    },
    {
        name: "FedEx",
        slug: "FedEx",
        subtitle: "Federal Express Corporation",
        icon: "📦",
        logo: "FX",
        logoClass: "bg-purple-100 text-purple-950",
        color: "bg-purple-100",
        url: "https://apis.fedex.com/",
        development: "https://developers.fedex.com/"
    },
    {
        name: "UPS",
        slug: "UPS",
        subtitle: "United Parcel Service",
        icon: "⬛",
        logo: "UPS",
        logoClass: "bg-stone-100 text-stone-950",
        color: "bg-stone-100",
        url: "https://onlinetools.ups.com/api/",
        development: "https://developers.ups.com/"
    },
    {
        name: "GoFo",
        slug: "GoFo",
        subtitle: "GoFo Last-Mile Delivery",
        icon: "🚀",
        logo: "GF",
        logoClass: "bg-red-100 text-red-950",
        color: "bg-red-100",
        url: "https://api.gofo.com/v1/",
        development: "https://www.gofo.com/us/developers"
    },
    {
        name: "DHL",
        slug: "DHL",
        subtitle: "DHL Express Worldwide",
        icon: "🌍",
        logo: "DHL",
        logoClass: "bg-yellow-100 text-yellow-950",
        color: "bg-yellow-100",
        url: "https://api-eu.dhl.com/",
        development: "https://developer.dhl.com/"
    },
    {
        name: "Amazon Logistics",
        slug: "AmazonLogistics",
        subtitle: "Amazon Logistics Network",
        icon: "📬",
        logo: "AMZ",
        logoClass: "bg-orange-100 text-orange-950",
        color: "bg-orange-100",
        url: "https://sellingpartnerapi-na.amazon.com/",
        development: "https://developer.amazonservices.com/"
    },
    {
        name: "LaserShip",
        slug: "LaserShip",
        subtitle: "LaserShip Regional Delivery",
        icon: "⚡",
        logo: "LS",
        logoClass: "bg-orange-100 text-orange-950",
        color: "bg-orange-100",
        url: "https://api.lasership.com/",
        development: "https://www.lasership.com/api"
    },
    {
        name: "OnTrac",
        slug: "OnTrac",
        subtitle: "OnTrac Regional Carrier",
        icon: "🔵",
        logo: "OT",
        logoClass: "bg-blue-100 text-blue-950",
        color: "bg-blue-200",
        url: "https://www.ontrac.com/trackingres.asp",
        development: "https://www.ontrac.com/developers"
    },
    {
        name: "Veryk",
        slug: "Veryk",
        subtitle: "Veryk Multi-Carrier Platform — discounted FedEx, USPS & UPS rates",
        icon: "🏷️",
        logo: "VK",
        logoClass: "bg-yellow-100 text-yellow-950",
        color: "bg-yellow-100",
        url: "https://api.veryk.com/v1/",
        development: "https://www.veryk.com/api-documentation"
    },
    {
        name: "Extensive",
        slug: "EXTENSIVE",
        subtitle: "Extensive warehouse and fulfillment operations",
        icon: "EX",
        logo: "EX",
        logoClass: "bg-cyan-100 text-cyan-950",
        color: "bg-cyan-100",
        url: "https://api.extensiv.com/",
        development: "https://developer.extensiv.com/"
    },
    {
        name: "SellerCloud",
        slug: "SELLERCLOUD",
        subtitle: "SellerCloud commerce and order management",
        icon: "SC",
        logo: "SC",
        logoClass: "bg-indigo-100 text-slate-950",
        color: "bg-indigo-100",
        url: "https://api.sellercloud.com/",
        development: "https://developer.sellercloud.com/"
    },
];

export default function CarrierPage() {
    const [viewOperation, setViewOperation] = useState({ show: false, carrier: null, details: null })

    const { data: integrations } = useSelector((state) => state.integrations)

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(FetchIntegrationsAction());
    }, [dispatch])

    const connected = useMemo(() => integrations?.filter(integration => integration.isActive) || [], [integrations]);
    const available = useCallback((provider) => (integrations || [{}])?.find(integration => integration.provider == provider), [integrations]);

    const onToggled = (details) => {
        axiosInstance.patch(API_URL.INTEGRATION_BY_ID(details.id)).then((response) => {
            if (response.data.success) {
                dispatch(FetchIntegrationsAction());
            } else {
                toast.error(response.data.message, { id: 'integration' })
            }
        }).catch((error) => {
            if (error?.response?.data) {
                toast.error(error.response.data.message, { id: 'integration' })
            }
        });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-primary">Carrier Integrations Hub</h1>
                    <p>Manage API credentials and connection status for all your freight carriers.</p>
                </div>

                <div className="flex gap-10">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold text-violet-600">{connected.length}</h2>
                        <p className="text-sm text-gray-500">Connected</p>
                    </div>

                    <div className="text-center">
                        <h2 className="text-4xl font-bold text-black">{integrations?.length || 0}</h2>
                        <p className="text-sm text-gray-500">Available</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {
                    carriers.map((carrier) => (
                        <div key={carrier.slug} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <CarrierBrand name={carrier.name} showName={false} logoClassName="h-14 w-14 rounded-2xl p-1.5" />

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {carrier.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-semibold">
                                            {carrier.subtitle}
                                        </p>
                                    </div>
                                </div>

                                <Switch
                                    checked={available(carrier.slug)?.isActive || false} disabled={!available(carrier.slug)}
                                    onCheckedChange={() => onToggled(available(carrier.slug))}
                                />
                            </div>

                            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
                                <Link2 size={14} />
                                {available(carrier.slug) ? available(carrier.slug)?.isActive ? "Connected" : "Not Connected" : "Not Available"}
                            </div>

                            <div className="mt-5 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-500">
                                {carrier.url}
                            </div>

                            <div className="mt-5 flex items-center gap-3">
                                <button onClick={() => setViewOperation({ show: true, carrier, details: available(carrier.slug) })} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-50">
                                    <Pencil size={16} />
                                    Configure
                                </button>

                                {
                                    available(carrier.slug) && (
                                        <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white hover:bg-gray-50">
                                            <Zap size={18} />
                                        </button>
                                    )
                                }

                                <Link href={carrier.development} target="_blank" className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white hover:bg-gray-50">
                                    <PanelsLeftBottom size={18} />
                                </Link>
                            </div>
                        </div>
                    ))
                }
            </div>
            {
                viewOperation.show && (
                    <ConfigurationComponent
                        open={viewOperation.show} carrier={viewOperation.carrier} details={viewOperation.details}
                        handleClose={() => setViewOperation({ show: false, carrier: null, details: null })}
                    />
                )
            }
        </div>
    );
}
