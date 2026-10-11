"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { createPdf, type ReportData } from "@/lib/report-pdf";

export function MedicalReportCard() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(download: boolean) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load report data.");
      const pdf = createPdf(data as ReportData);
      if (download) {
        pdf.save("mediscope-health-report.pdf");
      } else {
        const blob = pdf.output("blob");
        setPreviewUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return URL.createObjectURL(blob);
        });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to generate this report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => generate(false)}
          disabled={loading}
          className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
        >
          {loading ? "Preparing…" : "Preview report"}
        </button>
        <button
          onClick={() => generate(true)}
          disabled={loading}
          className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          Download PDF
        </button>
      </div>

      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

      {previewUrl ? (
        <iframe title="Medical report PDF preview" src={previewUrl} className="h-[75vh] min-h-[520px] w-full rounded-lg border border-white/10 bg-white" />
      ) : (
        <GlassCard className="p-6 text-sm text-slate-300">
          <h2 className="font-display text-base font-semibold text-white">Medical report card</h2>
          <p className="mt-2">The report is assembled on demand from this account’s manually entered vitals and document extractions.</p>
          <p className="mt-2 text-xs text-slate-400">Demo vitals, legacy synthetic OCR, and model output are excluded. OCR text must be checked against its original document.</p>
        </GlassCard>
      )}
    </div>
  );
}