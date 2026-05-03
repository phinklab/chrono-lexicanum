ALTER TABLE "book_details" ADD COLUMN "rating" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "book_details" ADD COLUMN "rating_source" varchar(32);--> statement-breakpoint
ALTER TABLE "book_details" ADD COLUMN "rating_count" integer;