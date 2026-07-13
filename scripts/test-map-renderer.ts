import assert from "node:assert/strict";

import {
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
assert.equal(clampScale(k0 * 20, k0), k0 * 9);
assert.equal(cameraBand(k0 * 1.69, k0), "0");
assert.equal(cameraBand(k0 * 1.7, k0), "1");
assert.equal(cameraBand(k0 * 3.1, k0), "2");
assert.equal(cameraBand(k0 * 5.6, k0), "3");

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

assert.equal(mobileLabelVisible(0, "0", false, false), false);
assert.equal(mobileLabelVisible(0, "1", false, false), true);
assert.equal(mobileLabelVisible(1, "1", false, false), false);
assert.equal(mobileLabelVisible(1, "2", false, false), true);
assert.equal(mobileLabelVisible(3, "3", false, false), true);
assert.equal(mobileLabelVisible(3, "0", true, false), true);
assert.equal(mobileLabelVisible(3, "0", false, true), true);
assert.equal(mobileLabelVisible(0, "0", false, false, false), true);
assert.equal(mobileLabelVisible(1, "0", false, false, false), false);

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

console.log("map renderer: camera, backing budget, labels and picking green");
