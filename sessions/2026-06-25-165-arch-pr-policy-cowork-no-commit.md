---
session: 2026-06-25-165
role: architect
date: 2026-06-25
status: implemented
slug: pr-policy-cowork-no-commit
parent: null
links: []
commits: []
---

# PR policy reset — Cowork never commits; fix the red `brain:lint` on `main`

## Goal

Make `main` green again and cut the flood of Cowork-initiated pushes: adopt the new commit policy (Cowork writes files, CC commits them; no direct-to-`main`) and fix the 2 `brain:lint` blocking findings that currently fail CI.

## Context

- **Why now.** Philipp's experience: too many commits/PRs. The earlier workaround — pushing doc-only commits straight to `main` — tripped the `push: branches:[main]` CI gate. The most recent `npm run brain:lint -- --no-write` on `main` exits 1 with **2 blocking findings**: 1 × *Decision metadata*, 1 × *Catalog freshness* (the other lines — 16 warnings — are not blocking).
- **The policy is already rewritten by Cowork** (uncommitted in this worktree, part of this PR): `CLAUDE.md` § Git → "PR policy", `AGENTS.md` § PR policy + worktree protocol, `brain/wiki/workflows/cowork-session.md` (§ PR policy + step 8 + post-CC-report pass), `cc-session.md` (§ PR policy + session-start steps 1/3). New rule in one line: **Cowork never runs `git`**; its briefs + `brain/**` + `sessions/README.md` edits sit uncommitted until **CC commits them inside a PR**; **no direct-to-`main`**.
- **This is a coordination-worktree, meta session.** Work in `chrono-lexicanum` on `codex/session-165-pr-policy`. Everything here is `brain/**` / top-level docs / `sessions/**` / optionally `.github/` — one PR.

## Tasks

1. **Fix the 2 `brain:lint` blocking findings** so `npm run brain:lint -- --no-write` exits 0.
   - Run it, read the two `error`-severity findings (categories *Decision metadata* and *Catalog freshness*); the linter prints the offending `file` per finding.
   - *Decision metadata*: a `type: decision` page is missing or has an invalid `decision-date`, or its `decision-date` is later than `updated`. Fix that page's frontmatter — use the page's **real** decision date (from its body / git history), don't invent one.
   - *Catalog freshness*: `index.md` is out of sync with the wiki tree (a page exists that `index.md` doesn't list, or it lists a moved/removed page). Reconcile `index.md`.
   - Fix the **data**, don't weaken the linter to silence the finding.
2. **Commit the whole bundle in one PR** from the coordination worktree: Cowork's policy-doc edits (above) + this brief + the lint fix + your impl report. Flip this brief's `status: open → implemented` inside that PR.
3. **`ci.yml` `push: branches:[main]` trigger** is now pure defense-in-depth (direct-to-`main` is gone). Keeping it is fine — your call. If you keep it, optionally update its top comment to note it's a post-165 safety net. **Do not remove the `pull_request` trigger.**

## Constraints

- The new policy holds for **this very session**: Cowork pushed nothing. You create the branch, commit, push, open the PR; Philipp merges.
- `npm run brain:lint -- --no-write` green before the PR.
- Touch only `brain/**`, top-level `*.md`, `sessions/**`, and (optionally) `.github/workflows/ci.yml`. No `src/` / `scripts/` changes.

## Out of scope

- Don't chase the 16 warnings (size budget, faction policy, stale-claim suspects, inline-diff) — that's a separate hygiene pass.
- Don't refactor `scripts/brain-lint.ts`.
- Don't touch Brief 164 (the open Ask-tuning draft).

## Acceptance

The session is done when:

- [ ] `npm run brain:lint -- --no-write` exits 0 (0 blocking findings).
- [ ] CI is green on the PR.
- [ ] The policy docs (`CLAUDE.md`, `AGENTS.md`, `cowork-session.md`, `cc-session.md`) are committed in this PR and internally consistent — no surviving "doc-only → commit straight to `main`" instruction anywhere.
- [ ] This brief is committed with `status: implemented`.

## Open questions

- Worth a follow-up: should the brief physically *live* in a strand worktree when Philipp knows up front which strand will implement it (saves CC the cross-worktree copy)? For now CC reads it from the coordination worktree and copies it into its branch. Note in your report if the copy step is awkward in practice.

## Notes

- The two blocking findings are best pinned by running the linter — it names the file for each. Likely a recently-touched decision page (`decision-date`) + `index.md` freshness.
- Policy rationale lives in `CLAUDE.md` § Git → "PR policy" (authoritative). This brief is the decision record; no separate decision page (avoids adding a fresh `type: decision` file that would itself need a clean `decision-date` and an `index.md` entry mid-lint-fix).
