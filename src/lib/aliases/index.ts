/**
 * Shared alias module — Surface-Form ⇄ Canonical-Entity for the App layer.
 *
 * One asset, two consumers:
 *
 *   1. Drift classification (audit cockpit) — `classifyDrift` decides whether
 *      a junction's stored `rawName` is an *expected* edition-rename ("known
 *      alias") or *suspicious* drift. The decision is **entity-exact**: a
 *      `rawName` only counts as a known alias when its registered alias target
 *      equals the canonical id the junction actually resolved to. A registered
 *      alias that points at a *different* entity stays suspicious drift (a
 *      real mis-resolve worth surfacing).
 *
 *   2. Search resolution (contract; not yet wired into a UI) —
 *      `resolveSurfaceForm` maps a free-text query to canonical entit(y|ies),
 *      case-insensitively, against both the alias keys AND the canonical
 *      display names, so "Imperial Guard" and "astra militarum" both find
 *      `astra_militarum`.
 *
 * SSOT: the existing `scripts/seed-data/*-aliases.json` (surface-form → id)
 * plus `scripts/seed-data/{factions,locations,characters}.json` (id → name).
 * Imported statically exactly like `src/lib/resolver/index.ts` does — no
 * second copy of the data, no runtime `fs`. `resolveJsonModule` bundles them
 * for Node scripts and Next.js server components alike. This module is pure
 * data + functions (no DB, no `server-only`), so the search half can later be
 * called from a client component too.
 */
import factionAliasesJson from "../../../scripts/seed-data/faction-aliases.json";
import locationAliasesJson from "../../../scripts/seed-data/location-aliases.json";
import characterAliasesJson from "../../../scripts/seed-data/character-aliases.json";
import factionsCanon from "../../../scripts/seed-data/factions.json";
import locationsCanon from "../../../scripts/seed-data/locations.json";
import charactersCanon from "../../../scripts/seed-data/characters.json";

export type AliasAxis = "faction" | "location" | "character";

export const ALIAS_AXES: readonly AliasAxis[] = ["faction", "location", "character"];

/** Surface-form (exact, case-sensitive key) → canonical id, per axis. */
const ALIAS_MAP: Record<AliasAxis, Readonly<Record<string, string>>> = {
  faction: factionAliasesJson as Record<string, string>,
  location: locationAliasesJson as Record<string, string>,
  character: characterAliasesJson as Record<string, string>,
};

interface CanonEntity {
  id: string;
  name: string;
}

/** Canonical reference rows (id + display name), per axis. */
const CANON: Record<AliasAxis, ReadonlyArray<CanonEntity>> = {
  faction: factionsCanon,
  location: locationsCanon,
  character: charactersCanon,
};

// Drift classification (entity-exact). Consumed by the audit read-path at
// src/app/book/[slug]/audit/page.tsx — one rule, one place.

export type DriftClass = "none" | "known-alias" | "drift";

/**
 * Classify one junction's stored `rawName` against the entity it resolved to.
 *
 * - `none`        — no `rawName`, or it already equals the canonical name.
 * - `known-alias` — `rawName` is a registered alias whose target **is** this
 *                   junction's `canonicalId` (an expected edition rename).
 * - `drift`       — anything else, including a `rawName` that is a registered
 *                   alias of a *different* entity (a suspicious mis-resolve).
 *
 * The alias-key match is exact / case-sensitive: the stored `rawName` is the
 * very key that produced the resolution, so no normalization on this path.
 */
export function classifyDrift(
  axis: AliasAxis,
  rawName: string | null | undefined,
  canonicalId: string,
  canonicalName: string,
): DriftClass {
  if (rawName == null || rawName === "" || rawName === canonicalName) return "none";
  if (ALIAS_MAP[axis][rawName] === canonicalId) return "known-alias";
  return "drift";
}

// Search resolution contract.

export interface AliasResolution {
  axis: AliasAxis;
  canonicalId: string;
  /** how the query matched: a registered alias key, or the canonical name. */
  matchedVia: "alias" | "canonical-name";
  /** the original-cased string that matched (alias key or canonical name). */
  surfaceForm: string;
}

export interface AliasEntry {
  axis: AliasAxis;
  surfaceForm: string;
  canonicalId: string;
}

/** List registered alias keys for UI search indexes without duplicating the JSON imports. */
export function listAliasEntries(axis: AliasAxis): AliasEntry[] {
  return Object.entries(ALIAS_MAP[axis]).map(([surfaceForm, canonicalId]) => ({
    axis,
    surfaceForm,
    canonicalId,
  }));
}

/**
 * Normalize a query for case-insensitive matching. Trim + lowercase only —
 * deliberately conservative. Diacritic / punctuation folding (e.g. `T'au`)
 * is left to the search wiring; this module fixes only the contract, not the
 * final normalization rules.
 */
export function normalizeQuery(s: string): string {
  return s.trim().toLowerCase();
}

// normalized string → resolutions, built once at module-init from BOTH the
// alias keys and the canonical names across all three axes.
const RESOLUTION_INDEX: ReadonlyMap<string, AliasResolution[]> = (() => {
  const index = new Map<string, AliasResolution[]>();
  const add = (key: string, res: AliasResolution): void => {
    const norm = normalizeQuery(key);
    if (norm === "") return;
    const bucket = index.get(norm);
    if (bucket === undefined) {
      index.set(norm, [res]);
      return;
    }
    // Dedupe by (axis, canonicalId). Alias keys are inserted before canonical
    // names, so an exact alias match keeps the slot.
    if (!bucket.some((r) => r.axis === res.axis && r.canonicalId === res.canonicalId)) {
      bucket.push(res);
    }
  };
  for (const axis of ALIAS_AXES) {
    for (const [surfaceForm, canonicalId] of Object.entries(ALIAS_MAP[axis])) {
      add(surfaceForm, { axis, canonicalId, matchedVia: "alias", surfaceForm });
    }
  }
  for (const axis of ALIAS_AXES) {
    for (const entity of CANON[axis]) {
      add(entity.name, {
        axis,
        canonicalId: entity.id,
        matchedVia: "canonical-name",
        surfaceForm: entity.name,
      });
    }
  }
  return index;
})();

/**
 * Resolve a free-text surface form to canonical entit(y|ies).
 *
 * Case-insensitive (via `normalizeQuery`) against both alias keys and
 * canonical display names. Returns ALL distinct `(axis, canonicalId)` matches:
 * a surface form can be ambiguous across axes (or, rarely, within one after
 * case-folding), so the contract is intentionally a list, not a single value.
 * Empty / whitespace / unknown query → `[]`.
 *
 * @param query the user-typed search string.
 * @param axes  restrict to these axes (default: all three).
 */
export function resolveSurfaceForm(
  query: string,
  axes: readonly AliasAxis[] = ALIAS_AXES,
): AliasResolution[] {
  const hits = RESOLUTION_INDEX.get(normalizeQuery(query));
  if (hits === undefined) return [];
  if (axes.length === ALIAS_AXES.length) return [...hits];
  const allow = new Set(axes);
  return hits.filter((h) => allow.has(h.axis));
}
