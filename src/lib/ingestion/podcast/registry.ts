/**
 * Brief 122 B1-S2 — podcast show registry.
 *
 * The registry (`scripts/seed-data/podcast-shows.json`) replaces the hardcoded
 * `PILOT` constant the ingest used in Brief 110: one JSON entry per show. The
 * ingest reads it for `--show <slug>` (default = the pilot) and `--all`.
 *
 * A registry entry lists only what the feed can't supply: the show-level links
 * the ingest can't derive (official site, Spotify, YouTube). The RSS feed link
 * (from `feedUrl`) and the Apple link (from `appleId`) are DERIVED by
 * `links.ts`, so the registry stays minimal and DRY — see `SERVICE_LINK_SPEC`
 * for the per-service `kind`/`sourceKind`/`confidence` defaults (Brief 128 link
 * matrix). All validation is pure (`parseRegistry`); only `loadRegistry` touches
 * the filesystem, so the parser unit-tests without fixtures on disk.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  EXTERNAL_LINK_KINDS,
  PODCAST_LINK_SOURCE_KINDS,
  type ExternalLinkKind,
  type PodcastLinkSourceKind,
} from "./types";

export const REGISTRY_PATH = join(
  process.cwd(),
  "scripts",
  "seed-data",
  "podcast-shows.json",
);

/** The pilot — the default `--show` target when no slug is given. */
export const DEFAULT_SHOW_SLUG = "the-40k-lorecast";

/**
 * A human-authored show-level link in the registry. `serviceId` + `url` are
 * required; `kind`/`sourceKind`/`confidence` default from `SERVICE_LINK_SPEC`
 * (overridable per-entry for a service not in the spec).
 */
export interface RegistryLinkInput {
  serviceId: string;
  url: string;
  kind?: ExternalLinkKind;
  sourceKind?: PodcastLinkSourceKind;
  confidence?: number;
}

/** One registry entry — a podcast show the ingest can resolve by slug. */
export interface PodcastShowConfig {
  slug: string;
  title: string;
  feedUrl: string;
  appleId: string | null;
  podcastGuid: string | null;
  links: RegistryLinkInput[];
  /** Optional — S4 (YouTube episode matching) reads these; B1 only carries them. */
  youtubeChannelUrl: string | null;
  youtubeChannelId: string | null;
}

/**
 * Per-service link defaults — the Brief 128 link matrix as data. `serviceId` →
 * the `external_link_kind`, the `source_kind` provenance, and the default
 * confidence a show/episode link of that service carries.
 */
export const SERVICE_LINK_SPEC: Record<
  string,
  { kind: ExternalLinkKind; sourceKind: PodcastLinkSourceKind; confidence: number }
> = {
  rss: { kind: "listen", sourceKind: "podcast_rss", confidence: 1 },
  apple_podcasts: { kind: "listen", sourceKind: "manual", confidence: 1 },
  spotify: { kind: "listen", sourceKind: "manual", confidence: 1 },
  official_website: { kind: "official_page", sourceKind: "manual", confidence: 1 },
  youtube: { kind: "watch", sourceKind: "manual", confidence: 1 },
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function reqString(o: Record<string, unknown>, key: string, where: string): string {
  const v = o[key];
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`${where}.${key}: required non-empty string`);
  }
  return v;
}

/** Optional string|null field — coerces a present non-string to error, absent → null. */
function optString(o: Record<string, unknown>, key: string, where: string): string | null {
  const v = o[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`${where}.${key}: must be a non-empty string when present`);
  }
  return v;
}

function parseLink(raw: unknown, where: string): RegistryLinkInput {
  if (!isObject(raw)) throw new Error(`${where}: must be an object`);
  const serviceId = reqString(raw, "serviceId", where);
  const url = reqString(raw, "url", where);
  const spec = SERVICE_LINK_SPEC[serviceId];

  const out: RegistryLinkInput = { serviceId, url };

  if (raw.kind !== undefined) {
    if (!EXTERNAL_LINK_KINDS.includes(raw.kind as ExternalLinkKind)) {
      throw new Error(`${where}.kind "${String(raw.kind)}" is not a known external_link_kind`);
    }
    out.kind = raw.kind as ExternalLinkKind;
  }
  if (raw.sourceKind !== undefined) {
    if (!PODCAST_LINK_SOURCE_KINDS.includes(raw.sourceKind as PodcastLinkSourceKind)) {
      throw new Error(`${where}.sourceKind "${String(raw.sourceKind)}" must be podcast_rss|manual`);
    }
    out.sourceKind = raw.sourceKind as PodcastLinkSourceKind;
  }
  if (raw.confidence !== undefined) {
    // Bound to [0, 1] up front so a bad registry fails here, not later at S3's
    // `external_links.confidence numeric(3,2)` Postgres constraint.
    if (
      typeof raw.confidence !== "number" ||
      !Number.isFinite(raw.confidence) ||
      raw.confidence < 0 ||
      raw.confidence > 1
    ) {
      throw new Error(`${where}.confidence: must be a number in [0, 1]`);
    }
    out.confidence = raw.confidence;
  }

  // A service with no spec default must spell out kind+sourceKind+confidence so
  // `enrich` (links.ts) can always produce a complete link.
  if (spec === undefined) {
    if (out.kind === undefined || out.sourceKind === undefined || out.confidence === undefined) {
      throw new Error(
        `${where}.serviceId "${serviceId}" has no SERVICE_LINK_SPEC default — ` +
          `provide explicit kind, sourceKind and confidence`,
      );
    }
  }
  return out;
}

/**
 * Validate + narrow the raw registry JSON to `PodcastShowConfig[]`. Pure (no
 * filesystem). Throws on the first malformed entry — slugs must be unique, the
 * core string fields present, and every link well-formed.
 */
export function parseRegistry(raw: unknown): PodcastShowConfig[] {
  if (!Array.isArray(raw)) throw new Error("registry: top-level must be an array");
  const slugs = new Set<string>();
  return raw.map((entry, i) => {
    const where = `registry[${i}]`;
    if (!isObject(entry)) throw new Error(`${where}: must be an object`);

    const slug = reqString(entry, "slug", where);
    if (slugs.has(slug)) throw new Error(`${where}.slug: duplicate slug "${slug}"`);
    slugs.add(slug);

    const links =
      entry.links === undefined || entry.links === null
        ? []
        : Array.isArray(entry.links)
          ? entry.links.map((l, j) => parseLink(l, `${where}.links[${j}]`))
          : (() => {
              throw new Error(`${where}.links: must be an array`);
            })();

    return {
      slug,
      title: reqString(entry, "title", where),
      feedUrl: reqString(entry, "feedUrl", where),
      appleId: optString(entry, "appleId", where),
      podcastGuid: optString(entry, "podcastGuid", where),
      links,
      youtubeChannelUrl: optString(entry, "youtubeChannelUrl", where),
      youtubeChannelId: optString(entry, "youtubeChannelId", where),
    };
  });
}

/** Read + validate the committed registry from disk. */
export function loadRegistry(path: string = REGISTRY_PATH): PodcastShowConfig[] {
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
  return parseRegistry(raw);
}

/** Find a show by slug or throw (listing available slugs to aid the caller). */
export function getShow(registry: PodcastShowConfig[], slug: string): PodcastShowConfig {
  const found = registry.find((s) => s.slug === slug);
  if (!found) {
    throw new Error(
      `registry: no show with slug "${slug}" (have: ${registry.map((s) => s.slug).join(", ")})`,
    );
  }
  return found;
}

/**
 * Resolve which shows a run targets — the pure core of the ingest CLI:
 *   • `--all`        → every registered show, in registry order;
 *   • `--show <slug>`→ just that show (throws on an unknown slug);
 *   • neither        → the default (pilot) show.
 */
export function selectShows(
  registry: PodcastShowConfig[],
  opts: { all?: boolean; show?: string },
): PodcastShowConfig[] {
  if (opts.all) return [...registry];
  return [getShow(registry, opts.show ?? DEFAULT_SHOW_SLUG)];
}
