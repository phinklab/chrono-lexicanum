/**
 * Brief 151 Task 2 — podcast artifact ↔ DB drift audit (PURE set logic).
 *
 * The weekly podcast diff (`podcast-diff.ts`) keys "new" on the committed artifact
 * `ingest/podcasts/<slug>.json`, NOT on the DB. So if an episode is already in the
 * DB (`apply:podcast`) but the committed artifact was never re-pulled, that episode
 * is BEHIND the artifact's view and re-surfaces as "new" every week. This module is
 * the pure half of the read-only audit that makes that drift visible; the DB read
 * + the `--env-file` guard live in `scripts/refresh-audit-artifacts.ts`.
 *
 * No IO, no DB, no network — unit-tested offline (`npm run test:refresh`).
 */

export interface ArtifactDriftResult {
  slug: string;
  /** Whether the committed artifact `ingest/podcasts/<slug>.json` was found. */
  artifactPresent: boolean;
  artifactCount: number;
  dbCount: number;
  /**
   * Episode guids in the DB but NOT in the committed artifact — the DANGEROUS set.
   * Because the weekly diff is artifact-keyed, these would re-detect as "new" until
   * the artifact is re-pulled (`ingest:podcast`). Sorted for a stable report.
   */
  dbMinusArtifact: string[];
  /**
   * Episode guids in the artifact but NOT in the DB — harmless (the artifact is
   * ahead of the DB, e.g. detected-but-not-yet-applied). Informational only. Sorted.
   */
  artifactMinusDb: string[];
}

/**
 * Diff one show's committed-artifact guid set against its DB guid set.
 * `artifactGuids === null` means the committed artifact is missing/unreadable: the
 * artifact view is empty, so every DB episode lands in `dbMinusArtifact` (loud) —
 * which correctly stays empty for a show that was never ingested on either side.
 */
export function auditArtifactDrift(
  slug: string,
  artifactGuids: ReadonlySet<string> | null,
  dbGuids: ReadonlySet<string>,
): ArtifactDriftResult {
  const artifactPresent = artifactGuids !== null;
  const artifact = artifactGuids ?? new Set<string>();
  const dbMinusArtifact = [...dbGuids].filter((g) => !artifact.has(g)).sort();
  const artifactMinusDb = [...artifact].filter((g) => !dbGuids.has(g)).sort();
  return {
    slug,
    artifactPresent,
    artifactCount: artifact.size,
    dbCount: dbGuids.size,
    dbMinusArtifact,
    artifactMinusDb,
  };
}

/** True iff any show has DB episodes missing from its artifact (the loud failure). */
export function hasDangerousDrift(results: readonly ArtifactDriftResult[]): boolean {
  return results.some((r) => r.dbMinusArtifact.length > 0);
}
