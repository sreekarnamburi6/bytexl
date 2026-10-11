import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { db } from "@/db";
import { analyses, documents, timelineEvents } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { newId } from "@/lib/id";
import { getDocumentStoragePath } from "@/lib/document-storage";
import { getLocalAiServiceConfig, localAiHeaders } from "@/lib/local-ai-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, user.id))
    .orderBy(desc(analyses.createdAt));

  return NextResponse.json({ analyses: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json();
  const documentId = String(body.documentId ?? "");
  const modelId = String(body.modelId ?? "");
  if (!documentId) return NextResponse.json({ error: "documentId is required." }, { status: 400 });
  if (!/^[a-z_]{2,40}$/.test(modelId)) {
    return NextResponse.json({ error: "Choose an available disease model." }, { status: 400 });
  }

  const docRows = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.id)))
    .limit(1);
  const doc = docRows[0];
  if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!doc.isImage) {
    return NextResponse.json({ error: "Disease models accept image uploads only." }, { status: 415 });
  }

  if (!["image/png", "image/jpeg"].includes(doc.fileType)) {
    return NextResponse.json({ error: "Disease models accept PNG and JPEG images only." }, { status: 415 });
  }

  const service = getLocalAiServiceConfig();
  if (!service) {
    return NextResponse.json({ error: "Configure the local AI service URL and token before running models." }, { status: 503 });
  }

  let imageBytes: Buffer;
  try {
    imageBytes = await fs.readFile(getDocumentStoragePath(user.id, doc.filePath));
  } catch {
    return NextResponse.json({ error: "The private image file is unavailable." }, { status: 404 });
  }

  const formData = new FormData();
  formData.set("model_id", modelId);
  const blobBytes = new Uint8Array(new ArrayBuffer(imageBytes.byteLength));
  blobBytes.set(imageBytes);
  formData.set("image", new Blob([blobBytes], { type: doc.fileType }), doc.fileName);

  let modelResponse: Response;
  try {
    modelResponse = await fetch(`${service.baseUrl}/v1/predict`, {
      method: "POST",
      headers: localAiHeaders(service.token),
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(180_000),
    });
  } catch {
    return NextResponse.json({ error: "The local disease model service is unavailable. Start it and retry." }, { status: 503 });
  }

  const modelBody = await modelResponse.json().catch(() => null);
  if (!modelResponse.ok) {
    const message = typeof modelBody?.error === "string" ? modelBody.error : "Model inference failed.";
    return NextResponse.json({ error: message }, { status: modelResponse.status === 422 ? 422 : 503 });
  }

  const scores = modelBody?.scores;
  const score = Number(modelBody?.score);
  const label = String(modelBody?.label ?? "");
  if (
    modelBody?.result_type !== "experimental_model_output" ||
    modelBody?.engine !== "keras-3-torch" ||
    !label ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 1 ||
    !Array.isArray(scores)
  ) {
    return NextResponse.json({ error: "The model service returned an invalid result." }, { status: 502 });
  }

  const id = newId("an");
  const createdAt = new Date();
  const modelName = String(modelBody.model_name ?? modelId);
  const disclaimer = String(modelBody.disclaimer ?? "Real-time image-classification result only; it is not a medical diagnosis.");

  await db.transaction(async (transaction) => {
    await transaction.insert(analyses).values({
      id,
      documentId: doc.id,
      userId: user.id,
      kind: "image_model_output",
      modelId,
      modelScores: scores,
      summary: label,
      findings: [],
      confidence: score,
      riskLevel: "not_assessed",
      analysisEngine: "keras-3-torch",
      createdAt,
    });

    await transaction.insert(timelineEvents).values({
      id: newId("tl"),
      userId: user.id,
      type: "analysis",
      title: `Real-time image classification — ${doc.fileName}`,
      description: `${modelName}: ${label}. Model score ${(score * 100).toFixed(1)}%. Not a diagnosis.`,
      metadata: { documentId: doc.id, modelId, analysisId: id },
      occurredAt: createdAt,
    });
  });

  return NextResponse.json({
    analysis: {
      id,
      documentId: doc.id,
      userId: user.id,
      kind: "image_model_output",
      modelId,
      modelName,
      label,
      score,
      scores,
      resultType: "experimental_model_output",
      analysisEngine: "keras-3-torch",
      riskLevel: "not_assessed",
      disclaimer,
      createdAt: createdAt.toISOString(),
    },
  });
}
