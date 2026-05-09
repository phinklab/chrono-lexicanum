---
title: Open questions (next-brief queue)
type: overview
created: 2026-05-09
updated: 2026-05-09
sources:
  - ../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md
  - ../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md
  - ../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md
  - ../../sessions/archive/2026-05/2026-05-04-042-impl-phase3c-haiku-switch.md
related:
  - ./project-state.md
  - ./pipeline-state.md
  - ./deferred-questions.md
  - ./decisions/why-haiku-not-sonnet.md
confidence: high
---

# Open questions

> Items the **next** architect brief MUST address. The queue is intentionally small (3–5 items). Cowork prunes here when an item lands in a brief or is otherwise resolved. Dormant / distant items live in [`./deferred-questions.md`](./deferred-questions.md). Phase-internal backlog (3d / 3e / 3f reminders) lives in [`./pipeline-state.md`](./pipeline-state.md).
>
> **Migration history:** the original 9-item Carry-over (`sessions/README.md`) was migrated to 11 numbered items at the 049 Karpathy-Reset. Brief 051 (Brain Slim Pass, 2026-05-09) split the queue into actionable here + dormant in `deferred-questions.md` + sub-phase reminders in `pipeline-state.md`.

Format per item: **(N) <Title>** with `Owner: …` (who has to act) · `Sessions: …` (raw sources) · `Follow-up brief: …` (if known).

---

## (1) Phase-3e Modell-Entscheidung — Haiku bleiben vs. Sonnet-Upgrade

**Owner:** Cowork (architect decision, then CC implements). **Sessions:** [045-arch](../../sessions/archive/2026-05/2026-05-05-045-arch-cc-vs-pipeline-comparison.md), [045-impl](../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md), [047-impl](../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md). **Follow-up brief:** post-Anthologie-Re-Test (item 4).

Trade-off-Tabelle aus 045: Sonnet-Pipeline löst `dual` vs `imperium` (mark-of-calth-Tagging-Failure), gibt nuancierteres Plausibility-Reasoning, löst Vokabular-Drift `vengeance` semantisch. Cost ~3× Haiku ($88 → ~$250–300 für die restlichen 750 Bücher). Author-Mismatch bleibt auch mit Sonnet-Pipeline blind, aber 047 zieht den Pipeline-Hardcover-Hebel — danach ist die Modell-Achse sauberer messbar. Brief 046 (Opus-D) wurde 2026-05-08 zurückgezogen — die Modell-Frage entscheidet sich post-047 zwischen Haiku und Sonnet allein, basierend auf 045-Befunden + 047-Test-Lauf-Befunden (Hardcover-Hint-Effekt auf Author-Mismatch).

## (2) Vokabular-Erweiterung — `duty` + Faction-Dimension `legion` + `chaos`-pov_side-Pattern

**Owner:** Cowork (architect call) → CC (schema + seed + LLM prompt). **Sessions:** [044-impl](../../sessions/archive/2026-05/2026-05-05-044-impl-phase3e-batch-1.md), [045-impl](../../sessions/archive/2026-05/2026-05-05-045-impl-cc-vs-pipeline-comparison.md). **Follow-up brief:** likely bundled with item (1).

Drei separate Erkenntnisse:
- (a) `duty` ist 3-Modelle-Konsens echte Lücke (kein existierender Tag deckt die "selbstlose unpersönliche Pflicht/Stoik"-Semantik). Promotion-Kandidat zur facet_value.
- (b) `legion` als neue multi-value-Faceten-Dimension (`ultramarines`, `word_bearers`, `iron_hands`, `salamanders`, …) ODER `protagonist_class`-Erweiterung mit `heretic_astartes` + `loyalist_astartes`. Beide Optionen sind Designthema.
- (c) `chaos`-pov_side wird auch von Sonnet nicht für `mark-of-calth` gesetzt (Word Bearers + Daemonic in Synopsis, aber kein chaos-Tag) — Modell-übergreifender Blind-Spot. Wahrscheinlich Prompt-Härtung statt Vokabular-Erweiterung.

Plus: `value_outside_vocabulary` über 70 Bücher kumulativ (042 + 044): `duty` × 5 (`praetorian-of-dorn`, `the-master-of-mankind`, `wolfsbane`, `saturnine`, `blood-of-the-emperor`), `vengeance` × 1 (`shattered-legions`), `fate` × 1 (`ruinstorm`). `duty` ist klarer Promotion-Kandidat; die anderen brauchen mehr Datenpunkte.

## (3) Hand-Check-Workflow-Brief nach Architektur-Klärung

**Owner:** Cowork. **Sessions:** [040-arch](../../sessions/archive/2026-05/2026-05-04-040-arch-phase3c-haiku-switch.md). **Follow-up brief:** post-Modell-Entscheidung, pre-3d-Apply.

Sequenz: Anthologie-Re-Test (item 4) → Body-Lore-Pass / FIELD_PRIORITY-Cut (item 5) → Modell-Entscheidung + Vokabular (items 1+2) → **Hand-Check + Override-Schema** → 3d-Apply-Step. Hand-Check-Brief definiert das CSV-/Markdown-Override-Format und die Triage-Disziplin für Cowork (welcher Flag rolls auto, welcher braucht Cowork-Augen, welcher ignored).

## (4) Anthologie-Re-Test für Hebel E (Hardcover-Author-Hint)

**Owner:** Cowork (mini-brief). **Sessions:** [047-impl](../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md). **Follow-up brief:** mini-brief, before Modell-Entscheidung.

Hebel E (Anthologie-Author-Hint) ist code-verifiziert aber nicht empirisch validiert. 047-impl-Test-Lauf brach nach Buch 9 ab; einzige Anthologie wäre Buch 10 (Tales of Heresy) gewesen. Die 5 Hardcover-Hits im 0–9-Slice waren alle Single-Author-Novels, der Hint feuerte korrekt nicht. Empirischer Test braucht ein Anthologie-Sample: `tales-of-heresy`, `mark-of-calth`, `sons-of-the-emperor` (3 slugs reichen). Acceptance: `author_mismatch`-Flag soll 0/3 sein (oder begründet niedriger als 045's Sonnet-Pipeline-2/2). Mini-Brief, kein DB-Write.

## (5) Lexicanum trägt KEINE Junction-Daten — Body-Lore-Pass *oder* FIELD_PRIORITY-Reduktion

**Owner:** Cowork (architectural call), CC (implementation). **Sessions:** [047-impl](../../sessions/archive/2026-05/2026-05-08-047-impl-pipeline-hardening.md).

`lexicanum/parse.ts` extrahiert title / authorNames / releaseYear / isbn13 / startY / endY, aber NICHT factionNames / locationNames / characterNames — Lexicanum-Body-Wikitext ist Prosa, nicht Infobox. Junction-Coverage in 047 (6/6) kommt zu 100% aus dem LLM-Output. FIELD_PRIORITY `["lexicanum", "llm"]` für die drei Junction-Felder ist effektiv `["llm"]`. Zwei Optionen:

- **Option A — Body-Lore-Pass.** `extractLoreFromBody`-Function in `lexicanum/parse.ts` (Cheerio-Walks über `.mw-parser-output` mit Heuristiken für Faction/Location/Character-Linktexte). Lexicanum hat Wikilinks zu Factions/Locations/Characters in den Plot-Sektionen; ein einfacher Walker auf `<a href="/wiki/<entity>">` mit redirect-resolution würde 50–80% Coverage liefern. ~150 LoC, neuer Test-Lauf.
- **Option B — FIELD_PRIORITY ehrlich reduzieren.** Constant-Edit in `field-priority.ts`: `["lexicanum","llm"]` → `["llm"]` für factionNames/locationNames/characterNames. ~5 LoC. Verlorene Information: keine, da Lexicanum heute eh nichts beiträgt. Gewonnene Klarheit: niemand erwartet mehr Lexicanum als Lore-Quelle.

Mini-Brief, **kein DB-Write**. Empfehlung (Cowork's call): Option B als Sofortmaßnahme + Option A als spätere Optimierung wenn LLM-Cost gedrückt werden soll.
