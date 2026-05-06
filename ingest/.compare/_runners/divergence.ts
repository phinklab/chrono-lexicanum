/**
 * Brief 045 — Divergence-Helper.
 *
 * Pro Slug bekommt der Implementer-Report eine Markdown-Notiz „so unterscheidet
 * sich Variant X von Variant Y". Hier sind die Bausteine: Wortzahl-Vergleich,
 * facetIds-Set-Diff, Identitäts-Check für format/availability/rating,
 * plausibilityFlags-Vergleich.
 */
import type { DiffFile, MergedBook } from "@/lib/ingestion/types";

export interface ComparableEnrichment {
  synopsis: string;
  facetIds: string[];
  format?: string | null;
  availability?: string | null;
  rating?: number | null;
  ratingSource?: string | null;
  ratingCount?: number | null;
  plausibilityFlags: Array<{ kind: string; reasoning?: string }>;
  discoveredLinks: Array<{ serviceHint: string; kind: string; url: string }>;
}

export interface VariantAEnrichment extends ComparableEnrichment {
  /** Marker so error messages stay clear when an a-slot is missing. */
  source: "haiku-pipeline-a";
}

export function extractVariantAFromDiff(
  diff: DiffFile,
  slug: string,
): VariantAEnrichment {
  const entry = diff.added.find((x) => x.slug === slug);
  if (!entry) {
    throw new Error(
      `cannot extract Variant-A for slug ${slug} — not in diff.added`,
    );
  }
  const merged: MergedBook = entry.payload;
  const f = merged.fields;
  const llmFlags = (diff.llm_flags ?? []).filter((fl) => fl.slug === slug);
  const facetIds: string[] = entry.rawLlmPayload?.facetIds ?? f.facetIds ?? [];
  return {
    source: "haiku-pipeline-a",
    synopsis: f.synopsis ?? "",
    facetIds,
    format: f.format ?? null,
    availability: f.availability ?? null,
    rating: typeof f.rating === "number" ? f.rating : null,
    ratingSource: f.ratingSource ?? null,
    ratingCount: typeof f.ratingCount === "number" ? f.ratingCount : null,
    plausibilityFlags: llmFlags.map((fl) => ({
      kind: fl.kind,
      reasoning: fl.reasoning,
    })),
    discoveredLinks: entry.rawLlmPayload?.discoveredLinks ?? [],
  };
}

function wordCount(s: string | null | undefined): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function setDiff<T>(a: T[], b: T[]): { onlyA: T[]; onlyB: T[]; both: T[] } {
  const sa = new Set(a);
  const sb = new Set(b);
  const onlyA: T[] = [];
  const onlyB: T[] = [];
  const both: T[] = [];
  for (const x of sa) {
    if (sb.has(x)) both.push(x);
    else onlyA.push(x);
  }
  for (const x of sb) {
    if (!sa.has(x)) onlyB.push(x);
  }
  return { onlyA, onlyB, both };
}

function flagKindSet(
  flags: Array<{ kind: string }>,
): Set<string> {
  return new Set(flags.map((f) => f.kind));
}

/** Compare two enrichments, return a one-paragraph Markdown notice. */
export function describeDivergence(
  label: string,
  a: ComparableEnrichment,
  b: ComparableEnrichment,
): string {
  const wA = wordCount(a.synopsis);
  const wB = wordCount(b.synopsis);
  const facets = setDiff(a.facetIds, b.facetIds);

  const parts: string[] = [`Vs. ${label}:`];

  // Synopsis-Wortzahl
  parts.push(`Synopsis ${wB}W (vs ${wA}W → Δ ${wB - wA}W).`);

  // Facets-Diff
  if (facets.onlyA.length === 0 && facets.onlyB.length === 0) {
    parts.push("FacetIds identisch.");
  } else {
    const dropped = facets.onlyA.length > 0
      ? `entfernt: [${facets.onlyA.join(", ")}]`
      : "";
    const added = facets.onlyB.length > 0
      ? `neu: [${facets.onlyB.join(", ")}]`
      : "";
    parts.push(`FacetIds-Diff: ${[dropped, added].filter(Boolean).join("; ")}.`);
  }

  // Format / Availability
  const fmtSame = (a.format ?? null) === (b.format ?? null);
  const availSame = (a.availability ?? null) === (b.availability ?? null);
  if (fmtSame && availSame) {
    parts.push("Format+Availability identisch.");
  } else {
    if (!fmtSame) {
      parts.push(`Format: ${a.format ?? "null"} → ${b.format ?? "null"}.`);
    }
    if (!availSame) {
      parts.push(
        `Availability: ${a.availability ?? "null"} → ${b.availability ?? "null"}.`,
      );
    }
  }

  // Rating
  const aRating =
    a.rating !== null && a.rating !== undefined
      ? `${a.rating} (${a.ratingSource ?? "?"}, n=${a.ratingCount ?? "?"})`
      : "null";
  const bRating =
    b.rating !== null && b.rating !== undefined
      ? `${b.rating} (${b.ratingSource ?? "?"}, n=${b.ratingCount ?? "?"})`
      : "null";
  if (aRating === bRating) {
    parts.push(`Rating identisch (${aRating}).`);
  } else {
    parts.push(`Rating: ${aRating} → ${bRating}.`);
  }

  // PlausibilityFlags-Diff
  const fa = flagKindSet(a.plausibilityFlags);
  const fb = flagKindSet(b.plausibilityFlags);
  const newKinds: string[] = [];
  const droppedKinds: string[] = [];
  for (const k of fb) if (!fa.has(k)) newKinds.push(k);
  for (const k of fa) if (!fb.has(k)) droppedKinds.push(k);
  if (newKinds.length === 0 && droppedKinds.length === 0) {
    parts.push("PlausibilityFlags-Kinds identisch.");
  } else {
    const segs: string[] = [];
    if (droppedKinds.length > 0) {
      segs.push(`fehlend: [${droppedKinds.join(", ")}]`);
    }
    if (newKinds.length > 0) segs.push(`neu: [${newKinds.join(", ")}]`);
    parts.push(`PlausibilityFlags-Diff: ${segs.join("; ")}.`);
  }

  // DiscoveredLinks-Anzahl
  const aLinks = a.discoveredLinks.length;
  const bLinks = b.discoveredLinks.length;
  if (aLinks !== bLinks) {
    parts.push(`DiscoveredLinks: ${aLinks} → ${bLinks}.`);
  }

  return parts.join(" ");
}
