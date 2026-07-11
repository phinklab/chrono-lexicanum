/**
 * era-bucket.ts — Launch S1a (Era-Fix, S0-Entscheidung 3). The ONE pure helper
 * that derives `book_details.primary_era_id` mechanically from the curated
 * setting dates.
 *
 * Contract (docs/launch-master-plan.md § Session 1a Punkt 3):
 *   - Source is `scripts/seed-data/book-dates.json` × `scripts/seed-data/eras.json`.
 *   - `startY` picks the bucket: the era whose inclusive `[start, end]` range
 *     contains it. Era ranges are maintainer-curated integers and contiguous;
 *     a startY that matches NO era is seed-data drift and `buildEraContext`
 *     throws (halt-before-mutation, same posture as the apply validators).
 *   - A book with no book-dates row gets `primary_era_id = NULL` — dating is
 *     never guessed. Real M41 books keep `time_ending` legitimately (regular
 *     era 41000–41999); only the old blanket placeholder is gone.
 *   - Applies identically to `apply:book --slug` and `--all`;
 *     `apply:curation-overlay` stays the last db:sync tail and wins on
 *     `primaryEraId` for the books it hand-fixes.
 *
 * PURE + DB-free: no `@/db` import, only committed seed JSON. Both the apply
 * path (`book-apply-shared.computeBookRows`) and the DB-free tests import THIS
 * module, so apply and tests can never disagree on the bucketing.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
const BOOK_DATES_PATH = resolve(SEED_DIR, "book-dates.json");
const ERAS_PATH = resolve(SEED_DIR, "eras.json");

/** The two fields the bucketing needs from an `eras.json` row. */
export interface EraBucketRow {
  id: string;
  /** Inclusive M-scale bounds (M*1000 + year), e.g. time_ending 41000–41999. */
  start: number;
  end: number;
}

/** The two fields the bucketing needs from a `book-dates.json` row. */
export interface BookDateRow {
  slug: string;
  startY: number;
}

/**
 * The era whose inclusive `[start, end]` range contains `startY`, or null when
 * none does (out-of-range or a fractional value in the integer gap between two
 * eras — both are curation problems, surfaced by `buildEraContext`).
 */
export function deriveEraId(
  startY: number,
  eras: readonly EraBucketRow[],
): string | null {
  for (const era of eras) {
    if (era.start <= startY && startY <= era.end) return era.id;
  }
  return null;
}

/** slug → derived era id for every dated book. Slugs without a row map to nothing. */
export interface EraContext {
  eraIdBySlug: ReadonlyMap<string, string>;
}

/**
 * Build the lookup, validating the seed data while it is cheap to do so:
 * duplicate book-dates slugs and unbucketable startY values throw instead of
 * silently producing a wrong or missing era anchor.
 */
export function buildEraContext(
  bookDates: readonly BookDateRow[],
  eras: readonly EraBucketRow[],
): EraContext {
  const eraIdBySlug = new Map<string, string>();
  const problems: string[] = [];
  for (const row of bookDates) {
    if (eraIdBySlug.has(row.slug)) {
      problems.push(`duplicate book-dates slug '${row.slug}'`);
      continue;
    }
    const eraId = deriveEraId(row.startY, eras);
    if (eraId === null) {
      problems.push(
        `'${row.slug}': startY ${row.startY} matches no era range in eras.json`,
      );
      continue;
    }
    eraIdBySlug.set(row.slug, eraId);
  }
  if (problems.length > 0) {
    throw new Error(
      `[era-bucket] ${problems.length} book-dates × eras problem(s). Halt before mutation.\n` +
        problems.map((p) => `  - ${p}`).join("\n"),
    );
  }
  return { eraIdBySlug };
}

/** Load + build the context from the committed seed files (sync, DB-free). */
export function loadEraContext(): EraContext {
  const bookDates = JSON.parse(
    readFileSync(BOOK_DATES_PATH, "utf8"),
  ) as BookDateRow[];
  const eras = JSON.parse(readFileSync(ERAS_PATH, "utf8")) as EraBucketRow[];
  return buildEraContext(bookDates, eras);
}

/** The era anchor `computeBookRows` writes: derived where dated, else NULL. */
export function primaryEraIdFor(ctx: EraContext, slug: string): string | null {
  return ctx.eraIdBySlug.get(slug) ?? null;
}
