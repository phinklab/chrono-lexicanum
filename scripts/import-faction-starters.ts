/**
 * Convert step: read Philipp's curated "One faction, one book" Excel and produce
 * the committed `scripts/seed-data/faction-starters.json` plus a human review
 * list `scripts/seed-data/faction-starters.review.md` (Brief 166).
 *
 * Pure file I/O — NO DB access (the runtime tool is DB-free; this resolves book
 * titles ahead of build-time). Deterministic: identical (Excel + overrides +
 * corpus) → byte-identical JSON. Two sheets:
 *
 *   - `Big Faction`        : Faction | Book | Alternative          (top-level nodes)
 *   - `In-Depth Faction`   : Main faction | Subfaction | Book | Alternative (children)
 *
 * `Main faction` is forward-filled (only the first row of a group names it);
 * blank-row spacers between groups are skipped. `Book` = "look into In-Depth
 * Faction" makes a group node (no own pick). `Alternative` is comma-split into
 * extra picks. Format markers inline in the title (`(Audiodrama)`, `Series`,
 * `trilogy`, `Omnibus`, `(short story?)`) are pulled best-effort into `kind`/`note`.
 *
 * Title→book resolution is TOLERANT (normalize + fuzzy against the effective
 * per-book corpus, `scripts/seed-data/books/*.json` — Brief 176 rebind off the
 * frozen `book-roster.json`). High-confidence hits → book slug in the JSON.
 * Uncertain / not-found titles are NEVER guessed and NEVER abort the run: they
 * land in the review list for Philipp (the hand-gate), and the pick renders
 * without a link until he supplies a slug via `faction-starters.overrides.json`.
 *
 * Fail-loud ONLY on malformed rows / header mismatch / an In-Depth `Main faction`
 * that does not match a Big-Faction node.
 *
 * Usage:
 *   npm run import:faction-starters
 *
 * Brief 166 (2026-06-26) — sessions/2026-06-26-166-arch-ask-hub-one-faction-one-book.md
 */
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";

import { readSheet } from "read-excel-file/node";

import { slugify } from "@/lib/slug";
import {
  validateFactionStarters,
  type FactionStarterKind,
  type FactionStarterNode,
  type FactionStarterPick,
  type FactionStartersFile,
} from "@/lib/ask/faction-starters-schema";
import { loadEffectiveCorpusBooks } from "./refresh/effective-corpus";

// =============================================================================
// CONSTANTS
// =============================================================================

const SOURCE_FILE = "scripts/seed-data/source/Warhammer_OFOC_SSOT.xlsx";
/** Effective per-book corpus (Brief 176) — display name for error messages. */
const CORPUS_NAME = "scripts/seed-data/books/*.json";
const OVERRIDES_FILE = "scripts/seed-data/faction-starters.overrides.json";
const OUTPUT_FILE = "scripts/seed-data/faction-starters.json";
const REVIEW_FILE = "scripts/seed-data/faction-starters.review.md";

const BIG_SHEET = "Big Faction";
const DEPTH_SHEET = "In-Depth Faction";

const BIG_HEADERS = ["Faction", "Book", "Alternative"] as const;
const DEPTH_HEADERS = ["Main faction", "Subfaction", "Book", "Alternative"] as const;

/** Big-Faction `Book` cell that means "this is a group node, see In-Depth". */
const GROUP_POINTER = "look into in-depth faction";

const SCHEMA_VERSION = 1 as const;
const DOC =
  "Faction → curated entry-point picks (Brief 166), generated VERBATIM from " +
  "Warhammer_OFOC_SSOT.xlsx (two sheets) by `npm run import:faction-starters`. " +
  "A node is a top-level faction; optional `children` are subfactions (exactly " +
  "one level). A node carries `picks`, `children`, or both; a group node carries " +
  "only `children`. Labels are NOT validated against factions.json (verbatim, " +
  "subfactions without a DB faction are allowed). `picks[0]` is primary; reshuffle " +
  "cycles in order. The `book` slug (click target /buch/{slug}) is resolved at " +
  "convert time against the per-book corpus (scripts/seed-data/books/) — " +
  "uncertain/unresolved titles carry no " +
  "`book` and are listed in faction-starters.review.md. Runtime is DB-free. " +
  "DO NOT hand-edit: re-run the convert step.";

// Resolution score bands (tuned against the real corpus — see impl report).
// Fuzzy auto-links are always re-listed in the review for a human audit, so the
// HIGH band can be tolerant enough to absorb the source's typos ("Space Wolfes
// Omnibus" → "The Space Wolf Omnibus") without silently mis-linking.
const SCORE_HIGH = 0.88; // >= and clearly ahead → auto-link (audited in review)
const SCORE_MARGIN = 0.04; // best must beat 2nd-best by this to auto-link
const SCORE_MID = 0.74; // >= → uncertain best-guess (review, no link)

/** Title-noise article tokens dropped during normalization (both sides). */
const ARTICLE_STOPWORDS: ReadonlySet<string> = new Set(["the"]);

// =============================================================================
// ISSUE COLLECTION (fail-loud — structural only)
// =============================================================================

interface Issue {
  sheet: string;
  rowIndex: number;
  message: string;
}

class IssueCollector {
  private readonly issues: Issue[] = [];
  push(issue: Issue): void {
    this.issues.push(issue);
  }
  hasIssues(): boolean {
    return this.issues.length > 0;
  }
  printAndExit(): never {
    for (const i of this.issues) {
      console.error(`[error ${i.sheet}:${i.rowIndex}] ${i.message}`);
    }
    console.error(`\n[import-faction-starters] ${this.issues.length} issue(s) — aborting.`);
    process.exit(1);
  }
}

// =============================================================================
// PURE HELPERS
// =============================================================================

function trimCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function rowIsEmpty(row: readonly unknown[]): boolean {
  return row.every((c) => trimCell(c) === "");
}

/** Comma-split an `Alternative` cell into individual raw titles. */
function splitAlternatives(cell: string): string[] {
  return cell
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Dedup-aware sibling slug from a label. */
function siblingSlug(label: string, taken: Set<string>): string {
  const base = slugify(label) || "node";
  let slug = base;
  let n = 2;
  while (taken.has(slug)) slug = `${base}-${n++}`;
  taken.add(slug);
  return slug;
}

// ---- Pick parsing: strip format markers into kind/note ----------------------

const AUDIO_DRAMA_RE = /\(\s*audio\s*-?\s*drama\s*\)/i;
const AUDIOBOOK_RE = /\(\s*audio\s*-?\s*book\s*\)/i;
const SHORT_STORY_RE = /\(\s*short\s*story\s*(\?)?\s*\)/i;

export interface ParsedPick {
  rawTitle: string;
  title: string;
  kind?: FactionStarterKind;
  note?: string;
}

/** Pull inline format markers out of a raw Excel title. */
export function parsePick(rawTitle: string): ParsedPick {
  const raw = rawTitle.trim();
  let title = raw;
  let kind: FactionStarterKind | undefined;
  let note: string | undefined;

  // Parenthetical format markers — extracted to `kind` and removed from the title.
  if (AUDIO_DRAMA_RE.test(title)) {
    kind = "audio-drama";
    title = title.replace(AUDIO_DRAMA_RE, "");
  } else if (AUDIOBOOK_RE.test(title)) {
    kind = "audiobook";
    title = title.replace(AUDIOBOOK_RE, "");
  } else {
    const ss = title.match(SHORT_STORY_RE);
    if (ss) {
      kind = "short-story";
      if (ss[1] === "?") note = "Format uncertain in the source (marked “short story?”).";
      title = title.replace(SHORT_STORY_RE, "");
    }
  }

  title = title.replace(/\s+/g, " ").trim();

  // Trailing/inline collection words — advisory hint only; kept in the title.
  if (!kind) {
    if (/\bomnibus\b/i.test(title)) kind = "omnibus";
    else if (/\btrilogy\b/i.test(title)) kind = "trilogy";
    else if (/\bseries\b/i.test(title)) kind = "series";
  }

  return { rawTitle: raw, title, kind, note };
}

// ---- Title resolution against the corpus ------------------------------------

function normalize(s: string): string {
  const base = s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Drop the article "the" — pure title noise that otherwise blocks exact
  // matches like "Lords of Silence" ↔ "The Lords of Silence". Meaningful
  // collection words (omnibus/series/trilogy) are kept.
  const tokens = base.split(" ").filter((t) => t && !ARTICLE_STOPWORDS.has(t));
  return tokens.join(" ");
}

/** Token-sorted normalized form, so word-order differences don't hurt. */
function tokenSorted(norm: string): string {
  return norm.split(" ").filter(Boolean).sort().join(" ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

function ratio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  return max === 0 ? 1 : 1 - levenshtein(a, b) / max;
}

interface CorpusEntry {
  slug: string;
  title: string;
  norm: string;
  sorted: string;
}

interface CorpusIndex {
  entries: CorpusEntry[];
  exact: Map<string, string[]>; // normalized title → slugs
  slugs: Set<string>; // every known book slug (override-target validation)
}

function buildCorpus(): CorpusIndex {
  // Effective per-book corpus (Brief 176): every committed
  // `scripts/seed-data/books/*.json`, i.e. the full migrated corpus plus any
  // book added via the additive `/add-book` path. Slugs here are the canonical
  // `works.slug` values (override slugs), so /buch/{slug} links cannot 404.
  const books = loadEffectiveCorpusBooks();
  const entries: CorpusEntry[] = [];
  const exact = new Map<string, string[]>();
  const slugs = new Set<string>();
  for (const b of books) {
    const norm = normalize(b.title);
    const entry: CorpusEntry = { slug: b.slug, title: b.title, norm, sorted: tokenSorted(norm) };
    entries.push(entry);
    slugs.add(b.slug);
    const arr = exact.get(norm);
    if (arr) {
      if (!arr.includes(b.slug)) arr.push(b.slug);
    } else {
      exact.set(norm, [b.slug]);
    }
  }
  return { entries, exact, slugs };
}

type ResolutionStatus = "exact" | "fuzzy" | "uncertain" | "ambiguous" | "not-found";

interface Resolution {
  status: ResolutionStatus;
  /** Slug written into the JSON (set for exact/fuzzy only). */
  slug?: string;
  /** Best-guess slug + title + score for review context (uncertain/ambiguous). */
  guessSlug?: string;
  guessTitle?: string;
  score?: number;
}

function resolveTitle(title: string, corpus: CorpusIndex): Resolution {
  const q = normalize(title);
  const exactSlugs = corpus.exact.get(q);
  if (exactSlugs) {
    if (exactSlugs.length === 1) return { status: "exact", slug: exactSlugs[0], score: 1 };
    return { status: "ambiguous", guessSlug: exactSlugs[0], guessTitle: title, score: 1 };
  }

  const qs = tokenSorted(q);
  let best: CorpusEntry | null = null;
  let bestScore = -1;
  let secondScore = -1;
  for (const e of corpus.entries) {
    const s = Math.max(ratio(q, e.norm), ratio(qs, e.sorted));
    if (s > bestScore) {
      secondScore = bestScore;
      bestScore = s;
      best = e;
    } else if (s > secondScore) {
      secondScore = s;
    }
  }

  if (best && bestScore >= SCORE_HIGH && bestScore - secondScore >= SCORE_MARGIN) {
    return { status: "fuzzy", slug: best.slug, guessTitle: best.title, score: bestScore };
  }
  if (best && bestScore >= SCORE_MID) {
    return {
      status: "uncertain",
      guessSlug: best.slug,
      guessTitle: best.title,
      score: bestScore,
    };
  }
  return { status: "not-found", score: best ? bestScore : 0 };
}

// ---- Overrides ---------------------------------------------------------------

/** rawTitle (normalized casing/trim) → slug | "" (explicitly unlinked). */
function loadOverrides(): Map<string, string> {
  const text = readFileSync(OVERRIDES_FILE, "utf8");
  const parsed = JSON.parse(text) as { overrides?: Record<string, unknown> };
  const map = new Map<string, string>();
  const obj = parsed.overrides ?? {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== "string") {
      throw new Error(`${OVERRIDES_FILE}: override "${key}" must map to a string (slug or "").`);
    }
    map.set(key.trim().toLowerCase(), value.trim());
  }
  return map;
}

/**
 * Verbatim faction/subfaction label (normalized casing/trim) → corrected display
 * label. Display-only spelling fix for the source (e.g. "Nekrons" → "Necrons");
 * applied before slug derivation so the URL is corrected too. It never feeds the
 * In-Depth `Main faction` lookup (that stays keyed on the raw Excel label), so a
 * correction can't break which subfaction rows attach to which faction.
 */
function loadLabelOverrides(): Map<string, string> {
  const text = readFileSync(OVERRIDES_FILE, "utf8");
  const parsed = JSON.parse(text) as { labelOverrides?: Record<string, unknown> };
  const map = new Map<string, string>();
  const obj = parsed.labelOverrides ?? {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(
        `${OVERRIDES_FILE}: labelOverride "${key}" must map to a non-empty display label.`,
      );
    }
    map.set(key.trim().toLowerCase(), value.trim());
  }
  return map;
}

/** Apply a display-label correction to a raw Excel label (identity if none). */
function correctLabel(raw: string, labelOverrides: Map<string, string>): string {
  return labelOverrides.get(raw.trim().toLowerCase()) ?? raw;
}

// =============================================================================
// BUILD
// =============================================================================

interface ReviewItem {
  factionPath: string; // "Adeptus Custodes" / "Space Marines › Ultramarines"
  rawTitle: string;
  cleanTitle: string;
  status: ResolutionStatus;
  guessSlug?: string;
  guessTitle?: string;
  score?: number;
}

interface BuildResult {
  file: FactionStartersFile;
  review: ReviewItem[];
  stats: { picks: number; exact: number; fuzzy: number; overridden: number; unlinked: number };
}

function buildPick(
  raw: string,
  factionPath: string,
  corpus: CorpusIndex,
  overrides: Map<string, string>,
  review: ReviewItem[],
  stats: BuildResult["stats"],
): FactionStarterPick {
  const parsed = parsePick(raw);
  stats.picks += 1;

  const pick: FactionStarterPick = { title: parsed.title };
  if (parsed.kind) pick.kind = parsed.kind;
  if (parsed.note) pick.note = parsed.note;

  // 1) Override by verbatim raw title.
  const ov = overrides.get(parsed.rawTitle.trim().toLowerCase());
  if (ov !== undefined) {
    if (ov === "") {
      stats.unlinked += 1; // intentionally unlinked — suppressed from review
    } else {
      pick.book = ov;
      stats.overridden += 1;
    }
    return pick;
  }

  // 2) Tolerant auto-resolution.
  const res = resolveTitle(parsed.title, corpus);
  if (res.status === "exact" || res.status === "fuzzy") {
    pick.book = res.slug;
    if (res.status === "exact") {
      stats.exact += 1;
    } else {
      // Fuzzy (typo-tolerant) links are linked AND surfaced for a human audit.
      stats.fuzzy += 1;
      review.push({
        factionPath,
        rawTitle: parsed.rawTitle,
        cleanTitle: parsed.title,
        status: "fuzzy",
        guessSlug: res.slug,
        guessTitle: res.guessTitle,
        score: res.score,
      });
    }
    return pick;
  }

  // 3) Unresolved → review list, no link.
  stats.unlinked += 1;
  review.push({
    factionPath,
    rawTitle: parsed.rawTitle,
    cleanTitle: parsed.title,
    status: res.status,
    guessSlug: res.guessSlug,
    guessTitle: res.guessTitle,
    score: res.score,
  });
  return pick;
}

function buildPicks(
  primaryCell: string,
  altCell: string,
  factionPath: string,
  corpus: CorpusIndex,
  overrides: Map<string, string>,
  review: ReviewItem[],
  stats: BuildResult["stats"],
): FactionStarterPick[] {
  const rawTitles: string[] = [];
  if (primaryCell) rawTitles.push(primaryCell);
  rawTitles.push(...splitAlternatives(altCell));
  return rawTitles.map((t) => buildPick(t, factionPath, corpus, overrides, review, stats));
}

async function build(): Promise<BuildResult> {
  const issues = new IssueCollector();
  const corpus = buildCorpus();
  const overrides = loadOverrides();
  const labelOverrides = loadLabelOverrides();
  const review: ReviewItem[] = [];
  const stats = { picks: 0, exact: 0, fuzzy: 0, overridden: 0, unlinked: 0 };

  // A non-empty override slug MUST exist in the corpus, otherwise the pick would
  // link to a /buch/{slug} that 404s. Fail loud so a typo in the hand-gate file
  // is caught here, not in the browser. ("" = intentional unlink, always fine.)
  for (const [key, slug] of overrides) {
    if (slug !== "" && !corpus.slugs.has(slug)) {
      issues.push({
        sheet: OVERRIDES_FILE,
        rowIndex: 0,
        message: `override "${key}" → "${slug}" is not a known book slug in ${CORPUS_NAME}.`,
      });
    }
  }
  if (issues.hasIssues()) issues.printAndExit();

  // `trim: false` mirrors import-ssot-roster: read-excel-file 9.x crashes on
  // some empty string-typed cells with trim on; we trim ourselves.
  const bigRaw = await readSheet(SOURCE_FILE, BIG_SHEET, { trim: false });
  const depthRaw = await readSheet(SOURCE_FILE, DEPTH_SHEET, { trim: false });

  // -------- Header validation --------
  const bigHeader = (bigRaw[0] ?? []).map((v) => trimCell(v));
  if (bigHeader.length < BIG_HEADERS.length || !BIG_HEADERS.every((h, i) => h === bigHeader[i])) {
    console.error(`[import-faction-starters] '${BIG_SHEET}' header mismatch.`);
    console.error(`  expected (first ${BIG_HEADERS.length}): ${JSON.stringify(BIG_HEADERS)}`);
    console.error(`  actual:   ${JSON.stringify(bigHeader)}`);
    process.exit(1);
  }
  const depthHeader = (depthRaw[0] ?? []).map((v) => trimCell(v));
  if (
    depthHeader.length < DEPTH_HEADERS.length ||
    !DEPTH_HEADERS.every((h, i) => h === depthHeader[i])
  ) {
    console.error(`[import-faction-starters] '${DEPTH_SHEET}' header mismatch.`);
    console.error(`  expected (first ${DEPTH_HEADERS.length}): ${JSON.stringify(DEPTH_HEADERS)}`);
    console.error(`  actual:   ${JSON.stringify(depthHeader)}`);
    process.exit(1);
  }

  // -------- Pass 1: Big Faction → top-level nodes --------
  const starters: FactionStarterNode[] = [];
  const byLabel = new Map<string, FactionStarterNode>(); // normalized label → node
  const topSlugs = new Set<string>();

  for (let i = 1; i < bigRaw.length; i++) {
    const row = bigRaw[i]!;
    if (rowIsEmpty(row)) continue; // spacer
    const sourceRow = i + 1;
    const rawLabel = trimCell(row[0]);
    const book = trimCell(row[1]);
    const alt = trimCell(row[2]);
    if (!rawLabel) {
      issues.push({ sheet: BIG_SHEET, rowIndex: sourceRow, message: "'Faction' is empty but the row carries data." });
      continue;
    }
    const label = correctLabel(rawLabel, labelOverrides);
    const node: FactionStarterNode = { slug: siblingSlug(label, topSlugs), label };
    const isGroup = book.toLowerCase() === GROUP_POINTER;
    if (!isGroup) {
      const picks = buildPicks(book, alt, label, corpus, overrides, review, stats);
      if (picks.length > 0) node.picks = picks;
    }
    starters.push(node);
    // Keyed on the RAW Excel label so the In-Depth `Main faction` lookup matches
    // the source verbatim, independent of any display-label correction above.
    const key = rawLabel.trim().toLowerCase();
    if (!byLabel.has(key)) byLabel.set(key, node);
  }

  // -------- Pass 2: In-Depth Faction → children (forward-filled Main faction) --
  let currentMain: FactionStarterNode | null = null;
  let currentMainLabel = "";
  const childSlugsByParent = new Map<FactionStarterNode, Set<string>>();

  for (let i = 1; i < depthRaw.length; i++) {
    const row = depthRaw[i]!;
    if (rowIsEmpty(row)) continue; // spacer
    const sourceRow = i + 1;
    const mainCell = trimCell(row[0]);
    const sub = trimCell(row[1]);
    const book = trimCell(row[2]);
    const alt = trimCell(row[3]);

    if (mainCell) {
      const parent = byLabel.get(mainCell.toLowerCase());
      if (!parent) {
        issues.push({
          sheet: DEPTH_SHEET,
          rowIndex: sourceRow,
          message: `'Main faction' = "${mainCell}" has no matching node in '${BIG_SHEET}'.`,
        });
        currentMain = null;
        currentMainLabel = mainCell;
        continue;
      }
      currentMain = parent;
      currentMainLabel = mainCell;
    }

    if (!sub) {
      // A row with no subfaction but other data is malformed.
      if (book || alt) {
        issues.push({
          sheet: DEPTH_SHEET,
          rowIndex: sourceRow,
          message: "'Subfaction' is empty but the row carries a Book/Alternative.",
        });
      }
      continue;
    }
    if (!currentMain) {
      issues.push({
        sheet: DEPTH_SHEET,
        rowIndex: sourceRow,
        message: `Subfaction "${sub}" has no resolved 'Main faction' (last seen: "${currentMainLabel || "—"}").`,
      });
      continue;
    }

    const taken = childSlugsByParent.get(currentMain) ?? new Set<string>();
    childSlugsByParent.set(currentMain, taken);
    const subLabel = correctLabel(sub, labelOverrides);
    const child: FactionStarterNode = { slug: siblingSlug(subLabel, taken), label: subLabel };
    const path = `${currentMain.label} › ${subLabel}`;
    const picks = buildPicks(book, alt, path, corpus, overrides, review, stats);
    if (picks.length > 0) child.picks = picks;
    (currentMain.children ??= []).push(child);
  }

  if (issues.hasIssues()) issues.printAndExit();

  const file: FactionStartersFile = {
    version: SCHEMA_VERSION,
    _doc: DOC,
    source: "Warhammer_OFOC_SSOT.xlsx",
    starters,
  };

  // Defensive: the emitted object must pass the same validator the app applies.
  validateFactionStarters(file);

  return { file, review, stats };
}

// =============================================================================
// REVIEW REPORT
// =============================================================================

function renderReview(review: ReviewItem[], stats: BuildResult["stats"]): string {
  const lines: string[] = [];
  lines.push("# faction-starters — title resolution review");
  lines.push("");
  lines.push(
    "Generated by `npm run import:faction-starters` (Brief 166). This is the hand-gate: " +
      "every pick title below either resolved to no corpus book, or only to an uncertain " +
      "best guess. The convert step does **not** guess — these picks render without a link " +
      "until corrected. Resolve a title by adding it to `faction-starters.overrides.json` " +
      "(`\"<verbatim title>\": \"<book-slug>\"`), or `\"<verbatim title>\": \"\"` to mark it " +
      "intentionally unlinked (e.g. a series/audio-drama with no single corpus book — these " +
      "are the DB-Nachpflege list). Then re-run the convert step.",
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Picks total: **${stats.picks}**`);
  lines.push(`- Linked (exact): **${stats.exact}**`);
  lines.push(`- Linked (fuzzy, typo-tolerant): **${stats.fuzzy}**`);
  lines.push(`- Linked (override): **${stats.overridden}**`);
  lines.push(`- Unlinked (in review below + intentionally-blank overrides): **${stats.unlinked}**`);
  lines.push("");

  const fuzzy = review.filter((r) => r.status === "fuzzy");
  const uncertain = review.filter((r) => r.status === "uncertain" || r.status === "ambiguous");
  const notFound = review.filter((r) => r.status === "not-found");

  lines.push(`## Fuzzy auto-links (${fuzzy.length}) — linked, please verify`);
  lines.push("");
  lines.push(
    "These were typo-tolerant matches, so they ARE linked in the JSON — but a human " +
      "should confirm each. To override a wrong one, add `\"<verbatim title>\": \"<slug>\"` " +
      "(or `\"\"` to unlink) to `faction-starters.overrides.json`.",
  );
  lines.push("");
  if (fuzzy.length === 0) {
    lines.push("_None._");
  } else {
    lines.push("| Faction | Title (verbatim) | Linked to | Score |");
    lines.push("|---|---|---|---|");
    for (const r of fuzzy) {
      const score = r.score !== undefined ? r.score.toFixed(2) : "—";
      lines.push(`| ${r.factionPath} | ${r.rawTitle} | ${r.guessTitle} (\`${r.guessSlug}\`) | ${score} |`);
    }
  }
  lines.push("");

  lines.push(`## Uncertain best-guesses (${uncertain.length}) — confirm or correct`);
  lines.push("");
  if (uncertain.length === 0) {
    lines.push("_None._");
  } else {
    lines.push("| Faction | Title (verbatim) | Best guess | Score | Suggested override |");
    lines.push("|---|---|---|---|---|");
    for (const r of uncertain) {
      const score = r.score !== undefined ? r.score.toFixed(2) : "—";
      const guess = r.guessTitle ? `${r.guessTitle} (\`${r.guessSlug}\`)` : "—";
      const sug = r.guessSlug ? `\`"${r.rawTitle}": "${r.guessSlug}"\`` : "—";
      lines.push(`| ${r.factionPath} | ${r.rawTitle} | ${guess} | ${score} | ${sug} |`);
    }
  }
  lines.push("");

  lines.push(`## Not found (${notFound.length}) — supply a slug or mark unlinked`);
  lines.push("");
  if (notFound.length === 0) {
    lines.push("_None._");
  } else {
    lines.push("| Faction | Title (verbatim) | Clean title (resolved against) |");
    lines.push("|---|---|---|");
    for (const r of notFound) {
      lines.push(`| ${r.factionPath} | ${r.rawTitle} | ${r.cleanTitle} |`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log(`[import-faction-starters] reading ${SOURCE_FILE}`);
  const { file, review, stats } = await build();

  const json = `${JSON.stringify(file, null, 2)}\n`;
  await writeFile(OUTPUT_FILE, json, "utf8");
  await writeFile(REVIEW_FILE, renderReview(review, stats), "utf8");

  const topCount = file.starters.length;
  const childCount = file.starters.reduce((n, s) => n + (s.children?.length ?? 0), 0);
  console.log(`[import-faction-starters] wrote ${OUTPUT_FILE}`);
  console.log(`  top-level factions: ${topCount}`);
  console.log(`  subfactions:        ${childCount}`);
  console.log(
    `  picks: ${stats.picks} | exact ${stats.exact} | fuzzy ${stats.fuzzy} | override ${stats.overridden} | unlinked ${stats.unlinked}`,
  );
  console.log(`[import-faction-starters] wrote ${REVIEW_FILE}`);
  const uncertain = review.filter((r) => r.status === "uncertain" || r.status === "ambiguous").length;
  const notFound = review.filter((r) => r.status === "not-found").length;
  console.log(`  review — uncertain: ${uncertain} | not-found: ${notFound}`);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error("[import-faction-starters] unexpected error:", err);
  process.exit(1);
});
