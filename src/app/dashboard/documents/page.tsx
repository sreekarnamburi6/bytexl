import { DocumentsExplorer } from "@/components/dashboard/DocumentsExplorer";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Document Intelligence</h1>
        <p className="text-sm text-slate-400">
          Your saved files and extracted source text, with extraction provenance.
        </p>
      </div>
      <DocumentsExplorer />
    </div>
  );
}
