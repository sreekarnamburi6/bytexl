import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages, documents, vitals } from "@/db/schema";
import { and, eq, desc, asc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { newId } from "@/lib/id";
import { copilotGreeting, copilotReply, type Language } from "@/lib/ai-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.userId, user.id))
    .orderBy(asc(chatMessages.createdAt));

  if (rows.length === 0) {
    const lang = (user.preferredLanguage as Language) ?? "en";
    return NextResponse.json({
      messages: [
        {
          id: "greeting",
          role: "assistant",
          content: copilotGreeting(lang, user.name.split(" ")[0]),
          language: lang,
          createdAt: new Date().toISOString(),
        },
      ],
    });
  }

  return NextResponse.json({ messages: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const content = String(body.content ?? "").trim();
  const requestedLanguage = String(body.language ?? user.preferredLanguage ?? "en");
  const language: Language = ["en", "te", "hi"].includes(requestedLanguage)
    ? requestedLanguage as Language
    : user.preferredLanguage as Language;

  if (!content || content.length > 2000) {
    return NextResponse.json({ error: "Message must contain 1 to 2000 characters." }, { status: 400 });
  }

  const docRows = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, user.id))
    .orderBy(desc(documents.createdAt))
    .limit(20);

  const vitalTypes = ["heart_rate", "spo2", "glucose", "systolic_bp"];
  const vitalRows = await db
    .select()
    .from(vitals)
    .where(and(eq(vitals.userId, user.id), eq(vitals.source, "user-entered")))
    .orderBy(desc(vitals.recordedAt))
    .limit(12);

  const latestVitals = vitalTypes
    .map((t) => vitalRows.find((v) => v.type === t))
    .filter((v): v is NonNullable<typeof v> => Boolean(v))
    .map((v) => ({ type: v.type.replace(/_/g, " "), value: v.value, unit: v.unit }));

  const latestDoc = docRows.find((document) => document.extractionMethod !== "legacy-simulated" && document.ocrText);
  const fields = Array.isArray(latestDoc?.extractedFields) ? latestDoc.extractedFields as {
    label: string;
    value: string;
    unit: string;
    sourceExcerpt: string;
  }[] : [];
  const latestDocumentSummary = latestDoc && latestDoc.extractionMethod !== "legacy-simulated" && latestDoc.ocrText
    ? `Source: ${latestDoc.fileName} · ${latestDoc.category} · uploaded ${latestDoc.createdAt.toISOString()}.\n${fields.length ? `Extracted source values:\n${fields.map((field) => `${field.label}: ${field.value} ${field.unit} (source: "${field.sourceExcerpt}")`).join("\n")}\n` : "No structured values matched.\n"}Original transcription excerpt:\n${latestDoc.ocrText.slice(0, 500)}`
    : undefined;

  const replyText = copilotReply(content, language, {
    userName: user.name.split(" ")[0],
    documentCount: docRows.length,
    latestDocumentSummary,
    latestVitals,
  });

  const assistantId = newId("msg");
  await db.transaction(async (transaction) => {
    await transaction.insert(chatMessages).values([
      { id: newId("msg"), userId: user.id, role: "user", content, language },
      { id: assistantId, userId: user.id, role: "assistant", content: replyText, language },
    ]);
  });

  return NextResponse.json({
    reply: { id: assistantId, role: "assistant", content: replyText, language, createdAt: new Date().toISOString() },
  });
}
