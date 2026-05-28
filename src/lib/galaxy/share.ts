// URL-hash sharing — drop-in port of public/lab/cartographer-prototype/galaxy-share.js.
// Hash format: #era=<id>&view=<segId|galaxy>&world=<worldId>
// `view=galaxy` is the default and is stripped from the URL.

import type { EraId, GalaxyView, HashPatch, SegmentumId } from "./types";

const KEYS = ["era", "view", "world"] as const;
type Key = (typeof KEYS)[number];

interface ParsedHash {
  era?: EraId;
  view?: GalaxyView;
  world?: string;
}

const SEG_IDS: ReadonlySet<SegmentumId> = new Set<SegmentumId>([
  "solar",
  "obscurus",
  "ultima",
  "tempestus",
  "pacificus",
]);

const ERA_IDS: ReadonlySet<EraId> = new Set<EraId>([
  "m31-horus-heresy",
  "m41-imperium",
  "m42-indomitus",
]);

function isEraId(v: string): v is EraId {
  return ERA_IDS.has(v as EraId);
}

function isView(v: string): v is GalaxyView {
  return v === "galaxy" || SEG_IDS.has(v as SegmentumId);
}

export function parseHash(): ParsedHash {
  if (typeof window === "undefined") return {};
  const out: ParsedHash = {};
  const h = (window.location.hash || "").replace(/^#/, "");
  if (!h) return out;
  for (const pair of h.split("&")) {
    const [k, v] = pair.split("=");
    if (!k || v === undefined) continue;
    if (!KEYS.includes(k as Key)) continue;
    const decoded = decodeURIComponent(v);
    if (k === "era" && isEraId(decoded)) out.era = decoded;
    else if (k === "view" && isView(decoded)) out.view = decoded;
    else if (k === "world") out.world = decoded;
  }
  return out;
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;

// Merge a partial patch into the current hash. ReplaceState — we don't want
// the back button to navigate every dive/zoom. Debounced 80ms because view +
// world can change rapidly during dive animations.
export function writeHash(patch: HashPatch): void {
  if (typeof window === "undefined") return;
  const cur = parseHash();
  const merged: Record<string, string | null | undefined> = {
    era: patch.era !== undefined ? patch.era : cur.era,
    view: patch.view !== undefined ? patch.view : cur.view,
    world: patch.world !== undefined ? patch.world : cur.world,
  };
  const parts: string[] = [];
  for (const k of KEYS) {
    const v = merged[k];
    if (v == null || v === "") continue;
    if (k === "view" && v === "galaxy") continue;
    parts.push(`${k}=${encodeURIComponent(v)}`);
  }
  const hash = parts.length ? "#" + parts.join("&") : "";
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    const newUrl = window.location.pathname + window.location.search + hash;
    try {
      window.history.replaceState(null, "", newUrl);
    } catch {
      /* file:// */
    }
  }, 80);
}

export async function copyShareLink(): Promise<boolean> {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch {
    return false;
  }
}
