/**
 * Standalone unit test for `src/lib/resolver/index.ts` (Brief 063 Stage 1+2).
 *
 * Verifies the two-stage resolution (Direct-Match + Alias-Lookup) returns
 * canonical IDs from the empirical surface forms collected across the first
 * 50 W40K override files (ssot-w40k-001..005). No test framework —
 * `node:assert/strict` + a single console.log line per case (same pattern as
 * `scripts/test-discovery-merge.ts`). Exits 1 on failure so CI / pre-commit
 * can gate on it.
 *
 * Run: `tsx scripts/test-resolver.ts` or via `npm run test:resolver`.
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  resolveCharacter,
  resolveFaction,
  resolveLocation,
} from "../src/lib/resolver";

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

// =============================================================================
// resolveFaction
// =============================================================================
console.log("resolveFaction");

check("direct match — existing canonical (Inquisition)", () => {
  const r = resolveFaction("Inquisition");
  assert.equal(r.id, "inquisition");
  assert.equal(r.raw, "Inquisition");
});

check("direct match — existing canonical (Ultramarines)", () => {
  assert.equal(resolveFaction("Ultramarines").id, "ultramarines");
});

check("direct match — new seed (Tanith First-and-Only)", () => {
  assert.equal(resolveFaction("Tanith First-and-Only").id, "tanith_first");
});

check("direct match — new seed (Sons of Sek)", () => {
  assert.equal(resolveFaction("Sons of Sek").id, "sons_of_sek");
});

check("direct match — new seed (Mortifactors)", () => {
  assert.equal(resolveFaction("Mortifactors").id, "mortifactors");
});

check("alias — Imperial Guard routes to Astra Militarum", () => {
  const r = resolveFaction("Imperial Guard");
  assert.equal(r.id, "astra_militarum");
  assert.equal(r.raw, "Imperial Guard"); // raw preserved verbatim
});

check("alias — Ordo Xenos routes to Inquisition", () => {
  assert.equal(resolveFaction("Ordo Xenos").id, "inquisition");
});

check("alias — Ordo Malleus routes to Inquisition", () => {
  assert.equal(resolveFaction("Ordo Malleus").id, "inquisition");
});

check("alias — Eldar routes to canonical eldar (Aeldari)", () => {
  assert.equal(resolveFaction("Eldar").id, "eldar");
});

check("alias — Chaos routes to canonical (Chaos Undivided)", () => {
  assert.equal(resolveFaction("Chaos").id, "chaos");
});

check("alias — T'au Empire routes to tau", () => {
  assert.equal(resolveFaction("T'au Empire").id, "tau");
});

check("alias — Space Marines routes to adeptus_astartes", () => {
  assert.equal(resolveFaction("Space Marines").id, "adeptus_astartes");
});

check("case-sensitivity — lowercase 'chaos' is not a direct match", () => {
  // 'chaos' (lowercase) is NOT in canonical names (canonical is "Chaos Undivided")
  // and NOT in the alias table (alias key is "Chaos" capitalised). Should miss.
  assert.equal(resolveFaction("chaos").id, null);
});

check("unknown — frequency-1 long-tail (Black Legion) stays null", () => {
  // Brief deliberately keeps Black Legion in long-tail; not seeded yet.
  assert.equal(resolveFaction("Black Legion").id, null);
});

check("unknown — empty string returns null with raw=''", () => {
  const r = resolveFaction("");
  assert.equal(r.id, null);
  assert.equal(r.raw, "");
});

check("unknown — fabricated faction stays null", () => {
  assert.equal(resolveFaction("Cabal of Eight").id, null);
});

// =============================================================================
// resolveLocation
// =============================================================================
console.log("\nresolveLocation");

check("direct match — existing canonical (Terra)", () => {
  assert.equal(resolveLocation("Terra").id, "terra");
});

check("direct match — existing canonical (Eye of Terror)", () => {
  assert.equal(resolveLocation("Eye of Terror").id, "eye_of_terror");
});

check("direct match — existing canonical (Sabbat Worlds)", () => {
  assert.equal(resolveLocation("Sabbat Worlds").id, "sabbat");
});

check("direct match — new seed (Eustis Majoris)", () => {
  assert.equal(resolveLocation("Eustis Majoris").id, "eustis_majoris");
});

check("direct match — new seed (Tanith)", () => {
  assert.equal(resolveLocation("Tanith").id, "tanith");
});

check("direct match — new seed (Hagia)", () => {
  assert.equal(resolveLocation("Hagia").id, "hagia");
});

check("direct match — new seed (Salvation's Reach)", () => {
  // Apostrophe-in-name preserved verbatim — direct-match works because the
  // canonical seed uses the same surface form.
  assert.equal(resolveLocation("Salvation's Reach").id, "salvations_reach");
});

check("alias — Sabbat Worlds Crusade routes to sabbat", () => {
  assert.equal(resolveLocation("Sabbat Worlds Crusade").id, "sabbat");
});

check("alias — Istvaan V routes to istvaan_v", () => {
  assert.equal(resolveLocation("Istvaan V").id, "istvaan_v");
});

check("alias — Isstvan V (alt spelling) routes to istvaan_v", () => {
  assert.equal(resolveLocation("Isstvan V").id, "istvaan_v");
});

check("unknown — fabricated world stays null", () => {
  assert.equal(resolveLocation("Atoll Verloren").id, null);
});

check("unknown — empty string returns null", () => {
  const r = resolveLocation("");
  assert.equal(r.id, null);
  assert.equal(r.raw, "");
});

check("case-sensitivity — lowercase 'terra' is not a direct match", () => {
  assert.equal(resolveLocation("terra").id, null);
});

// =============================================================================
// resolveCharacter
// =============================================================================
console.log("\nresolveCharacter");

check("direct match — Ibram Gaunt (highest frequency)", () => {
  assert.equal(resolveCharacter("Ibram Gaunt").id, "ibram_gaunt");
});

check("direct match — Ciaphas Cain", () => {
  assert.equal(resolveCharacter("Ciaphas Cain").id, "ciaphas_cain");
});

check("direct match — Gregor Eisenhorn", () => {
  assert.equal(resolveCharacter("Gregor Eisenhorn").id, "gregor_eisenhorn");
});

check("direct match — Mabbon Etogaur (cross-faction note)", () => {
  assert.equal(resolveCharacter("Mabbon Etogaur").id, "mabbon_etogaur");
});

check("direct match — Saint Sabbat", () => {
  assert.equal(resolveCharacter("Saint Sabbat").id, "saint_sabbat");
});

check("direct match — Honsou", () => {
  assert.equal(resolveCharacter("Honsou").id, "honsou");
});

check("direct match — Lord General Lugo (rank-as-name)", () => {
  assert.equal(resolveCharacter("Lord General Lugo").id, "lord_general_lugo");
});

check("direct match — Nightbringer (C'tan, pragmatic chaos)", () => {
  assert.equal(resolveCharacter("Nightbringer").id, "nightbringer");
});

check("direct match — Alizebeth Bequin", () => {
  assert.equal(resolveCharacter("Alizebeth Bequin").id, "alizebeth_bequin");
});

check("direct match — raw preserved verbatim", () => {
  const r = resolveCharacter("Cherubael");
  assert.equal(r.id, "cherubael");
  assert.equal(r.raw, "Cherubael");
});

check("unknown — HH primarch (Magnus the Red) not yet seeded", () => {
  // HH-domain stays out of W40K resolver scope per Brief 063 § Out of scope.
  assert.equal(resolveCharacter("Magnus the Red").id, null);
});

check("unknown — frequency-1 long-tail character stays null", () => {
  assert.equal(resolveCharacter("Mandragore Carrion").id, null);
});

check("unknown — empty string returns null", () => {
  const r = resolveCharacter("");
  assert.equal(r.id, null);
  assert.equal(r.raw, "");
});

check("character-aliases is empty in this round — no alias-hits expected", () => {
  // The shape of the file is `{}` (Brief 063, character-aliases.json).
  // Any name that isn't a direct match must return null, not get aliased.
  assert.equal(resolveCharacter("Inquisitor Eisenhorn").id, null);
});

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
