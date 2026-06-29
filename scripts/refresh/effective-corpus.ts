/**
 * effective-corpus.ts — Brief 170 Teil A. Make book-detection corpus-aware.
 *
 * Before Teil A the weekly refresh knew only `book-roster.json` (Legacy). Once
 * per-book SSOT files exist under `scripts/seed-data/books/`, a book promoted
 * via the per-book path (e.g. `W40K-0600`) must NOT be re-proposed as "new" and
 * must NOT have its id re-handed-out by the allocator. Both the identity index
 * (`buildRosterIndex`) and the id allocator (`makeIdAllocator`) read only
 * `roster.books`, so the minimal-surface fix is to feed them an EFFECTIVE
 * roster: Legacy books + a `RosterBook` projection of the per-book folder.
 *
 * Podcast detection is unaffected — it never reads this. A missing/empty
 * `books/` folder projects to `[]` (mirrors the `loadBookSeen`/`loadBookIgnore`
 * "missing file = empty set" convention), so behaviour is unchanged until the
 * folder is populated.
 */
import { loadBookFiles, projectToRosterBook } from "../book-file";

import type { RosterBook } from "../seed-data/types";

/**
 * Project every valid `scripts/seed-data/books/*.json` into a `RosterBook` for
 * the identity index + id allocator. Invalid files are SKIPPED here (detection
 * stays fail-soft and never throws); the hard schema gate lives in `apply:book`.
 * `dir` is injectable for tests.
 */
export function loadEffectiveCorpusBooks(dir?: string): RosterBook[] {
  const { books } = loadBookFiles(dir);
  return books.map((b) => projectToRosterBook(b.book));
}
