---
session: 2026-05-09-055
role: architect
date: 2026-05-09
status: implemented
slug: v2-voll-lauf-decision-gate
parent: 2026-05-09-054
links:
  - 2026-05-09-054
commits: []
---

# V2 Voll-Lauf Decision Gate — 50–100 Bücher + zwei Pilot-Fixes

## Goal

Einen V2-Voll-Lauf über 50–100 Bücher fahren, der validiert, dass V2 an Volumen trägt, und der gleichzeitig die zwei Pilot-Schwächen aus 054 vorab fixt: das Discovery-Fuzzy-Merge-Symptom bei *eisenhorn-xenos* und den zu großzügigen Web-Search-Prompt (1.6/Buch im Pilot, Ziel ≤1.4). Output: ein committed Diff-File unter `ingest/.last-run/v2-batch-YYYYMMDD-HHMM.diff.json` (neuer Filename-Prefix), das die Cost-Projektion + Validator-Trigger-Raten am breiteren Korpus belegt — und der gleichzeitig die empirische Datenbasis für Brief 056 (Resolver + Unresolved-Queue Design) liefert.

Der Voll-Lauf ist **kein DB-Write, keine Migration, kein Apply**. Er ist Diff-only, im `/ingest`-Dashboard sichtbar, und produziert die Vergleichszahlen, die entscheiden, ob V2 nach 056 zum Default-Pfad wird (Brief 058 wäre der V1-Deprecation-Brief).

## Context

054 hat V2 als Pilot über fünf gezielt ausgewählte Bücher geshippt. Vier von fünf hard acceptance bullets clean, $0.062/Buch (vs. V1 post-047 $0.114/Buch — fast Halbierung), `false-gods` `startY=39000`-Halluzination korrekt durch `year_outlier`-Validator gedroppt, *tales-of-heresy* deterministisch als `format=anthology` über Validator 4 erkannt, *chem-dog* aus TLBranson-Discovery (Wikipedia-Frische-Lücke gepatcht). Die Codex-Review ([`brain/raw/reviews/2026-05-09-codex-v2-pilot-review.md`](../brain/raw/reviews/2026-05-09-codex-v2-pilot-review.md)) hat die Architektur bestätigt — V2 ist klar die bessere Pipeline-Basis, aber „noch nicht die Pipeline, die ich ohne 055-Test direkt auf 700+ Bücher loslassen würde".

Drei Befunde aus 054, die 055 vorab adressieren muss:

- **Discovery-Fuzzy-Merge-Edge-Case bei *eisenhorn-xenos*.** Der CC-Report dokumentiert: "the underlying merge folding may have a small bug where two records with different seriesHints (master list 'List of WH40k novels' vs. sub-page 'Eisenhorn') end up favoring the master-list seriesHint when the folding order doesn't match alphabetical." Der `synthesizeMissingBook`-Fallback hat den Pilot gerettet, aber das ist ein Warnlicht, das im Voll-Lauf für jedes Buch greifen würde, das in mehreren Wikipedia-Listen + einer Sub-Page gleichzeitig auftaucht — vermutlich ~30–50 Bücher im Voll-Lauf-Korpus.
- **Web-Search-Großzügigkeit.** 054-Pilot hatte 8 Web-Searches auf 5 Bücher (1.6/Buch). Slim-Prompt erlaubt das („up to 2 additional web_search calls when you spot specific gaps"), aber der CC-Report schlägt im „For next session"-Block eine engere Disziplin vor: „do NOT do a 2nd search unless 0 entities extractable from supplied context." Bei 750-Bücher-Voll-Lauf macht der Unterschied zwischen 1.0 und 1.6 Searches/Buch ~$10–15 Cost.
- **`garro` `pagecount_outlier` nur per Inspektion verifiziert.** Open Library hat im Pilot keinen `pageCount=2` für *garro* zurückgegeben (V1-bekannter Glitch nicht reproduzierbar). Bei 50–100 Büchern werden statistisch ein paar `pageCount<30`- und `pageCount>1500`-Outlier auftauchen, die Validator 3 empirisch demonstrieren werden — keine Code-Änderung nötig, nur empirische Bestätigung.

Parallel dazu: V2 schreibt `factions`/`locations`/`characters` als `{ name, role }` mit Surface-Forms (z. B. `{ name: "Sons of Horus", role: "primary" }`, oder `{ name: "House Glaw", role: "antagonist" }` für unbekannte Entitäten). Diese Surface-Form-Verteilung ist genau der Datensatz, den Brief 056 (Resolver-Design) braucht, um realistisch zu kalibrieren: wie viele Alias-Kollisionen treten auf, wie groß ist die Unresolved-Queue, wie verteilen sich Surface-Forms auf Top-N-Frequenz.

## Constraints

- **Kein DB-Write, keine Migration, kein 3d-Apply.** 055 produziert genau einen committed Diff-File. Bestehende Pipeline-Tabellen (`works`, `book_details`, Junctions) und Migration 0007 (`source_kind`-Enum) bleiben unangetastet. Resolver wird in 055 weder gebaut noch live geschaltet — Surface-Forms bleiben raw im Diff.
- **V1-Pfad bleibt funktional.** Default ohne `--pipeline=v2` Flag muss weiter den V1-Diff produzieren (Smoke-Test reicht). Begründung wie in 054: 044/047-Reproduzierbarkeit + Codex-Review-Anker.
- **TypeScript strict bleibt strict.** Kein `any`, kein `as unknown as`. Discovery-Merge-Fix exportiert seine Types; Web-Search-Prompt-Änderung passiert nur in `prompt.ts`.
- **Cross-platform.** Kein neuer Shell-Out; Pfade in Diff-Files mit `/`-Normalisierung wie heute.
- **Diff-File-Naming.** Pilot war `v2-pilot-YYYYMMDD-HHMM.diff.json`; Voll-Lauf wird `v2-batch-YYYYMMDD-HHMM.diff.json` — Prefix-Unterscheidung damit Dashboard und spätere Resolver-Tooling Pilot vs. Batch direkt erkennen können (`startsWith("v2-pilot-")` vs. `startsWith("v2-batch-")`).
- **PROMPT_VERSION_HASH bumpen wenn Web-Search-Prompt geändert wird.** Cache-Invalidation für die paar Pilot-Bücher ist bewusst gewollt — Web-Search-Disziplin im Voll-Lauf muss sauber gemessen werden.
- **Lauf-Reproduzierbarkeit.** Buch-Auswahl muss aus dem Code/CLI nachvollziehbar sein, nicht aus einem ad-hoc-Skript-Snippet. Entweder als hartcodierter Slug-Set (wie der Pilot) oder über deterministische Sortierung der Discovery-Output (z. B. erste 100 nach `slug`-Sort).

## Out of scope

- **Resolver-Code oder -Design.** Brief 056. 055 produziert den Datensatz, gegen den 056 designt — aber 055 schreibt keine Resolver-Module, keine Alias-Tabelle, kein `unresolved_entities`-Schema.
- **Schema-Änderungen jeder Art.** Migration 0007 bleibt committed-but-not-applied. Neue `unresolved_entities`-Tabelle ist 056er-Ding.
- **3d-Apply-Logik.** Auch nicht als Stub. FK-Resolution-Funktion auch nicht.
- **V1-Deprecation oder Code-Löschung.** V1-Module bleiben unangetastet. V1→V2-Konsolidierung ist Brief 058 (post-056-Resolver).
- **Vokabular-Erweiterung** (`duty`, `legion`, `chaos`-pov_side). Open Question 2 bleibt parallel offen, aber nicht in 055.
- **Modell-Entscheidung Haiku vs. Sonnet** (Open Question 1). 055 läuft auf Haiku 4.5 wie 054. Cost-Vergleich macht 058 nach V2-Konsolidierung.
- **Atlas-Regen.** Unverändert.
- **Phase-3.5-Dashboard-Code-Änderungen.** Wie 054: Diff muss ohne Dashboard-Edit als Card rendern. `v2-batch-`-Prefix-Filename darf nicht den Dashboard-Read-Path brechen.
- **Hardcover-Title-Variation-Suche.** Bleibt aus dem 3e-Backlog; nicht in 055.
- **Lexicanum-Body-Lore-Walker.** V2 hat das strukturell entschieden ([`brain/wiki/deferred-questions.md`](../brain/wiki/deferred-questions.md)); nicht in 055.

## Pre-Lauf Code-Fixes

### Fix 1 — Discovery-Merge-seriesHint-Folding deterministisch

In `src/lib/ingestion/discovery/merge.ts` ist die "generic-vs-specific seriesHint preference" derzeit folding-order-sensitiv (CC-Report 054-impl, „Open issues"-Block). Die Folge: wenn ein Buch in mehreren Discovery-Quellen mit unterschiedlichen seriesHints auftaucht, gewinnt nicht zwangsläufig der spezifischere Hint — sondern der, der zufällig zuerst gefoldet wurde. *eisenhorn-xenos* fiel auf die "List of WH40k novels"-seriesHint zurück statt auf "Eisenhorn", was den downstream-Match auf den hartcodierten Pilot-Slug brach.

Fix-Anforderung (architektonisch, Implementation an CC):

- **Generizität-Score deterministisch.** Eine Function `genericityScore(seriesHint: string): number` mit höherem Score = generischer. Konkrete Heuristik-Bestandteile (CC entscheidet die Schwellen): "List of"-Prefix, "novels"-Suffix, Length > 30 chars, Wort-Count > 4, Match gegen eine kleine Const-Liste bekannter Master-List-Anker (`["List of Warhammer 40,000 novels", "List of Black Library publications", ...]`).
- **Folding-Reihenfolge ignorieren.** `mergeDiscoveredBooks` foldet zwei Discovered-Records zusammen → der niedrigere `genericityScore` gewinnt für `seriesHint`. Bei Gleichstand: lexikographisch kleinerer String gewinnt (deterministisch, nicht order-dependent).
- **Unit-Test.** Mindestens drei Cases: (a) "Eisenhorn" wins over "List of Warhammer 40,000 novels", (b) "Horus Heresy" wins over "List of Black Library publications", (c) zwei generische Hints → lexikographisch kleinerer gewinnt.

### Fix 2 — Web-Search-Prompt-Disziplin

In `src/lib/ingestion/v2/llm/prompt.ts` muss die Sektion, die das LLM zu zusätzlichen Web-Searches autorisiert, restriktiver formuliert werden. CC-Vorschlag aus 054-impl: „do NOT do a 2nd search unless 0 entities (factions/locations/characters) are extractable from supplied context."

Fix-Anforderung (architektonisch):

- **Eine obligatorische Web-Search bleibt** (synopsis-context). `WEB_SEARCH_TOOL_V2.max_uses: 3` bleibt als Hard-Cap.
- **Zweite + dritte Web-Search müssen explizit konditioniert sein.** System-Prompt-Sprache muss klarstellen: zweite Search nur, wenn die mitgelieferten Plot-Context-Snippets KEINE extrahierbaren Faction-/Location-/Character-Surface-Forms enthalten. Dritte Search nur bei explizitem Daten-Konflikt zwischen zwei Quellen, der nicht aus dem Context lösbar ist.
- **`PROMPT_VERSION_HASH_V2` bumpen.** Der V2-Cache aus dem Pilot wird invalidiert. Re-Run der fünf Pilot-Bücher unter dem neuen Prompt ist Cost-trivial ($0.30 für die fünf), aber die Voll-Lauf-Messung muss sauber sein.

CC-Empfehlung im Report willkommen, ob die Prompt-Sprache als (a) System-Prompt-Härtung, (b) Tool-Description-Edit, oder (c) Beides am wirksamsten ist.

## Voll-Lauf-Konfiguration

### Buch-Auswahl

Vorschlag Cowork: **erste 100 Bücher nach `discovery/merge.ts`-Output, sortiert nach `slug`**. Begründung:

- Reproduzierbar: bei wiederholtem Lauf gleiche 100 Bücher (sofern Discovery-Cache identisch).
- Realistisch: kein cherry-picking nach Failure-Mode, repräsentative Mischung über das Universum.
- Stratifikation passiert implizit: HH/Eisenhorn/Cain/Standalones tauchen alle in den ersten 100 Slugs auf (alphabetisch frühe Slugs wie `a-thousand-sons`, `betrayer`, `eisenhorn-xenos`, etc. ziehen Anker-Reihen rein).

CLI-Form: `npm run ingest:backfill -- --pipeline=v2 --batch=v2-tryout-2 --limit=100`. Ein neuer `--batch=<name>`-Flag analog zum `--pilot=`-Flag des Piloten, der intern die ersten N nach Discovery-Sort wählt. Implementation an CC; alternative Form (`--limit=100 --offset=0`) ist akzeptabel, solange die Lauf-Reproduzierbarkeit gewahrt ist.

CC kann eine alternative Buch-Auswahl-Strategie im Report begründen — z. B. wenn die ersten 100 nach Slug zu unausgewogen sind (alle 100 starten mit "a"–"e"). Stratifizierte Auswahl (z. B. 25× erste HH, 25× Standalones, 25× jüngere Releases, 25× Anthologien/Novellas) wäre eine Alternative; reproduzierbar machen via expliziter Seed/Strategie-Funktion in Code.

### Re-Run der fünf Pilot-Bücher

Nicht zwingend, aber wenn billig: einmal `--pipeline=v2 --pilot=v2-tryout-1` nach Fix 2 (Prompt-Bump) laufen lassen, um zu prüfen, dass die fünf Pilot-Bücher unter dem neuen Prompt weiter alle Acceptance-Bullets aus 054 erfüllen. Falls das `chem-dog` aus TLBranson bricht oder `false-gods` plötzlich kein `year_outlier` mehr triggert, ist der Prompt-Härtung-Fix zu aggressiv. Optional, im Report dokumentiert ja/nein.

## Acceptance

The session is done when:

- [ ] `discovery/merge.ts` hat die deterministische `genericityScore`-Heuristik plus Unit-Test (mindestens die drei oben genannten Cases).
- [ ] `v2/llm/prompt.ts` hat den engeren Web-Search-Prompt-Wortlaut, `PROMPT_VERSION_HASH_V2` ist gebumpt.
- [ ] `npm run ingest:backfill -- --pipeline=v2 --batch=v2-tryout-2 --limit=100` (oder die CC-äquivalente Form) läuft 50–100 Bücher und produziert genau einen Diff-File unter `ingest/.last-run/v2-batch-YYYYMMDD-HHMM.diff.json`. Diff ist committed.
- [ ] Diff enthält für jedes Buch einen vollständigen `BookV2Record` mit `fields`, `validations`, `rawClaims`, `rawLlmPayload`, `llmCostSummary`.
- [ ] **Cost:** `llmCostSummary.estUsdCost`-Mittelwert über alle Bücher liegt im Korridor **$0.04–0.08/Buch** (Pilot war $0.062/Buch; Web-Search-Härtung sollte ihn weiter drücken, kein Buch sollte über $0.15/Buch liegen außer mit dokumentiertem Ausreißer-Grund).
- [ ] **Web-Search-Disziplin:** `llmCostSummary.totalWebSearches / Bücher` Mittelwert ≤ **1.4/Buch** (Pilot war 1.6; Ziel ≤1.2 wäre ideal aber nicht hart). Median 1.0 ist erwartet.
- [ ] **Discovery-Fuzzy-Merge:** kein Buch im Diff hat einen `errors[]`-Eintrag der Form `synthesized minimal record from slug` außer mit explizit dokumentiertem Grund (z. B. das Buch existiert wirklich in keiner Discovery-Quelle und musste hartcodiert werden).
- [ ] **Validator-Trigger-Volumen:** `validationSummary` zeigt für jeden der fünf Validator-Kinds (`year_outlier`, `edition_isbn_conflict`, `pagecount_outlier`, `author_editor_suspicion`, `lexicanum_missing`) ein nicht-Null Histogramm (auch wenn ein einzelner bei 0 bleibt — das ist ein Befund, kein Fehler). Im Report: kurze Tabelle „Validator X: N Trigger, davon N severity:error / N warn / N info; Liste der getriggerten Slugs als Audit-Anker".
- [ ] **Surface-Form-Verteilung:** Implementer-Report enthält pro Junction-Achse (`factions`, `locations`, `characters`) die Top-20-häufigsten Surface-Forms aus dem Diff, mit Frequenz. Beispiel-Tabelle: `Sons of Horus: 18, Imperium: 15, Word Bearers: 12, ..., House Glaw: 1`. Das ist die Basis für 056-Resolver-Kalibrierung.
- [ ] **Unbekannte-Entitäten-Schätzung:** Report enthält eine grobe Schätzung „N% der Surface-Forms haben einen Direct-Match auf `seed-data/factions.json` (resp. locations.json / characters.json), N% sind potenzielle Aliase, N% sind unbekannt". Direct-Match ist `slugify(name) ∈ ids`; Alias-Match und Unknown sind grobe Heuristiken, dürfen ungefähr sein. Diese Zahlen kalibrieren 056er Brief.
- [ ] V2-Pilot-Bücher (optional): falls Re-Run gemacht, Diff-Vergleich kurz dokumentiert (Validation-Counts gleich, Cost gleich oder niedriger, keine plötzlich gebrochenen Bullets aus 054).
- [ ] V1-Pfad unverändert: Smoke-Lauf `npm run ingest:backfill -- --slug=false-gods --dry-run` produziert weiter den V1-Diff-Schema. Diff danach gelöscht (kein Commit; nur Smoke).
- [ ] `npm run lint` und `tsc --noEmit` (oder das im Repo etablierte typecheck-Script) sind grün. `npm run brain:lint` ist auch grün (053 hat das CI-Gate, Brief 055 sollte es nicht brechen).
- [ ] Implementer-Report dokumentiert: tatsächliche Cost-Verteilung, Validator-Trigger-Volumen, Surface-Form-Top-20, Unbekannte-Entitäten-Schätzung, Buch-Auswahl-Strategie (falls von Cowork-Vorschlag abgewichen), Re-Run-Befunde der fünf Pilot-Bücher (falls gemacht), Code-Diff-Summary für die zwei Pre-Lauf-Fixes.

## Open questions

- **Buch-Auswahl-Strategie.** Cowork schlägt „erste 100 nach `slug`-Sort" als reproduzierbar + repräsentativ vor. CC-Empfehlung im Report willkommen — falls eine stratifizierte Auswahl (HH/Standalone/Anthologie/jüngste-Releases) bessere Validator-Trigger-Diversität bringt, wäre das ein Argument für Anpassung. Hauptkriterium: Reproduzierbarkeit aus dem Code allein.
- **Web-Search-Prompt-Härtungs-Form.** System-Prompt-Sprache, Tool-Description-Edit, oder beides? CC entscheidet auf Basis dessen, was die Slim-Prompt-Disziplin im Pilot-Re-Run am stärksten greift.
- **Surface-Form-Top-20-Format.** Im Implementer-Report als plain Markdown-Tabelle, oder als embedded JSON-Block für Resolver-Tooling-Direkt-Konsumption? Vorschlag Cowork: Markdown-Tabelle im Report (lesbar) + ein zusätzliches `ingest/.last-run/v2-batch-YYYYMMDD-surfaces.json`-File mit den vollständigen Frequenz-Counts (Resolver-Tooling-friendly). CC kann das Format final entscheiden.
- **Was tun, wenn ein Validator unerwartet hohe Trigger-Raten zeigt** (z. B. 50% der Bücher kriegen `year_outlier`)? Vorschlag Cowork: dokumentieren, nicht im selben Lauf fixen — das wäre Daten für einen separaten Validator-Tuning-Mini-Brief. Falls die Rate so hoch ist, dass der Diff unbrauchbar wird, in Report flaggen und mit Cowork sprechen statt einen Workaround einzubauen.

## Notes

- **Side-Goal explizit.** Der Voll-Lauf produziert die empirische Datenbasis, gegen die Brief 056 (Resolver + Unresolved-Queue Design) kalibriert. Surface-Form-Top-20 + Unbekannte-Entitäten-Schätzung im Report sind die direkten 056-Inputs. Ohne diesen Lauf wäre Resolver-Design Raterei.
- **Sequenz nach 055.** Wenn 055 trägt: Brief 056 (Resolver + Unresolved-Queue), Brief 057 (3d-Apply mit Resolver scharf), Brief 058 (V1-Deprecation + V2-as-Default-Konsolidierung). Wenn 055 nicht trägt (Cost-Explosion, Validator-Pathologien, Discovery-Bugs in unerwarteten Bereichen): kleinere Korrektur-Briefs vor 056.
- **Codex-Review als Audit-Anker.** [`brain/raw/reviews/2026-05-09-codex-v2-pilot-review.md`](../brain/raw/reviews/2026-05-09-codex-v2-pilot-review.md) hat den V2-Architektur-Stempel gegeben und die Resolver-Anforderungen für 056 vorgezeichnet. 055 setzt das Codex-Empfehlungspaket („vor 055 kleiner Discovery-Fuzzy-Merge-Fix + strengerer Search-Prompt") direkt um.
- Design-Freedom-Block fehlt absichtlich: dieser Brief berührt kein UI. Diff-Filename, Code-Fix-Form, CLI-Flag-Naming, Test-Cases sind Architektur- bzw. Implementierungs-Entscheidungen.
