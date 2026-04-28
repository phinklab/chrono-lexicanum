# Session log format

Sessions are how Cowork (architect) and Claude Code (implementer) hand work back and forth. Every session is a single Markdown file under `/sessions/`. They are committed to git — they ARE the project history.

---

## Naming

```
sessions/YYYY-MM-DD-NNN-{role}-{slug}.md
```

| Part | Rule |
|---|---|
| `YYYY-MM-DD` | Date the session was opened, NOT modified |
| `NNN` | Three-digit sequence, monotonically increasing across the project (not reset daily). Pad with leading zeros: `001`, `002`, `042`. |
| `role` | Either `arch` (architect, written by Cowork) or `impl` (implementer, written by Claude Code) |
| `slug` | Short kebab-case topic. Re-use the slug from the brief when writing the report — pairs are easy to spot. |

**Examples:**

```
sessions/2026-04-28-001-arch-bootstrap.md
sessions/2026-04-28-002-arch-phase-1-handoff.md
sessions/2026-04-28-003-impl-phase-1-handoff.md     ← reply to 002
sessions/2026-04-30-004-arch-timeline-port.md       ← new topic
sessions/2026-04-30-005-impl-timeline-port.md
```

---

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
links:                     # other sessions referenced (briefs, prior work)
  - 2026-04-28-001
commits: []                # git commit hashes produced by this session
---
```

### `status` values

| Value | When |
|---|---|
| `open` | The session has been written and is waiting for the other side. The default for a fresh architect brief. |
| `implemented` | A brief whose implementer report has been merged. Set on the brief, not the report. |
| `needs-decision` | An implementer report that surfaces a question Cowork must answer before work continues. The brief's status flips to `needs-decision` too. |
| `answered` | A brief that's been replied to (with a report or with a follow-up brief). Cowork sets this when reading a report. |
| `archived` | Old enough that nobody needs it on the front page. Move to `sessions/archive/YYYY-MM/` manually when a phase wraps. |

---

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

---

## What goes in a brief (architect → implementer)

See `sessions/_templates/architect-brief.md`. The non-negotiable sections:

- **Goal** — one sentence, plus a paragraph if needed.
- **Context** — what's changed since the previous session relevant to this work.
- **Constraints** — hard rules (must be Server Component, must not break the seed script).
- **Out of scope** — what NOT to touch. Critical.
- **Acceptance** — concrete, checkable bullets. "Build is green," "page renders at /timeline," "lint passes." If you can't articulate acceptance, you can't write the brief.
- **Open questions** — things you want the implementer to answer in their report (not blockers, but inputs you'd value).

---

## What goes in a report (implementer → architect)

See `sessions/_templates/implementer-report.md`. Non-negotiable sections:

- **Summary** — what shipped, in two sentences.
- **What I did** — concise list of changes, with file paths.
- **Decisions I made** — every place you deviated from the brief, every notable choice. **This is the most-read section.**
- **Verification** — what you ran (`npm run dev`, `tsc --noEmit`, manual test), with results.
- **Open issues / blockers** — anything that didn't get done and why.
- **For next session** — a list of suggestions for the next architect brief.

---

## Drafts

If you're writing a brief and need to think out loud, use `sessions/_drafts/` (gitignored). Move to `sessions/` and commit when ready. Don't commit drafts.

---

## Archiving

When a phase wraps (e.g. Phase 1 ships), Cowork moves all completed sessions for that phase to `sessions/archive/YYYY-MM/`. The README in `/sessions/` lists active threads only.
