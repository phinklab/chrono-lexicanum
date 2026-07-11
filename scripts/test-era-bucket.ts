/**
 * Unit tests for the era-bucketing helper (Launch S1a, S0-Entscheidung 3) —
 * `scripts/era-bucket.ts`, the ONE pure derivation both `apply:book` and the
 * projection harnesses use for `book_details.primary_era_id`.
 *
 * Covers (plan § Session 1a "Fertig wenn"): every bucket boundary of the
 * committed `eras.json` (inclusive start AND end), the out-of-range → null
 * path, the NULL case (no book-dates row), the seed-drift guards (duplicate
 * slug / unbucketable startY throw), and the committed-data invariant that
 * every book-dates row buckets into a known era. DB-free: reads only the two
 * committed seed JSONs. Runs inside `npm test` (auto-discovered) or directly
 * via `npx tsx scripts/test-era-bucket.ts` — deliberately no own npm script
 * (S1a's package.json exception is exactly the one `snapshot:regen` entry).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildEraContext,
  deriveEraId,
  loadEraContext,
  primaryEraIdFor,
  type BookDateRow,
  type EraBucketRow,
} from "./era-bucket";

let pass = 0;
let fail = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
    pass += 1;
  } catch (e) {
    console.error(`not ok - ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
    fail += 1;
  }
}

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");
const eras = JSON.parse(
  readFileSync(resolve(SEED_DIR, "eras.json"), "utf8"),
) as EraBucketRow[];
const bookDates = JSON.parse(
  readFileSync(resolve(SEED_DIR, "book-dates.json"), "utf8"),
) as BookDateRow[];

console.log("era-bucket");

// --- deriveEraId: every boundary of the committed eras.json -----------------

check("every era's inclusive start AND end bucket into that era", () => {
  for (const era of eras) {
    assert.equal(deriveEraId(era.start, eras), era.id, `start of ${era.id}`);
    assert.equal(deriveEraId(era.end, eras), era.id, `end of ${era.id}`);
  }
});

check("adjacent eras split exactly at their boundary (end / end+1)", () => {
  const sorted = [...eras].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    assert.equal(next.start, cur.end + 1, `${cur.id} → ${next.id} contiguous`);
    assert.equal(deriveEraId(cur.end, eras), cur.id);
    assert.equal(deriveEraId(cur.end + 1, eras), next.id);
  }
});

check("the canonical M-scale anchors bucket as curated", () => {
  assert.equal(deriveEraId(30730, eras), "great_crusade"); // The Last Church
  assert.equal(deriveEraId(31001, eras), "horus_heresy"); // Horus Rising
  assert.equal(deriveEraId(41000, eras), "time_ending"); // regular M41 — stays!
  assert.equal(deriveEraId(41999, eras), "time_ending");
  assert.equal(deriveEraId(42000, eras), "indomitus");
});

check("out-of-range startY derives null (below 0 impossible; above the last era)", () => {
  const maxEnd = Math.max(...eras.map((e) => e.end));
  assert.equal(deriveEraId(maxEnd + 1, eras), null);
  assert.equal(deriveEraId(-1, eras), null);
});

// --- buildEraContext: drift guards ------------------------------------------

check("buildEraContext throws on an unbucketable startY (seed drift, no guess)", () => {
  const maxEnd = Math.max(...eras.map((e) => e.end));
  assert.throws(
    () => buildEraContext([{ slug: "x", startY: maxEnd + 1 }], eras),
    /matches no era range/,
  );
});

check("buildEraContext throws on a duplicate book-dates slug", () => {
  assert.throws(
    () =>
      buildEraContext(
        [
          { slug: "x", startY: 41000 },
          { slug: "x", startY: 42000 },
        ],
        eras,
      ),
    /duplicate book-dates slug/,
  );
});

// --- the NULL case + the committed-data invariant ----------------------------

check("a slug without a book-dates row derives primary_era_id = null", () => {
  const ctx = buildEraContext(bookDates, eras);
  assert.equal(primaryEraIdFor(ctx, "definitely-not-a-dated-slug"), null);
});

check("loadEraContext buckets EVERY committed book-dates row into a known era", () => {
  const ctx = loadEraContext();
  assert.equal(ctx.eraIdBySlug.size, bookDates.length);
  const knownEraIds = new Set(eras.map((e) => e.id));
  for (const [slug, eraId] of ctx.eraIdBySlug) {
    assert.ok(knownEraIds.has(eraId), `${slug} → ${eraId} must be a known era`);
  }
});

check("real M41 books keep time_ending; the anchor books bucket as expected", () => {
  const ctx = loadEraContext();
  assert.equal(primaryEraIdFor(ctx, "horus-rising"), "horus_heresy");
  assert.equal(primaryEraIdFor(ctx, "the-last-church"), "great_crusade");
  const timeEnding = [...ctx.eraIdBySlug.values()].filter(
    (id) => id === "time_ending",
  ).length;
  assert.ok(timeEnding > 0, "regular M41 books must legitimately keep time_ending");
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail > 0 ? 1 : 0;
