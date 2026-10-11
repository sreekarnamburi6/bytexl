import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import { jsPDF } from "jspdf";
import { extractDocumentContent, extractMedicalFields } from "../src/lib/document-processing";

describe("extractMedicalFields", () => {
  it("returns values with exact source excerpts and units", () => {
    const fields = extractMedicalFields(
      "Hemoglobin: 13.8 g/dL\nHbA1c: 5.8%\nFasting Glucose: 101 mg/dL\nBP: 120/80 mmHg",
    );

    expect(fields).toEqual([
      { key: "hemoglobin", label: "Hemoglobin", value: "13.8", unit: "g/dL", sourceExcerpt: "Hemoglobin: 13.8" },
      { key: "hba1c", label: "HbA1c", value: "5.8", unit: "%", sourceExcerpt: "HbA1c: 5.8%" },
      { key: "glucose", label: "Glucose", value: "101", unit: "", sourceExcerpt: "Fasting Glucose: 101" },
      { key: "blood_pressure", label: "Blood pressure", value: "120/80", unit: "mmHg", sourceExcerpt: "BP: 120/80" },
    ]);
  });

  it("does not invent fields when the source contains no matching measurements", () => {
    expect(extractMedicalFields("Follow up with the clinic next week.")).toEqual([]);
  });
});

describe("PDF extraction", () => {
  it("runs Tesseract over scanned PDF pages when there is no text layer", async () => {
    const canvas = createCanvas(1800, 480);
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, 1800, 480);
    context.fillStyle = "black";
    context.font = "bold 110px Arial";
    context.fillText("HbA1c: 5.8%", 55, 290);

    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 200, 55);
    const result = await extractDocumentContent(Buffer.from(pdf.output("arraybuffer")), "application/pdf", "en");

    expect(result.method).toBe("tesseract-ocr");
    expect(result.text).toMatch(/HbA1c/i);
    expect(result.confidence).toBeGreaterThan(0);
  }, 60_000);
});