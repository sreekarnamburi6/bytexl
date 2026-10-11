"use client";

import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Disclaimer } from "@/components/ui/Disclaimer";

type DiseaseModel = {
  id: string;
  name: string;
  disease: string;
  modality: string;
  labels: string[];
  enabled: boolean;
  disabled_reason?: string;
};

type ModelOutput = {
  modelId: string;
  modelName: string;
  label: string;
  score: number;
  scores: { label: string; score: number }[];
  analysisEngine: string;
  disclaimer: string;
};

export function ImagingLab() {
  const [models, setModels] = useState<DiseaseModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "done" | "error">("idle");
  const [result, setResult] = useState<ModelOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/models", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Could not connect to the local model service.");
        if (active) {
          setModels(data.models ?? []);
          setSelectedModelId((data.models ?? []).find((model: DiseaseModel) => model.enabled)?.id ?? "");
        }
      })
      .catch((cause: unknown) => {
        if (active) setModelsError(cause instanceof Error ? cause.message : "Could not connect to the local model service.");
      })
      .finally(() => {
        if (active) setModelsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectedModel = models.find((model) => model.id === selectedModelId && model.enabled);

  async function onDrop(accepted: File[]) {
    const file = accepted[0];
    if (!file) return;
    if (!selectedModel || !confirmed) {
      setError("Select a model and confirm the image matches its required image type.");
      return;
    }

    setError(null);
    setResult(null);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setStatus("uploading");

    try {
      const uploadForm = new FormData();
      uploadForm.set("file", file);
      uploadForm.set("category", "Medical Image");
      const uploadResponse = await fetch("/api/documents", { method: "POST", body: uploadForm });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error ?? "Image upload failed.");

      setStatus("analyzing");
      const analysisResponse = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: uploadData.document.id, modelId: selectedModel.id }),
      });
      const analysisData = await analysisResponse.json();
      if (!analysisResponse.ok) throw new Error(analysisData.error ?? "Model inference failed.");

      setResult(analysisData.analysis);
      setStatus("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Model inference failed.");
      setStatus("error");
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      setError(
        code === "file-too-large"
          ? "Image is larger than the 15 MB limit."
          : code === "file-invalid-type"
            ? "Choose a PNG or JPEG image."
            : "Upload one PNG or JPEG image at a time.",
      );
      setResult(null);
      setPreviewUrl(null);
      setFileName("");
      setStatus("error");
    },
    disabled: !selectedModel || !confirmed || modelsLoading,
    maxFiles: 1,
    maxSize: 15 * 1024 * 1024,
    accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
  });

  return (
    <div className="space-y-5">
      {modelsError && (
        <GlassCard className="border border-amber-400/30 p-4">
          <p className="text-sm font-semibold text-amber-200">Local disease models unavailable</p>
          <p className="mt-1 text-xs text-slate-300">{modelsError} Start the Python model service to enable inference.</p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <GlassCard className="space-y-4 p-6">
          <div>
            <h2 className="font-display mb-1 text-base font-semibold text-white">Disease model</h2>
            <p className="text-xs text-slate-400">Choose the model that matches the image type you are uploading.</p>
          </div>

          <label className="block text-xs font-medium text-slate-300">
            Model
            <select
              value={selectedModelId}
              onChange={(event) => {
                setSelectedModelId(event.target.value);
                setConfirmed(false);
                setResult(null);
                setStatus("idle");
              }}
              disabled={modelsLoading || models.filter((model) => model.enabled).length === 0}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              {modelsLoading && <option value="">Loading available models…</option>}
              {!modelsLoading && models.filter((model) => model.enabled).length === 0 && <option value="">No models available</option>}
              {models.filter((model) => model.enabled).map((model) => (
                <option key={model.id} value={model.id}>{model.disease} · {model.modality}</option>
              ))}
            </select>
          </label>

          {selectedModel && (
            <p className="text-xs text-slate-400">{selectedModel.name} · {selectedModel.labels.length} output classes</p>
          )}

          <label className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 accent-cyan-400"
            />
            <span>
              I confirm this image is a {selectedModel?.modality ?? "matching image"} for the selected model.
              Results are image classifications, not medical diagnoses.
            </span>
          </label>

          <div
            {...getRootProps()}
            className={`relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition ${
              !selectedModel || !confirmed
                ? "cursor-not-allowed border-white/10 opacity-50"
                : isDragActive
                  ? "border-cyan-400 bg-cyan-400/5"
                  : "border-white/15 hover:border-cyan-400/40 hover:bg-white/[0.03]"
            }`}
          >
            <input {...getInputProps()} />
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={fileName} className="absolute inset-0 h-full w-full object-contain opacity-75" />
            ) : (
              <>
                <span className="text-4xl">🩻</span>
                <p className="text-sm font-medium text-white">
                  {isDragActive ? "Drop image to run the selected model…" : "Drag and drop a PNG/JPG image, or browse"}
                </p>
              </>
            )}
            {(status === "uploading" || status === "analyzing" || status === "done") && (
              <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-slate-950/85 px-3 py-2 text-left text-xs text-white">
                {status === "uploading" && "Saving image to your private account storage…"}
                {status === "analyzing" && `Running ${selectedModel?.name ?? "selected model"}…`}
                {status === "done" && `Model result ready — ${fileName}`}
              </div>
            )}
          </div>

          {status === "error" && error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
          <p className="text-[11px] text-slate-500">PNG or JPEG · maximum 15 MB · sent only to the local model service</p>
        </GlassCard>

        <GlassCard className="min-h-[360px] p-6">
          <h2 className="font-display mb-1 text-base font-semibold text-white">Real-time image classification</h2>
          <p className="mb-4 text-xs text-slate-400">Scores are classifier outputs, not medical diagnoses.</p>

          {result ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
                <p className="text-[10px] font-semibold uppercase text-amber-300">Not a diagnosis</p>
                <p className="mt-1 text-lg font-semibold text-white">{result.label}</p>
                <p className="mt-1 text-xs text-slate-300">Top model score: {(result.score * 100).toFixed(1)}%</p>
                <p className="mt-2 text-[11px] text-slate-400">{result.modelName} · {result.analysisEngine}</p>
              </div>
              <div className="space-y-2">
                {result.scores.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 px-3 py-2 text-xs">
                    <span className="text-slate-200">{item.label}</span>
                    <span className="font-mono text-cyan-200">{(item.score * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <Disclaimer text={result.disclaimer} />
            </motion.div>
          ) : (
            <div className="flex min-h-[250px] flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
              <span className="text-3xl">🧪</span>
              {modelsLoading ? "Loading model catalog…" : "Choose a model, confirm, and upload a matching image."}
            </div>
          )}
        </GlassCard>
      </div>

      {models.some((model) => !model.enabled) && (
        <details className="rounded-lg border border-white/10 px-4 py-3 text-xs text-slate-400">
          <summary className="cursor-pointer text-slate-300">Models not enabled</summary>
          <ul className="mt-3 space-y-2">
            {models.filter((model) => !model.enabled).map((model) => (
              <li key={model.id}><span className="text-slate-200">{model.name}:</span> {model.disabled_reason}</li>
            ))}
          </ul>
        </details>
      )}

      <Disclaimer text={`Upload only the selected model's required image type${selectedModel ? ` (${selectedModel.modality})` : ""}. Image type is not automatically verified. Results are not medical diagnoses.`} />
    </div>
  );
}