/**
 * resolve-book-edges.ts — Brief 154. SHARED, PURE edge-derivation extracted
 * verbatim from `apply-override.ts` so the apply path AND the B11 book-reviewer
 * projection crystallize a book's `work_*` edges through ONE code path.
 *
 * Why extract (Brief 154 § "Read-only Eingang"): the reviewer projects each
 * book's *current* visible state DB-free and must match — edge for edge, role
 * for role — what `apply-override` writes. A parallel re-implementation would
 * silently drift (a different collapse, a missed skip) and the reviewer would
 * flag corrections the apply path never actually made. So the per-axis resolve
 * wrappers + the unresolved-drop helpers live here, imported by both sides.
 *
 * PURE: no `@/db`, no filesystem. The two skip helpers
 * (`decideFactionSkips` / `decideLocationSkips`) are already pure + exported;
 * their context (alignment map, redundant-id set, redundant surface forms) is
 * passed in by the caller, exactly as `apply-override` does.
 *
 * The composition mirrors `apply-override.ts` (Brief 077 faction-skip + Brief
 * 084 location-skip):
 *   factions   → resolveFactions → decideFactionSkips → `keep`   (→ work_factions)
 *   locations  → resolveLocations                                 (→ work_locations;
 *                decideLocationSkips is AUDIT-ONLY, work_locations is unaffected)
 *   characters → resolveCharacters                                (→ work_characters)
 */
import {
  resolveCharacter,
  resolveFaction,
  resolveLocation,
} from "@/lib/resolver";
import {
  CHARACTER_ROLE_PRIORITY,
  FACTION_ROLE_PRIORITY,
  normalizeCharacterRole,
  normalizeFactionRole,
  normalizeLocationRole,
} from "@/lib/resolver/roles";
import type {
  CharacterJunctionRole,
  FactionJunctionRole,
  LocationJunctionRole,
} from "@/lib/resolver/roles";
import {
  decideFactionSkips,
  type ResolvedFaction as SkipResolvedFaction,
  type SkipDecision,
} from "./apply-override-skip";
import {
  decideLocationSkips,
  type LocationSkipDecision,
} from "./apply-override-location-skip";

/** A surface form carried by an SSOT override block: `{ name, role }`. */
export interface SurfaceEntity {
  name: string;
  role: string;
}

/** A resolved junction edge: canonical id + normalized role + winning surface form. */
export interface ResolvedEdge<R extends string> {
  id: string;
  role: R;
  rawName: string;
}

/** The three surface-form axes of an override block. */
export interface OverrideAxes {
  factions: SurfaceEntity[];
  locations: SurfaceEntity[];
  characters: SurfaceEntity[];
}

/** Context for `decideFactionSkips` (Brief 077), loaded DB-free from seed/policy. */
export interface FactionSkipContext {
  redundantIds: Set<string>;
  alignmentById: Map<string, import("@/lib/seed/alignment").Alignment>;
}

/** Context for `decideLocationSkips` (Brief 084), loaded DB-free from policy. */
export interface LocationSkipContext {
  redundantSurfaceForms: ReadonlySet<string>;
}

/** Everything `apply-override` and the projection need from one book's axes. */
export interface ResolvedBookEdges {
  /** Post-skip factions — the rows written to `work_factions`. */
  keepFactions: ResolvedEdge<FactionJunctionRole>[];
  /** Resolved locations — the rows written to `work_locations` (skip is audit-only). */
  resolvedLocations: ResolvedEdge<LocationJunctionRole>[];
  /** Resolved characters — the rows written to `work_characters`. */
  resolvedCharacters: ResolvedEdge<CharacterJunctionRole>[];
  /** The faction skip decision (its `skippedSurfaceForms` feed the audit block). */
  factionSkip: SkipDecision;
  /** The location skip decision (its `skippedSurfaceForms` feed the audit block). */
  locationSkip: LocationSkipDecision;
}

/**
 * Resolve OverrideEntity surface forms to canonical IDs via the resolver
 * module. For factions, collapse multiple surface forms onto the same
 * canonical id and keep the highest-priority role (FACTION_ROLE_PRIORITY).
 * The retained rawName is the surface form that won the role contest —
 * giving the work_factions.raw_name audit column a deterministic value.
 */
export function resolveFactions(
  input: ReadonlyArray<SurfaceEntity>,
): ResolvedEdge<FactionJunctionRole>[] {
  const byId = new Map<string, { role: FactionJunctionRole; rawName: string }>();
  for (const f of input) {
    const r = resolveFaction(f.name);
    if (r.id === null) continue;
    const normalizedRole = normalizeFactionRole(f.role).role;
    if (normalizedRole === null) continue;
    const incomingPriority = FACTION_ROLE_PRIORITY[normalizedRole];
    const current = byId.get(r.id);
    const currentPriority = current
      ? FACTION_ROLE_PRIORITY[current.role]
      : -1;
    if (incomingPriority > currentPriority) {
      byId.set(r.id, { role: normalizedRole, rawName: f.name });
    }
  }
  return [...byId.entries()].map(([id, { role, rawName }]) => ({
    id,
    role,
    rawName,
  }));
}

/**
 * Resolve location surface forms. No role-priority table for locations today
 * — keep-first-wins on canonical-id collisions (a surface-form alias and the
 * canonical name collapsing onto the same id is the realistic case).
 */
export function resolveLocations(
  input: ReadonlyArray<SurfaceEntity>,
): ResolvedEdge<LocationJunctionRole>[] {
  const byId = new Map<string, { role: LocationJunctionRole; rawName: string }>();
  for (const l of input) {
    const r = resolveLocation(l.name);
    if (r.id === null) continue;
    const normalizedRole = normalizeLocationRole(l.role).role;
    if (normalizedRole === null) continue;
    if (!byId.has(r.id)) {
      byId.set(r.id, { role: normalizedRole, rawName: l.name });
    }
  }
  return [...byId.entries()].map(([id, { role, rawName }]) => ({
    id,
    role,
    rawName,
  }));
}

/**
 * Resolve character surface forms. Mirrors resolveFactions on the character
 * axis with CHARACTER_ROLE_PRIORITY (pov > appears > mentioned).
 */
export function resolveCharacters(
  input: ReadonlyArray<SurfaceEntity>,
): ResolvedEdge<CharacterJunctionRole>[] {
  const byId = new Map<string, { role: CharacterJunctionRole; rawName: string }>();
  for (const c of input) {
    const r = resolveCharacter(c.name);
    if (r.id === null) continue;
    const normalizedRole = normalizeCharacterRole(c.role).role;
    if (normalizedRole === null) continue;
    const incomingPriority = CHARACTER_ROLE_PRIORITY[normalizedRole];
    const current = byId.get(r.id);
    const currentPriority = current
      ? CHARACTER_ROLE_PRIORITY[current.role]
      : -1;
    if (incomingPriority > currentPriority) {
      byId.set(r.id, { role: normalizedRole, rawName: c.name });
    }
  }
  return [...byId.entries()].map(([id, { role, rawName }]) => ({
    id,
    role,
    rawName,
  }));
}

/** Surface forms on the faction axis that the resolver cannot crystallize. */
export function unresolvedFactions(
  input: ReadonlyArray<SurfaceEntity>,
): SurfaceEntity[] {
  return input
    .filter((f) => resolveFaction(f.name).id === null)
    .map((f) => ({ name: f.name, role: f.role }));
}

/** Surface forms on the location axis that the resolver cannot crystallize. */
export function unresolvedLocations(
  input: ReadonlyArray<SurfaceEntity>,
): SurfaceEntity[] {
  return input
    .filter((l) => resolveLocation(l.name).id === null)
    .map((l) => ({ name: l.name, role: l.role }));
}

/** Surface forms on the character axis that the resolver cannot crystallize. */
export function unresolvedCharacters(
  input: ReadonlyArray<SurfaceEntity>,
): SurfaceEntity[] {
  return input
    .filter((c) => resolveCharacter(c.name).id === null)
    .map((c) => ({ name: c.name, role: c.role }));
}

/**
 * The single shared composition: crystallize one book's three surface-form
 * axes into the exact `work_*` edge set the apply path writes. `apply-override`
 * and the B11 projection both call this so they cannot drift.
 */
export function resolveBookEdges(
  axes: OverrideAxes,
  factionSkipCtx: FactionSkipContext,
  locationSkipCtx: LocationSkipContext,
): ResolvedBookEdges {
  const resolvedFactions = resolveFactions(axes.factions);
  const factionSkip = decideFactionSkips({
    resolved: resolvedFactions as SkipResolvedFaction[],
    original: axes.factions,
    alignmentById: factionSkipCtx.alignmentById,
    redundantIds: factionSkipCtx.redundantIds,
    resolveFaction,
  });
  const keepFactions = factionSkip.keep as ResolvedEdge<FactionJunctionRole>[];

  const resolvedLocations = resolveLocations(axes.locations);
  const locationSkip = decideLocationSkips({
    surfaceForms: axes.locations,
    redundantSurfaceForms: locationSkipCtx.redundantSurfaceForms,
    resolvedLocationIds: resolvedLocations.map((r) => r.id),
  });

  const resolvedCharacters = resolveCharacters(axes.characters);

  return {
    keepFactions,
    resolvedLocations,
    resolvedCharacters,
    factionSkip,
    locationSkip,
  };
}
