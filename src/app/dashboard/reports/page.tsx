import { MedicalReportCard } from "@/components/dashboard/MedicalReportCard";

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-cyan-300">Personal health records</p>
        <h1 className="font-display mt-1 text-2xl font-semibold text-white">Medical Report Card</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Generate a private PDF from your account data and extracted source text.</p>
      </div>
      <MedicalReportCard />
    </div>
  );
}