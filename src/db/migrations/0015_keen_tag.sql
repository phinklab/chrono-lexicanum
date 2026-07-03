DROP INDEX "works_slug_idx";--> statement-breakpoint
CREATE INDEX "characters_primary_faction_idx" ON "characters" USING btree ("primary_faction_id");--> statement-breakpoint
CREATE INDEX "factions_parent_idx" ON "factions" USING btree ("parent_id");