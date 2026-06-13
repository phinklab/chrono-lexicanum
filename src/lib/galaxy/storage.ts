// LocalStorage for tweaks, active era, and per-era data snapshots.
// SSR-safe: every entry point guards `typeof window`.
//
// Report 144 § T.3: localStorage is a TRUST BOUNDARY — anything here can be
// edited by the user (or a future XSS-class bug), so blobs are validated with
// zod `safeParse` instead of being cast with `as Partial<…>`. Validation is
// still *lenient in effect*: a malformed blob falls back to defaults (per
// layer for the element snapshots) rather than throwing. The schemas must stay
// in sync with `./types`; the `satisfies`-style assignments below make a drift
// a compile error.

import { z } from "zod";
import { DEFAULT_TWEAKS, makeDefaultGalaxyData } from "./data";
import { DEFAULT_ERA } from "./eras";
import type { EraId, GalaxyData, Tweaks } from "./types";

const LS_TWEAKS = "40k.galaxy.tweaks.v1";
const LS_ELEMENTS_BASE = "40k.galaxy.elements.v1";
const LS_ERA = "40k.galaxy.era.v1";

// ── Schemas (mirror ./types — keep in sync) ─────────────────────────────────

const tweaksSchema = z
  .object({
    theme: z.enum(["mechanicus", "astropath"]),
    factionFilter: z.enum(["all", "imperium", "chaos", "xenos"]),
    riftPattern: z.enum([
      "strict-square",
      "strict-square-dense",
      "strict-brick",
      "triangular",
      "mega-dense",
    ]),
    astronomican: z.boolean(),
    editWarps: z.boolean(),
    addMode: z.boolean(),
    outerObscurus: z.number().finite(),
    outerUltima: z.number().finite(),
    outerTempestus: z.number().finite(),
    outerPacificus: z.number().finite(),
    boundaryNE: z.number().finite(),
    boundarySE: z.number().finite(),
    boundarySW: z.number().finite(),
    boundaryNW: z.number().finite(),
  })
  .partial();

const polarSchema = z.tuple([z.number().finite(), z.number().finite()]);

const worldKindSchema = z.enum([
  "throne",
  "astartes",
  "fortress",
  "forge",
  "hive",
  "death",
  "war",
  "dead",
  "warp",
  "shrine",
  "civilised",
  "xenos",
  "chaos",
  "necron",
  "tyranid",
]);

const factionSchema = z.enum([
  "imperium",
  "chaos",
  "xenos",
  "necron",
  "tyranid",
  "neutral",
]);

const segmentumIdSchema = z.enum([
  "solar",
  "obscurus",
  "ultima",
  "tempestus",
  "pacificus",
]);

const landmarkSchema = z.object({
  id: z.string(),
  name: z.string(),
  r: z.number().finite(),
  a: z.number().finite(),
  kind: worldKindSchema,
  faction: factionSchema,
  segment: segmentumIdSchema,
});

const nebulaSchema = z.object({
  name: z.string(),
  r: z.number().finite().optional(),
  a: z.number().finite().optional(),
  size: z.number().finite().optional(),
  type: z.enum(["warp", "forbidden"]).optional(),
  color: z.string(),
  isRift: z.boolean().optional(),
});

const densitySchema = z.enum(["high", "mid", "low"]);

const necronDynastySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  density: densitySchema,
  pts: z.array(polarSchema),
});

const tyranidSwarmSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  density: densitySchema,
  pts: z.array(polarSchema),
});

// Dynasties removed from the canon map (Philipp, Session 150). /map hydrates
// element snapshots from localStorage (persistence is read-only since the
// 2026-05-27 demo lock), so deleting them from NECRON_DYNASTIES_BASE alone
// would leave them alive in any browser that ever saved a snapshot — the
// loader filters these ids out of whatever it parses.
const RETIRED_NECRON_IDS = new Set(["mephrit", "nihilakh"]);

// ── localStorage plumbing ───────────────────────────────────────────────────

function eraSlot(eraId: EraId): string {
  return `${LS_ELEMENTS_BASE}.${eraId}`;
}

function lsGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota / privacy mode */
  }
}

function lsRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function loadTweaks(): Tweaks {
  const raw = lsGet(LS_TWEAKS);
  if (!raw) return { ...DEFAULT_TWEAKS };
  try {
    const result = tweaksSchema.safeParse(JSON.parse(raw));
    if (!result.success) return { ...DEFAULT_TWEAKS };
    // Compile-time sync guard: schema output must stay a valid Tweaks patch.
    const patch: Partial<Tweaks> = result.data;
    return { ...DEFAULT_TWEAKS, ...patch };
  } catch {
    return { ...DEFAULT_TWEAKS };
  }
}

export function saveTweaks(t: Tweaks): void {
  lsSet(LS_TWEAKS, JSON.stringify(t));
}

export function loadEra(): EraId | null {
  const raw = lsGet(LS_ERA);
  if (!raw) return null;
  if (raw === "m31-horus-heresy" || raw === "m41-imperium" || raw === "m42-indomitus") {
    return raw;
  }
  return null;
}

export function saveEra(era: EraId): void {
  lsSet(LS_ERA, era);
}

export function loadElementsFor(eraId: EraId): GalaxyData {
  const raw = lsGet(eraSlot(eraId));
  if (!raw) return makeDefaultGalaxyData();
  try {
    const def = makeDefaultGalaxyData();
    // Zod outputs mutable tuples; the `Polar` points are readonly tuples —
    // rebuild them mutably for the `.catch` defaults (fresh copies anyway).
    const mutablePts = (pts: readonly (readonly [number, number])[]) =>
      pts.map(([r, a]): [number, number] => [r, a]);
    // Per-layer `.catch` keeps the old granularity: one corrupt layer falls
    // back to its default without nuking the other (user-edited) layers. The
    // defaults are fresh clones per call, so cached schema instances would
    // share mutable state — build the snapshot schema per invocation.
    const snapshotSchema = z.object({
      landmarks: z.array(landmarkSchema).catch(def.landmarks),
      nebulae: z.array(nebulaSchema).catch(def.nebulae),
      cicatrix: z.array(polarSchema).catch(mutablePts(def.cicatrix)),
      necron: z
        .array(necronDynastySchema)
        .catch(def.necron.map((d) => ({ ...d, pts: mutablePts(d.pts) }))),
      tyranid: z
        .array(tyranidSwarmSchema)
        .catch(def.tyranid.map((s) => ({ ...s, pts: mutablePts(s.pts) }))),
    });
    const result = snapshotSchema.safeParse(JSON.parse(raw));
    if (!result.success) return def;
    const data: GalaxyData = result.data;
    return {
      ...data,
      necron: data.necron.filter((d) => !RETIRED_NECRON_IDS.has(d.id)),
    };
  } catch {
    return makeDefaultGalaxyData();
  }
}

export function saveElementsFor(eraId: EraId, data: GalaxyData): void {
  lsSet(eraSlot(eraId), JSON.stringify(data));
}

export function clearElementsFor(eraId: EraId): void {
  lsRemove(eraSlot(eraId));
}

// Legacy single-key save (pre-multi-era) → migrate into the default era's
// slot once, then drop the old key. No-op if a per-era slot already exists.
export function migrateLegacyKey(): void {
  if (typeof window === "undefined") return;
  const legacy = lsGet(LS_ELEMENTS_BASE);
  if (!legacy || legacy[0] !== "{") return;
  if (lsGet(eraSlot(DEFAULT_ERA))) return;
  lsSet(eraSlot(DEFAULT_ERA), legacy);
  lsRemove(LS_ELEMENTS_BASE);
}
