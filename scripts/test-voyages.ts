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
import { CURATED_ZONES } from "@/lib/map/zones";
import {
  VOYAGES,
  isChartPoint,
  isWaypoint,
  resolveVoyage,
  type VoyageArm,
  type VoyageChart,
  type VoyageChartPoint,
  type VoyageStation,
  type VoyageStop,
} from "@/lib/map/voyages";

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
const stopCoordinates = (stop: VoyageStop) => {
  if (isWaypoint(stop)) return null;
  if (isChartPoint(stop)) return { gx: stop.gx, gy: stop.gy };
  return worldById.get(stop.world) ?? null;
};

let cases = 0;
const check = (cond: boolean, msg: string) => {
  cases += 1;
  assert.ok(cond, msg);
};
const checkPlacement = (placement: { note: string; source: string }, label: string) => {
  check(placement.note.trim().length >= 48, `${label}: placement rationale is substantive`);
  check(/^https:\/\//.test(placement.source), `${label}: placement source URL`);
};

check(VOYAGES.length >= 2, "at least two journeys exist");
check(new Set(VOYAGES.map((v) => v.id)).size === VOYAGES.length, "voyage ids are unique");
check(
  !VOYAGES.some((v) => v.stations.some(isWaypoint)),
  "authored journeys use sourced chart points instead of leg-riding waypoints",
);

const greatCrusade = VOYAGES.find((v) => v.id === "great-crusade");
check(greatCrusade !== undefined, "Great Crusade journey exists");
const rediscoveryHeadings = [
  "Cthonia · Horus",
  "Fenris · Leman Russ",
  "Expunged Primarch Found",
  "Medusa · Ferrus Manus",
  "Chemos · Fulgrim",
  "Nocturne · Vulkan",
  "Inwit · Rogal Dorn",
  "Macragge · Roboute Guilliman",
  "Prospero · Magnus the Red",
  "Baal · Sanguinius",
  "Caliban · Lion El'Jonson",
  "Olympia · Perturabo",
  "Barbarus · Mortarion",
  "Colchis · Lorgar",
  "Chogoris · Jaghatai Khan",
  "Nostramo · Konrad Curze",
  "Nuceria · Angron",
  "Deliverance · Corvus Corax",
  "Expunged Primarch Found",
  "Uncharted Space · Alpharius",
];
const authoredRediscoveries =
  greatCrusade?.stations
    .map((stop) => stop.heading)
    .filter((heading): heading is string => !!heading && rediscoveryHeadings.includes(heading)) ?? [];
check(
  authoredRediscoveries.join("|") === rediscoveryHeadings.join("|"),
  "Great Crusade keeps the official twenty-place Primarch rediscovery roll",
);
const greatPoint = (name: string): VoyageChartPoint | undefined =>
  greatCrusade?.stations.find(
    (stop): stop is VoyageChartPoint => isChartPoint(stop) && stop.name === name,
  );
const primarchII = greatPoint("Primarch II");
const primarchXI = greatPoint("Primarch XI");
check(primarchII !== undefined && primarchXI !== undefined, "both expunged Primarch points exist");
if (greatCrusade && primarchII && primarchXI) {
  for (const point of [primarchII, primarchXI]) {
    const index = greatCrusade.stations.indexOf(point);
    const next = greatCrusade.stations[index + 1];
    check(point.breakBefore !== true, `${point.name}: incoming chronology remains connected`);
    check(!!next && !isWaypoint(next) && next.breakBefore !== true, `${point.name}: outgoing chronology remains connected`);
    check(point.leg?.color === "#77746d", `${point.name}: incoming leg is archival grey`);
    check(point.heading === "Expunged Primarch Found", `${point.name}: uses the neutral expunged heading`);
    check(/purged from the Imperial archive/.test(point.text), `${point.name}: copy centres the purged record`);
    check(
      !!next && !isWaypoint(next) && next.leg?.color === "#77746d",
      `${point.name}: outgoing leg is archival grey`,
    );
  }
}
const warmasterWeb = greatCrusade?.stations.at(-1);
const webArms: VoyageArm[] = warmasterWeb && !isWaypoint(warmasterWeb) ? (warmasterWeb.arms ?? []) : [];
check(warmasterWeb?.heading === "The Warmaster's Web", "Warmaster's Web is the final Great Crusade act");
check(webArms.length === 18, "Warmaster's Web carries one arm for every active Legion");
check(new Set(webArms.map((arm) => arm.legion)).size === 18, "Warmaster's Web Legion arms are unique");
check(
  webArms.every((arm) => /^#[0-9a-f]{6}$/i.test(arm.color)),
  "Warmaster's Web uses valid Legion colours",
);
check(
  webArms.every((arm) => arm.role.trim().length > 0 && arm.text.trim().length > 0),
  "every Warmaster arm carries a role and individual account",
);
const istvaanArms = webArms.filter(
  (arm) => "world" in arm.target && (arm.target.world === "istvaan-iii" || arm.target.world === "istvaan-v"),
);
check(istvaanArms.length === 10, "all ten Isstvan-bound Legions share the strategic bundle");
check(
  istvaanArms.every((arm) => Math.abs(arm.bow ?? Infinity) <= 36),
  "Isstvan paths stay inside one tight visual bundle",
);
const wordBearersArm = webArms.find((arm) => arm.legion === "XVII");
check(
  wordBearersArm?.via?.some(
    (via) => "world" in via.target && via.target.world === "istvaan-v",
  ) === true,
  "Word Bearers pass through Isstvan V before Calth",
);
const greatResolved = greatCrusade ? resolveVoyage(greatCrusade, chart) : undefined;
const webStep = (greatResolved?.stations.length ?? 0) - 1;
check(greatResolved?.stations.at(-1)?.armCount === 18, "all eighteen Warmaster arms resolve");
check(greatResolved?.strategicArms.length === 18, "all eighteen Warmaster arms remain individually interactive");
check(greatResolved?.strategicTargets.length === 8, "Warmaster arms resolve to eight shared endpoints");
check(
  greatResolved?.strategicTargets
    .find((target) => target.id === "world:istvaan-v")
    ?.legionIds.includes("XVII") === true,
  "Isstvan V endpoint includes the Word Bearers waypoint",
);
check(
  greatResolved?.legRevealAt.filter((step) => step === webStep).length === 19,
  "all nineteen Warmaster arm segments reveal together on the final act",
);

const abaddon = VOYAGES.find((v) => v.id === "abaddon");
check(abaddon !== undefined, "Abaddon journey exists");
const blackCrusadeStarts =
  abaddon?.stations.filter(
    (s) =>
      !isWaypoint(s) &&
      !isChartPoint(s) &&
      s.world === "eye-of-terror" &&
      s.breakBefore === true,
  ) ?? [];
check(blackCrusadeStarts.length === 13, "all thirteen Black Crusades restart at the Eye");
const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII"];
const crusadeSections = abaddon?.sections?.filter((section) => section.id.startsWith("black-crusade-")) ?? [];
check(crusadeSections.length === 13, "Abaddon has thirteen colour-coded Crusade sections");
check(
  crusadeSections.every((section, index) => section.label === `BLACK CRUSADE ${roman[index]} / XIII`),
  "Black Crusade sections carry ordered Roman I–XIII labels",
);
check(
  crusadeSections.every((section, index) => section.start === abaddon?.stations.indexOf(blackCrusadeStarts[index])),
  "each Black Crusade section starts at its Eye-of-Terror origin",
);
const crusadeColors = crusadeSections.map((section) => section.color);
check(crusadeColors.every((color) => /^#[0-9a-f]{6}$/i.test(color)), "Black Crusade colours are valid hex values");
check(new Set(crusadeColors).size === 13, "Black Crusade colours are unique");
const rgb = (hex: string) => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
check(
  crusadeColors.every((color, index) =>
    crusadeColors.slice(index + 1).every((other) => {
      const a = rgb(color);
      const b = rgb(other);
      return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 20;
    }),
  ),
  "Black Crusade colours remain visibly distinct",
);

const indomitus = VOYAGES.find((v) => v.id === "indomitus");
check(indomitus !== undefined, "Indomitus journey exists");
const indomitusFleetSections = indomitus?.sections?.filter((section) => section.id.startsWith("fleet-")) ?? [];
check(indomitusFleetSections.length === 5, "Indomitus exposes its three fleet axes and two battle-group branches");
check(
  new Set(indomitusFleetSections.map((section) => section.color)).size === 3,
  "Indomitus uses one distinct colour per numbered fleet",
);
const indomitusResolved = indomitus ? resolveVoyage(indomitus, chart) : undefined;
check(indomitusResolved?.legs.length === 16, "Indomitus campaign network resolves sixteen movement legs");
const pariahConvergence = indomitusResolved?.stations.filter((station) => station.id === "pariah-nexus") ?? [];
check(pariahConvergence.length === 2, "Indomitus plots both fleet arrivals at the Pariah Nexus");
check(
  new Set(pariahConvergence.map((station) => station.section?.color)).size === 2,
  "Primus and Tertius retain their fleet colours at the Pariah convergence",
);

const ghaz = VOYAGES.find((v) => v.id === "ghazghkull");
check(ghaz !== undefined, "Ghazghkull journey exists");
const ghazPoint = (name: string): VoyageChartPoint | undefined =>
  ghaz?.stations.find((stop): stop is VoyageChartPoint => isChartPoint(stop) && stop.name === name);
const haunted = ghazPoint("Haunted Gulf");
const urgok = ghazPoint("Urgok's Realm");
const fang = ghazPoint("Fang's World");
const kongajaro = ghazPoint("Kongajaro");
const kraken = ghazPoint("Black Kraken Nebula");
check(!!haunted && !!urgok && !!fang && !!kongajaro && !!kraken, "Ghazghkull synthetic cluster exists");
if (ghaz && haunted && urgok && fang && kongajaro && kraken) {
  const hauntedIndex = ghaz.stations.indexOf(haunted);
  const urgokIndex = ghaz.stations.indexOf(urgok);
  check(urgokIndex === hauntedIndex + 1, "Urgok follows the Haunted Gulf in chronology");
  check(urgok.breakBefore === true, "Kill Wrecka's uncontrolled Warp jump breaks the Haunted Gulf–Urgok route");
  const tau = CURATED_ZONES.find((zone) => zone.name === "Tau Empire");
  check(tau !== undefined, "charted T'au zone exists");
  const pointInPolygon = (x: number, y: number, points: [number, number][]) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const pointSegmentDistance = (x: number, y: number, a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t));
  };
  if (tau) {
    const edgeDistance = Math.min(
      ...tau.points.map((point, index) => pointSegmentDistance(urgok.gx, urgok.gy, point, tau.points[(index + 1) % tau.points.length])),
    );
    check(edgeDistance <= 18, "Urgok is plotted on the T'au-zone border");
    check(pointInPolygon(fang.gx, fang.gy, tau.points), "Fang's World overlaps the T'au zone");
  }
  check(Math.hypot(kongajaro.gx - urgok.gx, kongajaro.gy - urgok.gy) <= 35, "Kongajaro remains a nearby system");
  const octarius = worldById.get("octarius");
  check(octarius !== undefined, "Octarius catalog anchor exists");
  if (octarius) {
    const dx = octarius.gx - urgok.gx;
    const dy = octarius.gy - urgok.gy;
    const t = ((kraken.gx - urgok.gx) * dx + (kraken.gy - urgok.gy) * dy) / (dx * dx + dy * dy);
    const corridorDistance = Math.abs((kraken.gx - urgok.gx) * dy - (kraken.gy - urgok.gy) * dx) / Math.hypot(dx, dy);
    check(t > 0.2 && t < 0.85 && corridorDistance < 40, "Black Kraken is a schematic corridor before Octarius");
    const octariusStop = ghaz.stations.find((stop) => !isWaypoint(stop) && !isChartPoint(stop) && stop.world === "octarius");
    check(octariusStop !== undefined, "Ghazghkull route terminates the recruitment run at catalog Octarius");
  }
}

for (const v of VOYAGES) {
  check(v.name.trim().length > 0, `${v.id}: name`);
  check(v.tag.trim().length > 0, `${v.id}: tag`);
  check(v.blurb.trim().length > 0, `${v.id}: blurb`);
  check(
    v.lbl.x >= 0 && v.lbl.x <= GRID_W && v.lbl.y >= 0 && v.lbl.y <= GRID_H,
    `${v.id}: label on the grid`,
  );

  const anchors = v.stations.filter(
    (s): s is VoyageStation | VoyageChartPoint => !isWaypoint(s),
  );
  check(anchors.length >= 2, `${v.id}: >= 2 route anchors`);
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
        const a = stopCoordinates(prev);
        const b = stopCoordinates(next);
        check(
          !!a && !!b && Math.hypot(a.gx - b.gx, a.gy - b.gy) >= 0.5,
          `${v.id}/${st.name}: enclosing leg has length (${isChartPoint(prev) ? prev.name : prev.world} → ${isChartPoint(next) ? next.name : next.world})`,
        );
      }
    } else if (isChartPoint(st)) {
      check(st.name.trim().length > 0, `${v.id}[${si}]: chart point name`);
      check(
        st.gx >= 0 && st.gx <= GRID_W && st.gy >= 0 && st.gy <= GRID_H,
        `${v.id}/${st.name}: chart point on the grid`,
      );
      checkPlacement(st.placement, `${v.id}/${st.name}`);
      check(/^https:\/\//.test(st.source ?? ""), `${v.id}/${st.name}: event source URL`);
      if (st.leg?.d !== undefined) {
        check(/^M[\s\d.-]/.test(st.leg.d), `${v.id}/${st.name}: leg.d parses as a path`);
      }
      if (st.breakBefore) {
        check(si > 0, `${v.id}/${st.name}: route break is not first`);
      }
    } else {
      check(catalogIds.has(st.world), `${v.id}: station "${st.world}" exists in map-worlds.json`);
      if (st.placement) checkPlacement(st.placement, `${v.id}/${st.world}`);
      if (st.leg?.d !== undefined) {
        check(/^M[\s\d.-]/.test(st.leg.d), `${v.id}/${st.world}: leg.d parses as a path`);
      }
      if (st.breakBefore) {
        check(si > 0, `${v.id}/${st.world}: route break is not first`);
      }
    }
    if (!isWaypoint(st)) {
      if (st.leg?.color !== undefined) {
        check(/^#[0-9a-f]{6}$/i.test(st.leg.color), `${v.id}[${si}]: leg colour is valid hex`);
      }
      if (st.leg?.opacity !== undefined) {
        check(st.leg.opacity >= 0 && st.leg.opacity <= 1, `${v.id}[${si}]: leg opacity in 0–1`);
      }
      for (const arm of st.arms ?? []) {
        check(arm.legion.trim().length > 0, `${v.id}[${si}]: arm Legion identity`);
        check(arm.name.trim().length > 0, `${v.id}/${arm.legion}: arm Legion name`);
        check(arm.role.trim().length > 0, `${v.id}/${arm.legion}: arm role`);
        check(arm.text.trim().length > 0, `${v.id}/${arm.legion}: arm account`);
        check(/^#[0-9a-f]{6}$/i.test(arm.color), `${v.id}/${arm.legion}: arm colour is valid hex`);
        check(arm.opacity === undefined || (arm.opacity >= 0 && arm.opacity <= 1), `${v.id}/${arm.legion}: arm opacity in 0–1`);
        check(/^https:\/\//.test(arm.source), `${v.id}/${arm.legion}: arm source URL`);
        const armTargets = [...(arm.via ?? []).map((via) => via.target), arm.target];
        for (const [targetIndex, target] of armTargets.entries()) {
          const targetLabel = `${v.id}/${arm.legion}/target-${targetIndex + 1}`;
          check(target.text.trim().length > 0, `${targetLabel}: shared destination account`);
          check(/^https:\/\//.test(target.source), `${targetLabel}: destination source URL`);
          check(Number.isFinite(target.label.dx) && Number.isFinite(target.label.dy), `${targetLabel}: label offset`);
          if ("world" in target) {
            check(catalogIds.has(target.world), `${targetLabel}: arm target exists on chart`);
            if (target.placement) checkPlacement(target.placement, targetLabel);
          } else {
            check(
              target.gx >= 0 && target.gx <= GRID_W && target.gy >= 0 && target.gy <= GRID_H,
              `${targetLabel}: arm point target on the grid`,
            );
            checkPlacement(target.placement, targetLabel);
          }
        }
      }
    }
  });

  const resolved = resolveVoyage(v, chart);
  check(
    resolved.stations.length === v.stations.length,
    `${v.id}: every stop resolves (no silent drops)`,
  );
  const armSegmentCount = anchors.reduce(
    (sum, anchor) =>
      sum + (anchor.arms ?? []).reduce((armSum, arm) => armSum + 1 + (arm.via?.length ?? 0), 0),
    0,
  );
  const expectedLegs = anchors.slice(1).filter((s) => !s.breakBefore).length + armSegmentCount;
  check(resolved.legs.length === expectedLegs, `${v.id}: one leg per connected transition or strategic arm segment`);
  check(resolved.legColors.length === resolved.legs.length, `${v.id}: every leg has a shared renderer colour`);
  check(resolved.legOpacities.length === resolved.legs.length, `${v.id}: every leg has a shared renderer opacity`);
  check(resolved.legRevealAt.length === resolved.legs.length, `${v.id}: every leg has a reveal step`);
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
