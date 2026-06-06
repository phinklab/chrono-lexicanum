ALTER TABLE "external_links" ADD COLUMN "source_kind" "source_kind" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "external_links" ADD COLUMN "confidence" numeric(3, 2) DEFAULT '1.00';--> statement-breakpoint
-- Brief 128 / B1-S1 (2026-06-06): prod-safe service rows for podcast links.
-- `services` is a reference table seeded from scripts/seed-data/services.json on
-- a FRESH db (npm run db:seed); an already-seeded prod db is never re-seeded, so
-- these new FK targets would be missing there. db:migrate runs on every Vercel
-- deploy (vercel-build), so these idempotent inserts guarantee the rows exist
-- before any future external_links row references them (B1-S3). Values mirror
-- services.json exactly; ON CONFLICT keeps re-runs and the fresh-seed path safe.
INSERT INTO "services" ("id", "name", "domain", "display_order") VALUES
	('official_website', 'Official Website', NULL, 5),
	('apple_podcasts', 'Apple Podcasts', 'podcasts.apple.com', 55),
	('rss', 'RSS Feed', NULL, 65)
ON CONFLICT ("id") DO NOTHING;