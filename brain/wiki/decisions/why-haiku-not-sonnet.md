---
title: Why Haiku 4.5, not Sonnet 4.6 (or Opus 4.7)
type: decision
created: 2026-05-04
updated: 2026-05-09
sources:
  - ../../../sessions/archive/2026-05/2026-05-03-038-arch-phase3c-llm-enrichment.md
  - ../../../sessions/archive/2026-05/2026-05-03-039-impl-phase3c-llm-enrichment.md
  - ../../../sessions/2026-05-04-040-arch-phase3c-haiku-switch.md
  - ../../../sessions/2026-05-04-042-impl-phase3c-haiku-switch.md
  - ../../../sessions/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
related:
  - ../pipeline-state.md
  - ../open-questions.md
confidence: high
decision-date: 2026-05-04
---

# Why Haiku 4.5, not Sonnet 4.6

**Status:** active (under review post-Anthologie-Re-Test) · **Decided:** 2026-05-04 (Brief 040) · **Sessions:** [038](../../../sessions/archive/2026-05/2026-05-03-038-arch-phase3c-llm-enrichment.md), [039-impl + addendum](../../../sessions/archive/2026-05/2026-05-03-039-impl-phase3c-llm-enrichment.md), [040](../../../sessions/2026-05-04-040-arch-phase3c-haiku-switch.md), [042-impl](../../../sessions/2026-05-04-042-impl-phase3c-haiku-switch.md), [045-impl](../../../sessions/2026-05-05-045-impl-cc-vs-pipeline-comparison.md)

## Context

Phase-3c (LLM-Anreicherungs-Schicht, brief 038) was originally specified with **Anthropic Sonnet 4.6 + Web Search**. Test-Lauf in 039 (20 Bücher, Sonnet) produced cost = $7.00 → $0.35/Buch → 800-book voll-lauf ~$280. Brief 038's expectation had been $1.50–4 for 20 Bücher → $60–160 for 800. Real cost ran 2× over budget.

The 039 Addendum re-ran the same 20 Bücher with **Haiku 4.5** as a comparison. Result: $2.21/20 Bücher → $0.11/Buch → ~$88 for 800 (3.2× cheaper, within original Brief-038 budget).

Brief 040 (Mini-Brief, 2026-05-04) made the call: switch default to Haiku, harden the prompt against Haiku-specific gotchas, re-test on books 21–40 to verify the hardening worked.

## Options considered

- **A — keep Sonnet 4.6.** $280 voll-lauf budget. Better Plausibility-Cross-Check depth (`data_conflict×9, author_mismatch×3` vs Haiku's `×1, ×0` in the test). Better Multi-Author-Anthologie detection. **Not chosen** because cost was 3× over plan with no commensurate quality gain on the *measurable* axes (synopsis quality was equivalent; facets-coverage Haiku 95% vs Sonnet 40%).
- **B — Hybrid Sonnet-for-anthologies + Haiku-for-the-rest.** Sounds clever (catch the anthologies where Sonnet's depth matters; save the cost on bulk). **Not chosen** because the routing logic (which book is an anthology before crawl?) is the hard part — and post-049 Hebel E (Hardcover-Author-Hint) addresses the anthology-detection gap from a different angle in the prompt itself.
- **C — Chat-only path** (Philipp does each book in claude.ai). **Not chosen** — 50–80h of eigenarbeit doesn't replace $88 of LLM cost for a hobby project.
- **D ✅ chosen — Default Haiku 4.5 + targeted post-3e hand-check.** Save on bulk; Cowork triages flags + Philipp does focused external Hand-Check sessions in claude.ai for prestige reads (HH 1–54, Eisenhorn, Ravenor, Gaunt's Ghosts; ~150 books) and any flag-heavy outliers (~120 of the 800).
- **E — Opus 4.7.** Brief 046 (Opus-Pipeline-D) was opened to do a 4-quadrant comparison (Haiku × Sonnet × Opus × {Pipeline-inputs, Web}) but **retracted 2026-05-08** before handover — post-Pipeline-Härtung the comparison would be on shifting data, and 045-Befunde already give enough signal for the Haiku-vs-Sonnet decision.

## Decision

**Default `INGEST_LLM_MODEL = claude-haiku-4-5` for the 3e Voll-Lauf and 3f Maintenance.** Per-book `INGEST_LLM_MODEL` override available for ad-hoc Sonnet runs if needed for an outlier.

Two prompt hardenings landed in 040/042 to fix Haiku-specific gotchas:

1. **Vokabular-ID-Form discipline.** Haiku originally combined category-prefix + value (`tone_grimdark` instead of `grimdark`) → 19/20 invalid facet IDs. System-prompt now demands bare value-IDs.
2. **Format-Required-Verhalten.** Haiku originally left format/availability optional. System-prompt now demands closest-match under uncertainty + `data_conflict`-Flag for residual uncertainty.

Plus 047 added Hebel E (Hardcover-Author-Hint) — addresses Haiku's Multi-Author-Anthologie blindness from the prompt side instead of the model side.

## Why

- **3× cost reduction matters at 800-book scale.** $88 vs $280. For a hobby project this is the difference between "let it run" and "is this worth it".
- **Synopsis quality is equivalent.** Both 100–150W in range; Haiku 95% in range vs Sonnet 86% in 042 re-test.
- **Facets-coverage actually better with hardened Haiku.** Post-prompt-härtung: 100% format-coverage (vs Sonnet's 40%, which was *too conservative*). `value_outside_vocabulary` 19→1 (95% reduction).
- **Plausibility-depth gap is real but narrower than feared.** 045 Sonnet-Pipeline catches some signals Haiku misses (`mark-of-calth` `dual` vs `imperium` resolution; `vengeance` semantic resolution into `betrayal+loyalty`). But Sonnet *also* misses `chaos`-pov_side for the same book — the deepest gaps are model-agnostic prompt issues. 047 Hardcover-Hint fixes one of them at the prompt level.
- **Out-of-vocabulary findings are themselves useful signals.** `duty` × 5 in 044's Haiku run is a vocabulary-extension proposal, not a model failure. Haiku's lower threshold for "I'm flagging this as outside vocab" is *better* than Sonnet's "I'll force-fit it into `loyalty`" for promotion-finding.
- **Hand-Check covers the deep-plausibility tail.** Philipp's claude.ai Hand-Check sessions get ~150 prestige books + ~120 flag-heavy outliers — the books where deep-plausibility actually matters. The remaining ~530 background books take Haiku's output as-is.

## When this decision should be revisited

- **Post-Anthologie-Re-Test for Hebel E** ([open question 10](../open-questions.md#10-anthologie-re-test-für-hebel-e-hardcover-author-hint)). If Hardcover-Hint closes the Multi-Author-Anthologie gap, Haiku's last quality-deficit is gone. If it doesn't close it, Sonnet-for-anthologies (Option B) becomes more attractive again.
- **If Anthropic releases Haiku 4.6+ with materially better plausibility.** Drop-in upgrade.
- **If the Voll-Lauf cost overshoots $88** (e.g. 3e batches running consistently at $0.18/book instead of $0.11). Item 8 in [`../open-questions.md`](../open-questions.md) covers cost-tuning levers (`max_uses` 6→3, prompt-trim, web-search-optional-mode).
- **If a future tool-use feature** (structured-output guarantees, web-search hardening, vision) is Sonnet-only and we need it.

## Aftermath

040/042 implemented. Prompt-Härtung achieved acceptance: `value_outside_vocabulary` 19→1 (95% red.), Format-Coverage 20/20=100%, Cost $2.236 (in range). Plausibility-Flags total 24→7. 044 (Batch 1) ran cleanly at $5.88 mid-range $4–8. 045 Sonnet-Comparison gave the precise quality-gap measurements that confirmed the trade-off was the right one for our use case. 047's Hebel E targets the one remaining quality-gap (anthology author-mismatch) at the prompt level, leaving Haiku as the bulk model.

The decision is currently **active under-review** — pending the Anthologie-Re-Test ([open question 10](../open-questions.md)). If that test confirms Hebel E closes the gap, Haiku stays default with confidence; if not, the decision opens for re-evaluation.
