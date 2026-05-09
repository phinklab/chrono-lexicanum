---
title: Session log format
type: workflow
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../../docs/agents/SESSIONS.md
  - ../../../sessions/_templates/architect-brief.md
  - ../../../sessions/_templates/implementer-report.md
  - ../../../sessions/2026-05-09-051-arch-brain-slim-pass.md
related:
  - ./cowork-session.md
  - ./cc-session.md
confidence: high
---

# Session log format

> Sessions are how Cowork (architect) and Claude Code (implementer) hand work back and forth. Every session is a single Markdown file under `sessions/`. They are committed to git — they ARE the project history.

## Naming

```
sessions/YYYY-MM-DD-NNN-{role}-{slug}.md
```

| Part | Rule |
|---|---|
| `YYYY-MM-DD` | Date the session was opened, NOT modified. |
| `NNN` | Three-digit sequence, monotonically increasing across the project (NOT reset daily). Pad with leading zeros. |
| `role` | `arch` (architect, written by Cowork) or `impl` (implementer, written by Claude Code). |
| `slug` | Short kebab-case topic. Re-use the slug from the brief when writing the report — pairs are easy to spot. |

Examples:

```
sessions/2026-04-28-001-arch-bootstrap.md
sessions/2026-04-28-002-arch-phase-1-handoff.md
sessions/2026-04-28-003-impl-phase-1-handoff.md     ← reply to 002
sessions/2026-05-09-050-arch-brain-hygiene-pass.md
sessions/2026-05-09-051-arch-brain-slim-pass.md
```

(Reply pairs share `NNN` and `slug`: e.g. `002-arch-phase-1-handoff.md` + `003-impl-phase-1-handoff.md`. Old pairs migrate together to `sessions/archive/YYYY-MM/` once both sides are closed.)

## Frontmatter

Every session starts with YAML frontmatter:

```yaml
---
session: 2026-04-28-002
role: architect            # architect | implementer
date: 2026-04-28
status: open               # open | answered | implemented | needs-decision | archived
slug: phase-1-handoff
parent: null               # session id this responds to (null for new threads)
links:                     # other sessions referenced
  - 2026-04-28-001
commits: []                # git commit hashes produced by this session
---
```

### `status` values

| Value | When |
|---|---|
| `open` | Written, waiting for the other side. Default for a fresh architect brief. |
| `implemented` | A brief whose implementer report has been merged. Set on the brief, not the report. |
| `needs-decision` | An implementer report that surfaces a question Cowork must answer before work continues. Brief's status flips too. |
| `answered` | A brief that's been replied to. Cowork sets this when reading a report. |
| `archived` | Old enough that nobody needs it on the front page. Move to `sessions/archive/YYYY-MM/` manually when a phase wraps. |

## Lifecycle

```
                  ┌─────────────────────────┐
                  │  Cowork writes brief    │
                  │  status: open           │
                  └────────────┬────────────┘
                               │
                          git push
                               │
                  ┌────────────▼────────────┐
                  │  Claude Code reads it   │
                  │  implements             │
                  │  writes report          │
                  └────────────┬────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                                     │
   report status: complete            report status: needs-decision
   brief  status: implemented         brief  status: needs-decision
            │                                     │
       Cowork plans next                  Cowork answers in next
       session, marks brief                brief, flow continues
       status: answered
```

## What goes in a brief (architect → implementer)

See `sessions/_templates/architect-brief.md`. Non-negotiable sections:

- **Goal** — one sentence + paragraph if needed.
- **Context** — what's changed since the previous session relevant to this work.
- **Constraints** — hard rules (must be Server Component, must not break the seed script).
- **Out of scope** — what NOT to touch. **Critical** — implementers are eager.
- **Acceptance** — concrete, checkable bullets. "Build is green," "page renders at /timeline," "lint passes." If you can't articulate acceptance, you can't write the brief.
- **Open questions** — things the architect wants the implementer to answer in the report (not blockers, but inputs Cowork would value).

## What goes in a report (implementer → architect)

See `sessions/_templates/implementer-report.md`. Non-negotiable sections:

- **Summary** — what shipped, in two sentences.
- **What I did** — concise list of changes, with file paths.
- **Decisions I made** — every place CC deviated from the brief, every notable choice. **Most-read section.**
- **Verification** — what was run (`npm run dev`, `tsc --noEmit`, manual test), with results.
- **Open issues / blockers** — anything that didn't get done and why.
- **For next session** — bullet suggestions for the next architect brief.

## Carry-over → open-questions (post-049)

Pre-049 ("Carry-over for the next architect brief" section in `sessions/README.md`):

> An implementer report's "For next session" or "Open issues" surfaces a small follow-up. Cowork appends it to the carry-over section with enough context that a future Cowork chat understands the *why*. When planning the next brief, Cowork reads the carry-over section first; each item either folds into the new brief or remains for the brief after that. After folding, prune.

Post-049 (Karpathy-Reset, see [decision page](../decisions/karpathy-reset-2026-05-08.md)):

The carry-over discipline moved to [`../open-questions.md`](../open-questions.md). Same workflow:

1. CC report's "For next session" item → Cowork numbers it as new entry in `open-questions.md` with Owner / Sessions / Follow-up brief lines.
2. Cowork reads `open-questions.md` first when planning the next brief.
3. Each item either folds into the new brief or remains.
4. Folded items get pruned from `open-questions.md`.

The format is more structured than the pre-049 prose-bullet form: each item now carries Owner/Sessions/Follow-up metadata. The discipline is otherwise unchanged.

`sessions/README.md` post-049 has a thin "Carry-over" pointer to [`../open-questions.md`](../open-questions.md) for legibility.

## Drafts

If writing a brief and need to think out loud: `sessions/_drafts/` (gitignored). Move to `sessions/` and commit when ready. Don't commit drafts.

## Archiving

The root of `sessions/` contains only:

- briefs that are currently `open` or `needs-decision`,
- the matching impl reports for those briefs,
- at most the last 1–2 just-closed sessions, if they're load-bearing for the current thread (e.g. the parent brief of an open follow-up).

Everything else moves to `sessions/archive/YYYY-MM/` promptly — don't wait for a phase to wrap. A session is "everything else" once its brief reaches `implemented` / `answered` and its impl report is `complete`, AND it isn't the parent of an open thread. Cowork archives during session-end (or at the start of the next session, if it slipped).

Per-move discipline: any wiki page or top-level doc that referenced `sessions/<id>.md` needs its relative path updated to `sessions/archive/YYYY-MM/<id>.md`. A grep across `brain/wiki/**`, `sessions/README.md`, top-level `CLAUDE.md`, and `docs/**` catches them.

Phase-2 closure (2026-05-02) moved 21 sessions (008, 011–030) to `sessions/archive/2026-04/` (008, 011–013) and `sessions/archive/2026-05/` (014–030). The Phase-3 archive sweep happened in two passes: 049-Karpathy-Reset moved 033 + 046 (the two retracted briefs) into `sessions/archive/2026-05/`; 051-Slim-Pass (2026-05-09) archived the remaining closed Phase-3 sessions 031–048 (12 brief/report pairs) under the same rule.

## Commits and session files

A typical CC implementation lands in 1–N commits + the impl session report file. Pattern: implementation commit(s) + final commit "Sessions: NNN implementer report" (or fold the report into a previous commit if it makes sense). The brief's status flip from `open` to `implemented` is a one-line edit; same commit as the report is fine.

The 049-Karpathy-Reset session (this) is an exception in shape: structural-only, multi-commit (Cowork pre-work + Brain skeleton + wiki pages + atlas-regen + report) but the same lifecycle pattern applies.
