---
title: Serial launch sessions from the coordination worktree
type: decision
created: 2026-07-10
updated: 2026-07-10
decision-date: 2026-07-10
sources:
  - ../../../sessions/2026-07-10-193-impl-brain-launch-rollup.md
related:
  - ../project-state.md
  - ../worklist.md
  - ../workflows/cc-session.md
confidence: high
---

# Serial launch sessions from the coordination worktree

## Context

The durable Product and Batches worktrees exist to isolate parallel strands and protect the coordination-only Brain/session rollups. The launch programme is intentionally serial, and several stages alternate between Product, Batches and coordination evidence. Switching among three worktrees for a sequence that explicitly forbids parallel work adds handoff friction without providing its normal conflict benefit.

The detailed launch master plan and prompt collection are maintainer-local working files and intentionally remain untracked. The operating decision therefore needs a durable project-memory record even though the task specs do not.

## Decision

For the launch programme only:

- every session starts from `C:\Users\Phil\chrono-lexicanum` on a fresh task branch from `origin/main`;
- sessions run one at a time; no parallel strand work occurs;
- branch names and PR contents still identify their logical strand;
- Product/Batches changes do not absorb coordination rollups, and coordination-only changes get their own PR;
- `main` remains read-only and every durable change still goes through a PR;
- kickoff may use the maintainer-local launch prompts instead of a per-session architect brief; an implementer report remains required.

## Why

- The isolation value of worktrees comes from concurrency; the launch campaign deliberately has none.
- Coordination-only files are needed repeatedly during the campaign, so forcing all execution into a strand worktree would still require a second worktree for rollups.
- Strand-pure PR contents preserve review clarity even when the filesystem path is shared.
- Keeping the exception narrow avoids weakening the normal conflict-avoidance protocol for future parallel work.

## Revisit triggers

End the exception immediately when any of these becomes true:

- the public launch and its immediate post-launch cleanup are complete;
- Product and Batches work need to proceed in parallel;
- overlapping uncommitted changes make serial branch switching unsafe;
- the maintainer explicitly returns to the normal three-worktree protocol.

After the exception ends, Product/UI work returns to `chrono-lexicanum-product`, Batch/Ingestion to `chrono-lexicanum-batches`, and Brain/rollups remain in the coordination worktree.
