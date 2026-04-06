import { Box, CreditCard, CreditCardIcon, Home, HomeIcon, Package, RefreshCw, SettingsIcon, Truck, TruckIcon } from "lucide-react";

type SellerCloudOrderProgressType = {
    statusCode: number;
    paymentStatus?: number;
    shipmentStatus?: number;
}

const sellerCloudOrderSteps = [
    { id: 1, label: "Order", icon: Package },
    { id: 2, label: "Payment", icon: CreditCard },
    { id: 3, label: "Processing", icon: RefreshCw },
    { id: 4, label: "Shipped", icon: Truck },
    { id: 5, label: "Delivered", icon: Home },
];

// export const sellerCloudOrderSteps = [
//     { key: "placed", label: "Order Placed", icon: <Box size={15} /> },
//     { key: "paid", label: "Payment", icon: <CreditCardIcon size={15} /> },
//     { key: "processing", label: "Processing", icon: <SettingsIcon size={15} /> },
//     { key: "shipped", label: "Shipped", icon: <TruckIcon size={15} /> },
//     { key: "delivered", label: "Delivered", icon: <HomeIcon size={15} /> },
// ];

export const sellerCloudOrderState = ["Order", "Payment", "Processing", "Shipped", "Delivered",];

export function getOrderStepIndex({ statusCode, paymentStatus, shipmentStatus, }: { statusCode: number; paymentStatus?: number; shipmentStatus?: number; }) {
    if (statusCode == 6) return -1; // Cancelled
    if (statusCode == 8) return -2; // Problem

    // ✅ Delivered
    if (shipmentStatus == 4) return 4;

    // 🚚 Shipped / In Transit
    if (shipmentStatus == 2 || shipmentStatus == 3 || statusCode == 5) {
        return 3;
    }

    // ⚙️ Processing
    if (statusCode == 2 || statusCode == 3) {
        return 2;
    }

    // 💳 Payment done
    if (paymentStatus == 1 || paymentStatus == 2) {
        return 1;
    }

    // 📦 Order placed
    return 0;
}

export default function SellerCloudOrderProgress({ statusCode, paymentStatus, shipmentStatus, }: SellerCloudOrderProgressType) {
    const currentStep = getOrderStepIndex({ statusCode, paymentStatus, shipmentStatus, });

    const isCancelled = currentStep == -1, isProblem = currentStep == -2;

    // Prevent negative width
    const safeStep = Math.max(0, currentStep);

    const progressWidth = (safeStep / (sellerCloudOrderState.length - 1)) * 100;

    // ❌ Special states UI
    if (isCancelled || isProblem) {
        return (
            <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                <p className="text-red-400 font-medium">
                    {isCancelled ? "Order Cancelled" : "Problem with Order"}
                </p>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center w-full px-10 py-6">
            <div className="flex items-center w-full max-w-2xl">
                {
                    sellerCloudOrderSteps.map((step, index) => {
                        const isActive = index == currentStep, isCompleted = index < currentStep, isLast = index == sellerCloudOrderSteps.length - 1;
                        const Icon = step.icon;

                        return (
                            <div key={step.id} className="flex items-center flex-1 last:flex-none">
                                <div className="relative flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isActive ? "shadow-[0_0_0_3px_rgba(123,63,196,0.35),0_0_16px_rgba(139,47,201,0.4)]" : "border border-purple-500/35"}`} style={isActive || isCompleted ? { background: "linear-gradient(135deg, #4a3adb, #9b3abf)" } : {}}>
                                        <Icon
                                            size={15}
                                            className={isActive || isCompleted ? "text-white" : "text-purple-300/70"}
                                            strokeWidth={1.8}
                                        />
                                    </div>
                                </div>
                                {
                                    !isLast && (
                                        <div className="flex-1 h-[3px] mx-[-1px]">
                                            <div className="h-full w-full transition-all duration-500" style={
                                                isCompleted ? {
                                                    background: "linear-gradient(90deg, #4a3adb, #9b3abf)"
                                                } : {
                                                    background: "rgba(139, 47, 201, 0.2)"
                                                }
                                            } />
                                        </div>
                                    )
                                }
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}