---
title: Worklist — konsolidierte offene Arbeit
type: overview
created: 2026-07-01
updated: 2026-07-22
sources:
  - ../../sessions/README.md
  - ../../docs/launch-master-plan.md
  - ../../docs/werkstatt-roadmap.md
  - ../../sessions/2026-07-21-257-impl-text-delint-emdash.md
  - ../../sessions/2026-07-21-256-impl-nav-curator-compendium.md
  - ../../sessions/2026-07-21-255-impl-sitewide-ui-nav-typography.md
  - ../../sessions/2026-07-21-254-impl-werkstatt-wpb1-arthas-moloch.md
  - ../../sessions/2026-07-20-253-impl-werkstatt-wab1-archive-facet-filters.md
  - ../../sessions/2026-07-20-252-impl-werkstatt-f3b1-librarium-statistics.md
  - ../../sessions/2026-07-20-251-impl-werkstatt-f1b2-status-imperialis.md
  - ../../sessions/2026-07-20-250-impl-werkstatt-f1b1-m42-dates.md
  - ../../sessions/2026-07-19-249-impl-map-ui-rework.md
related:
  - ./project-state.md
  - ./open-questions.md
  - ./deferred-questions.md
  - ./roadmap.md
confidence: high
---

# Worklist

> **Canonical queue for open work.** Current state only; completed history lives in [`log.md`](./log.md), [`docs/werkstatt-roadmap.md`](../../docs/werkstatt-roadmap.md), git and session reports. Cosmetic-only details remain in [`docs/ui-backlog.md`](../../docs/ui-backlog.md).

## A. Path to launch

The mandatory hardening stretch and the complete workshop evaluation/construction wave are finished. W3a-B1 moved to backlog on 2026-07-22; there is no remaining feature-build item before the quality passes.

1. **S7b — Player, Chrome, Assets (next):** split MediaPlayer transport from lazy advanced UI, avoid route-empty Chrome cost, pause hidden-document route motion, clean or justify stale assets, and measure behind the preview gate. The final live measurement repeats once after gate-off.
2. **S11 code PR:** pixel-identical maintenance/cleanup after S7b; no opportunistic redesign. The separate S11 documentation rollup waits for the quiet window.
3. **Content freeze + Launch-Readiness:** collect the 12-point evidence package once artist artwork is complete; migration `0015` evidence remains point 1.
4. **Gate-off + quiet window:** minimal flag flip and new production deploy, then live-crawl verification. Before the Reddit post: PL1 preview removal, final S7b live measurement and S11 Brain/session rollup.

Authoritative detail: [`docs/launch-master-plan.md`](../../docs/launch-master-plan.md) and [`docs/launch-session-prompts.md`](../../docs/launch-session-prompts.md). There is no launch-date pressure.

## B. Launch-readiness operator checks

- **Migration `0015`:** production evidence remains launch-readiness point 1 (read-only parity check before any production write).
- **Production drift:** optional but recommended `npm run db:drift` read-only check alongside readiness.
- **Preview infrastructure:** keep the gate, login/invite path and individually revocable artist codes intact until gate-off; PL1 is post-gate only.
- **Artwork:** complete artist artwork is a hard W1 release condition, independent of code readiness.

## C. Decided backlog — not pre-launch

The full verdict ledger and decision-ready cuts are in [`docs/werkstatt-roadmap.md`](../../docs/werkstatt-roadmap.md). These items must not silently re-enter the launch queue:

- **W3a-B1 character connections:** post-launch revisit (maintainer, 2026-07-22). Co-occurrence-v1 on character pages is already scoped without a schema change; curated relationship semantics remain a later schema option.
- **Personal Library + double-purchase overlap:** revisit only after real user demand; local-first is the prepared v1, accounts are explicitly not a launch task.
- **Provenance badges, podcasts on book pages and Scala Imperialis:** backlog. Podcasts need a coverage decision; the size comparison needs a new sourced schema.
- **Cartographer time-strip W3b-B3:** backlog; the discrete time states and journey coupling are complete, but a meaningful running timeline must include visible time/content/camera behavior.
- **BrandBeacon/logo swap:** use Philipps final logo when available, potentially during S7b if it is provided and the change stays within that pass.
- **Galaspar pin and podcast aliases:** revisit on their recorded triggers (coordinates supplied; deliberate post-launch curation wave). Myr, survey mode, release radar and the discarded UI candidates stay dropped.
- **Editorial anti-slop / synopsis pass:** Session 257's research is a proposal, not an approved implementation. Any seed-data lint/rewrite is a separate content session after explicit approval.

## D. Long-range / operational

- **P8 topic strands + P9 character gallery** still depend on B8 topic curation + B9 Primarch curation. Brief 129 remains the decision-level product/content spec, not a pre-launch queue item.
- **B5 hand curation** continues through `curation-overlay.json` + dry-run/verify; no standalone session is required.
- **Atlas event pages** remain a separate post-launch enhancement in [`deferred-questions.md`](./deferred-questions.md).
- **Community contributions** remain post-launch: submissions stay quarantined for review and never write directly to canonical tables.
