/**
 * apply-override-synopsis-lint.ts — pure synopsis-lint helper for Brief 080.
 *
 * Public-Synopsis-Forward-Guard: closes the gap between the Public-Synopsis-
 * Discipline kodifiziert in Brief 061 § Constraints (forward-only ab
 * `ssot-w40k-021`) und dem Apply-Layer-Enforcement. Banned patterns ban
 * Markdown emphasis, SSOT-IDs (W40K-NNNN / HH-NNNN), brief references,
 * authority-layer/curation vocabulary, audit-markers, resolver/surface-form
 * tail-strings — everything that should never reach a `/buch/[slug]` reader.
 *
 * Pure function: no DB, no Drizzle, no Node-FS at call time. Patterns are
 * loaded once at the caller (top-level module init), then the lint helper is
 * called per book with the patterns array passed in. Fully unit-testable
 * without seed-FS or db-client side-effects.
 *
 * Apply-vs-Dry-Semantik (Brief 080 § Constraints, P1 fix):
 *   - Real apply (`scripts/apply-override.ts`): caller throws hard on
 *     `hits.length > 0`. Gate-Semantik — polluted synopses cannot reach the
 *     DB.
 *   - Dry-run (`scripts/apply-override-dry.ts`): caller collects hits into a
 *     per-batch report, prints, but does NOT fail. Inspections-/Report-
 *     Semantik — polluted batches 009..019 (out of scope for Brief 080)
 *     surface in the dry report as Pre-Mess-Telemetrie for the follow-up
 *     loop 081 without forcing this brief to fix them.
 *
 * Optional extension point for Brief 081: a `--strict-synopsis` flag in the
 * dry runner that flips the dry to hard-fail-on-hits. Out of scope here.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface BannedPattern {
  kind: "regex" | "substring";
  value: string;
  label: string;
}

export interface SynopsisLintHit {
  patternLabel: string;
  matchedText: string;
  position: number;
  snippet: string;
}

export interface SynopsisLintResult {
  externalBookId: string;
  slug: string;
  hits: SynopsisLintHit[];
}

interface BannedPatternsFile {
  $schema?: string;
  patterns: BannedPattern[];
}

const SNIPPET_CONTEXT = 20;

export function loadBannedPatterns(seedDir: string): readonly BannedPattern[] {
  const file = JSON.parse(
    readFileSync(join(seedDir, "synopsis-banned-patterns.json"), "utf8"),
  ) as BannedPatternsFile;
  if (!Array.isArray(file.patterns)) {
    throw new Error(
      "[synopsis-lint] synopsis-banned-patterns.json: missing `patterns` array",
    );
  }
  return file.patterns;
}

function snippetAround(synopsis: string, position: number, length: number): string {
  const start = Math.max(0, position - SNIPPET_CONTEXT);
  const end = Math.min(synopsis.length, position + length + SNIPPET_CONTEXT);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < synopsis.length ? "…" : "";
  return prefix + synopsis.slice(start, end).replace(/\s+/g, " ") + suffix;
}

export function lintSynopsis(
  externalBookId: string,
  slug: string,
  synopsis: string,
  patterns: readonly BannedPattern[],
): SynopsisLintResult {
  const hits: SynopsisLintHit[] = [];

  for (const pattern of patterns) {
    if (pattern.kind === "substring") {
      const needle = pattern.value.toLowerCase();
      const haystack = synopsis.toLowerCase();
      let from = 0;
      while (from <= haystack.length - needle.length) {
        const idx = haystack.indexOf(needle, from);
        if (idx === -1) break;
        const matchedText = synopsis.slice(idx, idx + needle.length);
        hits.push({
          patternLabel: pattern.label,
          matchedText,
          position: idx,
          snippet: snippetAround(synopsis, idx, matchedText.length),
        });
        from = idx + needle.length;
      }
      continue;
    }

    // regex
    const re = new RegExp(pattern.value, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(synopsis)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex += 1;
        continue;
      }
      hits.push({
        patternLabel: pattern.label,
        matchedText: m[0],
        position: m.index,
        snippet: snippetAround(synopsis, m.index, m[0].length),
      });
    }
  }

  hits.sort((a, b) => a.position - b.position || a.patternLabel.localeCompare(b.patternLabel));

  return { externalBookId, slug, hits };
}

export function formatLintError(
  result: SynopsisLintResult,
  batch: string,
): string {
  const lines = result.hits.map(
    (h) =>
      `  - ${h.patternLabel} (pos=${h.position}) → "${h.matchedText}" in: ${h.snippet}`,
  );
  return [
    `[apply-override] synopsis-lint failed for ${result.externalBookId} ` +
      `(${result.slug}) in batch ${batch}: ${result.hits.length} banned-pattern hit(s)`,
    ...lines,
    `  Fix: rewrite overrides.synopsis to remove the patterns above. ` +
      `See scripts/seed-data/synopsis-banned-patterns.json for the canonical list.`,
  ].join("\n");
}
