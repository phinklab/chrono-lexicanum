CREATE TYPE "public"."event_tier" AS ENUM('epoch', 'major', 'minor');--> statement-breakpoint
CREATE TABLE "event_works" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" varchar(64) NOT NULL,
	"work_id" uuid,
	"series_id" varchar(64),
	"role" text NOT NULL,
	"display_label" text,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "event_works_event_work_unique" UNIQUE("event_id","work_id"),
	CONSTRAINT "event_works_event_series_unique" UNIQUE("event_id","series_id"),
	CONSTRAINT "event_works_exactly_one_target" CHECK ((work_id IS NULL) <> (series_id IS NULL))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date_label" text NOT NULL,
	"start_y" numeric(10, 3),
	"end_y" numeric(10, 3),
	"offscale" boolean DEFAULT false NOT NULL,
	"era_id" varchar(64) NOT NULL,
	"sort_index" integer NOT NULL,
	"tier" "event_tier" NOT NULL,
	"approx" boolean DEFAULT false NOT NULL,
	"confidence" varchar(1),
	"source_kind" text,
	"blurb" text NOT NULL,
	"curator_note" text,
	"artwork_ref" text,
	"art_credit_name" text,
	"art_credit_url" text
);
--> statement-breakpoint
ALTER TABLE "eras" ADD COLUMN "short" text;--> statement-breakpoint
ALTER TABLE "eras" ADD COLUMN "m_label" text;--> statement-breakpoint
ALTER TABLE "eras" ADD COLUMN "sub" text;--> statement-breakpoint
ALTER TABLE "eras" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "eras" ADD COLUMN "intro" text;--> statement-breakpoint
ALTER TABLE "eras" ADD COLUMN "cover_ref" text;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "setting_date_label" text;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "setting_method" text;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "setting_confidence" varchar(1);--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "setting_anchor_event_id" varchar(64);--> statement-breakpoint
ALTER TABLE "event_works" ADD CONSTRAINT "event_works_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_works" ADD CONSTRAINT "event_works_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_works" ADD CONSTRAINT "event_works_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_era_id_eras_id_fk" FOREIGN KEY ("era_id") REFERENCES "public"."eras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_era_idx" ON "events" USING btree ("era_id");--> statement-breakpoint
CREATE INDEX "events_start_y_idx" ON "events" USING btree ("start_y");--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_setting_anchor_event_id_events_id_fk" FOREIGN KEY ("setting_anchor_event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;