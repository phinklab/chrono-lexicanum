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
const greatCrusadeFinale = greatCrusade?.stations.at(-1);
const finaleArms: VoyageArm[] =
  greatCrusadeFinale && !isWaypoint(greatCrusadeFinale) ? (greatCrusadeFinale.arms ?? []) : [];
const warmasterWeb = VOYAGES.find((v) => v.id === "warmasters-web");
const webArms: VoyageArm[] =
  warmasterWeb?.stations.flatMap((station) => (isWaypoint(station) ? [] : (station.arms ?? []))) ?? [];
check(greatCrusadeFinale?.heading === "The Great Crusade Ends", "Great Crusade ends before the Heresy journey");
check(greatCrusade?.continuation?.id === "warmasters-web", "Great Crusade hands off to Warmaster's Web");
check(
  !!greatCrusadeFinale &&
    !isWaypoint(greatCrusadeFinale) &&
    greatCrusadeFinale.placement === undefined,
  "Great Crusade finale carries no schematic placement block",
);
check(warmasterWeb !== undefined, "Warmaster's Web is its own journey");
check(warmasterWeb?.stations.length === 18, "Warmaster's Web has one guided step per active Legion");
check(warmasterWeb?.strategic?.mode === "legion-steps", "Warmaster's Web declares the Legion-step presentation");
check(
  warmasterWeb?.stations.every((station) => !isWaypoint(station) && station.arms?.length === 1) === true,
  "every Warmaster step owns exactly one Legion route",
);
check(
  !webArms.some((arm) => finaleArms.includes(arm)),
  "Warmaster's Web owns route data independent of the Great Crusade closing image",
);
check(finaleArms.length === 18, "Great Crusade keeps the eighteen-arm closing image");
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
check(
  webArms.map((arm) => arm.legion).join("|") ===
    "I|III|IV|V|VI|VII|VIII|IX|X|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX",
  "Warmaster steps follow Legion order and omit only the expunged II and XI",
);
const wordBearersArm = webArms.find((arm) => arm.legion === "XVII");
check(
  wordBearersArm?.branches?.some(
    (branch) => "world" in branch.target && branch.target.world === "terra",
  ) === true,
  "the Word Bearers main host ends before Terra while Layak's branch reaches it",
);
check(
  webArms.reduce((sum, arm) => sum + (arm.branches?.length ?? 0), 0) >= 10,
  "meaningful subordinate fleets are preserved as terminating branches",
);
const greatResolved = greatCrusade ? resolveVoyage(greatCrusade, chart) : undefined;
const webResolved = warmasterWeb ? resolveVoyage(warmasterWeb, chart) : undefined;
check(greatResolved?.stations.at(-1)?.armCount === 18, "Great Crusade still resolves its coloured finale");
check(
  webResolved?.stations.every((station) => station.armCount === 1) === true,
  "all eighteen Warmaster steps resolve one route each",
);
check(webResolved?.strategicArms.length === 18, "all eighteen Warmaster arms remain individually interactive");
check(
  webResolved?.strategicTargets.length !== undefined && webResolved.strategicTargets.length > 30,
  "the full web resolves its campaign destinations rather than eight opening dispositions",
);
check(
  webResolved?.strategicArms.every(
    (arm, index) =>
      arm.revealAt === index &&
      arm.legIndices.every((legIndex) => webResolved.legRevealAt[legIndex] === index),
  ) === true,
  "each Legion's main route and branches reveal only on its own step",
);
check(
  webResolved?.strategicArms.every(
    (arm) =>
      arm.mainLegIndices.length > 0 &&
      arm.mainLegIndices.every((legIndex) => webResolved.legOpacities[legIndex] >= 0.9) &&
      arm.branchLegIndices.every((legIndex) => webResolved.legOpacities[legIndex] <= 0.34),
  ) === true,
  "main routes stay vivid while subordinate branches remain recessive",
);

const abaddon = VOYAGES.find((v) => v.id === "abaddon");
check(abaddon !== undefined, "Abaddon journey exists");
check(abaddon?.name === "Abaddon · The Black Crusades", "Abaddon journey names its thirteen-campaign focus");
check(abaddon?.tag === "M31–M41", "Abaddon journey ends with Cadia rather than its post-Crusade campaigns");
check(abaddon?.stations.length === 40, "Abaddon audit preserves a lean forty-act campaign chronicle");
check(
  abaddon?.sections?.some((section) => section.id === "long-war-epilogue") === false,
  "Abaddon journey no longer presents Vigilus as a Black Crusades epilogue",
);
const abaddonWorldStops =
  abaddon?.stations.filter((station): station is VoyageStation => !isWaypoint(station) && !isChartPoint(station)) ?? [];
check(
  abaddonWorldStops.some((station) => station.world === "ornsworld" && station.breakBefore === true),
  "the Gothic War includes the separate Ornsworld relic raid without inventing a route from Purgatory",
);
check(
  abaddonWorldStops.filter((station) => station.world === "cadia").length === 2,
  "Cadia appears only for the sourced pylon reversal and destruction climax",
);
check(
  abaddonWorldStops.every((station) => station.world !== "vigilus"),
  "Vigilus stays outside the Black Crusades journey focus",
);
const abaddonChartPoints = abaddon?.stations.filter(isChartPoint) ?? [];
check(
  abaddonChartPoints.some(
    (station) => station.name === "Cadian Gate" && station.placement.precision === "relative",
  ),
  "Sigismund's void duel uses a relative Cadian Gate point rather than the Cadia surface pin",
);
check(
  abaddonChartPoints.some(
    (station) =>
      station.name === "Uralan" &&
      station.placement.precision === "schematic" &&
      station.date === "late First Black Crusade · M31",
  ),
  "Uralan exposes its disputed position and avoids dating a decades-late objective to the launch year",
);
check(
  abaddonChartPoints.some(
    (station) =>
      station.name === "Mackan" && station.placement.precision === "schematic" && station.breakBefore === true,
  ),
  "Mackan remains an isolated schematic battle rather than an exact Solar route",
);
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

const eisenhorn = VOYAGES.find((v) => v.id === "eisenhorn");
check(eisenhorn !== undefined, "Eisenhorn journey exists");
check(eisenhorn?.tag === "240–392.M41", "Eisenhorn scope matches the core trilogy chronology");
check(eisenhorn?.stations.length === 16, "Eisenhorn audit preserves a lean sixteen-act trilogy");
check(
  eisenhorn?.sections?.map((section) => `${section.id}:${section.start}`).join("|") ===
    "xenos:0|malleus:5|hereticus:11",
  "Eisenhorn sections follow Xenos, Malleus and Hereticus in order",
);
const eisenhornPoints = eisenhorn?.stations.filter(isChartPoint) ?? [];
const eisenhornPoint = (name: string) => eisenhornPoints.find((point) => point.name === name);
const cinchare = eisenhornPoint("Cinchare");
const jeganda = eisenhornPoint("Jeganda");
const ghul = eisenhornPoint("Ghül");
check(
  cinchare?.placement.precision === "schematic" && cinchare.breakBefore === true,
  "Cinchare exposes its Halo Zone position without inventing an incoming route",
);
check(jeganda?.placement.precision === "relative", "Jeganda exposes only its sourced outer-Scarus context");
check(
  ghul?.placement.precision === "schematic" && ghul.breakBefore === true,
  "Ghül remains an isolated schematic destination beyond Imperial space",
);
check(eisenhorn?.stations.at(-1) === ghul && ghul?.date === "392.M41", "Ghül is the dated trilogy ending");
const uncertainEisenhornWorlds = new Set([
  "hubris",
  "gudrun",
  "damask",
  "thracian-primaris",
  "eechan",
  "durer",
]);
check(
  eisenhorn?.stations.every(
    (station) =>
      isWaypoint(station) ||
      isChartPoint(station) ||
      !uncertainEisenhornWorlds.has(station.world) ||
      station.placement?.precision === "relative",
  ) === true,
  "every editorial Eisenhorn catalog pin discloses its relative placement",
);
const thracian = eisenhorn?.stations.find(
  (station): station is VoyageStation =>
    !isWaypoint(station) && !isChartPoint(station) && station.world === "thracian-primaris",
);
const durer = eisenhorn?.stations.find(
  (station): station is VoyageStation =>
    !isWaypoint(station) && !isChartPoint(station) && station.world === "durer",
);
const farness = eisenhornPoint("Farness Beta");
check(thracian?.breakBefore === true && durer?.breakBefore === true, "the trilogy's century jumps break the route line");
check(farness?.breakBefore === true, "Farness Beta does not inherit a false route from schematic Cinchare");
check(
  !/Gershom|King in Yellow|Magos coda/i.test(JSON.stringify(eisenhorn)),
  "The Magos and Bequin-era coda stay outside the core Eisenhorn trilogy",
);
const eisenhornResolved = eisenhorn ? resolveVoyage(eisenhorn, chart) : undefined;
check(eisenhornResolved?.legs.length === 10, "Eisenhorn resolves only its ten defensible route transitions");

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
check(ghaz?.stations.length === 14, "Ghazghkull audit carries fourteen distinct story acts");
const ghazPoint = (name: string): VoyageChartPoint | undefined =>
  ghaz?.stations.find((stop): stop is VoyageChartPoint => isChartPoint(stop) && stop.name === name);
const ghazWorld = (world: string): VoyageStation | undefined =>
  ghaz?.stations.find(
    (stop): stop is VoyageStation => !isWaypoint(stop) && !isChartPoint(stop) && stop.world === world,
  );
const haunted = ghazPoint("Haunted Gulf");
const ironfoot = ghazPoint("Da Ironfoot");
const fang = ghazPoint("Fang's World");
const kongajaro = ghazPoint("Kongajaro");
const kraken = ghazPoint("Black Kraken Nebula");
const krongar = ghazPoint("Krongar");
const icaria = ghazPoint("Icaria");
check(!!haunted && !!ironfoot && !!fang && !!kongajaro && !!kraken, "Ghazghkull synthetic cluster exists");
if (ghaz && haunted && ironfoot && fang && kongajaro && kraken) {
  const hauntedIndex = ghaz.stations.indexOf(haunted);
  const ironfootIndex = ghaz.stations.indexOf(ironfoot);
  check(ironfootIndex === hauntedIndex + 1, "Da Ironfoot follows the Haunted Gulf in chronology");
  check(
    ironfoot.breakBefore !== true && ironfoot.leg?.effect === "jump",
    "Kill Wrecka's uncontrolled Warp jump keeps chronology through a distinct dotted trace",
  );
  check(ironfoot.placement.precision === "schematic", "Da Ironfoot remains visibly schematic rather than a fixed planet");
  check(fang.placement.precision === "relative", "Fang's World exposes only its relative place inside Urgok's realm");
  check(Math.hypot(fang.gx - ironfoot.gx, fang.gy - ironfoot.gy) <= 25, "Fang's World stays close to Da Ironfoot");
  check(Math.hypot(kongajaro.gx - ironfoot.gx, kongajaro.gy - ironfoot.gy) <= 35, "Kongajaro remains a nearby system");
  const octarius = worldById.get("octarius");
  check(octarius !== undefined, "Octarius catalog anchor exists");
  if (octarius) {
    const dx = octarius.gx - ironfoot.gx;
    const dy = octarius.gy - ironfoot.gy;
    const t = ((kraken.gx - ironfoot.gx) * dx + (kraken.gy - ironfoot.gy) * dy) / (dx * dx + dy * dy);
    const corridorDistance = Math.abs((kraken.gx - ironfoot.gx) * dy - (kraken.gy - ironfoot.gy) * dx) / Math.hypot(dx, dy);
    check(t > 0.2 && t < 0.85 && corridorDistance < 40, "Black Kraken is a schematic corridor before Octarius");
  }
}
check(
  ghazWorld("golgotha")?.placement?.precision === "schematic",
  "Golgotha exposes its conflicting Ultima and Armageddon Sector positions",
);
const octariaStops =
  ghaz?.stations.filter(
    (stop): stop is VoyageStation => !isWaypoint(stop) && !isChartPoint(stop) && stop.world === "octarius",
  ) ?? [];
check(octariaStops.length === 2, "Octaria separates the planetstrike from the Galactic Green Wave");
check(
  octariaStops[0]?.date === "836–851.999.M41" && octariaStops[1]?.date === "852.999.M41",
  "Octaria chronology ends the Mawloc act before the 852.999.M41 psychic culmination",
);
check(
  octariaStops[1]?.heading === "Octaria · The Galactic Green Wave",
  "the Great Waaagh receives its named Galactic Green Wave turning point",
);
check(krongar?.placement.precision === "schematic", "Krongar replaces the catalog's incorrect Obscurus pin");
check(
  krongar?.breakBefore !== true && krongar?.leg?.effect === "jump",
  "Krongar keeps chronology without presenting the Octaria bridge as an attested course",
);
check(
  icaria?.breakBefore !== true && icaria?.leg?.effect === "jump",
  "Icaria keeps chronology without presenting the post-Krongar bridge as an attested course",
);
check(ghazWorld("krongar") === undefined, "Ghazghkull journey no longer uses the incorrect catalog Krongar coordinate");
check(
  !JSON.stringify(ghaz).includes("warhammer40k.fandom.com"),
  "Ghazghkull placements rely on official or Lexicanum provenance rather than Fandom",
);
const ghazLast = ghaz?.stations.at(-1);
check(
  !!ghazLast && !isWaypoint(ghazLast) && !isChartPoint(ghazLast) && ghazLast.world === "armageddon",
  "Ghazghkull journey ends on Armageddon",
);
check(ghazLast?.date === "Era Indomitus · ongoing", "Armageddon ending is visibly current and ongoing");
check(
  !!ghazLast && !isWaypoint(ghazLast) && ghazLast.leg?.effect === "jump",
  "the final return to Armageddon retains a distinct chronology bridge",
);
const ghazResolved = ghaz ? resolveVoyage(ghaz, chart) : undefined;
check(ghazResolved?.legs.length === 13, "Ghazghkull connects every consecutive act");
check(
  ghazResolved?.legColors.every((color) => color === "#79b84a") === true,
  "Ghazghkull's complete route carries the Ork-green visual identity",
);
check(
  ghazResolved?.legEffects.filter((effect) => effect === "jump").length === 4,
  "Ghazghkull distinguishes all four formerly disconnected chronology jumps",
);
check(
  ghazResolved?.legs.every((leg, index) => ghazResolved.legEffects[index] !== "jump" || leg.includes(" L ")) === true,
  "Ghazghkull jump traces travel directly rather than bowing like realspace courses",
);

const yvraine = VOYAGES.find((v) => v.id === "yvraine");
check(yvraine !== undefined, "Yvraine journey exists");
check(yvraine?.stations.length === 22, "Yvraine carries twenty-one audited acts plus Threccia");
check(
  yvraine?.sections?.map((section) => `${section.id}:${section.start}`).join("|") ===
    "many-paths:0|seventh-path:2|cronesword-quest:11|the-hunter:18",
  "Yvraine's sections preserve the four-part chronology",
);
check(
  /pale-cyan dotted traces/.test(yvraine?.cartography?.note ?? ""),
  "Yvraine discloses the Webway line language",
);
const yvrainePoint = (name: string): VoyageChartPoint | undefined =>
  yvraine?.stations.find(
    (stop): stop is VoyageChartPoint => isChartPoint(stop) && stop.name === name,
  );
const gnosis = yvrainePoint("Gnosis Prime");
const psychedelta = yvrainePoint("Psychedelta");
const threccia = yvrainePoint("Threccia");
const iathglas = yvrainePoint("Iathglas");
check(gnosis?.date === "838.M41", "Gnosis Prime carries its sourced date");
check(
  psychedelta?.heading === "Psychedelta · The Rubric Reversed",
  "Psychedelta no longer asserts an unsupported count",
);
check(
  threccia?.date === "early M42" && threccia.placement.precision === "schematic",
  "Threccia is present as the sourced, schematically placed Shalaxi turning point",
);
check(
  iathglas !== undefined && iathglas.gx < 244 && /Segmentum Pacificus/.test(iathglas.placement.note),
  "Iathglas follows the Phoenix Rising Pacificus placement rather than the conflicting Ultima infobox",
);
const webwayArrivals = new Set([
  "Ursulia · The Obsidian Gate",
  "Biel-Tan · The Fracture",
  "Iyanden · The Prince Reborn",
  "Psychedelta · The Rubric Reversed",
  "Klaisus · The Fractured Road",
  "Macragge · The Avenging Son Returns",
  "Black Library · The Rose of Isha",
  "Garden of Nurgle · The Hand of Darkness",
  "Einerash · The Dead City",
  "Ulthwé · The Gate of Malice",
  "Zaisuthra · The Well of the Dead",
  "Threccia · The Hunter in the Paths",
  "Zandros · Death and Rebirth",
]);
const authoredWebwayArrivals =
  yvraine?.stations.filter(
    (stop): stop is VoyageStation | VoyageChartPoint =>
      !isWaypoint(stop) && webwayArrivals.has(stop.heading ?? ""),
  ) ?? [];
check(authoredWebwayArrivals.length === 13, "Yvraine identifies every sourced Webway transition");
check(
  authoredWebwayArrivals.every(
    (stop) =>
      stop.breakBefore !== true &&
      stop.leg?.effect === "jump" &&
      stop.leg.color === "#9ce6ff" &&
      stop.leg.opacity === 0.82,
  ),
  "Yvraine's Webway journeys remain connected as pale-cyan dotted traces",
);
const yvraineResolved = yvraine ? resolveVoyage(yvraine, chart) : undefined;
check(yvraineResolved?.legs.length === 14, "Yvraine draws thirteen Webway passages and one grounded course");
check(
  yvraineResolved?.legEffects.filter((effect) => effect === "jump").length === 13,
  "Yvraine's resolved route preserves all thirteen Webway passages",
);

for (const v of VOYAGES) {
  check(v.name.trim().length > 0, `${v.id}: name`);
  check(v.tag.trim().length > 0, `${v.id}: tag`);
  check(v.blurb.trim().length > 0, `${v.id}: blurb`);
  if (v.continuation) {
    check(
      VOYAGES.some((candidate) => candidate.id === v.continuation?.id),
      `${v.id}: continuation resolves to a journey`,
    );
    check(v.continuation.label.trim().length > 0, `${v.id}: continuation label`);
  }
  check(
    v.lbl.x >= 0 && v.lbl.x <= GRID_W && v.lbl.y >= 0 && v.lbl.y <= GRID_H,
    `${v.id}: label on the grid`,
  );

  const anchors = v.stations.filter(
    (s): s is VoyageStation | VoyageChartPoint => !isWaypoint(s),
  );
  const networkOnly = anchors.length === 1 && (anchors[0].arms?.length ?? 0) > 0;
  check(anchors.length >= 2 || networkOnly, `${v.id}: route or single-anchor strategic network`);
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
      if (st.leg?.effect !== undefined) {
        check(st.leg.effect === "jump", `${v.id}[${si}]: leg effect is supported`);
      }
      for (const arm of st.arms ?? []) {
        check(arm.legion.trim().length > 0, `${v.id}[${si}]: arm Legion identity`);
        check(arm.name.trim().length > 0, `${v.id}/${arm.legion}: arm Legion name`);
        check(arm.role.trim().length > 0, `${v.id}/${arm.legion}: arm role`);
        check(arm.text.trim().length > 0, `${v.id}/${arm.legion}: arm account`);
        check(/^#[0-9a-f]{6}$/i.test(arm.color), `${v.id}/${arm.legion}: arm colour is valid hex`);
        check(arm.opacity === undefined || (arm.opacity >= 0 && arm.opacity <= 1), `${v.id}/${arm.legion}: arm opacity in 0–1`);
        check(/^https:\/\//.test(arm.source), `${v.id}/${arm.legion}: arm source URL`);
        for (const branch of arm.branches ?? []) {
          check(branch.name.trim().length > 0, `${v.id}/${arm.legion}: branch name`);
          check(/^https:\/\//.test(branch.source), `${v.id}/${arm.legion}/${branch.name}: branch source URL`);
          check(
            branch.opacity === undefined || (branch.opacity >= 0 && branch.opacity <= 0.45),
            `${v.id}/${arm.legion}/${branch.name}: branch opacity stays recessive`,
          );
        }
        const armTargets = [
          ...(arm.via ?? []).map((routeVia) => routeVia.target),
          arm.target,
          ...(arm.branches ?? []).flatMap((branch) => [
            branch.from,
            ...(branch.via ?? []).map((routeVia) => routeVia.target),
            branch.target,
          ]),
        ];
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
      sum +
      (anchor.arms ?? []).reduce(
        (armSum, arm) =>
          armSum +
          1 +
          (arm.via?.length ?? 0) +
          (arm.branches ?? []).reduce(
            (branchSum, branch) => branchSum + 1 + (branch.via?.length ?? 0),
            0,
          ),
        0,
      ),
    0,
  );
  const expectedLegs = anchors.slice(1).filter((s) => !s.breakBefore).length + armSegmentCount;
  check(resolved.legs.length === expectedLegs, `${v.id}: one leg per connected transition or strategic arm segment`);
  check(resolved.legColors.length === resolved.legs.length, `${v.id}: every leg has a shared renderer colour`);
  check(resolved.legOpacities.length === resolved.legs.length, `${v.id}: every leg has a shared renderer opacity`);
  check(resolved.legEffects.length === resolved.legs.length, `${v.id}: every leg has a shared renderer effect`);
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
