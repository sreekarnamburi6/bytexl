import { db } from "@/db";
import { vitals, timelineEvents } from "@/db/schema";
import { newId } from "@/lib/id";

// Seeds a brand-new account with a light demo dataset so the dashboard,
// charts, and timeline feel alive immediately after signup.
export async function seedDemoDataForUser(userId: string) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const heartRate = [78, 76, 81, 74, 79, 77, 73];
  const spo2 = [97, 98, 97, 99, 98, 98, 99];
  const glucose = [102, 98, 110, 95, 101, 97, 99];
  const systolic = [122, 118, 125, 120, 117, 119, 116];

  const vitalRows = [] as (typeof vitals.$inferInsert)[];
  for (let i = 6; i >= 0; i--) {
    const recordedAt = new Date(now - i * day);
    const idx = 6 - i;
    vitalRows.push(
      { id: newId("vit"), userId, type: "heart_rate", value: heartRate[idx], unit: "bpm", source: "demo", recordedAt },
      { id: newId("vit"), userId, type: "spo2", value: spo2[idx], unit: "%", source: "demo", recordedAt },
      { id: newId("vit"), userId, type: "glucose", value: glucose[idx], unit: "mg/dL", source: "demo", recordedAt },
      { id: newId("vit"), userId, type: "systolic_bp", value: systolic[idx], unit: "mmHg", source: "demo", recordedAt },
    );
  }
  await db.insert(vitals).values(vitalRows);

  await db.insert(timelineEvents).values([
    {
      id: newId("tl"),
      userId,
      type: "account",
      title: "Unified health profile created",
      description: "Welcome to MEDISCOPE AI — your records, scans, and vitals now live in one secure timeline.",
      metadata: {},
      occurredAt: new Date(now - 6 * day),
    },
    {
      id: newId("tl"),
      userId,
      type: "vitals",
      title: "Baseline vitals captured",
      description: "Resting heart rate, SpO2, glucose, and blood pressure recorded for trend analysis.",
      metadata: { source: "onboarding" },
      occurredAt: new Date(now - 5 * day),
    },
  ]);
}
