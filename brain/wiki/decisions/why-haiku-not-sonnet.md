---
title: Why Haiku 4.5, not Sonnet 4.6 (or Opus 4.7)
type: decision
created: 2026-05-04
updated: 2026-05-09
sources:
  - ../../../sessions/archive/2026-05/2026-05-03-038-arch-phase3c-llm-enrichment.md
  - ../../../sessions/archive/2026-05/2026-05-03-039-impl-phase3c-llm-enrichment.md
  - ../../../sessions/archive/2026-05/2026-05-04-040-arch-phase3c-haiku-switch.md
  - ../../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md
  - ../../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
related:
  - ../pipeline-state.md
  - ../open-questions.md
confidence: high
decision-date: 2026-05-04
---

# Why Haiku 4.5, not Sonnet 4.6

**Status:** active under-review (pending Anthologie-Re-Test for Hebel E).

## Context

Phase-3c was originally specified with Sonnet 4.6 + Web Search. The 20-Buch test came in 2× over budget ($0.35/Buch → $280 voll-lauf vs an expected $60–160). A Haiku 4.5 re-run on the same 20 books landed at $0.11/Buch → ~$88 voll-lauf — within original budget — without losing measurable synopsis quality.

The cost gap is structural (3× input-token price), not anomalous, so it persists across the 800-book run.

## Decision

**Default `INGEST_LLM_MODEL = claude-haiku-4-5`** for the 3e voll-lauf and 3f maintenance. Per-book override available for ad-hoc Sonnet calls when an outlier warrants it.

Two prompt hardenings were required to make Haiku safe as default:

1. **Vokabular-ID-Form.** Demand bare value-IDs (`grimdark`, not `tone_grimdark`) — Haiku originally combined category-prefix with value, producing 19/20 invalid facet IDs.
2. **Format-Required-Verhalten.** Demand closest-match under uncertainty plus a `data_conflict` flag for residual uncertainty — Haiku originally left format/availability optional.

Hebel E (Hardcover-Author-Hint, brief 047) addresses Haiku's known anthology-blindness from the prompt side, before the model side becomes the question again.

## Why

- **3× cost reduction matters at 800-book scale.** Hobby project economics: $88 vs $280 is the difference between "let it run" and "is this worth it".
- **Synopsis quality is equivalent on the measurable axes.** Both 100–150W in range; format-coverage 100% (vs Sonnet's 40% — which was *too conservative*); `value_outside_vocabulary` 19→1 after hardening.
- **Plausibility-depth gap is real but narrower than feared.** Sonnet catches a few signals Haiku misses (`mark-of-calth` `dual` vs `imperium`; `vengeance` semantic resolution into `betrayal+loyalty`). Sonnet *also* misses `chaos`-pov_side for the same book — the deepest gaps are model-agnostic prompt issues.
- **Out-of-vocabulary findings are useful signals.** Haiku flagging `duty` × 5 in 044 is a vocabulary-extension proposal, not a model failure. Lower flagging-threshold beats Sonnet's force-fit.
- **Hand-Check covers the deep-plausibility tail.** Philipp does focused claude.ai Hand-Check sessions for ~150 prestige reads + ~120 flag-heavy outliers; Haiku's bulk output stands on its own for the remaining ~530 background books.

## Revisit triggers

- **Anthologie-Re-Test for Hebel E** (open-question 10). If Hardcover-Hint closes the multi-author-anthology gap, Haiku's last quality-deficit is gone. If it doesn't, Sonnet-for-anthologies (a hybrid) becomes attractive again.
- **Anthropic releases Haiku 4.6+ with materially better plausibility.** Drop-in upgrade.
- **Voll-Lauf cost overshoots $88.** Cost-tuning levers (`max_uses` 6→3, prompt-trim, web-search-optional-mode) were deferred to [`../deferred-questions.md`](../deferred-questions.md).
- **A future tool-use feature is Sonnet-only and we need it.**

For current acceptance numbers, see [`../pipeline-state.md`](../pipeline-state.md). For the chronological narrative of how the decision held up across 040 / 042 / 044 / 045 / 047, see the session logs and [`../log.md`](../log.md).
