/**
 * hash.ts — shareable URL state for the Cartographer (Brief 178).
 * Format: `#world=<worldId>&cam=<gx>,<gy>,<kr>` — camera as grid-space center
 * plus zoom RELATIVE to the fit scale (`kr = k / k0`), so a link restores the
 * same framing on a different viewport.
 *
 * Same mechanics as the retired galaxy share helper: merge-patch semantics,
 * `history.replaceState` (no history spam), one trailing write per 80 ms.
 */

export interface MapCam {
  gx: number;
  gy: number;
  kr: number;
}

export interface MapHashState {
  world: string | null;
  cam: MapCam | null;
}

export function parseMapHash(): MapHashState {
  const out: MapHashState = { world: null, cam: null };
  if (typeof window === "undefined") return out;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return out;
  const params = new URLSearchParams(hash);
  const world = params.get("world");
  if (world) out.world = world;
  const cam = params.get("cam");
  if (cam) {
    const parts = cam.split(",").map(Number);
    if (parts.length === 3 && parts.every((p) => Number.isFinite(p)) && parts[2] > 0) {
      out.cam = { gx: parts[0], gy: parts[1], kr: parts[2] };
    }
  }
  return out;
}

export interface MapHashPatch {
  world?: string | null;
  cam?: MapCam | null;
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;
let pending: MapHashState | null = null;

export function writeMapHash(patch: MapHashPatch): void {
  if (typeof window === "undefined") return;
  const base = pending ?? parseMapHash();
  if (patch.world !== undefined) base.world = patch.world;
  if (patch.cam !== undefined) base.cam = patch.cam;
  pending = base;

  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    writeTimer = null;
    const state = pending;
    pending = null;
    if (!state) return;
    const params = new URLSearchParams();
    if (state.world) params.set("world", state.world);
    if (state.cam) {
      params.set(
        "cam",
        `${state.cam.gx.toFixed(1)},${state.cam.gy.toFixed(1)},${state.cam.kr.toFixed(2)}`,
      );
    }
    const qs = params.toString();
    // URLSearchParams percent-encodes "," — decode for a readable hash.
    const hash = qs ? "#" + decodeURIComponent(qs) : "";
    const newUrl = window.location.pathname + window.location.search + hash;
    try {
      window.history.replaceState(null, "", newUrl);
    } catch {
      // Some embedded contexts refuse replaceState — sharing degrades, the map works.
    }
  }, 80);
}
