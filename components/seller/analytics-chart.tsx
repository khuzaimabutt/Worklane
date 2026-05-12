"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function AnalyticsChart({ data }: { data: { date: string; earnings: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
          formatter={(v: number) => `$${v.toFixed(2)}`}
        />
        <Line type="monotone" dataKey="earnings" stroke="#0D9488" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
