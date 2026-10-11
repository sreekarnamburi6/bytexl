import {
  pgTable,
  text,
  timestamp,
  real,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("patient"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  bloodGroup: text("blood_group").default("O+"),
  dateOfBirth: text("date_of_birth"),
  phone: text("phone"),
  avatarColor: text("avatar_color").notNull().default("#22d3ee"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: real("file_size").notNull().default(0),
  category: text("category").notNull().default("General"),
  status: text("status").notNull().default("processed"),
  ocrText: text("ocr_text"),
  ocrConfidence: real("ocr_confidence").default(0),
  extractionMethod: text("extraction_method").notNull().default("legacy-simulated"),
  extractedFields: jsonb("extracted_fields").notNull().default([]),
  isImage: boolean("is_image").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("image_analysis"),
  modelId: text("model_id").notNull().default("legacy-simulated"),
  modelScores: jsonb("model_scores").notNull().default([]),
  summary: text("summary").notNull(),
  findings: jsonb("findings").notNull().default([]),
  confidence: real("confidence").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("low"),
  analysisEngine: text("analysis_engine").notNull().default("legacy-simulated"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  metadata: jsonb("metadata").notNull().default({}),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const vitals = pgTable("vitals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  source: text("source").notNull().default("legacy-unknown"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});
