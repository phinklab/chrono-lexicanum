---
session: 2026-05-09-051
role: implementer
date: 2026-05-09
status: complete
slug: brain-slim-pass
parent: 2026-05-09-051
links:
  - 2026-05-09-050
  - 2026-05-08-049
  - 2026-05-09-049
commits: []
---

# Brain Slim Pass — Implementer Report

## Summary

Six docs/brain/sessions slim-fields executed: `sessions/README.md` rewritten thin, 22 closed Phase-3 sessions archived (and three stale `status: open` corrected), `docs/agents/*` reduced to redirect stubs, two ADRs cut, `open-questions.md` split into Queue + Deferred + sub-phase backlog, ingest-diff retention policy documented. Zero code / pipeline / DB / migration changes.

## What I did

- `sessions/README.md` — rewritten from ~30-row active-threads table + 5-entry infra-log + paragraphed carry-over to ~25 lines: quick-reference, three pointer bullets, 2-row active-threads (only 050 + 051).
- `sessions/2026-05-02-034-arch-phase3a-bulk-backfill-skeleton.md` — frontmatter `status: open` → `implemented`.
- `sessions/2026-05-03-038-arch-phase3c-llm-enrichment.md` — frontmatter `status: open` → `implemented`.
- `sessions/2026-05-05-045-arch-cc-vs-pipeline-comparison.md` — frontmatter `status: open` → `answered`.
- `git mv` of 22 closed Phase-3 sessions from `sessions/` root to `sessions/archive/2026-05/`: 031, 032, 034, 035, 036, 037, 038, 039, 040, 041, 042, 043, 044 (arch + impl), 045 (arch + impl), 047 (arch + impl), 048 (arch + impl), 049 (arch + impl).
- `brain/wiki/workflows/sessions-format.md` — new "Archiving" subsection capturing the post-051 archive rule (root holds only open / `needs-decision` briefs and at most the last 1–2 just-closed sessions; archive promptly, don't wait for phase-wrap). Per-move discipline added (grep brain wiki + sessions/README + CLAUDE.md + docs). Naming-example pair refreshed (049 → 050/051) + reply-pair note. Sources frontmatter adds 051-arch.
- `docs/agents/COWORK.md` — long-form architect contract (~110 lines) → 11-line redirect stub pointing at `brain/wiki/workflows/cowork-session.md` + git-history pointer.
- `docs/agents/CLAUDE_CODE.md` — long-form implementer contract → 11-line redirect stub pointing at `brain/wiki/workflows/cc-session.md` + git-history pointer.
- `docs/agents/SESSIONS.md` — session-format reference → 7-line redirect stub pointing at `brain/wiki/workflows/sessions-format.md`.
- `CLAUDE.md` (top-level) — read-order intro now points at `brain/wiki/workflows/*` instead of `docs/agents/*`. Repo-layout `docs/agents/*` annotations updated to "legacy redirect (post-051 stub)". The "Workflow at a glance" reference + the "See COWORK.md § Version pinning is forbidden" reference both repointed to brain workflows. Stack reference fixed: `sessions/2026-04-28-001-arch-bootstrap.md` → `sessions/archive/2026-04/2026-04-28-001-arch-bootstrap.md`. Karpathy-Reset reference moved to archive path.
- `brain/CLAUDE.md` — new "ADR shape" section before frontmatter convention: Context / Decision / Why / Revisit triggers; what NOT to put in ADRs (running batch numbers → `pipeline-state.md`, chronology → session logs); ~80-line drift threshold.
- `brain/wiki/decisions/karpathy-reset-2026-05-08.md` — cut from ~94 lines to ~46. Kept Context / Decision / Why / Revisit. Dropped four-paragraph rejected-options narrative and the "Initial concrete decisions resolved during 049" eight-item list (folded as a one-paragraph implementation pointer at the end). Sources path updated to archive.
- `brain/wiki/decisions/why-haiku-not-sonnet.md` — cut from ~70 lines to ~46. Dropped detailed Aftermath narrative + chronological table. Kept Context / Decision / Why / Revisit triggers. Sources paths updated to archive.
- `brain/wiki/open-questions.md` — reduced from 11 numbered items to 5 actionable: (1) Phase-3e Modell-Entscheidung, (2) Vokabular-Erweiterung, (3) Hand-Check-Workflow, (4) Anthologie-Re-Test (was 10), (5) Lexicanum Junction-Lücke (was 11). Migration note records pre-051 / post-051 split. Sources paths updated to archive.
- `brain/wiki/deferred-questions.md` — new page. Catches dormant items lifted from the original queue: `secondary_era_ids`, redirect-307-mechanism, Sonnet-`no_rating_found`-flag, `series_total_mismatch` observation, cost-tuning mini-brief, distant Phase-3+ engine-erweiterungen (lexicanum apiSearchFallback, OL Format/Availability heuristic, engine-friction findings from 037). Each item carries a "Promote when:" trigger.
- `brain/wiki/pipeline-state.md` — new "Sub-phase backlog (concrete to-dos)" section absorbing the original open-questions item 9 (3d / 3e / 3f reminders organized per sub-phase). New "Ingest-diff retention" section documenting the policy (acceptance diffs stay; throwaway diffs may leave in a future cleanup; per-batch payloads may eventually move to a cold-store keeping summary blocks). Hard rule: no committed `ingest/.last-run/*.diff.json` may be deleted until the dashboard read-path has been audited (separate dashboard-brief is the prerequisite for any retention sweep). Cross-link numbers in "What's next on the pipeline axis" updated to match the new open-questions numbering (10/11 → 4/5). Sources paths updated to archive.
- `brain/wiki/index.md` — added `deferred-questions.md` row under Overview; `open-questions.md` description refreshed to mention the post-051 split.
- `brain/wiki/log.md` — new entry "2026-05-09 · Slim · Brain Slim Pass (Brief 051)" listing all touched pages, the sub-phase migration of item 9, the ingest-retention policy, and the out-of-scope items. The 050-Hygiene-Pass log link to `2026-05-09-049-impl-...` updated to archive path.
- Frontmatter `sources:` archive-path fixes across `brain/wiki/`: `book-data-overview.md`, `glossary.md`, `onboarding.md`, `project-state.md`, `pipeline-state.md`, `decisions/no-goodreads.md`, `decisions/why-bulk-backfill.md`, `decisions/why-multi-source-merge.md`, `workflows/atlas-regen.md`, `workflows/ingest.md`, `workflows/query.md`, `workflows/session-end.md`, `workflows/lint.md`. Body links in `decisions/no-goodreads.md`, `decisions/why-bulk-backfill.md`, `decisions/why-multi-source-merge.md` Status-line also repointed to archive paths.
- `docs/ui-backlog.md` — pre-existing stale path `sessions/2026-05-02-022-impl-rich-seed-2b.md` repointed to `sessions/archive/2026-05/...`.
- `docs/data/2b-book-roster.md` — pre-existing stale path `sessions/2026-05-02-023` repointed to `sessions/archive/2026-05/...-arch-era-anchor.md`.

## Decisions I made

- **Did not snapshot pre-051 `docs/agents/*`** into `brain/raw/historical/2026-05-09-pre-051-slim/`. Started to (the snapshot folder was created and banners drafted), but Philipp said historicals don't need to be checked. Removed the folder. Pre-slim long-form contracts live in git history; the redirect stubs say so. Brain workflows already carry the operational rules (`cowork-session.md`, `cc-session.md`, `sessions-format.md`).
- **Status-fix on 045 → `answered`**, not `implemented`. 045 was a measurement / comparison brief (Sonnet-Quadrant of the comparison matrix), not a code-implementation brief. The README's pre-existing `answered` tag for that row was already the correct lifecycle slot.
- **050-arch stays at `sessions/` root.** It's the just-closed parent of 051. Per the new archive rule (root holds at most the last 1–2 just-closed sessions), 050 belongs at root until 052 lands. There is no `050-impl` session file — the hygiene work was committed directly in seven commits without a paired report.
- **Did not edit body text inside archived session logs** even where their inline path references are now stale (e.g. inside 022-impl, 023-arch, 048-arch). Brief constraint: "Session-Logs dürfen verschoben und Frontmatter-Statuswerte korrigiert werden, aber nicht inhaltlich umgeschrieben." The path-references inside archives stay as historical artefacts.
- **Did not edit `brain/wiki/log.md`'s historical "Read (raw sources)" list inside the 049-Karpathy-Reset entry** even though those inline-code paths now point at archived locations. The entry describes what was true at 049 time — accurate as a historical record. The append-only log discipline argues for leaving past entries verbatim.
- **Did not edit `brain/raw/historical/`** at all (per brief constraint). The line-of-prose path reference in `2026-05-08-pre-reset/ROADMAP.md` remains stale by design.
- **Did not edit example-content in `brain/wiki/workflows/lint.md`** that mentions `sessions/2026-05-04-040-arch-phase3c-haiku-switch.md`. It's a hypothetical lint-report example, not a navigation link, and updating it would dilute the teaching content. (Mildly amusing aside: the example happens to describe exactly the kind of drift this slim pass corrected for real.)
- **`open-questions.md` keeps 5 items, not 3.** Brief said "3–5 unmittelbar handlungsrelevant"; chose 5 because items (1) Modell-Entscheidung, (2) Vokabular, (3) Hand-Check, (4) Anthologie-Re-Test, (5) Lexicanum-Junctions are all genuinely brief-near. Nothing dormant snuck in.
- **`pipeline-state.md` absorbs item 9's sub-phase reminders, not `open-questions.md` and not `deferred-questions.md`.** They aren't questions — they're concrete to-dos waiting for the matching sub-phase brief. Pipeline-state was already the home for sub-phase milestones; the sub-phase backlog sits naturally next to "What's next on the pipeline axis".
- **Ingest-retention policy = document, don't delete.** Brief explicitly forbade deleting existing `.last-run/` diffs (dashboard read-path is coupled). Documented the policy + put a hard rule in the page that any retention sweep needs a separate dashboard-brief first. No diffs deleted in this session.
- **Sub-section depth in `cowork-session.md` / `cc-session.md` not expanded** even though the docs/agents/* stubs lost the long-form Version-Pinning-Forbidden and Concrete-Version-Research detail. Brain workflows already cover the operational essentials; the long-form table + bootstrap example are nice-to-have but not load-bearing per CLAUDE.md's own Version-policy block, and they remain in git history.

## Verification

- `git status` — 47 modified / renamed / new files; no stray untracked artefacts beyond the 051-impl report. All 22 session moves recorded as `R` (renames), preserving git blame. `sessions/.claude/` is gitignored noise (not tracked).
- `git diff --stat` — net subtraction in `sessions/README.md` (-194 / +20), `brain/wiki/decisions/karpathy-reset-2026-05-08.md` (-87 / +43), `brain/wiki/decisions/why-haiku-not-sonnet.md` (-65 / +43), `docs/agents/COWORK.md` (-110 / +11), `docs/agents/CLAUDE_CODE.md` (-99 / +12), `docs/agents/SESSIONS.md` (-138 / +9). Net additions in `brain/wiki/deferred-questions.md` (+88), `brain/wiki/pipeline-state.md` (+45), `brain/wiki/log.md` (+30).
- Path audit (Grep over `sessions/2026-05-(02|03|04|05|08|09)-(031–049)-[a-z]` across `brain/`, top-level Markdown, `docs/`): clean except inside archived session bodies (intentionally untouched), inside `brain/raw/historical/` (out of scope), and the historical "Read (raw sources)" list in `brain/wiki/log.md`'s 049 entry (deliberately left as a historical record).
- No app / pipeline / DB / migration files in the diff (verified via `git diff --stat`). No `next.config.ts` / `package.json` / `src/` / `scripts/` / `drizzle.config.ts` touch.
- `npm run lint` / `tsc --noEmit` not run — docs/brain-only diff, no TypeScript / lint surface affected.

## Open issues / blockers

None. Brief landed clean.

## For next session

- **Brief 052 — `brain:lint` script.** Originally queued by 050-arch; deferred from 051 per "Out of scope". Now that the structural slimming is done, the lint script has a stable target tree and a sensible policy file (the new "ADR shape" rule and the "Archive rule" should both be checkable). The hypothetical-example path drift in `brain/wiki/workflows/lint.md:42` will retire when the script lands.
- **Pre-051 `docs/agents/*` long-form rules in git history only.** If a future cosmetic pass wants to re-surface (say) the bootstrap-version-pinning historical example or the don't-write/write-instead table, the cleanest move is to fold the wanted bit into `decisions/why-drizzle-supabase.md`'s "Aftermath" section or into `cowork-session.md` directly. Watch for a "where's that exact wording from COWORK.md" question in a future Cowork chat — that's the trigger.
- **`brain/wiki/log.md` "Read (raw sources)" lists inside historical entries.** The discipline-question of whether append-only log entries should retroactively repath their inline references is unresolved. Today the choice is "no, accuracy of the historical moment trumps navigation", but a future Cowork brief could reverse it. Not blocking.
- **Distant retention sweep** (after dashboard becomes manifest-driven). Once a future dashboard-brief decouples the read-path from "enumerate `ingest/.last-run/`", the retention policy in `pipeline-state.md` permits moving per-book payloads to a cold-store. Not worth scheduling until pipeline pressure makes it warranted.

## References

- Brief 051: `sessions/2026-05-09-051-arch-brain-slim-pass.md`
- Predecessor 050 (Hygiene): `sessions/2026-05-09-050-arch-brain-hygiene-pass.md` (commits `e220e9f` … `f80aa16`).
- Karpathy-Reset 049: `sessions/archive/2026-05/2026-05-08-049-arch-karpathy-brain-atlas-reset.md` + `sessions/archive/2026-05/2026-05-09-049-impl-karpathy-brain-atlas-reset.md`.
- Brain schema (ADR shape rule lives here now): `brain/CLAUDE.md`.
- Karpathy gist: <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>; Starmorph implementation guide: <https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide>.
