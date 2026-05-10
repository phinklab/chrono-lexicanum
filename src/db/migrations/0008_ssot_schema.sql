ALTER TYPE "public"."book_format" ADD VALUE 'collection';--> statement-breakpoint
ALTER TYPE "public"."book_format" ADD VALUE 'artbook';--> statement-breakpoint
ALTER TYPE "public"."book_format" ADD VALUE 'scriptbook';--> statement-breakpoint
ALTER TYPE "public"."source_kind" ADD VALUE 'ssot';--> statement-breakpoint
CREATE TABLE "work_collections" (
	"collection_work_id" uuid NOT NULL,
	"content_work_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"confidence" numeric(3, 2),
	"basis" text,
	CONSTRAINT "work_collections_collection_work_id_content_work_id_pk" PRIMARY KEY("collection_work_id","content_work_id")
);
--> statement-breakpoint
ALTER TABLE "book_details" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "works" ADD COLUMN "external_book_id" varchar(16);--> statement-breakpoint
ALTER TABLE "work_collections" ADD CONSTRAINT "work_collections_collection_work_id_works_id_fk" FOREIGN KEY ("collection_work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_collections" ADD CONSTRAINT "work_collections_content_work_id_works_id_fk" FOREIGN KEY ("content_work_id") REFERENCES "public"."works"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "work_collections_content_idx" ON "work_collections" USING btree ("content_work_id");--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_external_book_id_unique" UNIQUE("external_book_id");