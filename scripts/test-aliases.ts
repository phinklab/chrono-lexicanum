/**
 * Unit tests for the shared alias module (`src/lib/aliases`).
 *
 * DB-free, deterministic — runs against the committed `*-aliases.json` +
 * `{factions,locations,characters}.json` SSOT. Mirrors the repo's standalone
 * `tsx scripts/test-*.ts` convention (node:assert + a pass/fail counter,
 * non-zero exit on failure) so it slots into the same `npm run test:*` flow.
 *
 *   npm run test:aliases
 */
import assert from "node:assert/strict";
import {
  classifyDrift,
  resolveSurfaceForm,
  tallyAxisDrift,
  type AliasResolution,
} from "../src/lib/aliases";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ ${name}\n  ${msg}`);
  }
}

function has(list: AliasResolution[], axis: string, id: string): boolean {
  return list.some((r) => r.axis === axis && r.canonicalId === id);
}

// --- search resolution: surface-form (alias key), case-insensitive ---------

test("search: 'Imperial Guard' (alias key) -> astra_militarum", () => {
  assert.ok(has(resolveSurfaceForm("Imperial Guard"), "faction", "astra_militarum"));
});

test("search: 'imperial guard' (lower-case) -> astra_militarum", () => {
  assert.ok(has(resolveSurfaceForm("imperial guard"), "faction", "astra_militarum"));
});

test("search: '  IMPERIAL GUARD  ' (trim + upper-case) -> astra_militarum", () => {
  assert.ok(has(resolveSurfaceForm("  IMPERIAL GUARD  "), "faction", "astra_militarum"));
});

// --- search resolution: canonical name, case-insensitive -------------------

test("search: 'astra militarum' (canonical name) -> astra_militarum", () => {
  assert.ok(has(resolveSurfaceForm("astra militarum"), "faction", "astra_militarum"));
});

// --- search resolution: the other top-3 edition renames --------------------

test("search: 'eldar' -> eldar", () => {
  assert.ok(has(resolveSurfaceForm("eldar"), "faction", "eldar"));
});

test("search: 'Dark Eldar' / 'dark eldar' -> eldar", () => {
  assert.ok(has(resolveSurfaceForm("Dark Eldar"), "faction", "eldar"));
  assert.ok(has(resolveSurfaceForm("dark eldar"), "faction", "eldar"));
});

// --- search resolution: empty / unknown / axis filter ----------------------

test("search: empty / whitespace / unknown -> []", () => {
  assert.deepEqual(resolveSurfaceForm(""), []);
  assert.deepEqual(resolveSurfaceForm("   "), []);
  assert.deepEqual(resolveSurfaceForm("not-a-real-surface-form-xyz"), []);
});

test("search: axis filter restricts results", () => {
  assert.ok(
    has(resolveSurfaceForm("Imperial Guard", ["faction"]), "faction", "astra_militarum"),
  );
  assert.deepEqual(resolveSurfaceForm("Imperial Guard", ["location"]), []);
});

// --- drift classification: entity-exact ------------------------------------

test("drift: 'Imperial Guard' -> astra_militarum is known-alias", () => {
  assert.equal(
    classifyDrift("faction", "Imperial Guard", "astra_militarum", "Astra Militarum"),
    "known-alias",
  );
});

test("drift: 'Eldar' / 'Dark Eldar' -> eldar are known-alias", () => {
  assert.equal(classifyDrift("faction", "Eldar", "eldar", "Aeldari"), "known-alias");
  assert.equal(classifyDrift("faction", "Dark Eldar", "eldar", "Aeldari"), "known-alias");
});

test("drift: alias pointing at a DIFFERENT entity stays suspicious drift", () => {
  // 'Imperial Guard' is a registered alias of astra_militarum, NOT imperium —
  // so on an imperium-resolved junction it is a real mis-resolve.
  assert.equal(
    classifyDrift("faction", "Imperial Guard", "imperium", "Imperium of Man"),
    "drift",
  );
});

test("drift: an unregistered surface form is suspicious drift", () => {
  assert.equal(
    classifyDrift("faction", "Some Made-Up Chapter", "ultramarines", "Ultramarines"),
    "drift",
  );
});

test("drift: null / empty / equal-name rawName is none", () => {
  assert.equal(classifyDrift("faction", null, "x", "X"), "none");
  assert.equal(classifyDrift("faction", "", "x", "X"), "none");
  assert.equal(
    classifyDrift("faction", "Ultramarines", "ultramarines", "Ultramarines"),
    "none",
  );
});

test("drift: drift path is case-sensitive ('imperial guard' != alias key)", () => {
  // The stored rawName IS the key that resolved; lower-case is not registered.
  assert.equal(
    classifyDrift("faction", "imperial guard", "astra_militarum", "Astra Militarum"),
    "drift",
  );
});

// --- tally: splits suspect vs known-alias ----------------------------------

test("tally: mixed rows split into suspect vs known-alias vs none", () => {
  const t = tallyAxisDrift("faction", [
    { rawName: "Imperial Guard", canonicalId: "astra_militarum", canonicalName: "Astra Militarum" }, // known
    { rawName: "Eldar", canonicalId: "eldar", canonicalName: "Aeldari" }, // known
    { rawName: "Weird Form", canonicalId: "ultramarines", canonicalName: "Ultramarines" }, // suspect
    { rawName: "Ultramarines", canonicalId: "ultramarines", canonicalName: "Ultramarines" }, // none
    { rawName: null, canonicalId: "x", canonicalName: "X" }, // none
  ]);
  assert.equal(t.knownAliasCount, 2);
  assert.equal(t.suspectCount, 1);
  assert.deepEqual(t.suspectRawNames, ["Weird Form"]);
  assert.deepEqual(
    t.knownAliases.map((k) => k.rawName),
    ["Imperial Guard", "Eldar"],
  );
});

console.log(`\naliases: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
