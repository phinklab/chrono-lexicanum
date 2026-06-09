/**
 * Brief 133 — book-identity firewall. The diff must flag genuinely-new releases
 * WITHOUT ever marking one of the existing 859 as "new" (reprints, omnibus
 * re-titles, anthology re-credits). The key reuses the SAME normalization the
 * roster import used — `slugify` for titles, `slugifyPerson` for authors — so a
 * re-listed existing book keys to the identical string.
 */
import { slugifyPerson } from "@/lib/seed/persons";
import { slugify } from "@/lib/slug";

import type { RosterBook, RosterFile } from "../seed-data/types";
import type { BookMatchVerdict, CandidateBook } from "./types";

/**
 * Author component of the identity key. Anthologies/omnibuses key on the literal
 * `"various"` sentinel — NEVER on a shifting contributor list (the tracker rarely
 * names every contributor and reissues re-credit). Named authors are person-
 * slugged and sorted so "A & B" == "B & A" (order-independent, multi-author safe).
 */
export function authorKey(authors: string[], editorialNote: "various" | null): string {
  if (editorialNote === "various") return "various";
  const slugs = authors.map(slugifyPerson).filter((s) => s.length > 0);
  if (slugs.length === 0) return "";
  return [...slugs].sort().join("+");
}

/** Year component — `"?"` when unknown so a year-relaxed match can still fire. */
export function yearBucket(year: number | null): string {
  return year === null ? "?" : String(year);
}

/** `slugify(title) | authorKey | yearBucket` — the strict identity key. */
export function bookIdentityKey(
  title: string,
  authors: string[],
  editorialNote: "various" | null,
  year: number | null,
): string {
  return `${slugify(title)}|${authorKey(authors, editorialNote)}|${yearBucket(year)}`;
}

/** Roster lookup index — three tiers of progressively-looser matching. */
export interface RosterIndex {
  /** Strict `title|author|year` → book. */
  byIdentityKey: Map<string, RosterBook>;
  /** Year-relaxed `title|author|?` → book (catches reprints + sheet/roster year drift). */
  byRelaxedKey: Map<string, RosterBook>;
  /** `slugify(title)` → books (the omnibus/re-title collision tier). */
  byTitleSlug: Map<string, RosterBook[]>;
}

/**
 * Index the committed roster for diffing. First-writer-wins on the key maps (the
 * roster is already de-duplicated; a defensive guard against any future dupe).
 */
export function buildRosterIndex(roster: RosterFile): RosterIndex {
  const byIdentityKey = new Map<string, RosterBook>();
  const byRelaxedKey = new Map<string, RosterBook>();
  const byTitleSlug = new Map<string, RosterBook[]>();
  for (const book of roster.books) {
    const strict = bookIdentityKey(book.title, book.authors, book.editorialNote, book.releaseYear);
    const relaxed = bookIdentityKey(book.title, book.authors, book.editorialNote, null);
    if (!byIdentityKey.has(strict)) byIdentityKey.set(strict, book);
    if (!byRelaxedKey.has(relaxed)) byRelaxedKey.set(relaxed, book);
    const titleSlug = slugify(book.title);
    const bucket = byTitleSlug.get(titleSlug);
    if (bucket) bucket.push(book);
    else byTitleSlug.set(titleSlug, [book]);
  }
  return { byIdentityKey, byRelaxedKey, byTitleSlug };
}

/**
 * Classify a candidate against the roster:
 *   1. strict key hit       → exact (we already have it)
 *   2. year-relaxed key hit → exact (reprint / sheet-vs-roster year drift)
 *   3. title-slug hit       → title-collision (omnibus/re-title — human review)
 *   4. otherwise            → new
 */
export function classifyCandidate(candidate: CandidateBook, index: RosterIndex): BookMatchVerdict {
  if (index.byIdentityKey.has(candidate.identityKey)) return { kind: "exact" };
  const relaxed = bookIdentityKey(candidate.title, candidate.authors, candidate.editorialNote, null);
  if (index.byRelaxedKey.has(relaxed)) return { kind: "exact" };
  const collisions = index.byTitleSlug.get(candidate.titleSlug);
  if (collisions && collisions.length > 0) {
    const first = collisions[0];
    return { kind: "title-collision", rosterId: first.externalBookId, rosterTitle: first.title };
  }
  return { kind: "new" };
}
