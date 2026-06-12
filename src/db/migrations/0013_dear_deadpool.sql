CREATE INDEX "event_works_work_idx" ON "event_works" USING btree ("work_id");--> statement-breakpoint
CREATE INDEX "works_setting_anchor_event_idx" ON "works" USING btree ("setting_anchor_event_id");