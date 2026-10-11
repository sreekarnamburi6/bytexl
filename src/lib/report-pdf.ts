import { jsPDF } from "jspdf";

export type ReportData = {
  generatedAt: string;
  patient: { name: string; email: string; dateOfBirth: string | null; bloodGroup: string | null };
  vitals: { id: string; type: string; value: number; unit: string; recordedAt: string; source: string }[];
  documents: {
    id: string;
    fileName: string;
    category: string;
    uploadedAt: string;
    extractionMethod: string;
    extractedFields: { key: string; label: string; value: string; unit: string; sourceExcerpt: string }[];
    hasSourceText: boolean;
  }[];
  notice: string;
};

export function createPdf(data: ReportData) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const left = 18;
  const pageBottom = 278;
  let y = 20;

  const ensureSpace = (height: number) => {
    if (y + height > pageBottom) {
      pdf.addPage();
      y = 20;
    }
  };
  const paragraph = (text: string, fontSize = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, 174);
    const height = lines.length * (fontSize * 0.42 + 1.5);
    ensureSpace(height);
    pdf.text(lines, left, y);
    y += height + 2;
  };
  const heading = (text: string) => {
    ensureSpace(12);
    y += 3;
    pdf.setTextColor(14, 116, 144);
    paragraph(text, 13);
    pdf.setTextColor(35, 45, 55);
  };

  pdf.setTextColor(8, 72, 92);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text("MEDISCOPE HEALTH REPORT", left, y);
  y += 9;
  pdf.setTextColor(70, 80, 90);
  pdf.setFont("helvetica", "normal");
  paragraph(`Generated ${new Date(data.generatedAt).toLocaleString()}`, 9);

  heading("Patient");
  paragraph(`Name: ${data.patient.name}`);
  paragraph(`Email: ${data.patient.email}`);
  paragraph(`Date of birth: ${data.patient.dateOfBirth || "Not provided"}`);
  paragraph(`Blood group: ${data.patient.bloodGroup || "Not provided"}`);

  heading("User-entered vital readings");
  if (data.vitals.length === 0) paragraph("No user-entered readings are available.");
  for (const vital of data.vitals) {
    paragraph(`${vital.type.replaceAll("_", " ")}: ${vital.value} ${vital.unit} · ${new Date(vital.recordedAt).toLocaleString()} · ${vital.source}`);
  }

  heading("Uploaded documents and extracted source values");
  if (data.documents.length === 0) paragraph("No documents are available.");
  for (const document of data.documents) {
    ensureSpace(18);
    pdf.setFont("helvetica", "bold");
    paragraph(`${document.fileName} · ${document.category} · ${new Date(document.uploadedAt).toLocaleDateString()}`);
    pdf.setFont("helvetica", "normal");
    paragraph(`Extraction: ${document.extractionMethod}. Source transcription may contain errors; verify against the original file.`, 9);
    if (document.extractedFields.length === 0) paragraph("No structured source values were extracted.", 9);
    for (const field of document.extractedFields) {
      paragraph(`${field.label}: ${field.value} ${field.unit} · source text: "${field.sourceExcerpt}"`, 9);
    }
  }

  heading("Important limitations");
  paragraph(data.notice, 9);
  paragraph("This report is an informational account-data export, not medical advice, a diagnosis, or a certified medical record. Have a licensed clinician verify its contents.", 9);

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(110, 120, 130);
    pdf.text(`MEDISCOPE AI · Account data export · Page ${page} of ${pageCount}`, left, 289);
  }
  return pdf;
}