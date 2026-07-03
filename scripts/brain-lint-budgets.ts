/**
 * brain-lint-budgets.ts — Always-read budget check (Brief 112 / Board 122-B7).
 *
 * The files read on EVERY session-start are a token tax paid before any work
 * happens. Brief 111 dieted them from a ~91k- to a ~18k-token floor; this check
 * keeps them from silently regrowing into append-logs. Budgets are measured in
 * CHARACTERS (token ≈ chars/4), not lines — the 2026-06-01 bloat hid in
 * ~1400-char lines that a line count would never have caught.
 *
 * Thresholds mirror `brain/CLAUDE.md` § "Always-read budgets" (the human-facing
 * single source; kept as constants here per the 112 recommendation — no
 * markdown parsing). Two-stage: soft → warning, hard → error (non-zero exit).
 *
 * Pure module (no fs, no process): `brain-lint.ts` binds the file reader; the
 * unit test (`test-brain-lint-budgets.ts`) injects fixture content. Extracted
 * from brain-lint.ts because that script runs `main()` at import time.
 */

export interface AlwaysReadBudget {
  /** Repo-relative path, forward slashes. */
  file: string;
  /** Warn above this many characters. */
  softChars: number;
  /** Error above this many characters. */
  hardChars: number;
}

/** Budget table from `brain/CLAUDE.md` § "Always-read budgets" (Brief 112). */
export const ALWAYS_READ_BUDGETS: ReadonlyArray<AlwaysReadBudget> = [
  { file: "brain/wiki/project-state.md", softChars: 25_000, hardChars: 45_000 },
  { file: "brain/wiki/open-questions.md", softChars: 16_000, hardChars: 28_000 },
  { file: "sessions/README.md", softChars: 14_000, hardChars: 24_000 },
  { file: "brain/wiki/index.md", softChars: 24_000, hardChars: 36_000 },
];

export const OPEN_QUESTIONS_FILE = "brain/wiki/open-questions.md";

/** The next-brief queue is deliberately small (3–5 items); warn above this. */
export const OPEN_QUESTIONS_MAX_OPEN = 5;

export interface AlwaysReadFinding {
  severity: "error" | "warning";
  file: string;
  message: string;
  suggestion?: string;
}

const PRUNE_SUGGESTION =
  "Prune to current-state-only (history → wiki/log.md + git + sessions/archive/); " +
  "see brain/CLAUDE.md § Always-read budgets.";

/**
 * Count OPEN items in open-questions.md. An item header is a line starting
 * with `**(N)` (today's format) or a `## (N)` heading (the Brief-112 form),
 * and it counts as open unless the line is struck through (`~~`).
 */
export function countOpenItems(content: string): number {
  let open = 0;
  for (const line of content.split(/\r?\n/)) {
    if (!/^(\*\*|##\s*)\(\d+\)/.test(line)) continue;
    if (line.includes("~~")) continue; // struck-through = closed
    open += 1;
  }
  return open;
}

const approxTokens = (chars: number): number => Math.round(chars / 4);

/**
 * Run the budget check. `readContent` returns a file's full content by
 * repo-relative path, or null when the file does not exist (an always-read
 * file that is missing is itself an error — the session-start read order
 * depends on it).
 */
export function checkAlwaysReadBudgets(
  readContent: (relPath: string) => string | null,
): AlwaysReadFinding[] {
  const findings: AlwaysReadFinding[] = [];

  for (const budget of ALWAYS_READ_BUDGETS) {
    const content = readContent(budget.file);
    if (content === null) {
      findings.push({
        severity: "error",
        file: budget.file,
        message: "always-read file is missing — the session-start read order depends on it",
      });
      continue;
    }
    const chars = content.length;
    if (chars > budget.hardChars) {
      findings.push({
        severity: "error",
        file: budget.file,
        message:
          `${chars} chars (≈${approxTokens(chars)} tok) exceeds the HARD always-read budget ` +
          `of ${budget.hardChars} chars (soft ${budget.softChars})`,
        suggestion: PRUNE_SUGGESTION,
      });
    } else if (chars > budget.softChars) {
      findings.push({
        severity: "warning",
        file: budget.file,
        message:
          `${chars} chars (≈${approxTokens(chars)} tok) exceeds the soft always-read budget ` +
          `of ${budget.softChars} chars (hard ${budget.hardChars})`,
        suggestion: PRUNE_SUGGESTION,
      });
    }

    if (budget.file === OPEN_QUESTIONS_FILE) {
      const open = countOpenItems(content);
      if (open > OPEN_QUESTIONS_MAX_OPEN) {
        findings.push({
          severity: "warning",
          file: budget.file,
          message:
            `${open} open items in the next-brief queue; the queue is deliberately ` +
            `small (3–5, warn above ${OPEN_QUESTIONS_MAX_OPEN})`,
          suggestion:
            "Land items in a brief or move dormant ones to wiki/deferred-questions.md.",
        });
      }
    }
  }

  return findings;
}
