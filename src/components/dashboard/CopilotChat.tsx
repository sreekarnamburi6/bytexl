"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";

type Msg = { id: string; role: "user" | "assistant"; content: string; language: string; createdAt: string };

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు" },
  { code: "hi", label: "हिन्दी" },
];

const QUICK_PROMPTS: Record<string, string[]> = {
  en: ["Summarize my latest report", "Show my blood pressure", "Is my risk assessed?", "Show my glucose reading"],
  te: ["నా తాజా రిపోర్ట్ సారాంశం", "నా రక్తపోటు చూపించు", "నా ప్రమాదం అంచనా వేశారా?", "నా గ్లూకోజ్ చూపించు"],
  hi: ["मेरी नवीनतम रिपोर्ट का सारांश", "मेरा रक्तचाप दिखाएँ", "क्या मेरे जोखिम का आकलन हुआ?", "मेरा ग्लूकोज़ दिखाएँ"],
};

export function CopilotChat({ defaultLanguage }: { defaultLanguage: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState(defaultLanguage || "en");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(content: string) {
    if (!content.trim() || sending) return;
    setError(null);
    setInput("");
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, role: "user", content, language, createdAt: new Date().toISOString() },
    ]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, language }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data.reply]);
      } else {
        setError(data.error ?? "Message could not be sent.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <GlassCard strong className="flex h-[70vh] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">MEDISCOPE Health Guide</p>
            <p className="text-[10px] text-slate-400">Rule-based responses · source text is not translated</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                language === l.code
                  ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                  : "border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-center text-xs text-slate-500">Loading conversation…</p>
        ) : (
          messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-cyan-400 to-violet-500 text-navy-950"
                    : "glass text-slate-200"
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="glass flex gap-1 rounded-2xl px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:0.2s]" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(QUICK_PROMPTS[language] ?? QUICK_PROMPTS.en).map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-400 hover:text-white"
            >
              {p}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="mb-2 text-xs text-rose-300">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a report, vital, or health term…"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-navy-950 disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </div>
    </GlassCard>
  );
}
