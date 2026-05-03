CREATE TYPE "public"."book_availability" AS ENUM('in_print', 'oop_recent', 'oop_legacy', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."book_format" AS ENUM('novel', 'novella', 'short_story', 'anthology', 'audio_drama', 'omnibus');--> statement-breakpoint
ALTER TABLE "book_details" ADD COLUMN "isbn10" varchar(10);--> statement-breakpoint
ALTER TABLE "book_details" ADD COLUMN "page_count" integer;--> statement-breakpoint
ALTER TABLE "book_details" ADD COLUMN "format" "book_format";--> statement-breakpoint
ALTER TABLE "book_details" ADD COLUMN "availability" "book_availability";--> statement-breakpoint
CREATE INDEX "book_details_primary_era_idx" ON "book_details" USING btree ("primary_era_id");