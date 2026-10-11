import Link from "next/link";
import { db } from "@/db";
import { documents, vitals, analyses, timelineEvents } from "@/db/schema";
import { and, eq, asc, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { StatCard } from "@/components/dashboard/StatCard";
import { VitalsChart, type VitalsPoint } from "@/components/dashboard/VitalsChart";
import { GlassCard } from "@/components/ui/GlassCard";
import { Disclaimer } from "@/components/ui/Disclaimer";

export const dynamic = "force-dynamic";

const TIMELINE_ICON: Record<string, string> = {
  account: "🪪",
  document: "📄",
  analysis: "🧠",
  vitals: "📊",
  note: "📝",
};

export default async function DashboardOverview() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [docs, vitalRows, analysisRows, events] = await Promise.all([
    db.select().from(documents).where(eq(documents.userId, user.id)).orderBy(desc(documents.createdAt)),
    db.select().from(vitals).where(and(eq(vitals.userId, user.id), eq(vitals.source, "user-entered"))).orderBy(asc(vitals.recordedAt)),
    db.select().from(analyses).where(eq(analyses.userId, user.id)).orderBy(desc(analyses.createdAt)),
    db.select().from(timelineEvents).where(eq(timelineEvents.userId, user.id)).orderBy(desc(timelineEvents.occurredAt)).limit(6),
  ]);

  const byDate = new Map<string, VitalsPoint>();
  for (const v of vitalRows) {
    const key = new Date(v.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const point = byDate.get(key) ?? { date: key };
    (point as Record<string, number | string>)[v.type] = v.value;
    byDate.set(key, point);
  }
  const chartData = Array.from(byDate.values()).slice(-7);

  const latestHeartRate = [...vitalRows].reverse().find((v) => v.type === "heart_rate");
  const latestSpo2 = [...vitalRows].reverse().find((v) => v.type === "spo2");
  const documentsNeedingReview = docs.filter((document) => document.status === "needs_review").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold text-white">
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-slate-400">Overview of your saved health records. No diagnostic risk score is calculated.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Documents needing review" value={String(documentsNeedingReview)} sub="No readable text extracted" icon="🔎" accent="amber" />
        <StatCard label="Documents stored" value={String(docs.length)} sub="Private PDF / PNG / JPG files" icon="🗂️" accent="violet" />
        <StatCard
          label="Heart Rate"
          value={latestHeartRate ? `${latestHeartRate.value} bpm` : "—"}
          sub="Most recent reading"
          icon="❤️"
          accent="pink"
        />
        <StatCard
          label="SpO2"
          value={latestSpo2 ? `${latestSpo2.value}%` : "—"}
          sub="Oxygen saturation"
          icon="🫁"
          accent="teal"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <GlassCard className="p-5 xl:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">Vitals Trend (7-day)</h2>
            <Link href="/dashboard/upload" className="text-xs text-cyan-300 hover:underline">
              + Log new reading
            </Link>
          </div>
          {chartData.length > 0 ? (
            <VitalsChart data={chartData} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
              No vitals yet — add one from your profile or upload a report.
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-display mb-2 text-base font-semibold text-white">Disease model outputs</h2>
          <p className="text-sm text-slate-300">Seven local experimental image classifiers are available. Their scores are not diagnoses or clinical risk assessments.</p>
          <p className="mt-3 text-xs text-slate-500">{analysisRows.filter((analysis) => analysis.analysisEngine === "keras-3-torch").length} model outputs saved</p>
          <Link href="/dashboard/imaging" className="mt-4 inline-block text-xs text-cyan-300 hover:underline">Open imaging lab →</Link>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">Recent Documents</h2>
            <Link href="/dashboard/documents" className="text-xs text-cyan-300 hover:underline">
              View all →
            </Link>
          </div>
          {docs.length === 0 ? (
            <EmptyState text="No documents uploaded yet." cta="Upload your first report" href="/dashboard/upload" />
          ) : (
            <ul className="space-y-2">
              {docs.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{d.fileName}</p>
                    <p className="text-[11px] text-slate-400">{d.category}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-300">
                    {d.extractionMethod === "pdf-text"
                      ? "PDF text"
                      : d.extractionMethod === "tesseract-ocr"
                        ? `Tesseract ${Math.round((d.ocrConfidence ?? 0) * 100)}%`
                        : d.extractionMethod === "legacy-simulated"
                          ? "Legacy synthetic"
                          : "Review needed"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">Latest Timeline Activity</h2>
            <Link href="/dashboard/timeline" className="text-xs text-cyan-300 hover:underline">
              Full timeline →
            </Link>
          </div>
          {events.length === 0 ? (
            <EmptyState text="Your timeline is empty." cta="Create your first entry" href="/dashboard/timeline" />
          ) : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="text-lg">{TIMELINE_ICON[e.type] ?? "📌"}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{e.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(e.occurredAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>

      <Disclaimer />
    </div>
  );
}

function EmptyState({ text, cta, href }: { text: string; cta: string; href: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <p className="text-sm text-slate-500">{text}</p>
      <Link
        href={href}
        className="rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-1.5 text-xs font-semibold text-navy-950"
      >
        {cta}
      </Link>
    </div>
  );
}
