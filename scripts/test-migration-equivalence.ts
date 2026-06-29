/**
 * test-migration-equivalence.ts — Brief 171 Teil B.
 *
 * DB-free unit + integration coverage for the per-book migration:
 *   - the three validation modes (additive / migration-equivalence / post-retirement)
 *     in `findCorpusCollisions` + `effectiveMaxSuffix`;
 *   - converter roundtrip EQUIVALENCE — `buildBookFile` → projection → `computeBookRows`
 *     deep-equals the legacy `computeBookRows`, incl. the override-slug rule and
 *     series parity (the 8 SERIES_BY_EXTERNAL_ID ids vs everything-else-null);
 *   - the FULL committed-corpus projection diff is EMPTY (the retirement gate),
 *     via the harness `runProjectionDiff`;
 *   - the harness prod-refusal guard `assertDisposableTarget`.
 *
 * DB-free by design (same pattern as test-apply-book.ts): a STUB DATABASE_URL is
 * set before the dynamic import of the `@/db/client`-coupled `book-apply-shared`,
 * and nothing here runs a query (computeBookRows + the skip loaders read JSON only).
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  buildBookFile,
} from "./migrate-corpus-to-books";
import {
  effectiveMaxSuffix,
  findCorpusCollisions,
  projectToOverrideBook,
  projectToRosterBook,
  seriesAnchorOf,
  type BookFileV1,
  type LoadedBookFile,
} from "./book-file";
import { seriesAnchorFor } from "./legacy-corpus-projection";
import {
  assertDisposableTarget,
  isClean,
  runProjectionDiff,
} from "./equivalence-diff";
import type {
  LegacyBookSource,
} from "./legacy-corpus-projection";
import type { OverrideBook, OverrideCuration, RosterBook } from "./book-apply-shared";

let pass = 0;
let fail = 0;
function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`ok - ${name}`);
      pass += 1;
    })
    .catch((e) => {
      console.error(`not ok - ${name}`);
      console.error(`  ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
      fail += 1;
    });
}

function stable(v: unknown): string {
  const sort = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.map(sort);
    if (x && typeof x === "object") {
      const o: Record<string, unknown> = {};
      for (const k of Object.keys(x as Record<string, unknown>).sort()) o[k] = sort((x as Record<string, unknown>)[k]);
      return o;
    }
    return x;
  };
  return JSON.stringify(sort(v));
}

// --- fixtures ---------------------------------------------------------------

function rosterBook(over: Partial<RosterBook> = {}): RosterBook {
  return {
    externalBookId: "W40K-0700",
    slug: "the-test-book",
    title: "The Test Book",
    authors: ["Dan Abnett"],
    editors: [],
    editorialNote: null,
    releaseYear: 2020,
    format: "novel",
    seriesHint: "Some Series Hint",
    sourceUrl: "https://example.com/x",
    notes: null,
    sourceRow: 123,
    ...over,
  };
}

function curation(over: Partial<OverrideCuration> = {}): OverrideCuration {
  return {
    synopsis: "An in-universe synopsis with no banned forward language.",
    facetIds: ["book", "en"],
    factions: [],
    locations: [],
    characters: [],
    flags: [],
    ...over,
  };
}

function overrideBook(externalBookId: string, slug: string, c: OverrideCuration = curation()): OverrideBook {
  return { externalBookId, slug, overrides: c };
}

function loaded(book: BookFileV1): LoadedBookFile {
  return { filename: `${book.slug}.json`, book };
}

function bookFileFor(roster: RosterBook, override: OverrideBook, ext?: LegacyBookSource): BookFileV1 {
  return buildBookFile(roster, override, ext, []);
}

async function main(): Promise<void> {
  process.env.DATABASE_URL ??= "postgres://stub:stub@127.0.0.1:5432/stub";
  const { computeBookRows, loadSkipContext, loadLocationSkipContext } = await import("./book-apply-shared");
  const skipCtx = await loadSkipContext();
  const locCtx = await loadLocationSkipContext();

  // ---- validation modes: findCorpusCollisions -----------------------------
  await check("additive mode flags a folder book mirroring a roster id/slug (cross-source)", () => {
    const folder = [loaded(bookFileFor(rosterBook(), overrideBook("W40K-0700", "the-test-book")))];
    const roster = [{ externalBookId: "W40K-0700", slug: "the-test-book" }];
    const issues = findCorpusCollisions(folder, roster, "additive");
    assert.ok(issues.length >= 1, "additive must flag the cross-source mirror");
  });

  await check("migration-equivalence + post-retirement do NOT flag the cross-source mirror", () => {
    const folder = [loaded(bookFileFor(rosterBook(), overrideBook("W40K-0700", "the-test-book")))];
    const roster = [{ externalBookId: "W40K-0700", slug: "the-test-book" }];
    assert.equal(findCorpusCollisions(folder, roster, "migration-equivalence").length, 0);
    assert.equal(findCorpusCollisions(folder, roster, "post-retirement").length, 0);
  });

  await check("intra-folder duplicate id/slug is flagged in EVERY mode", () => {
    const a = loaded(bookFileFor(rosterBook(), overrideBook("W40K-0700", "the-test-book")));
    const b = loaded(bookFileFor(rosterBook(), overrideBook("W40K-0700", "the-test-book")));
    for (const mode of ["additive", "migration-equivalence", "post-retirement"] as const) {
      const issues = findCorpusCollisions([a, b], [], mode);
      assert.ok(issues.length >= 1, `intra-folder dup must be flagged in ${mode}`);
    }
  });

  // ---- validation modes: effectiveMaxSuffix -------------------------------
  await check("effectiveMaxSuffix: post-retirement is folder-only; additive includes the roster", () => {
    const folder = [loaded(bookFileFor(rosterBook({ externalBookId: "W40K-0100" }), overrideBook("W40K-0100", "the-test-book")))];
    const roster = [{ externalBookId: "W40K-0599", slug: "legacy-high" }];
    assert.equal(effectiveMaxSuffix(roster, folder, "post-retirement").get("W40K"), 100, "folder-only");
    assert.equal(effectiveMaxSuffix(roster, folder, "additive").get("W40K"), 599, "roster wins in additive");
    assert.equal(effectiveMaxSuffix(roster, folder, "migration-equivalence").get("W40K"), 599, "roster counted in migration");
  });

  // ---- converter roundtrip equivalence ------------------------------------
  const roundtrip = (r: RosterBook, o: OverrideBook, ext?: LegacyBookSource): void => {
    const file = bookFileFor(r, o, ext);
    const legacy = computeBookRows(o, r, seriesAnchorFor(r.externalBookId), skipCtx, locCtx);
    const perBook = computeBookRows(
      projectToOverrideBook(file),
      projectToRosterBook(file),
      seriesAnchorOf(file),
      skipCtx,
      locCtx,
    );
    assert.equal(stable(perBook), stable(legacy), `computeBookRows must match for ${r.externalBookId}`);
  };

  await check("roundtrip: a plain non-series book is equivalence-preserving", () => {
    roundtrip(rosterBook(), overrideBook("W40K-0700", "the-test-book"));
  });

  await check("roundtrip: series parity — W40K-0001 gets series=eisenhorn idx 1", () => {
    const r = rosterBook({ externalBookId: "W40K-0001", slug: "xenos", title: "Xenos" });
    const file = bookFileFor(r, overrideBook("W40K-0001", "xenos"));
    assert.equal(file.series, "eisenhorn");
    assert.equal(file.seriesIndex, 1);
    roundtrip(r, overrideBook("W40K-0001", "xenos"));
  });

  await check("roundtrip: series parity — a non-anchor book stays series=null despite a seriesHint", () => {
    const r = rosterBook({ externalBookId: "W40K-0700", seriesHint: "Looks Like A Series" });
    const file = bookFileFor(r, overrideBook("W40K-0700", "the-test-book"));
    assert.equal(file.series, null, "must NOT derive series from seriesHint");
    assert.equal(file.seriesIndex, null);
    assert.equal(seriesAnchorFor("W40K-0700"), null);
    roundtrip(r, overrideBook("W40K-0700", "the-test-book"));
  });

  await check("roundtrip: override-slug wins — works.slug uses the override slug, not the roster slug", () => {
    // Legacy writes works.slug = override.slug; the converter must use it too.
    const r = rosterBook({ externalBookId: "W40K-0259", slug: "the-rose-in-anger" });
    const o = overrideBook("W40K-0259", "the-rose-in-the-anger");
    const file = bookFileFor(r, o);
    assert.equal(file.slug, "the-rose-in-the-anger", "file slug = override slug");
    const perBook = computeBookRows(projectToOverrideBook(file), projectToRosterBook(file), null, skipCtx, locCtx);
    assert.equal(perBook.works.slug, "the-rose-in-the-anger");
    roundtrip(r, o);
  });

  await check("roundtrip: extension provenance flows into source; curation is verbatim", () => {
    const ext: LegacyBookSource = { kind: "track_of_words", url: "https://tow.example", confidence: 0.6 };
    const c = curation({
      rating: {
        status: "rated",
        source: "goodreads",
        value: 4.1,
        count: 99,
        evidenceUrl: "https://www.goodreads.com/book/show/1-the-test-book",
      } as never,
    });
    const r = rosterBook();
    const o = overrideBook("W40K-0700", "the-test-book", c);
    const file = bookFileFor(r, o, ext);
    assert.equal(file.source.kind, "track_of_words");
    assert.equal(file.source.confidence, 0.6);
    assert.equal(stable(file.curation), stable(c), "curation copied verbatim");
    roundtrip(r, o, ext);
  });

  // ---- the FULL committed-corpus projection diff is empty (the GATE) -------
  await check("FULL projection diff over the committed corpus is EMPTY (retirement gate)", async () => {
    const result = await runProjectionDiff();
    assert.ok(result.total > 0, "the corpus is non-empty");
    assert.ok(isClean(result), `gate must be clean; rowDeltas=${result.rowDeltas.length} missing=${result.missingPerBook.length} extra=${result.extraPerBook.length} collOnlyLegacy=${result.collectionsOnlyInLegacy.length} collOnlyPerBook=${result.collectionsOnlyInPerBook.length}`);
  });

  // ---- harness prod-refusal guard -----------------------------------------
  await check("assertDisposableTarget refuses a managed/Prod-looking DATABASE_URL", () => {
    const saved = process.env.DATABASE_URL;
    const savedFlag = process.env.EQUIV_DISPOSABLE_DB_OK;
    try {
      delete process.env.EQUIV_DISPOSABLE_DB_OK;
      process.env.DATABASE_URL = "postgres://u:p@db.abcd.supabase.co:6543/postgres";
      assert.throws(() => assertDisposableTarget(), /refusing to snapshot|Prod/i);
      // explicit waiver bypasses the refusal
      process.env.EQUIV_DISPOSABLE_DB_OK = "1";
      assert.doesNotThrow(() => assertDisposableTarget());
      // a local disposable URL is allowed without the flag
      delete process.env.EQUIV_DISPOSABLE_DB_OK;
      process.env.DATABASE_URL = "postgres://u:p@127.0.0.1:5499/scratch";
      assert.doesNotThrow(() => assertDisposableTarget());
    } finally {
      process.env.DATABASE_URL = saved;
      if (savedFlag === undefined) delete process.env.EQUIV_DISPOSABLE_DB_OK;
      else process.env.EQUIV_DISPOSABLE_DB_OK = savedFlag;
    }
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
}

main().catch((err: unknown) => {
  console.error("test-migration-equivalence failed:", err);
  process.exit(1);
});
