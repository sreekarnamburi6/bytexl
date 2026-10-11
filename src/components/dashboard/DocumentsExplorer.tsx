"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";

type Doc = {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  category: string;
  ocrText: string | null;
  ocrConfidence: number | null;
  extractionMethod: string;
  extractedFields: { key: string; label: string; value: string; unit: string; sourceExcerpt: string }[];
  isImage: boolean;
  createdAt: string;
};

type Analysis = {
  documentId: string;
  modelId: string;
  modelScores: { label: string; score: number }[];
  summary: string;
  confidence: number;
  analysisEngine: string;
  createdAt: string;
};

export function DocumentsExplorer() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [analysisByDoc, setAnalysisByDoc] = useState<Record<string, Analysis>>({});

  useEffect(() => {
    Promise.all([fetch("/api/documents"), fetch("/api/analyses")])
      .then(async ([documentsResponse, analysesResponse]) => {
        const [documentData, analysisData] = await Promise.all([
          documentsResponse.json(),
          analysesResponse.json(),
        ]);
        setDocs(documentData.documents ?? []);
        const latestByDocument: Record<string, Analysis> = {};
        for (const analysis of analysisData.analyses ?? []) {
          if (!latestByDocument[analysis.documentId]) latestByDocument[analysis.documentId] = analysis;
        }
        setAnalysisByDoc(latestByDocument);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(docs.map((d) => d.category)))], [docs]);
  const filtered = filter === "All" ? docs : docs.filter((d) => d.category === filter);

  async function handleDelete(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-500">Loading your documents…</div>;
  }

  if (docs.length === 0) {
    return (
      <GlassCard className="flex flex-col items-center gap-3 p-12 text-center">
        <span className="text-4xl">🗂️</span>
        <p className="text-sm text-slate-400">No documents indexed yet.</p>
        <a href="/dashboard/upload" className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-1.5 text-xs font-semibold text-navy-950">
          Upload your first document
        </a>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              filter === c
                ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {filtered.map((d) => {
            const analysis = analysisByDoc[d.id];
            return (
              <motion.div key={d.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="flex h-full flex-col overflow-hidden p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{d.fileName}</p>
                      <p className="text-[11px] text-slate-400">{d.category} · {new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => handleDelete(d.id)} className="shrink-0 rounded-lg px-2 py-1 text-xs text-rose-300 hover:bg-rose-400/10">
                      Delete
                    </button>
                  </div>

                  {d.isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/documents/${d.id}/file`} alt={d.fileName} className="mb-2 h-36 w-full rounded-xl object-cover" />
                  ) : (
                    <a
                      href={`/api/documents/${d.id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-2 flex h-36 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-4xl"
                    >
                      📄
                    </a>
                  )}

                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-300">
                    {d.extractionMethod === "pdf-text"
                      ? "Source: PDF text layer"
                      : d.extractionMethod === "tesseract-ocr"
                        ? `Source: Tesseract OCR · ${Math.round((d.ocrConfidence ?? 0) * 100)}%`
                        : d.extractionMethod === "legacy-simulated"
                          ? "Legacy synthetic text · not a source"
                          : "No readable text · review required"}
                  </span>

                  {d.extractionMethod !== "legacy-simulated" && d.ocrText && (
                    <button
                      onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                      className="mb-2 self-start text-xs text-cyan-300 hover:underline"
                    >
                      {expanded === d.id ? "Hide source text" : "View source text"}
                    </button>
                  )}

                  <AnimatePresence>
                    {expanded === d.id && d.extractionMethod !== "legacy-simulated" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2 space-y-2 rounded-xl bg-black/30 p-2"
                      >
                        <p className="text-[10px] font-semibold uppercase text-cyan-300">Source text · verify against original</p>
                        {d.extractedFields?.length > 0 && (
                          <dl className="grid grid-cols-2 gap-2">
                            {d.extractedFields.map((field) => (
                              <div key={field.key} className="rounded-lg border border-white/10 p-2">
                                <dt className="text-[10px] text-slate-400">{field.label}</dt>
                                <dd className="text-xs text-white">{field.value} {field.unit}</dd>
                                <dd className="text-[9px] text-slate-500">Source: “{field.sourceExcerpt}”</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-slate-300">
                          {d.ocrText}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-auto pt-2">
                    {d.isImage && (
                      <Link
                        href="/dashboard/imaging"
                        className="block w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 py-2 text-center text-xs font-semibold text-cyan-100 hover:bg-cyan-400/20"
                      >
                        Choose a model in Disease Model Lab
                      </Link>
                    )}

                    {analysis && (
                      <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        {analysis.analysisEngine === "keras-3-torch" ? (
                          <>
                            <p className="text-[10px] font-semibold uppercase text-amber-300">Real-time image classification · not a diagnosis</p>
                            <p className="text-xs text-slate-300">{analysis.modelId.replaceAll("_", " ")} · {analysis.summary}</p>
                            <div className="space-y-1.5">
                              {analysis.modelScores.map((score) => (
                                <div key={score.label} className="flex justify-between gap-3 text-[11px]">
                                  <span className="text-slate-400">{score.label}</span>
                                  <span className="font-mono text-cyan-200">{(score.score * 100).toFixed(1)}%</span>
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-500">Model score; not calibrated clinical probability.</p>
                          </>
                        ) : (
                          <p className="text-xs text-amber-200">Legacy simulated findings from an earlier demo version are hidden.</p>
                        )}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
