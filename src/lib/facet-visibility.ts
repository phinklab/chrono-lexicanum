/**
 * Central facet-category visibility. PURE — no `@/db`, no JSX.
 *
 * Content warnings are retired from the whole UI (the data side retires
 * separately); every loader that feeds facet chips, tag rows,
 * search suggestions or audit lists filters through this ONE set, so the
 * display removal holds even while the rows still exist in Postgres.
 */

const HIDDEN_FACET_CATEGORIES: ReadonlySet<string> = new Set(["content_warning"]);

/** True when a `facet_categories.id` may reach the rendered UI. */
export function isVisibleFacetCategory(categoryId: string | null | undefined): boolean {
  return categoryId == null || !HIDDEN_FACET_CATEGORIES.has(categoryId);
}
