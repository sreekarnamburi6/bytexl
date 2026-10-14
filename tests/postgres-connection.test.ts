import { describe, expect, it } from "vitest";
import { normalizePostgresConnectionString } from "../src/lib/postgres-connection";

describe("Postgres connection string SSL modes", () => {
  it.each(["prefer", "require", "verify-ca"])(
    "makes %s verification explicit",
    (sslMode) => {
      const connectionString = `postgresql://user:pass@db.example/app?sslmode=${sslMode}&application_name=web`;

      const normalized = new URL(
        normalizePostgresConnectionString(connectionString),
      );

      expect(normalized.searchParams.get("sslmode")).toBe("verify-full");
      expect(normalized.searchParams.get("application_name")).toBe("web");
    },
  );

  it("leaves explicit and unrelated SSL modes unchanged", () => {
    const connectionString =
      "postgresql://user:pass@db.example/app?sslmode=verify-full";

    expect(normalizePostgresConnectionString(connectionString)).toBe(
      connectionString,
    );
  });
});