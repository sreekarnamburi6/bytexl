import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { removeDocumentFile } from "@/lib/document-storage";
import { timelineEvents } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;

  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))
    .limit(1);

  if (!rows[0]) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  return NextResponse.json({ document: rows[0] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;

  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))
    .limit(1);
  const doc = rows[0];
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  await db.transaction(async (transaction) => {
    await transaction.delete(timelineEvents).where(and(
      eq(timelineEvents.userId, user.id),
      sql`${timelineEvents.metadata}->>'documentId' = ${id}`,
    ));
    await transaction.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, user.id)));
  });
  await removeDocumentFile(user.id, doc.filePath).catch((error) => {
    console.error("orphaned private document file", error);
  });
  return NextResponse.json({ ok: true });
}
