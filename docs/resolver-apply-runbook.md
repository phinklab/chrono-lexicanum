# Resolver Apply Runbook

Maintainer-only production apply for the Brief-063 resolver sweep. Codex must
not run these DB-mutating commands against prod.

## Preflight

Run the dry simulation first:

```bash
npm run test:apply-override-dry
```

Expected dry-run counts for `ssot-w40k-001..005`:

| Junction | Expected | Acceptable range |
|---|---:|---:|
| `work_factions` | 318 | 200..324 |
| `work_locations` | 129 | 80..148 |
| `work_characters` | 363 | 250..375 |

Known smoke-count caveat: `/buch/nightbringer` has only 1 resolved Location
because the override lists only Pavonis. This replaces the earlier loose
expectation that every smoke URL has at least 3 chips on every axis.

## Apply Order

Run in this order:

```bash
npm run db:migrate
npm run db:seed-resolver-extensions
npm run db:apply-override -- --batch=ssot-w40k-001
npm run db:apply-override -- --batch=ssot-w40k-002
npm run db:apply-override -- --batch=ssot-w40k-003
npm run db:apply-override -- --batch=ssot-w40k-004
npm run db:apply-override -- --batch=ssot-w40k-005
```

`db:migrate` must land migration `0009` before `db:apply-override`; the apply
script writes `raw_name` into the three junction tables.

## SQL Counts

Capture before and after:

```sql
select count(*) as work_factions from work_factions;
select count(*) as work_locations from work_locations;
select count(*) as work_characters from work_characters;
select count(*) as factions from factions;
select count(*) as locations from locations;
select count(*) as characters from characters;
```

After the sweep, the first three counts should be close to the dry-run expected
counts above, plus any rows from books outside these 50 if prod already has
later data.

## Smoke URLs

After apply, check these detail pages locally or on the preview connected to the
same DB:

- `/buch/xenos` -> Factions 3, Locations 3, Characters 6
- `/buch/first-and-only` -> Factions 5, Locations 6, Characters 10
- `/buch/necropolis` -> Factions 7, Locations 4, Characters 9
- `/buch/nightbringer` -> Factions 7, Locations 1, Characters 5
- `/buch/the-anarch` -> Factions 9, Locations 3, Characters 11

## If Something Is Already Off

- If `npm run test:resolver-data` fails, fix JSON/alias/parent/sector targets
  before any DB mutation.
- If `db:migrate` reports migration `0009` already applied, continue with the
  seed step; do not hand-edit migration history.
- If `db:seed-resolver-extensions` fails on FK or enum alignment, stop. Fix the
  checked-in JSON or schema mismatch, then rerun the seed script; it is
  idempotent and only inserts missing rows.
- If an apply batch fails mid-sweep after earlier batches succeeded, fix the
  cause and rerun the failed batch, then continue in order. The apply script is
  delete-then-insert per work and safe to rerun for `001..005`.
- Do not use `db:reset-for-ssot` or manual deletes to repair this sweep.
