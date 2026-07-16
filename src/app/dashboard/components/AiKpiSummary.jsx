import IconAsset from "@/components/IconAsset";

export default function AiKpiSummary() {
    return (
        <section className="rounded-xl bg-[#130926] p-6 text-white shadow-[0_16px_36px_rgba(19,9,38,0.18)]">
            <div className="mb-12 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <IconAsset name="bot" className="h-5 w-5 rounded" />
                </div>
                <h2 className="text-base font-semibold">AI KPI Summary</h2>
            </div>

            <p className="mb-5 text-sm leading-5 text-[#d8d0ea]">
                Get an AI-generated executive summary of your current KPI performance and actionable
                insights.
            </p>

            <button className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-white/25 text-xs font-semibold text-white">
                <IconAsset name="bot" className="h-3.5 w-3.5 rounded-sm" />
                Generate Summary
            </button>
        </section>
    );
}
