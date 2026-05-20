/**
 * hardcover-author-normalize.ts — pure author-normalization helper (Brief 086).
 *
 * Roster author names sometimes differ structurally from the form Hardcover
 * indexes under, producing `author_mismatch` misses even when the title is
 * right. Two structural rewrites heal the common sub-population:
 *
 *   1. Initial-drop. A middle initial ("James A. Swallow") is dropped to the
 *      shorter form ("James Swallow"). Drop-direction only — Hardcover is
 *      usually the shorter form, and we never invent an initial.
 *
 *   2. Diminutive alias (bidirectional). The first name is looked up against
 *      `scripts/seed-data/author-aliases.json` — a list of equivalence pairs.
 *      A match on either side emits the other ("Dan Abnett" -> "Daniel Abnett"
 *      AND "Daniel Abnett" -> "Dan Abnett"). Case-insensitive match; the
 *      table's canonical casing is used in the output.
 *
 * Pipeline: initial-drop runs first; the diminutive stage is built on the
 * initial-cleaned form, so "Daniel A. Abnett" yields BOTH
 * ["Daniel Abnett", "Dan Abnett"]. At most 2 variants, deduped against the
 * input and each other; order is (1) initial-drop, (2) diminutive.
 *
 * Backfill-wiring (Stage 5): each returned variant becomes one extra
 * `discoverHardcoverClaimV2(primaryTitle, altAuthor)` call on benign-miss.
 *
 * Pure: no DB, no Anthropic SDK. The alias table is read once at module load
 * from the maintainer-puflegt JSON (sibling convention of the seed configs).
 * `normalizeAuthorWith()` is exported for tests that want to inject a table.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface AuthorAliasFile {
  pairs: [string, string][];
}

/** Build a case-insensitive bidirectional first-name map from equivalence pairs. */
export function buildAliasMap(pairs: [string, string][]): Map<string, string> {
  const map = new Map<string, string>();
  for (const [a, b] of pairs) {
    const la = a.trim().toLowerCase();
    const lb = b.trim().toLowerCase();
    if (la.length === 0 || lb.length === 0 || la === lb) continue;
    // Each side maps to the OTHER side's canonical (table) casing. First
    // definition wins on collision so the table is the single source of truth.
    if (!map.has(la)) map.set(la, b.trim());
    if (!map.has(lb)) map.set(lb, a.trim());
  }
  return map;
}

function loadAliasMap(): Map<string, string> {
  const path = join(process.cwd(), "scripts", "seed-data", "author-aliases.json");
  const parsed = JSON.parse(readFileSync(path, "utf8")) as AuthorAliasFile;
  return buildAliasMap(parsed.pairs ?? []);
}

const ALIAS_MAP = loadAliasMap();

/**
 * Returns 0-2 author variants structurally distinct from `rosterAuthor`,
 * deduped against it and each other. Uses the module-level alias table.
 */
export function normalizeAuthor(rosterAuthor: string): string[] {
  return normalizeAuthorWith(rosterAuthor, ALIAS_MAP);
}

/** Test-friendly core: same logic with an injected alias map. */
export function normalizeAuthorWith(
  rosterAuthor: string,
  aliasMap: Map<string, string>,
): string[] {
  const base = rosterAuthor.trim();
  if (base.length === 0) return [];

  const seen = new Set<string>([base]);
  const variants: string[] = [];

  // Stage 1 — initial-drop. Build the diminutive stage on this cleaned form.
  const afterInitialDrop = dropMiddleInitials(base);
  if (afterInitialDrop !== base && !seen.has(afterInitialDrop)) {
    seen.add(afterInitialDrop);
    variants.push(afterInitialDrop);
  }
  const diminutiveBase = afterInitialDrop;

  // Stage 2 — diminutive alias on the (possibly initial-cleaned) form.
  const dim = applyDiminutive(diminutiveBase, aliasMap);
  if (dim !== null && !seen.has(dim)) {
    seen.add(dim);
    variants.push(dim);
  }

  return variants.slice(0, 2);
}

/** Strip standalone middle initials ("James A. Swallow" -> "James Swallow"). */
function dropMiddleInitials(name: string): string {
  // Only initials preceded by whitespace are middle/trailing — a leading
  // first-initial ("A. Swallow") is left intact (no `\s+` before it).
  return name.replace(/\s+[A-Z]\.(?=\s)/gu, "").replace(/\s{2,}/gu, " ").trim();
}

/** Swap the first name via the alias map; null when no match. */
function applyDiminutive(name: string, aliasMap: Map<string, string>): string | null {
  const m = /^(\S+)(\s+.*)?$/u.exec(name);
  if (!m) return null;
  const first = m[1];
  const rest = m[2] ?? "";
  const swapped = aliasMap.get(first.toLowerCase());
  if (swapped === undefined) return null;
  return `${swapped}${rest}`;
}
