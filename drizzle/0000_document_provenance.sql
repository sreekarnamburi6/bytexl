ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "extraction_method" text DEFAULT 'legacy-simulated' NOT NULL;
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "extracted_fields" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN IF NOT EXISTS "analysis_engine" text DEFAULT 'simulated-demo' NOT NULL;
--> statement-breakpoint
ALTER TABLE "vitals" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'legacy-unknown' NOT NULL;