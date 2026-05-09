---
title: Session-end workflow
type: workflow
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../../sessions/archive/2026-05/2026-05-08-049-arch-karpathy-brain-atlas-reset.md
  - ../../../docs/agents/COWORK.md
  - ../../../docs/agents/SESSIONS.md
related:
  - ../decisions/karpathy-reset-2026-05-08.md
  - ../open-questions.md
  - ../project-state.md
  - ./cowork-session.md
  - ./ingest.md
  - ./lint.md
confidence: high
---

# Session-end workflow (Cowork's discipline post-CC-report)

> The single source of truth for what Cowork does *after* reading a Claude Code implementer report. Replaces the running `Infrastructure log` discipline that sat in `sessions/README.md` until brief 049 (Karpathy-Reset).

## Why this exists

Pre-049, "what changed since last session" lived in `sessions/README.md`'s Infrastructure-Log as chronological prose. That worked while the project was small but lost shape at ~20 entries: harder to find current state, easy to miss decision-implications, no link from a chronological note to the wiki page that synthesizes against it. Karpathy-Reset moves that discipline into structured updates against the wiki.

The session-end routine ensures every CC-report leaves the wiki in a **truthful, current, auditable** state before the next architect brief opens.

## Trigger

A CC-implementer report has landed in `sessions/YYYY-MM-DD-NNN-impl-<slug>.md` and is committed/pushed. Cowork has read it.

## Step 1 — Read the report

Not just the Summary. Read the report end-to-end. Look for:

- **What was actually built** vs. what the brief asked for.
- **Decisions CC made** during implementation (especially any deviations from the brief — these often carry information Cowork didn't have).
- **Surprises / blockers** — these often point at architectural truths the brief assumed wrong.
- **"For next session" / open items** — these are candidates for [`open-questions.md`](../open-questions.md).

Specifically watch for:

- New facts about the code that weren't true before (a function was renamed, an enum was added, a flag is no longer fired). These need to flow into wiki pages that mention the changed thing.
- New decisions implicit in the implementation (CC chose Library X over Y, or stubbed feature Z). These may deserve their own decision page.
- New constraints discovered (e.g. "Hardcover server blocks `_ilike`"). These belong as **constraints in the relevant wiki page** (e.g. `pipeline-state.md`) — not just buried in the report.

## Step 2 — Update `project-state.md`

If the implementation moved the project's state forward (a phase advanced, a feature shipped, a sub-stage completed), update [`project-state.md`](../project-state.md):

- Update the "Phase" / "Status snapshot" section.
- Update "What's running" if a new module/route landed.
- Update "Latest pipeline state" or equivalent if the pipeline change shipped.
- Update "Recently shipped" table with the new session row.
- Update "Next likely brief" if the implementation closed/opened decision points.

This page is the session-start anchor for Cowork/CC. Drift here is the most expensive drift.

## Step 3 — Prune `open-questions.md`

For each item in [`open-questions.md`](../open-questions.md):

- **Resolved by this implementation** → remove. Add a note in the relevant decision page or `project-state.md` if it was substantive.
- **Implementation surfaced new info** → update the item's body with the new finding (cite the report).
- **Implementation introduced new open items** → add as new numbered items at the bottom (with Owner / Sessions / Follow-up brief lines).

Don't let `open-questions.md` grow unboundedly. If an item has sat for 3+ sessions without movement, ask: is this still real, or has the project moved past it? Stale items dilute Cowork's queue-clarity.

## Step 4 — Write or update decisions (if needed)

If the implementation embodied a non-trivial design decision that wasn't already a decision page, write one:

- File path: `brain/wiki/decisions/<slug>.md`
- Frontmatter `type: decision` + `decision-date: YYYY-MM-DD`
- Body format: Context / Options considered / Decision / Why / When this decision should be revisited
- Link from `project-state.md` and from any related architecture/pipeline page

If an existing decision page is now stale (the situation changed), update its `updated` date and the body. **Don't delete or rewrite history** — past decisions are still part of the audit trail. If a decision is reversed, keep the original page and add a new one (`<slug>-reversed-YYYYMMDD.md` or in the same page under a new section).

## Step 5 — Update system pages if structural change

If the report changed:
- The schema → update [`architecture.md`](../architecture.md) (key tables, enums, decisions log link)
- The pipeline → update [`pipeline-state.md`](../pipeline-state.md) (modules, latest diff numbers, what's next)
- The roadmap (phase shipped, sub-phase added/closed) → update [`roadmap.md`](../roadmap.md)

These pages cite their sources in frontmatter. When you edit, update the `sources` array if a new session-report contributes facts.

## Step 6 — Handle external reviews

If the session involved an external code review (codex, gpt-5, external author), the artifact lands in [`brain/raw/reviews/<YYYY-MM-DD>-<source>.md`](../../raw/reviews/) verbatim with the `review-date / review-source / review-target` frontmatter. Lint findings from the review become items in [`open-questions.md`](../open-questions.md) (numbered as new items). Architectural findings worth their own decision page get a decision page.

The original review file is **immutable** — never edited after it lands.

## Step 7 — Update `wiki/index.md` and `wiki/log.md`

[`index.md`](../index.md) lists every wiki page with its `updated` date pulled from frontmatter. After your edits, regenerate or hand-edit the dates.

[`log.md`](../log.md) is append-only. Write a new entry at the bottom:

```markdown
## YYYY-MM-DD · Update · <short-title>

- Read: sessions/YYYY-MM-DD-NNN-impl-<slug>.md
- Updated wiki: project-state.md, pipeline-state.md, open-questions.md (-2, +1)
- New decision: decisions/<slug>.md (if any)
- Other: ...
```

The log is the operation history of Brain. It's how someone in 6 months can answer "when did we last touch project-state.md and why".

## Step 8 — Optional: Lint

If it's been a while (>1 week) since lint ran, or if you suspect drift, eyeball the [`./lint.md`](./lint.md) check list against the wiki. (Lint script lands in a follow-up brief; until then, manual checks.) File findings as `outputs/lint/YYYY-MM-DD.md`.

## What this workflow replaces

Pre-049 Cowork-Workflow:

- Read CC-report → write paragraph in `sessions/README.md` "Infrastructure log" → maybe edit `ROADMAP.md` if status changed → maybe edit `ARCHITECTURE.md` if schema shifted → write next architect brief
- Carry-over items accumulated in `sessions/README.md` "Carry-over" section
- Decisions lived as scattered ADR-blocks in `ARCHITECTURE.md` (`### YYYY-MM-DD — <title>`)

Post-049:

- Read CC-report → update `project-state.md` + `open-questions.md` + relevant other wiki pages → write/update decision page if applicable → log the operation → write next architect brief
- Carry-over items live in [`open-questions.md`](../open-questions.md), structured with Owner / Sessions / Follow-up
- Decisions are first-class wiki pages under [`decisions/`](../decisions/), each with revisit-trigger

## Time budget

Realistic per-session: 5–15 minutes for the routine, longer if structural change requires architecture/pipeline updates. If it's taking longer than that consistently, either the report was bigger than usual or a wiki page is too unwieldy and needs splitting.

If it's taking *less* than 5 minutes consistently, you're probably under-engaging — reports often carry latent decisions that aren't noticed on a quick read.
