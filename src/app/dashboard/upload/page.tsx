import { Dropzone } from "@/components/dashboard/Dropzone";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Upload Center</h1>
        <p className="text-sm text-slate-400">
          Drag in lab reports, prescriptions, or scans. MEDISCOPE AI extracts text instantly and files it into your unified profile.
        </p>
      </div>
      <Dropzone />
    </div>
  );
}
