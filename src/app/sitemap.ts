/**
 * sitemap.xml (Launch S5) — the URL-matrix A.3 contract, generated AT BUILD
 * TIME from the committed snapshot, never from the live DB. That is the E4
 * release model: every content release is a snapshot-PR deploy, so the
 * sitemap can never drift ahead of (or behind) the deployed catalogue.
 *
 * In the sitemap: the static tool/legal routes, the /ask/faction drilldown
 * nodes (curated "where to start with X" long tail), the podcast shows
 * (episodes stay `#ep-…` fragments, never URLs), every book detail and every
 * entity detail. NOT in the sitemap: admin/auth/machine paths (noindex, A.3),
 * filter/query views (canonical points at their base document), modal
 * intercepts (no own URLs), absorbed primarch twins (redirect to the merged
 * entry).
 *
 * No `lastModified`: the catalogue carries no reliable per-URL change date,
 * and a fabricated one is worse than none.
 */
import type { MetadataRoute } from "next";
import { listEntityIds } from "@/lib/entity/loader";
import { TYPE_TO_ROUTE, type EntityType } from "@/lib/entity/types";
import { ABSORBED_PRIMARCH_IDS } from "@/lib/compendium/primarchs";
import { COMPENDIUM_CATEGORIES } from "@/lib/compendium/categories";
import { FACTION_STARTER_NODES } from "@/lib/ask/faction-starters";
import { loadPodcastIndex } from "@/app/archive/podcasts/loader";
import { readSnapshotArtifact } from "@/lib/snapshot/build-data";
import { siteOrigin } from "@/lib/site-url";

const ENTITY_TYPES: readonly EntityType[] = [
  "character",
  "faction",
  "location",
  "person",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const paths: string[] = [];

  // Static surfaces (A.3 rows marked "ja / self").
  paths.push(
    "/",
    "/archive",
    "/archive/podcasts",
    "/timeline",
    "/now",
    "/map",
    "/ask",
    "/artwork",
    "/imprint",
    "/privacy",
    "/compendium",
  );
  for (const c of COMPENDIUM_CATEGORIES) {
    paths.push(`/compendium/${c.slug}`);
  }

  // /ask/faction drilldown — fully static committed JSON; same node walk as
  // the route's generateStaticParams.
  paths.push("/ask/faction");
  for (const node of FACTION_STARTER_NODES) {
    paths.push(`/ask/faction/${node.slug}`);
    for (const child of node.children ?? []) {
      paths.push(`/ask/faction/${node.slug}/${child.slug}`);
    }
  }

  // Podcast shows — snapshot-fed at build via the loader's own phase switch.
  for (const show of await loadPodcastIndex()) {
    paths.push(`/archive/podcasts/${show.slug}`);
  }

  // Every book detail (~900) — the S4b `book-slugs.json` artifact exists for
  // exactly this consumer.
  for (const slug of readSnapshotArtifact<string[]>("bookSlugs")) {
    paths.push(`/book/${slug}`);
  }

  // Every entity detail (~1300). Absorbed primarch twins redirect to their
  // merged entry and must not be listed.
  const absorbed = new Set<string>(ABSORBED_PRIMARCH_IDS);
  for (const type of ENTITY_TYPES) {
    const ids = await listEntityIds(type);
    for (const id of ids) {
      if (type === "character" && absorbed.has(id)) continue;
      paths.push(`${TYPE_TO_ROUTE[type]}/${id}`);
    }
  }

  return paths.map((path) => ({ url: `${origin}${path}` }));
}
