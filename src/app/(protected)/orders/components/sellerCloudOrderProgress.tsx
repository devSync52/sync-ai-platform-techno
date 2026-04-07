"use client";

import { Package, CreditCard, RefreshCw, Truck, Home, AlertTriangle, CheckCircle, } from "lucide-react";

// ─── SellerCloud numeric status codes ────────────────────────────────────────

export const ORDER_STATUS = {
    "-1": "Canceled",
    "1": "ShoppingCart",
    "2": "InProcess",
    "3": "Completed",
    "100": "ProblemOrder",
    "200": "OnHold",
    "300": "Quote",
    "999": "Void",
} as const;

export const PAYMENT_STATUS = {
    "10": "NoPayment",
    "11": "NoPaymentOrPartialPayment",
    "20": "Authorized",
    "30": "Charged",
    "40": "Uncleared",
    "50": "PartialRefund",
    "60": "FullRefund",
    "61": "PartialOrFullRefund",
    "70": "PartiallyPaid",
    "71": "ChargedOrPartialRefund",
    "80": "EbayPaid",
    "81": "EbayPaidOrPartialPayment",
    "99": "PaymentError",
} as const;

export const SHIPPING_STATUS = {
    "0": "Unknown",
    "1": "Unshipped",
    "2": "PartiallyShipped",
    "3": "FullyShipped",
    "4": "InTransit",
    "5": "OutForDelivery",
    "6": "Delivered",
    "7": "ReturnToSender",
    "8": "Undeliverable",
} as const;

type OrderCode = keyof typeof ORDER_STATUS;
type PaymentCode = keyof typeof PAYMENT_STATUS;
type ShipCode = keyof typeof SHIPPING_STATUS;

type OrderName = typeof ORDER_STATUS[OrderCode];
type PaymentName = typeof PAYMENT_STATUS[PaymentCode];
type ShipName = typeof SHIPPING_STATUS[ShipCode];

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrderStepperProps {
    /** Raw numeric code from SellerCloud API  e.g. 2 */
    orderStatusCode: number;
    /** Raw numeric code from SellerCloud API  e.g. 30 */
    paymentStatusCode: number;
    /** Raw numeric code from SellerCloud API  e.g. 4 */
    shippingStatusCode: number;
}

// ─── Step state type ──────────────────────────────────────────────────────────

type StepState = "done" | "active" | "error" | "pending";

interface Step {
    id: string;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    state: StepState;
}

// ─── Resolve logic ────────────────────────────────────────────────────────────

function resolve(
    orderCode: number,
    paymentCode: number,
    shipCode: number
): { steps: Step[]; connectors: boolean[] } {
    const order = ORDER_STATUS[String(orderCode) as OrderCode] ?? "InProcess";
    const payment = PAYMENT_STATUS[String(paymentCode) as PaymentCode] ?? "NoPayment";
    const ship = SHIPPING_STATUS[String(shipCode) as ShipCode] ?? "Unknown";

    const isOrderError = (["Canceled", "ProblemOrder", "OnHold", "Void"] as OrderName[]).includes(order);
    const isPaymentError = (["PaymentError", "FullRefund", "PartialOrFullRefund"] as PaymentName[]).includes(payment);
    const isShipError = (["ReturnToSender", "Undeliverable"] as ShipName[]).includes(ship);

    const orderDone = !isOrderError && (["InProcess", "Completed"] as OrderName[]).includes(order);
    const paymentDone = !isPaymentError && (["Charged", "EbayPaid", "ChargedOrPartialRefund", "EbayPaidOrPartialPayment"] as PaymentName[]).includes(payment);
    const processingDone = orderDone && paymentDone;
    const shipStarted = !isShipError && (["PartiallyShipped", "FullyShipped", "InTransit", "OutForDelivery", "Delivered"] as ShipName[]).includes(ship);
    const delivered = !isShipError && ship === "Delivered";

    const orderState: StepState = isOrderError ? "error" : orderDone ? "done" : "active";
    const paymentState: StepState = isOrderError ? "pending" : isPaymentError ? "error" : paymentDone ? "done" : (["Authorized", "Uncleared", "PartiallyPaid", "NoPaymentOrPartialPayment"] as PaymentName[]).includes(payment) ? "active" : "pending";
    const processingState: StepState = (isOrderError || isPaymentError) ? "pending" : processingDone ? "done" : paymentDone ? "active" : "pending";
    const shipState: StepState = !processingDone ? "pending" : isShipError ? "error" : shipStarted ? (delivered ? "done" : "active") : "active";
    const deliveredState: StepState = delivered ? "done" : "pending";

    const friendlyLabel = (name: string) => name.replace(/([A-Z])/g, " $1").trim();

    const steps: Step[] = [
        { id: "order", label: "Order", sublabel: friendlyLabel(order), icon: Package, state: orderState },
        { id: "payment", label: "Payment", sublabel: friendlyLabel(payment), icon: CreditCard, state: paymentState },
        { id: "processing", label: "Processing", sublabel: processingDone ? "Done" : "Pending", icon: RefreshCw, state: processingState },
        { id: "shipping", label: "Shipping", sublabel: friendlyLabel(ship), icon: Truck, state: shipState },
        { id: "delivered", label: "Delivered", sublabel: delivered ? "Done" : "Pending", icon: Home, state: deliveredState },
    ];

    const connectors = [
        orderDone,
        processingDone,
        processingDone && !isShipError,
        delivered,
    ];

    return { steps, connectors };
}

// ─── Circle ───────────────────────────────────────────────────────────────────

function Circle({ state, Icon }: { state: StepState; Icon: React.ElementType }) {
    const base = "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300";

    if (state == "done") {
        return (
            <div className={base} style={{ background: "linear-gradient(135deg,#4a3adb,#9b3abf)" }}>
                <CheckCircle size={18} className="text-white" strokeWidth={2} />
            </div>
        );
    }

    if (state == "active") {
        return (
            <div className={base} style={{ background: "linear-gradient(135deg,#4a3adb,#9b3abf)", boxShadow: "0 0 0 3px rgba(123,63,196,0.3)" }}>
                <Icon size={18} className="text-white" strokeWidth={1.8} />
            </div>
        );
    }

    if (state == "error") {
        return (
            <div className={`${base} bg-red-50 border border-red-300`}>
                <AlertTriangle size={18} className="text-red-500" strokeWidth={1.8} />
            </div>
        );
    }

    return (
        <div className={`${base} border border-purple-200 bg-transparent`}>
            <Icon size={18} className="text-purple-300" strokeWidth={1.8} />
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerCloudOrderProgress({ orderStatusCode, paymentStatusCode, shippingStatusCode, }: OrderStepperProps) {
    const { steps, connectors } = resolve(orderStatusCode, paymentStatusCode, shippingStatusCode);

    return (
        <div className="flex items-start w-full px-4 py-3">
            {
                steps.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index == steps.length - 1;

                    return (
                        <div key={step.id} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1">
                                <Circle state={step.state} Icon={Icon} />
                                <span className={`text-[10px] font-medium whitespace-nowrap ${step.state == "active" ? "text-purple-600" : step.state == "done" ? "text-purple-500" : step.state == "error" ? "text-red-500" : "text-gray-400"}`}>
                                    {step.label}
                                </span>
                                <span className="text-[9px] text-gray-400 whitespace-nowrap">
                                    {step.sublabel}
                                </span>
                            </div>

                            {
                                !isLast && (
                                    <div className="flex-1 h-[3px] top-[-11px] relative mx-[-1px] mb-7 transition-all duration-500">
                                        <div
                                            className="h-full w-full"
                                            style={
                                                connectors[index] ? {
                                                    background: "linear-gradient(90deg,#4a3adb,#9b3abf)"
                                                } : {
                                                    background: "rgba(139,47,201,0.15)"
                                                }
                                            }
                                        />
                                    </div>
                                )
                            }
                        </div>
                    );
                })
            }
        </div>
    );
}

const sellerCloudStatus = Object.freeze({
    0: {
        name: "Cart",
        style: {
            backgroundColor: "rgba(59, 130, 246, 0.16)",
            color: "#1d4ed8",
            borderColor: "rgba(59, 130, 246, 0.82)",
        }
    },
    1: {
        name: "New",
        style: {
            backgroundColor: "rgba(99, 102, 241, 0.16)",
            color: "#4338ca",
            borderColor: "rgba(99, 102, 241, 0.82)",
        }
    },
    2: {
        name: "Processing",
        style: {
            backgroundColor: "rgba(251, 191, 36, 0.18)",
            color: "#b45309",
            borderColor: "rgba(251, 191, 36, 0.85)",
        }
    },
    3: {
        name: "In Process",
        style: {
            backgroundColor: "rgba(59, 130, 246, 0.18)",
            color: "#1e40af",
            borderColor: "rgba(59, 130, 246, 0.9)",
        }
    },
    4: {
        name: "Partially Shipped",
        style: {
            backgroundColor: "rgba(251, 146, 60, 0.18)",
            color: "#c2410c",
            borderColor: "rgba(251, 146, 60, 0.9)",
        }
    },
    5: {
        name: "Shipped",
        style: {
            backgroundColor: "rgba(34, 197, 94, 0.18)",
            color: "#166534",
            borderColor: "rgba(34, 197, 94, 0.9)",
        }
    },
    6: {
        name: "Cancelled",
        style: {
            backgroundColor: "rgba(239, 68, 68, 0.18)",
            color: "#991b1b",
            borderColor: "rgba(239, 68, 68, 0.9)",
        }
    },
    7: {
        name: "On Hold",
        style: {
            backgroundColor: "rgba(168, 85, 247, 0.18)",
            color: "#6b21a8",
            borderColor: "rgba(168, 85, 247, 0.9)",
        }
    },
    8: {
        name: "Problem",
        style: {
            backgroundColor: "rgba(220, 38, 38, 0.2)",
            color: "#7f1d1d",
            borderColor: "rgba(220, 38, 38, 0.95)",
        }
    },
    9: {
        name: "Returned",
        style: {
            backgroundColor: "rgba(244, 63, 94, 0.18)",
            color: "#9f1239",
            borderColor: "rgba(244, 63, 94, 0.9)",
        }
    },
    10: {
        name: "Completed",
        style: {
            backgroundColor: "rgba(16, 185, 129, 0.18)",
            color: "#065f46",
            borderColor: "rgba(16, 185, 129, 0.9)",
        }
    },
});

type SellerCloudStatusType = typeof sellerCloudStatus[keyof typeof sellerCloudStatus];

export const getSellerCloudStatus = (code: number): SellerCloudStatusType => {
    return sellerCloudStatus[code as keyof typeof sellerCloudStatus] || {
        name: "Unknown",
        style: {
            backgroundColor: "rgba(107, 114, 128, 0.2)",
            color: "#374151",
            borderColor: "rgba(107, 114, 128, 0.8)",
        }
    };
};