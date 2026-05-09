---
title: Deferred questions (dormant)
type: overview
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md
  - ../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md
  - ../../sessions/archive/2026-05/2026-05-03-039-impl-phase3c-llm-enrichment.md
  - ../../sessions/archive/2026-05/2026-05-03-035-impl-phase3a-bulk-backfill-skeleton.md
  - ../../sessions/archive/2026-05/2026-05-03-037-impl-phase3b-aux-sources.md
related:
  - ./open-questions.md
  - ./pipeline-state.md
  - ./roadmap.md
confidence: high
---

# Deferred questions

> Items that surfaced during a session but don't belong in the next-brief queue. Either dormant (waiting for a trigger), distant (Phase-4+ ambitions), or model-specific things that became inactive after a switch. Cowork promotes an item back into [`./open-questions.md`](./open-questions.md) when its trigger fires.
>
> Created during 051 (Brain Slim Pass) by lifting items 4–8 + the "distant" half of item 9 from the original 11-item queue. Phase-internal sub-phase reminders (3d / 3e / 3f to-dos that were inside item 9) live now in [`./pipeline-state.md`](./pipeline-state.md) under each sub-phase.

---

## `secondary_era_ids text[]` für Multi-Era-Sichtbarkeit

**Owner:** future Phase-4 brief. **Sessions:** [024-impl](../../sessions/archive/2026-05/2026-05-02-024-impl-era-anchor.md) "For next session".

`id01 The Infinite and the Divine` (M35–M41) wäre der Driver — lebt plausibel auch in `age_apostasy` und `long_war`. UX-Konsequenz offen (zählt zweimal in den Era-Counts? lädt EraDetail zweimal?). Wahrscheinlicher Aufgreif-Punkt: Phase-4-Timeline-Reshape (cineastische Era-Erkundung), dort wird Multi-Era-Sichtbarkeit ein konkretes Designthema.

**Promote when:** Phase-4-Timeline-Reshape brief opens.

## Redirect-Mechanismus — HTTP 307 vs. meta-refresh

**Owner:** future brief if pain becomes concrete. **Sessions:** [025-arch](../../sessions/archive/2026-05/2026-05-02-025-arch-detail-panel-deeplink.md), [026-impl](../../sessions/archive/2026-05/2026-05-02-026-impl-detail-panel-deeplink.md).

Mit `src/app/timeline/loading.tsx` (instant Skeleton beim Hub→Timeline-Click) hat sich das Verhalten von `redirect()`-Calls in `page.tsx` geändert: Stream startet vor Redirect → Next emittet `<meta http-equiv="refresh">` plus RSC-Redirect-Direktive, statt sauberen HTTP 307. Browser folgen korrekt; JS-User kriegen den Redirect via Next-Router instant; **Direkthits auf Redirect-URLs (geteilte Links, Legacy `?era=M30`) bekommen 1 Sekunde Skeleton-Blink vor Meta-Refresh**. Sauberere Alternative: Redirect-Logik in `middleware.ts` (gibt 307 sofort zurück). Trade-off: ~80 Zeilen `middleware.ts` mit 1–2 DB-Queries vor jedem `/timeline`-Hit. Mit Philipp 2026-05-02 bestätigt: bleibt vorerst hier liegen — Internal-Nav unaffected, Direkthits selten genug.

**Promote when:** geteilte Legacy-Links beschweren sich oder Lighthouse-Score auf Redirect-Pfaden auffällt.

## 3c `no_rating_found`-Flag-Misuse (Sonnet-spezifisch)

**Owner:** future brief, only if Sonnet ad-hoc per `INGEST_LLM_MODEL`-Override aktiviert wird. **Sessions:** [039-impl](../../sessions/archive/2026-05/2026-05-03-039-impl-phase3c-llm-enrichment.md), [042-impl](../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md).

4 Bücher im Sonnet-Original-Lauf hatten `rating + ratingSource` gesetzt UND einen `no_rating_found`-Flag — der Sonnet nutzt den Flag als Audit-Erklärung für Source-Priority-Fallback. Haiku zeigte das Verhalten nicht (0× im Vergleichs-Lauf). Mit dem Modell-Switch in 040 ist das Symptom weg. Mini-Brief-Pfad falls jemals nötig: Flag-Kind-Union um `rating_source_fallback` erweitern, oder System-Prompt schärfen.

**Promote when:** ein Brief schaltet Sonnet wieder als Default ein.

## `series_total_mismatch`-Flag bei Voll-Lauf beobachten

**Owner:** open observation. **Sessions:** [042-impl](../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md), [044-impl](../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md).

Im Original-Haiku-Lauf (Bücher 21–40, alles HH-Phase-2) wurde der Flag 0× emittiert — entweder weil HH-Mid-Phase keine Series-Total-Anomalien hat, oder weil das Flag-Constraint im System-Prompt zu eng formuliert ist. Im 3e-Voll-Lauf (alle 800 Bücher inkl. Primarchs / Tales-of-Heresy / etc.) sollten echte Mismatches sichtbar werden.

**Promote when:** der Voll-Lauf läuft und 0 Mismatches zeigt obwohl wir wissen, dass es welche gibt → Prompt-Tweak-Mini-Brief.

## Pipeline-Cost-Tuning Mini-Brief

**Owner:** Cowork, only if 3e-batches überraschend hohe Cost zeigen. **Sessions:** [042-impl](../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md).

`max_uses` runter von 6 auf 3 (Haiku braucht im Vergleichs-Lauf nur 3.4 Searches/Buch); ggf. System-Prompt-Trim, Plot-Context kürzen, Web-Search-Optional-Mode für Bücher mit reichem Plot-Kontext. 042 hat das schon als "eher nicht der Mühe wert" eingestuft (Cost 3× unter Sonnet, weit unter Brief-Original-Budget). Realistisch: ~10–30% zusätzliche Ersparnis möglich, also $20–25 Reduktion auf den $88-Voll-Lauf-Estimate.

**Promote when:** zwei aufeinanderfolgende 3e-Batches kommen über $0.18/Buch oder die Voll-Lauf-Hochrechnung schiebt sich über $120.

## Distant — Phase-3+-Engine-Erweiterungen aus 035 / 037

**Owner:** Cowork, only if a future brief explicitly opens this axis. **Sessions:** [035-impl](../../sessions/archive/2026-05/2026-05-03-035-impl-phase3a-bulk-backfill-skeleton.md), [037-impl](../../sessions/archive/2026-05/2026-05-03-037-impl-phase3b-aux-sources.md).

Lose Liste — alle drei sind heute durch Workarounds oder durch den LLM-Pass abgedeckt:

- **Lexicanum-`apiSearchFallback()`** als zweiter Discovery-Pfad (heute Cloudflare-blockiert auf `api.php`; URL-Probing reicht).
- **Format/Availability-Heuristik aus Open Library** mit per-Edition-Fetch + Sprach-Filter (heute durch LLM gelöst, post-047 mit Closest-Match-Map).
- **Engine-Friktions-Befunde aus 037:** `SourceName`-Union vs Plugin-Pattern, kein shared HTTP-Throttle, generisches `auditPayloads` statt source-spezifischer Slots. Refactor-Anlass; heute kein Schmerz.

**Promote when:** ein konkreter Schmerz auftaucht (Discovery vermisst Bücher, Refactor wegen neuem Source).
