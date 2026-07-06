/**
 * load-map-worlds.ts — server/build-time loader for the committed map catalog
 * `scripts/seed-data/map-worlds.json` (map-worlds-v2, Briefs 174/183; consumed
 * by the Cartographer rebuild, Brief 178).
 *
 * Direct JSON import (repo precedent: lib/ask, lib/blurbs) — the catalog is
 * bundled into the server build, no DB and no fs read involved. Validated
 * exactly once per process, then memoized.
 *
 * ⚠ Server-only. Never import this from a `"use client"` component — the raw
 * catalog is ~1 MB; the client gets the stripped payload from `payload.ts`
 * via the /map page props instead.
 */

import mapWorldsJson from "../../../scripts/seed-data/map-worlds.json";
import { validateMapWorlds, type MapWorldsFile } from "./map-worlds-schema";

let cached: MapWorldsFile | null = null;

export function loadMapWorlds(): MapWorldsFile {
  if (cached) return cached;
  const raw: unknown = mapWorldsJson;
  const errors = validateMapWorlds(raw);
  if (errors.length > 0) {
    throw new Error(
      `map-worlds.json failed validation (${errors.length} error${errors.length === 1 ? "" : "s"}):\n` +
        errors.slice(0, 10).join("\n"),
    );
  }
  cached = raw as MapWorldsFile;
  return cached;
}
