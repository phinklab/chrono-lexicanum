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

## Pre-Apply Parent-Hygiene-Check

Before every `db:apply-override` sweep, audit `scripts/seed-data/factions.json`
against `scripts/seed-data/faction-policy.json`:

1. Diff `factions.json` against the last-applied-batch commit to identify new
   faction rows since the previous sweep:

   ```bash
   git diff <last-applied-batch-sha>..HEAD -- scripts/seed-data/factions.json
   ```

2. For each new or touched row, check the `parent` field:
   - `parent` set, and resolves to a Browse-Root (or descendant of one) in
     `faction-policy.json` → pass.
   - `parent: null` and `id` is in `browseRoots` or `knownTopLevelExceptions` →
     pass.
   - Anything else → fix the row in `factions.json` and commit.

3. After fixing, push the corrections into the DB before applying overrides:

   ```bash
   npm run db:seed-resolver-extensions
   ```

   `seedFactions` upserts on the JSON-sourced columns (`name`, `parent_id`,
   `alignment`, `tone`, `glyph`) — re-running it propagates rename/reparent
   edits to existing rows. Other entities (sectors, locations, characters)
   remain insert-only.

4. Run `npm run brain:lint -- --no-write` once for a fast cross-check;
   the `Faction policy` category flags dangling parents (error) and orphan
   parent-null rows (warning).

5. Proceed with the apply sweep below.

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
  idempotent. Factions are upserted on the JSON-sourced columns; sectors,
  locations, and characters are insert-only.
- If an apply batch fails mid-sweep after earlier batches succeeded, fix the
  cause and rerun the failed batch, then continue in order. The apply script is
  delete-then-insert per work and safe to rerun for `001..005`.
- Do not use `db:reset-for-ssot` or manual deletes to repair this sweep.
