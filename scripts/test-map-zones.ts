/**
 * test-map-zones.ts — the three-chart-editions contract (W3b-B1, Session 246).
 *
 * Guards the strict `states` validation in parseZones, the single
 * zone-visibility predicate (visibleZones) and the era token in the map hash
 * parser. DB-free; auto-discovered by `npm test` (scripts/run-tests.ts).
 */
import assert from "node:assert/strict";

import { parseMapHashString } from "../src/lib/map/hash";
import {
  CURATED_ZONES,
  MAP_STATES,
  parseZones,
  visibleZones,
  type ZoneDef,
} from "../src/lib/map/zones";

/* --- committed zones.json ------------------------------------------------ */

assert.ok(CURATED_ZONES.length >= 15, `zones.json parses (${CURATED_ZONES.length} zones)`);
for (const z of CURATED_ZONES) {
  assert.ok(z.states.length >= 1, `${z.id} has at least one state`);
  for (const s of z.states) {
    assert.ok((MAP_STATES as readonly string[]).includes(s), `${z.id} state ${s} valid`);
  }
}

const byName = (name: string) => CURATED_ZONES.find((z) => z.name === name);
// The Maelstrom predates Mankind (Purgatus since the Great Crusade) — like
// Ultramar it stands on every chart edition.
for (const name of ["Ultramar", "The Maelstrom"]) {
  const zone = byName(name);
  assert.ok(zone, `${name} exists`);
  assert.deepEqual(zone?.states, ["pre", "hh", "now"], `${name} spans all three editions`);
}
// The Eye predates the Crusade (Fall of the Aeldari). On the pre/Heresy
// charts it wears its era-correct label "Ocularis Malifica" (the Imperius
// Dominatus map, ca. 005.M31); on the present chart it carries no zone of
// its own — the Cicatrix Maledictum shape swallows its area (the rift
// erupts from the Eye). Curation decisions from Session 246.
const eyes = CURATED_ZONES.filter((z) => z.name === "Ocularis Malifica");
assert.ok(eyes.length >= 1, "Ocularis Malifica exists");
const eyeStates = new Set(eyes.flatMap((z) => z.states));
for (const s of ["pre", "hh"] as const) {
  assert.ok(eyeStates.has(s), `Ocularis Malifica covers ${s}`);
}
// On the Heresy chart the Eye is an interdiction zone (hatch + ✠ quarantine
// vocabulary); the Great Crusade chart keeps the storm reading (Session 247).
assert.ok(
  eyes.some((z) => z.states.includes("hh") && z.kind === "interdiction"),
  "the Heresy-chart Eye speaks interdiction",
);
assert.deepEqual(byName("Cicatrix Maledictum")?.states, ["now"], "the rift is a present-chart zone");
assert.deepEqual(byName("Horus' Dark Empire")?.states, ["hh"], "the Dark Empire is a Heresy-chart zone");
assert.deepEqual(byName("The Ruinstorm")?.states, ["hh"], "the Ruinstorm burns on the Heresy chart only");
assert.deepEqual(byName("Imperium Secundus")?.states, ["hh"], "Imperium Secundus exists on the Heresy chart only");

/* --- parseZones strictness ----------------------------------------------- */

const validZone = {
  id: "zone-t",
  name: "Test",
  kind: "storm",
  smooth: true,
  published: true,
  states: ["hh"],
  points: [
    [0, 0],
    [10, 0],
    [10, 10],
  ],
};
const wrap = (zone: unknown) => ({ zones: [zone] });

assert.ok(parseZones(wrap(validZone)) !== null, "valid zone parses");
assert.equal(parseZones(wrap({ ...validZone, states: undefined })), null, "missing states rejected");
assert.equal(parseZones(wrap({ ...validZone, states: [] })), null, "empty states rejected");
assert.equal(parseZones(wrap({ ...validZone, states: ["m41"] })), null, "unknown state rejected");
assert.equal(parseZones(wrap({ ...validZone, states: ["hh", "hh"] })), null, "duplicate state rejected");
assert.equal(parseZones(wrap({ ...validZone, states: "hh" })), null, "non-array states rejected");

/* --- visibleZones: the one visibility predicate --------------------------- */

const fixture = (parseZones({
  zones: [
    { ...validZone, id: "a", states: ["now"] },
    { ...validZone, id: "b", states: ["pre", "hh", "now"] },
    { ...validZone, id: "c", states: ["hh"], published: false },
  ],
}) ?? []) as ZoneDef[];
assert.equal(fixture.length, 3, "fixture parses");
assert.deepEqual(visibleZones("now", fixture).map((z) => z.id), ["a", "b"], "now shows now-tagged");
assert.deepEqual(visibleZones("pre", fixture).map((z) => z.id), ["b"], "pre shows all-era only");
assert.deepEqual(visibleZones("hh", fixture).map((z) => z.id), ["b"], "unpublished never renders");

/* --- hash: era token ------------------------------------------------------ */

assert.deepEqual(
  parseMapHashString("#world=terra&era=hh&cam=500,400,2"),
  { world: "terra", era: "hh", voyage: null, cam: { gx: 500, gy: 400, kr: 2 } },
  "full hash parses",
);
assert.equal(parseMapHashString("#era=pre").era, "pre", "era pre parses");
assert.equal(parseMapHashString("#era=now").era, "now", "era now parses (explicit)");
assert.equal(parseMapHashString("#era=m41").era, null, "unknown era token ignored");
assert.equal(parseMapHashString("#world=terra").era, null, "absent era stays null");
assert.equal(parseMapHashString("").world, null, "empty hash is empty state");
assert.equal(parseMapHashString("#cam=1,2,0").cam, null, "non-positive kr rejected");
assert.equal(parseMapHashString("#cam=1,2").cam, null, "two-part cam rejected");
// voyage rides OPAQUE — the roster lives in the app, CartographerRoot
// validates on restore; the parser must not drag voyage data in here.
assert.equal(
  parseMapHashString("#voyage=great-crusade").voyage,
  "great-crusade",
  "voyage token parses",
);
assert.equal(
  parseMapHashString("#voyage=no-such-journey").voyage,
  "no-such-journey",
  "voyage rides opaque (validated by the app, not the parser)",
);
assert.equal(parseMapHashString("#world=terra").voyage, null, "absent voyage stays null");
assert.deepEqual(
  parseMapHashString("#world=terra&era=pre&voyage=great-crusade&cam=500,400,2"),
  {
    world: "terra",
    era: "pre",
    voyage: "great-crusade",
    cam: { gx: 500, gy: 400, kr: 2 },
  },
  "voyage coexists with world, era and cam",
);

console.log("test-map-zones: all assertions passed");
