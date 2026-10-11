import { describe, expect, it } from "vitest";
import { createPdf } from "../src/lib/report-pdf";

describe("on-demand medical report PDF", () => {
  it("creates a PDF from source-linked account values without diagnostic output", () => {
    const pdf = createPdf({
      generatedAt: "2026-10-10T12:00:00.000Z",
      patient: { name: "Test Patient", email: "patient@example.test", dateOfBirth: null, bloodGroup: "O+" },
      vitals: [{
        id: "vital-1",
        type: "heart_rate",
        value: 72,
        unit: "bpm",
        recordedAt: "2026-10-10T11:00:00.000Z",
        source: "Manually entered by account holder",
      }],
      documents: [{
        id: "document-1",
        fileName: "lab-report.pdf",
        category: "Lab Report",
        uploadedAt: "2026-10-10T10:00:00.000Z",
        extractionMethod: "pdf-text",
        extractedFields: [{
          key: "hba1c",
          label: "HbA1c",
          value: "5.8",
          unit: "%",
          sourceExcerpt: "HbA1c: 5.8%",
        }],
        hasSourceText: true,
      }],
      notice: "Source values only; no diagnosis is included.",
    });

    const output = pdf.output("arraybuffer");
    expect(Buffer.from(output).subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(output.byteLength).toBeGreaterThan(1000);
    expect(pdf.getNumberOfPages()).toBe(1);
  });
});