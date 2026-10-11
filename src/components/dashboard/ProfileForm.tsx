"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";

type UserData = {
  name: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  preferredLanguage: string;
};

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
];

const BLOOD_GROUPS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

export function ProfileForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    dateOfBirth: user.dateOfBirth ?? "",
    bloodGroup: user.bloodGroup ?? "O+",
    preferredLanguage: user.preferredLanguage,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <GlassCard className="p-6">
      <h2 className="font-display mb-4 text-base font-semibold text-white">Personal details</h2>
      <form onSubmit={handleSave} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Email">
          <input value={user.email} disabled className="input opacity-60" />
        </Field>
        <Field label="Phone">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="input"
          />
        </Field>
        <Field label="Date of birth">
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Blood group">
          <select
            value={form.bloodGroup}
            onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
            className="input"
          >
            {BLOOD_GROUPS.map((b) => (
              <option key={b} value={b} className="bg-navy-900">
                {b}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Copilot language">
          <select
            value={form.preferredLanguage}
            onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
            className="input"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-navy-900">
                {l.label}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 px-6 py-2.5 text-sm font-semibold text-navy-950 disabled:opacity-60"
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      </form>
      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          padding: 0.6rem 1rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input:focus {
          border-color: rgba(34, 211, 238, 0.5);
        }
      `}</style>
    </GlassCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}
