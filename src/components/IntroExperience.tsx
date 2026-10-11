"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { HeartbeatLine } from "./HeartbeatLine";

const HologramCanvas = dynamic(() => import("./three/HologramCanvas"), { ssr: false });

const STAGE_DURATIONS = [1600, 2200, 2200];

const LETTERS = "MEDISCOPE AI".split("");

export function IntroExperience({ onEnter }: { onEnter: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= STAGE_DURATIONS.length) return;
    const t = setTimeout(() => setStage((s) => s + 1), STAGE_DURATIONS[stage]);
    return () => clearTimeout(t);
  }, [stage]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-mesh">
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />

      <button
        onClick={onEnter}
        className="absolute right-5 top-5 z-10 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur transition hover:border-cyan-400/40 hover:text-cyan-300"
      >
        Skip intro →
      </button>

      <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <span className="h-2 w-2 animate-pulse-glow rounded-full bg-cyan-400" />
              <HeartbeatLine className="h-16 w-[min(90vw,640px)]" />
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-300/80">
                Initializing secure health network
              </p>
            </motion.div>
          )}

          {stage === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <HologramCanvas className="h-[320px] w-[320px] sm:h-[420px] sm:w-[420px]" />
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="font-mono text-xs uppercase tracking-[0.35em] text-violet-300/80"
              >
                Synthesizing unified health hologram
              </motion.p>
            </motion.div>
          )}

          {stage >= 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-7"
            >
              <div className="relative">
                <HologramCanvas className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 opacity-40" />
                <h1 className="font-display relative flex flex-wrap items-center justify-center gap-x-3 text-[clamp(2.2rem,8vw,5.2rem)] font-bold tracking-tight">
                  {LETTERS.map((ch, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ delay: i * 0.045, duration: 0.5 }}
                      className={ch === " " ? "w-3" : "text-gradient"}
                    >
                      {ch === " " ? "\u00A0" : ch}
                    </motion.span>
                  ))}
                </h1>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-sm uppercase tracking-[0.4em] text-slate-400"
              >
                by Altrix Labs
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="max-w-xl text-balance text-base text-slate-300"
              >
                One AI-unified profile for every lab report, prescription, scan and vital —
                explained instantly, in your language.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.35 }}
              >
                <button
                  onClick={onEnter}
                  className="glow-cyan rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 px-8 py-3 text-sm font-semibold text-navy-950 transition hover:brightness-110"
                >
                  Enter MEDISCOPE AI
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
