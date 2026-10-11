import { CopilotChat } from "@/components/dashboard/CopilotChat";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function CopilotPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">AI Copilot</h1>
        <p className="text-sm text-slate-400">
          A multilingual conversational assistant that explains your records in plain language — English, Telugu, or Hindi.
        </p>
      </div>
      <CopilotChat defaultLanguage={user?.preferredLanguage ?? "en"} />
    </div>
  );
}
