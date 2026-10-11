"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Disclaimer } from "@/components/ui/Disclaimer";

type UploadStatus = "uploading" | "done" | "error";

type UploadEntry = {
  id: string;
  name: string;
  status: UploadStatus;
  category?: string;
  ocrText?: string;
  confidence?: number;
  extractionMethod?: string;
  error?: string;
};

const CATEGORIES = ["Lab Report", "Prescription", "Radiology Scan", "Medical Image", "Discharge Summary", "General"];

export function Dropzone() {
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      for (const file of accepted) {
        const tempId = `${file.name}-${Date.now()}-${Math.random()}`;
        setEntries((prev) => [{ id: tempId, name: file.name, status: "uploading" }, ...prev]);

        const fd = new FormData();
        fd.append("file", file);
        if (category) fd.append("category", category);

        try {
          const res = await fetch("/api/documents", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) {
            setEntries((prev) =>
              prev.map((e) => (e.id === tempId ? { ...e, status: "error", error: data.error } : e)),
            );
            continue;
          }
          setEntries((prev) =>
            prev.map((e) =>
              e.id === tempId
                ? {
                    ...e,
                    status: "done",
                    category: data.document.category,
                    ocrText: data.document.ocrText,
                    confidence: data.document.ocrConfidence,
                    extractionMethod: data.document.extractionMethod,
                  }
                : e,
            ),
          );
          setExpanded(tempId);
        } catch {
          setEntries((prev) =>
            prev.map((e) => (e.id === tempId ? { ...e, status: "error", error: "Network error" } : e)),
          );
        }
      }
    },
    [category],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: 15 * 1024 * 1024,
  });

  return (
    <div className="space-y-5">
      <GlassCard className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-white">Upload medical documents</h2>
            <p className="text-xs text-slate-400">PDF, PNG, or JPG — up to 15MB. Selectable PDF text is extracted directly; scans and images use Tesseract OCR.</p>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
          >
            <option value="">Auto-detect category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-navy-900">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
            isDragActive ? "border-cyan-400 bg-cyan-400/5" : "border-white/15 hover:border-cyan-400/40 hover:bg-white/[0.03]"
          }`}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{ y: isDragActive ? -6 : 0 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-3xl"
          >
            📤
          </motion.div>
          <p className="text-sm font-medium text-white">
            {isDragActive ? "Drop to upload…" : "Drag & drop files here, or click to browse"}
          </p>
          <p className="text-xs text-slate-500">Lab reports · Prescriptions · X-rays · MRIs · Discharge summaries</p>
        </div>
      </GlassCard>

      <Disclaimer text="Extracted text is source transcription, not an AI explanation. Selectable PDF text is parsed directly; scanned PDFs and images use Tesseract OCR. OCR can be inaccurate, so verify every value against the original file." />

      <div className="space-y-3">
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <GlassCard className="overflow-hidden p-4">
                <div
                  className="flex cursor-pointer items-center justify-between gap-3"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-xl">
                      {entry.status === "uploading" ? "⏳" : entry.status === "error" ? "⚠️" : "✅"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{entry.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {entry.status === "uploading"
                          ? "Uploading & extracting source text…"
                          : entry.status === "error"
                            ? entry.error
                            : `${entry.category} · ${entry.extractionMethod === "pdf-text" ? "PDF text layer" : entry.extractionMethod === "tesseract-ocr" ? `Tesseract OCR · ${Math.round((entry.confidence ?? 0) * 100)}%` : "No text extracted; review required"}`}
                      </p>
                    </div>
                  </div>
                  {entry.status === "done" && entry.ocrText && (
                    <span className="text-xs text-cyan-300">{expanded === entry.id ? "Hide" : "View text"}</span>
                  )}
                </div>
                <AnimatePresence>
                  {expanded === entry.id && entry.status === "done" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      <p className="text-[10px] font-semibold uppercase text-cyan-300">Source text · verify against original</p>
                      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                        {entry.ocrText || "No readable text was found. Check image quality or enter values manually."}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
