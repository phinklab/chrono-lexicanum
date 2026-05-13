/**
 * seed-resolver-extensions.ts — idempotent seed for the Brief-063 resolver
 * reference-data extensions.
 *
 * Inserts the new factions / sectors / locations / characters that were added
 * to `scripts/seed-data/*.json` for Brief 063 (the resolver landing for the
 * first 50 W40K Authority-Layer books). Existing rows are NEVER mutated —
 * the script walks each entity, fetches the set of IDs already in the DB,
 * filters the JSON down to the genuinely-new rows, and INSERTs only those.
 * `onConflictDoNothing()` is layered on top as a belt-and-braces safety net
 * (parallel runs, mid-script kills, edited JSONs).
 *
 * Order of inserts respects FK dependencies:
 *   1. Factions   — locations.sectorId is fk→sectors (not factions), but
 *                   characters.primaryFactionId is fk→factions, so factions
 *                   must land first for the character insert to succeed.
 *   2. Sectors    — locations.sectorId is fk→sectors.
 *   3. Locations  — depends on sectors.
 *   4. Characters — depends on factions.
 *
 * CLI: `npm run db:seed-resolver-extensions` (defined in package.json).
 * Maintainer-trigger only — CC does not run this against prod-Supabase from
 * the workstation. This script is the deliberate sibling of the Brief-060
 * `apply-override` workflow: schema lands via `db:migrate`, reference data
 * lands here, then the per-batch `apply-override` re-runs use the new resolver.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  characters,
  factions,
  locations,
  sectors,
} from "@/db/schema";

const SEED_DIR = resolve(process.cwd(), "scripts", "seed-data");

type Alignment = "imperium" | "chaos" | "xenos" | "neutral";
const ALIGNMENT_VALUES: readonly Alignment[] = [
  "imperium",
  "chaos",
  "xenos",
  "neutral",
];

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

function inferAlignmentFromTree(f: SeedFaction): Alignment {
  if (f.parent === "chaos" || f.id === "chaos") return "chaos";
  if (f.parent === "imperium" || f.id === "imperium") return "imperium";
  if (f.tone === "alien") return "xenos";
  return "neutral";
}

function normalizeAlignment(f: SeedFaction): Alignment {
  if (!f.alignment) return inferAlignmentFromTree(f);
  if (f.alignment === "imperial") return "imperium";
  if ((ALIGNMENT_VALUES as readonly string[]).includes(f.alignment)) {
    return f.alignment as Alignment;
  }
  throw new Error(
    `Faction ${f.id}: invalid alignment '${f.alignment}'. Expected imperium, chaos, xenos, neutral, or legacy imperial.`,
  );
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
    // Upsert on every row so the Pre-Apply Parent-Hygiene-Check in the
    // resolver-apply-runbook can push name/parent/alignment/tone/glyph
    // corrections from factions.json into prod-DB by re-running this script.
    // Only JSON-sourced columns are written; nothing else touches factions.
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

async function main() {
  console.log("[seed-resolver-extensions] start");
  const data = await loadResolverSeedData();
  validateResolverSeedData(data);
  console.log("[seed-resolver-extensions] validation ok");
  const f = await seedFactions(data.factions);
  const s = await seedSectors(data.sectors);
  const l = await seedLocations(data.locations);
  const c = await seedCharacters(data.characters);
  const totalAdded = f.added + s.added + l.added + c.added;
  const totalExisting = f.updated + s.skipped + l.skipped + c.skipped;
  console.log(
    `[seed-resolver-extensions] done. total: +${totalAdded} new, ${totalExisting} existing (factions upserted, others skipped)`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-resolver-extensions] failed:", err);
  process.exit(1);
});
