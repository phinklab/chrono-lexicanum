/**
 * hash.ts — shareable URL state for the Cartographer.
 * Format: `#world=<worldId>&era=<pre|hh>&voyage=<voyageId>&cam=<gx>,<gy>,<kr>
 * &lumen=1&nihilus=1` — camera as grid-space center plus zoom RELATIVE to the
 * fit scale (`kr = k / k0`), so a link restores the same framing on a
 * different viewport. The chart edition (`era`) is only written off-default —
 * plain links stay the present chart. `voyage` restarts the Great Journey at
 * its overture; the id rides opaque here (this module stays free of the
 * voyage data), CartographerRoot validates it against the roster on restore.
 * The overlay flags (`lumen`, `nihilus` — Session 251, /now's
 * divided-galaxy link) are default-off instruments: written only when
 * raised, so plain links stay plain.
 *
 * Merge-patch semantics, `history.replaceState` (no history spam), one
 * trailing write per 80 ms.
 */

import { MAP_STATES, type MapState } from "./zones";

export interface MapCam {
  gx: number;
  gy: number;
  kr: number;
}

export interface MapHashState {
  world: string | null;
  era: MapState | null;
  voyage: string | null;
  cam: MapCam | null;
  lumen: boolean;
  nihilus: boolean;
}

/** Pure parse of a hash string (leading `#` optional) — the one parse logic
 *  for the app wrapper below and the node test suite. */
export function parseMapHashString(hash: string): MapHashState {
  const out: MapHashState = {
    world: null,
    era: null,
    voyage: null,
    cam: null,
    lumen: false,
    nihilus: false,
  };
  const raw = hash.replace(/^#/, "");
  if (!raw) return out;
  const params = new URLSearchParams(raw);
  const world = params.get("world");
  if (world) out.world = world;
  const era = params.get("era");
  if (era && (MAP_STATES as readonly string[]).includes(era)) {
    out.era = era as MapState;
  }
  const voyage = params.get("voyage");
  if (voyage) out.voyage = voyage;
  const cam = params.get("cam");
  if (cam) {
    const parts = cam.split(",").map(Number);
    if (parts.length === 3 && parts.every((p) => Number.isFinite(p)) && parts[2] > 0) {
      out.cam = { gx: parts[0], gy: parts[1], kr: parts[2] };
    }
  }
  // Overlay flags: strictly `=1` (anything else reads as off).
  out.lumen = params.get("lumen") === "1";
  out.nihilus = params.get("nihilus") === "1";
  return out;
}

export function parseMapHash(): MapHashState {
  if (typeof window === "undefined") {
    return {
      world: null,
      era: null,
      voyage: null,
      cam: null,
      lumen: false,
      nihilus: false,
    };
  }
  return parseMapHashString(window.location.hash);
}

export interface MapHashPatch {
  world?: string | null;
  era?: MapState | null;
  voyage?: string | null;
  cam?: MapCam | null;
  lumen?: boolean;
  nihilus?: boolean;
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pending: MapHashState | null = null;

export function writeMapHash(patch: MapHashPatch): void {
  if (typeof window === "undefined") return;
  const base = pending ?? parseMapHash();
  if (patch.world !== undefined) base.world = patch.world;
  if (patch.era !== undefined) base.era = patch.era;
  if (patch.voyage !== undefined) base.voyage = patch.voyage;
  if (patch.cam !== undefined) base.cam = patch.cam;
  if (patch.lumen !== undefined) base.lumen = patch.lumen;
  if (patch.nihilus !== undefined) base.nihilus = patch.nihilus;
  pending = base;

  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    const state = pending;
    pending = null;
    if (!state) return;
    const params = new URLSearchParams();
    if (state.world) params.set("world", state.world);
    // "now" is the default edition — a plain link must stay a plain link.
    if (state.era && state.era !== "now") params.set("era", state.era);
    if (state.voyage) params.set("voyage", state.voyage);
    if (state.cam) {
      params.set(
        "cam",
        `${state.cam.gx.toFixed(1)},${state.cam.gy.toFixed(1)},${state.cam.kr.toFixed(2)}`,
      );
    }
    // Default-off overlays: only a raised instrument reaches the URL.
    if (state.lumen) params.set("lumen", "1");
    if (state.nihilus) params.set("nihilus", "1");
    const qs = params.toString();
    // URLSearchParams percent-encodes "," — decode for a readable hash.
    const hash = qs ? "#" + decodeURIComponent(qs) : "";
    const newUrl = window.location.pathname + window.location.search + hash;
    try {
      // Preserve the CURRENT entry's state object: Next's router keeps its
      // restore data there, and the mobile back-guard tags its entry with
      // {cgGuard:true} — replacing with null would wipe both.
      window.history.replaceState(window.history.state, "", newUrl);
    } catch {
      // Some embedded contexts refuse replaceState — sharing degrades, the map works.
    }
  }, 80);
}
