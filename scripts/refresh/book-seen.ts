/**
 * Book backlog cursor — the "seen, decision still open" state that sits between
 * the permanent ignore-list (`book-ignore.ts`) and promotion into the roster.
 *
 * `ingest/refresh/book-seen.json` records book TITLE-SLUGS the maintainer has
 * already seen in an earlier weekly proposal without deciding yet. The weekly
 * book diff still detects these, but partitions them into the `pending` buckets
 * instead of `new` — they show as a collapsed backlog in the report and never
 * (re)open the rolling PR. The set advances ONLY on an explicit
 * `npm run refresh:mark-reviewed -- --books` (never on a plain `refresh:check`)
 * — the same explicit-cursor semantics as the per-show podcast cursor
 * (`curation-state.ts`).
 *
 * Keyed on TITLE-SLUG, NOT the proposed `W40K-####` id: those ids are
 * reallocated from the roster high-water mark on every run and shift the moment
 * any book is promoted; the title-slug is stable and is the very key the
 * collision detector (`identity.ts`) already matches on (same reasoning as
 * `book-ignore.ts`).
 *
 * Pure except `loadBookSeen` (one fs read); the rest unit-tests offline.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { slugify } from "@/lib/slug";

export interface BookSeenEntry {
  /** The seen book's display title (audit / human-readable). */
  title: string;
  /** ISO week (`YYYY-Www`) of the proposal it was first seen in. */
  firstSeen: string;
}

export interface BookSeenState {
  /** title-slug → entry. The slug is `slugify(title)` — the diff's match key. */
  books: Record<string, BookSeenEntry>;
}

export const BOOK_SEEN_PATH = join(process.cwd(), "ingest", "refresh", "book-seen.json");

const ISO_WEEK_RE = /^\d{4}-W\d{2}$/;

export function emptyBookSeen(): BookSeenState {
  return { books: {} };
}

/**
 * Validate + narrow raw JSON. Throws on a non-object, a malformed entry, a key
 * that is NOT `slugify(title)` (a drifted key would silently never match — the
 * book would keep surfacing as "new" despite being marked seen), or a
 * `firstSeen` that is not an ISO week. Failing loud at load makes a hand-edited
 * file safe.
 */
export function parseBookSeen(raw: unknown): BookSeenState {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("book-seen: top-level must be an object");
  }
  const booksRaw = (raw as { books?: unknown }).books;
  if (booksRaw === undefined || booksRaw === null) return { books: {} };
  if (typeof booksRaw !== "object" || Array.isArray(booksRaw)) {
    throw new Error("book-seen.books: must be an object of slug → { title, firstSeen }");
  }
  const books: Record<string, BookSeenEntry> = {};
  for (const [slug, v] of Object.entries(booksRaw as Record<string, unknown>)) {
    if (v === null || typeof v !== "object" || Array.isArray(v)) {
      throw new Error(`book-seen.books.${slug}: must be an object { title, firstSeen }`);
    }
    const title = (v as { title?: unknown }).title;
    const firstSeen = (v as { firstSeen?: unknown }).firstSeen;
    if (typeof title !== "string" || title.trim() === "") {
      throw new Error(`book-seen.books.${slug}.title: required non-empty string`);
    }
    if (typeof firstSeen !== "string" || !ISO_WEEK_RE.test(firstSeen)) {
      throw new Error(`book-seen.books.${slug}.firstSeen: required ISO week ("YYYY-Www")`);
    }
    const expected = slugify(title);
    if (slug !== expected) {
      throw new Error(
        `book-seen.books.${slug}: key must equal slugify(title) ("${expected}") — ` +
          "the diff matches on slugify(candidate.title), so a drifted key never fires",
      );
    }
    books[slug] = { title, firstSeen };
  }
  return { books };
}

/** Read the committed seen-set; a MISSING file is the empty set (never an error). */
export function loadBookSeen(path: string = BOOK_SEEN_PATH): BookSeenState {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return emptyBookSeen();
  }
  return parseBookSeen(JSON.parse(text));
}

/** The set of seen title-slugs — what the book diff partitions on. */
export function seenSlugSet(state: BookSeenState): Set<string> {
  return new Set(Object.keys(state.books));
}

/**
 * Mark titles as seen (pure — caller serializes/writes). The slug is derived
 * from the title, so callers never hand-compute keys; an empty-slug title is
 * skipped. FIRST seen wins: re-marking an already-seen slug keeps its original
 * entry, so `firstSeen` stays honest across repeated `--books` runs.
 */
export function markSeenTitles(
  state: BookSeenState,
  entries: readonly { title: string; firstSeen: string }[],
): BookSeenState {
  const books = { ...state.books };
  for (const e of entries) {
    const slug = slugify(e.title);
    if (slug === "" || slug in books) continue;
    books[slug] = { title: e.title, firstSeen: e.firstSeen };
  }
  return { books };
}

/** Deterministic JSON (slugs sorted) + trailing newline — a stable committed file. */
export function serializeBookSeen(state: BookSeenState): string {
  const sorted: Record<string, BookSeenEntry> = {};
  for (const slug of Object.keys(state.books).sort()) sorted[slug] = state.books[slug];
  return `${JSON.stringify({ books: sorted }, null, 2)}\n`;
}
