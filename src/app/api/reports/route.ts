import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, vitals } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const [vitalRows, documentRows] = await Promise.all([
    db.select().from(vitals)
      .where(and(eq(vitals.userId, user.id), eq(vitals.source, "user-entered")))
      .orderBy(desc(vitals.recordedAt)),
    db.select().from(documents)
      .where(eq(documents.userId, user.id))
      .orderBy(desc(documents.createdAt)),
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    patient: {
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      bloodGroup: user.bloodGroup,
    },
    vitals: vitalRows.map(({ id, type, value, unit, recordedAt }) => ({
      id,
      type,
      value,
      unit,
      recordedAt: recordedAt.toISOString(),
      source: "Manually entered by account holder",
    })),
    documents: documentRows.filter((document) => document.extractionMethod !== "legacy-simulated").map((document) => ({
      id: document.id,
      fileName: document.fileName,
      category: document.category,
      uploadedAt: document.createdAt.toISOString(),
      extractionMethod: document.extractionMethod,
      extractedFields: document.extractionMethod === "legacy-simulated" ? [] : document.extractedFields,
      hasSourceText: document.extractionMethod !== "legacy-simulated" && Boolean(document.ocrText),
    })),
    notice: "This report contains account data and source transcriptions only. OCR may be inaccurate. No diagnosis or AI image findings are included.",
  }, { headers: { "Cache-Control": "private, no-store" } });
}