---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../sessions/README.md
  - ../../sessions/2026-05-08-047-impl-pipeline-hardening.md
  - ../../sessions/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
  - ../../sessions/2026-05-05-044-impl-phase3e-batch-1.md
  - ../../sessions/2026-05-04-042-impl-phase3c-haiku-switch.md
related:
  - ./project-state.md
  - ./pipeline-state.md
  - ./decisions/why-haiku-not-sonnet.md
confidence: high
---

# Open questions

> Items the **next** architect brief MUST address. Items decided / surfaced between sessions that don't deserve their own brief but must not be forgotten. Cowork prunes here once an item lands in a brief or is otherwise resolved.
>
> Migration note: this page replaces the `Carry-over` section that lived in `sessions/README.md` until brief 049 (Karpathy-Reset 2026-05-08). The 9 items present at the time of the reset are migrated below as numbered items 1–9; items 10–11 are new from 047-impl.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

## (1) Phase-3e Modell-Entscheidung — Haiku bleiben vs. Sonnet-Upgrade

**Owner:** Cowork (architect decision, then CC implements). **Sessions:** [045-arch](../../sessions/2026-05-05-045-arch-cc-vs-pipeline-comparison.md), [045-impl](../../sessions/2026-05-05-045-impl-cc-vs-pipeline-comparison.md), [047-impl](../../sessions/2026-05-08-047-impl-pipeline-hardening.md). **Follow-up brief:** post-047, post-Anthologie-Re-Test (item 10).

Trade-off-Tabelle aus 045: Sonnet-Pipeline löst `dual` vs `imperium` (mark-of-calth-Tagging-Failure), gibt nuancierteres Plausibility-Reasoning, löst Vokabular-Drift `vengeance` semantisch. Cost ~3× Haiku ($88 → ~$250–300 für die restlichen 750 Bücher). Author-Mismatch bleibt auch mit Sonnet-Pipeline blind, aber 047 zieht den Pipeline-Hardcover-Hebel — danach ist die Modell-Achse sauberer messbar. Brief 046 (Opus-D) wurde 2026-05-08 zurückgezogen — die Modell-Frage entscheidet sich post-047 zwischen Haiku und Sonnet allein, basierend auf 045-Befunden + 047-Test-Lauf-Befunden (Hardcover-Hint-Effekt auf Author-Mismatch).

## (2) Vokabular-Erweiterung — `duty` + Faction-Dimension `legion` + `chaos`-pov_side-Pattern

**Owner:** Cowork (architect call) → CC (schema + seed + LLM prompt). **Sessions:** [044-impl](../../sessions/2026-05-05-044-impl-phase3e-batch-1.md) (`duty` × 5 in HH-Phase-2 batch), [045-impl](../../sessions/2026-05-05-045-impl-cc-vs-pipeline-comparison.md). **Follow-up brief:** likely bundled with item (1).

Drei separate Erkenntnisse:
- (a) `duty` ist 3-Modelle-Konsens echte Lücke (kein existierender Tag deckt die "selbstlose unpersönliche Pflicht/Stoik"-Semantik). Promotion-Kandidat zur facet_value.
- (b) `legion` als neue multi-value-Faceten-Dimension (`ultramarines`, `word_bearers`, `iron_hands`, `salamanders`, …) ODER `protagonist_class`-Erweiterung mit `heretic_astartes` + `loyalist_astartes`. Beide Optionen sind Designthema.
- (c) `chaos`-pov_side wird auch von Sonnet nicht für `mark-of-calth` gesetzt (Word Bearers + Daemonic in Synopsis, aber kein chaos-Tag) — Modell-übergreifender Blind-Spot. Wahrscheinlich Prompt-Härtung statt Vokabular-Erweiterung.

Plus: `value_outside_vocabulary` über 70 Bücher kumulativ (042 + 044): `duty` × 5 (`praetorian-of-dorn`, `the-master-of-mankind`, `wolfsbane`, `saturnine`, `blood-of-the-emperor`), `vengeance` × 1 (`shattered-legions`), `fate` × 1 (`ruinstorm`). `duty` ist klarer Promotion-Kandidat; die anderen brauchen mehr Datenpunkte.

## (3) Hand-Check-Workflow-Brief nach Architektur-Klärung

**Owner:** Cowork. **Sessions:** [040-arch](../../sessions/2026-05-04-040-arch-phase3c-haiku-switch.md). **Follow-up brief:** post-Modell-Entscheidung, pre-3d-Apply.

Sequenz post-049: Anthologie-Re-Test (item 10) → Body-Lore-Pass / FIELD_PRIORITY-Cut (item 11) → Modell-Entscheidung + Vokabular (items 1+2) → **Hand-Check + Override-Schema** → 3d-Apply-Step. Hand-Check-Brief definiert das CSV-/Markdown-Override-Format und die Triage-Disziplin für Cowork (welcher Flag rolls auto, welcher braucht Cowork-Augen, welcher ignored).

## (4) `secondary_era_ids text[]` für Multi-Era-Sichtbarkeit

**Owner:** future Phase-4-brief. **Sessions:** [024-impl](../../sessions/archive/2026-05/2026-05-01-024-impl-era-anchor.md) "For next session" section.

`id01 The Infinite and the Divine` (M35–M41) wäre der Driver — lebt plausibel auch in `age_apostasy` und `long_war`. UX-Konsequenz offen (zählt zweimal in den Era-Counts? lädt EraDetail zweimal?). Wahrscheinlicher Aufgreif-Punkt: Phase-4-Timeline-Reshape (cineastische Era-Erkundung, scaling für viele Bücher) — dort wird Multi-Era-Sichtbarkeit ein konkretes Designthema. **Distant** — kein eigener Brief jetzt.

## (5) Redirect-Mechanismus — HTTP 307 vs. meta-refresh

**Owner:** future brief if pain becomes concrete. **Sessions:** [025-arch](../../sessions/archive/2026-05/2026-05-02-025-arch-detail-panel-deeplink.md) + [026-impl](../../sessions/archive/2026-05/2026-05-02-026-impl-detail-panel-deeplink.md) (Stufe 2c.1 DetailPanel + deep-link).

Mit `src/app/timeline/loading.tsx` (instant Skeleton beim Hub→Timeline-Click) hat sich das Verhalten von `redirect()`-Calls in `page.tsx` geändert: Stream startet vor Redirect → Next emittet `<meta http-equiv="refresh">` plus RSC-Redirect-Direktive, statt sauberen HTTP 307. Browser folgen korrekt; JS-User kriegen den Redirect via Next-Router instant; **Direkthits auf Redirect-URLs (geteilte Links, Legacy `?era=M30`) bekommen 1 Sekunde Skeleton-Blink vor Meta-Refresh**. Sauberere Alternative: Redirect-Logik in `middleware.ts` (gibt 307 sofort zurück). Trade-off: ~80 Zeilen `middleware.ts` mit 1–2 DB-Queries vor jedem `/timeline`-Hit. Mit Philipp 2026-05-02 bestätigt: bleibt vorerst hier liegen — Internal-Nav unaffected, Direkthits selten genug.

## (6) 3c `no_rating_found`-Flag-Misuse (Sonnet-spezifisch, mit Haiku dormant)

**Owner:** future brief, only if Sonnet ad-hoc per `INGEST_LLM_MODEL`-Override aktiviert wird. **Sessions:** [039-impl](../../sessions/2026-05-03-039-impl-phase3c-llm-enrichment.md), [042-impl](../../sessions/2026-05-04-042-impl-phase3c-haiku-switch.md).

4 Bücher im Sonnet-Original-Lauf hatten `rating + ratingSource` gesetzt UND einen `no_rating_found`-Flag — der Sonnet nutzt den Flag als Audit-Erklärung für Source-Priority-Fallback. Haiku zeigte das Verhalten nicht (0× im Vergleichs-Lauf). Mit dem Modell-Switch in 040 ist das Symptom weg. Mini-Brief-Pfad falls jemals nötig: Flag-Kind-Union um `rating_source_fallback` erweitern, oder System-Prompt schärfen. **Dormant.**

## (7) `series_total_mismatch`-Flag bei Voll-Lauf beobachten

**Owner:** open observation. **Sessions:** [042-impl](../../sessions/2026-05-04-042-impl-phase3c-haiku-switch.md), [044-impl](../../sessions/2026-05-05-044-impl-phase3e-batch-1.md).

Im Original-Haiku-Lauf (Bücher 21–40, alles HH-Phase-2) wurde der Flag 0× emittiert — entweder weil HH-Mid-Phase keine Series-Total-Anomalien hat, oder weil das Flag-Constraint im System-Prompt zu eng formuliert ist. Im 3e-Voll-Lauf (alle 800 Bücher inkl. Primarchs / Tales-of-Heresy / etc.) sollten echte Mismatches sichtbar werden. Wenn der Voll-Lauf 0 Mismatches zeigt aber wir wissen dass es welche gibt: Prompt-Tweak-Mini-Brief; sonst nichts.

## (8) Pipeline-Cost-Tuning Mini-Brief (vermutlich Phase-3.5+)

**Owner:** Cowork, only if 3e-batches überraschend hohe Cost zeigen. **Sessions:** [042-impl](../../sessions/2026-05-04-042-impl-phase3c-haiku-switch.md).

`max_uses` runter von 6 auf 3 (Haiku braucht im Vergleichs-Lauf nur 3.4 Searches/Buch); ggf. System-Prompt-Trim, Plot-Context kürzen, Web-Search-Optional-Mode für Bücher mit reichem Plot-Kontext. 042 hat das schon als "eher nicht der Mühe wert" eingestuft (Cost 3× unter Sonnet, weit unter Brief-Original-Budget). Realistisch: ~10–30% zusätzliche Ersparnis möglich, also $20–25 Reduktion auf den $88-Voll-Lauf-Estimate. **Wartet auf Anlass.**

## (9) Phase-3-Brief-Reminders aus 035 + 037 + 039 für kommende Bricks

**Owner:** Cowork (folds into the right phase-brief when its turn comes). **Sessions:** [035-impl](../../sessions/2026-05-03-035-impl-phase3a-bulk-backfill-skeleton.md), [037-impl](../../sessions/2026-05-03-037-impl-phase3b-aux-sources.md), [039-impl](../../sessions/2026-05-03-039-impl-phase3c-llm-enrichment.md).

Sub-items grouped by destination phase:

- **3d (Apply-Step):** Author-FK-Resolution für `work_persons`-Junction inkl. Auto-Create-on-New-Person. FK-Resolution für `work_facets`-Junction aus den 3c LLM-`facetIds`. ALTER TYPE für `sourceKind`-DB-Enum (`open_library`, `hardcover`, `llm`). UNIQUE INDEX `external_links (work_id, kind, service_id)`. `junctionsLocked: true`-Flag auf `works`. `loadTimeline`-Trim (`SELECT primaryEraId, COUNT(*) GROUP BY primaryEraId`). `llm_flags`-Triage-Workflow (auto-applied / Cowork-Review / ignored, plus UI-/CSV-/Markdown-export). `rawLlmPayload`-FK-Resolution (facetIds → `facet_values.id`, discoveredLinks → `services.id` mit serviceHint-Resolution).
- **3e (Batched Backfill):** Hardcover-Title-Variation (Server blockt `_ilike`/`_iregex`; nur exakte Title-Strings matchen — bei subtilen Unterschieden landet "no hits"). Mitigation: Title-Variationen-Liste oder RPC-Funktion entdecken.
- **3f (Maintenance-Crawler):** `curl` muss im GH-Actions-Workflow-Container verfügbar sein (`ubuntu-latest` hat es by-default; explizit dokumentieren).
- **distant:** Lexicanum-`apiSearchFallback()` als zweiter Discovery-Pfad (heute Cloudflare-blockiert auf `api.php`). Format/Availability-Heuristik aus Open Library mit per-Edition-Fetch + Sprach-Filter (heute durch LLM gelöst). Engine-Friktions-Befunde aus 037 (`SourceName`-Union vs Plugin-Pattern, kein shared HTTP-Throttle, generisches `auditPayloads` statt source-spezifische Slots).

---

## (10) Anthologie-Re-Test für Hebel E (Hardcover-Author-Hint)

**Owner:** Cowork (mini-brief). **Sessions:** [047-impl](../../sessions/2026-05-08-047-impl-pipeline-hardening.md). **Follow-up brief:** mini-brief post-049, before Modell-Entscheidung.

Hebel E (Anthologie-Author-Hint) ist code-verifiziert aber nicht empirisch validiert. 047-impl-Test-Lauf brach nach Buch 9 ab; einzige Anthologie wäre Buch 10 (Tales of Heresy) gewesen. Die 5 Hardcover-Hits im 0–9-Slice waren alle Single-Author-Novels, der Hint feuerte korrekt nicht. Empirischer Test braucht ein Anthologie-Sample: `tales-of-heresy`, `mark-of-calth`, `sons-of-the-emperor` (3 slugs reichen). Acceptance: `author_mismatch`-Flag soll 0/3 sein (oder begründet niedriger als 045's Sonnet-Pipeline-2/2). Mini-Brief, kein DB-Write.

## (11) Lexicanum trägt KEINE Junction-Daten — Body-Lore-Pass *oder* FIELD_PRIORITY-Reduktion

**Owner:** Cowork (architectural call), CC (implementation). **Sessions:** [047-impl](../../sessions/2026-05-08-047-impl-pipeline-hardening.md) (Lexicanum-Junction-Befund).

`lexicanum/parse.ts` extrahiert title / authorNames / releaseYear / isbn13 / startY / endY, aber NICHT factionNames / locationNames / characterNames — Lexicanum-Body-Wikitext ist Prosa, nicht Infobox. Junction-Coverage in 047 (6/6) kommt zu 100% aus dem LLM-Output. FIELD_PRIORITY `["lexicanum", "llm"]` für die drei Junction-Felder ist effektiv `["llm"]`. Zwei Optionen:

- **Option A — Body-Lore-Pass.** `extractLoreFromBody`-Function in `lexicanum/parse.ts` (Cheerio-Walks über `.mw-parser-output` mit Heuristiken für Faction/Location/Character-Linktexte). Lexicanum hat Wikilinks zu Factions/Locations/Characters in den Plot-Sektionen; ein einfacher Walker auf `<a href="/wiki/<entity>">` mit redirect-resolution würde 50–80% Coverage liefern. ~150 LoC, neuer Test-Lauf.
- **Option B — FIELD_PRIORITY ehrlich reduzieren.** Constant-Edit in `field-priority.ts`: `["lexicanum","llm"]` → `["llm"]` für factionNames/locationNames/characterNames. ~5 LoC. Verlorene Information: keine, da Lexicanum heute eh nichts beiträgt. Gewonnene Klarheit: niemand erwartet mehr Lexicanum als Lore-Quelle.

Mini-Brief, **kein DB-Write**. Empfehlung (Cowork's call): Option B als Sofortmaßnahme + Option A als spätere Optimierung wenn LLM-Cost gedrückt werden soll.
