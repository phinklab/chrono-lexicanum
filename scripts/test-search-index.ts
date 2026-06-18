/**
 * Unit tests for the pure universal-search suggestion contract.
 *
 * DB-free: feeds representative compendium entities + aliases into the same
 * helpers the server loaders use, then checks ranking, dedupe and focus routes.
 *
 *   npm run test:search-index
 */
import assert from "node:assert/strict";
import {
  buildEntitySuggestions,
  characterFocusHref,
  factionFocusHref,
  rankSuggestions,
  worldFocusHref,
} from "../src/app/archive/filters";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failed += 1;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`x ${name}\n  ${msg}`);
  }
}

const index = buildEntitySuggestions([
  {
    kind: "faction",
    label: "Crimson Slaughter",
    value: "crimson_slaughter",
    hint: "Chaos · 2 appearances",
    aliases: ["Crimson Sabres"],
  },
  {
    kind: "world",
    label: "Candleworld",
    value: "candleworld",
    hint: "Sabbat Worlds · 2 appearances",
    aliases: ["Redemption", "Vytarn"],
  },
  {
    kind: "character",
    label: "Agusto Zidarov",
    value: "agusto_zidarov",
    hint: "Adeptus Arbites · 3 appearances",
    aliases: ["Probator Agusto Zidarov"],
  },
]);

test("alias query shows the alias surface and canonical target", () => {
  const hits = rankSuggestions(index, "Crimson Sabres");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, "faction");
  assert.equal(hits[0].value, "crimson_slaughter");
  assert.equal(hits[0].label, "Crimson Sabres → Crimson Slaughter");
});

test("canonical and alias matches dedupe to one canonical entity", () => {
  const hits = rankSuggestions(index, "Crimson").filter(
    (hit) => hit.kind === "faction" && hit.value === "crimson_slaughter",
  );
  assert.equal(hits.length, 1);
  assert.equal(hits[0].label, "Crimson Slaughter");
});

test("location aliases route to the canonical world", () => {
  for (const query of ["Redemption", "Vytarn"]) {
    const hits = rankSuggestions(index, query);
    assert.equal(hits.length, 1);
    assert.equal(hits[0].kind, "world");
    assert.equal(hits[0].value, "candleworld");
    assert.match(hits[0].label, /Candleworld$/);
  }
});

test("character aliases rank as character suggestions", () => {
  const hits = rankSuggestions(index, "Probator Agusto Zidarov");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, "character");
  assert.equal(hits[0].value, "agusto_zidarov");
  assert.equal(hits[0].label, "Probator Agusto Zidarov → Agusto Zidarov");
});

test("focus helpers preserve the compendium routing contract", () => {
  assert.equal(
    factionFocusHref("crimson_slaughter"),
    "/compendium/fraktionen?focus=crimson_slaughter",
  );
  assert.equal(
    worldFocusHref("candleworld"),
    "/compendium/welten?focus=candleworld",
  );
  assert.equal(
    characterFocusHref("agusto_zidarov"),
    "/compendium/charaktere?focus=agusto_zidarov",
  );
});

console.log(`\nsearch-index: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
