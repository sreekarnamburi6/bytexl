import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/db";
import { documents, vitals, chatMessages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { VitalsQuickAdd } from "@/components/dashboard/VitalsQuickAdd";
import { GlassCard } from "@/components/ui/GlassCard";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [docs, vitalRows, msgs] = await Promise.all([
    db.select().from(documents).where(eq(documents.userId, user.id)),
    db.select().from(vitals).where(and(eq(vitals.userId, user.id), eq(vitals.source, "user-entered"))),
    db.select().from(chatMessages).where(eq(chatMessages.userId, user.id)),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-navy-950"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{user.name}</h1>
          <p className="text-sm text-slate-400">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <GlassCard className="p-4 text-center">
          <p className="font-display text-xl font-bold text-white">{docs.length}</p>
          <p className="text-[11px] text-slate-400">Documents</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="font-display text-xl font-bold text-white">{vitalRows.length}</p>
          <p className="text-[11px] text-slate-400">Vitals logged</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="font-display text-xl font-bold text-white">{msgs.length}</p>
          <p className="text-[11px] text-slate-400">Copilot messages</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="font-display text-xl font-bold text-white">{user.bloodGroup ?? "—"}</p>
          <p className="text-[11px] text-slate-400">Blood group</p>
        </GlassCard>
      </div>

      <ProfileForm
        user={{
          name: user.name,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          bloodGroup: user.bloodGroup,
          preferredLanguage: user.preferredLanguage,
        }}
      />

      <VitalsQuickAdd />

    </div>
  );
}
