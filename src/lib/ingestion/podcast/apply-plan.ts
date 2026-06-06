/**
 * Brief 114 Step 2 — pure apply-plan builder for the podcast ingest.
 *
 * DB-free. Turns a committed `ShowArtifact` (Brief 110) into a declarative,
 * deterministic `ApplyPlan`: the desired end-state of the show work + episode
 * works + their resolved tag-junctions. Two consumers share this one module so
 * the write semantics have a single source:
 *   • `scripts/apply-podcast.ts`     — executes the plan against Postgres
 *     (upsert by stable key + per-episode delete-then-insert of junctions).
 *   • `scripts/test-podcast-apply.ts` — proves the plan is deterministic and
 *     that applying it twice is idempotent.
 *
 * Identity (Brief 114):
 *   • Show    — `podcastGuid` → `feedUrl` → `slug`. The plan carries all three;
 *     the apply matches against the DB in that priority order.
 *   • Episode — `(show, episodeGuid)`. The deterministic episode slug is frozen
 *     on update like the title: identity hangs on the stable key, never on the
 *     title (mirrors `scripts/apply-override.ts`).
 *
 * Invariants enforced here:
 *   • Only resolved tags whose `canonicalId` exists in the DB reference set
 *     become junction rows (FK-safety). Tags pointing at a missing reference are
 *     dropped and reported, never written.
 *   • Unresolved forms (`artifact.unresolved`) are NEVER written and never
 *     auto-create reference rows (project invariant).
 *   • `role` is the artifact's `subject | mentioned`, written verbatim
 *     (Brief 109 §7). `rawName` is the audit column; `confidence` stays in the
 *     artifact and never lands on the junction (the shared junctions have no
 *     such column — out of scope).
 *
 * Cross-media links (Brief 122 B1-S3): the artifact's `show.links[]` and each
 * `episodes[].links[]` are projected 1:1 into the plan (deduped + sorted), so the
 * apply replaces a podcast work's `external_links` authoritatively from the
 * artifact. Provenance (`sourceKind` + `confidence`) rides along verbatim from the
 * `PodcastLink` (the Brief 128 link matrix, already resolved by S2's link-shape);
 * a legacy/hand-edited entry missing those fields defaults to `manual` / `1.00`.
 */
import { slugify } from "@/lib/slug";
import { ALIAS_AXES, type AliasAxis } from "@/lib/aliases";

import {
  EPISODE_KINDS,
  EXTERNAL_LINK_KINDS,
  PODCAST_LINK_SOURCE_KINDS,
  type EpisodeKind,
  type EpisodeRole,
  type ExternalLinkKind,
  type PodcastLink,
  type PodcastLinkSourceKind,
  type ShowArtifact,
} from "./types";

/** `works.slug` is `varchar(200)`; a derived episode slug must fit. */
export const MAX_SLUG_LENGTH = 200;

/**
 * Provenance defaults for a link the artifact left unspecified — a legacy
 * artifact predating the B1-S2 link-shape, or a hand-edited entry. The Brief 128
 * matrix is the source of truth; this is the floor (`manual` / `1.00`), only ever
 * reached when the artifact itself carries no `sourceKind` / `confidence`.
 */
export const DEFAULT_LINK_SOURCE_KIND: PodcastLinkSourceKind = "manual";
export const DEFAULT_LINK_CONFIDENCE = 1;

const EPISODE_ROLES: readonly EpisodeRole[] = ["subject", "mentioned"];

/** DB reference ids per axis — the existence gate for FK-safety. */
export interface ReferenceSets {
  character: ReadonlySet<string>;
  faction: ReadonlySet<string>;
  location: ReadonlySet<string>;
}

/** One resolved tag, ready to become a `work_{characters,factions,locations}` row. */
export interface JunctionRow {
  /** Canonical reference id (`characters.id` / `factions.id` / `locations.id`). */
  entityId: string;
  /** `subject | mentioned` (Brief 109 §7), written verbatim into the junction `role`. */
  role: EpisodeRole;
  /** Audit: the surface-form the LLM emitted (the junction `raw_name`). */
  rawName: string;
}

/** An episode's resolved junctions, split by axis. */
export interface EpisodeJunctions {
  character: JunctionRow[];
  faction: JunctionRow[];
  location: JunctionRow[];
}

/** Desired end-state for one `podcast_episode` work + its detail row + junctions. */
export interface EpisodePlan {
  episodeGuid: string;
  /** Deterministic, frozen-on-update slug. */
  slug: string;
  title: string;
  pubDate: string | null;
  durationSec: number | null;
  audioUrl: string | null;
  season: number | null;
  episode: number | null;
  episodeKind: EpisodeKind;
  junctions: EpisodeJunctions;
  /** Cross-media links for this episode (RSS audio enclosure, …), deduped +
   *  sorted. The apply replaces this episode work's `external_links` with these. */
  links: PodcastLink[];
}

/** Desired end-state for the `podcast` container work + its detail row. */
export interface ShowPlan {
  slug: string;
  title: string;
  feedUrl: string;
  podcastGuid: string | null;
  appleId: string | null;
  imageUrl: string | null;
  episodeCount: number;
  /** Show-level cross-media links (RSS feed, Apple, official site, Spotify,
   *  YouTube), deduped + sorted. The apply replaces the show work's
   *  `external_links` with these. */
  links: PodcastLink[];
}

/** A tag the artifact resolved but whose `canonicalId` is absent from the DB. */
export interface DroppedTag {
  episodeGuid: string;
  axis: AliasAxis;
  canonicalId: string;
  rawName: string;
}

export interface ApplyPlanReport {
  episodeCount: number;
  /** Tags that became junction rows (after FK-gate + per-episode dedup). */
  resolvedTagCount: number;
  /** Resolved-in-artifact tags dropped because the reference row is missing. */
  droppedMissingRefCount: number;
  /** Unresolved forms across all episodes — never written. */
  unresolvedFormCount: number;
  /** Show-level `external_links` rows the plan will write. */
  showLinkCount: number;
  /** Episode-level `external_links` rows the plan will write, across all episodes. */
  episodeLinkCount: number;
}

export interface ApplyPlan {
  show: ShowPlan;
  episodes: EpisodePlan[];
  droppedMissingRef: DroppedTag[];
  report: ApplyPlanReport;
}

/**
 * Deterministic, globally-unique episode slug. The show slug is already unique
 * (`works.slug` UNIQUE) and the guid is unique per show, so the pair is unique
 * across all shows — and stable, so freezing it on update is sound.
 */
export function deriveEpisodeSlug(showSlug: string, episodeGuid: string): string {
  return slugify(`${showSlug}-${episodeGuid}`);
}

function fail(msg: string): never {
  throw new Error(`Invalid podcast artifact: ${msg}`);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Validate one link list (show- or episode-scoped). Lenient on provenance: a
 * legacy artifact may omit the whole array, and a hand-edited entry may omit
 * `sourceKind` / `confidence` (the plan fills the Brief 128 defaults). The
 * structural fields the DB hard-requires — `serviceId` (the `services` FK),
 * `url`, and a valid `external_link_kind` — are enforced here so a malformed link
 * fails before the apply mutates anything.
 */
function assertLinks(value: unknown, where: string): void {
  if (value === undefined) return; // pre-S2 artifact without a link-shape — tolerated
  if (!Array.isArray(value)) fail(`${where} must be an array`);
  value.forEach((l, i) => {
    const at = `${where}[${i}]`;
    if (!isObject(l)) fail(`${at} must be an object`);
    requireString(l.serviceId, `${at}.serviceId`);
    requireString(l.url, `${at}.url`);
    if (!EXTERNAL_LINK_KINDS.includes(l.kind as ExternalLinkKind)) {
      fail(`${at}.kind "${String(l.kind)}" is not a known external_link_kind`);
    }
    if (
      l.sourceKind !== undefined &&
      !PODCAST_LINK_SOURCE_KINDS.includes(l.sourceKind as PodcastLinkSourceKind)
    ) {
      fail(`${at}.sourceKind "${String(l.sourceKind)}" must be podcast_rss|manual`);
    }
    if (l.confidence !== undefined) {
      if (
        typeof l.confidence !== "number" ||
        !Number.isFinite(l.confidence) ||
        l.confidence < 0 ||
        l.confidence > 1
      ) {
        fail(`${at}.confidence must be a number in [0, 1]`);
      }
    }
  });
}

/**
 * Project an artifact link list into the plan: fill the Brief 128 provenance
 * defaults for any legacy/missing `sourceKind` / `confidence`, dedup by
 * `(serviceId, kind, url)` — first occurrence wins — and sort by the same key.
 * The result is byte-deterministic, so the plan is stable and a re-applied
 * artifact yields an identical `external_links` set (the idempotency the apply
 * relies on). The dedup key is a JSON-encoded tuple, so no field separator can
 * forge a collision (mirrors `links.ts`).
 */
function projectLinks(rawLinks: readonly PodcastLink[] | undefined): PodcastLink[] {
  if (rawLinks === undefined) return [];
  const seen = new Map<string, PodcastLink>();
  for (const l of rawLinks) {
    const link: PodcastLink = {
      serviceId: l.serviceId,
      kind: l.kind,
      url: l.url,
      sourceKind: l.sourceKind ?? DEFAULT_LINK_SOURCE_KIND,
      confidence: l.confidence ?? DEFAULT_LINK_CONFIDENCE,
    };
    const key = JSON.stringify([link.serviceId, link.kind, link.url]);
    if (!seen.has(key)) seen.set(key, link);
  }
  return [...seen.values()].sort(
    (a, b) => cmpStr(a.serviceId, b.serviceId) || cmpStr(a.kind, b.kind) || cmpStr(a.url, b.url),
  );
}

function requireString(v: unknown, where: string): string {
  if (typeof v !== "string" || v === "") fail(`${where} must be a non-empty string`);
  return v;
}

function optStringOrNull(v: unknown, where: string): string | null {
  if (v === null) return null;
  if (typeof v !== "string") fail(`${where} must be a string or null`);
  return v;
}

/**
 * Structural validation — throws before the apply mutates anything (the brief's
 * validate-before-write contract). Narrows `unknown` to `ShowArtifact` so the
 * apply script can `JSON.parse` raw input and trust the result. Beyond shape, it
 * enforces the two DB constraints the plan must not violate: episode guids are
 * unique per show, and every derived episode slug is unique and fits `works.slug`.
 */
export function assertShowArtifact(value: unknown): asserts value is ShowArtifact {
  if (!isObject(value)) fail("root must be an object");

  const show = value.show;
  if (!isObject(show)) fail("`show` must be an object");
  const showSlug = requireString(show.slug, "show.slug");
  requireString(show.title, "show.title");
  requireString(show.feedUrl, "show.feedUrl");
  optStringOrNull(show.podcastGuid, "show.podcastGuid");
  optStringOrNull(show.appleId, "show.appleId");
  optStringOrNull(show.imageUrl, "show.imageUrl");
  assertLinks(show.links, "show.links");

  const episodes = value.episodes;
  if (!Array.isArray(episodes)) fail("`episodes` must be an array");

  const seenGuids = new Set<string>();
  const seenSlugs = new Set<string>();

  episodes.forEach((ep, i) => {
    const at = `episodes[${i}]`;
    if (!isObject(ep)) fail(`${at} must be an object`);

    const guid = requireString(ep.guid, `${at}.guid`);
    if (seenGuids.has(guid)) {
      fail(`duplicate episode guid "${guid}" — guids must be unique per show`);
    }
    seenGuids.add(guid);

    requireString(ep.title, `${at}.title`);

    const slug = deriveEpisodeSlug(showSlug, guid);
    if (slug === "") fail(`${at} derives an empty slug from guid "${guid}"`);
    if (slug.length > MAX_SLUG_LENGTH) {
      fail(`${at} derives a slug longer than ${MAX_SLUG_LENGTH} chars (guid "${guid}")`);
    }
    if (seenSlugs.has(slug)) {
      fail(`episode slug collision "${slug}" — two guids slugify to the same value`);
    }
    seenSlugs.add(slug);

    if (!EPISODE_KINDS.includes(ep.episodeKind as EpisodeKind)) {
      fail(`${at}.episodeKind "${String(ep.episodeKind)}" is not a known EpisodeKind`);
    }

    if (!Array.isArray(ep.tags)) fail(`${at}.tags must be an array`);
    ep.tags.forEach((tag, j) => {
      const tat = `${at}.tags[${j}]`;
      if (!isObject(tag)) fail(`${tat} must be an object`);
      if (!ALIAS_AXES.includes(tag.type as AliasAxis)) {
        fail(`${tat}.type "${String(tag.type)}" is not a known axis`);
      }
      requireString(tag.canonicalId, `${tat}.canonicalId`);
      requireString(tag.rawName, `${tat}.rawName`);
      if (!EPISODE_ROLES.includes(tag.role as EpisodeRole)) {
        fail(`${tat}.role "${String(tag.role)}" must be subject|mentioned`);
      }
    });

    if (!Array.isArray(ep.unresolved)) fail(`${at}.unresolved must be an array`);

    assertLinks(ep.links, `${at}.links`);
  });
}

/**
 * Build the declarative apply plan. Pure — mutates nothing, deterministic
 * (same artifact + same reference sets → deep-equal plan). Calling it validates
 * the artifact first (throws on malformed input).
 */
export function buildApplyPlan(artifact: ShowArtifact, refs: ReferenceSets): ApplyPlan {
  assertShowArtifact(artifact);

  const show: ShowPlan = {
    slug: artifact.show.slug,
    title: artifact.show.title,
    feedUrl: artifact.show.feedUrl,
    podcastGuid: artifact.show.podcastGuid,
    appleId: artifact.show.appleId,
    imageUrl: artifact.show.imageUrl,
    episodeCount: artifact.episodes.length,
    links: projectLinks(artifact.show.links),
  };

  const droppedMissingRef: DroppedTag[] = [];
  let resolvedTagCount = 0;
  let unresolvedFormCount = 0;
  let episodeLinkCount = 0;

  const episodes: EpisodePlan[] = artifact.episodes.map((e) => {
    unresolvedFormCount += e.unresolved.length;

    // Dedup per (axis, canonicalId) — `subject` beats `mentioned`, mirroring
    // `resolve.ts` — so the (work_id, entity_id) PK is never violated even if a
    // hand-edited artifact lists the same entity twice on one episode.
    const byKey = new Map<string, { axis: AliasAxis; row: JunctionRow }>();
    for (const tag of e.tags) {
      const axis = tag.type;
      if (!refs[axis].has(tag.canonicalId)) {
        droppedMissingRef.push({
          episodeGuid: e.guid,
          axis,
          canonicalId: tag.canonicalId,
          rawName: tag.rawName,
        });
        continue;
      }
      const key = `${axis}::${tag.canonicalId}`;
      const row: JunctionRow = {
        entityId: tag.canonicalId,
        role: tag.role,
        rawName: tag.rawName,
      };
      const existing = byKey.get(key);
      if (existing === undefined) {
        byKey.set(key, { axis, row });
      } else if (existing.row.role === "mentioned" && tag.role === "subject") {
        byKey.set(key, { axis, row });
      }
    }

    const junctions: EpisodeJunctions = { character: [], faction: [], location: [] };
    for (const { axis, row } of byKey.values()) {
      junctions[axis].push(row);
      resolvedTagCount += 1;
    }
    // Stable order within each axis (entityId) so the plan is byte-deterministic.
    for (const axis of ALIAS_AXES) {
      junctions[axis].sort((a, b) => (a.entityId < b.entityId ? -1 : a.entityId > b.entityId ? 1 : 0));
    }

    const links = projectLinks(e.links);
    episodeLinkCount += links.length;

    return {
      episodeGuid: e.guid,
      slug: deriveEpisodeSlug(show.slug, e.guid),
      title: e.title,
      pubDate: e.pubDate,
      durationSec: e.durationSec,
      audioUrl: e.audioUrl,
      season: e.season ?? null,
      episode: e.episode ?? null,
      episodeKind: e.episodeKind,
      junctions,
      links,
    };
  });

  return {
    show,
    episodes,
    droppedMissingRef,
    report: {
      episodeCount: episodes.length,
      resolvedTagCount,
      droppedMissingRefCount: droppedMissingRef.length,
      unresolvedFormCount,
      showLinkCount: show.links.length,
      episodeLinkCount,
    },
  };
}
