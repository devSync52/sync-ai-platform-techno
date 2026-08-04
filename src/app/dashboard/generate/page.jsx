import GenerateQuoteForm from "./component/generate-quote";
import { Sparkles } from "lucide-react";

export default function GenerateQuotePage() {
    return (
        <div className="space-y-6 px-4 py-6 xl:px-6">
            <section className="overflow-hidden rounded-2xl border border-[#2d2047] bg-[#140821] text-white shadow-xl shadow-purple-950/10">
                <div className="p-5 lg:p-7"><div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-purple-100"><Sparkles className="size-4" />Quote workspace</div><h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Generate shipping quotes</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#cdbfe2]">Choose a provider, configure the route and packages, then compare available carrier services and pricing.</p></div>
            </section>

            <GenerateQuoteForm />
        </div>
    );
}
