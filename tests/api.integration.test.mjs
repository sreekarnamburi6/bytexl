import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { after, test } from "node:test";
import { Pool } from "pg";
import { jsPDF } from "jspdf";
import { createCanvas } from "@napi-rs/canvas";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const createdUsers = [];

function sessionCookie(response) {
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("mediscope_session="));
  assert.ok(cookie, "response should set the session cookie");
  return cookie.split(";", 1)[0];
}

async function createAccount() {
  const suffix = randomUUID();
  const response = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: { Origin: baseUrl, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Integration Test",
      email: `integration-${suffix}@example.test`,
      password: "IntegrationPass123",
      preferredLanguage: "en",
    }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  createdUsers.push(body.user.id);
  return { user: body.user, cookie: sessionCookie(response), password: "IntegrationPass123" };
}

test("auth, extraction, report, and document ownership APIs", async () => {
  const first = await createAccount();
  try {
    const unauthenticatedReport = await fetch(`${baseUrl}/api/reports`);
    assert.equal(unauthenticatedReport.status, 401);
    const unauthenticatedModels = await fetch(`${baseUrl}/api/models`);
    assert.equal(unauthenticatedModels.status, 401);

    const sameOriginMutation = await fetch(`${baseUrl}/api/auth/me`, {
      method: "PATCH",
      headers: { Cookie: first.cookie, Origin: baseUrl, "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(sameOriginMutation.status, 400);

    const modelCatalogResponse = await fetch(`${baseUrl}/api/models`, { headers: { Cookie: first.cookie } });
    const modelCatalog = await modelCatalogResponse.json();
    assert.equal(modelCatalogResponse.status, 200, JSON.stringify(modelCatalog));
    assert.equal(modelCatalog.models.filter((model) => model.enabled).length, 7);
    assert.equal(modelCatalog.models.filter((model) => !model.enabled).length, 1);

    const crossOriginMutation = await fetch(`${baseUrl}/api/timeline`, {
      method: "POST",
      headers: {
        Cookie: first.cookie,
        Origin: "https://attacker.invalid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Blocked cross-origin request", type: "note" }),
    });
    assert.equal(crossOriginMutation.status, 403);

    const vitalResponse = await fetch(`${baseUrl}/api/vitals`, {
      method: "POST",
      headers: { Cookie: first.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "heart_rate", value: 72, unit: "bpm" }),
    });
    assert.equal(vitalResponse.status, 200);

    const invalidFile = new FormData();
    invalidFile.append("file", new Blob(["not really a pdf"], { type: "application/pdf" }), "invalid.pdf");
    const invalidUpload = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { Cookie: first.cookie },
      body: invalidFile,
    });
    assert.equal(invalidUpload.status, 415);

    const pdf = new jsPDF();
    pdf.text("Hemoglobin: 13.8 g/dL", 15, 20);
    pdf.text("HbA1c: 5.8%", 15, 30);
    const pdfFile = new FormData();
    pdfFile.append("file", new Blob([pdf.output("arraybuffer")], { type: "application/pdf" }), "lab-report.pdf");
    const uploadResponse = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { Cookie: first.cookie },
      body: pdfFile,
    });
    const uploadBody = await uploadResponse.json();
    assert.equal(uploadResponse.status, 200, JSON.stringify(uploadBody));
    assert.equal(uploadBody.document.extractionMethod, "pdf-text");
    assert.match(uploadBody.document.ocrText, /Hemoglobin: 13\.8/);
    assert.ok(uploadBody.document.extractedFields.some((field) => field.key === "hba1c" && field.value === "5.8"));
    assert.equal((await fetch(`${baseUrl}/api/analyses`, {
      method: "POST",
      headers: { Cookie: first.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: uploadBody.document.id, modelId: "brain_tumor" }),
    })).status, 415);

    const canvas = createCanvas(1800, 480);
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, 1800, 480);
    context.fillStyle = "black";
    context.font = "bold 110px Arial";
    context.fillText("HbA1c: 5.8%", 55, 290);
    const imageForm = new FormData();
    imageForm.append("file", new Blob([canvas.toBuffer("image/png")], { type: "image/png" }), "hba1c-scan.png");
    const imageResponse = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { Cookie: first.cookie },
      body: imageForm,
    });
    const imageBody = await imageResponse.json();
    assert.equal(imageResponse.status, 200, JSON.stringify(imageBody));
    assert.equal(imageBody.document.extractionMethod, "tesseract-ocr");
    assert.match(imageBody.document.ocrText, /HbA1c/i);
    assert.ok(imageBody.document.ocrConfidence > 0);
    const fixtureCanvas = createCanvas(224, 224);
    const fixtureContext = fixtureCanvas.getContext("2d");
    const gradient = fixtureContext.createLinearGradient(0, 0, 224, 224);
    gradient.addColorStop(0, "#24364a");
    gradient.addColorStop(1, "#a9b8c7");
    fixtureContext.fillStyle = gradient;
    fixtureContext.fillRect(0, 0, 224, 224);
    const modelFixtureForm = new FormData();
    modelFixtureForm.append("file", new Blob([fixtureCanvas.toBuffer("image/png")], { type: "image/png" }), "synthetic-model-runtime-fixture.png");
    modelFixtureForm.append("category", "Medical Image");
    const modelFixtureResponse = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { Cookie: first.cookie },
      body: modelFixtureForm,
    });
    const modelFixture = await modelFixtureResponse.json();
    assert.equal(modelFixtureResponse.status, 200, JSON.stringify(modelFixture));

    const disabledModelResponse = await fetch(`${baseUrl}/api/analyses`, {
      method: "POST",
      headers: { Cookie: first.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: modelFixture.document.id, modelId: "skin_cancer" }),
    });
    assert.equal(disabledModelResponse.status, 422);

    const imageAnalysisResponse = await fetch(`${baseUrl}/api/analyses`, {
      method: "POST",
      headers: { Cookie: first.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: modelFixture.document.id, modelId: "brain_tumor" }),
    });
    const inferenceBody = await imageAnalysisResponse.json();
    assert.equal(imageAnalysisResponse.status, 200, JSON.stringify(inferenceBody));
    assert.equal(inferenceBody.analysis.modelId, "brain_tumor");
    assert.equal(inferenceBody.analysis.analysisEngine, "keras-3-torch");
    assert.equal(inferenceBody.analysis.resultType, "experimental_model_output");
    assert.equal(inferenceBody.analysis.riskLevel, "not_assessed");
    assert.equal(inferenceBody.analysis.scores.length, 4);
    assert.match(inferenceBody.analysis.disclaimer, /not a diagnosis/i);

    const storedAnalyses = await (await fetch(`${baseUrl}/api/analyses`, { headers: { Cookie: first.cookie } })).json();
    assert.ok(storedAnalyses.analyses.some((analysis) => analysis.id === inferenceBody.analysis.id && analysis.modelId === "brain_tumor"));

    const scannedPdf = new jsPDF();
    scannedPdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 200, 55);
    const scannedPdfForm = new FormData();
    scannedPdfForm.append("file", new Blob([scannedPdf.output("arraybuffer")], { type: "application/pdf" }), "scanned-lab.pdf");
    const scannedPdfResponse = await fetch(`${baseUrl}/api/documents`, {
      method: "POST",
      headers: { Cookie: first.cookie },
      body: scannedPdfForm,
    });
    const scannedPdfBody = await scannedPdfResponse.json();
    assert.equal(scannedPdfResponse.status, 200, JSON.stringify(scannedPdfBody));
    assert.equal(scannedPdfBody.document.extractionMethod, "tesseract-ocr");
    assert.match(scannedPdfBody.document.ocrText, /HbA1c/i);

    const fileResponse = await fetch(`${baseUrl}${uploadBody.document.filePath}`, { headers: { Cookie: first.cookie } });
    assert.equal(fileResponse.status, 200);
    assert.match(fileResponse.headers.get("content-type"), /application\/pdf/);

    const reportResponse = await fetch(`${baseUrl}/api/reports`, { headers: { Cookie: first.cookie } });
    const report = await reportResponse.json();
    assert.equal(reportResponse.status, 200);
    assert.ok(report.vitals.some((vital) => vital.type === "heart_rate" && vital.value === 72));
    assert.ok(report.documents.some((document) => document.id === uploadBody.document.id));
    assert.match(report.notice, /No diagnosis/);

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { Origin: baseUrl, "Content-Type": "application/json" },
      body: JSON.stringify({ email: first.user.email, password: first.password }),
    });
    assert.equal(loginResponse.status, 200);
    const meResponse = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: sessionCookie(loginResponse) } });
    assert.equal((await meResponse.json()).user.email, first.user.email);

    const second = await createAccount();
    const crossUserInference = await fetch(`${baseUrl}/api/analyses`, {
      method: "POST",
      headers: { Cookie: second.cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: modelFixture.document.id, modelId: "brain_tumor" }),
    });
    assert.equal(crossUserInference.status, 404);

    const legacyVitalId = `vit_${randomUUID()}`;
    await pool.query(
      "INSERT INTO vitals (id, user_id, type, value, unit, source) VALUES ($1, $2, $3, $4, $5, $6)",
      [legacyVitalId, second.user.id, "heart_rate", 90, "bpm", "demo"],
    );
    const legacyDocumentId = `legacy_${randomUUID()}`;
    await pool.query(
      "INSERT INTO documents (id, user_id, file_name, file_type, file_path, category, ocr_text, ocr_confidence, is_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [legacyDocumentId, second.user.id, "legacy.pdf", "application/pdf", "legacy.pdf", "Lab Report", "synthetic historical text", 0.9, false],
    );
    const secondReportResponse = await fetch(`${baseUrl}/api/reports`, { headers: { Cookie: second.cookie } });
    const secondReport = await secondReportResponse.json();
    assert.equal(secondReport.vitals.length, 0);
    assert.equal(secondReport.documents.length, 0);

    const forbiddenFile = await fetch(`${baseUrl}${uploadBody.document.filePath}`, { headers: { Cookie: second.cookie } });
    assert.equal(forbiddenFile.status, 404);
    const forbiddenDelete = await fetch(`${baseUrl}/api/documents/${uploadBody.document.id}`, {
      method: "DELETE",
      headers: { Cookie: second.cookie },
    });
    assert.equal(forbiddenDelete.status, 404);

    const ownerDelete = await fetch(`${baseUrl}/api/documents/${uploadBody.document.id}`, {
      method: "DELETE",
      headers: { Cookie: first.cookie },
    });
    assert.equal(ownerDelete.status, 200);
    assert.equal((await fetch(`${baseUrl}/api/documents/${uploadBody.document.id}/file`, { headers: { Cookie: first.cookie } })).status, 404);
    const remainingTimeline = await (await fetch(`${baseUrl}/api/timeline`, { headers: { Cookie: first.cookie } })).json();
    assert.equal(remainingTimeline.events.some((event) => event.title.includes("lab-report.pdf")), false);
  } finally {
    for (const userId of createdUsers) {
      await rm(path.join(process.cwd(), "data", "uploads", userId), { recursive: true, force: true });
    }
    await pool.query("DELETE FROM users WHERE id = ANY($1::text[])", [createdUsers]);
  }
});

after(async () => {
  await pool.end();
});