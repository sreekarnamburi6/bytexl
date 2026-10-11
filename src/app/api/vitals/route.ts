import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vitals, timelineEvents } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { newId } from "@/lib/id";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await db
    .select()
    .from(vitals)
    .where(and(eq(vitals.userId, user.id), eq(vitals.source, "user-entered")))
    .orderBy(asc(vitals.recordedAt));

  return NextResponse.json({ vitals: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const type = String(body.type ?? "").trim();
  const value = Number(body.value);
  const unit = String(body.unit ?? "").trim();
  const limits: Record<string, { unit: string; minimum: number; maximum: number }> = {
    heart_rate: { unit: "bpm", minimum: 20, maximum: 250 },
    spo2: { unit: "%", minimum: 50, maximum: 100 },
    glucose: { unit: "mg/dL", minimum: 10, maximum: 1000 },
    systolic_bp: { unit: "mmHg", minimum: 50, maximum: 300 },
  };
  const definition = limits[type];

  if (!definition || !Number.isFinite(value) || unit !== definition.unit || value < definition.minimum || value > definition.maximum) {
    return NextResponse.json({ error: "Enter a supported vital with a valid value and unit." }, { status: 400 });
  }

  const id = newId("vit");
  await db.insert(vitals).values({ id, userId: user.id, type, value, unit, source: "user-entered" });

  await db.insert(timelineEvents).values({
    id: newId("tl"),
    userId: user.id,
    type: "vitals",
    title: `Manual vitals entry — ${type.replace(/_/g, " ")}`,
    description: `${value} ${unit} recorded manually.`,
    metadata: { type, value, unit },
    occurredAt: new Date(),
  });

  return NextResponse.json({ ok: true, id });
}
