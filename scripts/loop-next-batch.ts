/**
 * loop-next-batch.ts — read-only detection helper for the SSOT loop (Brief 088).
 *
 * One loop iteration is mechanically trivial: figure out which 10-book batch is
 * next, research it, write one override JSON, append a log block, commit. The
 * "which batch is next" part used to be re-derived inline every iteration, which
 * pulled `book-roster.json` (≈420 KB) and the `manual-overrides-ssot-*.json`
 * files into the subsession's context. This helper does that derivation once, as
 * a committed script, and emits a compact JSON on stdout. A loop iteration reads
 * ONLY this script's output — the roster and override files never enter context.
 *
 * Pure core + thin CLI (same shape as scripts/apply-override-skip.ts):
 *   - `decideNextBatch(input)` is pure (no FS/DB) and is the unit-test seam.
 *   - `main()` does the file I/O (roster + seed dir), then calls the core.
 * Read-only, idempotent, re-runnable: no writes, no git, no DB.
 *
 * Detection mirrors Brief 061 § Notes: W40K domain first (ids `W40K-NNNN`,
 * 565 books), then HH (`HH-NNNN`, 294 books); the next batch number is
 * `max(existing batch number per domain) + 1`; the slice is the next 10 (or the
 * 5/4-book restbatch at a domain's end). Cumulative book count is summed from
 * the override files' `books.length` (informational; the SSOT-Loop no longer
 * pauses for the resolver — see Brief 094 which decoupled the two loops).
 *
 * Run:  npm run loop:next        (optional: --roster-path / --seed-dir)
 * Test: npm run test:loop-next
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Mirror of the canonical RosterBook shape (scripts/apply-override.ts). */
export interface RosterBook {
  externalBookId: string;
  slug: string;
  title: string;
  authors: string[];
  editors: string[];
  editorialNote: string | null;
  releaseYear: number | null;
  format: string | null;
  seriesHint: string | null;
  sourceUrl: string | null;
  notes: string | null;
  sourceRow: number;
}

/** The per-book fields a loop iteration needs to research + write an override. */
export interface RosterSliceBook {
  externalBookId: string;
  slug: string;
  title: string;
  format: string | null;
  authors: string[];
  seriesHint: string | null;
  releaseYear: number | null;
}

export interface DomainCount {
  /** highest existing batch number for the domain (0 if none). */
  max: number;
  /** sum of `books.length` over the domain's override files. */
  books: number;
}

export interface DecideInput {
  w40k: DomainCount;
  hh: DomainCount;
  /** roster filtered to W40K books, in roster order. */
  w40kBooks: RosterBook[];
  /** roster filtered to HH books, in roster order. */
  hhBooks: RosterBook[];
}

export interface BatchRef {
  domain: "w40k" | "hh";
  number: number;
  id: string;
}

export interface Decision {
  loopComplete: boolean;
  cumulativeBefore: number;
  /** the genuine next batch; null only when loopComplete. */
  batch: BatchRef | null;
  /** the next 10 / 5 / 4 books; empty only when loopComplete. */
  rosterSlice: RosterSliceBook[];
  note: string;
}

// ---------------------------------------------------------------------------
// Pure: next-batch decision
// ---------------------------------------------------------------------------

const pad3 = (n: number): string => String(n).padStart(3, "0");

function projectSlice(books: RosterBook[]): RosterSliceBook[] {
  return books.map((b) => ({
    externalBookId: b.externalBookId,
    slug: b.slug,
    title: b.title,
    format: b.format,
    authors: b.authors,
    seriesHint: b.seriesHint,
    releaseYear: b.releaseYear,
  }));
}

/**
 * Pure decision. `batch`/`rosterSlice` describe the genuine next unit of work;
 * `loopComplete` forces an empty batch. The SSOT-Loop runs straight through to
 * loopComplete — Brief 094 removed the resolver-pause cadence that used to gate
 * iteration here, decoupling the SSOT-Loop from the now-headless resolver loop.
 */
export function decideNextBatch(input: DecideInput): Decision {
  const { w40k, hh, w40kBooks, hhBooks } = input;

  const cumulativeBefore = w40k.books + hh.books;

  // W40K domain first (Brief 061 § Constraints).
  if (w40k.max * 10 < w40kBooks.length) {
    const start = w40k.max * 10;
    const end = Math.min(start + 10, w40kBooks.length);
    const number = w40k.max + 1;
    const id = `ssot-w40k-${pad3(number)}`;
    return {
      loopComplete: false,
      cumulativeBefore,
      batch: { domain: "w40k", number, id },
      rosterSlice: projectSlice(w40kBooks.slice(start, end)),
      note: `next batch: ${id}`,
    };
  }

  // Then HH domain.
  if (hh.max * 10 < hhBooks.length) {
    const start = hh.max * 10;
    const end = Math.min(start + 10, hhBooks.length);
    const number = hh.max + 1;
    const id = `ssot-hh-${pad3(number)}`;
    return {
      loopComplete: false,
      cumulativeBefore,
      batch: { domain: "hh", number, id },
      rosterSlice: projectSlice(hhBooks.slice(start, end)),
      note: `next batch: ${id}`,
    };
  }

  // Both domains fully covered.
  return {
    loopComplete: true,
    cumulativeBefore,
    batch: null,
    rosterSlice: [],
    note: "loop complete: all roster books covered by override files",
  };
}

// ---------------------------------------------------------------------------
// I/O layer (main only — never reached by the test)
// ---------------------------------------------------------------------------

interface RawRosterFile {
  books?: RosterBook[];
}

interface RawOverrideFile {
  books?: unknown[];
}

interface LoadPaths {
  rosterPath: string;
  seedDir: string;
}

function parseArgs(argv: string[]): LoadPaths {
  const repo = process.cwd();
  const paths: LoadPaths = {
    rosterPath: path.join(repo, "scripts", "seed-data", "book-roster.json"),
    seedDir: path.join(repo, "scripts", "seed-data"),
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--roster-path") {
      i += 1;
      paths.rosterPath = argv[i];
    } else if (a === "--seed-dir") {
      i += 1;
      paths.seedDir = argv[i];
    } else {
      throw new Error(`unknown arg: ${a} (expected --roster-path/--seed-dir)`);
    }
  }
  return paths;
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function loadInputs(p: LoadPaths): DecideInput {
  const roster = readJson<RawRosterFile>(p.rosterPath);
  const books: RosterBook[] = Array.isArray(roster.books) ? roster.books : [];
  const w40kBooks = books.filter((b) => b.externalBookId.startsWith("W40K-"));
  const hhBooks = books.filter((b) => b.externalBookId.startsWith("HH-"));

  const w40k: DomainCount = { max: 0, books: 0 };
  const hh: DomainCount = { max: 0, books: 0 };
  const fileRe = /^manual-overrides-ssot-(w40k|hh)-(\d+)\.json$/;
  for (const name of fs.readdirSync(p.seedDir)) {
    const m = fileRe.exec(name);
    if (!m) continue;
    const bucket = m[1] === "w40k" ? w40k : hh;
    const num = Number(m[2]);
    const data = readJson<RawOverrideFile>(path.join(p.seedDir, name));
    if (!Array.isArray(data.books)) {
      throw new Error(`${name}: books is not an array`);
    }
    if (num > bucket.max) bucket.max = num;
    bucket.books += data.books.length;
  }

  return { w40k, hh, w40kBooks, hhBooks };
}

function main(): void {
  const result = decideNextBatch(loadInputs(parseArgs(process.argv)));
  console.log(JSON.stringify(result, null, 2));
}

/**
 * True only when this file is the directly-invoked entry (tsx scripts/loop-next-batch.ts),
 * false when imported (the test imports `decideNextBatch`). Compares filesystem
 * realpaths so 8.3 short names / drive-letter case / relocated worktrees on
 * Windows don't cause a false negative; never compares file:// URL strings
 * (percent-encoding would mismatch).
 */
function isMain(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return fs.realpathSync(entry) === fs.realpathSync(self);
  } catch {
    try {
      return path.resolve(entry).toLowerCase() === path.resolve(self).toLowerCase();
    } catch {
      return false;
    }
  }
}

if (isMain()) main();
