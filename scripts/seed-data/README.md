# Seed data

Canonical reference data used by `scripts/seed.ts` to initialize a fresh database.

**Reference structure** (canon, hand-curated, source of truth for v1):
25 factions, 7 eras, 5 sectors, 28 locations, 14 series, plus the 5-question Ask-the-Archive questionnaire.

**Books** (`books.json`): currently an empty list `[]`.
The prototype shipped with ~65 placeholder books containing partly-incorrect dates, location assignments, and faction tags. Rather than leak that fuzziness into the live database, we cleared the list. Real books arrive in **Phase 4** via the Lexicanum / Goodreads / Black Library ingestion pipeline (see `ROADMAP.md`). Until then, `npm run db:seed` populates the reference structure but reports `Inserted 0 books.` — that's intentional.

The original prototype is intentionally **not** part of this repository — it lives in your local archive only.

## Files

| File | Contents | Schema target |
|---|---|---|
| `eras.json` | In-universe time periods | `eras` table |
| `factions.json` | Imperial / Chaos / Xenos factions | `factions` table |
| `series.json` | Book series (Horus Heresy, Eisenhorn, …) | `series` table |
| `books.json` | The current ~65-book catalog | `books` + junctions |
| `sectors.json` | Galactic segmentums | `sectors` table |
| `locations.json` | Named worlds and warp anomalies | `locations` table |
| `ask-questions.json` | Recommendation questionnaire | consumed by `src/lib/recommend/` |

## Editing

Two paths:

1. **Hand-edit JSON** for small fixes (fix a typo, correct a date). Re-run `npm run db:seed` against your dev database.
2. **Database-first edits** via Drizzle Studio (`npm run db:studio`). When happy, **export back to JSON** so the next `db:seed` reflects the change. (An `npm run db:dump` script will land in Phase 1.5.)

Once Phase 4 (the ingestion pipeline) is live, scrapers will write fresh JSON snapshots into `ingest/.cache/` and a merge step will produce updated versions of these files.
