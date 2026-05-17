/**
 * Standalone unit test for scripts/apply-override-synopsis-lint.ts.
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-resolver.ts. Run via `npm run test:synopsis-lint`.
 *
 * Covers the three brief-required cases plus a handful of edge cases:
 *   (i)   clean synopsis passes (0 hits),
 *   (ii)  polluted synopsis trips multiple labels (markdown + ssot-id +
 *         brief-ref + authority-layer + surface-form),
 *   (iii) edge — lone `*` / `_` without a pair-bracket passes (no false-
 *         positive on typographic asterisks / identifiers).
 */
import assert from "node:assert/strict";
import { join } from "node:path";
import process from "node:process";

import {
  formatLintError,
  lintSynopsis,
  loadBannedPatterns,
} from "./apply-override-synopsis-lint";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");
const PATTERNS = loadBannedPatterns(SEED_DIR);

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

console.log("lintSynopsis");

check("clean public synopsis passes with 0 hits", () => {
  const r = lintSynopsis(
    "W40K-0001",
    "xenos",
    "Inquisitor Eisenhorn hunts a renegade rogue trader on the ice-world of Hubris.",
    PATTERNS,
  );
  assert.equal(r.hits.length, 0);
});

check("markdown-bold pair trips markdown-bold label", () => {
  const r = lintSynopsis(
    "W40K-0200",
    "legacy",
    "**Legacy** opens with Calpurnia in Hydraphur.",
    PATTERNS,
  );
  assert.ok(r.hits.some((h) => h.patternLabel === "markdown-bold"));
});

check("markdown-italic pair (asterisk) trips markdown-italic label", () => {
  const r = lintSynopsis(
    "W40K-0199",
    "crossfire",
    "Direct sequel to *Crossfire* on Hydraphur.",
    PATTERNS,
  );
  assert.ok(
    r.hits.some((h) => h.patternLabel === "markdown-italic"),
    "expected markdown-italic hit on *Crossfire*",
  );
});

check("polluted synopsis with multi-class hits enumerates every offender", () => {
  const polluted =
    "**A** direct sequel per Brief-061 and (W40K-0199). " +
    "First authority-layer Hoyyon Phrax surface form, " +
    "data_conflict resolver pass.";
  const r = lintSynopsis("W40K-0200", "legacy", polluted, PATTERNS);
  const labels = new Set(r.hits.map((h) => h.patternLabel));
  assert.ok(labels.has("markdown-bold"), `expected markdown-bold, got ${[...labels].join(",")}`);
  assert.ok(labels.has("brief-ref"), `expected brief-ref, got ${[...labels].join(",")}`);
  assert.ok(labels.has("ssot-id-w40k"), `expected ssot-id-w40k, got ${[...labels].join(",")}`);
  assert.ok(labels.has("authority-layer"), `expected authority-layer, got ${[...labels].join(",")}`);
  assert.ok(labels.has("curation-surface-form"), `expected curation-surface-form, got ${[...labels].join(",")}`);
  assert.ok(labels.has("audit-marker"), `expected audit-marker (data_conflict), got ${[...labels].join(",")}`);
  assert.ok(labels.has("curation-resolver"), `expected curation-resolver, got ${[...labels].join(",")}`);
});

check("lone asterisk inside arithmetic-style text passes", () => {
  const r = lintSynopsis(
    "W40K-0001",
    "xenos",
    "Crew of 5*70 conscripts and a single requisition officer remain.",
    PATTERNS,
  );
  assert.equal(r.hits.length, 0, JSON.stringify(r.hits));
});

check("lone underscore inside identifier-style text passes", () => {
  const r = lintSynopsis(
    "W40K-0001",
    "xenos",
    "Code-name HYDRA_ALPHA was retired before the operation.",
    PATTERNS,
  );
  assert.equal(r.hits.length, 0, JSON.stringify(r.hits));
});

check("authority-layer matches case-insensitively", () => {
  const r = lintSynopsis(
    "W40K-0001",
    "x",
    "First Authority Layer Hoyyon Phrax surface form.",
    PATTERNS,
  );
  assert.ok(r.hits.some((h) => h.patternLabel === "authority-layer"));
});

check("Brief reference with space and dash both match", () => {
  const a = lintSynopsis("X", "x", "see Brief 061 for context.", PATTERNS);
  const b = lintSynopsis("X", "x", "see Brief-076 for context.", PATTERNS);
  assert.ok(a.hits.some((h) => h.patternLabel === "brief-ref"));
  assert.ok(b.hits.some((h) => h.patternLabel === "brief-ref"));
});

check("hit snippet contains the matched text", () => {
  const r = lintSynopsis(
    "W40K-0200",
    "legacy",
    "...some long context here, then **Legacy** lands in the middle, more context after.",
    PATTERNS,
  );
  const hit = r.hits.find((h) => h.patternLabel === "markdown-bold");
  assert.ok(hit);
  assert.ok(hit.snippet.includes("**"), `snippet="${hit.snippet}"`);
});

check("formatLintError prints externalBookId, slug, batch, and per-hit lines", () => {
  const r = lintSynopsis("W40K-0200", "legacy", "**Legacy** opens.", PATTERNS);
  const msg = formatLintError(r, "ssot-w40k-020");
  assert.ok(msg.includes("W40K-0200"));
  assert.ok(msg.includes("legacy"));
  assert.ok(msg.includes("ssot-w40k-020"));
  assert.ok(msg.includes("markdown-bold"));
});

check("zero-width-match safety: empty-string-prone regex does not infinite-loop", () => {
  // Sanity: lintSynopsis must not hang on patterns. The implementation
  // increments lastIndex when a regex matches a zero-length string.
  const r = lintSynopsis("X", "x", "harmless prose without any banned tokens.", PATTERNS);
  assert.equal(r.hits.length, 0);
});

console.log("");
console.log(`# pass ${pass}`);
console.log(`# fail ${fail}`);
if (fail > 0) process.exit(1);
