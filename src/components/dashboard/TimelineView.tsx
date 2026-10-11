"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";

type Event = {
  id: string;
  type: string;
  title: string;
  description: string;
  occurredAt: string;
};

const TYPE_META: Record<string, { icon: string; color: string }> = {
  account: { icon: "🪪", color: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" },
  document: { icon: "📄", color: "border-violet-400/30 bg-violet-400/10 text-violet-300" },
  analysis: { icon: "🧠", color: "border-pink-400/30 bg-pink-400/10 text-pink-300" },
  vitals: { icon: "📊", color: "border-teal-400/30 bg-teal-400/10 text-teal-300" },
  note: { icon: "📝", color: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
};

export function TimelineView() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("note");

  async function load() {
    const res = await fetch("/api/timeline");
    const data = await res.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    fetch("/api/timeline")
      .then((res) => res.json())
      .then((data) => {
        if (active) setEvents(data.events ?? []);
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, type }),
    });
    setTitle("");
    setDescription("");
    setShowForm(false);
    load();
  }

  const types = ["All", ...Array.from(new Set(events.map((e) => e.type)))];
  const filtered = filter === "All" ? events : events.filter((e) => e.type === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full border px-3 py-1.5 text-xs capitalize transition ${
                filter === t
                  ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-1.5 text-xs font-semibold text-navy-950"
        >
          {showForm ? "Cancel" : "+ Add entry"}
        </button>
      </div>

      {showForm && (
        <GlassCard className="p-5">
          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Visited cardiologist)"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 sm:col-span-2"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="note" className="bg-navy-900">Note</option>
              <option value="vitals" className="bg-navy-900">Vitals</option>
              <option value="document" className="bg-navy-900">Document</option>
              <option value="analysis" className="bg-navy-900">Analysis</option>
            </select>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details (optional)"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 sm:col-span-3"
              rows={2}
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-navy-950 sm:col-span-3"
            >
              Save to timeline
            </button>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-500">Loading timeline…</p>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center text-sm text-slate-500">No events yet.</GlassCard>
      ) : (
        <div className="relative space-y-5 pl-6 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-cyan-400/50 before:via-violet-400/30 before:to-transparent">
          {filtered.map((e, i) => {
            const meta = TYPE_META[e.type] ?? TYPE_META.note;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative"
              >
                <span className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${meta.color}`}>
                  {meta.icon}
                </span>
                <GlassCard className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{e.title}</p>
                    <span className="text-[11px] text-slate-500">{new Date(e.occurredAt).toLocaleString()}</span>
                  </div>
                  {e.description && <p className="mt-1 text-xs text-slate-400">{e.description}</p>}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
