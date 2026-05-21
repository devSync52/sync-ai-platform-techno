import IconAsset from "@/components/IconAsset";
import { colorMap } from "./data";

export default function MetricCard({ metric, index = 0 }) {
  const colors = colorMap[metric.color];

  return (
    <article className="group/card interactive-card motion-fade-up h-44.25 rounded-xl border border-[#ece8f2] bg-white/95 p-5 shadow-[0_1px_3px_rgba(19,12,35,0.08)] backdrop-blur" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm transition group-hover/card:scale-105 ${colors.icon}`}>
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
