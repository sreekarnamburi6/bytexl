import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { normalizePostgresConnectionString } from "./src/lib/postgres-connection";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Configure it in your .env file.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: normalizePostgresConnectionString(databaseUrl) },
});