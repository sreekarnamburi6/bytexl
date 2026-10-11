"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { IntroExperience } from "@/components/IntroExperience";
import { Logo } from "@/components/ui/Logo";
import { GlassCard } from "@/components/ui/GlassCard";
import { Disclaimer } from "@/components/ui/Disclaimer";

const FEATURES = [
  {
    icon: "🩻",
    title: "Local Disease Image Models",
    desc: "Select one of seven supplied experimental H5 classifiers and view its class scores. Outputs are not diagnoses or calibrated clinical probabilities.",
  },
  {
    icon: "📄",
    title: "Drag & Drop OCR Intelligence",
    desc: "Drop in PDFs, PNGs or JPGs of lab reports and prescriptions. Our OCR pipeline extracts structured text straight into your unified profile.",
  },
  {
    icon: "🧬",
    title: "Unified Health Timeline",
    desc: "Every document, scan, vital and AI insight lands on one chronological, filterable timeline — no more scattered PDFs across clinics.",
  },
  {
    icon: "💬",
    title: "Multilingual AI Copilot",
    desc: "Ask questions in English, Telugu, or Hindi. The copilot explains lab values and reports in plain language, instantly.",
  },
  {
    icon: "🔐",
    title: "Secure 3D Login",
    desc: "A hardened auth flow with hashed credentials and signed sessions, wrapped in a cinematic holographic interface.",
  },
  {
    icon: "📊",
    title: "Interactive Command Dashboard",
    desc: "Collapsible sidebar, user-entered vitals trends, document provenance and saved model scores in one dashboard.",
  },
];

const STACK = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS",
  "Framer Motion",
  "Three.js / R3F",
  "PostgreSQL + Drizzle ORM",
  "Recharts",
  "JWT Sessions",
];

export default function HomePage() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {!introDone && <IntroExperience onEnter={() => setIntroDone(true)} />}

      <div className={introDone ? "opacity-100" : "pointer-events-none opacity-0"}>
        <nav className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Logo />
            <div className="hidden items-center gap-7 text-sm text-slate-300 sm:flex">
              <Link href="/architecture" className="transition hover:text-cyan-300">
                Architecture
              </Link>
              <Link href="/presentation" className="transition hover:text-cyan-300">
                Presentation
              </Link>
              <Link href="/login" className="transition hover:text-cyan-300">
                Login
              </Link>
            </div>
            <Link
              href="/signup"
              className="glow-cyan rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2 text-xs font-semibold text-navy-950"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={introDone ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-200"
          >
            🏆 Hackathon Prototype · Altrix Labs
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={introDone ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display mx-auto max-w-4xl text-[clamp(2.2rem,6vw,4.2rem)] font-bold leading-[1.05] tracking-tight text-white"
          >
            Your entire health story,
            <span className="text-gradient"> unified by AI.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={introDone ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-balance text-base text-slate-300 sm:text-lg"
          >
            MEDISCOPE AI fuses OCR document intelligence, local experimental image classifiers,
            and a multilingual conversational copilot into one cinematic, secure health
            command center.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={introDone ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="glow-cyan rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 px-7 py-3 text-sm font-semibold text-navy-950 transition hover:brightness-110"
            >
              Create Secure Profile
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-cyan-400/40"
            >
              Judge / Investor Demo Login
            </Link>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
              What the prototype demonstrates
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Fully interactive — not slideware. Every card below is wired to live backend logic.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <GlassCard className="h-full p-6 transition hover:-translate-y-1 hover:border-cyan-400/30">
                  <div className="mb-3 text-3xl">{f.icon}</div>
                  <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <GlassCard strong className="p-8 sm:p-10">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              <div>
                <h3 className="font-display text-xl font-semibold text-white">Built with a production-grade stack</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Designed for a Python FastAPI + MongoDB Atlas backend at scale — this runnable
                  demo uses the equivalent Next.js + PostgreSQL stack provided by the hackathon
                  sandbox. See <Link href="/architecture" className="text-cyan-300 underline underline-offset-4">Architecture</Link> for the full mapping.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 sm:max-w-sm sm:justify-end">
                {STACK.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-24">
          <Disclaimer text="PDF text extraction and Tesseract OCR are real transcriptions and may contain errors. Supplied image models are experimental, not clinically validated, and do not provide diagnoses. The multilingual health guide is rule-based. This prototype is not a medical device or substitute for professional care." />
        </section>

        <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Altrix Labs — MEDISCOPE AI. Built for hackathon demonstration purposes.
        </footer>
      </div>
    </main>
  );
}
