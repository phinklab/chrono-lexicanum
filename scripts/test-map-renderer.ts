import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  MAX_RELATIVE_SCALE,
  ZOOM_STEP_FACTOR,
  cameraBand,
  centerRelative,
  clampScale,
  fitScale,
  homePose,
  localToWorld,
  worldToLocal,
  zoomPoseAt,
} from "../src/components/cartographer/camera-core";
import {
  canvasBackingScale,
  mobileLabelVisible,
  pickCanvasTarget,
} from "../src/components/cartographer/canvas-renderer";
import { H, W } from "../src/components/cartographer/chart-geometry";
import { validateMapWorlds, type MapWorldsFile } from "../src/lib/map/map-worlds-schema";
import { buildMapPayload } from "../src/lib/map/payload";
import { fitVoyageBounds, resolvedVoyageBounds } from "../src/lib/map/voyages";
import { CURATED_ZONES, zoneEdgeBands, zoneLabelLayout, zoneLabelVisible } from "../src/lib/map/zones";

function close(actual: number, expected: number, message: string): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} !== ${expected}`);
}

const k0 = fitScale(390, 844);
const home = homePose(390, 844, k0);
const chartCenter = worldToLocal(home, W / 2, H / 2);
close(chartCenter.x, 195, "home centers chart horizontally");
close(chartCenter.y, 422, "home centers chart vertically");

const world = localToWorld(home, 123, 456);
const roundTrip = worldToLocal(home, world.gx, world.gy);
close(roundTrip.x, 123, "screen/world x round-trip");
close(roundTrip.y, 456, "screen/world y round-trip");

const anchor = { x: 87, y: 611 };
const anchorWorld = localToWorld(home, anchor.x, anchor.y);
const zoomed = zoomPoseAt(home, anchor.x, anchor.y, home.k * 2.75);
const anchoredAgain = worldToLocal(zoomed, anchorWorld.gx, anchorWorld.gy);
close(anchoredAgain.x, anchor.x, "zoom preserves x anchor");
close(anchoredAgain.y, anchor.y, "zoom preserves y anchor");

assert.equal(clampScale(k0 * 0.1, k0), k0 * 0.75);
assert.equal(MAX_RELATIVE_SCALE, 13.05);
assert.equal(MAX_RELATIVE_SCALE / ZOOM_STEP_FACTOR, 9);
assert.equal(clampScale(k0 * 20, k0), k0 * MAX_RELATIVE_SCALE);
assert.equal(cameraBand(k0 * 1.69, k0), "0");
assert.equal(cameraBand(k0 * 1.7, k0), "1");
assert.equal(cameraBand(k0 * 3.1, k0), "2");
assert.equal(cameraBand(k0 * 5.6, k0), "3");
assert.equal(cameraBand(k0 * MAX_RELATIVE_SCALE, k0), "3");

const relative = centerRelative({
  ...zoomed,
  k0,
  vw: 390,
  vh: 844,
  ox: 0,
  oy: 0,
});
close(relative.kr, 2.75, "relative camera zoom");

const backing = canvasBackingScale(412, 915, 3);
assert.ok(backing <= 2, "backing scale is DPR-capped");
assert.ok(412 * backing * 915 * backing <= 2_000_000, "mobile backing stays inside pixel budget");
const hugeBacking = canvasBackingScale(2560, 1440, 2);
assert.ok(
  2560 * hugeBacking * 1440 * hugeBacking <= 2_000_000.01,
  "pixel budget also holds for oversized CSS viewports",
);

assert.equal(mobileLabelVisible(0, "0", "auto", false), false);
assert.equal(mobileLabelVisible(0, "1", "auto", false), true);
assert.equal(mobileLabelVisible(1, "1", "auto", false), false);
assert.equal(mobileLabelVisible(1, "2", "auto", false), true);
assert.equal(mobileLabelVisible(3, "3", "auto", false), true);
assert.equal(mobileLabelVisible(3, "0", "all", false), true);
assert.equal(mobileLabelVisible(3, "0", "auto", true), true);
assert.equal(mobileLabelVisible(0, "0", "auto", false, false), true);
assert.equal(mobileLabelVisible(1, "0", "auto", false, false), false);
// "off" hides every tier in every band — except the emphasized (selected /
// journey) worlds, which keep their name like the SVG chart's overrides.
assert.equal(mobileLabelVisible(0, "3", "off", false), false);
assert.equal(mobileLabelVisible(0, "3", "off", true), true);

const targets = [
  { id: "dust", x: 100, y: 100, radius: 22, rank: 1, order: 0 },
  { id: "featured", x: 105, y: 100, radius: 22, rank: 2, order: 1 },
  { id: "selected", x: 118, y: 100, radius: 22, rank: 4, order: 2 },
  { id: "label", x: 200, y: 200, rect: { left: 180, top: 180, right: 240, bottom: 220 }, rank: 2, order: 3 },
] as const;
assert.equal(pickCanvasTarget(targets, 100, 100), "selected", "rank wins inside the 44px target");
assert.equal(pickCanvasTarget(targets, 190, 190), "label", "visible label bounds are pickable");
assert.equal(pickCanvasTarget(targets, 300, 300), null, "empty chart tap stays empty");
assert.equal(
  pickCanvasTarget(
    [
      { id: "pin", x: 108, y: 100, radius: 22, rank: 2, order: 1 },
      { id: "tracked-label", x: 200, y: 100, rect: { left: 90, top: 90, right: 220, bottom: 110 }, rank: 2, order: 2 },
    ],
    100,
    100,
  ),
  "tracked-label",
  "an actual label-rect hit beats a merely nearby equal-rank pin",
);

const rawMapWorlds: unknown = JSON.parse(
  readFileSync(path.join(process.cwd(), "scripts", "seed-data", "map-worlds.json"), "utf8"),
);
assert.deepEqual(validateMapWorlds(rawMapWorlds), [], "map-worlds catalog validates for renderer checks");
const mapPayload = buildMapPayload(rawMapWorlds as MapWorldsFile);
const armageddon = mapPayload.featured.find((world) => world.id === "armageddon");
const helbrecht = mapPayload.dust.find((world) => world[3] === "helbrecht-crusade");
assert.ok(armageddon && helbrecht, "Armageddon and Helbrecht Crusade contacts exist");
assert.ok(
  armageddon && helbrecht && Math.hypot(armageddon.gx - helbrecht[0], armageddon.gy - helbrecht[1]) >= 4.9,
  "a collocated fleet contact is display-offset from recorded Armageddon",
);

const routeBounds = resolvedVoyageBounds({
  stations: [
    { gx: 100, gy: 200 },
    { gx: 500, gy: 200 },
  ],
  legs: ["M 100 200 Q 300 0 500 200"],
  lbl: { x: 300, y: 190, t: "ROUTE" },
});
assert.deepEqual(
  routeBounds,
  { minX: 100, minY: 100, maxX: 500, maxY: 200 },
  "route bounds include the curved leg, not only its stations",
);
const routeLabelBounds = resolvedVoyageBounds({
  stations: [{ gx: 100, gy: 100 }],
  legs: [],
  lbl: { x: 600, y: 250, t: "FULL ROUTE" },
});
assert.ok(routeLabelBounds && routeLabelBounds.maxX > 600, "route bounds include label width");
assert.ok(routeLabelBounds && routeLabelBounds.maxY > 250, "route bounds include label baseline");

const routeFit = fitVoyageBounds(
  { minX: 100, minY: 100, maxX: 500, maxY: 300 },
  { width: 400, height: 800 },
  { horizontal: 20, top: 80, bottom: 320 },
);
close(routeFit.gx, 300, "route fit centers the grid bounds horizontally");
close(routeFit.gy, 200, "route fit centers the grid bounds vertically");
close(routeFit.k, 0.9, "route fit uses the limiting visible dimension");
close(routeFit.dy, -120, "route fit centers above the docked card");

// Zone label handwork (WM-B1): angles stay inside Imhof's clamp, Sperrung
// inside its ladder, edge-tint bands ascend and stay capped.
for (const zone of CURATED_ZONES) {
  const layout = zoneLabelLayout(zone);
  assert.ok(Math.abs(layout.angle) <= 30, `${zone.id} label angle clamped: ${layout.angle}`);
  assert.ok(layout.spacing >= 3 && layout.spacing <= 7.5, `${zone.id} spacing in ladder`);
  const [w1, w2, w3] = zoneEdgeBands(zone);
  assert.ok(w1 < w2 && w2 < w3, `${zone.id} edge bands ascend`);
  assert.ok(w3 <= 44, `${zone.id} widest band capped`);
}
const cicatrix = CURATED_ZONES.find((zone) => zone.id === "zone-2");
const ruinstorm = CURATED_ZONES.find((zone) => zone.id === "zone-22");
const scourge = CURATED_ZONES.find((zone) => zone.id === "zone-4");
assert.ok(cicatrix && ruinstorm && scourge, "reference zones exist in the curation");
if (cicatrix && ruinstorm && scourge) {
  assert.ok(zoneLabelLayout(cicatrix).arc, "the Cicatrix corridor gets an arced label");
  assert.equal(zoneLabelLayout(ruinstorm).angle, 0, "the near-vertical Ruinstorm reads horizontal");
  assert.equal(zoneLabelLayout(ruinstorm).arc, null, "no arc on a near-vertical band");
  const small = zoneLabelLayout(scourge);
  assert.ok(small.small, "the Scourge Stars count as a small zone");
  assert.equal(zoneLabelVisible("0", small), false, "small zones stay unlabelled at overview");
  assert.equal(zoneLabelVisible("1", small), true, "small zones label from band 1");
}

console.log("map renderer: camera, backing budget, labels, picking, voyage fit and zone layout green");
