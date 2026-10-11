import { TimelineView } from "@/components/dashboard/TimelineView";

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Unified Health Timeline</h1>
        <p className="text-sm text-slate-400">
          Every document, scan, vital and AI insight — in one chronological, filterable stream.
        </p>
      </div>
      <TimelineView />
    </div>
  );
}
