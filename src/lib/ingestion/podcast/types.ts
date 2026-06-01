/**
 * Brief 110 Step 1 — Podcast pilot ingest types.
 *
 * Step 1 is a read-only proof: fetch one show's RSS feed, tag each episode's
 * subject entities against the EXISTING canonical reference set, and emit a
 * committed artifact + quality report. No schema, no DB writes. These types
 * describe the pipeline's internal shapes (`PodcastEpisode`, `EpisodeExtraction`)
 * and the committed artifact (`ShowArtifact` / `EpisodeArtifact`).
 *
 * The entity axes mirror `src/lib/aliases` (`AliasAxis`); resolution reuses that
 * module rather than forking any alias logic.
 */
import type { AliasAxis } from "@/lib/aliases";

/** How an entity relates to an episode. "Is about" → `subject` (Brief 109 §7). */
export type EpisodeRole = "subject" | "mentioned";

/** Coarse episode classification — lets a later UI hide news/recap episodes. */
export type EpisodeKind = "lore" | "news_recap" | "interview" | "other";

export const EPISODE_KINDS: readonly EpisodeKind[] = [
  "lore",
  "news_recap",
  "interview",
  "other",
];

/** Show-level metadata sourced from the feed channel (slug/feedUrl/appleId come
 *  from the run config, not the feed). */
export interface ParsedShowMeta {
  title: string;
  podcastGuid: string | null;
  imageUrl: string | null;
}

/** One parsed feed item, reduced to the fields Step 1 needs. */
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
  };
  extraction: {
    model: string;
    promptVersion: string;
  };
  episodes: EpisodeArtifact[];
}
