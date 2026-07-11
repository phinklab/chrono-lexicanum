/**
 * Public faction-guide data layer. SERVER-ONLY (imports `@/db`).
 *
 * `/fraktionen` is a *guide* index, not lore: each faction is a doorway labelled
 * with how much of the archive sits behind it (books, podcast episodes, key
 * characters, sub-factions). We compute those four counts with grouped
 * aggregates rather than per-faction fan-out: one row per faction, one grouped
 * count over `work_factions × works.kind`, one over `characters`, one over the
 * self-parent edge. Index contract (S2, see `src/lib/db-cache.ts`): an array
 * — DB errors THROW into the caller's error boundary (this loader is only
 * reached at request time; the build reads the committed snapshot).
 */
import "server-only";
import { count, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  characters as charactersTable,
  factions as factionsTable,
  workFactions,
  works,
} from "@/db/schema";

export type Alignment = "imperium" | "chaos" | "xenos" | "neutral";

export interface FactionGuide {
  id: string;
  name: string;
  parentId: string | null;
  alignment: Alignment;
  tone: string | null;
  glyph: string | null;
  bookCount: number;
  episodeCount: number;
  characterCount: number;
  subfactionCount: number;
}

export async function loadFactionGuide(): Promise<FactionGuide[]> {
  const [facRows, workAgg, charAgg, subAgg] = await Promise.all([
    db
      .select({
        id: factionsTable.id,
        name: factionsTable.name,
        parentId: factionsTable.parentId,
        alignment: factionsTable.alignment,
        tone: factionsTable.tone,
        glyph: factionsTable.glyph,
      })
      .from(factionsTable),
    db
      .select({
        factionId: workFactions.factionId,
        kind: works.kind,
        n: count(),
      })
      .from(workFactions)
      .innerJoin(works, eq(works.id, workFactions.workId))
      .groupBy(workFactions.factionId, works.kind),
    db
      .select({ factionId: charactersTable.primaryFactionId, n: count() })
      .from(charactersTable)
      .where(isNotNull(charactersTable.primaryFactionId))
      .groupBy(charactersTable.primaryFactionId),
    db
      .select({ parentId: factionsTable.parentId, n: count() })
      .from(factionsTable)
      .where(isNotNull(factionsTable.parentId))
      .groupBy(factionsTable.parentId),
  ]);

  const books = new Map<string, number>();
  const episodes = new Map<string, number>();
  for (const r of workAgg) {
    if (!r.factionId) continue;
    const n = Number(r.n);
    if (r.kind === "book") books.set(r.factionId, n);
    else if (r.kind === "podcast_episode")
      episodes.set(r.factionId, (episodes.get(r.factionId) ?? 0) + n);
  }
  const chars = new Map<string, number>();
  for (const r of charAgg) if (r.factionId) chars.set(r.factionId, Number(r.n));
  const subs = new Map<string, number>();
  for (const r of subAgg) if (r.parentId) subs.set(r.parentId, Number(r.n));

  return facRows.map((f) => ({
    id: f.id,
    name: f.name,
    parentId: f.parentId,
    alignment: f.alignment,
    tone: f.tone,
    glyph: f.glyph,
    bookCount: books.get(f.id) ?? 0,
    episodeCount: episodes.get(f.id) ?? 0,
    characterCount: chars.get(f.id) ?? 0,
    subfactionCount: subs.get(f.id) ?? 0,
  }));
}
