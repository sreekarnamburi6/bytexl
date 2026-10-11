"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { GlassCard } from "@/components/ui/GlassCard";

type Slide = {
  eyebrow: string;
  title: string;
  body?: string;
  bullets?: string[];
  footer?: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "01 · Title",
    title: "MEDISCOPE AI",
    body: "A unified health-record prototype with source OCR — by Altrix Labs.",
    bullets: [
      "Hackathon functional prototype",
      "PDF text extraction · Tesseract OCR · rule-based multilingual guide",
      "Built for software employees, healthtech enthusiasts, judges & investors",
    ],
  },
  {
    eyebrow: "02 · Problem",
    title: "Health data is scattered and unreadable",
    bullets: [
      "Patients juggle PDFs, printed reports, WhatsApp scans across clinics & labs",
      "Medical jargon is inaccessible without a doctor nearby to translate it",
      "No single timeline connects vitals, prescriptions, scans and diagnoses",
      "Regional language support is almost nonexistent in health apps",
    ],
  },
  {
    eyebrow: "03 · Solution",
    title: "One AI-unified health command center",
    bullets: [
      "Drag-and-drop OCR ingestion of any report, prescription or scan",
      "Select one of seven local image classifiers and inspect its experimental class scores",
      "Source-grounded rule-based prompts in English, Telugu and Hindi",
      "A single chronological timeline — your whole health story, connected",
    ],
  },
  {
    eyebrow: "04 · Live demo flow",
    title: "What judges can click through right now",
    bullets: [
      "Cinematic 3D intro → secure 3D login (JWT + bcrypt)",
      "Interactive dashboard: collapsible sidebar, user-entered vitals, review status",
      "Upload a report → watch OCR extraction happen in real time",
      "Upload an image → select a matching model → view stored class scores",
      "Use localized prompts grounded in source-labelled account data",
    ],
  },
  {
    eyebrow: "05 · AI approach",
    title: "AI you can trust — because it's transparent",
    bullets: [
      "PDF text is parsed directly; scanned PDFs and images use local Tesseract OCR",
      "Extracted measurements include source excerpts and require human verification",
      "Seven supplied H5 models return scores only; they are not clinical probabilities or diagnoses",
      "Skin model lacks a verified seven-class map and remains disabled",
      "No hosted LLM is connected; image models are not clinically validated",
      "The localized guide uses rules; source text is not translated",
      "Production needs clinical validation, managed secrets, encrypted storage, and audit controls",
    ],
  },
  {
    eyebrow: "06 · Architecture",
    title: "Built to scale from day one",
    bullets: [
      "Frontend: React/Vite or Next.js, TypeScript, Tailwind, Framer Motion, Three.js",
      "Backend: Python FastAPI (spec) — demoed here on Next.js Route Handlers",
      "Database: MongoDB Atlas (spec) — demoed here on PostgreSQL + Drizzle ORM",
      "Clean service boundaries mean either backend/DB pairing is a drop-in swap",
    ],
    footer: "Full diagram at /architecture",
  },
  {
    eyebrow: "07 · Market & impact",
    title: "Why this matters beyond the hackathon",
    bullets: [
      "1.4B+ people in India alone would benefit from regional-language health AI",
      "Clinics & diagnostic chains lose time re-keying scanned reports manually",
      "Unified profiles reduce redundant tests and improve continuity of care",
      "Enterprise angle: white-label unified health record layer for hospital groups",
    ],
  },
  {
    eyebrow: "08 · Limitations (stated clearly)",
    title: "What this prototype is — and isn't",
    bullets: [
      "Not a certified medical device; supplied image models are experimental and not clinically validated",
      "OCR is real transcription but may be inaccurate; verify values against original files",
      "Image results are experimental and not clinically validated; the health guide is not a hosted LLM",
      "The localized guide is rule-based and does not translate source transcriptions",
      "Private file storage is local and not encrypted at rest; this is not production/HIPAA-ready",
    ],
  },
  {
    eyebrow: "09 · Roadmap",
    title: "From prototype to pilot",
    bullets: [
      "Clinically validate and independently test supplied models before considering care workflows",
      "Add clinician review workflow & audit trail for AI-flagged cases",
      "Wearables integration (SpO2, HR, CGM) for continuous vitals",
      "Pilot with 1–2 diagnostic chains; measure time-to-insight & patient comprehension",
    ],
  },
  {
    eyebrow: "10 · Ask",
    title: "Let's build the unified health layer, together",
    bullets: [
      "Seeking: hackathon recognition, mentorship, and pilot partners",
      "Team Altrix Labs — full-stack, AI/ML, and product design in-house",
      "Try it now: instant judge/investor demo login on the login page",
    ],
    footer: "Thank you — questions welcome.",
  },
];

export function PresentationDeck() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const slide = SLIDES[index];

  return (
    <main className="flex min-h-screen flex-col px-6 py-8 sm:px-10">
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <Link href="/" className="text-sm text-slate-400 hover:text-cyan-300">← Back home</Link>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35 }}
            >
              <GlassCard strong className="glow-violet min-h-[440px] p-8 sm:p-12">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">{slide.eyebrow}</p>
                <h1 className="font-display mb-6 text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-tight text-white">
                  {slide.title}
                </h1>
                {slide.body && <p className="mb-6 text-lg text-slate-300">{slide.body}</p>}
                {slide.bullets && (
                  <ul className="space-y-3">
                    {slide.bullets.map((b) => (
                      <li key={b} className="flex gap-3 text-sm leading-relaxed text-slate-200 sm:text-base">
                        <span className="mt-1 text-cyan-400">◆</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {slide.footer && <p className="mt-8 text-xs italic text-slate-500">{slide.footer}</p>}
              </GlassCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-30"
        >
          ← Prev
        </button>
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20"}`}
            />
          ))}
        </div>
        <button
          onClick={() => setIndex((i) => Math.min(i + 1, SLIDES.length - 1))}
          disabled={index === SLIDES.length - 1}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-30"
        >
          Next →
        </button>
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-500">
        Slide {index + 1} of {SLIDES.length} · Use ← → arrow keys to navigate
      </p>
    </main>
  );
}
