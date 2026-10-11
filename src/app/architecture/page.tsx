import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { GlassCard } from "@/components/ui/GlassCard";

const SANDBOX_LAYERS = [
  {
    title: "Client Layer",
    color: "from-cyan-400/20",
    items: [
      "Next.js 16 App Router (React 19, TypeScript)",
      "Tailwind CSS 4 — glassmorphism design system",
      "Framer Motion — cinematic transitions",
      "Three.js / React-Three-Fiber — 3D hologram intro & login",
      "Recharts — user-entered vitals trends",
    ],
  },
  {
    title: "Application / API Layer",
    color: "from-violet-400/20",
    items: [
      "Next.js Route Handlers (Node.js runtime) — REST-style endpoints",
      "JWT (jose) signed httpOnly session cookies",
      "bcryptjs password hashing",
      "Next.js proxy for JWT checks and same-origin mutation checks",
      "pdf-parse selectable-PDF extraction + local Tesseract OCR",
      "Loopback Flask model service: seven Keras 3/PyTorch H5 classifiers",
      "Rule-based localized guide; no hosted LLM",
      "Owner-scoped report endpoint and on-demand jsPDF export",
    ],
  },
  {
    title: "Data Layer",
    color: "from-teal-400/20",
    items: [
      "PostgreSQL (Drizzle ORM, typed schema & migrations)",
      "Tables: users, documents, analyses, timeline_events, chat_messages, vitals",
      "Private local filesystem storage (data/uploads), served through owner checks",
    ],
  },
];

const TARGET_LAYERS = [
  {
    title: "Frontend",
    items: ["React 18 + Vite", "TypeScript", "Tailwind CSS", "Framer Motion", "Three.js"],
  },
  {
    title: "Backend",
    items: ["Python FastAPI", "Pydantic models", "JWT auth (python-jose)", "Async OCR / vision workers (Celery + Redis)"],
  },
  {
    title: "AI Services",
    items: [
      "OCR: Tesseract / Google Vision / AWS Textract",
      "Imaging triage: fine-tuned vision transformer (with radiologist-in-the-loop)",
      "Copilot: LLM (GPT-4o / Llama) + RAG over patient corpus + translation layer",
    ],
  },
  {
    title: "Data & Infra",
    items: ["MongoDB Atlas (documents, timelines, chat)", "S3-compatible object storage for scans", "Docker + CI/CD", "Cloud: AWS/GCP/Azure, HIPAA-aligned controls"],
  },
];

export default function ArchitecturePage() {
  return (
    <main className="min-h-screen px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-sm text-slate-400 hover:text-cyan-300">← Back home</Link>
        </div>

        <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">System Architecture</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-400">
          MEDISCOPE AI was specified around a Python FastAPI + MongoDB Atlas + React/Vite stack.
          This hackathon build runs on the sandbox&apos;s supported Next.js + PostgreSQL stack, which
          implements the exact same product surface and data model 1:1. Both views are documented
          below so judges can evaluate the live prototype and the intended production design.
        </p>

        <h2 className="font-display mt-10 mb-4 text-xl font-semibold text-cyan-300">
          ① What is actually running in this demo
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {SANDBOX_LAYERS.map((layer, i) => (
            <GlassCard key={layer.title} className="relative overflow-hidden p-5">
              <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${layer.color} to-transparent blur-2xl`} />
              <p className="relative mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Layer {i + 1}
              </p>
              <h3 className="font-display relative mb-3 text-base font-semibold text-white">{layer.title}</h3>
              <ul className="relative space-y-2 text-xs text-slate-300">
                {layer.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="text-cyan-400">▹</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>

        <div className="my-6 flex items-center justify-center gap-3 text-slate-500">
          <span className="h-px w-24 bg-gradient-to-r from-transparent to-slate-600" />
          <span className="text-xs">request / response flow</span>
          <span className="h-px w-24 bg-gradient-to-l from-transparent to-slate-600" />
        </div>

        <GlassCard strong className="p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Data flow — document upload to insight</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-center text-xs text-slate-200">
            {[
              "Drag & drop PDF/PNG/JPG",
              "POST /api/documents",
              "Private file + owner-scoped metadata",
              "PDF text parsing or local Tesseract OCR",
              "Source excerpts saved to PostgreSQL",
              "Timeline event created",
              "Dashboard & Copilot read live data",
            ].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-3">
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">{step}</span>
                {i < arr.length - 1 && <span className="text-cyan-400">→</span>}
              </div>
            ))}
          </div>
        </GlassCard>

        <h2 className="font-display mt-14 mb-4 text-xl font-semibold text-violet-300">
          ② Target production architecture (as specified)
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {TARGET_LAYERS.map((layer) => (
            <GlassCard key={layer.title} className="p-5">
              <h3 className="font-display mb-3 text-base font-semibold text-white">{layer.title}</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {layer.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <span className="text-violet-400">▹</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="mt-6 p-6 text-sm leading-relaxed text-slate-300">
          <h3 className="font-display mb-2 text-base font-semibold text-white">Why the mapping is safe</h3>
          <p>
            Both stacks share the same contract: a stateless REST API, a relational/document store
            keyed by <code className="rounded bg-white/10 px-1">userId</code>, server-side session
            auth, and application service boundaries. PDF parsing and Tesseract OCR are real
            transcription but can make mistakes; values retain source excerpts. The health guide
            is rule-based and no hosted LLM is integrated. Seven supplied H5 image classifiers are
            exposed through a loopback-only Python service and return experimental class scores,
            not diagnoses or clinical risk levels. The skin model has an unresolved seven-class
            map and remains disabled. No tabular heart model is included.
          </p>
        </GlassCard>

        <div className="mt-10 text-center">
          <Link
            href="/presentation"
            className="glow-cyan inline-block rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-6 py-2.5 text-sm font-semibold text-navy-950"
          >
            View pitch deck →
          </Link>
        </div>
      </div>
    </main>
  );
}
