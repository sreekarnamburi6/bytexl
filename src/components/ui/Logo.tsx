import clsx from "clsx";

export function Logo({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={clsx("flex items-center gap-2.5 select-none", className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-violet-500 shadow-[0_0_22px_rgba(34,211,238,0.55)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-navy-950" fill="none">
          <path
            d="M3 12h3.2l1.8-5 3 10 2.2-6.5L15 14l1.6-2H21"
            stroke="#040714"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="absolute inset-0 animate-ping rounded-xl bg-cyan-400/30" />
      </div>
      {!iconOnly && (
        <span className="font-display text-lg font-semibold tracking-tight text-white">
          MEDI<span className="text-gradient">SCOPE</span> AI
        </span>
      )}
    </div>
  );
}
