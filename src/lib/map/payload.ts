/**
 * payload.ts — the compact one-shot client payload for the Cartographer.
 * Built server-side from the validated catalog and passed as a
 * page prop; the client never sees the raw ~1 MB file.
 *
 * Shape: the 70
 * primary classifications become an indexed list, dust worlds collapse to
 * coordinate triples, featured worlds keep their full work lists (largest is
 * Terra at ~196 — the world panel scrolls internally).
 *
 * Coverage comes from `coverage` verbatim — NEVER sum `worlds[].works`
 * (duplicate pins + rollups double-count, see map-worlds-schema.ts).
 */

import { getBlurb } from "../blurbs";
import {
  MAP_WORLD_KINDS,
  type MapWorldKind,
  type MapWorldWork,
  type MapWorldsFile,
} from "./map-worlds-schema";

/** A world with ≥1 linked work — rendered as a full pin (or region label). */
export interface FeaturedWorld {
  id: string;
  name: string;
  kind: MapWorldKind;
  /** Index into `MapPayload.cls`; -1 for region pins. */
  c: number;
  /** Secondary classification verbatim, where the SSOT sets one. */
  c2?: string;
  /** Tertiary classification — see TERTIARY below. */
  c3?: string;
  gx: number;
  gy: number;
  /** Segmentum short name ("Solar", "Ultima", …). */
  seg?: string;
  /** Work count (= works.length, precomputed for sizing/tiering). */
  n: number;
  works: MapWorldWork[];
  /** locations.json id → /welt/{loc}. */
  loc?: string;
  /** Curated one-sentence blurb (location-blurbs.json via locationId).
   *  Absent = none curated yet — the panel shows the "empty" filler. */
  blurb?: string;
}

/** Region curation pin (kind=region) — rendered as area typography. */
export interface RegionPin {
  name: string;
  gx: number;
  gy: number;
  /** Index into `MapPayload.featured` (regions carry works), or -1. */
  fi: number;
}

/** Dust world (no linked works, but clickable like every contact):
 *  [gx, gy, clsIndex, id, name, segIndex(-1 = none)]. */
export type DustWorld = [number, number, number, string, string, number];

export interface MapPayload {
  /** The 12 kind groups (index space for `clsKind`). */
  kinds: readonly MapWorldKind[];
  /** Primary classifications of non-region worlds, frequency desc. */
  cls: string[];
  /** Kind index per `cls` entry (classification → group). */
  clsKind: number[];
  /** Segmentum names (index space for the dust tuples). */
  segs: string[];
  featured: FeaturedWorld[];
  regions: RegionPin[];
  dust: DustWorld[];
  /** Placed/total media edges — the legend's "1332 / 1685 records placed". */
  coverage: { placed: number; total: number };
  /** Total catalog worlds ("1 054 contacts"). */
  contacts: number;
  /** Featured count incl. region pins ("154 recorded"). */
  recorded: number;
}

/**
 * Tertiary classifications. The SSOT Excel carries 4 tertiary rows; the
 * convert drops the column deliberately, and only ONE of the four
 * is a linked world today. Kept as a literal
 * until the convert ever grows a `classification3`.
 */
const TERTIARY: Readonly<Record<string, string>> = {
  vigilus: "Genestealer Infested",
};

export function buildMapPayload(file: MapWorldsFile): MapPayload {
  // Classification index: every non-region world's primary classification,
  // ordered by frequency desc (ties alphabetically, deterministic).
  const clsCount = new Map<string, number>();
  const clsKindName = new Map<string, MapWorldKind>();
  for (const w of file.worlds) {
    if (w.kind === "region") continue;
    const c = w.classification ?? "Unclassified";
    clsCount.set(c, (clsCount.get(c) ?? 0) + 1);
    if (!clsKindName.has(c)) clsKindName.set(c, w.kind);
  }
  const cls = [...clsCount.keys()].sort((a, b) => {
    const d = (clsCount.get(b) ?? 0) - (clsCount.get(a) ?? 0);
    return d !== 0 ? d : a.localeCompare(b);
  });
  const clsIndex = new Map<string, number>(cls.map((c, i) => [c, i]));
  const clsKind = cls.map((c) => MAP_WORLD_KINDS.indexOf(clsKindName.get(c) ?? "unclassified"));

  const segs: string[] = [];
  const segIndex = (s: string | null): number => {
    if (!s) return -1;
    const i = segs.indexOf(s);
    if (i >= 0) return i;
    segs.push(s);
    return segs.length - 1;
  };

  const featured: FeaturedWorld[] = [];
  const regions: RegionPin[] = [];
  const dust: DustWorld[] = [];
  for (const w of file.worlds) {
    if (w.works.length > 0) {
      const fw: FeaturedWorld = {
        id: w.id,
        name: w.name,
        kind: w.kind,
        c: w.kind === "region" ? -1 : (clsIndex.get(w.classification ?? "Unclassified") ?? -1),
        gx: w.gx,
        gy: w.gy,
        n: w.works.length,
        works: w.works,
      };
      if (w.classification2) fw.c2 = w.classification2;
      const c3 = TERTIARY[w.id];
      if (c3) fw.c3 = c3;
      if (w.segmentum) fw.seg = w.segmentum;
      if (w.locationId) {
        fw.loc = w.locationId;
        const blurb = getBlurb("location", w.locationId);
        if (blurb) fw.blurb = blurb.text;
      }
      if (w.kind === "region") {
        regions.push({ name: w.name, gx: w.gx, gy: w.gy, fi: featured.length });
      }
      featured.push(fw);
    } else if (w.kind === "region") {
      regions.push({ name: w.name, gx: w.gx, gy: w.gy, fi: -1 });
    } else {
      dust.push([
        w.gx,
        w.gy,
        clsIndex.get(w.classification ?? "Unclassified") ?? 0,
        w.id,
        w.name,
        segIndex(w.segmentum),
      ]);
    }
  }

  return {
    kinds: MAP_WORLD_KINDS,
    cls,
    clsKind,
    segs,
    featured,
    regions,
    dust,
    coverage: { placed: file.coverage.placedWorkEdges, total: file.coverage.totalWorkEdges },
    contacts: file.worlds.length,
    recorded: featured.length,
  };
}
