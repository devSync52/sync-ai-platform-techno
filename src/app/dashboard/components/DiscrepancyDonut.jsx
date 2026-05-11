"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { discrepancyData } from "./data";

function DiscrepancyTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-2xl border border-[#e8e2ef] bg-white px-3 py-2 text-sm text-[#171321] shadow-[0_16px_36px_rgba(15,13,42,0.08)]">
      {name} : {value}
    </div>
  );
}

export default function DiscrepancyDonut() {
  return (
    <div className="grid h-[245px] grid-rows-[1fr_auto]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<DiscrepancyTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Pie
            data={discrepancyData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={76}
            paddingAngle={2}
            stroke="none"
          >
            {discrepancyData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2 pb-1">
        {discrepancyData.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-[#635c78]">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
              {entry.name}
            </div>
            <span className="font-medium text-[#171321]">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
