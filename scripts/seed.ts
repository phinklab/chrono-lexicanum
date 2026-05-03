/**
 * Seed script — load the canonical JSON catalog into Postgres.
 *
 * Run:  npm run db:seed
 *
 * Source data lives in scripts/seed-data/*.json. Idempotent: TRUNCATE
 * CASCADE the relevant tables and re-insert. Safe for development; do NOT
 * run against production once the `submissions` table holds real community
 * contributions.
 *
 * Stufe 2a (sessions/2026-05-01-019) rewired this around the works-centric
 * schema:
 *   • New reference inserts: services, facet_categories, facet_values, persons.
 *   • Per-book block inserts a transaction-wrapped (`works` + `book_details`
 *     + junctions + facets + external_links) bundle. The transaction is
 *     belt-and-braces on top of the DB-level CHECK triggers — the helper
 *     pairs `kind: 'book'` with `book_details` regardless of caller order.
 *   • Old characters auto-derivation kept as-is, but our 3-book sanity
 *     fixture has no `characters` arrays, so that branch no-ops.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { db } from "@/db/client";
import {
  bookDetails,
  characters,
  eras,
  externalLinks,
  facetCategories,
  facetValues,
  factions,
  locations,
  persons,
  sectors,
  series,
  services,
  workFacets,
  workFactions,
  workPersons,
  works,
} from "@/db/schema";
import { slugify } from "@/lib/slug";
import { sql } from "drizzle-orm";

// ─── 1. Load JSON ─────────────────────────────────────────────────────────────
const SEED_DIR = join(process.cwd(), "scripts", "seed-data");
const readJson = <T>(file: string): T =>
  JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;

interface RawEra { id: string; name: string; start: number; end: number; tone?: string }
interface RawFaction { id: string; name: string; parent?: string | null; tone?: string }
interface RawSeries { id: string; name: string; total?: number; note?: string }
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

interface RawService {
  id: string;
  name: string;
  domain?: string;
  affiliateSupported?: boolean;
  displayOrder?: number;
}

interface RawPerson {
  id: string;
  name: string;
  nameSort: string;
  bio?: string;
  birthYear?: number;
  lexicanumUrl?: string;
  wikipediaUrl?: string;
  extras?: Record<string, unknown>;
}

type FacetValueId = string;
interface RawFacetValue {
  id: FacetValueId;
  name: string;
  description?: string;
  displayOrder?: number;
}
interface RawFacetCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder?: number;
  multiValue?: boolean;
  visibleToUsers?: boolean;
  values: RawFacetValue[];
}
interface RawFacetCatalog { categories: RawFacetCategory[] }

type LinkKind = "read" | "listen" | "watch" | "buy_print" | "reference" | "trailer" | "official_page";
type PersonRoleValue =
  | "author"
  | "co_author"
  | "translator"
  | "editor"
  | "narrator"
  | "co_narrator"
  | "full_cast"
  | "director"
  | "co_director"
  | "cover_artist"
  | "sound_designer";

interface RawBookFaction { id: string; role?: "primary" | "supporting" | "antagonist" }
interface RawBookPerson {
  id: string;
  role: PersonRoleValue;
  displayOrder?: number;
  note?: string;
}
type RawBookFacets = Record<string, string | string[]>;
interface RawBookExternalLink {
  kind: LinkKind;
  service: string;
  url: string;
  label?: string;
  region?: string;
  affiliate?: boolean;
  displayOrder?: number;
}
type RawBookFormat =
  | "novel"
  | "novella"
  | "short_story"
  | "anthology"
  | "audio_drama"
  | "omnibus";

type RawBookAvailability =
  | "in_print"
  | "oop_recent"
  | "oop_legacy"
  | "unavailable";

interface RawBook {
  id: string;
  title: string;
  pubYear?: number;
  startY: number;
  endY: number;
  // Stufe 2c.0: editorial era-anchor. Required for every book in the catalog.
  // The seed validates this field strictly — see Constraint 4 of brief 023.
  primaryEraId: string;
  // Phase 3b: orthogonale book_details-Felder. `format` ist beim 26-Manuals-
  // Hand-Fill auf "novel" gesetzt (alle sind tatsächlich Romane). `availability`
  // bleibt absent → NULL → 3c LLM klassifiziert per Web-Search.
  format?: RawBookFormat;
  availability?: RawBookAvailability;
  // Stufe 2b annotation surfaced in Phase 3a: optional per-book confidence on
  // the manual roster. Absent → DB default 1.00. Present → stored as-is.
  confidence?: number;
  synopsis?: string;
  series?: string;
  seriesIndex?: number;
  isbn13?: string;
  isbn10?: string;
  pageCount?: number;
  factions?: RawBookFaction[];
  characters?: string[];
  persons?: RawBookPerson[];
  facets?: RawBookFacets;
  externalLinks?: RawBookExternalLink[];
  locationId?: string;
}

const RAW = {
  eras: readJson<RawEra[]>("eras.json"),
  factions: readJson<RawFaction[]>("factions.json"),
  series: readJson<RawSeries[]>("series.json"),
  books: readJson<RawBook[]>("books.json"),
  sectors: readJson<RawSector[]>("sectors.json"),
  locations: readJson<RawLocation[]>("locations.json"),
  services: readJson<RawService[]>("services.json"),
  persons: readJson<RawPerson[]>("persons.json"),
  facetCatalog: readJson<RawFacetCatalog>("facet-catalog.json"),
};

// ─── 2. Helpers ──────────────────────────────────────────────────────────────

function inferAlignment(f: RawFaction): "imperium" | "chaos" | "xenos" | "neutral" {
  if (f.parent === "chaos" || f.id === "chaos") return "chaos";
  if (f.parent === "imperium" || f.id === "imperium") return "imperium";
  if (f.tone === "alien") return "xenos";
  return "neutral";
}

// Lookup: build a Set of valid facet_value ids so we can fail loudly when a
// book.json typo references a non-existent facet value (instead of silently
// dropping the row at FK time).
function collectFacetValueIds(catalog: RawFacetCatalog): Set<FacetValueId> {
  const set = new Set<FacetValueId>();
  for (const cat of catalog.categories) for (const v of cat.values) set.add(v.id);
  return set;
}

// ─── 3. Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `Loaded: ${RAW.eras.length} eras, ${RAW.factions.length} factions, ${RAW.series.length} series, ${RAW.books.length} books, ${RAW.sectors.length} sectors, ${RAW.locations.length} locations, ${RAW.services.length} services, ${RAW.persons.length} persons, ${RAW.facetCatalog.categories.length} facet categories.`,
  );

  console.log("Wiping target tables (dev only)...");
  // CASCADE handles all FKs; explicit table list documents what gets nuked.
  await db.execute(sql`TRUNCATE TABLE
    external_links,
    work_persons, work_facets, work_locations, work_characters, work_factions,
    book_details, film_details, channel_details, video_details,
    works,
    services, persons,
    facet_values, facet_categories,
    characters, locations, sectors, factions, series, eras, submissions
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
  console.log(`Inserted ${RAW.eras.length} eras.`);

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
  console.log(`Inserted ${RAW.factions.length} factions.`);

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
  console.log(`Inserted ${RAW.series.length} series.`);

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
  console.log(`Inserted ${RAW.sectors.length} sectors.`);

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
  console.log(`Inserted ${RAW.locations.length} locations.`);

  // ── Characters: derived from the union of `characters` arrays on books.
  //    The 3-book Stufe-2a fixture has none, so this typically inserts 0 rows.
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
  console.log(`Inserted ${charIds.size} characters.`);

  // ── Services
  await db.insert(services).values(
    RAW.services.map((s) => ({
      id: s.id,
      name: s.name,
      domain: s.domain ?? null,
      affiliateSupported: s.affiliateSupported ?? false,
      displayOrder: s.displayOrder ?? 0,
    })),
  );
  console.log(`Inserted ${RAW.services.length} services.`);

  // ── Facet categories + values
  await db.insert(facetCategories).values(
    RAW.facetCatalog.categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      displayOrder: c.displayOrder ?? 0,
      multiValue: c.multiValue ?? true,
      visibleToUsers: c.visibleToUsers ?? true,
    })),
  );
  console.log(`Inserted ${RAW.facetCatalog.categories.length} facet_categories.`);

  let facetValueCount = 0;
  for (const cat of RAW.facetCatalog.categories) {
    if (cat.values.length === 0) continue;
    await db.insert(facetValues).values(
      cat.values.map((v) => ({
        id: v.id,
        categoryId: cat.id,
        name: v.name,
        description: v.description ?? null,
        displayOrder: v.displayOrder ?? 0,
      })),
    );
    facetValueCount += cat.values.length;
  }
  console.log(`Inserted ${facetValueCount} facet_values.`);

  const knownFacetValues = collectFacetValueIds(RAW.facetCatalog);
  const knownEraIds = new Set(RAW.eras.map((e) => e.id));

  // ── Persons
  await db.insert(persons).values(
    RAW.persons.map((p) => ({
      id: p.id,
      name: p.name,
      nameSort: p.nameSort,
      bio: p.bio ?? null,
      birthYear: p.birthYear ?? null,
      lexicanumUrl: p.lexicanumUrl ?? null,
      wikipediaUrl: p.wikipediaUrl ?? null,
      extras: p.extras ?? null,
    })),
  );
  console.log(`Inserted ${RAW.persons.length} persons.`);

  // ── Works + book_details + junctions, per-book transactional helper.
  let workCount = 0;
  let bookDetailsCount = 0;
  let workFactionsCount = 0;
  let workPersonsCount = 0;
  let workFacetsCount = 0;
  let externalLinksCount = 0;

  for (const b of RAW.books) {
    // Slug carries the `-{id}` suffix to guarantee uniqueness across the
    // catalog. Editorial decision 2026-05-02 (session 027): bare title
    // slugs (`horus-rising`) would collide at Phase-4 scale (200+ books,
    // multiple Black Library reissues with identical titles). Cosmetic
    // noise in the URL (`-hh01`) is the accepted cost.
    const slug = slugify(`${b.title}-${b.id}`);

    // Validate primaryEraId strictly — Constraint 4 of brief 2026-05-02-023.
    // The DB column is nullable, but the catalog must always carry a value;
    // failing here keeps the seed as the discriminator for editorial drift.
    if (!b.primaryEraId) {
      throw new Error(`Book ${b.id} '${b.title}': missing primaryEraId.`);
    }
    if (!knownEraIds.has(b.primaryEraId)) {
      throw new Error(
        `Book ${b.id} '${b.title}': primaryEraId '${b.primaryEraId}' not in eras.json.`,
      );
    }

    // Validate facet ids before opening a transaction so we surface bad
    // book.json data with a clear error rather than a Postgres FK violation.
    const facetIds: string[] = [];
    if (b.facets) {
      for (const [, raw] of Object.entries(b.facets)) {
        const list = Array.isArray(raw) ? raw : [raw];
        for (const id of list) {
          if (!knownFacetValues.has(id)) {
            throw new Error(`Book ${b.id}: unknown facet_value '${id}'. Check facet-catalog.json.`);
          }
          facetIds.push(id);
        }
      }
    }

    await db.transaction(async (tx) => {
      // works (parent — kind='book' is hard-coded here; the helper IS the
      // discriminator-integrity guarantee on the app side).
      const [w] = await tx
        .insert(works)
        .values({
          kind: "book",
          slug,
          title: b.title,
          synopsis: b.synopsis ?? null,
          startY: String(b.startY),
          endY: String(b.endY),
          releaseYear: b.pubYear ?? null,
          sourceKind: "manual",
          confidence:
            b.confidence !== undefined ? b.confidence.toFixed(2) : undefined,
        })
        .returning({ id: works.id });
      const workId = w.id;
      workCount += 1;

      // book_details
      await tx.insert(bookDetails).values({
        workId,
        isbn13: b.isbn13 ?? null,
        isbn10: b.isbn10 ?? null,
        seriesId: b.series ?? null,
        seriesIndex: b.seriesIndex ?? null,
        pageCount: b.pageCount ?? null,
        format: b.format ?? null,
        availability: b.availability ?? null,
        primaryEraId: b.primaryEraId,
      });
      bookDetailsCount += 1;

      // work_factions
      if (b.factions?.length) {
        await tx.insert(workFactions).values(
          b.factions.map((f) => ({
            workId,
            factionId: f.id,
            role: f.role ?? "supporting",
          })),
        );
        workFactionsCount += b.factions.length;
      }

      // work_persons
      if (b.persons?.length) {
        await tx.insert(workPersons).values(
          b.persons.map((p) => ({
            workId,
            personId: p.id,
            role: p.role,
            displayOrder: p.displayOrder ?? 0,
            note: p.note ?? null,
          })),
        );
        workPersonsCount += b.persons.length;
      }

      // work_facets
      if (facetIds.length > 0) {
        await tx.insert(workFacets).values(
          facetIds.map((facetValueId) => ({ workId, facetValueId })),
        );
        workFacetsCount += facetIds.length;
      }

      // external_links
      if (b.externalLinks?.length) {
        await tx.insert(externalLinks).values(
          b.externalLinks.map((l, i) => ({
            workId,
            kind: l.kind,
            serviceId: l.service,
            url: l.url,
            label: l.label ?? null,
            region: l.region ?? null,
            affiliate: l.affiliate ?? false,
            displayOrder: l.displayOrder ?? i,
          })),
        );
        externalLinksCount += b.externalLinks.length;
      }
    });
  }

  console.log(`Inserted ${workCount} works (kind=book).`);
  console.log(`Inserted ${bookDetailsCount} book_details.`);
  console.log(`Inserted ${workFactionsCount} work_factions.`);
  console.log(`Inserted ${workPersonsCount} work_persons.`);
  console.log(`Inserted ${workFacetsCount} work_facets.`);
  console.log(`Inserted ${externalLinksCount} external_links.`);

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
