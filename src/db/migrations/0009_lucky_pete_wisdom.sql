ALTER TABLE "locations" ALTER COLUMN "gx" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "gy" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "work_characters" ADD COLUMN "raw_name" text;--> statement-breakpoint
ALTER TABLE "work_factions" ADD COLUMN "raw_name" text;--> statement-breakpoint
ALTER TABLE "work_locations" ADD COLUMN "raw_name" text;