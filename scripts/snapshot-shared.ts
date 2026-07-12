/**
 * snapshot-shared.ts — Launch S1a (E1). The PURE half of the build-snapshot
 * exporter: artifact registry, deterministic serialization, content hashing,
 * manifest shape + the generatedAt carry-forward, and the fail-closed
 * plausibility floors.
 *
 * NO `@/db` import and no filesystem writes here — everything is a pure
 * function over plain values, so `scripts/test-build-snapshot.ts` exercises
 * this module inside the DB-free `npm test` aggregate (which strips
 * DATABASE_URL from the child env). The DB projections + the writer live in
 * `scripts/build-snapshot.ts`.
 */
import { createHash } from "node:crypto";

import type { EntityType } from "@/lib/entity/types";

// =============================================================================
// Artifact registry
// =============================================================================

/** Repo-relative snapshot output directory (committed in the Snapshot-PR). */
export const SNAPSHOT_DIR = "scripts/snapshot-data";

/**
 * The fixed data artifacts — one file per prerender-loader return shape
 * (Export-Shape = Loader-Rückgabeform, plan § Session 1a Punkt 1):
 *   browse-books.json      ← loadBrowseBooks            (BrowseData)
 *   podcast-index.json     ← loadPodcastIndex           (PodcastIndexShow[])
 *   podcast-search.json    ← loadPodcastSearchIndex     (PodcastSearchData)
 *   faction-guide.json     ← cachedFactionGuide source  (FactionGuide[])
 *   charaktere-rows.json   ← cachedCharaktere source    (CharaktereRow[])
 *   welten-rows.json       ← cachedWelten source        (WeltenRow[])
 *   personen-rows.json     ← cachedPersonen source      (PersonenRow[])
 *   entity-hot-ids.json    ← listHotEntityIds per type  (Record<EntityType, string[]>)
 *   book-slugs.json        ← every works.kind='book' slug (string[], ascending)
 *                            — the S5 sitemap source (S4b)
 *   book-hot-slugs.json    ← listHotBookSlugs           (string[], S4b)
 * plus one entities/<type>/<id>.json per hot id (loadEntity → EntityView)
 * and one books/<slug>.json per hot book slug (loadBook → BookDetail, S4b).
 * The compendium snapshot cuts at the `cachedRead` SOURCE layer on purpose:
 * everything above it (items, counts, suggestions) is pure and stays DB-free
 * at build time, so S1b swaps exactly four source reads instead of forking
 * the presentation builders.
 */
export const DATA_ARTIFACTS = {
  browseBooks: "browse-books.json",
  podcastIndex: "podcast-index.json",
  podcastSearch: "podcast-search.json",
  factionGuide: "faction-guide.json",
  charaktereRows: "charaktere-rows.json",
  weltenRows: "welten-rows.json",
  personenRows: "personen-rows.json",
  entityHotIds: "entity-hot-ids.json",
  bookSlugs: "book-slugs.json",
  bookHotSlugs: "book-hot-slugs.json",
} as const;

export const MANIFEST_FILENAME = "manifest.json";

/** Snapshot-relative path of one hot entity's EntityView payload. */
export function entityArtifactPath(type: EntityType, id: string): string {
  return `entities/${type}/${id}.json`;
}

/** Snapshot-relative path of one hot book's BookDetail payload (S4b). */
export function bookArtifactPath(slug: string): string {
  return `books/${slug}.json`;
}

// =============================================================================
// Deterministic serialization + hashing
// =============================================================================

/**
 * The ONE serialization every artifact (and the manifest) goes through:
 * 2-space pretty JSON + trailing newline — diff-friendly and byte-stable for
 * identical values (object key order is construction order, which the
 * projections keep deterministic via explicit sorts).
 */
export function serializeArtifact(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// =============================================================================
// Manifest
// =============================================================================

/**
 * Repo migration head at export time — verified equal to the DB beforehand.
 * `lastHash` is the sha256 of the LF-NORMALIZED head migration file, so the
 * value is reproducible from any checkout regardless of git autocrlf (the DB
 * side may store either line-ending variant — see `verifyMigrationParity`).
 */
export interface SourceMigration {
  count: number;
  lastTag: string;
  lastHash: string;
}

/** Row counts per projection — the semantic half of every release diff. */
export interface SnapshotCounts {
  books: number;
  eras: number;
  podcastIndexShows: number;
  podcastSearchShows: number;
  podcastSearchEpisodes: number;
  factionGuideRows: number;
  charaktereRows: number;
  weltenRows: number;
  personenRows: number;
  hotIds: Record<EntityType, number>;
  entityViews: number;
  /** All works.kind='book' slugs — the sitemap source (S4b). */
  bookSlugs: number;
  /** Curated hot slugs ∩ live works table — the /book prerender set (S4b). */
  hotBookSlugs: number;
  /** Exported books/<slug>.json payloads — must equal hotBookSlugs (S4b). */
  bookDetails: number;
}

export interface ManifestArtifact {
  path: string;
  sha256: string;
}

/**
 * The release-diff Prüfbasis (E4). Hashes cover every DATA artifact; the
 * manifest does not hash itself.
 */
export interface SnapshotManifest {
  generatedAt: string;
  sourceMigration: SourceMigration;
  counts: SnapshotCounts;
  artifacts: ManifestArtifact[];
}

/**
 * Determinism contract (plan § Session 1a Punkt 2): two runs against an
 * unchanged DB must produce byte-identical files. Everything except
 * `generatedAt` is derived from the data — so when migration head, counts and
 * every artifact hash are unchanged, the previous `generatedAt` is carried
 * forward and the manifest (the only place a timestamp lives) stays
 * byte-identical too.
 */
export function resolveGeneratedAt(
  existing: SnapshotManifest | null,
  next: Omit<SnapshotManifest, "generatedAt">,
  now: () => string,
): string {
  if (
    existing !== null &&
    JSON.stringify({
      sourceMigration: existing.sourceMigration,
      counts: existing.counts,
      artifacts: existing.artifacts,
    }) ===
      JSON.stringify({
        sourceMigration: next.sourceMigration,
        counts: next.counts,
        artifacts: next.artifacts,
      })
  ) {
    return existing.generatedAt;
  }
  return now();
}

/** Lenient manifest read: anything unparsable counts as "no previous manifest". */
export function parseManifest(raw: string | null): SnapshotManifest | null {
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as SnapshotManifest;
    if (
      typeof value !== "object" ||
      value === null ||
      typeof value.generatedAt !== "string" ||
      !Array.isArray(value.artifacts)
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

// =============================================================================
// Fail-closed gates (run BEFORE anything is written)
// =============================================================================

/**
 * Hard minimums per core projection — roughly HALF of the live counts measured
 * read-only on 2026-07-11 (books 889 · podcast shows 4 · episodes 1114 ·
 * factions 227 · characters 500 · locations 442 · persons 136). The pre-S2
 * src loaders degraded to `[]`/`null` on DB errors (they throw since S2); the
 * exporter must never inherit a degrade pattern, and a "successful" run that
 * lost half the catalog is a failed run too (empty OR implausibly small ⇒
 * abort before writing).
 */
export const MIN_COUNTS = {
  books: 450,
  podcastIndexShows: 2,
  podcastSearchShows: 2,
  podcastSearchEpisodes: 500,
  factionGuideRows: 100,
  charaktereRows: 250,
  weltenRows: 200,
  personenRows: 60,
  // S4b: 73 curated hot books at introduction (65 starter picks + 8 marquee);
  // half-floor like every other projection. bookSlugs carries no own floor —
  // it must EQUAL books (same kind='book' base set, asserted below).
  hotBookSlugs: 35,
} as const;

/** Throws listing EVERY floor violation (not just the first). */
export function assertPlausibleCounts(counts: SnapshotCounts): void {
  const problems: string[] = [];
  for (const [key, min] of Object.entries(MIN_COUNTS) as Array<
    [keyof typeof MIN_COUNTS, number]
  >) {
    if (counts[key] < min) {
      problems.push(`${key} = ${counts[key]} < required minimum ${min}`);
    }
  }
  for (const [type, n] of Object.entries(counts.hotIds)) {
    if (n < 1) problems.push(`hotIds.${type} is empty`);
  }
  const hotTotal = Object.values(counts.hotIds).reduce((a, b) => a + b, 0);
  if (counts.entityViews !== hotTotal) {
    problems.push(
      `entityViews = ${counts.entityViews} ≠ hot-id total ${hotTotal} (missing hot-ID payloads)`,
    );
  }
  // S4b invariants: the slug list and the browse projection share the same
  // kind='book' base set, and every hot slug must have exported a payload.
  if (counts.bookSlugs !== counts.books) {
    problems.push(
      `bookSlugs = ${counts.bookSlugs} ≠ books ${counts.books} (slug list drifted from the browse projection)`,
    );
  }
  if (counts.bookDetails !== counts.hotBookSlugs) {
    problems.push(
      `bookDetails = ${counts.bookDetails} ≠ hotBookSlugs ${counts.hotBookSlugs} (missing hot-book payloads)`,
    );
  }
  if (problems.length > 0) {
    throw new Error(
      `[snapshot] implausible counts — refusing to write:\n` +
        problems.map((p) => `  - ${p}`).join("\n"),
    );
  }
}

/**
 * The eras table must mirror the committed `eras.json` EXACTLY (same id set).
 * Timeline + era filters are curated against those ids; a drifted era set in a
 * frozen snapshot would bake the drift into every deploy until the next
 * release, so a mismatch aborts the export.
 */
export function assertEraParity(
  dbEraIds: readonly string[],
  seedEraIds: readonly string[],
): void {
  const db = new Set(dbEraIds);
  const seed = new Set(seedEraIds);
  const missingInDb = [...seed].filter((id) => !db.has(id));
  const extraInDb = [...db].filter((id) => !seed.has(id));
  if (missingInDb.length > 0 || extraInDb.length > 0) {
    throw new Error(
      `[snapshot] eras drift between DB and scripts/seed-data/eras.json — ` +
        `missing in DB: [${missingInDb.join(", ")}] · not in eras.json: [${extraInDb.join(", ")}]. ` +
        `Refusing to write.`,
    );
  }
}
