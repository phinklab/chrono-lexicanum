/**
 * Brief 151 Task 2 — read-only podcast artifact ↔ DB drift audit (LOCAL ONLY).
 *
 * For each registered show, compares the episode guids of the committed artifact
 * `ingest/podcasts/<slug>.json` against the episode guids in Postgres, and reports
 * the drift — loudly for the dangerous direction (DB ahead of the artifact, which
 * would re-detect as "new" in the weekly run), informationally for the harmless one.
 *
 * STRICTLY READ-ONLY: the only DB statements are `SELECT`s. It writes nothing — not
 * Postgres, not the artifacts, not the roster. It is the maintainer's PREFLIGHT
 * before trusting the weekly cron, never part of the CI detection path.
 *
 *   npm run refresh:audit-artifacts        # uses --env-file=.env.local (local only)
 *
 * It reads the DB, so it needs `DATABASE_URL`. Without it (e.g. the CI environment),
 * it prints a notice and exits 0 — it NEVER reddens CI. The CI workflow runs
 * `refresh:check:ci`, which is DB-free; this audit is deliberately not wired there.
 *
 * Exit code: 1 iff any show has DB episodes missing from its artifact (dangerous
 * drift to fix with `npm run ingest:podcast -- --show <slug>`), else 0 — so the
 * preflight is meaningful to "pull green" locally.
 */
import { join } from "node:path";

import { loadRegistry, type PodcastShowConfig } from "@/lib/ingestion/podcast/registry";

import { auditArtifactDrift, hasDangerousDrift, type ArtifactDriftResult } from "./refresh/artifact-audit";
import { defaultPodcastDiffDeps } from "./refresh/podcast-diff";

function printResult(r: ArtifactDriftResult): void {
  const head = `[${r.slug}] artifact ${r.artifactPresent ? r.artifactCount : "MISSING"} guid(s), DB ${r.dbCount} guid(s)`;
  if (r.dbMinusArtifact.length === 0 && r.artifactMinusDb.length === 0 && r.artifactPresent) {
    console.log(`✅ ${head} — in sync`);
    return;
  }
  if (r.dbMinusArtifact.length > 0) {
    console.log(`⚠ ${head}`);
    console.log(
      `   DANGEROUS — ${r.dbMinusArtifact.length} episode(s) in DB but NOT in the artifact ` +
        "(would re-detect as \"new\"); re-pull with `npm run ingest:podcast -- --show " +
        `${r.slug}\`:`,
    );
    for (const g of r.dbMinusArtifact.slice(0, 20)) console.log(`     - ${g}`);
    if (r.dbMinusArtifact.length > 20) console.log(`     … and ${r.dbMinusArtifact.length - 20} more`);
  } else {
    console.log(`✅ ${head}`);
  }
  if (!r.artifactPresent) {
    console.log(`   note: committed artifact ingest/podcasts/${r.slug}.json is missing/unreadable.`);
  }
  if (r.artifactMinusDb.length > 0) {
    console.log(
      `   info — ${r.artifactMinusDb.length} episode(s) in the artifact but not yet in the DB ` +
        "(harmless: artifact ahead of DB / not yet applied).",
    );
  }
}

async function main(): Promise<void> {
  // Guard BEFORE importing the DB client (which throws on a missing DATABASE_URL).
  // No DB env → clean skip (exit 0); this audit is local-only and never runs in CI.
  if (!process.env.DATABASE_URL) {
    console.log(
      "[refresh:audit-artifacts] no DATABASE_URL in env — this audit reads Postgres and is " +
        "LOCAL-ONLY. Run `npm run refresh:audit-artifacts` (it loads --env-file=.env.local). " +
        "Skipping cleanly (not an error; CI never runs this path).",
    );
    return;
  }

  // Dynamic imports so the DB client is only evaluated AFTER the env guard above.
  const { db } = await import("@/db/client");
  const { works, podcastDetails, podcastEpisodeDetails } = await import("@/db/schema");
  const { and, eq } = await import("drizzle-orm");

  /** Resolve a show's work id read-only — podcastGuid → feedUrl → slug (apply-podcast order). */
  async function resolveShowWorkId(cfg: PodcastShowConfig): Promise<string | null> {
    if (cfg.podcastGuid) {
      const r = await db
        .select({ id: works.id })
        .from(works)
        .innerJoin(podcastDetails, eq(podcastDetails.workId, works.id))
        .where(eq(podcastDetails.podcastGuid, cfg.podcastGuid))
        .limit(1);
      if (r[0]) return r[0].id;
    }
    const r2 = await db
      .select({ id: works.id })
      .from(works)
      .innerJoin(podcastDetails, eq(podcastDetails.workId, works.id))
      .where(eq(podcastDetails.feedUrl, cfg.feedUrl))
      .limit(1);
    if (r2[0]) return r2[0].id;
    const r3 = await db
      .select({ id: works.id })
      .from(works)
      .where(and(eq(works.slug, cfg.slug), eq(works.kind, "podcast")))
      .limit(1);
    return r3[0]?.id ?? null;
  }

  async function dbGuidsForShow(showId: string): Promise<Set<string>> {
    const rows = await db
      .select({ guid: podcastEpisodeDetails.episodeGuid })
      .from(podcastEpisodeDetails)
      .where(eq(podcastEpisodeDetails.podcastWorkId, showId));
    return new Set(rows.map((r) => r.guid));
  }

  const registry = loadRegistry();
  // Reuse the exact committed-artifact reader the weekly diff uses (its `loadCommittedGuids`
  // — a sync file read; no network is touched, we never call the fetch deps).
  const artifacts = defaultPodcastDiffDeps({ artifactDir: join(process.cwd(), "ingest", "podcasts") });

  console.log(`[refresh:audit-artifacts] read-only — ${registry.length} registered show(s)\n`);

  const results: ArtifactDriftResult[] = [];
  for (const cfg of registry) {
    const artifactGuids = artifacts.loadCommittedGuids(cfg.slug);
    const showId = await resolveShowWorkId(cfg);
    const dbGuids = showId ? await dbGuidsForShow(showId) : new Set<string>();
    const res = auditArtifactDrift(cfg.slug, artifactGuids, dbGuids);
    results.push(res);
    if (showId === null) console.log(`[${cfg.slug}] not yet applied to the DB (no show work) — DB side empty.`);
    printResult(res);
  }

  const danger = hasDangerousDrift(results);
  console.log(
    `\n[refresh:audit-artifacts] ${danger ? "⚠ DANGEROUS DRIFT" : "✅ clean"} — ` +
      `${results.filter((r) => r.dbMinusArtifact.length > 0).length} show(s) with DB ahead of artifact.`,
  );
  if (danger) process.exitCode = 1;
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((err: unknown) => {
    console.error("[refresh:audit-artifacts] failed:", err instanceof Error ? (err.stack ?? err.message) : err);
    process.exit(1);
  });
