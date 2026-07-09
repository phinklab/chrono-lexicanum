/**
 * Standalone unit test for the Great Journeys data (src/lib/map/voyages) —
 * the "research filled the contract correctly" gate. No test framework:
 * node:assert/strict, same pattern as scripts/test-map-worlds.ts. Run via
 * `npm run test:voyages`.
 *
 * DB-free: validates the committed map-worlds.json, builds the client
 * payload, and resolves every voyage against it. Fails hard where the
 * runtime path only dev-warns (resolve.ts drops unknown stations and
 * leg-less waypoints softly — this test is why a bad stop can't ship
 * silently).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { validateMapWorlds, type MapWorldsFile } from "@/lib/map/map-worlds-schema";
import { GRID_H, GRID_W } from "@/lib/map/projection";
import { VOYAGES, isWaypoint, resolveVoyage, type VoyageChart } from "@/lib/map/voyages";

const raw: unknown = JSON.parse(
  readFileSync(path.join(process.cwd(), "scripts", "seed-data", "map-worlds.json"), "utf8"),
);
const schemaErrors = validateMapWorlds(raw);
assert.deepEqual(schemaErrors, [], "map-worlds.json validates");
const file = raw as MapWorldsFile;
// Minimal chart stand-in (resolveVoyage's structural subset) — deliberately
// NOT buildMapPayload, whose blurb layer is server-only.
const chart: VoyageChart = { featured: file.worlds, dust: [] };
const catalogIds = new Set(file.worlds.map((w) => w.id));
const worldById = new Map(file.worlds.map((w) => [w.id, w]));

let cases = 0;
const check = (cond: boolean, msg: string) => {
  cases += 1;
  assert.ok(cond, msg);
};

check(VOYAGES.length >= 2, "at least two journeys exist");
check(new Set(VOYAGES.map((v) => v.id)).size === VOYAGES.length, "voyage ids are unique");

for (const v of VOYAGES) {
  check(v.name.trim().length > 0, `${v.id}: name`);
  check(v.tag.trim().length > 0, `${v.id}: tag`);
  check(v.blurb.trim().length > 0, `${v.id}: blurb`);
  check(
    v.lbl.x >= 0 && v.lbl.x <= GRID_W && v.lbl.y >= 0 && v.lbl.y <= GRID_H,
    `${v.id}: label on the grid`,
  );

  const worlds = v.stations.filter((s) => !isWaypoint(s));
  check(worlds.length >= 2, `${v.id}: >= 2 world stations`);
  check(!isWaypoint(v.stations[0]), `${v.id}: first stop is a station`);
  check(!isWaypoint(v.stations[v.stations.length - 1]), `${v.id}: last stop is a station`);

  v.stations.forEach((st, si) => {
    check(st.text.trim().length > 0, `${v.id}[${si}]: act text non-empty`);
    if (isWaypoint(st)) {
      check(st.name.trim().length > 0, `${v.id}[${si}]: waypoint name`);
      check(st.via > 0 && st.via < 1, `${v.id}/${st.name}: via in (0,1)`);
      // The enclosing leg must have real length: the neighbouring stations
      // (skipping fellow waypoints) must sit on different coordinates.
      const prev = v.stations.slice(0, si).reverse().find((s) => !isWaypoint(s));
      const next = v.stations.slice(si + 1).find((s) => !isWaypoint(s));
      check(prev !== undefined && next !== undefined, `${v.id}/${st.name}: between stations`);
      if (prev && !isWaypoint(prev) && next && !isWaypoint(next)) {
        const a = worldById.get(prev.world);
        const b = worldById.get(next.world);
        check(
          !!a && !!b && Math.hypot(a.gx - b.gx, a.gy - b.gy) >= 0.5,
          `${v.id}/${st.name}: enclosing leg has length (${prev.world} → ${next.world})`,
        );
      }
    } else {
      check(catalogIds.has(st.world), `${v.id}: station "${st.world}" exists in map-worlds.json`);
      if (st.leg?.d !== undefined) {
        check(/^M[\s\d.-]/.test(st.leg.d), `${v.id}/${st.world}: leg.d parses as a path`);
      }
    }
  });

  const resolved = resolveVoyage(v, chart);
  check(
    resolved.stations.length === v.stations.length,
    `${v.id}: every stop resolves (no silent drops)`,
  );
  check(resolved.legs.length === worlds.length - 1, `${v.id}: one leg per station transition`);
  for (const d of resolved.legs) {
    check(/^M -?[\d.]+ -?[\d.]+ (Q|L|C)/.test(d), `${v.id}: generated leg is a path (${d.slice(0, 24)}…)`);
  }
  for (const st of resolved.stations) {
    check(
      st.gx >= 0 && st.gx <= GRID_W && st.gy >= 0 && st.gy <= GRID_H,
      `${v.id}/${st.name}: resolved position on the grid`,
    );
    if (st.kind === "way") {
      check(st.legIndex >= 0 && st.legIndex < resolved.legs.length, `${v.id}/${st.name}: rides a real leg`);
    }
  }
}

console.log(`test-voyages: ${cases} checks passed (${VOYAGES.length} journeys)`);
