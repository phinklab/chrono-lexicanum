-- Smoke test for the Vercel-deploy migration runner (session 014).
-- No-op: confirms scripts/migrate.ts runs against the deploy DB and that a
-- migration is recorded in __drizzle_migrations. Kept as a permanent record
-- of the wiring; do not "fix" by removing.
SELECT 1;
