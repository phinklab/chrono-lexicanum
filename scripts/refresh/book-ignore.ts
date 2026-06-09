/**
 * Brief 133 follow-up — the book "cutoff": a maintainer ignore-list, the book
 * analog of the per-show podcast curation cursor (`curation-state.ts`).
 *
 * `ingest/refresh/book-ignore.json` records book TITLE-SLUGS the maintainer has
 * judged "never surface again" — duplicates already in the roster under another
 * title/edition, formats we don't archive (maps, artbooks, box sets, anniversary/
 * illustrated reissues), and omnibus/collection bundles of books we already hold.
 * The weekly book diff drops any candidate whose `slugify(title)` is in this set
 * BEFORE it can land in the `new` or `needs-review` bucket, so a dismissed book is
 * not re-proposed every week — the same "I looked and skipped it sticks" guarantee
 * the podcast cursor gives, but keyed per-book instead of per-show-date.
 *
 * Keyed on TITLE-SLUG, NOT the proposed `W40K-####` id: those ids are reallocated
 * from the roster high-water mark on every run, so they shift the moment any book
 * is promoted; the title-slug is stable and is the very key the collision detector
 * (`identity.ts`) already matches on. Committed JSON (slugs sorted) so the cron and
 * the maintainer share one list.
 *
 * Pure except `loadBookIgnore` (one fs read); the rest unit-tests offline.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { slugify } from "@/lib/slug";

export interface BookIgnoreEntry {
  /** The dismissed book's display title (audit / human-readable). */
  title: string;
  /** Why it was dismissed (audit). */
  reason: string;
}

export interface BookIgnoreState {
  /** title-slug → entry. The slug is `slugify(title)` — the diff's match key. */
  books: Record<string, BookIgnoreEntry>;
}

export const BOOK_IGNORE_PATH = join(
  process.cwd(),
  "ingest",
  "refresh",
  "book-ignore.json",
);

export function emptyBookIgnore(): BookIgnoreState {
  return { books: {} };
}

/**
 * Validate + narrow raw JSON. Throws on a non-object, a malformed entry, or a key
 * that is NOT `slugify(title)` — the last check is load-bearing: the diff keys on
 * `slugify(candidate.title)`, so a drifted key would silently never match (the
 * book would keep resurfacing despite being "dismissed"). Failing loud at load
 * makes a hand-edited file safe.
 */
export function parseBookIgnore(raw: unknown): BookIgnoreState {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("book-ignore: top-level must be an object");
  }
  const booksRaw = (raw as { books?: unknown }).books;
  if (booksRaw === undefined || booksRaw === null) return { books: {} };
  if (typeof booksRaw !== "object" || Array.isArray(booksRaw)) {
    throw new Error("book-ignore.books: must be an object of slug → { title, reason }");
  }
  const books: Record<string, BookIgnoreEntry> = {};
  for (const [slug, v] of Object.entries(booksRaw as Record<string, unknown>)) {
    if (v === null || typeof v !== "object" || Array.isArray(v)) {
      throw new Error(`book-ignore.books.${slug}: must be an object { title, reason }`);
    }
    const title = (v as { title?: unknown }).title;
    const reason = (v as { reason?: unknown }).reason;
    if (typeof title !== "string" || title.trim() === "") {
      throw new Error(`book-ignore.books.${slug}.title: required non-empty string`);
    }
    if (typeof reason !== "string") {
      throw new Error(`book-ignore.books.${slug}.reason: required string`);
    }
    const expected = slugify(title);
    if (slug !== expected) {
      throw new Error(
        `book-ignore.books.${slug}: key must equal slugify(title) ("${expected}") — ` +
          "the diff matches on slugify(candidate.title), so a drifted key never fires",
      );
    }
    books[slug] = { title, reason };
  }
  return { books };
}

/** Read the committed ignore-list; a MISSING file is the empty list (never an error). */
export function loadBookIgnore(path: string = BOOK_IGNORE_PATH): BookIgnoreState {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return emptyBookIgnore();
  }
  return parseBookIgnore(JSON.parse(text));
}

/** The set of dismissed title-slugs — what the book diff checks membership against. */
export function ignoredSlugSet(state: BookIgnoreState): Set<string> {
  return new Set(Object.keys(state.books));
}

/** Is this title-slug on the ignore-list? */
export function isBookIgnored(state: BookIgnoreState, titleSlug: string): boolean {
  return Object.prototype.hasOwnProperty.call(state.books, titleSlug);
}

/**
 * Add titles to the ignore-list (pure — caller serializes/writes). The slug is
 * derived from the title, so callers never hand-compute keys; an empty-slug title
 * is skipped. Last write wins on the reason for a repeated title.
 */
export function addIgnoredTitles(
  state: BookIgnoreState,
  entries: readonly { title: string; reason: string }[],
): BookIgnoreState {
  const books = { ...state.books };
  for (const e of entries) {
    const slug = slugify(e.title);
    if (slug === "") continue;
    books[slug] = { title: e.title, reason: e.reason };
  }
  return { books };
}

/** Deterministic JSON (slugs sorted) + trailing newline — a stable committed file. */
export function serializeBookIgnore(state: BookIgnoreState): string {
  const sorted: Record<string, BookIgnoreEntry> = {};
  for (const slug of Object.keys(state.books).sort()) sorted[slug] = state.books[slug];
  return `${JSON.stringify({ books: sorted }, null, 2)}\n`;
}
