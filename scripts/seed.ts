/**
 * Seed script — load the canonical JSON catalog into Postgres.
 *
 * Run:  npm run db:seed
 *
 * Source data lives in scripts/seed-data/*.json and is the source of truth
 * for the v1 catalog. This script is idempotent: it truncates the relevant
 * tables and re-inserts. Safe for development; do NOT run against production
 * once the `submissions` table holds real community contributions.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Env is loaded by `tsx --env-file=.env.local` (see package.json db:seed).
// We don't import dotenv here because ESM hoists imports above any
// `loadEnv()` call, so client.ts evaluates before .env.local is read.

import { db } from "@/db/client";
import {
  books,
  bookCharacters,
  bookFactions,
  bookLocations,
  characters,
  eras,
  factions,
  locations,
  sectors,
  series,
} from "@/db/schema";
import { sql } from "drizzle-orm";

// ─── 1. Load JSON ─────────────────────────────────────────────────────────────
const SEED_DIR = join(process.cwd(), "scripts", "seed-data");
const readJson = <T>(file: string): T =>
  JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;

interface RawEra { id: string; name: string; start: number; end: number; tone?: string }
interface RawFaction { id: string; name: string; parent?: string | null; tone?: string }
interface RawSeries { id: string; name: string; total?: number; note?: string }
interface RawBook {
  id: string;
  title: string;
  author: string;
  pubYear?: number;
  startY: number;
  endY: number;
  factions?: string[];
  characters?: string[];
  synopsis?: string;
  goodreads?: string;
  series?: string;
  seriesIndex?: number;
  locationId?: string; // primary on-screen location
}
interface RawSector {
  id: string;
  name: string;
  color?: string;
  tone?: string;
  labelX?: number;
  labelY?: number;
}
interface RawLocation {
  id: string;
  name: string;
  sector: string;
  gx: number;
  gy: number;
  tags?: string[];
  capital?: boolean;
  warp?: boolean;
}

const RAW = {
  eras: readJson<RawEra[]>("eras.json"),
  factions: readJson<RawFaction[]>("factions.json"),
  series: readJson<RawSeries[]>("series.json"),
  books: readJson<RawBook[]>("books.json"),
  sectors: readJson<RawSector[]>("sectors.json"),
  locations: readJson<RawLocation[]>("locations.json"),
};

// ─── 2. Helpers ──────────────────────────────────────────────────────────────
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferAlignment(f: RawFaction): "imperium" | "chaos" | "xenos" | "neutral" {
  if (f.parent === "chaos" || f.id === "chaos") return "chaos";
  if (f.parent === "imperium" || f.id === "imperium") return "imperium";
  if (f.tone === "alien") return "xenos";
  return "neutral";
}

// ─── 3. Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `Loaded: ${RAW.eras.length} eras, ${RAW.factions.length} factions, ${RAW.series.length} series, ${RAW.books.length} books, ${RAW.sectors.length} sectors, ${RAW.locations.length} locations.`,
  );

  console.log("Wiping target tables (dev only)...");
  await db.execute(sql`TRUNCATE TABLE
    book_characters, book_factions, book_locations,
    books, characters, locations, sectors, factions, series, eras, submissions
    RESTART IDENTITY CASCADE`);

  // ── Eras
  await db.insert(eras).values(
    RAW.eras.map((e, i) => ({
      id: e.id,
      name: e.name,
      startY: String(e.start),
      endY: String(e.end),
      tone: e.tone ?? null,
      sortOrder: i,
    })),
  );

  // ── Factions (two passes so parent FKs resolve)
  await db.insert(factions).values(
    RAW.factions.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: null,
      alignment: inferAlignment(f),
      tone: f.tone ?? null,
    })),
  );
  for (const f of RAW.factions) {
    if (f.parent) {
      await db.execute(sql`UPDATE factions SET parent_id = ${f.parent} WHERE id = ${f.id}`);
    }
  }

  // ── Series
  if (RAW.series.length > 0) {
    await db.insert(series).values(
      RAW.series.map((s) => ({
        id: s.id,
        name: s.name,
        totalPlanned: s.total ?? null,
        note: s.note ?? null,
      })),
    );
  }

  // ── Sectors
  await db.insert(sectors).values(
    RAW.sectors.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color ?? null,
      tone: s.tone ?? null,
      labelX: s.labelX ?? null,
      labelY: s.labelY ?? null,
    })),
  );

  // ── Locations
  await db.insert(locations).values(
    RAW.locations.map((l) => ({
      id: l.id,
      name: l.name,
      sectorId: l.sector,
      gx: l.gx,
      gy: l.gy,
      capital: l.capital ?? false,
      warp: l.warp ?? false,
      tags: l.tags ?? [],
    })),
  );

  // ── Characters: derived from the union of `characters` arrays on books
  const charIds = new Set<string>();
  for (const b of RAW.books) for (const c of b.characters ?? []) charIds.add(c);
  if (charIds.size > 0) {
    await db.insert(characters).values(
      [...charIds].map((id) => ({
        id,
        name: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      })),
    );
  }

  // ── Books + junctions
  let inserted = 0;
  for (const b of RAW.books) {
    const slug = slugify(`${b.title}-${b.id}`);
    const result = await db
      .insert(books)
      .values({
        slug,
        title: b.title,
        author: b.author,
        pubYear: b.pubYear ?? null,
        startY: String(b.startY),
        endY: String(b.endY),
        synopsis: b.synopsis ?? null,
        seriesId: b.series ?? null,
        seriesIndex: b.seriesIndex ?? null,
        goodreadsUrl: b.goodreads ?? null,
        sourceKind: "manual",
      })
      .returning({ id: books.id });
    const uuid = result[0].id;
    inserted += 1;

    if (b.factions?.length) {
      await db.insert(bookFactions).values(
        b.factions.map((fid) => ({ bookId: uuid, factionId: fid, role: "supporting" })),
      );
    }
    if (b.characters?.length) {
      await db.insert(bookCharacters).values(
        b.characters.map((cid) => ({ bookId: uuid, characterId: cid, role: "appears" })),
      );
    }
    if (b.locationId) {
      await db.insert(bookLocations).values({
        bookId: uuid,
        locationId: b.locationId,
        atY: String(b.startY),
      });
    }
  }

  console.log(`Done. Inserted ${inserted} books.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
