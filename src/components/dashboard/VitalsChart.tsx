"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export type VitalsPoint = {
  date: string;
  heart_rate?: number;
  spo2?: number;
  glucose?: number;
  systolic_bp?: number;
};

export function VitalsChart({ data }: { data: VitalsPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="rgba(148,197,255,0.08)" vertical={false} />
        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#0a1226",
            border: "1px solid rgba(148,197,255,0.2)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelStyle={{ color: "#cbd5f5" }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
        <Line type="monotone" dataKey="heart_rate" name="Heart Rate (bpm)" stroke="#f472b6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#2dd4bf" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="glucose" name="Glucose (mg/dL)" stroke="#a78bfa" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="systolic_bp" name="Systolic BP" stroke="#22d3ee" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
