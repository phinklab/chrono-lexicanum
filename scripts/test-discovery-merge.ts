/**
 * Standalone unit test for `discovery/merge.ts` (Brief 055 Fix 1).
 *
 * Runs `genericityScore` + `pickBetterSeriesHint` + `mergeDiscoveredBooks`
 * through deterministic cases proving the seriesHint folding is now
 * order-independent. No test framework — `node:assert/strict` + a single
 * console.log line per case. Exits 1 on failure so CI can gate on it.
 *
 * Run: `tsx scripts/test-discovery-merge.ts` or via `npm run test:discovery-merge`.
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  genericityScore,
  mergeDiscoveredBooks,
  pickBetterSeriesHint,
} from "../src/lib/ingestion/discovery/merge";
import type { DiscoveredBook } from "../src/lib/ingestion/v2/types";

let pass = 0;
let fail = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    pass += 1;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e instanceof Error ? e.message : String(e)}`);
    fail += 1;
  }
}

console.log("genericityScore");
check("master-list anchors score above 'Eisenhorn'", () => {
  assert.ok(
    genericityScore("List of Warhammer 40,000 novels") >
      genericityScore("Eisenhorn"),
  );
  assert.ok(
    genericityScore("List of Black Library publications") >
      genericityScore("Horus Heresy"),
  );
});
check("undefined and empty-string score 1000", () => {
  assert.equal(genericityScore(undefined), 1_000);
  assert.equal(genericityScore(""), 1_000);
  assert.equal(genericityScore("   "), 1_000);
});
check("specific series names score 0", () => {
  assert.equal(genericityScore("Eisenhorn"), 0);
  assert.equal(genericityScore("Horus Heresy"), 0);
  assert.equal(genericityScore("Ciaphas Cain"), 0);
});
check("score is case-insensitive", () => {
  assert.equal(
    genericityScore("LIST OF WARHAMMER 40,000 NOVELS"),
    genericityScore("list of warhammer 40,000 novels"),
  );
});

console.log("\npickBetterSeriesHint");
check("(a) 'Eisenhorn' wins over 'List of Warhammer 40,000 novels'", () => {
  assert.equal(
    pickBetterSeriesHint("Eisenhorn", "List of Warhammer 40,000 novels"),
    "Eisenhorn",
  );
  // Order-independent.
  assert.equal(
    pickBetterSeriesHint("List of Warhammer 40,000 novels", "Eisenhorn"),
    "Eisenhorn",
  );
});
check("(b) 'Horus Heresy' wins over 'List of Black Library publications'", () => {
  assert.equal(
    pickBetterSeriesHint("Horus Heresy", "List of Black Library publications"),
    "Horus Heresy",
  );
  assert.equal(
    pickBetterSeriesHint("List of Black Library publications", "Horus Heresy"),
    "Horus Heresy",
  );
});
check("(c) two generic hints → lex-smaller wins (deterministic)", () => {
  // Both score 100 (master-list anchors). Lex compare: "List of Black ..." < "List of Warhammer ...".
  const expected = "List of Black Library publications";
  assert.equal(
    pickBetterSeriesHint(
      "List of Warhammer 40,000 novels",
      "List of Black Library publications",
    ),
    expected,
  );
  assert.equal(
    pickBetterSeriesHint(
      "List of Black Library publications",
      "List of Warhammer 40,000 novels",
    ),
    expected,
  );
});
check("undefined arg falls back to the defined arg", () => {
  assert.equal(pickBetterSeriesHint(undefined, "Eisenhorn"), "Eisenhorn");
  assert.equal(pickBetterSeriesHint("Eisenhorn", undefined), "Eisenhorn");
  assert.equal(pickBetterSeriesHint(undefined, undefined), undefined);
});

console.log("\nmergeDiscoveredBooks (folding-order independence)");
function book(slug: string, seriesHint?: string, source: "wikipedia" | "tlbranson" = "wikipedia"): DiscoveredBook {
  return {
    slug,
    title: slug,
    seriesHint,
    sourcePages: [`https://example.com/${source}/${slug}`],
    discoverySources: [source],
  };
}
check("Eisenhorn-Xenos: master-list-first then sub-page → keeps 'Eisenhorn'", () => {
  const wiki = [
    book("eisenhorn-xenos", "List of Warhammer 40,000 novels"),
    book("eisenhorn-xenos", "Eisenhorn"),
  ];
  const merged = mergeDiscoveredBooks(wiki, []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].seriesHint, "Eisenhorn");
});
check("Eisenhorn-Xenos: sub-page-first then master-list → still 'Eisenhorn'", () => {
  const wiki = [
    book("eisenhorn-xenos", "Eisenhorn"),
    book("eisenhorn-xenos", "List of Warhammer 40,000 novels"),
  ];
  const merged = mergeDiscoveredBooks(wiki, []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].seriesHint, "Eisenhorn");
});
check("Cross-stream fold (wiki master + tlbranson series) is order-independent", () => {
  const merged1 = mergeDiscoveredBooks(
    [book("false-gods", "List of Warhammer 40,000 novels", "wikipedia")],
    [book("false-gods", "Horus Heresy", "tlbranson")],
  );
  const merged2 = mergeDiscoveredBooks(
    [book("false-gods", "Horus Heresy", "wikipedia")],
    [book("false-gods", "List of Warhammer 40,000 novels", "tlbranson")],
  );
  assert.equal(merged1[0].seriesHint, "Horus Heresy");
  assert.equal(merged2[0].seriesHint, "Horus Heresy");
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
