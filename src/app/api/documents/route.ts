import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/db";
import { documents, timelineEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/current-user";
import { newId } from "@/lib/id";
import { guessCategory } from "@/lib/ai-engine";
import { extractDocumentContent } from "@/lib/document-processing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const CATEGORIES = ["Lab Report", "Prescription", "Radiology Scan", "Medical Image", "Discharge Summary", "General"];

function hasExpectedSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") return buffer.subarray(0, 1024).includes(Buffer.from("%PDF-"));
  if (mimeType === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  return false;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, user.id))
    .orderBy(desc(documents.createdAt));

  return NextResponse.json({ documents: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const categoryOverride = formData.get("category");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, PNG, or JPG." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 15MB)." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasExpectedSignature(buffer, file.type)) {
      return NextResponse.json({ error: "The file contents do not match the selected file type." }, { status: 415 });
    }

    const requestedCategory = typeof categoryOverride === "string" ? categoryOverride : "";
    if (requestedCategory && !CATEGORIES.includes(requestedCategory)) {
      return NextResponse.json({ error: "Invalid document category." }, { status: 400 });
    }
    const category = requestedCategory || guessCategory(file.name);
    let extraction;
    try {
      extraction = await extractDocumentContent(buffer, file.type, user.preferredLanguage);
    } catch {
      return NextResponse.json({ error: "The document could not be parsed. Check that the file is valid and try again." }, { status: 422 });
    }
    const id = newId("doc");
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(0, 120) || "document";
    const storedName = `${id}-${safeName}`;
    const userDir = path.join(UPLOAD_ROOT, user.id);
    const diskPath = path.join(userDir, storedName);
    await fs.mkdir(userDir, { recursive: true });
    await fs.writeFile(diskPath, buffer, { flag: "wx" });

    const isImage = file.type.startsWith("image/");
    const status = extraction.method === "no-text-found" || extraction.method === "ocr-unavailable"
      ? "needs_review"
      : "processed";

    try {
      await db.transaction(async (transaction) => {
        await transaction.insert(documents).values({
          id,
          userId: user.id,
          fileName: safeName,
          fileType: file.type,
          filePath: storedName,
          fileSize: file.size,
          category,
          status,
          ocrText: extraction.text || null,
          ocrConfidence: extraction.confidence,
          extractionMethod: extraction.method,
          extractedFields: extraction.fields,
          isImage,
        });

        await transaction.insert(timelineEvents).values({
          id: newId("tl"),
          userId: user.id,
          type: "document",
          title: `${category} uploaded — ${safeName}`,
          description: extraction.text
            ? `Text extracted using ${extraction.method}. Review the source before relying on any value.`
            : "File stored securely; no text was extracted. Manual review is required.",
          metadata: { documentId: id, category, extractionMethod: extraction.method },
          occurredAt: new Date(),
        });
      });
    } catch (error) {
      await fs.unlink(diskPath).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({
      document: {
        id,
        userId: user.id,
        fileName: safeName,
        fileType: file.type,
        filePath: `/api/documents/${id}/file`,
        fileSize: file.size,
        category,
        status,
        ocrText: extraction.text,
        ocrConfidence: extraction.confidence,
        extractionMethod: extraction.method,
        extractedFields: extraction.fields,
        isImage,
      },
    });
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
