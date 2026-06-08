/**
 * Standalone integrity test for the entity-blurb seed-data JSONs (Board 122-B3).
 *
 * No test framework: throws on failure and exits non-zero via the top-level
 * catch. DB-free — it reads the committed JSON and the entity seed lists and
 * asserts referential integrity + shape, so a dangling/over-long blurb "faellt
 * laut, build-sichtbar" (Spec 129) without any DB or UI.
 *
 * Storage form per Spec 129 decision #4: blurbs live in committed curation JSON
 * keyed by existing entity ids — NO schema column, NO migration, NO seed.ts
 * change. The set of entities that carry a blurb is a curated/grown subset of
 * the full entity tables (the hand-curated B3 pass, then the
 * `generate-entity-blurbs.ts` full-coverage run); this test validates whatever
 * is present rather than pinning an exact id list.
 *
 * Set BLURBS_REQUIRE_FULL=1 to additionally assert 100% coverage (every entity
 * of that type has a blurb) — use it as the gate after the full generator run.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const SEED_DIR = join(process.cwd(), "scripts", "seed-data");

// DB enum `source_kind` (src/db/schema.ts). Hand-authored blurbs use "manual".
const SOURCE_KIND_VALUES = new Set([
  "manual",
  "lexicanum",
  "goodreads",
  "black_library",
  "fandom_wiki",
  "open_library",
  "hardcover",
  "tlbranson",
  "podcast_rss",
]);

const MAX_BLURB_CHARS = 460;
const MAX_SENTENCES = 3;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRE_FULL = process.env.BLURBS_REQUIRE_FULL === "1";

interface EntityRow { id: string }
interface BlurbRow {
  id: string;
  blurb: string;
  source_kind: string;
  confidence: number;
  sourceUrl: string;
  checkedAt: string;
}
interface BlurbFile {
  $schema: string;
  entityType: "faction" | "character" | "location";
  blurbs: BlurbRow[];
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;
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

function countSentences(text: string): number {
  const matches = text.match(/[.!?]+(?:\s+|$)/g);
  return matches ? matches.length : text.length > 0 ? 1 : 0;
}

function assertFile(
  file: string,
  entityType: BlurbFile["entityType"],
  entityIds: Set<string>,
): void {
  const data = readJson<BlurbFile>(file);

  assert.equal(data.$schema, "entity-blurbs-v1", `${file}: bad $schema`);
  assert.equal(data.entityType, entityType, `${file}: bad entityType`);
  assert.ok(Array.isArray(data.blurbs), `${file}: blurbs must be an array`);

  const ids = data.blurbs.map((b) => b.id);

  // no duplicates
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual([...new Set(dupes)], [], `${file} duplicate ids: ${dupes.join(", ")}`);

  // every id references an existing entity (dangling → fail loud)
  const dangling = ids.filter((id) => !entityIds.has(id));
  assert.deepEqual(dangling, [], `${file} dangling ids: ${dangling.join(", ")}`);

  // optional full-coverage gate (after the generator run)
  if (REQUIRE_FULL) {
    const have = new Set(ids);
    const missing = [...entityIds].filter((id) => !have.has(id));
    assert.deepEqual(missing, [], `${file} missing ${missing.length} ids (BLURBS_REQUIRE_FULL)`);
  }

  // per-row shape + content guardrails
  for (const b of data.blurbs) {
    const where = `${file}:${b.id}`;
    assert.equal(typeof b.blurb, "string", `${where}: blurb must be a string`);
    assert.ok(b.blurb.trim().length > 0, `${where}: blurb empty`);
    assert.ok(
      b.blurb.length <= MAX_BLURB_CHARS,
      `${where}: blurb too long (${b.blurb.length} > ${MAX_BLURB_CHARS})`,
    );
    assert.ok(
      countSentences(b.blurb) <= MAX_SENTENCES,
      `${where}: blurb has >${MAX_SENTENCES} sentences ("kein Lore-Essay")`,
    );
    assert.ok(
      SOURCE_KIND_VALUES.has(b.source_kind),
      `${where}: invalid source_kind '${b.source_kind}'`,
    );
    assert.ok(
      typeof b.confidence === "number" && b.confidence > 0 && b.confidence <= 1,
      `${where}: confidence out of range (${b.confidence})`,
    );
    assert.ok(
      typeof b.sourceUrl === "string" && /^https:\/\/\S+$/.test(b.sourceUrl),
      `${where}: sourceUrl must be an https url`,
    );
    assert.ok(DATE_RE.test(b.checkedAt), `${where}: checkedAt must be YYYY-MM-DD`);
  }

  console.log(`  ${file}: ${ids.length}/${entityIds.size} ${entityType}s covered`);
}

function main(): void {
  const factionIds = new Set(readJson<EntityRow[]>("factions.json").map((f) => f.id));
  const characterIds = new Set(readJson<EntityRow[]>("characters.json").map((c) => c.id));
  const locationIds = new Set(readJson<EntityRow[]>("locations.json").map((l) => l.id));

  check("faction-blurbs.json: shape + integrity", () => {
    assertFile("faction-blurbs.json", "faction", factionIds);
  });
  check("character-blurbs.json: shape + integrity", () => {
    assertFile("character-blurbs.json", "character", characterIds);
  });
  check("location-blurbs.json: shape + integrity", () => {
    assertFile("location-blurbs.json", "location", locationIds);
  });

  console.log(`entity blurbs ok${REQUIRE_FULL ? " (full coverage enforced)" : ""}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
