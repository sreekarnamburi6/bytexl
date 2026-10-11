import { GlassCard } from "@/components/ui/GlassCard";
import clsx from "clsx";

export function StatCard({
  label,
  value,
  sub,
  accent = "cyan",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "cyan" | "violet" | "teal" | "pink" | "amber";
  icon: string;
}) {
  const accentMap: Record<string, string> = {
    cyan: "from-cyan-400/20 to-cyan-400/0 text-cyan-300",
    violet: "from-violet-400/20 to-violet-400/0 text-violet-300",
    teal: "from-teal-400/20 to-teal-400/0 text-teal-300",
    pink: "from-pink-400/20 to-pink-400/0 text-pink-300",
    amber: "from-amber-400/20 to-amber-400/0 text-amber-300",
  };

  return (
    <GlassCard className="relative overflow-hidden p-5">
      <div className={clsx("pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl", accentMap[accent])} />
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="relative mt-3 font-display text-2xl font-bold text-white">{value}</p>
      {sub && <p className="relative mt-1 text-xs text-slate-400">{sub}</p>}
    </GlassCard>
  );
}
