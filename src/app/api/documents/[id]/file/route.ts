import { promises as fs } from "node:fs";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { getDocumentStoragePath } from "@/lib/document-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;
  const rows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, user.id)))
    .limit(1);
  const document = rows[0];
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  try {
    const content = await fs.readFile(getDocumentStoragePath(user.id, document.filePath));
    return new NextResponse(content, {
      headers: {
        "Content-Type": document.fileType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "Content-Length": String(content.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: "Document file is unavailable." }, { status: 404 });
  }
}