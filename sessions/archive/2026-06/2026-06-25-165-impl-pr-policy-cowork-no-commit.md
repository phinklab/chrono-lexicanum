---
session: 2026-06-25-165
role: implementer
date: 2026-06-25
status: complete
slug: pr-policy-cowork-no-commit
parent: 2026-06-25-165
links: []
commits: []
---

# PR policy reset — Cowork never commits; fix the red `brain:lint` on `main`

## Summary

Fixed the 2 `brain:lint` blocking findings so `npm run brain:lint -- --no-write` exits 0, and bundled the whole policy change into one coordination-worktree PR (Cowork's policy-doc edits + the brief + the lint fix + this report + the rollups Cowork left uncommitted). The one fact Cowork needs: the new "Cowork never runs `git`; CC commits everything in a reviewed PR; no direct-to-`main`" model held for this very session — Cowork pushed nothing, CC created the branch, committed, and opened the PR.

## What I did

- `brain/wiki/decisions/book-reviewer-no-apply-path.md` — added the missing `decision-date: 2026-06-24` field (the *Decision metadata* blocking finding). Placed after `confidence`, matching the sibling ADRs' convention.
- `brain/wiki/index.md` — updated the `roadmap.md` catalog row's `Updated` column `2026-06-12 → 2026-06-24` to match the page's frontmatter `updated` (the *Catalog freshness* blocking finding).
- `.github/workflows/ci.yml` — rewrote the stale top comment. It still asserted "doc-only commits land directly on main"; under Brief 165 that path is gone, so the comment now describes the `push: main` trigger as a post-165 defense-in-depth safety net. Both triggers (`pull_request` + `push: main`) kept; no job/step change.
- `brain/outputs/lint/2026-06-25.md` — regenerated clean (0 blocking, 15 warnings) so the committed report reflects the fixed state, not the pre-fix run.
- Committed Cowork's uncommitted policy/rollup edits as-is (the deliverable of this PR): `CLAUDE.md`, `AGENTS.md`, `brain/wiki/workflows/cowork-session.md`, `brain/wiki/workflows/cc-session.md`, `brain/wiki/workflows/sessions-format.md`, `brain/wiki/log.md`, `sessions/README.md`, and the brief `sessions/2026-06-25-165-arch-pr-policy-cowork-no-commit.md`.
- `.gitignore` — included Cowork's `/presentation/` hygiene line (scope judgment below).
- Flipped this brief's `status: open → implemented` (in the commit, per the new contract).

## Decisions I made

- **`decision-date: 2026-06-24`, not an invented earlier date.** The page's `created`/`updated` are both 2026-06-24 and `git log` shows it was authored in commit `70356c5` (the 2026-06-24 coordination pass). The two sibling ADRs (`faction-policy.md`, `location-policy.md`) both set `decision-date == created`, so 2026-06-24 is the house-consistent, non-invented choice. (It also satisfies the linter's `decision-date <= updated` rule.)
- **Kept the inline "Status-Snapshot 2026-06-12" in the roadmap catalog row; only bumped the `Updated` column.** `roadmap.md`'s `updated` moved to 2026-06-24 because Brief 164 added "One-Faction-One-Book" to the Ideas Backlog (commit `0eaa203`) — a backlog edit, not a phase-status re-snapshot. Bumping the inline snapshot date would falsely imply the phase status was re-evaluated on the 24th. The linter only checks the trailing date (the `Updated` column), which now matches.
- **Fixed the data, did not weaken the linter** — `scripts/brain-lint.ts` untouched, per the brief.
- **Updated `ci.yml`'s comment (the brief left this optional).** The old comment didn't just describe the trigger, it asserted the now-removed "doc-only → direct to main" policy as fact — a surviving contradiction the acceptance criterion targets. Updating it was the cleaner call than leaving a stale rationale in a tracked file. Kept both triggers and the `pull_request` trigger explicitly (brief: do not remove it).
- **Included `.gitignore`'s `/presentation/` line** even though `.gitignore` isn't `*.md`. It's a self-contained, zero-risk hygiene rule (keeps Cowork's local explainer decks out of git), it was already in this coordination batch's working tree, and the brief's "no `src/`/`scripts/`" constraint targets functional code/data, not ignore rules. Leaving it dangling would force a future near-empty PR, contradicting the brief's fewer-PRs goal. Flagging it here for visibility — drop it from the PR if you'd rather keep this bundle strictly docs.
- **Left `scripts/seed-data/source/Warhammer_map_SSOT.xlsx` untracked.** It's a Batches-strand data artifact under `scripts/` — out of this meta session's scope (and likely belongs to the P14 Map worklist). Not staged.
- **Committed the lint report.** Prior reports are tracked (`2026-05-19/-23`, `2026-06-11/-14`); a clean post-fix report is the natural evidence for a lint-fix session.

## Verification

- `npm run brain:lint -- --no-write` — **exits 0**, 0 blocking findings, 15 warnings (all explicitly out of scope: 1 inline-diff, 3 size-budget, 3 stale-claim, 8 faction-policy).
- Confirmed both original blocking findings are gone by reading the regenerated report (`brain/outputs/lint/2026-06-25.md`).
- No `src/` / `scripts/` / TS changes, so `lint` / `typecheck` / `check:eras` are unaffected vs. `origin/main`; the red `main` was `brain:lint`-only (per the brief). `ci.yml` edit is a comment only — YAML structure unchanged.

## Open issues / blockers

None. CI's `brain:lint` gate is green; remaining checks are unaffected by doc-only edits.

## For next session

- **The brief's open question (brief living in a strand worktree):** in this case the copy step was a non-issue — this was a coordination-worktree meta session, so the brief already lived where it was implemented; no cross-worktree copy was needed. The awkwardness the brief anticipates only bites a *strand* implementer picking up a coordination-worktree brief; for meta/coordination work the current setup is clean.
- **16 `brain:lint` warnings remain** (size budget on `pipeline-state.md`/`location-policy.md`/`faction-policy.md`; 3 stale-claim path suspects; 8 faction-policy `parent: null` browse-root entries; 1 inline-diff mention in `log.md`). Out of scope here — a separate hygiene/Ingest pass, as the brief noted.
- **`.gitignore` scope precedent:** if the bundle should stay strictly `*.md` + `ci.yml`, decide whether the `/presentation/` line rides coordination PRs like this one or needs its own home.

## References

- `scripts/brain-lint.ts` — `checkDecisionMetadata` (decision-date rule) + `checkCatalogFreshness` (catalog `Updated` == frontmatter `updated`).
- `git log --follow brain/wiki/decisions/book-reviewer-no-apply-path.md` → `70356c5` (2026-06-24), and `git log brain/wiki/roadmap.md` → `0eaa203` (Brief 164 Ideas-Backlog edit).
