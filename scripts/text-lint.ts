/**
 * text-lint — bans the em-dash (U+2014) in user-facing site text.
 *
 * Scans string literals, template-literal text parts, and JSX text under
 * src/ — i.e. the strings that actually render in the browser. Comments are
 * deliberately exempt: they never render, and rewriting them is cosmetic
 * churn. Content JSONs (scripts/seed-data/, book synopses) are the step-2
 * content pass and stay out of scope until that lands; src/lib/ingestion/
 * is internal LLM tooling (prompts, plans), not site text.
 *
 * Why ban the em-dash at lint level instead of a one-off cleanup: every
 * LLM-generated text (weekly refresh, new books, translations) re-imports
 * it. The rule only holds if CI enforces it. Replacements are editorial —
 * split the sentence, use a comma, colon or parentheses — never a bare "-".
 *
 * Suppress a deliberate use with `text-lint-allow` in a comment on the
 * same line as the offending string.
 *
 * Run: `npm run text:lint`
 * CLI: --help   print usage
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import ts from "typescript";

// ============================================================================
// Scope — single edit point.
// ============================================================================

const SCOPE_ROOT = "src";

/** Repo-relative posix prefixes excluded from the scan. */
const EXCLUDED_PREFIXES: ReadonlyArray<string> = [
  // Internal LLM tooling (podcast ingest prompts/plans) — not site text.
  // Joins the step-2 content pass together with scripts/seed-data/.
  "src/lib/ingestion/",
];

const SCANNED_EXTENSIONS = new Set([".ts", ".tsx"]);

const EM_DASH = "—";
const SUPPRESS_TOKEN = "text-lint-allow";

// ============================================================================
// File collection
// ============================================================================

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function collectFiles(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = toPosix(full);
    if (statSync(full).isDirectory()) {
      collectFiles(full, out);
      continue;
    }
    if (!SCANNED_EXTENSIONS.has(path.extname(entry))) continue;
    if (EXCLUDED_PREFIXES.some((prefix) => rel.startsWith(prefix))) continue;
    out.push(full);
  }
}

// ============================================================================
// Scan
// ============================================================================

interface Violation {
  file: string;
  line: number; // 1-based
  column: number; // 1-based
  context: string;
}

function isTextBearing(node: ts.Node): node is ts.LiteralLikeNode {
  return (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    node.kind === ts.SyntaxKind.TemplateHead ||
    node.kind === ts.SyntaxKind.TemplateMiddle ||
    node.kind === ts.SyntaxKind.TemplateTail ||
    ts.isJsxText(node)
  );
}

function lineOf(sourceFile: ts.SourceFile, offset: number): { line: number; column: number } {
  const pos = sourceFile.getLineAndCharacterOfPosition(offset);
  return { line: pos.line + 1, column: pos.character + 1 };
}

function contextSnippet(raw: string, offset: number): string {
  const start = Math.max(0, offset - 30);
  const end = Math.min(raw.length, offset + 31);
  const snippet = raw.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${snippet}${end < raw.length ? "…" : ""}`;
}

function scanFile(file: string): Violation[] {
  const raw = readFileSync(file, "utf8");
  // Cheap pre-filter: parsing every clean file would dominate the runtime.
  if (!raw.includes(EM_DASH)) return [];

  const rel = toPosix(file);
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(rel, raw, ts.ScriptTarget.Latest, true, kind);
  const lines = raw.split(/\r?\n/);
  const violations: Violation[] = [];

  function record(offset: number): void {
    const { line, column } = lineOf(sourceFile, offset);
    if (lines[line - 1]?.includes(SUPPRESS_TOKEN)) return;
    violations.push({ file: rel, line, column, context: contextSnippet(raw, offset) });
  }

  function visit(node: ts.Node): void {
    if (isTextBearing(node) && node.text.includes(EM_DASH)) {
      // Locate occurrences in the raw source slice so line/column point at
      // the character itself. Falls back to the node start for escaped
      // spellings (—) that only exist in the cooked text.
      const nodeStart = node.getStart(sourceFile);
      const slice = raw.slice(nodeStart, node.getEnd());
      let idx = slice.indexOf(EM_DASH);
      if (idx === -1) {
        record(nodeStart);
      } else {
        while (idx !== -1) {
          record(nodeStart + idx);
          idx = slice.indexOf(EM_DASH, idx + 1);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  if (process.argv.includes("--help")) {
    console.log(
      "text-lint: bans the em-dash (U+2014) in rendered site text\n" +
        `(string literals, template text, JSX text) under ${SCOPE_ROOT}/.\n` +
        `Suppress a deliberate use with a \`${SUPPRESS_TOKEN}\` comment on the same line.`,
    );
    return;
  }

  const files: string[] = [];
  collectFiles(SCOPE_ROOT, files);

  const violations = files.flatMap(scanFile);

  if (violations.length === 0) {
    console.log(`text-lint OK (0 violations, ${files.length} files scanned)`);
    return;
  }

  for (const v of violations) {
    console.log(`${v.file}:${v.line}:${v.column}  [em-dash]  ${v.context}`);
  }
  const fileCount = new Set(violations.map((v) => v.file)).size;
  console.error(
    `\ntext-lint FAILED: ${violations.length} em-dash occurrence(s) in ${fileCount} file(s). ` +
      "Rewrite the sentence (comma, colon, parentheses or a split); do not substitute a bare hyphen.",
  );
  process.exitCode = 1;
}

main();
