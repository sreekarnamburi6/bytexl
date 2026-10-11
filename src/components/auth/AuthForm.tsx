"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { GlassCard } from "@/components/ui/GlassCard";

const HologramCanvas = dynamic(() => import("@/components/three/HologramCanvas"), { ssr: false });

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, preferredLanguage: language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleDemo() {
    setDemoLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start demo.");
        setDemoLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setDemoLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
      <HologramCanvas
        intensity={0.6}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-30"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6 }}
        style={{ perspective: 1200 }}
        className="relative z-10 w-full max-w-md"
      >
        <GlassCard strong className="glow-cyan p-8">
          <div className="mb-6 flex justify-center">
            <Logo />
          </div>
          <h1 className="font-display text-center text-xl font-semibold text-white">
            {mode === "login" ? "Secure Access Portal" : "Create your unified health profile"}
          </h1>
          <p className="mt-1 text-center text-xs text-slate-400">
            {mode === "login"
              ? "Sign in to your encrypted MEDISCOPE AI dashboard."
              : "Takes under a minute. Your data stays in your own secure session."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Full name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ananya Rao"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:bg-white/10"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@hospital.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:bg-white/10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Password</label>
              <input
                required
                type="password"
                  minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50 focus:bg-white/10"
              />
            </div>
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Preferred copilot language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400/50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-navy-900">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="glow-cyan w-full rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 py-2.5 text-sm font-semibold text-navy-950 transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Authenticating…" : mode === "login" ? "Unlock Dashboard" : "Create Secure Profile"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500">or</span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {process.env.NODE_ENV !== "production" && (
            <button
              onClick={handleDemo}
              disabled={demoLoading}
              className="w-full rounded-xl border border-violet-400/30 bg-violet-400/10 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/20 disabled:opacity-60"
            >
              {demoLoading ? "Preparing demo…" : "⚡ Instant Judge / Investor Demo Login"}
            </button>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            {mode === "login" ? (
              <>
                New to MEDISCOPE AI?{" "}
                <Link href="/signup" className="text-cyan-300 hover:underline">
                  Create a profile
                </Link>
              </>
            ) : (
              <>
                Already registered?{" "}
                <Link href="/login" className="text-cyan-300 hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </GlassCard>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          🔒 Passwords are hashed with bcrypt. Sessions use signed JWT cookies. Demo prototype — do not use real medical credentials.
        </p>
      </motion.div>
    </main>
  );
}
