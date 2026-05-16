/**
 * Smoke probe for Brief 076 Phase 4 — junction counts + collection-membership
 * for a fixed set of detail-page slugs. Mix of 074-regression slugs and 016..020
 * new wave slugs.
 */
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  works,
  workFactions,
  workLocations,
  workCharacters,
  workCollections,
} from "@/db/schema";

const SLUGS = [
  // Regression slugs (074 baseline)
  "the-anarch",
  "inquisitor-draco",
  "the-green-tide",
  // New wave 016..020 slugs
  "space-wolf",
  "krakenblood",
  "lasgun-wedding",
  "wanted-dead",
  "13th-legion",
  "armageddon-saint",
  "soul-drinker",
  "phalanx",
  "crossfire",
  "legacy",
] as const;

interface Row {
  slug: string;
  externalBookId: string;
  factions: number;
  locations: number;
  characters: number;
  containedIn: number;
}

async function main(): Promise<void> {
  const rows = await db
    .select({ id: works.id, slug: works.slug, externalBookId: works.externalBookId })
    .from(works)
    .where(inArray(works.slug, SLUGS as unknown as string[]));

  const out: Row[] = [];
  for (const r of rows) {
    const [wf] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(workFactions)
      .where(eq(workFactions.workId, r.id))) as Array<{ n: number }>;
    const [wl] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(workLocations)
      .where(eq(workLocations.workId, r.id))) as Array<{ n: number }>;
    const [wc] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(workCharacters)
      .where(eq(workCharacters.workId, r.id))) as Array<{ n: number }>;
    const [wcol] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(workCollections)
      .where(eq(workCollections.contentWorkId, r.id))) as Array<{ n: number }>;

    out.push({
      slug: r.slug,
      externalBookId: r.externalBookId,
      factions: wf?.n ?? 0,
      locations: wl?.n ?? 0,
      characters: wc?.n ?? 0,
      containedIn: wcol?.n ?? 0,
    });
  }

  const byOrder = new Map<string, number>();
  SLUGS.forEach((slug, i) => byOrder.set(slug, i));
  out.sort((a, b) => (byOrder.get(a.slug) ?? 99) - (byOrder.get(b.slug) ?? 99));

  console.log("slug                                          extId       f   l   c   in-coll");
  console.log("-".repeat(85));
  for (const r of out) {
    console.log(
      `${r.slug.padEnd(45)} ${r.externalBookId.padEnd(11)} ${String(r.factions).padStart(3)} ${String(r.locations).padStart(3)} ${String(r.characters).padStart(3)} ${String(r.containedIn).padStart(8)}`,
    );
  }

  // Omnibus collection spotcheck
  console.log("\nOmnibus collection spotcheck (work_collections rows):");
  const omniSlugs = [
    "the-last-chancers-omnibus",
    "the-gothic-war-omnibus",
    "the-soul-drinkers-omnibus",
    "soul-drinkers-annihilation-second-omnibus",
    "the-space-wolf-omnibus",
    "space-wolf-the-second-omnibus",
    "the-inquisition-war-omnibus",
  ];
  for (const slug of omniSlugs) {
    const [w] = (await db
      .select({ id: works.id, slug: works.slug, externalBookId: works.externalBookId })
      .from(works)
      .where(eq(works.slug, slug))) as Array<{ id: string; slug: string; externalBookId: string }>;
    if (!w) {
      console.log(`  ${slug.padEnd(45)} MISSING`);
      continue;
    }
    const [{ n }] = (await db
      .select({ n: sql<number>`count(*)::int` })
      .from(workCollections)
      .where(eq(workCollections.collectionWorkId, w.id))) as Array<{ n: number }>;
    console.log(`  ${w.slug.padEnd(45)} ${w.externalBookId.padEnd(11)} contains=${n}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
