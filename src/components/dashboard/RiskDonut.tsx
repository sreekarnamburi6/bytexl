"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS: Record<string, string> = {
  low: "#2dd4bf",
  moderate: "#facc15",
  elevated: "#fb7185",
};

export function RiskDonut({ counts }: { counts: { low: number; moderate: number; elevated: number } }) {
  const data = [
    { name: "Low", value: counts.low, key: "low" },
    { name: "Moderate", value: counts.moderate, key: "moderate" },
    { name: "Elevated", value: counts.elevated, key: "elevated" },
  ];
  const total = counts.low + counts.moderate + counts.elevated;

  if (total === 0) {
    return (
      <div className="flex h-[200px] flex-col items-center justify-center text-center text-sm text-slate-500">
        <span className="mb-2 text-3xl">🧪</span>
        Run an AI imaging analysis to populate your risk breakdown.
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4}>
            {data.map((d) => (
              <Cell key={d.key} fill={COLORS[d.key]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#0a1226", border: "1px solid rgba(148,197,255,0.2)", borderRadius: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-white">{total}</span>
        <span className="text-[10px] text-slate-400">analyses</span>
      </div>
    </div>
  );
}
