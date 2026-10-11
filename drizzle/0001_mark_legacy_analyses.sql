UPDATE "analyses" SET "analysis_engine" = 'legacy-simulated' WHERE "analysis_engine" = 'simulated-demo';
--> statement-breakpoint
ALTER TABLE "analyses" ALTER COLUMN "analysis_engine" SET DEFAULT 'legacy-simulated';