// LocalStorage for tweaks, active era, and per-era data snapshots.
// SSR-safe: every entry point guards `typeof window`. Schema-validation is
// lenient (matches the prototype) — if a saved blob is malformed we fall back
// to defaults rather than throwing.

import { DEFAULT_TWEAKS, makeDefaultGalaxyData } from "./data";
import { DEFAULT_ERA } from "./eras";
import type { EraId, GalaxyData, Tweaks } from "./types";

const LS_TWEAKS = "40k.galaxy.tweaks.v1";
const LS_ELEMENTS_BASE = "40k.galaxy.elements.v1";
const LS_ERA = "40k.galaxy.era.v1";

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

export function loadTweaks(): Tweaks {
  const raw = lsGet(LS_TWEAKS);
  if (!raw) return { ...DEFAULT_TWEAKS };
  try {
    const parsed = JSON.parse(raw) as Partial<Tweaks>;
    return { ...DEFAULT_TWEAKS, ...parsed };
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
    const parsed = JSON.parse(raw) as Partial<GalaxyData>;
    const def = makeDefaultGalaxyData();
    return {
      landmarks: Array.isArray(parsed.landmarks) ? parsed.landmarks : def.landmarks,
      nebulae: Array.isArray(parsed.nebulae) ? parsed.nebulae : def.nebulae,
      cicatrix: Array.isArray(parsed.cicatrix) ? parsed.cicatrix : def.cicatrix,
      necron: Array.isArray(parsed.necron) ? parsed.necron : def.necron,
      tyranid: Array.isArray(parsed.tyranid) ? parsed.tyranid : def.tyranid,
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
