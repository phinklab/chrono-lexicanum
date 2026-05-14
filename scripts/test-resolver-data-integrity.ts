/**
 * Standalone integrity test for resolver seed-data JSONs.
 *
 * No test framework: throws on failure and exits non-zero via the top-level
 * catch. This is intentionally DB-free so it can run before any migration or
 * seed apply.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

import {
  normalizeCharacterRole,
  resolveLocation,
} from "../src/lib/resolver";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");
const ALIGNMENT_VALUES = new Set(["imperium", "chaos", "xenos", "neutral"]);
const OVERRIDE_BATCHES = [
  "001",
  "002",
  "003",
  "004",
  "005",
  "006",
  "007",
  "008",
  "009",
  "010",
] as const;
const EXPECTED_SMOKE_SLUGS = [
  "the-anarch",
  "calgars-fury",
  "the-emperors-gift",
  "storm-of-iron",
  "celestine",
  "spear-of-the-emperor",
] as const;

interface FactionRow {
  id: string;
  name: string;
  parent?: string | null;
  alignment?: string;
}

interface SectorRow {
  id: string;
  name: string;
}

interface LocationRow {
  id: string;
  name: string;
  sector?: string | null;
  gx?: number | null;
  gy?: number | null;
}

interface CharacterRow {
  id: string;
  name: string;
  primaryFactionId?: string | null;
}

interface OverrideEntity {
  name: string;
  role: string;
}

interface OverrideBook {
  slug: string;
  overrides: {
    characters: OverrideEntity[];
  };
}

interface OverrideFile {
  books: OverrideBook[];
}

interface ResolverData {
  factions: FactionRow[];
  sectors: SectorRow[];
  locations: LocationRow[];
  characters: CharacterRow[];
  factionAliases: Record<string, string>;
  locationAliases: Record<string, string>;
  characterAliases: Record<string, string>;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;
}

function loadData(): ResolverData {
  return {
    factions: readJson<FactionRow[]>("factions.json"),
    sectors: readJson<SectorRow[]>("sectors.json"),
    locations: readJson<LocationRow[]>("locations.json"),
    characters: readJson<CharacterRow[]>("characters.json"),
    factionAliases: readJson<Record<string, string>>("faction-aliases.json"),
    locationAliases: readJson<Record<string, string>>("location-aliases.json"),
    characterAliases: readJson<Record<string, string>>("character-aliases.json"),
  };
}

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function assertNoDuplicates<T>(
  label: string,
  rows: T[],
  select: (row: T) => string | null | undefined,
): void {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const value = select(row);
    if (!value) continue;
    const key = value.trim();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }

  const duplicates = [...seen.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
  assert.deepEqual(duplicates, [], `${label} duplicates: ${duplicates.join(", ")}`);
}

function assertAliasTargets(
  label: string,
  aliases: Record<string, string>,
  targetIds: Set<string>,
): void {
  const dangling = Object.entries(aliases)
    .filter(([, targetId]) => !targetIds.has(targetId))
    .map(([alias, targetId]) => `${alias} -> ${targetId}`);
  assert.deepEqual(dangling, [], `${label} dangling targets: ${dangling.join(", ")}`);
}

function main(): void {
  const data = loadData();
  const factionIds = new Set(data.factions.map((f) => f.id));
  const sectorIds = new Set(data.sectors.map((s) => s.id));
  const locationIds = new Set(data.locations.map((l) => l.id));
  const characterIds = new Set(data.characters.map((c) => c.id));

  check("no duplicate ids or names in resolver reference JSONs", () => {
    assertNoDuplicates("factions.id", data.factions, (f) => f.id);
    assertNoDuplicates("factions.name", data.factions, (f) => f.name);
    assertNoDuplicates("sectors.id", data.sectors, (s) => s.id);
    assertNoDuplicates("sectors.name", data.sectors, (s) => s.name);
    assertNoDuplicates("locations.id", data.locations, (l) => l.id);
    assertNoDuplicates("locations.name", data.locations, (l) => l.name);
    assertNoDuplicates("characters.id", data.characters, (c) => c.id);
    assertNoDuplicates("characters.name", data.characters, (c) => c.name);
  });

  check("faction parents point at existing factions", () => {
    const dangling = data.factions
      .filter((f) => f.parent && !factionIds.has(f.parent))
      .map((f) => `${f.id} -> ${f.parent}`);
    assert.deepEqual(dangling, [], `dangling faction parents: ${dangling.join(", ")}`);
  });

  check("location sectors point at existing sectors or null", () => {
    const dangling = data.locations
      .filter((l) => l.sector && !sectorIds.has(l.sector))
      .map((l) => `${l.id} -> ${l.sector}`);
    assert.deepEqual(dangling, [], `dangling location sectors: ${dangling.join(", ")}`);
  });

  check("character primaryFactionIds point at existing factions or null", () => {
    const dangling = data.characters
      .filter((c) => c.primaryFactionId && !factionIds.has(c.primaryFactionId))
      .map((c) => `${c.id} -> ${c.primaryFactionId}`);
    assert.deepEqual(dangling, [], `dangling primaryFactionIds: ${dangling.join(", ")}`);
  });

  check("present faction alignment values match the DB enum", () => {
    const invalid = data.factions
      .filter((f) => f.alignment !== undefined && !ALIGNMENT_VALUES.has(f.alignment))
      .map((f) => `${f.id} -> ${f.alignment}`);
    assert.deepEqual(invalid, [], `invalid faction alignments: ${invalid.join(", ")}`);
  });

  check("alias targets point at canonical ids", () => {
    assertAliasTargets("faction-aliases.json", data.factionAliases, factionIds);
    assertAliasTargets("location-aliases.json", data.locationAliases, locationIds);
    assertAliasTargets("character-aliases.json", data.characterAliases, characterIds);
  });

  check("location coordinates are paired", () => {
    const invalid = data.locations
      .filter((l) => (l.gx ?? null) === null !== ((l.gy ?? null) === null))
      .map((l) => `${l.id} gx=${l.gx ?? "null"} gy=${l.gy ?? "null"}`);
    assert.deepEqual(invalid, [], `half-coordinate locations: ${invalid.join(", ")}`);
  });

  check("sector surface forms resolve as non-pinned locations", () => {
    assert.equal(resolveLocation("Scarus Sector").id, "scarus");
    assert.equal(resolveLocation("Helican Subsector").id, "helican");
    assert.equal(resolveLocation("Calixis Sector").id, "calixis");

    const scarus = data.locations.find((l) => l.id === "scarus");
    const helican = data.locations.find((l) => l.id === "helican");
    assert.ok(scarus, "missing scarus location entry");
    assert.ok(helican, "missing helican location entry");
    assert.equal(scarus.gx ?? null, null, "Scarus Sector must not be a map pin");
    assert.equal(scarus.gy ?? null, null, "Scarus Sector must not be a map pin");
    assert.equal(helican.gx ?? null, null, "Helican Subsector must not be a map pin");
    assert.equal(helican.gy ?? null, null, "Helican Subsector must not be a map pin");
  });

  check("override character roles normalize to work_characters vocabulary", () => {
    const allowed = new Set(["pov", "appears", "mentioned"]);
    for (const batch of OVERRIDE_BATCHES) {
      const override = readJson<OverrideFile>(
        `manual-overrides-ssot-w40k-${batch}.json`,
      );
      for (const book of override.books) {
        for (const character of book.overrides.characters) {
          const normalized = normalizeCharacterRole(character.role);
          assert.ok(
            normalized.role !== null && allowed.has(normalized.role),
            `${book.slug}:${character.name}:${character.role}`,
          );
        }
      }
    }
  });

  check("coverage smoke slugs exist in 001..010", () => {
    const slugs = new Set<string>();
    for (const batch of OVERRIDE_BATCHES) {
      const override = readJson<OverrideFile>(
        `manual-overrides-ssot-w40k-${batch}.json`,
      );
      for (const book of override.books) slugs.add(book.slug);
    }
    for (const slug of EXPECTED_SMOKE_SLUGS) {
      assert.ok(slugs.has(slug), `missing ${slug}`);
    }
  });

  console.log("resolver data integrity ok");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
