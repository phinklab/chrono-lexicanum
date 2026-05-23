/**
 * Standalone unit test for scripts/loop-next-batch.ts.
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-synopsis-lint.ts. Run via `npm run test:loop-next`.
 *
 * Drives the PURE `decideNextBatch` with synthetic inputs only — it never reads
 * or mutates the real book-roster.json / manual-overrides-ssot-*.json (the
 * helper's `main()` is behind a run-as-script guard, so importing it does no
 * I/O). Covers domain-handoff, restbatches (5-book W40K tail, 4-book HH tail),
 * loopComplete, the non-multiple cumulative case, and empty-state robustness.
 *
 * Brief 094 removed the resolver-pause cadence layer — this suite no longer
 * exercises it (the SSOT-loop runs straight through to loopComplete; the
 * resolver is its own headless loop now, with its own detector tests in
 * scripts/test-resolver-loop-detect.ts).
 */
import assert from "node:assert/strict";
import process from "node:process";

import { decideNextBatch, type RosterBook } from "./loop-next-batch";

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

// --- synthetic builders -----------------------------------------------------

function rb(id: string): RosterBook {
  return {
    externalBookId: id,
    slug: id.toLowerCase(),
    title: `Title ${id}`,
    authors: ["Test Author"],
    editors: [],
    editorialNote: null,
    releaseYear: 2020,
    format: "novel",
    seriesHint: "Test Series",
    sourceUrl: "https://example.test",
    notes: null,
    sourceRow: 1,
  };
}

function range(prefix: "W40K" | "HH", from: number, to: number): RosterBook[] {
  const out: RosterBook[] = [];
  for (let i = from; i <= to; i += 1) {
    out.push(rb(`${prefix}-${String(i).padStart(4, "0")}`));
  }
  return out;
}

// Full synthetic roster matching the real domain sizes (565 W40K, 294 HH).
const W40K = range("W40K", 1, 565);
const HH = range("HH", 1, 294);

console.log("decideNextBatch");

// (a) mid-corpus batch selection ---------------------------------------------
check("mid-corpus (max 25, 250 books) → next ssot-w40k-026, slice W40K-0251..0260", () => {
  const d = decideNextBatch({
    w40k: { max: 25, books: 250 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
  });
  assert.equal(d.cumulativeBefore, 250);
  assert.equal(d.loopComplete, false);
  assert.equal(d.batch?.id, "ssot-w40k-026");
  assert.equal(d.batch?.domain, "w40k");
  assert.equal(d.batch?.number, 26);
  assert.equal(d.rosterSlice.length, 10);
  assert.equal(d.rosterSlice[0].externalBookId, "W40K-0251");
  assert.equal(d.rosterSlice[9].externalBookId, "W40K-0260");
});

// (b) non-multiple cumulative → slice anchored on max*10, not cumulative ------
check("non-multiple (257 books over 25 batches) → batch 026, slice still starts at W40K-0251", () => {
  const d = decideNextBatch({
    w40k: { max: 25, books: 257 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
  });
  assert.equal(d.cumulativeBefore, 257);
  assert.equal(d.batch?.id, "ssot-w40k-026");
  assert.equal(d.rosterSlice[0].externalBookId, "W40K-0251");
});

// (c) domain handoff ---------------------------------------------------------
check("domain handoff: W40K done (max 57 / 565) → first HH batch ssot-hh-001", () => {
  const d = decideNextBatch({
    w40k: { max: 57, books: 565 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
  });
  assert.equal(d.loopComplete, false);
  assert.equal(d.batch?.domain, "hh");
  assert.equal(d.batch?.id, "ssot-hh-001");
  assert.equal(d.rosterSlice[0].externalBookId, "HH-0001");
  assert.equal(d.rosterSlice[9].externalBookId, "HH-0010");
});

check("handoff boundary: W40K max 56 (560) is NOT done → still W40K (ssot-w40k-057)", () => {
  const d = decideNextBatch({
    w40k: { max: 56, books: 560 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
  });
  assert.equal(d.batch?.domain, "w40k");
  assert.equal(d.batch?.id, "ssot-w40k-057");
});

// (d) restbatches ------------------------------------------------------------
check("W40K restbatch: max 56 → 5-book slice W40K-0561..0565", () => {
  const d = decideNextBatch({
    w40k: { max: 56, books: 560 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
  });
  assert.equal(d.batch?.id, "ssot-w40k-057");
  assert.equal(d.rosterSlice.length, 5);
  assert.equal(d.rosterSlice[0].externalBookId, "W40K-0561");
  assert.equal(d.rosterSlice[4].externalBookId, "W40K-0565");
});

check("HH restbatch: W40K done, HH max 29 (290) → 4-book slice HH-0291..0294 (ssot-hh-030)", () => {
  const d = decideNextBatch({
    w40k: { max: 57, books: 565 },
    hh: { max: 29, books: 290 },
    w40kBooks: W40K,
    hhBooks: HH,
  });
  assert.equal(d.batch?.id, "ssot-hh-030");
  assert.equal(d.rosterSlice.length, 4);
  assert.equal(d.rosterSlice[0].externalBookId, "HH-0291");
  assert.equal(d.rosterSlice[3].externalBookId, "HH-0294");
});

// (e) loopComplete -----------------------------------------------------------
check("loopComplete: both domains done → loopComplete true, batch null, slice empty", () => {
  const d = decideNextBatch({
    w40k: { max: 57, books: 565 },
    hh: { max: 30, books: 294 },
    w40kBooks: W40K,
    hhBooks: HH,
  });
  assert.equal(d.loopComplete, true);
  assert.equal(d.batch, null);
  assert.equal(d.rosterSlice.length, 0);
});

// (f) robustness -------------------------------------------------------------
check("non-10 counts: 198 books over 20 batches → cumulative 198, next ssot-w40k-021 from W40K-0201", () => {
  const d = decideNextBatch({
    w40k: { max: 20, books: 198 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
  });
  assert.equal(d.cumulativeBefore, 198);
  assert.equal(d.batch?.id, "ssot-w40k-021");
  assert.equal(d.rosterSlice[0].externalBookId, "W40K-0201");
});

check("empty roster / zero state → loopComplete, no throw", () => {
  const d = decideNextBatch({
    w40k: { max: 0, books: 0 },
    hh: { max: 0, books: 0 },
    w40kBooks: [],
    hhBooks: [],
  });
  assert.equal(d.loopComplete, true);
  assert.equal(d.batch, null);
  assert.equal(d.rosterSlice.length, 0);
});

console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
