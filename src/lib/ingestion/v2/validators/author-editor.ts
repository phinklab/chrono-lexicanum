/**
 * Validator 4 — `author_editor_suspicion`.
 *
 * Deterministic anthology detection. Triggers when EITHER:
 *
 *   - the Lexicanum claim populated `editorNames` (the V2 Lexicanum parser
 *     reads the new `Editor`/`Editors` infobox cell separately from
 *     `Author`); OR
 *   - any source's `authorNames` is a single entry whose name matches
 *     /various|editor|edited.by|anonymous/i (the V1 047-Hebel-E heuristic,
 *     promoted from a prompt nudge to a deterministic classifier).
 *
 * Outcome: `severity: warn`, `field: format`, `suggested.value: anthology`,
 * `suggested.action: flag`. Stage 4 reads the suggestion, sets the
 * `format` FieldRecord with `source: "validator"` and `value: "anthology"`,
 * folding this in BEFORE the LLM-supplied format (which can otherwise miss
 * anthology classification on narrow evidence).
 */
import type { DiscoveredBook, SourceClaim, Validation } from "../types";

const EDITOR_HEURISTIC_RE = /various|editor|edited\.by|edited\s+by|anonymous/i;

export function validateAuthorEditorSuspicion(
  claims: SourceClaim[],
  _discovered: DiscoveredBook,
): Validation[] {
  void _discovered;
  const evidence: { source: string; value: unknown }[] = [];
  let triggered = false;

  for (const claim of claims) {
    const editors = claim.fields.editorNames;
    if (editors && editors.length > 0) {
      triggered = true;
      evidence.push({ source: claim.source, value: { editorNames: editors } });
    }
    const authors = claim.fields.authorNames;
    if (authors && authors.length === 1 && EDITOR_HEURISTIC_RE.test(authors[0])) {
      triggered = true;
      evidence.push({
        source: claim.source,
        value: { authorNames: authors, matched: "editor-heuristic" },
      });
    }
  }

  if (!triggered) return [];

  return [
    {
      field: "format",
      severity: "warn",
      kind: "author_editor_suspicion",
      evidence,
      suggested: { value: "anthology", action: "flag" },
      reasoning:
        "anthology signal: Lexicanum infobox carries an Editor cell, or an authorNames entry matched the editor-heuristic regex (various|editor|edited by|anonymous). Format set to anthology by validator.",
    },
  ];
}
