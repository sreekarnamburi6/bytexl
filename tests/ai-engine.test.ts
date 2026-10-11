import { describe, expect, it } from "vitest";
import { copilotReply } from "../src/lib/ai-engine";

describe("honest AI/demo output", () => {
  it("labels source transcription and OCR limitations in all supported languages", () => {
    for (const language of ["en", "te", "hi"] as const) {
      const answer = copilotReply("summarize my latest report", language, {
        userName: "Asha",
        documentCount: 1,
        latestDocumentSummary: "Source: lab.pdf\nHbA1c: 5.8%",
      });

      expect(answer).toContain("lab.pdf");
      expect(answer).toContain("HbA1c: 5.8%");
      expect(answer).toContain("OCR");
    }
  });

  it("declines to produce risk assessments", () => {
    const answer = copilotReply("What is my health risk?", "en", {
      userName: "Asha",
      documentCount: 0,
    });
    expect(answer).toContain("not assessed");
    expect(answer).not.toContain("LOW");
  });

  it("recognizes Telugu and Hindi report prompts", () => {
    const context = { userName: "Asha", documentCount: 1, latestDocumentSummary: "Source: lab.pdf\nHbA1c: 5.8%" };
    expect(copilotReply("నా తాజా రిపోర్ట్ సారాంశం", "te", context)).toContain("సారాంశం");
    expect(copilotReply("मेरी नवीनतम रिपोर्ट का सारांश", "hi", context)).toContain("सारांश");
  });
});