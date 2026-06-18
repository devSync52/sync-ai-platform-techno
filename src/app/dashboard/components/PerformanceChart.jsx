"use client";

import { Area, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import { deliveryData } from "./data";

function PerformanceTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const onTimePoint = payload.find((item) => item.dataKey === "onTime");
  const latePoint = payload.find((item) => item.dataKey === "late");

  return (
    <div className="w-40.5 rounded-3xl border border-[#e8e2ef] bg-white p-4 text-sm shadow-[0_16px_36px_rgba(15,13,42,0.08)]">
      <div className="mb-3 text-sm font-semibold text-[#090514]">{label}</div>
      {latePoint && (
        <div className="mb-2 text-sm font-semibold text-[#ff3b4f]">
          Late : {latePoint.value}
        </div>
      )}
      {onTimePoint && (
        <div className="text-sm font-semibold text-[#7b00f5]">
          On-Time : {onTimePoint.value}
        </div>
      )}
    </div>
  );
}

export default function PerformanceChart({ data = deliveryData }) {
  const chartData = data?.length ? data : deliveryData;
  const maxValue = Math.max(...chartData.map((item) => Math.max(item.onTime || 0, item.late || 0)), 60);
  const yMax = Math.ceil(maxValue / 10) * 10;

  return (
    <div className="h-59.5 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 18, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="onTimeFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7b00f5" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#7b00f5" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e8e2ef" strokeDasharray="3 4" vertical />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#67607c", fontSize: 11 }}
          />
          <YAxis
            domain={[0, yMax]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#67607c", fontSize: 11 }}
          />
          <Tooltip
            content={<PerformanceTooltip />}
            cursor={{ stroke: "#7b00f5", strokeDasharray: "3 3", strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="onTime"
            stroke="none"
            fill="url(#onTimeFill)"
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="onTime"
            stroke="#7b00f5"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: "#7b00f5", stroke: "#ffffff", strokeWidth: 3 }}
          />
          <Line
            type="monotone"
            dataKey="late"
            stroke="#ff3b4f"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: "#ff3b4f", stroke: "#ffffff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
