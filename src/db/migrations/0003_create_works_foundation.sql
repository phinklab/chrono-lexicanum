CREATE TYPE "public"."canonicity" AS ENUM('official', 'fan_classic', 'fan', 'apocrypha', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."external_link_kind" AS ENUM('read', 'listen', 'watch', 'buy_print', 'reference', 'trailer', 'official_page');--> statement-breakpoint
CREATE TYPE "public"."person_role" AS ENUM('author', 'co_author', 'translator', 'editor', 'narrator', 'co_narrator', 'full_cast', 'director', 'co_director', 'cover_artist', 'sound_designer');--> statement-breakpoint
CREATE TYPE "public"."work_kind" AS ENUM('book', 'film', 'tv_series', 'channel', 'video');--> statement-breakpoint
ALTER TYPE "public"."source_kind" ADD VALUE 'tmdb';--> statement-breakpoint
ALTER TYPE "public"."source_kind" ADD VALUE 'imdb';--> statement-breakpoint
ALTER TYPE "public"."source_kind" ADD VALUE 'youtube';--> statement-breakpoint
ALTER TYPE "public"."source_kind" ADD VALUE 'wikidata';--> statement-breakpoint
CREATE TABLE "book_details" (
	"work_id" uuid PRIMARY KEY NOT NULL,
	"isbn13" varchar(13),
	"series_id" varchar(64),
	"series_index" integer
);
--> statement-breakpoint
CREATE TABLE "channel_details" (
	"work_id" uuid PRIMARY KEY NOT NULL,
	"platform" varchar(32)
);
--> statement-breakpoint
CREATE TABLE "external_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_id" uuid NOT NULL,
	"kind" "external_link_kind" NOT NULL,
	"service_id" varchar(64) NOT NULL,
	"url" text NOT NULL,
	"label" text,
	"region" varchar(8),
	"affiliate" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facet_categories" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"multi_value" boolean DEFAULT true NOT NULL,
	"visible_to_users" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facet_values" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"category_id" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "film_details" (
	"work_id" uuid PRIMARY KEY NOT NULL,
	"release_date" date
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_sort" text NOT NULL,
	"bio" text,
	"birth_year" integer,
	"lexicanum_url" text,
	"wikipedia_url" text,
	"extras" jsonb
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"affiliate_supported" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_details" (
	"work_id" uuid PRIMARY KEY NOT NULL,
	"channel_work_id" uuid,
	"uploaded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "work_characters" (
	"work_id" uuid NOT NULL,
	"character_id" varchar(64) NOT NULL,
	"role" varchar(32) DEFAULT 'appears',
	CONSTRAINT "work_characters_work_id_character_id_pk" PRIMARY KEY("work_id","character_id")
);
--> statement-breakpoint
CREATE TABLE "work_facets" (
	"work_id" uuid NOT NULL,
	"facet_value_id" varchar(64) NOT NULL,
	CONSTRAINT "work_facets_work_id_facet_value_id_pk" PRIMARY KEY("work_id","facet_value_id")
);
--> statement-breakpoint
CREATE TABLE "work_factions" (
	"work_id" uuid NOT NULL,
	"faction_id" varchar(64) NOT NULL,
	"role" varchar(32) DEFAULT 'supporting',
	CONSTRAINT "work_factions_work_id_faction_id_pk" PRIMARY KEY("work_id","faction_id")
);
--> statement-breakpoint
CREATE TABLE "work_locations" (
	"work_id" uuid NOT NULL,
	"location_id" varchar(64) NOT NULL,
	"role" varchar(32) DEFAULT 'secondary',
	"at_y" numeric(10, 3),
	CONSTRAINT "work_locations_work_id_location_id_pk" PRIMARY KEY("work_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "work_persons" (
	"work_id" uuid NOT NULL,
	"person_id" varchar(64) NOT NULL,
	"role" "person_role" NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"note" text,
	CONSTRAINT "work_persons_work_id_person_id_role_pk" PRIMARY KEY("work_id","person_id","role")
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "work_kind" NOT NULL,
	"canonicity" "canonicity" DEFAULT 'official' NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" text NOT NULL,
	"cover_url" text,
	"synopsis" text,
	"start_y" numeric(10, 3),
	"end_y" numeric(10, 3),
	"release_year" integer,
	"source_kind" "source_kind" DEFAULT 'manual' NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '1.00',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "works_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "book_details" ADD CONSTRAINT "book_details_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_details" ADD CONSTRAINT "book_details_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_details" ADD CONSTRAINT "channel_details_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_links" ADD CONSTRAINT "external_links_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facet_values" ADD CONSTRAINT "facet_values_category_id_facet_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."facet_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_details" ADD CONSTRAINT "film_details_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_details" ADD CONSTRAINT "video_details_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_details" ADD CONSTRAINT "video_details_channel_work_id_works_id_fk" FOREIGN KEY ("channel_work_id") REFERENCES "public"."works"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_characters" ADD CONSTRAINT "work_characters_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_characters" ADD CONSTRAINT "work_characters_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_facets" ADD CONSTRAINT "work_facets_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_facets" ADD CONSTRAINT "work_facets_facet_value_id_facet_values_id_fk" FOREIGN KEY ("facet_value_id") REFERENCES "public"."facet_values"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_factions" ADD CONSTRAINT "work_factions_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_factions" ADD CONSTRAINT "work_factions_faction_id_factions_id_fk" FOREIGN KEY ("faction_id") REFERENCES "public"."factions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_locations" ADD CONSTRAINT "work_locations_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_locations" ADD CONSTRAINT "work_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_persons" ADD CONSTRAINT "work_persons_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_persons" ADD CONSTRAINT "work_persons_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "book_details_series_idx" ON "book_details" USING btree ("series_id","series_index");--> statement-breakpoint
CREATE INDEX "external_links_work_idx" ON "external_links" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "external_links_service_idx" ON "external_links" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "facet_values_category_idx" ON "facet_values" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "work_characters_character_idx" ON "work_characters" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX "work_facets_facet_value_idx" ON "work_facets" USING btree ("facet_value_id");--> statement-breakpoint
CREATE INDEX "work_factions_faction_idx" ON "work_factions" USING btree ("faction_id");--> statement-breakpoint
CREATE INDEX "work_locations_location_idx" ON "work_locations" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "work_persons_person_idx" ON "work_persons" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "works_start_y_idx" ON "works" USING btree ("start_y");--> statement-breakpoint
CREATE INDEX "works_kind_idx" ON "works" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "works_canonicity_idx" ON "works" USING btree ("canonicity");--> statement-breakpoint
CREATE INDEX "works_release_year_idx" ON "works" USING btree ("release_year");--> statement-breakpoint
CREATE INDEX "works_slug_idx" ON "works" USING btree ("slug");--> statement-breakpoint
-- Discriminator-Härtung: jede Detail-Tabelle prüft, dass works.kind passt.
-- Ergänzt zur App-seitigen `insertBook`-Helper-Diziplin in scripts/seed.ts.
-- Drizzle-Schema kann CHECK-Trigger nicht ausdrücken; siehe Brief 019 § Notes C.
CREATE FUNCTION assert_book_details_kind() RETURNS trigger AS $$
BEGIN
  IF (SELECT kind FROM works WHERE id = NEW.work_id) <> 'book' THEN
    RAISE EXCEPTION 'book_details may only attach to works.kind = book (work_id=%)', NEW.work_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER book_details_kind_check BEFORE INSERT OR UPDATE ON book_details
  FOR EACH ROW EXECUTE FUNCTION assert_book_details_kind();--> statement-breakpoint
CREATE FUNCTION assert_film_details_kind() RETURNS trigger AS $$
BEGIN
  IF (SELECT kind FROM works WHERE id = NEW.work_id) <> 'film' THEN
    RAISE EXCEPTION 'film_details may only attach to works.kind = film (work_id=%)', NEW.work_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER film_details_kind_check BEFORE INSERT OR UPDATE ON film_details
  FOR EACH ROW EXECUTE FUNCTION assert_film_details_kind();--> statement-breakpoint
CREATE FUNCTION assert_channel_details_kind() RETURNS trigger AS $$
BEGIN
  IF (SELECT kind FROM works WHERE id = NEW.work_id) <> 'channel' THEN
    RAISE EXCEPTION 'channel_details may only attach to works.kind = channel (work_id=%)', NEW.work_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER channel_details_kind_check BEFORE INSERT OR UPDATE ON channel_details
  FOR EACH ROW EXECUTE FUNCTION assert_channel_details_kind();--> statement-breakpoint
CREATE FUNCTION assert_video_details_kind() RETURNS trigger AS $$
BEGIN
  IF (SELECT kind FROM works WHERE id = NEW.work_id) <> 'video' THEN
    RAISE EXCEPTION 'video_details may only attach to works.kind = video (work_id=%)', NEW.work_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER video_details_kind_check BEFORE INSERT OR UPDATE ON video_details
  FOR EACH ROW EXECUTE FUNCTION assert_video_details_kind();