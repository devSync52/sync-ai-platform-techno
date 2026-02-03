'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ShoppingBag } from 'lucide-react'



interface Props {
  total: number
  data: { hour: string; value: number }[]
}

export default function NewOrdersChartCard({ total, data }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-sm text-gray-700">NEW ORDERS</span>
        <span className="text-sm text-primary cursor-pointer">Show number of orders</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
          <ShoppingBag className="text-white w-7 h-7" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">${total.toFixed(2)}</p>
          <p className="text-sm text-gray-400">LAST 24 HOURS</p>
        </div>
      </div>

      <div className="h-[100px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="hour" hide />
            <YAxis hide />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3f2d90"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}