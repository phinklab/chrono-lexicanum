/**
 * build-snapshot.ts — Launch S1a (E1). `npm run snapshot:regen`.
 *
 * Exports the CONCRETE build-critical projections out of Postgres into
 * committed, diff-friendly JSON under `scripts/snapshot-data/` so `next build`
 * can prerender without a live DB (S1b wires the loaders; the snapshot files
 * themselves are committed only in the dedicated Snapshot-PR — E4: that PR IS
 * the deploy). Postgres stays the single source of truth; this is a mechanical
 * Abzug (Atlas pattern), never an editing surface.
 *
 * Scope (plan § Session 1a Punkt 1 — and nothing more):
 *   - Home + /archive search surface  → browse-books.json (BrowseData)
 *   - Podcast index                   → podcast-index.json (PodcastIndexShow[])
 *   - Unified search podcast half     → podcast-search.json (PodcastSearchData)
 *   - Compendium suggestion sources   → faction-guide/charaktere-rows/
 *                                       welten-rows/personen-rows.json
 *   - Entity prerender subset         → entity-hot-ids.json +
 *                                       entities/<type>/<id>.json (EntityView)
 *   - Book prerender subset (S4b)     → book-hot-slugs.json +
 *                                       books/<slug>.json (BookDetail)
 *   - Book slug list (S4b)            → book-slugs.json (string[] — the S5
 *                                       sitemap reads this at build time)
 * NOT here: /map (committed map-worlds.json), /timeline, /ask, /archive
 * (searchParams-dynamic), /ask/faction (committed JSON), /compendium
 * (force-dynamic).
 *
 * ── The duplicate window ────────────────────────────────────────────────────
 * The productive loaders import `server-only` and cannot run under tsx, so the
 * query+transform bodies below are VERBATIM transplants (each block cites its
 * source file). TYPES from those server-only modules come in exclusively via
 * `import type` (erased at runtime); the explicit return-type annotations on
 * every projection ARE the compile-time contract that export shapes equal the
 * loader return shapes. The window closes in S1b when the loaders read this
 * snapshot at build time. Runtime imports from `src/**` are limited to modules
 * that are documented PURE (or the DB layer every script already uses):
 * `@/db/client` + `@/db/schema`, `@/lib/entity/hot-subset`, `@/lib/entity/types`
 * (kindLabel), `@/lib/book/hot-subset` (+ its `@/lib/ask/faction-starters`
 * source, committed JSON + pure validator), `@/lib/compendium/primarchs`,
 * `@/lib/facet-visibility`,
 * `@/lib/work-links` (workHref + resolveEpisodeShows; no `server-only`) — the
 * curated constants among them are exactly the editorial intent that must NOT
 * be duplicated into a second drifting copy.
 *
 * ── Fail-closed ─────────────────────────────────────────────────────────────
 * The src loaders degrade to `[]`/`null` on DB errors so a broken build-time DB
 * renders an empty hall. The exporter must NEVER inherit that: there is no
 * try/catch around any projection, empty or implausibly small core projections
 * abort (MIN_COUNTS), a hot id without an EntityView payload aborts, an eras
 * set drifted from eras.json aborts, and a repo↔DB migration-head mismatch
 * aborts — all BEFORE anything is written.
 *
 * ── Determinism ─────────────────────────────────────────────────────────────
 * Two runs against an unchanged DB produce byte-identical files: every raw row
 * set is pre-sorted on a unique key (codepoint order) before the verbatim
 * transforms run, SQL ORDER BY clauses carry an id tiebreaker, and the manifest
 * carries the previous generatedAt forward when nothing changed
 * (`resolveGeneratedAt`). Documented ordering deviations from the live loaders
 * (which return incidental DB order): browse books sort by slug, authors sort
 * by work_persons.display_order, hot-id lists sort ascending, podcast rows
 * pre-sorted by slug/id. Consumers rank/sort downstream, so only tie order can
 * differ from a live render.
 *
 * CLI:
 *   npm run snapshot:regen                      # full export (read-only on the DB)
 *   npx tsx --env-file=.env.local scripts/build-snapshot.ts --check-migrations
 *                                               # parity check only, writes nothing
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";

import { and, asc, count, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db/client";
import {
  bookDetails as bookDetailsTable,
  characters as charactersTable,
  eras as erasTable,
  facetValues as facetValuesTable,
  factions as factionsTable,
  locations as locationsTable,
  persons as personsTable,
  sectors as sectorsTable,
  series as seriesTable,
  workCharacters as workCharactersTable,
  workCollections as workCollectionsTable,
  workFacets as workFacetsTable,
  workFactions as workFactionsTable,
  workLocations as workLocationsTable,
  workPersons as workPersonsTable,
  works as worksTable,
} from "@/db/schema";
import { HOT_BOOK_SLUGS } from "@/lib/book/hot-subset";
import { HOT_ENTITY_IDS } from "@/lib/entity/hot-subset";
import { kindLabel } from "@/lib/entity/types";
import { PRIMARCH_MERGES } from "@/lib/compendium/primarchs";
import { isVisibleFacetCategory } from "@/lib/facet-visibility";
import { resolveEpisodeShows, workHref } from "@/lib/work-links";

import type {
  BrowseBook,
  BrowseData,
  BrowseFacet,
  BrowseFaction,
  EraOption,
} from "@/app/archive/loader";
import type {
  EpisodeStub,
  PlatformLink,
  PodcastIndexShow,
  PodcastSearchData,
} from "@/app/archive/podcasts/loader";
import type { FactionGuide } from "@/app/fraktionen/loader";
import type { BookDetail } from "@/lib/book/loadBook";
import type {
  CharaktereRow,
  PersonenRow,
  WeltenRow,
} from "@/lib/compendium/queries";
import type {
  Blurb,
  CrossLinkGroup,
  EntityRef,
  EntityType,
  EntityView,
  FactRow,
  WorkGroup,
  WorkRef,
} from "@/lib/entity/types";

import {
  DATA_ARTIFACTS,
  MANIFEST_FILENAME,
  SNAPSHOT_DIR,
  assertEraParity,
  assertPlausibleCounts,
  bookArtifactPath,
  entityArtifactPath,
  parseManifest,
  resolveGeneratedAt,
  serializeArtifact,
  sha256Hex,
  type SnapshotCounts,
  type SnapshotManifest,
  type SourceMigration,
} from "./snapshot-shared";

const REPO_ROOT = process.cwd();
const SNAPSHOT_ABS = resolve(REPO_ROOT, SNAPSHOT_DIR);
const MIGRATIONS_FOLDER = resolve(REPO_ROOT, "src", "db", "migrations");
const SEED_DIR = resolve(REPO_ROOT, "scripts", "seed-data");

/** Locale-independent, codepoint-order comparator for deterministic pre-sorts. */
function byKey<T>(key: (v: T) => string): (a: T, b: T) => number {
  return (a, b) => {
    const ka = key(a);
    const kb = key(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  };
}

// =============================================================================
// Migration-head parity (repo == DB) — read-only, also the --check-migrations mode
// =============================================================================

interface JournalFile {
  entries: Array<{ tag: string; when: number }>;
}

/**
 * Compares the committed migration set against `drizzle.__drizzle_migrations`
 * in order — count, per-migration content hash AND journal timestamp. Any
 * mismatch throws: a snapshot must never be generated from (and the release
 * runbook must never sync into) a DB whose migration head differs from the
 * repo. No improvised migration here; a mismatch is a STOP.
 *
 * Line-ending tolerance: drizzle's migrator hashes the RAW file bytes, and this
 * repo's history carries both LF- and CRLF-checked-out .sql files (verified
 * 2026-07-11: 7 of 16 applied DB hashes are the LF variant of files that sit in
 * a Windows checkout as CRLF). Identical SQL modulo line endings IS parity, so
 * the DB hash may match any of {raw, LF-normalized, CRLF-normalized}; a real
 * content edit still fails all three. The manifest records the LF-normalized
 * hash — reproducible from any checkout regardless of git autocrlf.
 */
export async function verifyMigrationParity(): Promise<SourceMigration> {
  const journal = JSON.parse(
    readFileSync(join(MIGRATIONS_FOLDER, "meta", "_journal.json"), "utf8"),
  ) as JournalFile;
  const repo = journal.entries.map((e) => {
    const raw = readFileSync(join(MIGRATIONS_FOLDER, `${e.tag}.sql`), "utf8");
    const lf = raw.replace(/\r\n/g, "\n");
    const crlf = lf.replace(/\n/g, "\r\n");
    return {
      tag: e.tag,
      when: e.when,
      acceptedHashes: new Set([sha256Hex(raw), sha256Hex(lf), sha256Hex(crlf)]),
      lfHash: sha256Hex(lf),
    };
  });

  const result = (await db.execute(
    sql`select hash, created_at from drizzle.__drizzle_migrations order by created_at asc, id asc`,
  )) as Array<Record<string, unknown>>;
  if (!Array.isArray(result)) {
    throw new Error("[snapshot] migration query did not return a row array.");
  }

  const problems: string[] = [];
  if (result.length !== repo.length) {
    problems.push(
      `repo has ${repo.length} migration(s), DB has ${result.length} applied` +
        (result.length < repo.length
          ? " — unapplied migrations; run the regular migrate workflow first"
          : " — DB is ahead of this checkout; update the repo first"),
    );
  }
  const compared = Math.min(result.length, repo.length);
  for (let i = 0; i < compared; i++) {
    const dbHash = String(result[i]["hash"]);
    const dbMillis = Number(result[i]["created_at"]);
    if (!repo[i].acceptedHashes.has(dbHash)) {
      problems.push(
        `migration #${i} (${repo[i].tag}): DB hash ${dbHash.slice(0, 12)}… matches no line-ending variant of the repo file (LF ${repo[i].lfHash.slice(0, 12)}…)`,
      );
    }
    if (dbMillis !== repo[i].when) {
      problems.push(
        `migration #${i} (${repo[i].tag}): journal when ${repo[i].when} ≠ DB created_at ${dbMillis}`,
      );
    }
  }
  if (problems.length > 0) {
    throw new Error(
      `[snapshot] migration head parity FAILED (repo ≠ DB) — STOP, no improvised migration:\n` +
        problems.map((p) => `  - ${p}`).join("\n"),
    );
  }

  const last = repo[repo.length - 1];
  return {
    count: repo.length,
    lastTag: last.tag,
    lastHash: last.lfHash,
  };
}

// =============================================================================
// Projection 1 — BrowseData (verbatim from src/app/archive/loader.ts
// `fetchBrowseBooks`, minus try/catch, plus deterministic ordering)
// =============================================================================

export async function projectBrowseData(): Promise<BrowseData> {
  const [rows, erasRows] = await Promise.all([
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "book"),
      columns: {
        id: true,
        slug: true,
        title: true,
        releaseYear: true,
      },
      with: {
        bookDetails: {
          columns: {
            format: true,
            primaryEraId: true,
          },
          with: { series: { columns: { name: true } } },
        },
        factions: {
          columns: { role: true },
          with: {
            faction: {
              columns: { id: true, name: true, alignment: true, parentId: true },
            },
          },
        },
        facets: {
          columns: {},
          with: {
            facetValue: {
              columns: { id: true, name: true, categoryId: true },
              with: { category: { columns: { name: true } } },
            },
          },
        },
        persons: {
          columns: { role: true, displayOrder: true },
          with: { person: { columns: { name: true } } },
        },
      },
    }),
    db
      .select({
        id: erasTable.id,
        name: erasTable.name,
        sortOrder: erasTable.sortOrder,
      })
      .from(erasTable),
  ]);

  // Deterministic ordering (live loader returns incidental DB order): books by
  // slug; authors by the curated work_persons.display_order.
  rows.sort(byKey((w) => w.slug));

  const erasById = new Map(erasRows.map((e) => [e.id, e.name]));

  const books: BrowseBook[] = rows.map((w) => {
    const authors = w.persons
      .filter((wp) => wp.role === "author")
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((wp) => wp.person.name);

    const factions: BrowseFaction[] = w.factions
      .map((wf) => ({
        id: wf.faction.id,
        name: wf.faction.name,
        role: wf.role ?? null,
        alignment: wf.faction.alignment ?? null,
        parentId: wf.faction.parentId ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "en"));

    const facets: BrowseFacet[] = w.facets
      .filter((wf) => isVisibleFacetCategory(wf.facetValue.categoryId))
      .map((wf) => ({
        id: wf.facetValue.id,
        name: wf.facetValue.name,
        categoryId: wf.facetValue.categoryId,
        categoryName: wf.facetValue.category?.name ?? null,
      }))
      .sort((a, b) => {
        const cat = (a.categoryName ?? "").localeCompare(b.categoryName ?? "", "en");
        return cat !== 0 ? cat : a.name.localeCompare(b.name, "en");
      });

    const eraId = w.bookDetails?.primaryEraId ?? null;

    return {
      id: w.id,
      slug: w.slug,
      title: w.title,
      releaseYear: w.releaseYear,
      format: w.bookDetails?.format ?? null,
      eraName: eraId ? (erasById.get(eraId) ?? null) : null,
      seriesName: w.bookDetails?.series?.name ?? null,
      authors,
      factions,
      facets,
    };
  });

  const eras: EraOption[] = erasRows
    .map((e) => ({ id: e.id, name: e.name, sortOrder: e.sortOrder }))
    .sort((a, b) => a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : 1));

  return { books, eras };
}

// =============================================================================
// Projections 2+3 — podcast index + podcast search (verbatim from
// src/app/archive/podcasts/loader.ts, minus try/catch, deterministic pre-sorts)
// =============================================================================

const PLATFORM: Record<string, { label: string; order: number }> = {
  apple_podcasts: { label: "Apple Podcasts", order: 1 },
  spotify: { label: "Spotify", order: 2 },
  youtube: { label: "YouTube", order: 3 },
  official_website: { label: "Website", order: 4 },
  rss: { label: "RSS", order: 5 },
};

interface RawLink {
  serviceId: string;
  url: string;
  service: { name: string; displayOrder: number } | null;
}

function buildPlatformLinks(links: RawLink[]): PlatformLink[] {
  return [...links]
    .sort(byKey((l) => `${l.serviceId} ${l.url}`))
    .map((l) => {
      const meta = PLATFORM[l.serviceId];
      return {
        serviceId: l.serviceId,
        url: l.url,
        label: meta?.label ?? l.service?.name ?? l.serviceId,
        order: meta?.order ?? 90 + (l.service?.displayOrder ?? 0) / 1000,
      };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ serviceId, url, label }) => ({ serviceId, url, label }));
}

function toMs(d: Date | null | undefined): number | null {
  return d ? d.getTime() : null;
}
function yearOf(ms: number | null): number | null {
  return ms == null ? null : new Date(ms).getUTCFullYear();
}
function byNewest(
  a: { pubDateMs: number | null; title: string },
  b: { pubDateMs: number | null; title: string },
): number {
  if (a.pubDateMs == null && b.pubDateMs == null)
    return a.title.localeCompare(b.title, "en");
  if (a.pubDateMs == null) return 1;
  if (b.pubDateMs == null) return -1;
  return b.pubDateMs - a.pubDateMs;
}

export async function projectPodcastIndex(): Promise<PodcastIndexShow[]> {
  const [showRows, episodeRows] = await Promise.all([
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "podcast"),
      columns: { id: true, slug: true, title: true, coverUrl: true },
      with: {
        podcastDetails: { columns: { imageUrl: true } },
        externalLinks: {
          columns: { serviceId: true, url: true },
          with: { service: { columns: { name: true, displayOrder: true } } },
        },
      },
    }),
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "podcast_episode"),
      columns: { id: true, title: true },
      with: {
        podcastEpisodeDetails: {
          columns: { podcastWorkId: true, pubDate: true },
        },
      },
    }),
  ]);

  showRows.sort(byKey((w) => w.slug));
  episodeRows.sort(byKey((w) => w.id));

  const byShow = new Map<string, EpisodeStub[]>();
  for (const w of episodeRows) {
    const d = w.podcastEpisodeDetails;
    if (!d) continue;
    const stub: EpisodeStub = { id: w.id, title: w.title, pubDateMs: toMs(d.pubDate) };
    const bucket = byShow.get(d.podcastWorkId);
    if (bucket) bucket.push(stub);
    else byShow.set(d.podcastWorkId, [stub]);
  }

  return showRows
    .map((w) => {
      const eps = (byShow.get(w.id) ?? []).sort(byNewest);
      const years = eps
        .map((e) => yearOf(e.pubDateMs))
        .filter((y): y is number => y != null);
      return {
        id: w.id,
        slug: w.slug,
        title: w.title,
        artUrl: w.coverUrl ?? w.podcastDetails?.imageUrl ?? null,
        episodeCount: eps.length,
        firstPubYear: years.length ? Math.min(...years) : null,
        lastPubYear: years.length ? Math.max(...years) : null,
        platformLinks: buildPlatformLinks(w.externalLinks),
        latest: eps.slice(0, 3),
      };
    })
    .sort((a, b) => b.episodeCount - a.episodeCount);
}

export async function projectPodcastSearch(): Promise<PodcastSearchData> {
  const [showRows, episodeRows] = await Promise.all([
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "podcast"),
      columns: { id: true, slug: true, title: true },
    }),
    db.query.works.findMany({
      where: (w, { eq }) => eq(w.kind, "podcast_episode"),
      columns: { id: true, title: true },
      with: { podcastEpisodeDetails: { columns: { podcastWorkId: true } } },
    }),
  ]);

  showRows.sort(byKey((w) => w.slug));
  episodeRows.sort(byKey((w) => w.id));

  const showById = new Map(
    showRows.map((s) => [s.id, { slug: s.slug, title: s.title }]),
  );
  const countBySlug = new Map<string, number>();
  const episodes: PodcastSearchData["episodes"] = [];
  for (const w of episodeRows) {
    const showId = w.podcastEpisodeDetails?.podcastWorkId;
    const show = showId ? showById.get(showId) : undefined;
    if (!show) {
      // The src loader silently drops orphaned episodes; a frozen snapshot must
      // not silently shrink — an episode without a show is data drift.
      throw new Error(
        `[snapshot] podcast episode ${w.id} ("${w.title}") has no resolvable show.`,
      );
    }
    episodes.push({ id: w.id, title: w.title, showSlug: show.slug, showTitle: show.title });
    countBySlug.set(show.slug, (countBySlug.get(show.slug) ?? 0) + 1);
  }

  const shows = showRows.map((s) => ({
    slug: s.slug,
    title: s.title,
    episodeCount: countBySlug.get(s.slug) ?? 0,
  }));

  return { shows, episodes };
}

// =============================================================================
// Projection 4 — FactionGuide[] (verbatim from src/app/fraktionen/loader.ts,
// minus try/catch, facRows pre-sorted by id)
// =============================================================================

export async function projectFactionGuide(): Promise<FactionGuide[]> {
  const [facRows, workAgg, charAgg, subAgg] = await Promise.all([
    db
      .select({
        id: factionsTable.id,
        name: factionsTable.name,
        parentId: factionsTable.parentId,
        alignment: factionsTable.alignment,
        tone: factionsTable.tone,
        glyph: factionsTable.glyph,
      })
      .from(factionsTable),
    db
      .select({
        factionId: workFactionsTable.factionId,
        kind: worksTable.kind,
        n: count(),
      })
      .from(workFactionsTable)
      .innerJoin(worksTable, eq(worksTable.id, workFactionsTable.workId))
      .groupBy(workFactionsTable.factionId, worksTable.kind),
    db
      .select({ factionId: charactersTable.primaryFactionId, n: count() })
      .from(charactersTable)
      .where(isNotNull(charactersTable.primaryFactionId))
      .groupBy(charactersTable.primaryFactionId),
    db
      .select({ parentId: factionsTable.parentId, n: count() })
      .from(factionsTable)
      .where(isNotNull(factionsTable.parentId))
      .groupBy(factionsTable.parentId),
  ]);

  facRows.sort(byKey((f) => f.id));

  const books = new Map<string, number>();
  const episodes = new Map<string, number>();
  for (const r of workAgg) {
    if (!r.factionId) continue;
    const n = Number(r.n);
    if (r.kind === "book") books.set(r.factionId, n);
    else if (r.kind === "podcast_episode")
      episodes.set(r.factionId, (episodes.get(r.factionId) ?? 0) + n);
  }
  const chars = new Map<string, number>();
  for (const r of charAgg) if (r.factionId) chars.set(r.factionId, Number(r.n));
  const subs = new Map<string, number>();
  for (const r of subAgg) if (r.parentId) subs.set(r.parentId, Number(r.n));

  return facRows.map((f) => ({
    id: f.id,
    name: f.name,
    parentId: f.parentId,
    alignment: f.alignment,
    tone: f.tone,
    glyph: f.glyph,
    bookCount: books.get(f.id) ?? 0,
    episodeCount: episodes.get(f.id) ?? 0,
    characterCount: chars.get(f.id) ?? 0,
    subfactionCount: subs.get(f.id) ?? 0,
  }));
}

// =============================================================================
// Projections 5–7 — compendium inventory rows (verbatim from
// src/lib/compendium/queries.ts, minus try/catch → degraded-empty; the shared
// coercion helpers are copied with it)
// =============================================================================

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
};

const parsePgTextArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((x) => String(x));
  if (typeof value !== "string") return [];
  const body = value.trim();
  if (!body.startsWith("{") || !body.endsWith("}")) return [];
  const inner = body.slice(1, -1);
  if (inner === "") return [];

  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  let elemQuoted = false;
  const flush = () => {
    if (!(cur === "NULL" && !elemQuoted)) out.push(cur);
    cur = "";
    elemQuoted = false;
  };
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inQuotes) {
      if (ch === "\\") cur += inner[++i] ?? "";
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
      elemQuoted = true;
    } else if (ch === ",") {
      flush();
    } else {
      cur += ch;
    }
  }
  flush();
  return out;
};

function validateSqlResult(result: unknown): ReadonlyArray<Record<string, unknown>> {
  if (!Array.isArray(result)) {
    throw new Error("[snapshot] SQL result is not a row array");
  }
  const rows: Array<Record<string, unknown>> = [];
  for (const row of result) {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      throw new Error("[snapshot] SQL result row is not a plain object");
    }
    rows.push(row);
  }
  return rows;
}

export async function projectWeltenRows(): Promise<WeltenRow[]> {
  const rows = validateSqlResult(await db.execute(sql`
    SELECT
      l.id,
      l.name,
      l.sector_id,
      s.name AS sector_name,
      l.gx,
      l.gy,
      l.capital,
      l.warp,
      COALESCE(wl.cnt, 0)::int AS work_count
    FROM locations l
    LEFT JOIN sectors s ON s.id = l.sector_id
    LEFT JOIN (
      SELECT location_id, count(*)::int AS cnt
      FROM work_locations
      GROUP BY location_id
    ) wl ON wl.location_id = l.id
    ORDER BY l.id
  `));

  return rows
    .map((r): WeltenRow => ({
      id: String(r["id"]),
      name: String(r["name"]),
      sectorId: r["sector_id"] == null ? null : String(r["sector_id"]),
      sectorName: r["sector_name"] == null ? null : String(r["sector_name"]),
      gx: r["gx"] == null ? null : toNumber(r["gx"]),
      gy: r["gy"] == null ? null : toNumber(r["gy"]),
      capital: r["capital"] === true,
      warp: r["warp"] === true,
      workCount: toNumber(r["work_count"]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export async function projectCharaktereRows(): Promise<CharaktereRow[]> {
  const rows = validateSqlResult(await db.execute(sql`
    SELECT
      c.id,
      c.name,
      c.primary_faction_id,
      f.name      AS faction_name,
      f.alignment AS faction_alignment,
      COALESCE(wc.cnt, 0)::int AS work_count
    FROM characters c
    LEFT JOIN factions f ON f.id = c.primary_faction_id
    LEFT JOIN (
      SELECT character_id, count(*)::int AS cnt
      FROM work_characters
      GROUP BY character_id
    ) wc ON wc.character_id = c.id
    ORDER BY c.id
  `));

  return rows
    .map((r): CharaktereRow => ({
      id: String(r["id"]),
      name: String(r["name"]),
      primaryFactionId:
        r["primary_faction_id"] == null ? null : String(r["primary_faction_id"]),
      primaryFactionName: r["faction_name"] == null ? null : String(r["faction_name"]),
      primaryFactionAlignment:
        r["faction_alignment"] == null ? null : String(r["faction_alignment"]),
      workCount: toNumber(r["work_count"]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export async function projectPersonenRows(): Promise<PersonenRow[]> {
  const rows = validateSqlResult(await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.name_sort,
      COALESCE(wp.cnt, 0)::int       AS work_count,
      COALESCE(wp.is_author, false)  AS is_author,
      wp.roles                       AS roles
    FROM persons p
    LEFT JOIN (
      SELECT
        person_id,
        count(DISTINCT work_id)::int                       AS cnt,
        bool_or(role = 'author')                           AS is_author,
        array_agg(DISTINCT role::text ORDER BY role::text) AS roles
      FROM work_persons
      GROUP BY person_id
    ) wp ON wp.person_id = p.id
    ORDER BY p.id
  `));

  return rows
    .map((r): PersonenRow => {
      const roles = parsePgTextArray(r["roles"]);
      return {
        id: String(r["id"]),
        name: String(r["name"]),
        nameSort: String(r["name_sort"]),
        workCount: toNumber(r["work_count"]),
        isAuthor: r["is_author"] === true,
        roles,
      };
    })
    .sort((a, b) => a.nameSort.localeCompare(b.nameSort, "de"));
}

// =============================================================================
// Projection 8 — hot entity ids (mirrors listHotEntityIds in
// src/lib/entity/loader.ts, but throws instead of degrading and sorts asc)
// =============================================================================

const ENTITY_TYPES: readonly EntityType[] = [
  "character",
  "faction",
  "location",
  "person",
];

export async function projectHotEntityIds(): Promise<{
  hotIds: Record<EntityType, string[]>;
  curatedMissing: Array<{ type: EntityType; id: string }>;
}> {
  const tableFor = {
    character: charactersTable,
    faction: factionsTable,
    location: locationsTable,
    person: personsTable,
  } as const;

  const hotIds = {} as Record<EntityType, string[]>;
  const curatedMissing: Array<{ type: EntityType; id: string }> = [];
  for (const type of ENTITY_TYPES) {
    const curated = [...HOT_ENTITY_IDS[type]];
    const table = tableFor[type];
    const rows = await db
      .select({ id: table.id })
      .from(table)
      .where(inArray(table.id, curated));
    const found = new Set(rows.map((r) => r.id));
    for (const id of curated) {
      if (!found.has(id)) curatedMissing.push({ type, id });
    }
    hotIds[type] = curated.filter((id) => found.has(id)).sort();
  }
  return { hotIds, curatedMissing };
}

// =============================================================================
// Projection 9 — EntityView per hot id (verbatim from src/lib/entity/loader.ts
// per-type loaders, minus cache()/try-catch; blurb lookup replicates
// src/lib/blurbs/index.ts over the same committed seed JSONs)
// =============================================================================

const KIND_ORDER = [
  "book",
  "podcast_episode",
  "podcast",
  "film",
  "tv_series",
  "channel",
  "video",
];

const DEFAULT_WORK_ROLE: Record<EntityType, string> = {
  character: "appears",
  faction: "supporting",
  location: "secondary",
  person: "author",
};

const ALIGNMENT_LABELS: Record<string, string> = {
  imperium: "Imperium",
  chaos: "Chaos",
  xenos: "Xenos",
  neutral: "Neutral",
};

const PERSON_ROLE_LABELS: Record<string, string> = {
  author: "Author",
  co_author: "Co-author",
  translator: "Translator",
  editor: "Editor",
  narrator: "Narrator",
  co_narrator: "Co-narrator",
  full_cast: "Full cast",
  director: "Director",
  co_director: "Co-director",
  cover_artist: "Cover artist",
  sound_designer: "Sound designer",
};

const PERSON_ROLE_ORDER = [
  "author",
  "co_author",
  "translator",
  "editor",
  "narrator",
  "co_narrator",
  "full_cast",
  "director",
  "co_director",
  "cover_artist",
  "sound_designer",
];

const CROSSLINK_CAP = 40;
const WORK_LIST_CAP = 500;

type RawBlurbFile = {
  blurbs: Array<{ id: string; blurb: string; confidence: number; sourceUrl?: string }>;
};

function indexBlurbs(file: RawBlurbFile): Map<string, Blurb> {
  const map = new Map<string, Blurb>();
  for (const b of file.blurbs) {
    map.set(b.id, {
      text: b.blurb,
      confidence: b.confidence,
      ...(b.sourceUrl ? { sourceUrl: b.sourceUrl } : {}),
    });
  }
  return map;
}

let blurbsByType: Partial<Record<EntityType, Map<string, Blurb>>> | null = null;

function getBlurb(type: EntityType, id: string): Blurb | null {
  if (blurbsByType === null) {
    const read = (name: string): RawBlurbFile =>
      JSON.parse(readFileSync(resolve(SEED_DIR, name), "utf8")) as RawBlurbFile;
    blurbsByType = {
      faction: indexBlurbs(read("faction-blurbs.json")),
      character: indexBlurbs(read("character-blurbs.json")),
      location: indexBlurbs(read("location-blurbs.json")),
    };
  }
  return blurbsByType[type]?.get(id) ?? null;
}

type RelatedWorkRow = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  releaseYear: number | null;
  coverUrl: string | null;
  role: string | null;
};

function sortWorks(works: WorkRef[]): WorkRef[] {
  return [...works].sort((a, b) => {
    if (a.releaseYear == null && b.releaseYear != null) return 1;
    if (a.releaseYear != null && b.releaseYear == null) return -1;
    if (a.releaseYear != null && b.releaseYear != null && a.releaseYear !== b.releaseYear) {
      return a.releaseYear - b.releaseYear;
    }
    return a.title.localeCompare(b.title);
  });
}

async function buildWorkGroups(
  rows: RelatedWorkRow[],
  type: EntityType,
): Promise<WorkGroup[]> {
  // Deterministic tie order for the verbatim transforms below.
  rows = [...rows].sort(byKey((r) => `${r.id} ${r.role ?? ""}`));

  const defaultRole = DEFAULT_WORK_ROLE[type];
  const shows = await resolveEpisodeShows(
    rows.filter((r) => r.kind === "podcast_episode").map((r) => r.id),
  );

  const byKind = new Map<string, WorkRef[]>();
  for (const r of rows) {
    const show = shows.get(r.id);
    const ref: WorkRef = {
      slug: r.slug,
      title: r.title,
      kind: r.kind,
      releaseYear: r.releaseYear,
      coverUrl: r.coverUrl,
      role: r.role && r.role !== defaultRole ? r.role : null,
      href: workHref(r.kind, r.slug, show?.slug ?? null, r.id),
      showTitle: show?.title ?? null,
    };
    const list = byKind.get(r.kind);
    if (list) list.push(ref);
    else byKind.set(r.kind, [ref]);
  }
  const groups: WorkGroup[] = [];
  for (const kind of KIND_ORDER) {
    const works = byKind.get(kind);
    if (works) {
      groups.push({ kind, label: kindLabel(kind), works: sortWorks(works) });
      byKind.delete(kind);
    }
  }
  for (const [kind, works] of byKind) {
    groups.push({ kind, label: kindLabel(kind), works: sortWorks(works) });
  }
  return groups;
}

function mergePersonWorks(rows: RelatedWorkRow[]): RelatedWorkRow[] {
  const byWork = new Map<string, { base: RelatedWorkRow; roles: Set<string> }>();
  for (const r of rows) {
    const entry = byWork.get(r.id);
    if (entry) {
      if (r.role) entry.roles.add(r.role);
    } else {
      byWork.set(r.id, { base: r, roles: new Set(r.role ? [r.role] : []) });
    }
  }
  const out: RelatedWorkRow[] = [];
  for (const { base, roles } of byWork.values()) {
    const display = PERSON_ROLE_ORDER.filter(
      (role) => role !== "author" && roles.has(role),
    ).map((role) => PERSON_ROLE_LABELS[role] ?? role);
    out.push({ ...base, role: display.length > 0 ? display.join(" · ") : null });
  }
  return out;
}

async function loadCharacterView(id: string): Promise<EntityView | null> {
  const merge = PRIMARCH_MERGES[id];
  const characterIds = merge ? [id, ...merge.absorbs] : [id];

  const [headRows, workRows] = await Promise.all([
    db
      .select({
        id: charactersTable.id,
        name: charactersTable.name,
        primaryFactionId: charactersTable.primaryFactionId,
        factionName: factionsTable.name,
      })
      .from(charactersTable)
      .leftJoin(factionsTable, eq(factionsTable.id, charactersTable.primaryFactionId))
      .where(eq(charactersTable.id, id))
      .limit(1),
    db
      .select({
        id: worksTable.id,
        slug: worksTable.slug,
        title: worksTable.title,
        kind: worksTable.kind,
        releaseYear: worksTable.releaseYear,
        coverUrl: worksTable.coverUrl,
        role: workCharactersTable.role,
      })
      .from(workCharactersTable)
      .innerJoin(worksTable, eq(worksTable.id, workCharactersTable.workId))
      .where(
        characterIds.length === 1
          ? eq(workCharactersTable.characterId, id)
          : inArray(workCharactersTable.characterId, characterIds),
      )
      .orderBy(asc(worksTable.id), asc(workCharactersTable.characterId))
      .limit(WORK_LIST_CAP),
  ]);

  const row = headRows[0];
  if (!row) return null;

  const seenWorks = new Set<string>();
  const uniqueWorkRows = workRows.filter((w) => {
    if (seenWorks.has(w.id)) return false;
    seenWorks.add(w.id);
    return true;
  });

  const facts: FactRow[] = [];
  if (row.primaryFactionId && row.factionName) {
    facts.push({
      label: "Allegiance",
      value: { type: "faction", id: row.primaryFactionId, name: row.factionName },
    });
  }

  return {
    type: "character",
    id: row.id,
    name: merge ? merge.name : row.name,
    blurb: getBlurb("character", id) ?? undefined,
    facts,
    worksByKind: await buildWorkGroups(uniqueWorkRows, "character"),
    crossLinks: [],
  };
}

async function loadFactionView(id: string): Promise<EntityView | null> {
  const parentFactions = alias(factionsTable, "parent_factions");
  const [headRows, workRows, children, keyCharacters] = await Promise.all([
    db
      .select({
        id: factionsTable.id,
        name: factionsTable.name,
        alignment: factionsTable.alignment,
        glyph: factionsTable.glyph,
        parentId: factionsTable.parentId,
        parentName: parentFactions.name,
      })
      .from(factionsTable)
      .leftJoin(parentFactions, eq(parentFactions.id, factionsTable.parentId))
      .where(eq(factionsTable.id, id))
      .limit(1),
    db
      .select({
        id: worksTable.id,
        slug: worksTable.slug,
        title: worksTable.title,
        kind: worksTable.kind,
        releaseYear: worksTable.releaseYear,
        coverUrl: worksTable.coverUrl,
        role: workFactionsTable.role,
      })
      .from(workFactionsTable)
      .innerJoin(worksTable, eq(worksTable.id, workFactionsTable.workId))
      .where(eq(workFactionsTable.factionId, id))
      .orderBy(asc(worksTable.id))
      .limit(WORK_LIST_CAP),
    db
      .select({ id: factionsTable.id, name: factionsTable.name })
      .from(factionsTable)
      .where(eq(factionsTable.parentId, id))
      .orderBy(asc(factionsTable.name), asc(factionsTable.id))
      .limit(CROSSLINK_CAP),
    db
      .select({ id: charactersTable.id, name: charactersTable.name })
      .from(charactersTable)
      .where(eq(charactersTable.primaryFactionId, id))
      .orderBy(asc(charactersTable.name), asc(charactersTable.id))
      .limit(CROSSLINK_CAP),
  ]);

  const row = headRows[0];
  if (!row) return null;

  const facts: FactRow[] = [
    { label: "Alignment", value: ALIGNMENT_LABELS[row.alignment] ?? row.alignment },
  ];
  if (row.glyph) facts.push({ label: "Glyph", value: row.glyph });
  if (row.parentId && row.parentName) {
    facts.push({
      label: "Parent faction",
      value: { type: "faction", id: row.parentId, name: row.parentName },
    });
  }

  const crossLinks: CrossLinkGroup[] = [];
  if (children.length > 0) {
    crossLinks.push({
      label: "Sub-factions",
      items: children.map((c): EntityRef => ({ type: "faction", id: c.id, name: c.name })),
    });
  }
  if (keyCharacters.length > 0) {
    crossLinks.push({
      label: "Key characters",
      items: keyCharacters.map(
        (c): EntityRef => ({ type: "character", id: c.id, name: c.name }),
      ),
    });
  }

  return {
    type: "faction",
    id: row.id,
    name: row.name,
    blurb: getBlurb("faction", id) ?? undefined,
    facts,
    worksByKind: await buildWorkGroups(workRows, "faction"),
    crossLinks,
  };
}

async function loadLocationView(id: string): Promise<EntityView | null> {
  const [headRows, workRows] = await Promise.all([
    db
      .select({
        id: locationsTable.id,
        name: locationsTable.name,
        sectorId: locationsTable.sectorId,
        sectorName: sectorsTable.name,
        capital: locationsTable.capital,
        warp: locationsTable.warp,
        tags: locationsTable.tags,
      })
      .from(locationsTable)
      .leftJoin(sectorsTable, eq(sectorsTable.id, locationsTable.sectorId))
      .where(eq(locationsTable.id, id))
      .limit(1),
    db
      .select({
        id: worksTable.id,
        slug: worksTable.slug,
        title: worksTable.title,
        kind: worksTable.kind,
        releaseYear: worksTable.releaseYear,
        coverUrl: worksTable.coverUrl,
        role: workLocationsTable.role,
      })
      .from(workLocationsTable)
      .innerJoin(worksTable, eq(worksTable.id, workLocationsTable.workId))
      .where(eq(workLocationsTable.locationId, id))
      .orderBy(asc(worksTable.id))
      .limit(WORK_LIST_CAP),
  ]);

  const row = headRows[0];
  if (!row) return null;

  const siblings = row.sectorId
    ? await db
        .select({ id: locationsTable.id, name: locationsTable.name })
        .from(locationsTable)
        .where(and(eq(locationsTable.sectorId, row.sectorId), ne(locationsTable.id, id)))
        .orderBy(asc(locationsTable.name), asc(locationsTable.id))
        .limit(CROSSLINK_CAP)
    : [];

  const facts: FactRow[] = [];
  if (row.sectorName) facts.push({ label: "Sector", value: row.sectorName });
  if (row.capital) facts.push({ label: "Designation", value: "Sector capital" });
  if (row.warp) facts.push({ label: "Warp", value: "Warp anomaly" });

  const crossLinks: CrossLinkGroup[] = [];
  if (siblings.length > 0) {
    crossLinks.push({
      label: "Other worlds in sector",
      items: siblings.map((s): EntityRef => ({ type: "location", id: s.id, name: s.name })),
    });
  }

  return {
    type: "location",
    id: row.id,
    name: row.name,
    blurb: getBlurb("location", id) ?? undefined,
    facts,
    tags: row.tags && row.tags.length > 0 ? row.tags : undefined,
    worksByKind: await buildWorkGroups(workRows, "location"),
    crossLinks,
  };
}

async function loadPersonView(id: string): Promise<EntityView | null> {
  const [headRows, workRows] = await Promise.all([
    db
      .select({
        id: personsTable.id,
        name: personsTable.name,
        bio: personsTable.bio,
        birthYear: personsTable.birthYear,
      })
      .from(personsTable)
      .where(eq(personsTable.id, id))
      .limit(1),
    db
      .select({
        id: worksTable.id,
        slug: worksTable.slug,
        title: worksTable.title,
        kind: worksTable.kind,
        releaseYear: worksTable.releaseYear,
        coverUrl: worksTable.coverUrl,
        role: workPersonsTable.role,
      })
      .from(workPersonsTable)
      .innerJoin(worksTable, eq(worksTable.id, workPersonsTable.workId))
      .where(eq(workPersonsTable.personId, id))
      .orderBy(asc(worksTable.id), asc(workPersonsTable.role))
      .limit(WORK_LIST_CAP),
  ]);

  const row = headRows[0];
  if (!row) return null;

  const facts: FactRow[] = [];
  if (row.birthYear != null) {
    facts.push({ label: "Born", value: String(row.birthYear) });
  }

  return {
    type: "person",
    id: row.id,
    name: row.name,
    oneLine: row.bio ?? undefined,
    facts,
    worksByKind: await buildWorkGroups(mergePersonWorks(workRows), "person"),
    crossLinks: [],
  };
}

export async function projectEntityView(
  type: EntityType,
  id: string,
): Promise<EntityView | null> {
  switch (type) {
    case "character":
      return await loadCharacterView(id);
    case "faction":
      return await loadFactionView(id);
    case "location":
      return await loadLocationView(id);
    case "person":
      return await loadPersonView(id);
  }
}

// =============================================================================
// Projection 10 — hot book slugs (mirrors listHotBookSlugs in
// src/lib/book/loadBook.ts, but reports the drops; HOT_BOOK_SLUGS is already
// deduplicated + ascending)
// =============================================================================

export async function projectHotBookSlugs(): Promise<{
  hotSlugs: string[];
  curatedMissing: string[];
}> {
  const curated = [...HOT_BOOK_SLUGS];
  const rows = await db
    .select({ slug: worksTable.slug })
    .from(worksTable)
    .where(and(eq(worksTable.kind, "book"), inArray(worksTable.slug, curated)));
  const found = new Set(rows.map((r) => r.slug));
  return {
    hotSlugs: curated.filter((slug) => found.has(slug)),
    curatedMissing: curated.filter((slug) => !found.has(slug)),
  };
}

// =============================================================================
// Projection 11 — BookDetail per hot slug (verbatim from
// src/lib/book/loader-live.ts `loadBookLive`, minus cache()/cachedRead).
// Deterministic-ordering deviations from the live loader (which returns
// incidental DB order for the unordered junction queries): factions/locations/
// characters ORDER BY id, facets ORDER BY (category, name, id); persons and
// containedIn keep the live semantic ORDER BY and only gain a unique
// tiebreaker. Consumers group/filter downstream, so only tie order can differ
// from a live render.
// =============================================================================

export async function projectBookDetail(slug: string): Promise<BookDetail | null> {
  const [work] = await db
    .select({
      id: worksTable.id,
      slug: worksTable.slug,
      title: worksTable.title,
      synopsis: worksTable.synopsis,
      coverUrl: worksTable.coverUrl,
      releaseYear: worksTable.releaseYear,
    })
    .from(worksTable)
    .where(eq(worksTable.slug, slug))
    .limit(1);
  if (!work) return null;

  const [
    details,
    personRows,
    factionRows,
    locationRows,
    characterRows,
    facetRows,
    containedInRows,
  ] = await Promise.all([
    db
      .select({
        format: bookDetailsTable.format,
        isbn13: bookDetailsTable.isbn13,
        isbn10: bookDetailsTable.isbn10,
        seriesId: bookDetailsTable.seriesId,
        seriesName: seriesTable.name,
        seriesIndex: bookDetailsTable.seriesIndex,
        primaryEraId: bookDetailsTable.primaryEraId,
        eraName: erasTable.name,
      })
      .from(bookDetailsTable)
      .leftJoin(seriesTable, eq(seriesTable.id, bookDetailsTable.seriesId))
      .leftJoin(erasTable, eq(erasTable.id, bookDetailsTable.primaryEraId))
      .where(eq(bookDetailsTable.workId, work.id))
      .limit(1),
    db
      .select({
        id: personsTable.id,
        name: personsTable.name,
        role: workPersonsTable.role,
        displayOrder: workPersonsTable.displayOrder,
      })
      .from(workPersonsTable)
      .innerJoin(personsTable, eq(personsTable.id, workPersonsTable.personId))
      .where(eq(workPersonsTable.workId, work.id))
      .orderBy(
        asc(workPersonsTable.role),
        asc(workPersonsTable.displayOrder),
        asc(personsTable.id),
      ),
    db
      .select({
        id: factionsTable.id,
        name: factionsTable.name,
        role: workFactionsTable.role,
      })
      .from(workFactionsTable)
      .innerJoin(factionsTable, eq(factionsTable.id, workFactionsTable.factionId))
      .where(eq(workFactionsTable.workId, work.id))
      .orderBy(asc(factionsTable.id), asc(workFactionsTable.role)),
    db
      .select({
        id: locationsTable.id,
        name: locationsTable.name,
        role: workLocationsTable.role,
      })
      .from(workLocationsTable)
      .innerJoin(locationsTable, eq(locationsTable.id, workLocationsTable.locationId))
      .where(eq(workLocationsTable.workId, work.id))
      .orderBy(asc(locationsTable.id), asc(workLocationsTable.role)),
    db
      .select({
        id: charactersTable.id,
        name: charactersTable.name,
        role: workCharactersTable.role,
      })
      .from(workCharactersTable)
      .innerJoin(charactersTable, eq(charactersTable.id, workCharactersTable.characterId))
      .where(eq(workCharactersTable.workId, work.id))
      .orderBy(asc(charactersTable.id), asc(workCharactersTable.role)),
    db
      .select({ name: facetValuesTable.name, category: facetValuesTable.categoryId })
      .from(workFacetsTable)
      .innerJoin(facetValuesTable, eq(facetValuesTable.id, workFacetsTable.facetValueId))
      .where(eq(workFacetsTable.workId, work.id))
      .orderBy(
        asc(facetValuesTable.categoryId),
        asc(facetValuesTable.name),
        asc(facetValuesTable.id),
      ),
    db
      .select({
        collectionSlug: worksTable.slug,
        collectionTitle: worksTable.title,
      })
      .from(workCollectionsTable)
      .innerJoin(
        worksTable,
        eq(worksTable.id, workCollectionsTable.collectionWorkId),
      )
      .where(eq(workCollectionsTable.contentWorkId, work.id))
      .orderBy(
        asc(workCollectionsTable.displayOrder),
        asc(worksTable.title),
        asc(worksTable.slug),
      ),
  ]);

  return {
    ...work,
    format: details[0]?.format ?? null,
    isbn13: details[0]?.isbn13 ?? null,
    isbn10: details[0]?.isbn10 ?? null,
    seriesId: details[0]?.seriesId ?? null,
    seriesName: details[0]?.seriesName ?? null,
    seriesIndex: details[0]?.seriesIndex ?? null,
    primaryEraId: details[0]?.primaryEraId ?? null,
    eraName: details[0]?.eraName ?? null,
    persons: personRows,
    factions: factionRows,
    locations: locationRows,
    characters: characterRows,
    facets: facetRows.filter((f) => isVisibleFacetCategory(f.category)),
    containedIn: containedInRows,
  };
}

// =============================================================================
// Assembly + write
// =============================================================================

interface ArtifactBlob {
  path: string;
  json: string;
  sha256: string;
}

function blob(path: string, value: unknown): ArtifactBlob {
  const json = serializeArtifact(value);
  return { path, json, sha256: sha256Hex(json) };
}

function listFilesRecursive(absDir: string, relPrefix = ""): string[] {
  if (!existsSync(absDir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const rel = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listFilesRecursive(join(absDir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

async function runExport(): Promise<void> {
  console.log("[snapshot] verifying migration-head parity (repo == DB)…");
  const sourceMigration = await verifyMigrationParity();
  console.log(
    `[snapshot]   ok — ${sourceMigration.count} migrations, head ${sourceMigration.lastTag}`,
  );

  // Projections run sequentially — each fans out at most a handful of queries
  // and the pooler pool is max:5 (src/db/client.ts).
  console.log("[snapshot] projecting browse data…");
  const browse = await projectBrowseData();
  console.log(`[snapshot]   ${browse.books.length} books, ${browse.eras.length} eras`);

  console.log("[snapshot] projecting podcast index + search…");
  const podcastIndex = await projectPodcastIndex();
  const podcastSearch = await projectPodcastSearch();
  console.log(
    `[snapshot]   ${podcastIndex.length} shows, ${podcastSearch.episodes.length} search episodes`,
  );

  console.log("[snapshot] projecting compendium source rows…");
  const factionGuide = await projectFactionGuide();
  const charaktereRows = await projectCharaktereRows();
  const weltenRows = await projectWeltenRows();
  const personenRows = await projectPersonenRows();
  console.log(
    `[snapshot]   factions ${factionGuide.length} · characters ${charaktereRows.length} · worlds ${weltenRows.length} · persons ${personenRows.length}`,
  );

  console.log("[snapshot] projecting hot entity ids + views…");
  const { hotIds, curatedMissing } = await projectHotEntityIds();
  for (const miss of curatedMissing) {
    console.warn(
      `[snapshot]   ⚠ curated hot id not in DB (drops to on-demand): ${miss.type}/${miss.id}`,
    );
  }
  const entityBlobs: ArtifactBlob[] = [];
  const missingPayloads: string[] = [];
  for (const type of ENTITY_TYPES) {
    for (const id of hotIds[type]) {
      const view = await projectEntityView(type, id);
      if (view === null) {
        missingPayloads.push(`${type}/${id}`);
        continue;
      }
      entityBlobs.push(blob(entityArtifactPath(type, id), view));
    }
  }
  if (missingPayloads.length > 0) {
    throw new Error(
      `[snapshot] ${missingPayloads.length} hot id(s) produced NO EntityView payload — refusing to write:\n` +
        missingPayloads.map((p) => `  - ${p}`).join("\n"),
    );
  }
  console.log(`[snapshot]   ${entityBlobs.length} entity views`);

  console.log("[snapshot] projecting book slugs + hot book payloads…");
  // Same kind='book' base set as the browse projection (rows are slug-sorted
  // there) — the S5 sitemap source.
  const bookSlugs = browse.books.map((b) => b.slug);
  const { hotSlugs: hotBookSlugs, curatedMissing: missingHotBooks } =
    await projectHotBookSlugs();
  for (const slug of missingHotBooks) {
    console.warn(
      `[snapshot]   ⚠ curated hot book slug not in DB (drops to on-demand): ${slug}`,
    );
  }
  const bookBlobs: ArtifactBlob[] = [];
  const missingBookPayloads: string[] = [];
  for (const slug of hotBookSlugs) {
    const detail = await projectBookDetail(slug);
    if (detail === null) {
      missingBookPayloads.push(slug);
      continue;
    }
    bookBlobs.push(blob(bookArtifactPath(slug), detail));
  }
  if (missingBookPayloads.length > 0) {
    throw new Error(
      `[snapshot] ${missingBookPayloads.length} hot book slug(s) produced NO BookDetail payload — refusing to write:\n` +
        missingBookPayloads.map((s) => `  - ${s}`).join("\n"),
    );
  }
  console.log(
    `[snapshot]   ${bookSlugs.length} book slugs · ${bookBlobs.length} hot book payloads`,
  );

  // ── Fail-closed gates (nothing has been written yet) ──────────────────────
  const seedEras = JSON.parse(
    readFileSync(resolve(SEED_DIR, "eras.json"), "utf8"),
  ) as Array<{ id: string }>;
  assertEraParity(
    browse.eras.map((e) => e.id),
    seedEras.map((e) => e.id),
  );

  const counts: SnapshotCounts = {
    books: browse.books.length,
    eras: browse.eras.length,
    podcastIndexShows: podcastIndex.length,
    podcastSearchShows: podcastSearch.shows.length,
    podcastSearchEpisodes: podcastSearch.episodes.length,
    factionGuideRows: factionGuide.length,
    charaktereRows: charaktereRows.length,
    weltenRows: weltenRows.length,
    personenRows: personenRows.length,
    hotIds: {
      character: hotIds.character.length,
      faction: hotIds.faction.length,
      location: hotIds.location.length,
      person: hotIds.person.length,
    },
    entityViews: entityBlobs.length,
    bookSlugs: bookSlugs.length,
    hotBookSlugs: hotBookSlugs.length,
    bookDetails: bookBlobs.length,
  };
  assertPlausibleCounts(counts);

  const blobs: ArtifactBlob[] = [
    blob(DATA_ARTIFACTS.browseBooks, browse),
    blob(DATA_ARTIFACTS.podcastIndex, podcastIndex),
    blob(DATA_ARTIFACTS.podcastSearch, podcastSearch),
    blob(DATA_ARTIFACTS.factionGuide, factionGuide),
    blob(DATA_ARTIFACTS.charaktereRows, charaktereRows),
    blob(DATA_ARTIFACTS.weltenRows, weltenRows),
    blob(DATA_ARTIFACTS.personenRows, personenRows),
    blob(DATA_ARTIFACTS.entityHotIds, hotIds),
    blob(DATA_ARTIFACTS.bookSlugs, bookSlugs),
    blob(DATA_ARTIFACTS.bookHotSlugs, hotBookSlugs),
    ...entityBlobs,
    ...bookBlobs,
  ].sort(byKey((b) => b.path));

  // ── Manifest with generatedAt carry-forward (byte-identical re-runs) ──────
  const manifestAbs = join(SNAPSHOT_ABS, MANIFEST_FILENAME);
  const existing = parseManifest(
    existsSync(manifestAbs) ? readFileSync(manifestAbs, "utf8") : null,
  );
  const next: Omit<SnapshotManifest, "generatedAt"> = {
    sourceMigration,
    counts,
    artifacts: blobs.map((b) => ({ path: b.path, sha256: b.sha256 })),
  };
  const manifest: SnapshotManifest = {
    generatedAt: resolveGeneratedAt(existing, next, () => new Date().toISOString()),
    ...next,
  };

  // ── Write phase: prune strays, then write every artifact + the manifest ───
  mkdirSync(SNAPSHOT_ABS, { recursive: true });
  const expected = new Set([...blobs.map((b) => b.path), MANIFEST_FILENAME]);
  for (const rel of listFilesRecursive(SNAPSHOT_ABS)) {
    if (!expected.has(rel)) {
      console.log(`[snapshot] pruning stale file ${rel}`);
      rmSync(join(SNAPSHOT_ABS, rel));
    }
  }
  for (const b of blobs) {
    const abs = join(SNAPSHOT_ABS, b.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, b.json, "utf8");
  }
  writeFileSync(manifestAbs, serializeArtifact(manifest), "utf8");

  const unchanged = existing !== null && manifest.generatedAt === existing.generatedAt;
  console.log(
    `[snapshot] wrote ${blobs.length} artifact(s) + manifest to ${SNAPSHOT_DIR}/ ` +
      (unchanged
        ? "(content unchanged — generatedAt carried forward, files byte-identical)"
        : `(generatedAt ${manifest.generatedAt})`),
  );
  console.log(
    `[snapshot] counts: ${JSON.stringify(counts)}`,
  );
  process.exit(0);
}

// =============================================================================
// CLI
// =============================================================================

function printHelp(): void {
  console.log(`
build-snapshot.ts — export the build-critical projections into committed JSON
under ${SNAPSHOT_DIR}/ (Launch S1a, E1). Read-only on the DB; fail-closed;
deterministic (unchanged DB ⇒ byte-identical files).

Usage:
  npm run snapshot:regen                # full export
  npx tsx --env-file=.env.local scripts/build-snapshot.ts --check-migrations
                                        # repo == DB migration-head check ONLY
  npx tsx scripts/build-snapshot.ts --help

Artifacts: ${Object.values(DATA_ARTIFACTS).join(" · ")} · entities/<type>/<id>.json · books/<slug>.json
Manifest:  ${MANIFEST_FILENAME} (generatedAt, source migration head, counts,
           sha256 per data artifact — the manifest does not hash itself).

The artifacts are committed ONLY in a dedicated Snapshot-PR (E4: that PR is the
production deploy) — never alongside code changes.
`);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      "check-migrations": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  if (values.help) {
    printHelp();
    process.exit(0);
  }
  if (values["check-migrations"]) {
    const head = await verifyMigrationParity();
    console.log(
      `[snapshot] migration-head parity OK — repo == DB (${head.count} migrations, head ${head.lastTag}, hash ${head.lastHash.slice(0, 12)}…)`,
    );
    process.exit(0);
  }
  await runExport();
}

main().catch((err) => {
  console.error(
    "[snapshot] FAILED — nothing (or nothing further) was written:",
    err instanceof Error ? (err.stack ?? err.message) : err,
  );
  process.exit(1);
});
