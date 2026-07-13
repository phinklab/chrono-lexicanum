/**
 * Android map painter: one viewport-sized, opaque Canvas2D surface.
 *
 * The data and camera remain the same as the desktop SVG chart. This module
 * only changes how pixels are produced: no per-feature DOM, no world-sized
 * backing store, no SVG filters and no perpetual animation.
 */

import type { FeaturedWorld, MapPayload } from "@/lib/map/payload";
import type { MapWorldKind } from "@/lib/map/map-worlds-schema";
import type { ResolvedVoyage } from "@/lib/map/voyages";
import { pointOnLeg } from "@/lib/map/voyages";
import { CURATED_ZONES, zoneCentroid, zonePath, type ZoneDef, type ZonesMode } from "@/lib/map/zones";

import {
  BLOOD,
  BONE,
  GOLD,
  ICE,
  PLAGUE,
  POLAR_RINGS,
  RING_CLEAR,
  SEGS,
  SOLAR_R,
  TX,
  TY,
  WEDGES,
  dustScatter,
  gridDots,
  nihilusPath,
  outerR,
  pp,
  ringArcs,
  wedgePath,
} from "./chart-geometry";
import type { CameraBand, CameraPose } from "./camera-core";
import { worldToLocal } from "./camera-core";
import { labelTier, pinSize } from "./layers";

export const CANVAS_VOID = "#050301";
const WARP_MID = "#b05070";
const WARP_LIGHT = "#cbb3ee";
const PICK_RADIUS = 22;
const LABEL_OVERSCAN = 100;
const ROUTE_REVEAL_MS = 900;
const ROUTE_SAMPLES = 64;

export interface CanvasFonts {
  body: string;
  display: string;
  mono: string;
}

export interface CanvasScene {
  payload: MapPayload;
  hiddenCls: ReadonlySet<number>;
  dustOff: boolean;
  worksOnly: boolean;
  names: boolean;
  zones: ZonesMode;
  lumen: boolean;
  nihilus: boolean;
  selectedWorld: FeaturedWorld | null;
  activeVoyage: ResolvedVoyage | null;
  voyageProgress: number | null;
  hiIds: ReadonlySet<string> | null;
  routeDim: boolean;
  routeStartedAt: number;
  reduce: boolean;
}

export interface CanvasViewport {
  width: number;
  height: number;
}

export interface CanvasHitTarget {
  id: string;
  x: number;
  y: number;
  radius?: number;
  rect?: { left: number; top: number; right: number; bottom: number };
  /** selected > journey > featured/region > dust */
  rank: number;
  order: number;
}

export interface CanvasDrawResult {
  hitTargets: CanvasHitTarget[];
  routeAnimating: boolean;
}

export function canvasBackingScale(
  width: number,
  height: number,
  deviceScale: number,
  maxPixels = 2_000_000,
): number {
  const area = Math.max(1, width * height);
  return Math.min(Math.max(deviceScale || 1, 0.01), 2, Math.sqrt(maxPixels / area));
}

export function mobileLabelVisible(
  tier: 0 | 1 | 2 | 3,
  band: CameraBand,
  names: boolean,
  emphasized: boolean,
  compact = true,
): boolean {
  if (names || emphasized) return true;
  if (tier === 3) return band === "3";
  return compact ? Number(band) > tier : Number(band) >= tier;
}

function targetDistance(target: CanvasHitTarget, x: number, y: number): number | null {
  const distance = (target.x - x) ** 2 + (target.y - y) ** 2;
  if (
    target.rect &&
    x >= target.rect.left &&
    x <= target.rect.right &&
    y >= target.rect.top &&
    y <= target.rect.bottom
  ) {
    return 0;
  }
  return target.radius !== undefined && distance <= target.radius ** 2 ? distance : null;
}

export function pickCanvasTarget(
  targets: readonly CanvasHitTarget[],
  x: number,
  y: number,
): string | null {
  let best: { id: string; rank: number; distance: number; order: number } | null = null;
  for (const target of targets) {
    const distance = targetDistance(target, x, y);
    if (distance === null) continue;
    if (
      !best ||
      target.rank > best.rank ||
      (target.rank === best.rank && distance < best.distance) ||
      (target.rank === best.rank && distance === best.distance && target.order > best.order)
    ) {
      best = { id: target.id, rank: target.rank, distance, order: target.order };
    }
  }
  return best?.id ?? null;
}

/** Pointer-time geometric hit-test. The 1,055-contact scan is cheap and
 * avoids allocating 1,055 screen-target objects on every draw frame. */
export function pickSceneContact(
  scene: CanvasScene,
  camera: CameraPose,
  extraTargets: readonly CanvasHitTarget[],
  x: number,
  y: number,
): string | null {
  let best: { id: string; rank: number; distance: number; order: number } | null = null;
  const consider = (id: string, sx: number, sy: number, rank: number, order: number) => {
    const distance = (sx - x) ** 2 + (sy - y) ** 2;
    if (distance > PICK_RADIUS ** 2) return;
    if (
      !best ||
      rank > best.rank ||
      (rank === best.rank && distance < best.distance) ||
      (rank === best.rank && distance === best.distance && order > best.order)
    ) {
      best = { id, rank, distance, order };
    }
  };

  let order = 0;
  if (!scene.worksOnly && !scene.dustOff) {
    for (const [gx, gy, ci, id] of scene.payload.dust) {
      if (scene.hiddenCls.has(ci)) continue;
      const selected = scene.selectedWorld?.id === id;
      const hi = scene.hiIds?.has(id) ?? false;
      consider(id, camera.tx + gx * camera.k, camera.ty + gy * camera.k, selected ? 4 : hi ? 3 : 1, order++);
    }
  }
  for (const world of scene.payload.featured) {
    if (world.kind === "region" || scene.hiddenCls.has(world.c)) continue;
    const selected = scene.selectedWorld?.id === world.id;
    const hi = scene.hiIds?.has(world.id) ?? false;
    consider(
      world.id,
      camera.tx + world.gx * camera.k,
      camera.ty + world.gy * camera.k,
      selected ? 4 : hi ? 3 : 2,
      order++,
    );
  }
  for (const region of scene.payload.regions) {
    if (region.fi < 0) continue;
    const world = scene.payload.featured[region.fi];
    if (!world) continue;
    consider(
      world.id,
      camera.tx + region.gx * camera.k,
      camera.ty + region.gy * camera.k,
      scene.selectedWorld?.id === world.id ? 4 : 2,
      order++,
    );
  }

  for (const target of extraTargets) {
    const distance = targetDistance(target, x, y);
    if (distance === null) continue;
    const current = best as { id: string; rank: number; distance: number; order: number } | null;
    if (
      !current ||
      target.rank > current.rank ||
      (target.rank === current.rank && distance < current.distance) ||
      (target.rank === current.rank && distance === current.distance && target.order > current.order)
    ) {
      best = { id: target.id, rank: target.rank, distance, order: target.order };
    }
  }
  return (best as { id: string } | null)?.id ?? null;
}

export function resolveCanvasFonts(): CanvasFonts {
  const css = getComputedStyle(document.documentElement);
  const family = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    body: family("--font-cardo", "Georgia, serif"),
    display: family("--font-cormorant-sc", "Georgia, serif"),
    mono: family("--font-fragment-mono", "ui-monospace, monospace"),
  };
}

const dustCache = new WeakMap<MapPayload, ReturnType<typeof dustScatter>>();
const pathCache = new Map<string, Path2D>();
const textWidthCache = new Map<string, number>();
const PUBLISHED_ZONES = CURATED_ZONES.filter((zone) => zone.published);
let cachedGridPaths: { faint: Path2D; strong: Path2D } | null = null;
let cachedLumenClip: Path2D | null = null;
let cachedPolarPaths: {
  rings: Path2D;
  solar: Path2D;
  spokes: Path2D;
  ticks: Path2D;
  wedges: Path2D;
} | null = null;
let cachedTerraTicks: { major: Path2D; minor: Path2D } | null = null;

function cachedPath(d: string): Path2D {
  let path = pathCache.get(d);
  if (!path) {
    path = new Path2D(d);
    pathCache.set(d, path);
  }
  return path;
}

function dustLooks(payload: MapPayload): ReturnType<typeof dustScatter> {
  let looks = dustCache.get(payload);
  if (!looks) {
    looks = dustScatter(payload.dust.length);
    dustCache.set(payload, looks);
  }
  return looks;
}

function setFont(
  ctx: CanvasRenderingContext2D,
  family: string,
  size: number,
  style: "normal" | "italic" = "normal",
  tracking = 0,
): void {
  ctx.font = `${style} 400 ${size}px ${family}`;
  ctx.letterSpacing = `${tracking}px`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
}

function measuredTextWidth(ctx: CanvasRenderingContext2D, text: string): number {
  const key = `${ctx.font}|${ctx.letterSpacing}|${text}`;
  const cached = textWidthCache.get(key);
  if (cached !== undefined) return cached;
  // Chromium includes Canvas letterSpacing in TextMetrics.width.
  const width = ctx.measureText(text).width;
  textWidthCache.set(key, width);
  return width;
}

function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  alpha: number,
  strokeAlpha = 0.9,
): number {
  ctx.globalAlpha = alpha;
  ctx.lineJoin = "round";
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = `rgba(3,2,1,${strokeAlpha})`;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  return measuredTextWidth(ctx, text);
}

function inViewport(x: number, y: number, viewport: CanvasViewport, margin = LABEL_OVERSCAN): boolean {
  return x >= -margin && x <= viewport.width + margin && y >= -margin && y <= viewport.height + margin;
}

function mapBounds(camera: CameraPose, viewport: CanvasViewport, overscanPx = LABEL_OVERSCAN) {
  return {
    left: (-camera.tx - overscanPx) / camera.k,
    top: (-camera.ty - overscanPx) / camera.k,
    right: (viewport.width - camera.tx + overscanPx) / camera.k,
    bottom: (viewport.height - camera.ty + overscanPx) / camera.k,
  };
}

function mapTransform(ctx: CanvasRenderingContext2D, camera: CameraPose): void {
  ctx.translate(camera.tx, camera.ty);
  ctx.scale(camera.k, camera.k);
}

function drawGrid(ctx: CanvasRenderingContext2D, camera: CameraPose): void {
  ctx.save();
  mapTransform(ctx, camera);

  if (!cachedGridPaths) {
    const faint = new Path2D();
    const strong = new Path2D();
    for (const dot of gridDots()) {
      const path = dot.op > 0.1 ? strong : faint;
      path.moveTo(dot.x + 0.6, dot.y);
      path.arc(dot.x, dot.y, 0.6, 0, Math.PI * 2);
    }
    cachedGridPaths = { faint, strong };
  }
  ctx.fillStyle = BONE;
  ctx.globalAlpha = 0.06;
  ctx.fill(cachedGridPaths.faint);
  ctx.globalAlpha = 0.13;
  ctx.fill(cachedGridPaths.strong);
  ctx.restore();
}

function polarPaths(): NonNullable<typeof cachedPolarPaths> {
  if (cachedPolarPaths) return cachedPolarPaths;
  const rings = new Path2D();
  for (const radius of POLAR_RINGS) {
    const arcs = ringArcs(radius);
    if (arcs === null) rings.arc(TX, TY, radius, 0, Math.PI * 2);
    else for (const d of arcs) rings.addPath(cachedPath(d));
  }
  const solar = new Path2D();
  solar.arc(TX, TY, SOLAR_R, 0, Math.PI * 2);
  const spokes = new Path2D();
  for (let angle = 0; angle < 360; angle += 30) {
    const a = pp(angle, SOLAR_R);
    const b = pp(angle, outerR(angle));
    spokes.moveTo(a[0], a[1]);
    spokes.lineTo(b[0], b[1]);
  }
  const ticks = new Path2D();
  for (let angle = 0; angle < 360; angle += 5) {
    if (Math.abs(383 - outerR(angle)) < RING_CLEAR) continue;
    const a = pp(angle, 381);
    const b = pp(angle, 385);
    ticks.moveTo(a[0], a[1]);
    ticks.lineTo(b[0], b[1]);
  }
  const wedges = new Path2D();
  for (const wedge of WEDGES) wedges.addPath(cachedPath(wedgePath(wedge.r0, wedge.steps)));
  cachedPolarPaths = { rings, solar, spokes, ticks, wedges };
  return cachedPolarPaths;
}

function drawPolar(ctx: CanvasRenderingContext2D, camera: CameraPose): void {
  const paths = polarPaths();
  ctx.save();
  mapTransform(ctx, camera);
  ctx.lineWidth = 1 / camera.k;
  ctx.strokeStyle = BONE;
  ctx.globalAlpha = 0.09;
  ctx.stroke(paths.rings);
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.3;
  ctx.stroke(paths.solar);

  ctx.strokeStyle = BONE;
  ctx.globalAlpha = 0.045;
  ctx.stroke(paths.spokes);

  ctx.globalAlpha = 0.08;
  ctx.stroke(paths.ticks);

  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.3;
  ctx.stroke(paths.wedges);
  ctx.restore();
}

function drawSegmentumNames(
  ctx: CanvasRenderingContext2D,
  camera: CameraPose,
  fonts: CanvasFonts,
  alpha: number,
): void {
  ctx.save();
  mapTransform(ctx, camera);
  ctx.fillStyle = BONE;
  ctx.globalAlpha = 0.085 * alpha;
  for (const segmentum of SEGS) {
    setFont(ctx, fonts.display, segmentum.fs, "normal", segmentum.fs * 0.4);
    ctx.fillText(segmentum.name.toUpperCase(), segmentum.x, segmentum.y);
  }
  ctx.restore();
}

function lumenClipPath(): Path2D {
  if (cachedLumenClip) return cachedLumenClip;
  const path = new Path2D();
  path.rect(-2400, -2350, 5600, 5500);
  path.addPath(cachedPath(nihilusPath()));
  cachedLumenClip = path;
  return cachedLumenClip;
}

function drawLumenNihilus(
  ctx: CanvasRenderingContext2D,
  camera: CameraPose,
  scene: CanvasScene,
  viewport: CanvasViewport,
  fonts: CanvasFonts,
  fontsReady: boolean,
): void {
  if (!scene.lumen && !scene.nihilus) return;
  const bounds = mapBounds(camera, viewport, 0);
  const nihilus = cachedPath(nihilusPath());

  ctx.save();
  mapTransform(ctx, camera);
  if (scene.lumen) {
    const veil = ctx.createRadialGradient(TX, TY, 0, TX, TY, 618 * 1.36);
    veil.addColorStop(0, "rgba(2,1,3,0)");
    veil.addColorStop(0.7, "rgba(2,1,3,0)");
    veil.addColorStop(0.84, "rgba(2,1,3,0.32)");
    veil.addColorStop(1, "rgba(2,1,3,0.52)");
    ctx.fillStyle = veil;
    ctx.fillRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);

    ctx.save();
    ctx.clip(lumenClipPath(), "evenodd");
    const light = ctx.createRadialGradient(TX, TY, 0, TX, TY, 618);
    light.addColorStop(0, "rgba(164,140,82,0.26)");
    light.addColorStop(0.45, "rgba(164,140,82,0.13)");
    light.addColorStop(0.8, "rgba(164,140,82,0.05)");
    light.addColorStop(1, "rgba(164,140,82,0)");
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(TX, TY, 618, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = 1 / camera.k;
    ctx.setLineDash([1 / camera.k, 6 / camera.k]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = "rgba(1,0,2,0.5)";
    ctx.globalAlpha = 1;
    ctx.fill(nihilus);
  }
  if (scene.nihilus) {
    const shade = ctx.createLinearGradient(300, 500, 900, 0);
    shade.addColorStop(0, "rgba(40,20,66,0.14)");
    shade.addColorStop(0.45, "rgba(40,20,66,0.30)");
    shade.addColorStop(1, "rgba(40,20,66,0.44)");
    ctx.fillStyle = shade;
    ctx.globalAlpha = 1;
    ctx.fill(nihilus);
  }

  if (fontsReady && scene.lumen) {
    setFont(ctx, fonts.mono, 7, "normal", 1.82);
    ctx.fillStyle = GOLD;
    ctx.globalAlpha = 0.5;
    ctx.fillText("FINIS LUCIS ASTRONOMICI", 821.44, 738.77);
    setFont(ctx, fonts.mono, 5.5, "normal", 1.43);
    ctx.globalAlpha = 0.35;
    ctx.fillText("BEYOND: THE BLIND VOID", 821.44, 748.77);
    setFont(ctx, fonts.mono, 7, "normal", 1.82);
    ctx.fillStyle = WARP_LIGHT;
    ctx.globalAlpha = 0.5;
    ctx.fillText("LUX DEVORATA", 690, 322);
    setFont(ctx, fonts.mono, 5.5, "normal", 1.43);
    ctx.globalAlpha = 0.35;
    ctx.fillText("THE WARP DEVOURS THE LIGHT", 690, 332);
  }
  if (fontsReady && scene.nihilus) {
    setFont(ctx, fonts.mono, 13, "normal", 5.2);
    ctx.fillStyle = WARP_LIGHT;
    ctx.globalAlpha = 0.42;
    ctx.fillText("IMPERIUM NIHILUS", 760, 118);
    setFont(ctx, fonts.mono, 6.5, "normal", 2.6);
    ctx.globalAlpha = 0.28;
    ctx.fillText("THE DARK IMPERIUM · BEYOND THE RIFT", 760, 132);
    setFont(ctx, fonts.mono, 10, "normal", 4);
    ctx.fillStyle = GOLD;
    ctx.globalAlpha = 0.3;
    ctx.fillText("IMPERIUM SANCTUS", 286, 588);
  }
  ctx.restore();
}

function computeZoneBounds(zone: ZoneDef) {
  const xs = zone.points.map(([x]) => x);
  const ys = zone.points.map(([, y]) => y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

function drawHatch(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  b: ReturnType<typeof computeZoneBounds>,
  color: string,
  reverse: boolean,
  alpha: number,
): void {
  const height = b.bottom - b.top;
  ctx.save();
  ctx.clip(path);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5 * alpha;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let x = b.left - height; x <= b.right + height; x += 5 * Math.SQRT2) {
    ctx.moveTo(x, b.top);
    ctx.lineTo(reverse ? x - height : x + height, b.bottom);
  }
  ctx.stroke();
  ctx.restore();
}

function zoneStyle(zone: ZoneDef): {
  fill: string;
  stroke: string;
  strokeAlpha: number;
  width: number;
  dash: number[];
  label: string;
  labelAlpha: number;
} {
  switch (zone.kind) {
    case "interdiction":
      return { fill: "transparent", stroke: BLOOD, strokeAlpha: 0.4, width: 1, dash: [3, 3], label: BLOOD, labelAlpha: 1 };
    case "plague":
      return { fill: "transparent", stroke: PLAGUE, strokeAlpha: 0.4, width: 1, dash: [3, 3], label: PLAGUE, labelAlpha: 0.95 };
    case "region":
      return { fill: "rgba(164,140,82,0.05)", stroke: GOLD, strokeAlpha: 0.4, width: 0.8, dash: [1, 6], label: GOLD, labelAlpha: 0.8 };
    case "hive-fleet":
      return { fill: "rgba(156,230,255,0.05)", stroke: ICE, strokeAlpha: 0.4, width: 0.8, dash: [1, 4], label: ICE, labelAlpha: 0.75 };
    case "necron-dynasty":
      return { fill: "rgba(156,230,255,0.03)", stroke: ICE, strokeAlpha: 0.35, width: 0.8, dash: [3, 3], label: ICE, labelAlpha: 0.6 };
    default:
      return { fill: "rgba(138,104,196,0.10)", stroke: WARP_MID, strokeAlpha: 0.55, width: 1, dash: [2, 5], label: WARP_LIGHT, labelAlpha: 0.85 };
  }
}

const ZONE_RENDER_DATA = PUBLISHED_ZONES.map((zone) => ({
  zone,
  bounds: computeZoneBounds(zone),
  center: zoneCentroid(zone),
  pathD: zonePath(zone),
  style: zoneStyle(zone),
}));

function drawZones(
  ctx: CanvasRenderingContext2D,
  camera: CameraPose,
  scene: CanvasScene,
  viewport: CanvasViewport,
  fonts: CanvasFonts,
  fontsReady: boolean,
): void {
  if (scene.zones === "off") return;
  const fieldAlpha = scene.zones === "dim" ? 0.45 : scene.routeDim ? 0.22 : 1;
  const visible = mapBounds(camera, viewport);
  ctx.save();
  mapTransform(ctx, camera);
  for (const entry of ZONE_RENDER_DATA) {
    const { zone, bounds: b, style } = entry;
    if (b.right < visible.left || b.left > visible.right || b.bottom < visible.top || b.top > visible.bottom) continue;
    const path = cachedPath(entry.pathD);
    ctx.globalAlpha = fieldAlpha;
    if (style.fill !== "transparent") {
      ctx.fillStyle = style.fill;
      ctx.fill(path);
    }
    if (zone.kind === "interdiction" || zone.kind === "plague") {
      drawHatch(
        ctx,
        path,
        b,
        zone.kind === "plague" ? PLAGUE : BLOOD,
        zone.kind === "interdiction",
        fieldAlpha,
      );
    }
    ctx.strokeStyle = style.stroke;
    ctx.globalAlpha = style.strokeAlpha * fieldAlpha;
    ctx.lineWidth = (zone.kind === "interdiction" || zone.kind === "plague" ? style.width / camera.k : style.width);
    ctx.setLineDash(style.dash.map((value) => value / (zone.kind === "interdiction" || zone.kind === "plague" ? camera.k : 1)));
    ctx.stroke(path);
    ctx.setLineDash([]);
  }
  ctx.restore();

  if (!fontsReady || scene.zones === "dim") return;
  for (const entry of ZONE_RENDER_DATA) {
    const { zone, center, style } = entry;
    const point = worldToLocal(camera, center.x, center.y);
    if (!inViewport(point.x, point.y, viewport)) continue;
    const text = zone.kind === "interdiction" ? `✠ ${zone.name.toUpperCase()} ✠` : zone.name.toUpperCase();
    setFont(ctx, fonts.mono, 10, "normal", 3);
    ctx.fillStyle = style.label;
    ctx.globalAlpha = style.labelAlpha * fieldAlpha;
    ctx.fillText(text, point.x, point.y);
  }
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  kind: MapWorldKind,
  x: number,
  y: number,
  size: number,
  alpha: number,
  scale = 1,
): void {
  const s = size;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  switch (kind) {
    case "chaos-warp": {
      ctx.strokeStyle = BLOOD;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * i) / 4;
        const length = i % 2 === 0 ? s : s * 0.55;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
      }
      ctx.stroke();
      ctx.fillStyle = BLOOD;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "dead":
      ctx.strokeStyle = BONE;
      ctx.globalAlpha = alpha * 0.8;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-s, -s);
      ctx.lineTo(s, s);
      ctx.moveTo(-s, s);
      ctx.lineTo(s, -s);
      ctx.stroke();
      break;
    case "imperial-military":
      ctx.fillStyle = BONE;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, s + 1.2, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case "station":
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 0.9;
      ctx.strokeRect(-s * 0.85, -s * 0.85, s * 1.7, s * 1.7);
      ctx.fillStyle = GOLD;
      ctx.globalAlpha = alpha * 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 0.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "fleet":
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, -s * 1.1);
      ctx.lineTo(s, s);
      ctx.lineTo(0, s * 0.45);
      ctx.lineTo(-s, s);
      ctx.closePath();
      ctx.stroke();
      break;
    case "gate":
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 0.9;
      ctx.strokeRect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = GOLD;
      ctx.globalAlpha = alpha * 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 0.7, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "necron":
      ctx.strokeStyle = ICE;
      ctx.globalAlpha = alpha * 0.65;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
      ctx.moveTo(0, -s);
      ctx.lineTo(0, s);
      ctx.stroke();
      break;
    case "aeldari":
      ctx.rotate(Math.PI / 6);
      ctx.strokeStyle = ICE;
      ctx.globalAlpha = alpha * 0.65;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.55, s * 1.15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(-Math.PI / 6);
      ctx.fillStyle = ICE;
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, 0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "xenos":
      ctx.strokeStyle = ICE;
      ctx.globalAlpha = alpha * 0.65;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.lineTo(s, -s);
      ctx.lineTo(-s, -s);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = ICE;
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, 0.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      ctx.fillStyle = BONE;
      ctx.globalAlpha = alpha * (kind === "unclassified" ? 0.62 : 0.92);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
      ctx.fill();
  }
  ctx.restore();
}

interface LabelSpec {
  id: string;
  text: string;
  x: number;
  y: number;
  tier: 0 | 1 | 2 | 3;
  alpha: number;
  rank: number;
  order: number;
  dust: boolean;
}

function labelOpacity(band: CameraBand, names: boolean, emphasized: boolean, dust: boolean): number {
  if (emphasized) return 1;
  if (dust) return 0.94;
  return names || band === "2" || band === "3" ? 0.94 : 0.8;
}

function drawWorldLabels(
  ctx: CanvasRenderingContext2D,
  labels: readonly LabelSpec[],
  fonts: CanvasFonts,
  hitTargets: CanvasHitTarget[],
): void {
  for (const style of ["dust", "big", "regular"] as const) {
    if (style === "dust") setFont(ctx, fonts.body, 12.5, "italic");
    else if (style === "big") setFont(ctx, fonts.display, 16, "normal", 1.28);
    else setFont(ctx, fonts.body, 14.5, "italic");
    for (const label of labels) {
      const labelStyle = label.dust ? "dust" : label.tier === 0 ? "big" : "regular";
      if (labelStyle !== style) continue;
      const width = drawOutlinedText(ctx, label.text, label.x, label.y, BONE, label.alpha);
      hitTargets.push({
        id: label.id,
        x: label.x,
        y: label.y,
        rect: {
          left: label.x - width / 2 - 4,
          right: label.x + width / 2 + 4,
          top: label.y - (label.dust ? 14 : 18),
          bottom: label.y + 5,
        },
        rank: label.rank,
        order: label.order,
      });
    }
  }
}

function drawContacts(
  ctx: CanvasRenderingContext2D,
  camera: CameraPose,
  band: CameraBand,
  scene: CanvasScene,
  viewport: CanvasViewport,
  fonts: CanvasFonts,
  fontsReady: boolean,
): CanvasHitTarget[] {
  const hitTargets: CanvasHitTarget[] = [];
  const dustLabels: LabelSpec[] = [];
  const featuredLabels: LabelSpec[] = [];
  const looks = dustLooks(scene.payload);
  const compact = viewport.width <= 900;
  let order = 0;

  if (!scene.worksOnly && !scene.dustOff) {
    scene.payload.dust.forEach(([gx, gy, ci, id, name], index) => {
      if (scene.hiddenCls.has(ci)) return;
      const x = camera.tx + gx * camera.k;
      const y = camera.ty + gy * camera.k;
      if (!inViewport(x, y, viewport)) return;
      const selected = scene.selectedWorld?.id === id;
      const hi = scene.hiIds?.has(id) ?? false;
      const emphasized = selected || hi;
      const parentAlpha = scene.names || band === "3" ? 1 : 0.6;
      const routeAlpha = scene.routeDim ? (hi ? 0.07 : 0.07 * 0.12) : 1;
      const alpha = parentAlpha * routeAlpha;
      const look = looks[index];
      ctx.fillStyle = BONE;
      ctx.globalAlpha = alpha * look.op;
      ctx.beginPath();
      ctx.arc(x, y, look.r * (selected ? 1.35 : 1), 0, Math.PI * 2);
      ctx.fill();
      const rank = selected ? 4 : hi ? 3 : 1;
      order += 1;
      if (fontsReady && mobileLabelVisible(3, band, scene.names, emphasized, compact)) {
        dustLabels.push({
          id,
          text: name,
          x,
          y: y - 10,
          tier: 3,
          alpha: labelOpacity(band, scene.names, emphasized, true) * alpha,
          rank,
          order: order++,
          dust: true,
        });
      }
    });
  }
  if (fontsReady) drawWorldLabels(ctx, dustLabels, fonts, hitTargets);

  for (const world of scene.payload.featured) {
    if (world.kind === "region" || scene.hiddenCls.has(world.c)) continue;
    const x = camera.tx + world.gx * camera.k;
    const y = camera.ty + world.gy * camera.k;
    if (!inViewport(x, y, viewport)) continue;
    const selected = scene.selectedWorld?.id === world.id;
    const hi = scene.hiIds?.has(world.id) ?? false;
    const emphasized = selected || hi;
    const alpha = scene.routeDim && !hi ? 0.12 : 1;
    drawGlyph(ctx, world.kind, x, y, pinSize(world.n), alpha, selected ? 1.35 : 1);
    const rank = selected ? 4 : hi ? 3 : 2;
    order += 1;
    const tier = labelTier(world.n);
    if (fontsReady && mobileLabelVisible(tier, band, scene.names, emphasized, compact)) {
      featuredLabels.push({
        id: world.id,
        text: world.name,
        x,
        y: y - 14,
        tier,
        alpha: labelOpacity(band, scene.names, emphasized, false) * alpha,
        rank,
        order: order++,
        dust: false,
      });
    }
  }
  if (fontsReady) drawWorldLabels(ctx, featuredLabels, fonts, hitTargets);

  if (fontsReady) {
    for (const region of scene.payload.regions) {
      const x = camera.tx + region.gx * camera.k;
      const y = camera.ty + region.gy * camera.k;
      if (!inViewport(x, y, viewport)) continue;
      const id = region.fi >= 0 ? scene.payload.featured[region.fi]?.id : undefined;
      const selected = id !== undefined && scene.selectedWorld?.id === id;
      const alpha = scene.routeDim ? 0.22 : 1;
      setFont(ctx, fonts.body, 14.5, "italic", 4);
      const text = region.name.toUpperCase();
      const width = drawOutlinedText(ctx, text, x, y, GOLD, (selected ? 1 : 0.45) * alpha, 0.85);
      if (id) {
        const rank = selected ? 4 : 2;
        hitTargets.push({
          id,
          x,
          y,
          rect: {
            left: x - width / 2 - 6,
            right: x + width / 2 + 6,
            top: y - 18,
            bottom: y + 6,
          },
          radius: PICK_RADIUS,
          rank,
          order: order++,
        });
      }
    }
  }
  ctx.globalAlpha = 1;
  return hitTargets;
}

interface CachedRouteGeometry {
  firstEntry: Map<number, number>;
  firstVisit: Map<string, number>;
  samples: ({ x: number; y: number } | null)[][];
}

const routeGeometryCache = new WeakMap<ResolvedVoyage, CachedRouteGeometry>();

function routeGeometry(voyage: ResolvedVoyage): CachedRouteGeometry {
  let cached = routeGeometryCache.get(voyage);
  if (cached) return cached;
  const firstEntry = new Map<number, number>();
  const firstVisit = new Map<string, number>();
  for (const station of voyage.stations) {
    if (station.legIndex >= 0 && !firstEntry.has(station.legIndex)) firstEntry.set(station.legIndex, station.i);
    if (station.kind === "world" && !firstVisit.has(station.id)) firstVisit.set(station.id, station.i);
  }
  const samples = voyage.legs.map((leg) =>
    Array.from({ length: ROUTE_SAMPLES + 1 }, (_, index) => pointOnLeg(leg, index / ROUTE_SAMPLES)),
  );
  cached = { firstEntry, firstVisit, samples };
  routeGeometryCache.set(voyage, cached);
  return cached;
}

function routeState(scene: CanvasScene, now: number, geometry: CachedRouteGeometry) {
  const voyage = scene.activeVoyage;
  if (!voyage) return { fraction: () => 0, animating: false };
  let animating = false;
  const fraction = (legIndex: number) => {
    if (scene.voyageProgress === null) return 1;
    const entry = geometry.firstEntry.get(legIndex);
    if (entry === undefined || scene.voyageProgress < entry) return 0;
    if (scene.reduce || scene.voyageProgress > entry) return 1;
    const value = Math.max(0, Math.min(1, (now - scene.routeStartedAt) / ROUTE_REVEAL_MS));
    if (value < 1) animating = true;
    return value;
  };
  return { fraction, get animating() { return animating; } };
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  camera: CameraPose,
  scene: CanvasScene,
  fonts: CanvasFonts,
  fontsReady: boolean,
  now: number,
): boolean {
  const voyage = scene.activeVoyage;
  if (!voyage || voyage.legs.length === 0) return false;
  const geometry = routeGeometry(voyage);
  const state = routeState(scene, now, geometry);
  ctx.save();
  mapTransform(ctx, camera);
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1.7 / camera.k;
  ctx.lineCap = "round";
  ctx.setLineDash([2.2 / camera.k, 5.4 / camera.k]);
  voyage.legs.forEach((leg, legIndex) => {
    const fraction = state.fraction(legIndex);
    if (fraction <= 0) return;
    if (fraction >= 1) {
      ctx.stroke(cachedPath(leg));
      return;
    }
    const samples = geometry.samples[legIndex] ?? [];
    const scaled = ROUTE_SAMPLES * fraction;
    const whole = Math.floor(scaled);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= whole; i += 1) {
      const point = samples[i];
      if (!point) continue;
      if (!started) {
        ctx.moveTo(point.x, point.y);
        started = true;
      }
      else ctx.lineTo(point.x, point.y);
    }
    const a = samples[whole];
    const b = samples[whole + 1];
    if (whole < ROUTE_SAMPLES && a && b) {
      const mix = scaled - whole;
      const x = a.x + (b.x - a.x) * mix;
      const y = a.y + (b.y - a.y) * mix;
      if (!started) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  ctx.setLineDash([]);

  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 0.8 / camera.k;
  for (const [, index] of geometry.firstVisit) {
    if (scene.voyageProgress !== null && scene.voyageProgress < index) continue;
    const station = voyage.stations[index];
    ctx.beginPath();
    ctx.arc(station.gx, station.gy, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(station.gx, station.gy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const station of voyage.stations) {
    if (station.kind !== "way") continue;
    if (scene.voyageProgress !== null && scene.voyageProgress < station.i) continue;
    ctx.setLineDash([1.4 / camera.k, 2 / camera.k]);
    ctx.beginPath();
    ctx.arc(station.gx, station.gy, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(station.gx, station.gy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  if (
    fontsReady &&
    (scene.voyageProgress === null || scene.voyageProgress >= voyage.stations.length - 1)
  ) {
    setFont(ctx, fonts.mono, 9, "normal", 2.16);
    ctx.fillStyle = GOLD;
    ctx.globalAlpha = 0.85;
    ctx.fillText(voyage.lbl.t, voyage.lbl.x, voyage.lbl.y);
  }
  ctx.restore();
  return state.animating;
}

function terraTickPaths(): NonNullable<typeof cachedTerraTicks> {
  if (cachedTerraTicks) return cachedTerraTicks;
  const major = new Path2D();
  const minor = new Path2D();
  for (let index = 0; index < 48; index += 1) {
    const angle = (Math.PI * 2 * index) / 48;
    const inner = index % 4 === 0 ? 23 : 25.5;
    const path = index % 4 === 0 ? major : minor;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    path.moveTo(cos * inner, sin * inner);
    path.lineTo(cos * 27, sin * 27);
  }
  cachedTerraTicks = { major, minor };
  return cachedTerraTicks;
}

function drawTerraInstrument(
  ctx: CanvasRenderingContext2D,
  camera: CameraPose,
  viewport: CanvasViewport,
): void {
  const screenX = camera.tx + TX * camera.k;
  const screenY = camera.ty + TY * camera.k;
  const extent = 35 * camera.k + 4;
  if (
    screenX + extent < 0 ||
    screenX - extent > viewport.width ||
    screenY + extent < 0 ||
    screenY - extent > viewport.height
  ) {
    return;
  }
  const ticks = terraTickPaths();
  ctx.save();
  mapTransform(ctx, camera);
  ctx.translate(TX, TY);
  ctx.lineWidth = 1 / camera.k;
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.3;
  ctx.stroke(ticks.minor);
  ctx.globalAlpha = 0.55;
  ctx.stroke(ticks.major);
  ctx.globalAlpha = 0.4;
  ctx.setLineDash([2.5 / camera.k, 3.5 / camera.k]);
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([1.5 / camera.k, 3 / camera.k]);
  ctx.strokeStyle = BONE;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.ellipse(0, 0, 33, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(19, 0, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BONE;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(27, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = BONE;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.moveTo(0, -4);
  ctx.lineTo(0, 4);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.5;
  for (const [x, y] of [[12, -14], [-16, 9]] as const) {
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSelection(
  ctx: CanvasRenderingContext2D,
  camera: CameraPose,
  world: FeaturedWorld | null,
): void {
  if (!world) return;
  const point = worldToLocal(camera, world.gx, world.gy);
  const count = Math.min(world.n, 24);
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 0.7;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    ctx.moveTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
    ctx.lineTo(Math.cos(angle) * 22, Math.sin(angle) * 22);
  }
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.9;
  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, count);
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * 16, Math.sin(angle) * 16, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCanvasScene(
  ctx: CanvasRenderingContext2D,
  camera: CameraPose,
  band: CameraBand,
  scene: CanvasScene,
  viewport: CanvasViewport,
  fonts: CanvasFonts,
  fontsReady: boolean,
  now: number,
): CanvasDrawResult {
  drawGrid(ctx, camera);
  drawLumenNihilus(ctx, camera, scene, viewport, fonts, fontsReady);
  drawPolar(ctx, camera);
  if (fontsReady) drawSegmentumNames(ctx, camera, fonts, scene.routeDim ? 0.22 : 1);
  drawZones(ctx, camera, scene, viewport, fonts, fontsReady);
  const hitTargets = drawContacts(ctx, camera, band, scene, viewport, fonts, fontsReady);
  const routeAnimating = drawRoute(ctx, camera, scene, fonts, fontsReady, now);
  drawTerraInstrument(ctx, camera, viewport);
  drawSelection(ctx, camera, scene.selectedWorld);
  ctx.globalAlpha = 1;
  return { hitTargets, routeAnimating };
}
