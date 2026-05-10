/**
 * Pipeline V2 — validator registry + run-all.
 *
 * Five deterministic validators. Each takes `(claims, discovered)` and emits
 * `Validation[]`. `runAllValidators` is the orchestrator entry — invokes the
 * registered validators in stable order and concatenates results.
 *
 * Validators MUST NOT mutate claims. They MUST be pure functions of their
 * inputs; same input → same output. This makes the diff reproducible across
 * re-runs (LLM cache hits notwithstanding).
 */
import type {
  DiscoveredBook,
  SourceClaim,
  Validation,
  ValidationKind,
} from "../types";

import { validateAuthorEditorSuspicion } from "./author-editor";
import { validateEditionIsbnConflict } from "./edition-isbn";
import { validateLexicanumMissing } from "./lexicanum-missing";
import { validatePagecountOutlier } from "./pagecount";
import { validateYearOutlier } from "./year-outlier";

export type ValidatorFn = (
  claims: SourceClaim[],
  discovered: DiscoveredBook,
) => Validation[];

export interface ValidatorEntry {
  kind: ValidationKind;
  fn: ValidatorFn;
}

export const VALIDATORS: ValidatorEntry[] = [
  { kind: "year_outlier", fn: validateYearOutlier },
  { kind: "edition_isbn_conflict", fn: validateEditionIsbnConflict },
  { kind: "pagecount_outlier", fn: validatePagecountOutlier },
  { kind: "author_editor_suspicion", fn: validateAuthorEditorSuspicion },
  { kind: "lexicanum_missing", fn: validateLexicanumMissing },
];

export interface RunValidatorsOptions {
  /** Validator kinds to skip entirely (not invoked, not in output). Used by
   *  the SSOT-mode path (Brief 058) to inert `author_editor_suspicion`, which
   *  is redundant when `format`/`editorialNote`/`editors` come straight from
   *  the maintainer Excel. */
  skipKinds?: ValidationKind[];
}

export function runAllValidators(
  claims: SourceClaim[],
  discovered: DiscoveredBook,
  opts?: RunValidatorsOptions,
): Validation[] {
  const skip = new Set(opts?.skipKinds ?? []);
  const out: Validation[] = [];
  for (const v of VALIDATORS) {
    if (skip.has(v.kind)) continue;
    out.push(...v.fn(claims, discovered));
  }
  return out;
}

export function emptyValidationSummary(): Record<ValidationKind, number> {
  return {
    year_outlier: 0,
    edition_isbn_conflict: 0,
    pagecount_outlier: 0,
    author_editor_suspicion: 0,
    lexicanum_missing: 0,
  };
}

export function summarizeValidations(
  validations: Validation[],
): Record<ValidationKind, number> {
  const summary = emptyValidationSummary();
  for (const v of validations) summary[v.kind] += 1;
  return summary;
}

export function mergeValidationSummaries(
  a: Record<ValidationKind, number>,
  b: Record<ValidationKind, number>,
): Record<ValidationKind, number> {
  return {
    year_outlier: a.year_outlier + b.year_outlier,
    edition_isbn_conflict: a.edition_isbn_conflict + b.edition_isbn_conflict,
    pagecount_outlier: a.pagecount_outlier + b.pagecount_outlier,
    author_editor_suspicion: a.author_editor_suspicion + b.author_editor_suspicion,
    lexicanum_missing: a.lexicanum_missing + b.lexicanum_missing,
  };
}

export {
  validateAuthorEditorSuspicion,
  validateEditionIsbnConflict,
  validateLexicanumMissing,
  validatePagecountOutlier,
  validateYearOutlier,
};
