/**
 * brain-lint — drift checks for the Brain wiki (Karpathy operation 3/3).
 *
 * Implements the check matrix from sessions/2026-05-09-053-arch-brain-lint.md.
 * Reports under brain/outputs/lint/<date>.md. Lint never edits the wiki —
 * fixes happen via Ingest (separate session).
 *
 * Categories (severity defaults — flip with --strict):
 *   blocking : Frontmatter, Sources, Internal links, Catalog freshness,
 *              Raw banners, Decision metadata, Inline diff raw fields,
 *              Orphans (folded into Catalog freshness)
 *   warning  : Stale low-confidence, Brain size budget, Stale claim suspects
 *
 * Run: `npm run brain:lint` (writes report) or `npm run brain:lint -- --no-write`.
 * CLI: --date=YYYY-MM-DD  override report date
 *      --no-write         skip writing the report file
 *      --strict           warnings exit non-zero too
 *      --help             print usage
 */

import { promises as fs, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

// ============================================================================
// Constants — single edit point per brief §"Brain-size-Schwellen" note.
// ============================================================================

const SIZE_LIMITS = {
  WIKI_BODY_LINES: 300,
  DECISION_BODY_LINES: 100,
  PROJECT_STATE_BODY_LINES: 160,
} as const;

const STALE_LOW_DAYS = 30;

const VALID_TYPES = new Set([
  "overview",
  "decision",
  "workflow",
  "concept",
  "source-summary",
  "reference",
]);
const VALID_CONFIDENCE = new Set(["high", "medium", "low"]);

// Per brief §11: pages allowed to mention diff raw-field tokens.
const INLINE_DIFF_RAW_EXEMPT_PAGES = new Set<string>([
  "brain/wiki/pipeline-state.md",
  "brain/wiki/workflows/lint.md",
  "brain/wiki/workflows/ingest.md",
]);

// Tokens flagged in code/JSON contexts (blocking) and prose (warning).
const INLINE_DIFF_RAW_TOKENS: ReadonlyArray<string> = [
  "rawLlmPayload",
  "rawHardcoverPayload",
  "updated[].diff",
  "llm_flags",
  "payload",
];
// fieldOrigins is special: only flag in long JSON/diff context (fenced code),
// never as a glossary mention.
const INLINE_DIFF_RAW_TOKENS_JSON_ONLY: ReadonlyArray<string> = ["fieldOrigins"];

// Repo-path-claim prefixes (§12).
const REPO_PATH_PREFIXES: ReadonlyArray<string> = [
  "src/",
  "scripts/",
  "brain/",
  "sessions/",
  "docs/",
  "ingest/",
  ".github/",
];

// Files included in the internal-link scan in addition to brain/wiki/**.
const EXTRA_LINK_SCAN_FILES: ReadonlyArray<string> = [
  "brain/CLAUDE.md",
  "brain/outputs/lint/README.md",
  "brain/raw/reviews/README.md",
];

// Top-level files: scan only links into brain/ or sessions/.
const TOP_LEVEL_LINK_SCAN_FILES: ReadonlyArray<string> = [
  "CLAUDE.md",
  "README.md",
  "ARCHITECTURE.md",
  "ROADMAP.md",
  "ONBOARDING.md",
];
const TOP_LEVEL_LINK_PREFIXES: ReadonlyArray<string> = ["brain/", "sessions/"];

// ============================================================================
// Types
// ============================================================================

type Severity = "error" | "warning";
type Category =
  | "Frontmatter"
  | "Sources"
  | "Internal links"
  | "Catalog freshness"
  | "Raw banners"
  | "Decision metadata"
  | "Stale low-confidence"
  | "Brain size budget"
  | "Inline diff raw fields"
  | "Stale claim suspects";

const CATEGORY_ORDER: ReadonlyArray<Category> = [
  "Frontmatter",
  "Decision metadata",
  "Sources",
  "Internal links",
  "Catalog freshness",
  "Raw banners",
  "Inline diff raw fields",
  "Brain size budget",
  "Stale low-confidence",
  "Stale claim suspects",
];

interface Finding {
  severity: Severity;
  category: Category;
  file: string;
  line?: number;
  message: string;
  evidence?: string;
  suggestion?: string;
}

type FmValue = string | string[];
interface Frontmatter {
  fields: Map<string, FmValue>;
  endLine: number; // 1-based line of closing ---
}

interface ParsedFile {
  absPath: string;
  relPath: string;
  content: string;
  fm: Frontmatter | null;
  body: string;
  bodyStartLine: number; // 1-based first line of body
  bodyLineCount: number;
}

interface Cli {
  date: string;
  write: boolean;
  strict: boolean;
}

// ============================================================================
// Path helpers (cross-platform forward-slash normalization)
// ============================================================================

function toFwd(p: string): string {
  return p.replace(/\\/g, "/");
}

function repoRel(absPath: string, repoRoot: string): string {
  return toFwd(path.relative(repoRoot, absPath));
}

// ============================================================================
// Date helpers
// ============================================================================

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() + 1 === m && dt.getUTCDate() === d;
}

function dateDiffDays(earlier: string, later: string): number {
  const [ya, ma, da] = earlier.split("-").map(Number);
  const [yb, mb, db] = later.split("-").map(Number);
  const ms = Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da);
  return Math.round(ms / 86400000);
}

// ============================================================================
// CLI parsing
// ============================================================================

function parseCli(argv: string[]): Cli {
  let date = todayIso();
  let write = true;
  let strict = false;
  for (const a of argv) {
    if (a === "--") continue; // tolerate npm's bare separator if it slips through
    if (a.startsWith("--date=")) {
      const v = a.slice("--date=".length);
      if (!isValidIsoDate(v)) throw new Error(`--date must be YYYY-MM-DD, got "${v}"`);
      date = v;
    } else if (a === "--no-write") {
      write = false;
    } else if (a === "--strict") {
      strict = true;
    } else if (a === "--help" || a === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown flag: ${a}`);
    }
  }
  return { date, write, strict };
}

function printHelp(): void {
  process.stdout.write(`brain-lint — drift checks for the Brain wiki.

Usage: tsx scripts/brain-lint.ts [flags]

Flags:
  --date=YYYY-MM-DD   Override the report date (default: today).
  --no-write          Skip writing the report file; print summary only.
  --strict            Exit non-zero on warnings as well.
  --help, -h          Print this help.

Exit codes:
  0  Clean (no blocking; warnings allowed unless --strict).
  1  Blocking findings present (or warnings under --strict).
  2  Internal error.

Reports land in brain/outputs/lint/<date>.md.
Definitions: brain/wiki/workflows/lint.md.
`);
}

// ============================================================================
// File walking
// ============================================================================

async function walkMd(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(p: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(p, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(p, e.name);
      if (e.isDirectory()) await walk(full);
      else if (e.isFile() && full.toLowerCase().endsWith(".md")) out.push(full);
    }
  }
  await walk(dir);
  return out.sort();
}

// ============================================================================
// Frontmatter parser (small YAML subset: scalars, [], block arrays, comments)
// ============================================================================

function parseFrontmatter(content: string): {
  fm: Frontmatter | null;
  body: string;
  bodyStartLine: number;
} {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0 || lines[0] !== "---") {
    return { fm: null, body: content, bodyStartLine: 1 };
  }
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return { fm: null, body: content, bodyStartLine: 1 };

  const fields = new Map<string, FmValue>();
  let currentArrayKey: string | null = null;

  for (let i = 1; i < endIdx; i++) {
    const raw = lines[i];
    if (raw.trim() === "") {
      currentArrayKey = null;
      continue;
    }
    if (raw.trimStart().startsWith("#")) {
      currentArrayKey = null;
      continue;
    }

    if (currentArrayKey && /^\s+-(\s|$)/.test(raw)) {
      let v = raw.replace(/^\s+-\s?/, "").trim();
      v = stripInlineComment(v);
      v = stripQuotes(v);
      const arr = fields.get(currentArrayKey) as string[];
      arr.push(v);
      continue;
    }

    const m = raw.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!m) {
      currentArrayKey = null;
      continue;
    }
    const key = m[1];
    let rest = m[2];
    rest = stripInlineComment(rest).trim();
    if (rest === "") {
      fields.set(key, []);
      currentArrayKey = key;
    } else if (rest === "[]") {
      fields.set(key, []);
      currentArrayKey = null;
    } else {
      fields.set(key, stripQuotes(rest));
      currentArrayKey = null;
    }
  }

  const body = lines.slice(endIdx + 1).join("\n");
  return { fm: { fields, endLine: endIdx + 1 }, body, bodyStartLine: endIdx + 2 };
}

function stripInlineComment(s: string): string {
  // Conservative: only strip ` #...` when value isn't quoted.
  const t = s.trimStart();
  if (t.startsWith('"') || t.startsWith("'")) return s;
  const m = s.match(/^(.*?)\s+#.*$/);
  return m ? m[1] : s;
}

function stripQuotes(s: string): string {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ============================================================================
// File loaders
// ============================================================================

async function loadParsed(absPath: string, repoRoot: string): Promise<ParsedFile> {
  const content = await fs.readFile(absPath, "utf8");
  const { fm, body, bodyStartLine } = parseFrontmatter(content);
  return {
    absPath,
    relPath: repoRel(absPath, repoRoot),
    content,
    fm,
    body,
    bodyStartLine,
    bodyLineCount: body.split(/\r?\n/).length,
  };
}

// ============================================================================
// Check 1 — Frontmatter (blocking)
// ============================================================================

function checkFrontmatter(wikiPages: ParsedFile[]): Finding[] {
  const findings: Finding[] = [];
  const required = ["title", "type", "created", "updated", "sources", "related", "confidence"];

  for (const p of wikiPages) {
    if (p.relPath === "brain/wiki/log.md") continue; // schema-exempt

    if (!p.fm) {
      findings.push({
        severity: "error",
        category: "Frontmatter",
        file: p.relPath,
        line: 1,
        message: `missing YAML frontmatter (must start with --- on line 1)`,
      });
      continue;
    }

    for (const key of required) {
      if (!p.fm.fields.has(key)) {
        findings.push({
          severity: "error",
          category: "Frontmatter",
          file: p.relPath,
          message: `missing required frontmatter field \`${key}\``,
        });
      }
    }

    const t = p.fm.fields.get("type");
    if (typeof t === "string" && !VALID_TYPES.has(t)) {
      findings.push({
        severity: "error",
        category: "Frontmatter",
        file: p.relPath,
        message: `invalid \`type: ${t}\` (must be one of ${[...VALID_TYPES].join(" | ")})`,
      });
    }

    const conf = p.fm.fields.get("confidence");
    if (typeof conf === "string" && !VALID_CONFIDENCE.has(conf)) {
      findings.push({
        severity: "error",
        category: "Frontmatter",
        file: p.relPath,
        message: `invalid \`confidence: ${conf}\` (must be one of high | medium | low)`,
      });
    }

    const created = p.fm.fields.get("created");
    const updated = p.fm.fields.get("updated");
    if (typeof created === "string" && !isValidIsoDate(created)) {
      findings.push({
        severity: "error",
        category: "Frontmatter",
        file: p.relPath,
        message: `\`created: ${created}\` is not a valid YYYY-MM-DD date`,
      });
    }
    if (typeof updated === "string" && !isValidIsoDate(updated)) {
      findings.push({
        severity: "error",
        category: "Frontmatter",
        file: p.relPath,
        message: `\`updated: ${updated}\` is not a valid YYYY-MM-DD date`,
      });
    }
    if (
      typeof created === "string" &&
      typeof updated === "string" &&
      isValidIsoDate(created) &&
      isValidIsoDate(updated) &&
      dateDiffDays(created, updated) < 0
    ) {
      findings.push({
        severity: "error",
        category: "Frontmatter",
        file: p.relPath,
        message: `\`updated\` (${updated}) is earlier than \`created\` (${created})`,
      });
    }

    // sources / related must be arrays (the parser materializes them as such if `:` followed by block array or `[]`)
    for (const arrKey of ["sources", "related"]) {
      const v = p.fm.fields.get(arrKey);
      if (v !== undefined && !Array.isArray(v)) {
        findings.push({
          severity: "error",
          category: "Frontmatter",
          file: p.relPath,
          message: `\`${arrKey}\` must be an array (use \`[]\` or block list with \`- ...\`), got scalar \`${v}\``,
        });
      }
    }
  }

  return findings;
}

// ============================================================================
// Check 1b — Decision metadata (blocking; reported under its own category)
// ============================================================================

function checkDecisionMetadata(wikiPages: ParsedFile[]): Finding[] {
  const findings: Finding[] = [];
  for (const p of wikiPages) {
    if (!p.fm) continue;
    const t = p.fm.fields.get("type");
    if (t !== "decision") continue;

    const dd = p.fm.fields.get("decision-date");
    if (dd === undefined) {
      findings.push({
        severity: "error",
        category: "Decision metadata",
        file: p.relPath,
        message: `decision page missing \`decision-date\` field`,
      });
      continue;
    }
    if (typeof dd !== "string" || !isValidIsoDate(dd)) {
      findings.push({
        severity: "error",
        category: "Decision metadata",
        file: p.relPath,
        message: `\`decision-date: ${Array.isArray(dd) ? "(array)" : dd}\` is not a valid YYYY-MM-DD date`,
      });
      continue;
    }
    const updated = p.fm.fields.get("updated");
    if (typeof updated === "string" && isValidIsoDate(updated) && dateDiffDays(dd, updated) < 0) {
      findings.push({
        severity: "error",
        category: "Decision metadata",
        file: p.relPath,
        message: `\`decision-date\` (${dd}) is later than \`updated\` (${updated})`,
      });
    }
  }
  return findings;
}

// ============================================================================
// Check 2 — Sources (blocking)
// ============================================================================

function checkSources(wikiPages: ParsedFile[], repoRoot: string): Finding[] {
  const findings: Finding[] = [];
  for (const p of wikiPages) {
    if (!p.fm) continue;
    const sources = p.fm.fields.get("sources");
    if (!Array.isArray(sources)) continue;
    for (const raw of sources) {
      const s = raw.trim();
      if (s === "") continue;
      // Reject parenthetical/free-text in sources
      if (/[()]/.test(s) || /\s/.test(s)) {
        // Allow URLs (which contain neither parens nor spaces in our usage); flag prose
        if (!/^https?:/.test(s)) {
          findings.push({
            severity: "error",
            category: "Sources",
            file: p.relPath,
            message: `\`sources\` entry is not a clean path or URL: \`${s}\``,
            suggestion: `Use a literal path (e.g. \`../../sessions/2026-05-09-053-arch-brain-lint.md\`) or HTTPS URL.`,
          });
          continue;
        }
      }
      if (/^https?:/.test(s)) continue; // URLs not browsed
      // Resolve relative to the wiki file
      const noAnchor = s.split("#")[0];
      if (noAnchor === "") continue;
      const resolved = path.resolve(path.dirname(p.absPath), noAnchor);
      if (!existsSync(resolved)) {
        findings.push({
          severity: "error",
          category: "Sources",
          file: p.relPath,
          message: `\`sources\` entry does not exist: \`${s}\``,
          evidence: `resolves to ${repoRel(resolved, repoRoot)}`,
        });
      }
    }
  }
  return findings;
}

// ============================================================================
// Check 3 — Internal links (blocking)
//
// Scans markdown links + images in:
//   - brain/wiki/** (full)
//   - brain/CLAUDE.md (full)
//   - brain/outputs/lint/README.md (full)
//   - brain/raw/reviews/README.md (full)
//   - top-level CLAUDE.md, README.md, ARCHITECTURE.md, ROADMAP.md, ONBOARDING.md
//     (only links into brain/ or sessions/)
//
// Records broken targets (repo-relative) into brokenLinks set so the path-claim
// suspect check (§12) can avoid duplicating them.
// ============================================================================

function checkInternalLinks(
  wikiPages: ParsedFile[],
  extraFiles: { absPath: string; relPath: string; content: string }[],
  topLevelFiles: { absPath: string; relPath: string; content: string }[],
  repoRoot: string,
  brokenLinks: Set<string>,
): Finding[] {
  const findings: Finding[] = [];

  for (const p of wikiPages) {
    findings.push(...scanLinksInFile(p.absPath, p.relPath, p.content, repoRoot, brokenLinks, null));
  }
  for (const f of extraFiles) {
    findings.push(...scanLinksInFile(f.absPath, f.relPath, f.content, repoRoot, brokenLinks, null));
  }
  for (const f of topLevelFiles) {
    findings.push(
      ...scanLinksInFile(f.absPath, f.relPath, f.content, repoRoot, brokenLinks, TOP_LEVEL_LINK_PREFIXES),
    );
  }

  return findings;
}

function scanLinksInFile(
  absPath: string,
  relPath: string,
  content: string,
  repoRoot: string,
  brokenLinks: Set<string>,
  restrictPrefixes: ReadonlyArray<string> | null,
): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split(/\r?\n/);
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const lineRaw = lines[i];
    if (/^\s*(```|~~~)/.test(lineRaw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // Strip inline-code spans so `[x](y)` inside backticks isn't matched as a link.
    const lineNoInline = lineRaw.replace(/`[^`]*`/g, " ");

    // Match [text](target) and ![alt](target). Targets do not contain ).
    const linkRe = /(!?)\[[^\]]*\]\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(lineNoInline)) !== null) {
      const target = m[2].trim();
      if (target === "") continue;
      if (/^(https?:|mailto:|tel:|#)/i.test(target)) continue;
      if (target.startsWith("<") && target.endsWith(">")) continue;

      // Strip <...> form (e.g. <https://...>) — already covered above for URLs.
      let cleanTarget = target.split("#")[0].split("?")[0].trim();
      if (cleanTarget === "") continue;
      try {
        cleanTarget = decodeURIComponent(cleanTarget);
      } catch {
        // Malformed encoding — keep as-is.
      }

      // External: paths going up out of the repo (../../<elsewhere>) are not lintable.
      const resolved = path.resolve(path.dirname(absPath), cleanTarget);
      const repoRelTarget = toFwd(path.relative(repoRoot, resolved));
      if (repoRelTarget.startsWith("..")) continue;
      // Absolute path outside repo (Windows: starts with drive letter not under repo) — skip.
      if (path.isAbsolute(cleanTarget) && !resolved.startsWith(repoRoot)) continue;

      if (restrictPrefixes && !restrictPrefixes.some((p) => repoRelTarget.startsWith(p))) {
        continue;
      }

      if (!existsSync(resolved)) {
        findings.push({
          severity: "error",
          category: "Internal links",
          file: relPath,
          line: i + 1,
          message: `link target not found: \`${target}\``,
          evidence: `resolves to ${repoRelTarget}`,
        });
        brokenLinks.add(`${relPath}${i + 1}${repoRelTarget}`);
      }
    }
  }

  return findings;
}

// ============================================================================
// Check 4 — Catalog freshness (blocking)
//
// brain/wiki/index.md must:
//   - link to every wiki page (except log.md)
//   - link only to pages that exist
//   - if a row shows an Updated date, it must match the page's frontmatter
// ============================================================================

function checkCatalogFreshness(wikiPages: ParsedFile[], repoRoot: string): Finding[] {
  const findings: Finding[] = [];
  const indexAbs = path.join(repoRoot, "brain/wiki/index.md");
  if (!existsSync(indexAbs)) {
    findings.push({
      severity: "error",
      category: "Catalog freshness",
      file: "brain/wiki/index.md",
      message: `index.md is missing — the master catalog must exist`,
    });
    return findings;
  }

  const indexContent = readFileSync(indexAbs, "utf8");
  // Map repoRel -> { date | null, line }
  const catalog = new Map<string, { date: string | null; line: number }>();
  const lines = indexContent.split(/\r?\n/);
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const dates = [...line.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)].map((m) => m[1]);
    const lastDate = dates.length > 0 ? dates[dates.length - 1] : null;

    const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(line)) !== null) {
      const target = m[1].trim();
      if (/^(https?:|mailto:|#)/i.test(target)) continue;
      const cleanTarget = target.split("#")[0].split("?")[0];
      if (cleanTarget === "") continue;
      const resolved = path.resolve(path.dirname(indexAbs), cleanTarget);
      const repoRelTarget = toFwd(path.relative(repoRoot, resolved));
      if (!repoRelTarget.startsWith("brain/wiki/")) continue;
      if (!repoRelTarget.endsWith(".md")) continue;
      if (!catalog.has(repoRelTarget)) {
        catalog.set(repoRelTarget, { date: lastDate, line: i + 1 });
      }
    }
  }

  // Every catalog target must exist
  for (const [target, meta] of catalog) {
    const abs = path.join(repoRoot, target);
    if (!existsSync(abs)) {
      findings.push({
        severity: "error",
        category: "Catalog freshness",
        file: "brain/wiki/index.md",
        line: meta.line,
        message: `catalog references non-existent page: \`${target}\``,
      });
    }
  }

  // Every wiki page (except log.md and index.md) must be in catalog
  for (const p of wikiPages) {
    if (p.relPath === "brain/wiki/log.md") continue;
    if (p.relPath === "brain/wiki/index.md") continue;
    if (!catalog.has(p.relPath)) {
      findings.push({
        severity: "error",
        category: "Catalog freshness",
        file: "brain/wiki/index.md",
        message: `wiki page is not catalogued: \`${p.relPath}\``,
        suggestion: `Add a row under the appropriate section (overview / decision / workflow / reference).`,
      });
    }
  }

  // Catalog date == frontmatter `updated`
  for (const p of wikiPages) {
    if (!p.fm) continue;
    const meta = catalog.get(p.relPath);
    if (!meta || !meta.date) continue;
    const fmUpdated = p.fm.fields.get("updated");
    if (typeof fmUpdated !== "string") continue;
    if (fmUpdated !== meta.date) {
      findings.push({
        severity: "error",
        category: "Catalog freshness",
        file: "brain/wiki/index.md",
        line: meta.line,
        message: `catalog row shows ${meta.date} for \`${p.relPath}\`, but the page's \`updated\` is ${fmUpdated}`,
      });
    }
  }

  return findings;
}

// ============================================================================
// Check 5 — Orphans (blocking) — reported under "Catalog freshness"
//
// Per brief §7: pages with type overview | decision | workflow | concept
// must be linked from brain/wiki/index.md. log.md is exempt; reference and
// source-summary are exempt.
//
// (Catalog membership covers this in practice — a non-orphan is by definition
// in the index. Folded into the catalog check above; this function is a
// no-op kept for symmetry.)
// ============================================================================

function checkOrphans(_wikiPages: ParsedFile[], _repoRoot: string): Finding[] {
  return [];
}

// ============================================================================
// Check 6 — Raw banners (blocking)
// ============================================================================

function checkRawBanners(historical: ParsedFile[], reviews: ParsedFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const f of historical) {
    if (path.basename(f.absPath).toLowerCase() === "readme.md") continue;
    const required = ["snapshot-of", "snapshot-date", "snapshot-reason", "canonical-now"];
    if (!f.fm) {
      findings.push({
        severity: "error",
        category: "Raw banners",
        file: f.relPath,
        message: `historical snapshot missing YAML frontmatter banner`,
      });
      continue;
    }
    for (const key of required) {
      if (!f.fm.fields.has(key)) {
        findings.push({
          severity: "error",
          category: "Raw banners",
          file: f.relPath,
          message: `historical snapshot missing required field \`${key}\``,
        });
      }
    }
    const sd = f.fm.fields.get("snapshot-date");
    if (typeof sd === "string" && !isValidIsoDate(sd)) {
      findings.push({
        severity: "error",
        category: "Raw banners",
        file: f.relPath,
        message: `\`snapshot-date: ${sd}\` is not a valid YYYY-MM-DD date`,
      });
    }
  }

  for (const f of reviews) {
    if (path.basename(f.absPath).toLowerCase() === "readme.md") continue;
    const required = ["review-date", "review-source", "review-target"];
    if (!f.fm) {
      findings.push({
        severity: "error",
        category: "Raw banners",
        file: f.relPath,
        message: `external review missing YAML frontmatter banner`,
      });
      continue;
    }
    for (const key of required) {
      if (!f.fm.fields.has(key)) {
        findings.push({
          severity: "error",
          category: "Raw banners",
          file: f.relPath,
          message: `external review missing required field \`${key}\``,
        });
      }
    }
    const rd = f.fm.fields.get("review-date");
    if (typeof rd === "string" && !isValidIsoDate(rd)) {
      findings.push({
        severity: "error",
        category: "Raw banners",
        file: f.relPath,
        message: `\`review-date: ${rd}\` is not a valid YYYY-MM-DD date`,
      });
    }
  }

  return findings;
}

// ============================================================================
// Check 7 — Stale low-confidence (warning by default)
// ============================================================================

function checkStaleLowConfidence(wikiPages: ParsedFile[], reportDate: string): Finding[] {
  const findings: Finding[] = [];
  for (const p of wikiPages) {
    if (!p.fm) continue;
    const conf = p.fm.fields.get("confidence");
    const upd = p.fm.fields.get("updated");
    if (conf !== "low") continue;
    if (typeof upd !== "string" || !isValidIsoDate(upd)) continue;
    const days = dateDiffDays(upd, reportDate);
    if (days >= STALE_LOW_DAYS) {
      findings.push({
        severity: "warning",
        category: "Stale low-confidence",
        file: p.relPath,
        message: `\`confidence: low\` page hasn't been updated in ${days} days (last \`updated: ${upd}\`)`,
        suggestion: `Re-ingest with higher confidence, or downgrade the page-type if the uncertainty is permanent.`,
      });
    }
  }
  return findings;
}

// ============================================================================
// Check 8 — Brain size budget (warning by default)
// ============================================================================

function checkBrainSizeBudget(wikiPages: ParsedFile[]): Finding[] {
  const findings: Finding[] = [];
  for (const p of wikiPages) {
    if (p.relPath === "brain/wiki/log.md") continue; // append-only by design
    if (p.relPath === "brain/wiki/index.md") continue; // catalog grows with the wiki
    const t = p.fm?.fields.get("type");
    let limit = SIZE_LIMITS.WIKI_BODY_LINES;
    let kindLabel = "wiki page";
    if (p.relPath === "brain/wiki/project-state.md") {
      limit = SIZE_LIMITS.PROJECT_STATE_BODY_LINES;
      kindLabel = "project-state";
    } else if (t === "decision") {
      limit = SIZE_LIMITS.DECISION_BODY_LINES;
      kindLabel = "decision page";
    }
    if (p.bodyLineCount > limit) {
      findings.push({
        severity: "warning",
        category: "Brain size budget",
        file: p.relPath,
        message: `${kindLabel} has ${p.bodyLineCount} body lines; soft limit is ${limit}.`,
        suggestion: `Cut/synthesize in a follow-up Ingest (move report-style detail into pipeline-state.md or session logs).`,
      });
    }
  }
  return findings;
}

// ============================================================================
// Check 9 — Inline diff raw fields (blocking in code/JSON, warning in prose)
// ============================================================================

function checkInlineDiffRawFields(wikiPages: ParsedFile[]): Finding[] {
  const findings: Finding[] = [];

  for (const p of wikiPages) {
    if (INLINE_DIFF_RAW_EXEMPT_PAGES.has(p.relPath)) continue;
    if (p.relPath === "brain/wiki/glossary.md") {
      // Glossary names tokens definitionally; tokens listed there are reference-style
      // (single-backtick mentions in prose), never inline raw payloads. Skip the
      // warning bucket, but still catch fenced/JSON dumps.
    }

    const lines = p.content.split(/\r?\n/);
    let inFence = false;
    let fenceLang = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fenceMatch = line.match(/^\s*(```|~~~)(.*)$/);
      if (fenceMatch) {
        if (!inFence) {
          inFence = true;
          fenceLang = fenceMatch[2].trim().toLowerCase();
        } else {
          inFence = false;
          fenceLang = "";
        }
        continue;
      }

      // Determine context for THIS line
      // - In fence => "fence"
      // - Else if matches JSON-shape `"<token>":` near the token => "json"
      // - Else if token in inline-backticks => "inline"
      // - Else => "prose"

      for (const token of INLINE_DIFF_RAW_TOKENS) {
        const idx = findTokenInLine(line, token);
        if (idx === -1) continue;
        const ctx = inFence
          ? "fence"
          : isJsonShapeLine(line, token)
            ? "json"
            : isInsideInlineCode(line, idx)
              ? "inline"
              : "prose";

        if (ctx === "fence" || ctx === "json") {
          findings.push({
            severity: "error",
            category: "Inline diff raw fields",
            file: p.relPath,
            line: i + 1,
            message: `inline diff raw field \`${token}\` in ${ctx === "fence" ? "fenced code block" : "JSON-shaped line"}`,
            suggestion: `Cite the diff via \`sources:\`-frontmatter path; synthesize aggregates into pipeline-state.md.`,
          });
        } else if (ctx === "inline" && p.relPath !== "brain/wiki/glossary.md") {
          findings.push({
            severity: "warning",
            category: "Inline diff raw fields",
            file: p.relPath,
            line: i + 1,
            message: `inline-code mention of diff raw field \`${token}\``,
            suggestion: `If naming the field for prose, fine; if quoting raw data, cite the diff via sources.`,
          });
        }
        // prose-only mention: do nothing (would be too noisy)
      }

      // fieldOrigins — only flag in fence/json context
      for (const token of INLINE_DIFF_RAW_TOKENS_JSON_ONLY) {
        const idx = findTokenInLine(line, token);
        if (idx === -1) continue;
        const ctx = inFence ? "fence" : isJsonShapeLine(line, token) ? "json" : "skip";
        if (ctx === "skip") continue;
        findings.push({
          severity: "error",
          category: "Inline diff raw fields",
          file: p.relPath,
          line: i + 1,
          message: `diff raw field \`${token}\` in ${ctx === "fence" ? "fenced code block" : "JSON-shaped line"}`,
          suggestion: `Cite the diff via \`sources:\`-frontmatter path; do not reproduce raw payloads.`,
        });
      }
    }
  }

  return findings;
}

function findTokenInLine(line: string, token: string): number {
  // Word-ish boundary on both sides — token may contain non-word characters (e.g. brackets/dots).
  const idx = line.indexOf(token);
  if (idx === -1) return -1;
  const before = idx === 0 ? "" : line[idx - 1];
  const afterIdx = idx + token.length;
  const after = afterIdx >= line.length ? "" : line[afterIdx];
  // Reject substring matches (e.g. "payload" inside "payloads")
  if (/[A-Za-z0-9_]/.test(after)) return -1;
  if (/[A-Za-z0-9_]/.test(before)) return -1;
  return idx;
}

function isInsideInlineCode(line: string, atIdx: number): boolean {
  let inCode = false;
  for (let i = 0; i < atIdx; i++) {
    if (line[i] === "`") inCode = !inCode;
  }
  return inCode;
}

function isJsonShapeLine(line: string, token: string): boolean {
  // Heuristic: the token appears as a JSON key — i.e. preceded by `"` and followed
  // by `":` or `: `. Catches lines like `"rawLlmPayload": { ... }`.
  const re = new RegExp(`["']${escapeRegex(token)}["']\\s*:`);
  return re.test(line);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================================
// Check 10 — Stale claim suspects (warnings)
//
// (a) NPM scripts: `npm run <name>` mentioned in any wiki page must exist in
//     package.json.scripts.
// (b) Repo-path claims: backticked tokens AND markdown link targets with prefix
//     src/ | scripts/ | brain/ | sessions/ | docs/ | ingest/ | .github/ must
//     exist on disk. Skips entries already flagged blocking by the link checker.
// ============================================================================

function checkStaleClaimSuspects(
  wikiPages: ParsedFile[],
  repoRoot: string,
  pkgScripts: Set<string>,
  brokenLinks: Set<string>,
): Finding[] {
  const findings: Finding[] = [];

  for (const p of wikiPages) {
    const lines = p.content.split(/\r?\n/);
    let inFence = false;
    // log.md is an append-only operation log — its bullets document what was
    // read at the time. Path-claim drift there is expected (sessions move to
    // archive after the entry was written) and rewriting falsifies history.
    const skipPathClaim = p.relPath === "brain/wiki/log.md";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fenceMatch = /^\s*(```|~~~)/.test(line);
      if (fenceMatch) {
        inFence = !inFence;
        continue;
      }

      // (a) npm run <name> — scan everywhere except code-fence-skip would lose
      // legitimate examples in onboarding.md; we keep fence-scanning to catch
      // rename drift in shipped doc commands.
      for (const m of line.matchAll(/\bnpm run ([A-Za-z][A-Za-z0-9:_-]*)/g)) {
        const name = m[1];
        if (!pkgScripts.has(name)) {
          findings.push({
            severity: "warning",
            category: "Stale claim suspects",
            file: p.relPath,
            line: i + 1,
            message: `mentions \`npm run ${name}\`, but \`package.json\` has no \`${name}\` script`,
          });
        }
      }

      if (inFence) continue;
      if (skipPathClaim) continue;

      // (b) repo-path claims — backticked tokens + markdown link targets
      const candidates: { token: string; isLink: boolean }[] = [];

      // Strip code fences already; for inline tokens, scan single-backtick spans.
      const inlineRe = /`([^`\n]+?)`/g;
      let bm: RegExpExecArray | null;
      while ((bm = inlineRe.exec(line)) !== null) {
        candidates.push({ token: bm[1].trim(), isLink: false });
      }

      const linkRe = /(!?)\[[^\]]*\]\(([^)]+)\)/g;
      let lm: RegExpExecArray | null;
      while ((lm = linkRe.exec(line)) !== null) {
        candidates.push({ token: lm[2].trim(), isLink: true });
      }

      for (const c of candidates) {
        const tk = c.token;
        if (tk === "") continue;
        if (/^(https?:|mailto:|#)/i.test(tk)) continue;
        if (tk.includes("*") || tk.includes("...")) continue;
        if (looksLikePlaceholder(tk)) continue;

        const cleanToken = cleanRepoPathToken(tk);
        if (!REPO_PATH_PREFIXES.some((p) => cleanToken.startsWith(p))) continue;
        // Skip if it doesn't look like a path (whitespace inside)
        if (/\s/.test(cleanToken)) continue;
        if (looksLikePlaceholder(cleanToken)) continue;
        if (isKnownGitignored(cleanToken)) continue;

        const abs = path.join(repoRoot, cleanToken);
        if (existsSync(abs)) continue;

        // For link-style candidates, dedup against link-checker output.
        if (c.isLink) {
          const key = `${p.relPath}${i + 1}${cleanToken}`;
          if (brokenLinks.has(key)) continue;
          // Also: link-checker resolves relative to file; the path-claim only
          // fires when the token already starts with a repo prefix (i.e. it's
          // a repo-rooted reference, not a relative one). Such tokens are
          // inline-code-like uses; if the link checker resolved it elsewhere
          // and didn't flag, we still flag here only if the path doesn't exist.
        }

        findings.push({
          severity: "warning",
          category: "Stale claim suspects",
          file: p.relPath,
          line: i + 1,
          message: `references \`${tk}\`, but no such path exists in repo`,
        });
      }
    }
  }

  return findings;
}

function cleanRepoPathToken(s: string): string {
  let t = s.trim();
  // Strip trailing punctuation
  t = t.replace(/[),.;:!?]+$/, "");
  // Strip line/col suffix `:NN`, `:NN-MM`, `:NN:MM` (incl. en/em dash variants `:42–60`)
  t = t.replace(/:\d+(?:[\-–—:]\d+)?$/, "");
  // Strip anchor + query
  const hashIdx = t.indexOf("#");
  if (hashIdx >= 0) t = t.slice(0, hashIdx);
  const qIdx = t.indexOf("?");
  if (qIdx >= 0) t = t.slice(0, qIdx);
  return t.trim();
}

// Placeholders look like real paths but document a *shape*, not a *file*.
// Examples: `sessions/YYYY-MM-DD-NNN-arch-{slug}.md`, `brain/raw/reviews/<date>-<source>.md`.
function looksLikePlaceholder(token: string): boolean {
  if (/[<>{}]/.test(token)) return true;
  // Date-shape segments: YYYY, MM, DD, HH, NNN, MMMM, etc.
  if (/Y{2,}|M{2,}|D{2,}|H{2,}|N{3,}/.test(token)) return true;
  return false;
}

// Cache / state directories under ingest/ are gitignored by design (see /.gitignore).
// Mentions of `ingest/.llm-cache/...`, `ingest/.cache/...`, `ingest/.state/...`,
// `ingest/.run-state.json` document gitignored content; absence in the repo is expected.
function isKnownGitignored(token: string): boolean {
  return /^ingest\/\.[^/]+(\/|$)/.test(token);
}

// ============================================================================
// Report rendering
// ============================================================================

function renderReport(date: string, findings: Finding[], blocking: number, warnings: number): string {
  const out: string[] = [];
  out.push(`# Brain lint report ${date}`);
  out.push("");
  out.push("Generated by `npm run brain:lint`. Definitions: [`brain/wiki/workflows/lint.md`](../../wiki/workflows/lint.md).");
  out.push("");
  out.push("Summary:");
  out.push(`- Blocking findings: ${blocking}`);
  out.push(`- Warnings: ${warnings}`);
  out.push("");

  if (findings.length === 0) {
    out.push("No findings.");
    out.push("");
    return out.join("\n");
  }

  // Group by category in canonical order, then by severity (errors first)
  const byCategory = new Map<Category, Finding[]>();
  for (const f of findings) {
    const arr = byCategory.get(f.category) ?? [];
    arr.push(f);
    byCategory.set(f.category, arr);
  }

  for (const cat of CATEGORY_ORDER) {
    const items = byCategory.get(cat);
    if (!items || items.length === 0) continue;
    out.push(`## ${cat}`);
    out.push("");
    items.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
      if (a.file !== b.file) return a.file < b.file ? -1 : 1;
      return (a.line ?? 0) - (b.line ?? 0);
    });
    for (const f of items) {
      const loc = f.line !== undefined ? `${f.file}:${f.line}` : f.file;
      const tag = `[${f.severity}]`;
      out.push(`- ${tag} \`${loc}\` — ${f.message}`);
      if (f.evidence) out.push(`  - evidence: ${f.evidence}`);
      if (f.suggestion) out.push(`  - suggestion: ${f.suggestion}`);
    }
    out.push("");
  }

  return out.join("\n");
}

function compareFindings(a: Finding, b: Finding): number {
  const ai = CATEGORY_ORDER.indexOf(a.category);
  const bi = CATEGORY_ORDER.indexOf(b.category);
  if (ai !== bi) return ai - bi;
  if (a.severity !== b.severity) return a.severity === "error" ? -1 : 1;
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;
  return (a.line ?? 0) - (b.line ?? 0);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const cli = parseCli(process.argv.slice(2));
  const repoRoot = process.cwd();

  if (
    !existsSync(path.join(repoRoot, "package.json")) ||
    !existsSync(path.join(repoRoot, "brain"))
  ) {
    throw new Error(`brain-lint must be run from repo root (got cwd: ${repoRoot})`);
  }

  // Wiki pages
  const wikiAbs = await walkMd(path.join(repoRoot, "brain/wiki"));
  const wikiPages: ParsedFile[] = [];
  for (const abs of wikiAbs) wikiPages.push(await loadParsed(abs, repoRoot));

  // Raw subtrees
  const historicalAbs = await walkMd(path.join(repoRoot, "brain/raw/historical"));
  const historical: ParsedFile[] = [];
  for (const abs of historicalAbs) historical.push(await loadParsed(abs, repoRoot));

  const reviewsAbs = await walkMd(path.join(repoRoot, "brain/raw/reviews"));
  const reviews: ParsedFile[] = [];
  for (const abs of reviewsAbs) reviews.push(await loadParsed(abs, repoRoot));

  // Extra link-scan files
  const extraFiles: { absPath: string; relPath: string; content: string }[] = [];
  for (const rel of EXTRA_LINK_SCAN_FILES) {
    const abs = path.join(repoRoot, rel);
    if (!existsSync(abs)) continue;
    extraFiles.push({ absPath: abs, relPath: toFwd(rel), content: await fs.readFile(abs, "utf8") });
  }

  // Top-level files
  const topLevelFiles: { absPath: string; relPath: string; content: string }[] = [];
  for (const rel of TOP_LEVEL_LINK_SCAN_FILES) {
    const abs = path.join(repoRoot, rel);
    if (!existsSync(abs)) continue;
    topLevelFiles.push({ absPath: abs, relPath: toFwd(rel), content: await fs.readFile(abs, "utf8") });
  }

  // package.json scripts
  const pkgJsonRaw = await fs.readFile(path.join(repoRoot, "package.json"), "utf8");
  const pkgJson = JSON.parse(pkgJsonRaw) as { scripts?: Record<string, string> };
  const pkgScripts = new Set(Object.keys(pkgJson.scripts ?? {}));

  // Run all checks
  const findings: Finding[] = [];
  const brokenLinks = new Set<string>();

  findings.push(...checkFrontmatter(wikiPages));
  findings.push(...checkDecisionMetadata(wikiPages));
  findings.push(...checkSources(wikiPages, repoRoot));
  findings.push(...checkInternalLinks(wikiPages, extraFiles, topLevelFiles, repoRoot, brokenLinks));
  findings.push(...checkCatalogFreshness(wikiPages, repoRoot));
  findings.push(...checkOrphans(wikiPages, repoRoot));
  findings.push(...checkRawBanners(historical, reviews));
  findings.push(...checkStaleLowConfidence(wikiPages, cli.date));
  findings.push(...checkBrainSizeBudget(wikiPages));
  findings.push(...checkInlineDiffRawFields(wikiPages));
  findings.push(...checkStaleClaimSuspects(wikiPages, repoRoot, pkgScripts, brokenLinks));

  findings.sort(compareFindings);

  const blocking = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.filter((f) => f.severity === "warning").length;

  if (cli.write) {
    const outPath = path.join(repoRoot, "brain/outputs/lint", `${cli.date}.md`);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    const report = renderReport(cli.date, findings, blocking, warnings);
    await fs.writeFile(outPath, report, "utf8");
    process.stdout.write(`Wrote ${repoRel(outPath, repoRoot)}\n`);
  }

  process.stdout.write(`\nBrain lint — ${cli.date}\n`);
  process.stdout.write(`  Blocking findings: ${blocking}\n`);
  process.stdout.write(`  Warnings: ${warnings}\n`);
  if (findings.length > 0) {
    const tally = new Map<Category, { e: number; w: number }>();
    for (const f of findings) {
      const t = tally.get(f.category) ?? { e: 0, w: 0 };
      if (f.severity === "error") t.e++;
      else t.w++;
      tally.set(f.category, t);
    }
    process.stdout.write(`\n`);
    for (const cat of CATEGORY_ORDER) {
      const t = tally.get(cat);
      if (!t) continue;
      process.stdout.write(`  ${cat}: ${t.e} blocking, ${t.w} warning\n`);
    }
  }

  if (blocking > 0) process.exit(1);
  if (cli.strict && warnings > 0) process.exit(1);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.stack ?? err.message : String(err);
  process.stderr.write(`brain-lint: ${msg}\n`);
  process.exit(2);
});
