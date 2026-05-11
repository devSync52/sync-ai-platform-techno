import IconAsset from "@/components/IconAsset";
import { colorMap } from "./data";

export default function MetricCard({ metric }) {
  const colors = colorMap[metric.color];

  return (
    <article className="h-44.25 rounded-xl border border-[#ece8f2] bg-white p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.icon}`}>
          <IconAsset name={metric.icon} className="h-4 w-4" />
        </div>
        {
          metric.badge && (
            <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${colors.badge}`}>
              {metric.badge}
            </span>
          )
        }
      </div>
      <div className={`text-2xl font-bold ${metric.strong ? "text-red-500" : colors.value}`}>
        {metric.value}
      </div>
      <div className="mt-1 text-sm text-[#68607f]">{metric.label}</div>
    </article>
  );
}
