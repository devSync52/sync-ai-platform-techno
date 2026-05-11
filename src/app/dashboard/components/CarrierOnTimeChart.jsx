"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { carrierData } from "./data";

function CarrierTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rate = payload[0].value;
  return (
    <div className="min-w-[170px] rounded-[20px] border border-[#e8e2ef] bg-white p-3 shadow-[0_16px_36px_rgba(15,13,42,0.08)]">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#090514]">
        {label}
      </div>
      <div className="text-sm font-semibold text-[#090514]">
        On-Time Rate : <span className="text-[#090514]">{rate}%</span>
      </div>
    </div>
  );
}

export default function CarrierOnTimeChart() {
  return (
    <div className="h-[210px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={carrierData}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          barCategoryGap="26%"
        >
          <CartesianGrid stroke="#e8e2ef" strokeDasharray="3 4" vertical />
          <XAxis
            dataKey="carrier"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#67607c", fontSize: 11 }}
            minTickGap={12}
          />
          <YAxis
            domain={[70, 100]}
            ticks={[70, 85, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#67607c", fontSize: 11 }}
          />
          <Tooltip content={<CarrierTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="rate" radius={[8, 8, 0, 0]} maxBarSize={48}>
            {carrierData.map((entry) => (
              <Cell key={entry.carrier} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
