/**
 * Slug generation — single source of truth shared by the seed script and the
 * ingestion pipeline. Both must produce identical slugs for the same title so
 * that comparator slug-matches against `works.slug` are exact.
 *
 * Originally inlined in `scripts/seed.ts`; extracted in Phase 3a so the
 * Wikipedia-discovery + Lexicanum-crawler pipeline can reuse it.
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
