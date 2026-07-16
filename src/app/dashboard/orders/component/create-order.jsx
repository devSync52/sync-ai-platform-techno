import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateOrderForm() {
    return (
        <form className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                        Customer Name
                        <Input placeholder="Enter customer name..." />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                        Reference Number
                        <Input placeholder="Enter reference number..." />
                    </label>
                </div>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Pickup Address
                    <Input placeholder="Enter pickup address..." />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Delivery Address
                    <Input placeholder="Enter delivery address..." />
                </label>

                <div className="grid gap-4 sm:grid-cols-4">
                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                        Weight
                        <Input type="number" placeholder="0.0" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                        Length
                        <Input type="number" placeholder="0.0" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                        Width
                        <Input type="number" placeholder="0.0" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-slate-700">
                        Height
                        <Input type="number" placeholder="0.0" />
                    </label>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button type="button">
                    Create Order
                </Button>
            </div>
        </form>
    );
}
