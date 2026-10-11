"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";

const VITAL_TYPES = [
  { value: "heart_rate", label: "Heart Rate", unit: "bpm" },
  { value: "spo2", label: "SpO2", unit: "%" },
  { value: "glucose", label: "Glucose", unit: "mg/dL" },
  { value: "systolic_bp", label: "Systolic BP", unit: "mmHg" },
];

export function VitalsQuickAdd() {
  const router = useRouter();
  const [type, setType] = useState(VITAL_TYPES[0].value);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    setSaving(true);
    const unit = VITAL_TYPES.find((v) => v.value === type)?.unit ?? "";
    await fetch("/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, value: Number(value), unit }),
    });
    setValue("");
    setSaving(false);
    router.refresh();
  }

  return (
    <GlassCard className="p-6">
      <h2 className="font-display mb-1 text-base font-semibold text-white">Log a vital reading</h2>
      <p className="mb-4 text-xs text-slate-400">Feeds directly into your dashboard trend chart and timeline.</p>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        >
          {VITAL_TYPES.map((v) => (
            <option key={v.value} value={v.value} className="bg-navy-900">
              {v.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2 text-sm font-semibold text-navy-950 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add reading"}
        </button>
      </form>
    </GlassCard>
  );
}
