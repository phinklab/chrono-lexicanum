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

import { inArray } from "drizzle-orm";

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

async function loadJson<T>(file: string): Promise<T> {
  const raw = await readFile(resolve(SEED_DIR, file), "utf8");
  return JSON.parse(raw) as T;
}

function asAlignment(v: Alignment | string | undefined): Alignment {
  if (v && (ALIGNMENT_VALUES as readonly string[]).includes(v)) {
    return v as Alignment;
  }
  return "neutral";
}

async function seedFactions(): Promise<{ added: number; skipped: number }> {
  const data = await loadJson<SeedFaction[]>("factions.json");
  const rows = data.map((f) => ({
    id: f.id,
    name: f.name,
    parentId: f.parent ?? null,
    alignment: asAlignment(f.alignment),
    tone: f.tone ?? null,
    glyph: f.glyph ?? null,
  }));
  const ids = rows.map((r) => r.id);
  const existing = (await db
    .select({ id: factions.id })
    .from(factions)
    .where(inArray(factions.id, ids))) as Array<{ id: string }>;
  const existingSet = new Set(existing.map((r) => r.id));
  const toInsert = rows.filter((r) => !existingSet.has(r.id));
  if (toInsert.length > 0) {
    await db.insert(factions).values(toInsert).onConflictDoNothing();
  }
  console.log(
    `[seed-resolver-extensions] factions: +${toInsert.length} new, ${existingSet.size} skipped existing`,
  );
  return { added: toInsert.length, skipped: existingSet.size };
}

async function seedSectors(): Promise<{ added: number; skipped: number }> {
  const data = await loadJson<SeedSector[]>("sectors.json");
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

async function seedLocations(): Promise<{ added: number; skipped: number }> {
  const data = await loadJson<SeedLocation[]>("locations.json");
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

async function seedCharacters(): Promise<{ added: number; skipped: number }> {
  const data = await loadJson<SeedCharacter[]>("characters.json");
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
  const f = await seedFactions();
  const s = await seedSectors();
  const l = await seedLocations();
  const c = await seedCharacters();
  const totalAdded = f.added + s.added + l.added + c.added;
  const totalSkipped = f.skipped + s.skipped + l.skipped + c.skipped;
  console.log(
    `[seed-resolver-extensions] done. total: +${totalAdded} new, ${totalSkipped} skipped existing`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-resolver-extensions] failed:", err);
  process.exit(1);
});
