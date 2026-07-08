/**
 * Horus-Heresy book supplement for the Ask HH hard gate.
 *
 * The catalogue cannot date most books: `primaryEraId` is uniformly
 * `"time_ending"` (every one of the ~889 books) and `startY` is null for ~792
 * of them, with no setting/millennium facet. So the date-band check in
 * {@link isHeresyBook} only catches the ~23 HH books with a real M31 `startY`.
 * This committed slug list supplements that for HH books that lack a usable
 * `startY`, so a newcomer is never dropped into the Heresy. Mechanical mirror
 * of the anchor pattern: committed JSON → in-memory Set, no DB schema.
 */
import heresyJson from "../../../scripts/seed-data/ask-heresy-books.json";

function parseHeresySlugs(value: unknown): ReadonlySet<string> {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid ask-heresy-books.json: root must be an object.");
  }
  const record = value as { version?: unknown; slugs?: unknown };
  if (record.version !== 1) {
    throw new Error("Invalid ask-heresy-books.json: version must be 1.");
  }
  if (!Array.isArray(record.slugs)) {
    throw new Error("Invalid ask-heresy-books.json: slugs must be an array.");
  }
  const slugs = new Set<string>();
  for (const [index, slug] of record.slugs.entries()) {
    if (typeof slug !== "string" || slug.trim() === "") {
      throw new Error(`Invalid ask-heresy-books.json: slugs[${index}] must be a non-empty string.`);
    }
    if (slugs.has(slug)) {
      throw new Error(`Invalid ask-heresy-books.json: duplicate slug "${slug}".`);
    }
    slugs.add(slug);
  }
  return slugs;
}

/** Curated HH slugs that the date-band detector can't reach (null `startY`). */
export const HERESY_SLUGS: ReadonlySet<string> = parseHeresySlugs(heresyJson as unknown);
