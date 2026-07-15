---
session: 2026-07-13-212
role: implementer
date: 2026-07-13
status: superseded
slug: map-render-pipeline
parent: none (direct maintainer session, no architect brief)
links:
  - sessions/2026-07-13-213-impl-map-mobile-rendering.md
commits: []
---

# Map render pipeline attempt — tombstone (reconstructed 2026-07-15)

> **This is not the original report.** Session 212's implementer report and its
> diff existed only untracked in the working tree and were lost before they
> could be committed; a full search (working tree, git history, stashes, both
> strand worktrees, local folders) in Session 219 found no surviving copy. This
> tombstone reconstructs the durable facts from the Session-213 report and the
> maintainer's records so the session numbering carries no unexplained hole.

## What is known

- Session 212 attempted a Cartographer render-pipeline rework to fix the
  Android map flicker. **The result failed the maintainer's real-device
  acceptance and every change was rolled back** — nothing from this session
  reached `main`, which is why it has no PR and no commits.
- The flicker problem was then handed over externally (a handover document
  `docs/map-flicker-handover.md` and a prompt file existed untracked alongside
  this report and are equally lost).
- The durable fix landed the same day as **Session 213 / PR #260**: Android
  defaults to a bounded Canvas2D renderer with a shared camera core, and the
  maintainer confirmed on-device that pinch/zoom is fluid and the flicker is
  gone. Session 213's report is the canonical record of the working solution.

## Lesson retained

The failed attempt reinforced the earlier finding that the Android flicker was
not reproducible in desktop Chromium traces — only real-device verification
counts for this class of bug. That constraint is honoured in Session 213's
verification section.
