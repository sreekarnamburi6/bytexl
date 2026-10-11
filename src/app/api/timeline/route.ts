import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { timelineEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { newId } from "@/lib/id";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.userId, user.id))
    .orderBy(desc(timelineEvents.occurredAt));

  return NextResponse.json({ events: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const type = String(body.type ?? "note");

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const id = newId("tl");
  await db.insert(timelineEvents).values({
    id,
    userId: user.id,
    type,
    title,
    description,
    metadata: { source: "manual" },
    occurredAt: new Date(),
  });

  return NextResponse.json({ ok: true, id });
}
