import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

export type ExtractionMethod = "pdf-text" | "tesseract-ocr" | "no-text-found" | "ocr-unavailable";

export type ExtractedField = {
  key: string;
  label: string;
  value: string;
  unit: string;
  sourceExcerpt: string;
};

export type DocumentExtraction = {
  text: string;
  confidence: number | null;
  method: ExtractionMethod;
  fields: ExtractedField[];
};

const FIELD_PATTERNS: { key: string; label: string; unit: string; pattern: RegExp }[] = [
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", pattern: /\b(?:hemoglobin|haemoglobin|hb)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i },
  { key: "hba1c", label: "HbA1c", unit: "%", pattern: /\b(?:hba1c|a1c)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*%?/i },
  { key: "glucose", label: "Glucose", unit: "", pattern: /\b(?:fasting\s+glucose|blood\s+glucose|glucose)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i },
  { key: "total_cholesterol", label: "Total cholesterol", unit: "", pattern: /\btotal\s+cholesterol\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i },
  { key: "ldl", label: "LDL", unit: "", pattern: /\bldl\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i },
  { key: "hdl", label: "HDL", unit: "", pattern: /\bhdl\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i },
  { key: "heart_rate", label: "Heart rate", unit: "bpm", pattern: /\b(?:heart\s+rate|pulse)\s*[:=\-]?\s*(\d+(?:\.\d+)?)/i },
  { key: "spo2", label: "SpO2", unit: "%", pattern: /\b(?:spo2|oxygen\s+saturation)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*%?/i },
  { key: "blood_pressure", label: "Blood pressure", unit: "mmHg", pattern: /\b(?:blood\s+pressure|bp)\s*[:=\-]?\s*(\d{2,3}\s*\/\s*\d{2,3})/i },
  { key: "temperature", label: "Temperature", unit: "", pattern: /\b(?:temperature|temp)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(?:°?\s*([fc]))?/i },
];

export function extractMedicalFields(text: string): ExtractedField[] {
  return FIELD_PATTERNS.flatMap(({ key, label, unit, pattern }) => {
    const match = pattern.exec(text);
    if (!match) return [];
    const sourceExcerpt = match[0].replace(/\s+/g, " ").trim();
    const resolvedUnit = key === "temperature" ? (match[2]?.toUpperCase() ?? "") : unit;
    return [{ key, label, value: match[1].replace(/\s+/g, ""), unit: resolvedUnit, sourceExcerpt }];
  });
}

async function readPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

async function recognizeImage(buffer: Buffer, language: "eng" | "tel" | "hin"): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker(language);
  try {
    const result = await worker.recognize(buffer);
    return { text: result.data.text.trim(), confidence: result.data.confidence / 100 };
  } finally {
    await worker.terminate();
  }
}

async function recognizePdfPages(buffer: Buffer, language: "eng" | "tel" | "hin") {
  const parser = new PDFParse({ data: buffer });
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  const text: string[] = [];
  const confidence: number[] = [];

  try {
    worker = await createWorker(language);
    const screenshot = await parser.getScreenshot({ first: 20, desiredWidth: 1800, imageBuffer: true, imageDataUrl: false });
    for (const page of screenshot.pages) {
      const recognized = await worker.recognize(Buffer.from(page.data));
      if (recognized.data.text.trim()) text.push(recognized.data.text.trim());
      confidence.push(recognized.data.confidence / 100);
    }
  } finally {
    await worker?.terminate();
    await parser.destroy();
  }

  return {
    text: text.join("\n\n"),
    confidence: confidence.length
      ? confidence.reduce((total, value) => total + value, 0) / confidence.length
      : null,
  };
}

export async function extractDocumentContent(
  buffer: Buffer,
  mimeType: string,
  preferredLanguage: string,
): Promise<DocumentExtraction> {
  const language = preferredLanguage === "te" ? "tel" : preferredLanguage === "hi" ? "hin" : "eng";

  if (mimeType === "application/pdf") {
    const pdfText = await readPdfText(buffer);
    if (pdfText.length >= 20) {
      return { text: pdfText.slice(0, 100_000), confidence: null, method: "pdf-text", fields: extractMedicalFields(pdfText) };
    }

    try {
      const recognized = await recognizePdfPages(buffer, language);
      const text = recognized.text.slice(0, 100_000);
      return {
        text,
        confidence: recognized.confidence,
        method: text ? "tesseract-ocr" : "no-text-found",
        fields: extractMedicalFields(text),
      };
    } catch {
      return { text: "", confidence: null, method: "ocr-unavailable", fields: [] };
    }
  }

  try {
    const recognized = await recognizeImage(buffer, language);
    const text = recognized.text.slice(0, 100_000);
    return {
      text,
      confidence: recognized.confidence,
      method: text ? "tesseract-ocr" : "no-text-found",
      fields: extractMedicalFields(text),
    };
  } catch {
    return { text: "", confidence: null, method: "ocr-unavailable", fields: [] };
  }
}