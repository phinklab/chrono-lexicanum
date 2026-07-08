/**
 * Podcast ingest types.
 *
 * The ingest fetches a show's RSS feed, tags each episode's subject entities
 * against the EXISTING canonical reference set, and emits a committed
 * artifact + quality report. These types describe the pipeline's internal
 * shapes (`PodcastEpisode`, `EpisodeExtraction`) and the committed artifact
 * (`ShowArtifact` / `EpisodeArtifact`).
 *
 * The entity axes mirror `src/lib/aliases` (`AliasAxis`); resolution reuses that
 * module rather than forking any alias logic.
 */
import type { AliasAxis } from "@/lib/aliases";

/** How an entity relates to an episode. "Is about" → `subject`. */
export type EpisodeRole = "subject" | "mentioned";

/** Coarse episode classification — lets a later UI hide news/recap episodes. */
export type EpisodeKind = "lore" | "news_recap" | "interview" | "other";

export const EPISODE_KINDS: readonly EpisodeKind[] = [
  "lore",
  "news_recap",
  "interview",
  "other",
];

/**
 * Mirrors the DB `external_link_kind` enum (`src/db/schema.ts`). Kept as a local
 * string-union (like `EpisodeKind`) so this lib stays free of a Drizzle import.
 */
export type ExternalLinkKind =
  | "read"
  | "listen"
  | "watch"
  | "buy_print"
  | "reference"
  | "trailer"
  | "official_page";

export const EXTERNAL_LINK_KINDS: readonly ExternalLinkKind[] = [
  "read",
  "listen",
  "watch",
  "buy_print",
  "reference",
  "trailer",
  "official_page",
];

/**
 * The `source_kind` provenance values emitted for podcast links — a subset of
 * the DB `source_kind` enum: `podcast_rss` for RSS-feed-intrinsic links (the RSS
 * feed, the episode audio enclosure), `manual` for registry-curated links
 * (official site, Apple, Spotify, YouTube channel), and `youtube` for a
 * YouTube-source episode's `watch` link (the per-episode analogue of the RSS
 * audio enclosure). All three are members of the DB `source_kind` pgEnum, so
 * no migration is needed to write them.
 */
export type PodcastLinkSourceKind = "podcast_rss" | "manual" | "youtube";

export const PODCAST_LINK_SOURCE_KINDS: readonly PodcastLinkSourceKind[] = [
  "podcast_rss",
  "manual",
  "youtube",
];

/**
 * One cross-media link on a show or episode. This is the AUTHORITATIVE input
 * the apply projects 1:1 into `external_links`: it carries full provenance
 * (`sourceKind` + `confidence`) so the apply is a pure projection, never a
 * matrix re-derivation. `serviceId` is an FK into `services`; `kind` is the
 * `external_link_kind`.
 */
export interface PodcastLink {
  serviceId: string;
  kind: ExternalLinkKind;
  url: string;
  sourceKind: PodcastLinkSourceKind;
  confidence: number;
}

/** Show-level metadata sourced from the feed channel (slug/feedUrl/appleId come
 *  from the run config, not the feed). */
export interface ParsedShowMeta {
  title: string;
  podcastGuid: string | null;
  imageUrl: string | null;
}

/** One parsed feed item, reduced to the fields the ingest needs. */
export interface PodcastEpisode {
  /** Stable feed `<guid>` (falls back to link/audio/title if a feed omits it). */
  guid: string;
  title: string;
  /** HTML-stripped plain text of description (+ content:encoded) — the tagging input. */
  descriptionText: string;
  /** ISO 8601, normalized from the feed's RFC-822 `pubDate`; null if absent/unparseable. */
  pubDate: string | null;
  durationSec: number | null;
  audioUrl: string | null;
  link: string | null;
  season: number | null;
  episode: number | null;
}

/** One axis' surface-forms from the LLM, split by relationship. */
export interface AxisExtraction {
  primary: string[];
  mentioned: string[];
}

/** Raw LLM extraction for one episode, before alias resolution. */
export interface EpisodeExtraction {
  episodeKind: EpisodeKind;
  characters: AxisExtraction;
  factions: AxisExtraction;
  locations: AxisExtraction;
}

/** A resolved tag: surface-form → canonical entity via the alias module. */
export interface EpisodeTag {
  /** Authoritative axis from the alias resolution (NOT the LLM's bucket). */
  type: AliasAxis;
  canonicalId: string;
  /** The surface-form the LLM emitted (the audit `rawName`). */
  rawName: string;
  role: EpisodeRole;
  /** canonical-name match → 1.0, alias-key match → 0.9. */
  confidence: number;
  matchedVia: "alias" | "canonical-name";
}

/** A surface-form the alias module could not resolve. Flagged, never auto-created. */
export interface UnresolvedForm {
  rawName: string;
  /** The axis the LLM placed the form under (its best guess). */
  axisGuess: AliasAxis;
  role: EpisodeRole;
}

/** One episode in the committed artifact. */
export interface EpisodeArtifact {
  guid: string;
  title: string;
  pubDate: string | null;
  durationSec: number | null;
  audioUrl: string | null;
  link: string | null;
  season?: number;
  episode?: number;
  episodeKind: EpisodeKind;
  tags: EpisodeTag[];
  unresolved: UnresolvedForm[];
  /** Cross-media links for this episode — the RSS audio enclosure
   *  (`listen`/`rss`/`podcast_rss`) for an RSS show, or the YouTube `watch` link
   *  (`watch`/`youtube`/`youtube`) for a YouTube-source show. The
   *  authoritative input for the apply. */
  links: PodcastLink[];
}

/** The committed artifact (one file per show). */
export interface ShowArtifact {
  $generatedBy: string;
  show: {
    slug: string;
    title: string;
    feedUrl: string;
    appleId: string | null;
    podcastGuid: string | null;
    imageUrl: string | null;
    episodeCount: number;
    /** Show-level cross-media links (RSS feed, Apple, official site, Spotify,
     *  YouTube channel, …). Derived (RSS/Apple) + registry-curated. */
    links: PodcastLink[];
  };
  extraction: {
    model: string;
    promptVersion: string;
  };
  episodes: EpisodeArtifact[];
}
