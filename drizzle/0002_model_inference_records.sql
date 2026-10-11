ALTER TABLE "analyses" ADD COLUMN IF NOT EXISTS "model_id" text DEFAULT 'legacy-simulated' NOT NULL;
--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN IF NOT EXISTS "model_scores" jsonb DEFAULT '[]'::jsonb NOT NULL;