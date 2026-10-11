export function Disclaimer({ text }: { text?: string }) {
  if (!text) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] leading-snug text-amber-200">
      <span aria-hidden className="mt-0.5">⚠️</span>
      <p className="m-0">
        {text}
      </p>
    </div>
  );
}
