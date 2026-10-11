import { ImagingLab } from "@/components/dashboard/ImagingLab";

export default function ImagingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">AI Imaging Lab</h1>
        <p className="text-sm text-slate-400">
          Real-time image classification for selected image types. Results are not medical diagnoses.
        </p>
      </div>
      <ImagingLab />
    </div>
  );
}
