ALTER TYPE "public"."source_kind" ADD VALUE 'podcast_rss';--> statement-breakpoint
ALTER TYPE "public"."work_kind" ADD VALUE 'podcast';--> statement-breakpoint
ALTER TYPE "public"."work_kind" ADD VALUE 'podcast_episode';--> statement-breakpoint
CREATE TABLE "podcast_details" (
	"work_id" uuid PRIMARY KEY NOT NULL,
	"feed_url" text,
	"podcast_guid" text,
	"apple_id" varchar(32),
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "podcast_episode_details" (
	"work_id" uuid PRIMARY KEY NOT NULL,
	"podcast_work_id" uuid NOT NULL,
	"episode_guid" text NOT NULL,
	"audio_url" text,
	"duration_sec" integer,
	"pub_date" timestamp with time zone,
	"season" integer,
	"episode" integer,
	"episode_kind" varchar(16),
	CONSTRAINT "podcast_episode_details_show_guid_unique" UNIQUE("podcast_work_id","episode_guid")
);
--> statement-breakpoint
ALTER TABLE "podcast_details" ADD CONSTRAINT "podcast_details_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_episode_details" ADD CONSTRAINT "podcast_episode_details_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_episode_details" ADD CONSTRAINT "podcast_episode_details_podcast_work_id_works_id_fk" FOREIGN KEY ("podcast_work_id") REFERENCES "public"."works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "podcast_episode_details_podcast_idx" ON "podcast_episode_details" USING btree ("podcast_work_id");--> statement-breakpoint
-- Discriminator-Härtung (Brief 114): podcast_details/podcast_episode_details
-- prüfen — analog zu channel/video in Migration 0003 — dass works.kind passt.
-- Drizzle-Schema kann CHECK-Trigger nicht ausdrücken (Brief 019 § Notes C); daher
-- hand-angehängt. Die oben per ADD VALUE ergänzten Enum-Literale 'podcast' /
-- 'podcast_episode' werden in den Funktions-Bodies nur als plpgsql-Text gespeichert
-- (erst beim Trigger-Fire — stets in einer späteren Transaktion — in work_kind
-- gecastet), daher kein "unsafe use of new value"-Konflikt mit dem ADD VALUE.
CREATE FUNCTION assert_podcast_details_kind() RETURNS trigger AS $$
BEGIN
  IF (SELECT kind FROM works WHERE id = NEW.work_id) <> 'podcast' THEN
    RAISE EXCEPTION 'podcast_details may only attach to works.kind = podcast (work_id=%)', NEW.work_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER podcast_details_kind_check BEFORE INSERT OR UPDATE ON podcast_details
  FOR EACH ROW EXECUTE FUNCTION assert_podcast_details_kind();--> statement-breakpoint
CREATE FUNCTION assert_podcast_episode_details_kind() RETURNS trigger AS $$
BEGIN
  IF (SELECT kind FROM works WHERE id = NEW.work_id) <> 'podcast_episode' THEN
    RAISE EXCEPTION 'podcast_episode_details may only attach to works.kind = podcast_episode (work_id=%)', NEW.work_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER podcast_episode_details_kind_check BEFORE INSERT OR UPDATE ON podcast_episode_details
  FOR EACH ROW EXECUTE FUNCTION assert_podcast_episode_details_kind();