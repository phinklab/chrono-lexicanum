/**
 * Multi-source merge engine.
 *
 * Per `FIELD_PRIORITY`, walk each field's prioritized source list and
 * adopt the first non-undefined value. Record per-field origin in
 * `fieldOrigins`. When two or more sources both provide a non-empty
 * value for the same field and the normalized values disagree, surface
 * the disagreement as a `MergeFieldConflict` — the highest-priority
 * source still wins (deterministic) but the conflict is logged.
 *
 * Stylistic differences (whitespace, case, simple title-subset) are NOT
 * conflicts — only meaningful divergence is reported.
 */
import { slugify } from "@/lib/slug";

import { FIELD_PRIORITY } from "./field-priority";
import { SOURCE_CONFIDENCE } from "./source-confidence";
import type {
  FieldName,
  MergeFieldConflict,
  MergedBook,
  SourceName,
  SourcePayload,
  SourcePayloadFields,
  WikipediaBookEntry,
} from "./types";

const ARRAY_FIELDS = new Set<FieldName>([
  "authorNames",
  "factionNames",
  "locationNames",
  "characterNames",
]);

export interface MergeResult {
  merged: MergedBook;
  conflicts: MergeFieldConflict[];
}

export function mergeBookFromSources(payloads: SourcePayload[]): MergeResult {
  const bySource = new Map<SourceName, SourcePayload>();
  for (const p of payloads) bySource.set(p.source, p);

  const fields: SourcePayloadFields = {};
  const fieldOrigins: Partial<Record<FieldName, SourceName>> = {};
  const conflicts: MergeFieldConflict[] = [];

  for (const fieldName of Object.keys(FIELD_PRIORITY) as FieldName[]) {
    const order = FIELD_PRIORITY[fieldName];

    // Collect every non-empty value (in priority order) so we can detect
    // conflicts. Picking the winner happens after the scan.
    const candidates: Array<{ source: SourceName; value: unknown }> = [];
    for (const src of order) {
      const payload = bySource.get(src);
      if (!payload) continue;
      const value = payload.fields[fieldName];
      if (!isPresent(value)) continue;
      candidates.push({ source: src, value });
    }

    if (candidates.length === 0) continue;

    // Winner = first candidate (highest priority that supplied a value).
    const winner = candidates[0];
    assignField(fields, fieldName, winner.value);
    fieldOrigins[fieldName] = winner.source;

    if (candidates.length > 1 && hasMeaningfulConflict(fieldName, candidates)) {
      conflicts.push({ field: fieldName, sources: candidates });
    }
  }

  const title = fields.title ?? "";
  const slug = slugify(title);
  const primarySource = fieldOrigins.title ?? inferPrimarySource(payloads);
  const confidence = SOURCE_CONFIDENCE[primarySource];

  const externalUrls: MergedBook["externalUrls"] = [];
  for (const p of payloads) {
    if (p.sourceUrl) externalUrls.push({ source: p.source, url: p.sourceUrl });
  }

  return {
    merged: {
      slug,
      primarySource,
      confidence,
      fields,
      fieldOrigins,
      externalUrls,
    },
    conflicts,
  };
}

/**
 * Lift a `WikipediaBookEntry` into a `SourcePayload` for the merge
 * engine. Discovery and per-book payload share the same shape.
 */
export function wikipediaEntryToPayload(
  entry: WikipediaBookEntry,
): SourcePayload {
  const fields: SourcePayloadFields = {
    title: entry.title,
  };
  if (entry.author) fields.authorNames = [entry.author];
  if (entry.releaseYear !== undefined) fields.releaseYear = entry.releaseYear;
  if (entry.seriesId !== undefined) fields.seriesId = entry.seriesId;
  if (entry.seriesIndex !== undefined) fields.seriesIndex = entry.seriesIndex;

  return {
    source: "wikipedia",
    sourceUrl: entry.sourcePage,
    fields,
  };
}

// =============================================================================
// Helpers
// =============================================================================

function isPresent(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function assignField(
  fields: SourcePayloadFields,
  name: FieldName,
  value: unknown,
): void {
  // The cast is safe because each FIELD_PRIORITY key matches a field of
  // SourcePayloadFields with the value-type the source supplied.
  (fields as Record<FieldName, unknown>)[name] = value;
}

function hasMeaningfulConflict(
  fieldName: FieldName,
  candidates: Array<{ source: SourceName; value: unknown }>,
): boolean {
  const winner = candidates[0].value;
  for (let i = 1; i < candidates.length; i++) {
    if (!valuesEquivalent(fieldName, winner, candidates[i].value)) return true;
  }
  return false;
}

function valuesEquivalent(
  fieldName: FieldName,
  a: unknown,
  b: unknown,
): boolean {
  if (a === b) return true;
  if (typeof a === "string" && typeof b === "string") {
    const na = normalizeString(a);
    const nb = normalizeString(b);
    if (na === nb) return true;
    // Treat title-subset as equivalent: "Eisenhorn: Xenos" ≡ "Xenos".
    if (fieldName === "title" && (na.includes(nb) || nb.includes(na))) return true;
    return false;
  }
  if (typeof a === "number" && typeof b === "number") return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (!ARRAY_FIELDS.has(fieldName)) return false;
    const sa = new Set(a.map((x) => normalizeString(String(x))));
    const sb = new Set(b.map((x) => normalizeString(String(x))));
    if (sa.size !== sb.size) return false;
    for (const v of sa) if (!sb.has(v)) return false;
    return true;
  }
  return false;
}

function normalizeString(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function inferPrimarySource(payloads: SourcePayload[]): SourceName {
  // Fallback when no source supplied a title — pick the first payload's
  // source. In practice this is hit only when discovery yields a roster
  // entry but every per-book crawler returned null AND the discovery
  // entry itself had no title (shouldn't happen).
  return payloads[0]?.source ?? "wikipedia";
}
