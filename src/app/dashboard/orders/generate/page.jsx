import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import GenerateQuoteForm from "../component/generate-quote";

export default function GenerateQuotePage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-primary">Generate Quote</h1>
          <p>Generate courier quotes from origin, destination, and package details.</p>
        </div>

        <Link href="/dashboard/orders" className={buttonVariants({ variant: "outline", className: "min-w-24 whitespace-nowrap px-4" })}>
          <ArrowLeft />
          Back
        </Link>
      </div>

      <GenerateQuoteForm />
    </div>
  );
}
