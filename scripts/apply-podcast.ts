/**
 * apply-podcast.ts — Brief 114 Step 2. Brings the committed podcast pilot
 * artifact (`ingest/podcasts/<show>.json`, Brief 110) into Postgres.
 *
 * What it writes:
 *   • one `podcast` container work + `podcast_details` row (the show),
 *   • one `podcast_episode` work + `podcast_episode_details` row per feed item,
 *   • the resolved episode tags as `work_{characters,factions,locations}` rows
 *     with `role = subject | mentioned` (Brief 109 §7) and `raw_name` set.
 *
 * Single source of truth = the committed artifact (NO live re-fetch). The plan
 * is built by the pure `src/lib/ingestion/podcast/apply-plan.ts` module, which
 * this script and `scripts/test-podcast-apply.ts` share — so the write shape and
 * the idempotency proof never drift.
 *
 * Identity / idempotency (the point of the pass):
 *   • Show    — matched by `podcastGuid` → `feedUrl` → `slug` (in that order).
 *   • Episode — matched by `(podcast_work_id, episode_guid)` (the per-show UNIQUE
 *     key). The deterministic episode slug + title are frozen on update; the
 *     whole `works` row is immutable after insert (only `updatedAt` bumps), while
 *     the detail row and the junction sets are refreshed every apply.
 *   • Junctions are wiped and re-inserted PER EPISODE (delete-then-insert), so a
 *     re-applied, improved artifact replaces each episode's tag set authoritatively
 *     — no stale tags, no duplicates. Applying the same artifact twice is a no-op.
 *
 * FK-safety: only tags whose `canonicalId` exists in the DB reference set
 * (characters/factions/locations) are written. Unresolved forms are never
 * written and never auto-create reference rows (project invariant).
 *
 * CLI:
 *   npm run apply:podcast -- --dry-run            # build + print the plan, no writes
 *   npm run apply:podcast                          # apply
 *   npm run apply:podcast -- --file=<path>         # alternate artifact
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { and, count, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  characters,
  factions,
  locations,
  podcastDetails,
  podcastEpisodeDetails,
  workCharacters,
  workFactions,
  workLocations,
  works,
} from "@/db/schema";
import {
  buildApplyPlan,
  assertShowArtifact,
  type ApplyPlan,
  type EpisodePlan,
  type ReferenceSets,
} from "@/lib/ingestion/podcast/apply-plan";
import type { ShowArtifact } from "@/lib/ingestion/podcast/types";

const DEFAULT_ARTIFACT = "ingest/podcasts/the-40k-lorecast.json";

/** Real-world year from an ISO pubDate, for the universal `works.release_year` sort axis. */
function yearOf(pubDate: string | null): number | null {
  if (pubDate === null) return null;
  const y = Number.parseInt(pubDate.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

/** Load + validate the committed artifact. Throws before any DB mutation. */
function loadArtifact(path: string): ShowArtifact {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  assertShowArtifact(parsed);
  return parsed;
}

/** DB reference id sets — the FK-safety gate the plan builder needs. */
async function loadReferenceSets(): Promise<ReferenceSets> {
  const [chars, facs, locs] = await Promise.all([
    db.select({ id: characters.id }).from(characters),
    db.select({ id: factions.id }).from(factions),
    db.select({ id: locations.id }).from(locations),
  ]);
  return {
    character: new Set(chars.map((r) => r.id)),
    faction: new Set(facs.map((r) => r.id)),
    location: new Set(locs.map((r) => r.id)),
  };
}

function printPlan(plan: ApplyPlan, dryRun: boolean): void {
  const tag = dryRun ? " [DRY RUN — no writes]" : "";
  console.log(`\n=== podcast apply plan${tag} ===`);
  console.log(`Show:    ${plan.show.title}  (slug ${plan.show.slug})`);
  console.log(
    `Identity: podcastGuid=${plan.show.podcastGuid ?? "—"}  feedUrl=${plan.show.feedUrl}`,
  );
  console.log(`Episodes: ${plan.report.episodeCount}`);
  console.log(
    `Resolved tags → junctions: ${plan.report.resolvedTagCount}` +
      `  (unresolved in artifact, not written: ${plan.report.unresolvedFormCount})`,
  );
  if (plan.report.droppedMissingRefCount > 0) {
    console.log(
      `Dropped — canonicalId not in DB reference set (FK-safety): ${plan.report.droppedMissingRefCount}`,
    );
    for (const d of plan.droppedMissingRef.slice(0, 20)) {
      console.log(`    ${d.axis}:${d.canonicalId}  ("${d.rawName}")  ep=${d.episodeGuid}`);
    }
    if (plan.droppedMissingRef.length > 20) {
      console.log(`    … and ${plan.droppedMissingRef.length - 20} more`);
    }
  }
  // A small evenly-spaced sample so the dry-run is legible without dumping 148 rows.
  const eps = plan.episodes;
  const sampleCount = Math.min(6, eps.length);
  if (sampleCount > 0) {
    console.log(`Sample (${sampleCount} of ${eps.length} episodes):`);
    const step = eps.length / sampleCount;
    for (let i = 0; i < sampleCount; i++) {
      const e = eps[Math.min(eps.length - 1, Math.floor(i * step))];
      const n =
        e.junctions.character.length +
        e.junctions.faction.length +
        e.junctions.location.length;
      console.log(`    ${e.slug}  (${n} tag${n === 1 ? "" : "s"})  "${e.title}"`);
    }
  }
}

/**
 * Upsert the show container work + its detail row, return its works.id. Matched
 * by podcastGuid → feedUrl → slug. On a match the `works` row is frozen (only
 * `updatedAt` bumps); `podcast_details` is always refreshed from the artifact.
 */
async function upsertShow(plan: ApplyPlan): Promise<{ id: string; created: boolean }> {
  return db.transaction(async (tx) => {
    const findByDetail = async (
      column: typeof podcastDetails.podcastGuid | typeof podcastDetails.feedUrl,
      value: string,
    ): Promise<string | null> => {
      const rows = await tx
        .select({ id: works.id })
        .from(works)
        .innerJoin(podcastDetails, eq(podcastDetails.workId, works.id))
        .where(eq(column, value))
        .limit(1);
      return rows[0]?.id ?? null;
    };

    let showId: string | null = null;
    if (plan.show.podcastGuid !== null) {
      showId = await findByDetail(podcastDetails.podcastGuid, plan.show.podcastGuid);
    }
    if (showId === null) {
      showId = await findByDetail(podcastDetails.feedUrl, plan.show.feedUrl);
    }
    if (showId === null) {
      const rows = await tx
        .select({ id: works.id })
        .from(works)
        .where(and(eq(works.slug, plan.show.slug), eq(works.kind, "podcast")))
        .limit(1);
      showId = rows[0]?.id ?? null;
    }

    const created = showId === null;
    if (showId === null) {
      const inserted = await tx
        .insert(works)
        .values({
          kind: "podcast",
          canonicity: "fan",
          slug: plan.show.slug,
          title: plan.show.title,
          coverUrl: plan.show.imageUrl,
          sourceKind: "podcast_rss",
        })
        .returning({ id: works.id });
      showId = inserted[0].id;
    } else {
      await tx.update(works).set({ updatedAt: new Date() }).where(eq(works.id, showId));
    }

    await tx
      .insert(podcastDetails)
      .values({
        workId: showId,
        feedUrl: plan.show.feedUrl,
        podcastGuid: plan.show.podcastGuid,
        appleId: plan.show.appleId,
        imageUrl: plan.show.imageUrl,
      })
      .onConflictDoUpdate({
        target: podcastDetails.workId,
        set: {
          feedUrl: plan.show.feedUrl,
          podcastGuid: plan.show.podcastGuid,
          appleId: plan.show.appleId,
          imageUrl: plan.show.imageUrl,
        },
      });

    return { id: showId, created };
  });
}

interface EpisodeApplyResult {
  workId: string;
  created: boolean;
}

/**
 * Upsert one episode work + detail row + its three junction sets, in a single
 * transaction so a failure can't leave an episode half-written. Matched by
 * (showId, episodeGuid). The `works` row is frozen after insert (slug + title +
 * releaseYear); the detail row and junctions are refreshed every apply.
 */
async function applyEpisode(showId: string, ep: EpisodePlan): Promise<EpisodeApplyResult> {
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: works.id })
      .from(works)
      .innerJoin(podcastEpisodeDetails, eq(podcastEpisodeDetails.workId, works.id))
      .where(
        and(
          eq(podcastEpisodeDetails.podcastWorkId, showId),
          eq(podcastEpisodeDetails.episodeGuid, ep.episodeGuid),
        ),
      )
      .limit(1);

    const created = existing.length === 0;
    let workId: string;
    if (existing.length > 0) {
      workId = existing[0].id;
      await tx.update(works).set({ updatedAt: new Date() }).where(eq(works.id, workId));
    } else {
      const inserted = await tx
        .insert(works)
        .values({
          kind: "podcast_episode",
          canonicity: "fan",
          slug: ep.slug,
          title: ep.title,
          releaseYear: yearOf(ep.pubDate),
          sourceKind: "podcast_rss",
        })
        .returning({ id: works.id });
      workId = inserted[0].id;
    }

    const detail = {
      podcastWorkId: showId,
      episodeGuid: ep.episodeGuid,
      audioUrl: ep.audioUrl,
      durationSec: ep.durationSec,
      pubDate: ep.pubDate === null ? null : new Date(ep.pubDate),
      season: ep.season,
      episode: ep.episode,
      episodeKind: ep.episodeKind,
    };
    await tx
      .insert(podcastEpisodeDetails)
      .values({ workId, ...detail })
      .onConflictDoUpdate({ target: podcastEpisodeDetails.workId, set: detail });

    // Authoritative per-episode replace of every resolved tag set.
    await tx.delete(workCharacters).where(eq(workCharacters.workId, workId));
    if (ep.junctions.character.length > 0) {
      await tx.insert(workCharacters).values(
        ep.junctions.character.map((j) => ({
          workId,
          characterId: j.entityId,
          role: j.role,
          rawName: j.rawName,
        })),
      );
    }

    await tx.delete(workFactions).where(eq(workFactions.workId, workId));
    if (ep.junctions.faction.length > 0) {
      await tx.insert(workFactions).values(
        ep.junctions.faction.map((j) => ({
          workId,
          factionId: j.entityId,
          role: j.role,
          rawName: j.rawName,
        })),
      );
    }

    await tx.delete(workLocations).where(eq(workLocations.workId, workId));
    if (ep.junctions.location.length > 0) {
      await tx.insert(workLocations).values(
        ep.junctions.location.map((j) => ({
          workId,
          locationId: j.entityId,
          role: j.role,
          rawName: j.rawName,
        })),
      );
    }

    return { workId, created };
  });
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      "dry-run": { type: "boolean", default: false },
      file: { type: "string" },
    },
  });
  const dryRun = values["dry-run"] === true;
  const artifactPath = resolve(values.file ?? DEFAULT_ARTIFACT);

  const artifact = loadArtifact(artifactPath);
  console.log(`[apply-podcast] artifact: ${artifactPath}`);

  const refs = await loadReferenceSets();
  console.log(
    `[apply-podcast] DB reference set: ${refs.character.size} characters, ` +
      `${refs.faction.size} factions, ${refs.location.size} locations`,
  );

  const plan = buildApplyPlan(artifact, refs);
  printPlan(plan, dryRun);

  if (dryRun) {
    console.log("\n[apply-podcast] dry run — no rows written.");
    return;
  }

  const show = await upsertShow(plan);
  console.log(
    `\n[apply-podcast] show work ${show.created ? "inserted" : "updated"}: ${show.id}`,
  );

  let inserted = 0;
  let updated = 0;
  const episodeWorkIds: string[] = [];
  for (const ep of plan.episodes) {
    const r = await applyEpisode(show.id, ep);
    episodeWorkIds.push(r.workId);
    if (r.created) inserted += 1;
    else updated += 1;
  }

  // DB-side counts so the summary is authoritative, not just loop bookkeeping.
  const showEpisodeCount = await db
    .select({ n: count() })
    .from(podcastEpisodeDetails)
    .where(eq(podcastEpisodeDetails.podcastWorkId, show.id));
  const junctionCount = async (
    table: typeof workCharacters | typeof workFactions | typeof workLocations,
  ): Promise<number> => {
    let total = 0;
    // Chunk to keep the IN-list bounded if a feed ever grows very large.
    for (let i = 0; i < episodeWorkIds.length; i += 500) {
      const chunk = episodeWorkIds.slice(i, i + 500);
      if (chunk.length === 0) continue;
      const r = await db
        .select({ n: count() })
        .from(table)
        .where(inArray(table.workId, chunk));
      total += r[0]?.n ?? 0;
    }
    return total;
  };

  console.log(`\n=== podcast apply summary ===`);
  console.log(`Show:               ${show.created ? "inserted" : "updated"} (${show.id})`);
  console.log(`Episodes inserted:  ${inserted}`);
  console.log(`Episodes updated:   ${updated}`);
  console.log(`Episodes in DB for show: ${showEpisodeCount[0]?.n ?? 0}`);
  console.log(`Junction rows — characters: ${await junctionCount(workCharacters)}`);
  console.log(`Junction rows — factions:   ${await junctionCount(workFactions)}`);
  console.log(`Junction rows — locations:  ${await junctionCount(workLocations)}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[apply-podcast] failed:", err);
    process.exit(1);
  });
