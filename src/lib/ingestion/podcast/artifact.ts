/**
 * Brief 110 Step 1 — artifact assembly, deterministic serialization, report.
 *
 * Determinism contract (Brief 110 acceptance — "a second run reproduces the
 * same artifact"): episodes sorted by (pubDate, guid); each episode's tags
 * sorted by (type, role, canonicalId) and unresolved by (axisGuess, role,
 * rawName); NO wall-clock timestamps in the committed output. Combined with the
 * LLM cache + temperature 0, a warm-cache re-run is byte-identical.
 *
 * The quality report carries only content-derived facts (coverage, counts,
 * spot-check) — token counts / USD cost are NON-deterministic (cache-hit
 * dependent) and are printed to stdout by the script instead, never committed.
 */
import type {
  EpisodeArtifact,
  EpisodeExtraction,
  EpisodeTag,
  PodcastEpisode,
  ShowArtifact,
  UnresolvedForm,
} from "./types";
import { EPISODE_KINDS } from "./types";

const GENERATED_BY =
  "scripts/ingest-podcast.ts — Brief 110 Step 1 (podcast pilot ingest, no DB)";

const ROLE_ORDER: Record<string, number> = { subject: 0, mentioned: 1 };

function cmpStr(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareTags(a: EpisodeTag, b: EpisodeTag): number {
  return (
    cmpStr(a.type, b.type) ||
    (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) ||
    cmpStr(a.canonicalId, b.canonicalId)
  );
}

function compareUnresolved(a: UnresolvedForm, b: UnresolvedForm): number {
  return (
    cmpStr(a.axisGuess, b.axisGuess) ||
    (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9) ||
    cmpStr(a.rawName.toLowerCase(), b.rawName.toLowerCase()) ||
    cmpStr(a.rawName, b.rawName)
  );
}

function compareEpisodes(a: EpisodeArtifact, b: EpisodeArtifact): number {
  if (a.pubDate !== b.pubDate) {
    if (a.pubDate === null) return 1; // nulls last
    if (b.pubDate === null) return -1;
    return cmpStr(a.pubDate, b.pubDate);
  }
  return cmpStr(a.guid, b.guid);
}

export interface EpisodeResult {
  episode: PodcastEpisode;
  extraction: EpisodeExtraction;
  tags: EpisodeTag[];
  unresolved: UnresolvedForm[];
}

export interface BuildArtifactInput {
  show: {
    slug: string;
    title: string;
    feedUrl: string;
    appleId: string | null;
    podcastGuid: string | null;
    imageUrl: string | null;
  };
  model: string;
  promptVersion: string;
  results: EpisodeResult[];
}

export function buildShowArtifact(input: BuildArtifactInput): ShowArtifact {
  const episodes: EpisodeArtifact[] = input.results.map((r) => {
    const e = r.episode;
    const ea: EpisodeArtifact = {
      guid: e.guid,
      title: e.title,
      pubDate: e.pubDate,
      durationSec: e.durationSec,
      audioUrl: e.audioUrl,
      link: e.link,
      ...(e.season !== null ? { season: e.season } : {}),
      ...(e.episode !== null ? { episode: e.episode } : {}),
      episodeKind: r.extraction.episodeKind,
      tags: [...r.tags].sort(compareTags),
      unresolved: [...r.unresolved].sort(compareUnresolved),
    };
    return ea;
  });
  episodes.sort(compareEpisodes);

  return {
    $generatedBy: GENERATED_BY,
    show: {
      slug: input.show.slug,
      title: input.show.title,
      feedUrl: input.show.feedUrl,
      appleId: input.show.appleId,
      podcastGuid: input.show.podcastGuid,
      imageUrl: input.show.imageUrl,
      episodeCount: episodes.length,
    },
    extraction: { model: input.model, promptVersion: input.promptVersion },
    episodes,
  };
}

/** Deterministic JSON: fixed key order (built above) + sorted arrays + trailing newline. */
export function serializeArtifact(artifact: ShowArtifact): string {
  return JSON.stringify(artifact, null, 2) + "\n";
}

// --- quality report -----------------------------------------------------------

function renderTag(t: EpisodeTag): string {
  const via = t.matchedVia === "alias" ? "alias" : "name";
  const showRaw = t.rawName.toLowerCase() !== t.canonicalId.toLowerCase();
  const raw = showRaw ? `, “${t.rawName}”` : "";
  return `\`${t.type}:${t.canonicalId}\` (${t.role}, ${via}${raw})`;
}

interface UnresolvedAgg {
  rawName: string;
  axisGuess: string;
  episodes: number;
}

export function buildReport(artifact: ShowArtifact): string {
  const eps = artifact.episodes;
  const total = eps.length;
  const withTag = eps.filter((e) => e.tags.length > 0).length;
  const pct = total > 0 ? ((withTag / total) * 100).toFixed(1) : "0.0";

  let tagTotal = 0;
  const byType: Record<string, number> = { character: 0, faction: 0, location: 0 };
  const byRole: Record<string, number> = { subject: 0, mentioned: 0 };
  for (const e of eps) {
    for (const t of e.tags) {
      tagTotal += 1;
      byType[t.type] = (byType[t.type] ?? 0) + 1;
      byRole[t.role] = (byRole[t.role] ?? 0) + 1;
    }
  }

  const kindCounts: Record<string, number> = {};
  for (const k of EPISODE_KINDS) kindCounts[k] = 0;
  for (const e of eps) kindCounts[e.episodeKind] = (kindCounts[e.episodeKind] ?? 0) + 1;

  // Distinct unresolved forms, with how many episodes raised each.
  const uMap = new Map<string, UnresolvedAgg>();
  for (const e of eps) {
    const seenInEp = new Set<string>();
    for (const u of e.unresolved) {
      const key = `${u.axisGuess}::${u.rawName.toLowerCase()}`;
      if (seenInEp.has(key)) continue;
      seenInEp.add(key);
      const cur = uMap.get(key);
      if (cur) cur.episodes += 1;
      else uMap.set(key, { rawName: u.rawName, axisGuess: u.axisGuess, episodes: 1 });
    }
  }
  const unresolvedList = [...uMap.values()].sort(
    (a, b) =>
      b.episodes - a.episodes ||
      cmpStr(a.axisGuess, b.axisGuess) ||
      cmpStr(a.rawName.toLowerCase(), b.rawName.toLowerCase()),
  );

  // Spot-check: ~10 episodes evenly spaced across the sorted set (deterministic).
  const sample: EpisodeArtifact[] = [];
  if (total > 0) {
    const target = Math.min(10, total);
    const step = total / target;
    const seen = new Set<number>();
    for (let i = 0; i < target; i++) {
      const idx = Math.min(total - 1, Math.floor(i * step));
      if (!seen.has(idx)) {
        seen.add(idx);
        sample.push(eps[idx]);
      }
    }
  }

  const L: string[] = [];
  L.push(`# Podcast ingest quality report — ${artifact.show.title}`);
  L.push("");
  L.push(
    "Reproducible via: `PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast` " +
      "(Brief 110 Step 1 — pilot ingest + episode tagging; no schema, no DB).",
  );
  L.push("");

  L.push("## Summary");
  L.push("");
  L.push(`- **Show:** ${artifact.show.title} (slug \`${artifact.show.slug}\`)`);
  L.push(`- **Feed:** ${artifact.show.feedUrl}`);
  if (artifact.show.appleId) L.push(`- **Apple id:** ${artifact.show.appleId}`);
  L.push(`- **Episodes:** ${total}`);
  L.push(`- **Extraction model:** \`${artifact.extraction.model}\` (prompt version \`${artifact.extraction.promptVersion}\`)`);
  L.push(`- **Resolved coverage:** ${withTag}/${total} episodes (${pct}%) carry ≥1 resolved tag`);
  L.push(`- **Resolved tags:** ${tagTotal} total — ${byRole.subject ?? 0} subject, ${byRole.mentioned ?? 0} mentioned`);
  L.push(`  - by type: ${byType.character ?? 0} character, ${byType.faction ?? 0} faction, ${byType.location ?? 0} location`);
  L.push(`- **Episode kinds:** ${EPISODE_KINDS.map((k) => `${kindCounts[k] ?? 0} ${k}`).join(", ")}`);
  L.push(`- **Distinct unresolved surface-forms:** ${unresolvedList.length}`);
  L.push("");

  L.push("## Method (resolution reuse)");
  L.push("");
  L.push(
    "Tagging rides the existing rails. The LLM (forced tool call, `temperature: 0`) " +
      "extracts candidate surface-forms per axis, split into `primary` (→ `role: subject`) " +
      "and `mentioned`. Each form is resolved by **`resolveSurfaceForm` from " +
      "`src/lib/aliases`** (Brief 104) — the shared alias/canonical-name index, no forked " +
      "logic. The authoritative `type` is whatever axis the alias module resolves to (so a " +
      "mis-bucketed form still lands correctly); confidence is `1.0` for a canonical-name " +
      "match and `0.9` for an alias-key match (`matchedVia` records which). A form the alias " +
      "module does not know is recorded under `unresolved` with its raw string — never " +
      "auto-created as a reference row.",
  );
  L.push("");

  L.push("## Determinism");
  L.push("");
  L.push(
    "Episodes are sorted by `(pubDate, guid)`, tags by `(type, role, canonicalId)`, " +
      "unresolved forms by `(axisGuess, role, rawName)`; the artifact carries no wall-clock " +
      "timestamps. The LLM step is cached under `ingest/.llm-cache/` (gitignored) and run at " +
      "`temperature: 0`, so a warm-cache re-run reproduces the artifact byte-for-byte. " +
      "(A cold re-run with the cache cleared re-queries the model; near-identical but not " +
      "guaranteed byte-identical — the committed cache makes the deterministic path the default.)",
  );
  L.push("");

  L.push("## Unresolved surface-forms");
  L.push("");
  if (unresolvedList.length === 0) {
    L.push("_None — every extracted surface-form resolved._");
  } else {
    L.push("Sorted by episode-frequency. These are candidates for the curation pass (real missing entities) or for the alias module to learn (variants/noise).");
    L.push("");
    L.push("| axis (LLM guess) | surface-form | # episodes |");
    L.push("|---|---|---|");
    for (const u of unresolvedList) {
      L.push(`| ${u.axisGuess} | ${u.rawName.replace(/\|/g, "\\|")} | ${u.episodes} |`);
    }
  }
  L.push("");

  L.push(`## Spot-check (${sample.length} episodes, evenly spaced)`);
  L.push("");
  if (sample.length === 0) {
    L.push("_No episodes._");
  } else {
    for (const e of sample) {
      const date = e.pubDate ? e.pubDate.slice(0, 10) : "(no date)";
      L.push(`### ${e.title}`);
      L.push("");
      L.push(`- **Date / kind:** ${date} · ${e.episodeKind}`);
      if (e.tags.length === 0) {
        L.push(`- **Tags:** _none resolved_`);
      } else {
        L.push(`- **Tags:** ${e.tags.map(renderTag).join("; ")}`);
      }
      if (e.unresolved.length > 0) {
        L.push(`- **Unresolved:** ${e.unresolved.map((u) => `“${u.rawName}” (${u.axisGuess})`).join("; ")}`);
      }
      L.push("");
    }
  }

  return L.join("\n").trimEnd() + "\n";
}
