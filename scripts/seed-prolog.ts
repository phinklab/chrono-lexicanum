/**
 * seed-prolog.ts — Brief 170 Teil A. The shared, non-destructive reference- +
 * facet-seed prolog.
 *
 * Before any book apply can validate F/L/C surface forms or facet ids, the
 * reference catalogs (factions/sectors/locations/characters) and the
 * `facet_values` catalog must be present in the DB — `apply-override`'s
 * `validateFacetIds` hard-throws on an unknown facet id, and resolved junctions
 * need their FK targets. Today that seed runs ONLY inside `run-phase4-apply.sh`
 * (db:sync step 2); a standalone `apply:book` / `/add-book` would otherwise need
 * a full `db:sync` as a workaround (Brief 170 §Design: "Neue Referenz-Entities
 * duerfen keinen Full-db:sync als Workaround brauchen").
 *
 * This module holds the seeding LOGIC (moved verbatim from the former
 * `seed-resolver-extensions.ts` / `seed-facets.ts` bodies) as in-process,
 * side-effect-free exports. The two original scripts are now thin CLI shims that
 * call these — so `npm run db:seed-resolver-extensions` and
 * `npx tsx scripts/seed-facets.ts` behave exactly as before, and
 * `run-phase4-apply.sh` is untouched. `apply:book` imports
 * `seedReferenceAndFacetProlog()` and runs it in-process (one shared Drizzle
 * client, no subprocess).
 *
 * Both seeds are idempotent + non-destructive: re-running converges.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { characters, facetValues, factions, locations, sectors } from "@/db/schema";
import {
  type Alignment,
  normalizeAlignment,
} from "@/lib/seed/alignment";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");

// =============================================================================
// Reference-data extensions (factions / sectors / locations / characters)
// =============================================================================

interface SeedFaction {
  id: string;
  name: string;
  parent?: string | null;
  alignment?: Alignment | string;
  tone?: string | null;
  glyph?: string | null;
}

interface SeedSector {
  id: string;
  name: string;
  color?: string;
  tone?: string;
  labelX?: number;
  labelY?: number;
}

interface SeedLocation {
  id: string;
  name: string;
  sector?: string | null;
  gx?: number | null;
  gy?: number | null;
  tags?: string[];
  capital?: boolean;
  warp?: boolean;
  lexicanumUrl?: string | null;
}

interface SeedCharacter {
  id: string;
  name: string;
  primaryFactionId?: string | null;
  lexicanumUrl?: string | null;
  notes?: string | null;
}

interface ResolverSeedData {
  factions: SeedFaction[];
  sectors: SeedSector[];
  locations: SeedLocation[];
  characters: SeedCharacter[];
  factionAliases: Record<string, string>;
  locationAliases: Record<string, string>;
  characterAliases: Record<string, string>;
}

async function loadJson<T>(file: string): Promise<T> {
  const raw = await readFile(resolve(SEED_DIR, file), "utf8");
  return JSON.parse(raw) as T;
}

async function loadResolverSeedData(): Promise<ResolverSeedData> {
  const [
    factionData,
    sectorData,
    locationData,
    characterData,
    factionAliases,
    locationAliases,
    characterAliases,
  ] = await Promise.all([
    loadJson<SeedFaction[]>("factions.json"),
    loadJson<SeedSector[]>("sectors.json"),
    loadJson<SeedLocation[]>("locations.json"),
    loadJson<SeedCharacter[]>("characters.json"),
    loadJson<Record<string, string>>("faction-aliases.json"),
    loadJson<Record<string, string>>("location-aliases.json"),
    loadJson<Record<string, string>>("character-aliases.json"),
  ]);

  return {
    factions: factionData,
    sectors: sectorData,
    locations: locationData,
    characters: characterData,
    factionAliases,
    locationAliases,
    characterAliases,
  };
}

function assertUnique<T>(
  label: string,
  rows: T[],
  select: (row: T) => string | null | undefined,
): void {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const value = select(row);
    if (!value) continue;
    seen.set(value, (seen.get(value) ?? 0) + 1);
  }
  const duplicates = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
  if (duplicates.length > 0) {
    throw new Error(`${label}: duplicate values: ${duplicates.join(", ")}`);
  }
}

function assertAliasTargets(
  label: string,
  aliases: Record<string, string>,
  targetIds: Set<string>,
): void {
  const dangling = Object.entries(aliases)
    .filter(([, target]) => !targetIds.has(target))
    .map(([alias, target]) => `${alias} -> ${target}`);
  if (dangling.length > 0) {
    throw new Error(`${label}: dangling alias targets: ${dangling.join(", ")}`);
  }
}

function validateResolverSeedData(data: ResolverSeedData): void {
  assertUnique("factions.id", data.factions, (f) => f.id);
  assertUnique("factions.name", data.factions, (f) => f.name);
  assertUnique("sectors.id", data.sectors, (s) => s.id);
  assertUnique("sectors.name", data.sectors, (s) => s.name);
  assertUnique("locations.id", data.locations, (l) => l.id);
  assertUnique("locations.name", data.locations, (l) => l.name);
  assertUnique("characters.id", data.characters, (c) => c.id);
  assertUnique("characters.name", data.characters, (c) => c.name);

  const factionIds = new Set(data.factions.map((f) => f.id));
  const sectorIds = new Set(data.sectors.map((s) => s.id));
  const locationIds = new Set(data.locations.map((l) => l.id));
  const characterIds = new Set(data.characters.map((c) => c.id));

  const danglingParents = data.factions
    .filter((f) => f.parent && !factionIds.has(f.parent))
    .map((f) => `${f.id} -> ${f.parent}`);
  if (danglingParents.length > 0) {
    throw new Error(`factions.json: dangling parents: ${danglingParents.join(", ")}`);
  }

  const danglingSectors = data.locations
    .filter((l) => l.sector && !sectorIds.has(l.sector))
    .map((l) => `${l.id} -> ${l.sector}`);
  if (danglingSectors.length > 0) {
    throw new Error(`locations.json: dangling sectors: ${danglingSectors.join(", ")}`);
  }

  const danglingPrimaryFactions = data.characters
    .filter((c) => c.primaryFactionId && !factionIds.has(c.primaryFactionId))
    .map((c) => `${c.id} -> ${c.primaryFactionId}`);
  if (danglingPrimaryFactions.length > 0) {
    throw new Error(
      `characters.json: dangling primaryFactionIds: ${danglingPrimaryFactions.join(", ")}`,
    );
  }

  for (const faction of data.factions) normalizeAlignment(faction);
  assertAliasTargets("faction-aliases.json", data.factionAliases, factionIds);
  assertAliasTargets("location-aliases.json", data.locationAliases, locationIds);
  assertAliasTargets("character-aliases.json", data.characterAliases, characterIds);
}

async function seedFactions(data: SeedFaction[]): Promise<{ added: number; updated: number }> {
  const rows = data.map((f) => ({
    id: f.id,
    name: f.name,
    parentId: f.parent ?? null,
    alignment: normalizeAlignment(f),
    tone: f.tone ?? null,
    glyph: f.glyph ?? null,
  }));
  const ids = rows.map((r) => r.id);
  const existing = (await db
    .select({ id: factions.id })
    .from(factions)
    .where(inArray(factions.id, ids))) as Array<{ id: string }>;
  const existingSet = new Set(existing.map((r) => r.id));
  const added = rows.filter((r) => !existingSet.has(r.id)).length;
  const updated = existingSet.size;
  if (rows.length > 0) {
    // Upsert on every row so the Pre-Apply Parent-Hygiene-Check can push
    // name/parent/alignment/tone/glyph corrections into prod-DB on re-run.
    await db
      .insert(factions)
      .values(rows)
      .onConflictDoUpdate({
        target: factions.id,
        set: {
          name: sql`excluded.name`,
          parentId: sql`excluded.parent_id`,
          alignment: sql`excluded.alignment`,
          tone: sql`excluded.tone`,
          glyph: sql`excluded.glyph`,
        },
      });
  }
  console.log(
    `[seed-resolver-extensions] factions: +${added} new, ${updated} updated (upsert on JSON columns)`,
  );
  return { added, updated };
}

async function seedSectors(data: SeedSector[]): Promise<{ added: number; skipped: number }> {
  const rows = data.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color ?? null,
    tone: s.tone ?? null,
    labelX: s.labelX ?? null,
    labelY: s.labelY ?? null,
  }));
  const ids = rows.map((r) => r.id);
  const existing = (await db
    .select({ id: sectors.id })
    .from(sectors)
    .where(inArray(sectors.id, ids))) as Array<{ id: string }>;
  const existingSet = new Set(existing.map((r) => r.id));
  const toInsert = rows.filter((r) => !existingSet.has(r.id));
  if (toInsert.length > 0) {
    await db.insert(sectors).values(toInsert).onConflictDoNothing();
  }
  console.log(
    `[seed-resolver-extensions] sectors:  +${toInsert.length} new, ${existingSet.size} skipped existing`,
  );
  return { added: toInsert.length, skipped: existingSet.size };
}

async function seedLocations(data: SeedLocation[]): Promise<{ added: number; skipped: number }> {
  const rows = data.map((l) => ({
    id: l.id,
    name: l.name,
    sectorId: l.sector ?? null,
    gx: l.gx ?? null,
    gy: l.gy ?? null,
    capital: l.capital ?? false,
    warp: l.warp ?? false,
    lexicanumUrl: l.lexicanumUrl ?? null,
    tags: l.tags ?? null,
  }));
  const ids = rows.map((r) => r.id);
  const existing = (await db
    .select({ id: locations.id })
    .from(locations)
    .where(inArray(locations.id, ids))) as Array<{ id: string }>;
  const existingSet = new Set(existing.map((r) => r.id));
  const toInsert = rows.filter((r) => !existingSet.has(r.id));
  if (toInsert.length > 0) {
    await db.insert(locations).values(toInsert).onConflictDoNothing();
  }
  console.log(
    `[seed-resolver-extensions] locations: +${toInsert.length} new, ${existingSet.size} skipped existing`,
  );
  return { added: toInsert.length, skipped: existingSet.size };
}

function mergeTags(currentTags: string[], desiredTags: string[]): string[] {
  const mergedTags = [...currentTags];
  for (const tag of desiredTags) {
    if (!mergedTags.includes(tag)) mergedTags.push(tag);
  }
  return mergedTags;
}

async function updateLocationTags(
  data: SeedLocation[],
): Promise<{ updated: number; skipped: number; missing: number }> {
  const taggedRows = data.filter((location) => (location.tags ?? []).length > 0);
  if (taggedRows.length === 0) {
    console.log("[seed-resolver-extensions] location tags: skipped (no seed tags)");
    return { updated: 0, skipped: 0, missing: 0 };
  }

  const desiredById = new Map(taggedRows.map((location) => [location.id, location.tags ?? []]));
  const existingRows = (await db
    .select({ id: locations.id, tags: locations.tags })
    .from(locations)
    .where(inArray(locations.id, taggedRows.map((location) => location.id)))) as Array<{
      id: string;
      tags: string[] | null;
    }>;

  let updated = 0;
  let skipped = 0;
  for (const row of existingRows) {
    const desiredTags = desiredById.get(row.id) ?? [];
    const currentTags = row.tags ?? [];
    const mergedTags = mergeTags(currentTags, desiredTags);
    if (mergedTags.length === currentTags.length) {
      skipped += 1;
      continue;
    }
    await db
      .update(locations)
      .set({ tags: mergedTags })
      .where(eq(locations.id, row.id));
    updated += 1;
  }

  const missing = taggedRows.length - existingRows.length;
  console.log(
    `[seed-resolver-extensions] location tags: ${updated} updated, ${skipped} already current, ${missing} missing`,
  );
  return { updated, skipped, missing };
}

async function seedCharacters(data: SeedCharacter[]): Promise<{ added: number; skipped: number }> {
  const rows = data.map((c) => ({
    id: c.id,
    name: c.name,
    primaryFactionId: c.primaryFactionId ?? null,
    lexicanumUrl: c.lexicanumUrl ?? null,
    notes: c.notes ?? null,
  }));
  const ids = rows.map((r) => r.id);
  const existing = (await db
    .select({ id: characters.id })
    .from(characters)
    .where(inArray(characters.id, ids))) as Array<{ id: string }>;
  const existingSet = new Set(existing.map((r) => r.id));
  const toInsert = rows.filter((r) => !existingSet.has(r.id));
  if (toInsert.length > 0) {
    await db.insert(characters).values(toInsert).onConflictDoNothing();
  }
  console.log(
    `[seed-resolver-extensions] characters: +${toInsert.length} new, ${existingSet.size} skipped existing`,
  );
  return { added: toInsert.length, skipped: existingSet.size };
}

/**
 * Idempotent reference-data seed (factions → sectors → locations + tag-merge →
 * characters). Moved from the former `seed-resolver-extensions.ts` `main()`;
 * the CLI shim still prints the identical lines.
 */
export async function seedResolverExtensions(): Promise<void> {
  console.log("[seed-resolver-extensions] start");
  const data = await loadResolverSeedData();
  validateResolverSeedData(data);
  console.log("[seed-resolver-extensions] validation ok");
  const f = await seedFactions(data.factions);
  const s = await seedSectors(data.sectors);
  const l = await seedLocations(data.locations);
  const tagUpdates = await updateLocationTags(data.locations);
  const c = await seedCharacters(data.characters);
  const totalAdded = f.added + s.added + l.added + c.added;
  const totalExisting = f.updated + s.skipped + l.skipped + c.skipped;
  console.log(
    `[seed-resolver-extensions] done. total: +${totalAdded} new, ${totalExisting} existing (factions upserted, others skipped, location_tags=${tagUpdates.updated} updated)`,
  );
}

// =============================================================================
// Facet catalog
// =============================================================================

interface FacetValue {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
}
interface FacetCategory {
  id: string;
  values: FacetValue[];
}
interface FacetCatalog {
  categories: FacetCategory[];
}

/**
 * Idempotent `facet_values` upsert from `facet-catalog.json` (ON CONFLICT DO
 * NOTHING). Moved from the former `seed-facets.ts` `main()`; the CLI shim still
 * prints the identical `[seed-facets]` lines that `run-phase4-apply.sh` greps.
 */
export async function seedFacets(): Promise<void> {
  const raw = await readFile(resolve(SEED_DIR, "facet-catalog.json"), "utf8");
  const catalog = JSON.parse(raw) as FacetCatalog;

  const rows = catalog.categories.flatMap((cat) =>
    cat.values.map((v) => ({
      id: v.id,
      categoryId: cat.id,
      name: v.name,
      description: v.description ?? null,
      displayOrder: v.displayOrder ?? 0,
    })),
  );

  const inserted = await db
    .insert(facetValues)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: facetValues.id });

  console.log(
    `[seed-facets] catalog values: ${rows.length}; newly inserted (ON CONFLICT DO NOTHING): ${inserted.length}`,
  );
  if (inserted.length > 0) {
    console.log(
      `[seed-facets] inserted ids: ${inserted.map((r) => r.id).join(", ")}`,
    );
  }
}

// =============================================================================
// The shared prolog
// =============================================================================

/**
 * The single non-destructive reference/facet seed prolog used by standalone
 * `apply:book --slug`, `apply:book --all`, and `/add-book` — same order as
 * `run-phase4-apply.sh` (resolver-extensions first, then facets). Idempotent.
 */
export async function seedReferenceAndFacetProlog(): Promise<void> {
  await seedResolverExtensions();
  await seedFacets();
}
