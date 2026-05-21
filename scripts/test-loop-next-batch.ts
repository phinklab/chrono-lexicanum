/**
 * Standalone unit test for scripts/loop-next-batch.ts.
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-synopsis-lint.ts. Run via `npm run test:loop-next`.
 *
 * Drives the PURE `decideNextBatch` with synthetic inputs only — it never reads
 * or mutates the real book-roster.json / manual-overrides-ssot-*.json /
 * ssot-loop-log.md (the helper's `main()` is behind a run-as-script guard, so
 * importing it does no I/O). Proves the brief's acceptance:
 *   - a blocked 50er-multiple (200 + 200-block in log) → resolverPause:false
 *   - a synthetic un-blocked 50er-multiple → resolverPause:true
 * plus normal / domain-handoff / restbatch / loopComplete / anti-bleed cases.
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

// Real-byte pause-block headings (the regex in the helper is \u-escaped, so a
// match here validates the escapes against genuine UTF-8 ·/⏸/ü bytes).
const LOG_150 = "## 2026-05-15 · ⏸ Resolver-Pause bei 150 Büchern\n";
const LOG_200 = "## 2026-05-16 · ⏸ Resolver-Pause bei 200 Büchern\n";
const LOG_2000 = "## 2026-05-16 · ⏸ Resolver-Pause bei 2000 Büchern\n";

console.log("decideNextBatch");

// (a) blocked 50er-multiple → resolverPause false ----------------------------
check("blocked 50er-multiple (200 + 200-block) → resolverPause false, next ssot-w40k-021", () => {
  const d = decideNextBatch({
    w40k: { max: 20, books: 200 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: LOG_150 + LOG_200,
  });
  assert.equal(d.cumulativeBefore, 200);
  assert.equal(d.resolverPause, false);
  assert.equal(d.loopComplete, false);
  assert.equal(d.batch?.id, "ssot-w40k-021");
  assert.equal(d.batch?.domain, "w40k");
  assert.equal(d.batch?.number, 21);
  assert.equal(d.rosterSlice.length, 10);
  assert.equal(d.rosterSlice[0].externalBookId, "W40K-0201");
  assert.equal(d.rosterSlice[9].externalBookId, "W40K-0210");
});

// (b) un-blocked 50er-multiple → resolverPause true --------------------------
check("un-blocked 50er-multiple (200, no 200-block) → resolverPause true, batch still populated", () => {
  const d = decideNextBatch({
    w40k: { max: 20, books: 200 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: LOG_150,
  });
  assert.equal(d.resolverPause, true);
  assert.equal(d.batch?.id, "ssot-w40k-021");
  assert.equal(d.rosterSlice.length, 10);
});

check("un-blocked 50er-multiple: empty log → resolverPause true", () => {
  const d = decideNextBatch({
    w40k: { max: 20, books: 200 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: "",
  });
  assert.equal(d.resolverPause, true);
});

check("250 boundary not satisfied by a 200-block → resolverPause true, next ssot-w40k-026", () => {
  const d = decideNextBatch({
    w40k: { max: 25, books: 250 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: LOG_200,
  });
  assert.equal(d.cumulativeBefore, 250);
  assert.equal(d.resolverPause, true);
  assert.equal(d.batch?.id, "ssot-w40k-026");
  assert.equal(d.rosterSlice[0].externalBookId, "W40K-0251");
});

check("anti-bleed: 200 boundary not satisfied by a 2000-block → resolverPause true", () => {
  const d = decideNextBatch({
    w40k: { max: 20, books: 200 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: LOG_2000,
  });
  assert.equal(d.resolverPause, true);
});

// (c) non-multiple → false; slice start from max*10, not cumulative ----------
check("non-multiple (207) → resolverPause false; slice still starts at max*10", () => {
  const d = decideNextBatch({
    w40k: { max: 20, books: 207 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: "",
  });
  assert.equal(d.cumulativeBefore, 207);
  assert.equal(d.resolverPause, false);
  assert.equal(d.batch?.id, "ssot-w40k-021");
  assert.equal(d.rosterSlice[0].externalBookId, "W40K-0201");
});

// (d) domain handoff ---------------------------------------------------------
check("domain handoff: W40K done (max 57 / 565) → first HH batch ssot-hh-001", () => {
  const d = decideNextBatch({
    w40k: { max: 57, books: 565 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: "",
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
    logText: "",
  });
  assert.equal(d.batch?.domain, "w40k");
  assert.equal(d.batch?.id, "ssot-w40k-057");
});

// (e) restbatches ------------------------------------------------------------
check("W40K restbatch: max 56 → 5-book slice W40K-0561..0565", () => {
  const d = decideNextBatch({
    w40k: { max: 56, books: 560 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: "",
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
    logText: "",
  });
  assert.equal(d.batch?.id, "ssot-hh-030");
  assert.equal(d.rosterSlice.length, 4);
  assert.equal(d.rosterSlice[0].externalBookId, "HH-0291");
  assert.equal(d.rosterSlice[3].externalBookId, "HH-0294");
});

// (f) loopComplete -----------------------------------------------------------
check("loopComplete: both domains done → loopComplete true, batch null, slice empty", () => {
  const d = decideNextBatch({
    w40k: { max: 57, books: 565 },
    hh: { max: 30, books: 294 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: "",
  });
  assert.equal(d.loopComplete, true);
  assert.equal(d.batch, null);
  assert.equal(d.rosterSlice.length, 0);
  assert.equal(d.resolverPause, false);
});

// robustness -----------------------------------------------------------------
check("non-10 counts: 198 books over 20 batches → cumulative 198 (no pause), slice from max*10", () => {
  const d = decideNextBatch({
    w40k: { max: 20, books: 198 },
    hh: { max: 0, books: 0 },
    w40kBooks: W40K,
    hhBooks: HH,
    logText: "",
  });
  assert.equal(d.cumulativeBefore, 198);
  assert.equal(d.resolverPause, false);
  assert.equal(d.batch?.id, "ssot-w40k-021");
  assert.equal(d.rosterSlice[0].externalBookId, "W40K-0201");
});

check("empty roster / zero state → loopComplete, no throw, no false pause at cumulative 0", () => {
  const d = decideNextBatch({
    w40k: { max: 0, books: 0 },
    hh: { max: 0, books: 0 },
    w40kBooks: [],
    hhBooks: [],
    logText: "",
  });
  assert.equal(d.loopComplete, true);
  assert.equal(d.batch, null);
  assert.equal(d.rosterSlice.length, 0);
  assert.equal(d.resolverPause, false);
});

console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
