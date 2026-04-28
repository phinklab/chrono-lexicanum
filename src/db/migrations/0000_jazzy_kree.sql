CREATE TYPE "public"."faction_alignment" AS ENUM('imperium', 'chaos', 'xenos', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."source_kind" AS ENUM('manual', 'lexicanum', 'goodreads', 'black_library', 'fandom_wiki', 'community');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected', 'merged');--> statement-breakpoint
CREATE TABLE "book_characters" (
	"book_id" uuid NOT NULL,
	"character_id" varchar(64) NOT NULL,
	"role" varchar(32) DEFAULT 'appears',
	CONSTRAINT "book_characters_book_id_character_id_pk" PRIMARY KEY("book_id","character_id")
);
--> statement-breakpoint
CREATE TABLE "book_factions" (
	"book_id" uuid NOT NULL,
	"faction_id" varchar(64) NOT NULL,
	"role" varchar(32) DEFAULT 'supporting',
	CONSTRAINT "book_factions_book_id_faction_id_pk" PRIMARY KEY("book_id","faction_id")
);
--> statement-breakpoint
CREATE TABLE "book_locations" (
	"book_id" uuid NOT NULL,
	"location_id" varchar(64) NOT NULL,
	"at_y" numeric(10, 3),
	CONSTRAINT "book_locations_book_id_location_id_pk" PRIMARY KEY("book_id","location_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"author" text NOT NULL,
	"pub_year" integer,
	"cover_url" text,
	"start_y" numeric(10, 3),
	"end_y" numeric(10, 3),
	"synopsis" text,
	"series_id" varchar(64),
	"series_index" integer,
	"goodreads_url" text,
	"lexicanum_url" text,
	"black_library_url" text,
	"isbn13" varchar(13),
	"source_kind" "source_kind" DEFAULT 'manual' NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '1.00',
	"extras" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "books_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"primary_faction_id" varchar(64),
	"lexicanum_url" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "eras" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_y" numeric(10, 3) NOT NULL,
	"end_y" numeric(10, 3) NOT NULL,
	"tone" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" varchar(64),
	"alignment" "faction_alignment" DEFAULT 'neutral' NOT NULL,
	"tone" text,
	"glyph" text
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sector_id" varchar(64),
	"gx" integer NOT NULL,
	"gy" integer NOT NULL,
	"capital" boolean DEFAULT false,
	"warp" boolean DEFAULT false,
	"lexicanum_url" text,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"tone" text,
	"label_x" integer,
	"label_y" integer
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"total_planned" integer,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"payload" jsonb NOT NULL,
	"target_entity_id" text,
	"submitted_by" text,
	"submitter_email" text,
	"submitter_note" text,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_characters" ADD CONSTRAINT "book_characters_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_characters" ADD CONSTRAINT "book_characters_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_factions" ADD CONSTRAINT "book_factions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_factions" ADD CONSTRAINT "book_factions_faction_id_factions_id_fk" FOREIGN KEY ("faction_id") REFERENCES "public"."factions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_locations" ADD CONSTRAINT "book_locations_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_locations" ADD CONSTRAINT "book_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "books_start_y_idx" ON "books" USING btree ("start_y");--> statement-breakpoint
CREATE INDEX "books_series_idx" ON "books" USING btree ("series_id","series_index");--> statement-breakpoint
CREATE INDEX "locations_sector_idx" ON "locations" USING btree ("sector_id");