import { describe, expect, it } from "vitest";
import path from "node:path";
import { getDocumentStoragePath } from "../src/lib/document-storage";

describe("document storage paths", () => {
  it("keeps new documents inside the owner-specific private directory", () => {
    expect(getDocumentStoragePath("usr_1", "doc_1-report.pdf")).toBe(
      path.join(process.cwd(), "data", "uploads", "usr_1", "doc_1-report.pdf"),
    );
  });

  it("resolves supported legacy URLs only inside that owner's directory", () => {
    expect(getDocumentStoragePath("usr_1", "/uploads/usr_1/old.pdf")).toBe(
      path.join(process.cwd(), "public", "uploads", "usr_1", "old.pdf"),
    );
  });

  it("rejects traversal paths", () => {
    expect(() => getDocumentStoragePath("usr_1", "../other/secret.pdf")).toThrow();
  });
});