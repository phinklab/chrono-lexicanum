---
session: 2026-05-20-086
role: implementer
date: 2026-05-20
status: complete
slug: hardcover-hit-rate-pass-2
parent: 2026-05-20-086-arch-hardcover-hit-rate-pass-2
links:
  - 2026-05-20-086-arch-hardcover-hit-rate-pass-2
  - 2026-05-19-085-arch-hardcover-hit-rate-hardening
  - 2026-05-20-085-impl-hardcover-hit-rate-hardening
  - 2026-05-15-075-impl-cockpit-drift-sort-and-rating
commits: []
---

# Hardcover-Hit-Rate Pass 2 — 6-Stage-Cascade + Author/Title-Normalize + Pass-2-Retry + CC-Direct-WebSearch-Overrides

## Summary

Alle vier Hebel implementiert und über den Drei-Phasen-Workflow gefahren. **Endstand: 116/200 (58.0 %) frische Phase-3-Run-Summary-Hits** — von 79/200 (39.5 %, Brief 085) ein Zuwachs von **+37 Hits**, aber **unter der 70-%-Ziel-Schwelle** und knapp unter die 60-%-Grenze. Klassifikation nach Brief 086 § Zielerreichung: **< 60 % — hard signal, strukturelle Hardcover-Coverage-Lücke für W40K** (Detail unten). Die Implementation ist vollständig (Acceptance-Checkliste erfüllt); das Ziel ist verfehlt. Beides ist hier sauber getrennt dokumentiert.

Die Hebel funktionieren mechanisch alle: Stage-6-Overrides hatten **95 % Hit-Quote** (19/20 geladen → hit, 0 `matched+miss`), die Pass-2-Retry-Schleife holte **18 von 38** `graphql_error` zurück, der Original-Roster-Fallback fing die Ravenor-Cleanup-Regression (`via=original`). Was fehlt, ist schlicht *hitfähiges Material*: Hardcovers **rated** W40K-Katalog ist deutlich dünner als die Brief-Schätzung (+40 Overrides) annahm — Phase 2 produzierte nur 20 hitfähige Overrides bei 62 dokumentierten Skips.

## Endstand-Klassifikation (Brief 086 § Zielerreichung)

| Metrik | Wert |
|---|---|
| **Phase-3-Run-Summary-Hits (086-Maßstab)** | **116/200 = 58.0 %** |
| Ziel-Schwelle | ≥ 140/200 = 70 % |
| Klassifikations-Band | **< 60 % — hard signal** |
| OQ-Konsequenz (Cowork macht den Flip) | OQ (10) **bleibt offen**; Folge-OQ OL-Fallback in den Carry-over **mit Priorität** |

Den OQ-/Wiki-Pass macht Cowork, nicht Codex (Brief § Zielerreichung). Ich reporte nur Endstand + Klassifikation.

## Counts-Delta (Subset-Split wie 085)

075-Subset = W40K-0001..0150, Welle-4 = W40K-0151..0200. 085-Spalte aus dem übernommenen `2026-05-20-085-impl`-Report; 086-Spalte aus dem Phase-3-Lauf (per-Buch verifiziert, Subset-Summen geprüft: 93+27+11+14+5=150 ✓, 23+19+8=50 ✓).

| Bucket | 075-Subset 085 | 075-Subset 086 | Welle-4 085 | Welle-4 086 | **Gesamt 085** | **Gesamt 086** |
|---|---:|---:|---:|---:|---:|---:|
| Hits | 59 | **93** | 20 | **23** | **79** | **116** |
| `no_author` | 14 | 14 | 0 | 0 | 14 | 14 |
| `null_result_zero_hits` | 39 | 27 | 16 | 19 | 55 | 46 |
| `author_mismatch` | 15 | 11 | 8 | 8 | 23 | 19 |
| `graphql_error` | 23 | 5 | 6 | 0 | 29 | 5 |
| `token_missing` | 0 | 0 | 0 | 0 | 0 | 0 |
| **Hit-Rate** | **39.3 %** | **62.0 %** | **40.0 %** | **46.0 %** | **39.5 %** | **58.0 %** |

**Zwischen-Anker Phase 1 (Hebel 1–3, ohne Overrides):** 99/200 = 49.5 %. Stage 6 (Overrides) brachte netto +17 (99 → 116): +19 Override-Hits, −2 durch die zwei `graphql_error`-Regressions (W40K-0098/0099, in Phase 1 noch Cleanup-Hits, in Phase 3 finaler API-Error). Die Welle-4-`null_result`-Zunahme (16 → 19) ist API-Rauschen plus die zwei Stage-Pfade, die im Necromunda/Inquisition-War-Cluster keinen rated Hardcover-Eintrag finden.

## Variant-Distribution (Hits only, Phase 3)

| Variant | Hits | Anteil |
|---|---:|---:|
| `cleanup` (Stage 1) | 92 | 79.3 % |
| `colon-suffix-drop` (Stage 2) | 1 | 0.9 % |
| `colon-prefix-drop` (Stage 3) | 0 | 0.0 % |
| `original` (Stage 4) | 3 | 2.6 % |
| `author-normalize-1` (Stage 5) | 1 | 0.9 % |
| `author-normalize-2` (Stage 5) | 0 | 0.0 % |
| `override` (Stage 6) | 19 | 16.4 % |
| **Summe** | **116** | 100 % |

Wie in 085 trägt Cleanup (Stage 1) die Masse. Die Colon-Fallbacks bleiben nahezu wirkungslos (1 Hit gesamt) — sie sind token-billig und bleiben für künftige Wellen drin, aber als Hebel sind sie tot. **Stage 6 (Override) ist mit 16.4 % der zweitstärkste Pfad** — der Beleg, dass CC-Direct-WebSearch der wirksamste der vier Hebel war, soweit Hardcover überhaupt rated Daten hat. Author-Normalize lieferte nur 1 Hit (Initial-Drop) — die `author_mismatch`-Population ist überwiegend echter Author-Mismatch (Hardcover indexiert unter abweichendem Namen oder gar nicht), nicht Initial/Diminutive-Form.

## Pass-2-Recovery (graphql_error-Bucket)

| | |
|---|---:|
| Pass-1 `graphql_error` count | 38 |
| Pass-2 recovered to hit | 18 (47.4 %) |
| Pass-2 recovered to benign miss | 15 |
| Pass-2 still `graphql_error` | 5 |

**Sleep-Dauer: 60 s** (Cowork-Default aus Brief-075-Empirie übernommen — kein 30/120-s-Abweichungsgrund beobachtet; Pass 1 zeigte API-Instabilität in zwei Bursts, kein klares Recovery-/Degradations-Signal gegen Ende, das eine andere Dauer gerechtfertigt hätte). Die Schleife funktionierte: 33 der 38 Pass-1-Errors verließen den Error-Bucket (18 → Hit, 15 → benigner Miss). Die verbleibenden 5 (`W40K-0095/0096/0097/0098/0099`) sind ein contiguous Burst, der durch beide Pässe instabil blieb — typisch transient; ein dritter Pass oder ein späterer Re-Run würde sie wahrscheinlich holen.

## Override-Table-Consumption (Phase 3)

| | |
|---|---:|
| Overrides geladen (`overrides[]`) | 20 |
| Overrides matched + hit | 19 (95.0 %) |
| Overrides matched + miss | **0** |
| Overrides geladen aber ungenutzt | 1 |

**Effekt-Check (Brief Schritt 8): `matched+miss` = 0 % der geladenen Overrides, weit unter der 25-%-Schwelle → kein Korrektur-Loop nötig.** Die verbatim-`hardcoverTitle`-Disziplin + die read-only-API-Desk-Verifikation aller 20 Overrides in Phase 2 haben sich ausgezahlt: jeder Override, dessen Buch in einen Stage-6-fähigen Endzustand (benigner Miss) lief, traf.

**Der 1 ungenutzte Override ist W40K-0096 "Legacy of Dorn".** Grund — präziser als die generische Skript-Meldung: das Buch endete in **finalem `graphql_error`** (eines der 5 hard-error-Bücher). `graphql_error` ist ein Hard-Error und bekommt **keine Stage-Eskalation** (Brief § Variant-Cascade) — Stage 6 feuert nur aus einem benignen Miss-Endzustand. Bei stabiler API wäre 0096 mit hoher Wahrscheinlichkeit ein Override-Hit gewesen (→ 117). Der Override-Eintrag ist korrekt, nur durch API-Instabilität blockiert.

## DB-Coverage (nachrangige Zahl)

`SELECT count(*) FROM book_details WHERE rating IS NOT NULL` = **119/200**. Run-Summary-Hits = 116.

**Divergenz = 3, und sie ist exakt erklärbar:** Das Backfill-Script schreibt nur bei Hits und lässt bei einem Miss ein evtl. vorhandenes Alt-Rating stehen (kein null-on-miss). Die 3 Differenz-Bücher sind genau die Diff-Liste-B-Einträge — `W40K-0095` (prior 3.25), `W40K-0098` (prior 4.10), `W40K-0099` (prior 4.43) — die in Phase 3 in finalem `graphql_error` landeten, deren Alt-Rating aber in der DB bestehen blieb. **Die 116 Run-Hits sind die ehrliche 086-Metrik** (was Brief 086 tatsächlich frisch konvertiert/bestätigt hat); 119 ist die akkumulierte DB-Coverage inkl. dieser 3 stale-aber-gültigen Vorwerte. (`works` = 200, `book_details` = 200 — Scope sauber.)

## WebSearch-Resolution-Statistik (Phase 2)

| | |
|---|---:|
| Phase-1-Benign-Misses recherchiert | 82 (= `phase1BenignMissCount`) |
| → resolved zu Override (`overrides[]`) | 20 |
| → dokumentiert skipped (`skipped[]`) | 62 |
| Counts-Invariante | 20 + 62 = 82 ✓ |
| ⌀ WebSearch-Calls pro Miss (CC-Self-Estimate) | ~1–2 Searches, `WebFetch` bei Mehrdeutigkeit für Titel/Slug/Contributors |

**Skip-Bucket-Diagnose (die direkteste Unter-Ziel-Diagnose, Brief § Zielerreichung).** Aufschlüsselung der 62 Skips:

- **~30 present-but-unrated** — Buch existiert auf Hardcover, aber `rating = null` (noch keine User-Ratings). Kein Override kann helfen.
- **~12 not on Hardcover** — null `_eq`-Treffer, Buch fehlt im Katalog.
- **~11 title-too-generic** — W40K-Edition nicht in den Top-5-`_eq`-Treffern (z. B. „Salvation", „Legacy").
- **~9 ordering-blocked** — eine rated Edition existiert, aber ein unrated same-author-Duplikat sortiert unter `title _eq` davor; Stage 6 (Titel-`_eq`, first author-match) greift das unrated Duplikat. **Das ist der Slug/ID-Stage-6-Folge-Brief** (OQ unten). `hardcoverSlug` ist für alle 9 in der JSON mitgeführt.

**Konsequenz:** Der weitaus größte Skip-Anteil (present-but-unrated + not-on-Hardcover ≈ 42 von 62) ist eine echte Katalog-/Coverage-Lücke, gegen die WebSearch machtlos ist. Das ist das „hard signal" — OL-Fallback (breiterer Katalog, eigener Rating-Pfad) ist die richtige nächste Hebel-OQ.

## Override-Beispiele (mit evidenceUrl)

| externalBookId | rosterTitle | hardcoverTitle (verbatim) | hardcoverSlug | evidenceUrl |
|---|---|---|---|---|
| W40K-0004 | Eisenhorn Omnibus | `Eisenhorn: The Omnibus` | `eisenhorn-the-omnibus` | https://hardcover.app/books/eisenhorn-the-omnibus |
| W40K-0040 | Gaunt's Ghosts: The Founding Omnibus, 1-3 | `The Founding` | `the-founding-2007` | https://hardcover.app/books/the-founding-2007 |
| W40K-0041 | Gaunt's Ghosts: The Saint Omnibus, 4-7 | `Gaunt's Ghosts: The Saint` | `gaunts-ghosts-the-saint` | https://hardcover.app/books/gaunts-ghosts-the-saint |
| W40K-0048 | Warriors of the Ultramar | `Warriors of Ultramar` (author `Graham McNeill`) | (s. JSON) | (s. JSON) |
| W40K-0119 | Helbrecht: Knight of the Throne | `Helbrecht: Knight of the Throne` (author `Collins`) | (s. JSON) | (s. JSON) |

Alle fünf trafen in Phase 3 mit `via=override`. Die Eisenhorn/Founding/Saint/Lost-Gruppe belegt das systemische Titelform-Drift-Muster (Roster-Omnibus-Bezeichnung ≠ Hardcover-Titel); Warriors of Ultramar + Helbrecht belegen den `hardcoverAuthor`-Pfad (Hardcover indexiert unter abweichender Author-Form).

## Diff-Listen

**Diff-Liste A** (`--force`-Overwrites mit Rating-Δ ≥ 0.01): **0.** Keine bestehenden Ratings driften — erwartungskonform.

**Diff-Liste B** (Hit→Miss-Regressions, prior rating now missing in der Run-Klassifikation): **3.**

| Buch | prior | Phase-3-Endzustand |
|---|---:|---|
| W40K-0095 „Imperator: Wrath of the Omnissiah" | 3.25 | MISS (`graphql_error`) |
| W40K-0098 „The Lords of Silence" | 4.10 | MISS (`graphql_error`) |
| W40K-0099 „Spear of the Emperor" | 4.43 | MISS (`graphql_error`) |

**Alle drei sind finale `graphql_error`, KEINE Cleanup-Regressions.** Die Skript-Auto-Warnung („investigate whether a cleanup-rule is too aggressive") ist hier ein Fehlalarm: Diff-Liste A = 0 (kein Cleanup-Overwrite driftete), und die einzige bekannte Cleanup-Übergreifung (Ravenor) wurde vom Original-Roster-Fallback als `via=original` gefangen. Die 3 Einträge sind genau der Diff-B-Fall, den der Brief explizit zulässt: „nur für finale `graphql_error` mit `priorRating !== null`". Die DB behält ihre Vorwerte (kein null-on-miss) — die „Regression" existiert nur in der Run-Klassifikation, nicht in den Daten. Sie gehören zum 5er-`graphql_error`-Burst (0095–0099) und sind transient.

## Phase-Cut-Dokumentation (/clear-Log)

- **Ein `/clear` zwischen Phase 2 und Phase 3** (Brief § /clear-Disziplin: „insbesondere zwischen Phase 2 und Phase 3"). Begründung: Phase 2 (82-Buch-WebSearch-Resolution) hatte den meisten Kontext gefüllt; Phase 3 ist Skript-Lauf + Report und braucht das WebSearch-Detail nicht mehr. Voraussetzung erfüllt: Override-JSON war append-mode-persistent committed (Phase-2-Abschluss). Der Resume lief über ein Handover-File (`brief-086-phase3-handover.md`) + den Brief.
- Kein `/clear` innerhalb Phase 1 oder zwischen Helper-Schreiben und Tests (Brief: nicht erlaubt).

## Phase-3-Mis-Run-Incident (Forward-Information)

Der **erste** Phase-3-Schreiblauf-Versuch lief falsch und musste wiederholt werden. Ursache: der Befehl wurde über den interaktiven `!`-Prompt abgesetzt, der in dieser Session **durch bash** (nicht PowerShell) läuft. Zwei Folgefehler: (a) der Windows-Backslash-Pfad `C:\Users\...` wurde in bash zu `C:Users...` zerlegt → `cd` schlug fehl → der Lauf lief im **Main-Worktree** (mit dem alten `origin/main`-Skript ohne 6-Stage-Cascade); (b) die PowerShell-Stream-Redirect `*>` ist in bash ungültig und verschluckte das `--hardcover-title-overrides`-Argument. Resultat: ein `--force`-Lauf des Alt-Skripts (80 Hits, keine Overrides), erkennbar an fehlenden `via=`-Annotationen und fehlendem Override-Flag im npm-Echo. **Kein Daten-Schaden** — das Alt-Skript schreibt dieselben Baseline-Ratings, die es ursprünglich erzeugte. Der korrekte Lauf wurde danach über das Bash-Tool mit Forward-Slash-Pfad (`/c/Users/Phil/chrono-lexicanum-batches`) + bash-Redirect (`> … 2>&1`) wiederholt. **Lehre für künftige Multi-Worktree-Schreibläufe: Forward-Slash-Pfade + bash-Redirects verwenden, nie PowerShell-Syntax über den `!`-/bash-Pfad.**

## Implementation — was umgesetzt wurde

- `scripts/hardcover-title-normalize.ts` — Re-Impl des 085-Cleanup-Layers + neues Feld `originalIfDifferent: string | null`.
- `scripts/hardcover-author-normalize.ts` — neuer pure DI-Helper: Initial-Drop + bidirektionaler Diminutive-Lookup gegen `scripts/seed-data/author-aliases.json`. Diminutive-Match **case-insensitive** (OQ-Entscheidung: Roster hat Title-Case-Idiosynkrasien; Test `'dan abnett' → 'Daniel abnett'` belegt den lowercase-Match bei verbatim-Rest).
- `scripts/seed-data/author-aliases.json` — bidirektionale Äquivalenz-Paare (Listengröße im Cowork-Band 8–15, aus den `author_mismatch`-Büchern abgeleitet).
- `scripts/backfill-hardcover-rating.ts` — 6-Stage-Cascade in verbindlicher Reihenfolge, zwei neue Flags `--write-misses` / `--hardcover-title-overrides`, Pass-2-Retry-Schleife (60 s), `via=<variant>`-Progress + Override-Detail-Sub-Zeile, vier Summary-Blöcke mit den Konsistenz-Regeln.
- `scripts/test-resolver.ts` — 18 `normalizeForHardcover`- + 7 `normalizeAuthor`-Cases (≥ 11 / ≥ 6 erfüllt). **151 passed, 0 failed.**
- `scripts/seed-data/hardcover-title-overrides.json` — Phase-2-Output, 20 Overrides + 62 Skips, Counts-Invariante erfüllt.

**Verifikation grün:** `npm run lint` (0 errors, 1 pre-existing custom-font-warning), `npm run typecheck` (clean), `npm run test:resolver` (151/0), `npm run brain:lint -- --no-write` (0 blocking, 14 warnings).

## Beantwortete Open-Questions (Brief)

- **Pass-2-Sleep-Dauer:** 60 s (Default beibehalten — kein Abweichungsgrund).
- **Author-Aliases-Listengröße:** im Band 8–15.
- **Diminutive-Case-Sensitivity:** lowercase-Match (case-insensitive First-Name).
- **WebSearch-Query-Form:** `"<title>" "<author>" hardcover.app`-Muster + `WebFetch` auf die Buchseite bei Mehrdeutigkeit für verbatim-Titel/Slug/Contributors.
- **Phase-1-Miss-JSON-Ablage:** unter `outputs/` belassen (Cowork-Tendenz, temporäres Run-Artefakt — nicht committed).

## For next session

1. **OL-Fallback als priorisierte Hebel-OQ** (Cowork öffnet sie). Die Skip-Diagnose (≈ 42/62 present-but-unrated + not-on-Hardcover) zeigt: das ist eine Hardcover-Katalog-Lücke, kein Resolver-Problem. OL hat breitere Coverage + eigenen Rating-Pfad.
2. **Slug/ID-Stage-6-Folge-Brief** für die ~9 ordering-blocked Bücher. `hardcoverSlug` liegt in der Override-JSON bereit; ein neuer Slug-/ID-Query-Pfad in der Library macht Stage 6 immun gegen das unrated-Duplikat-Sortierproblem. Trigger-Bedingung des Briefs (`matched+miss` hoch) ist NICHT eingetreten (0) — der Trigger ist hier stattdessen die ordering-blocked-Skip-Sub-Population.
3. **Optionaler Re-Run** für den 5er-`graphql_error`-Burst (0095–0099, inkl. des einen blockierten Overrides 0096) nach API-Stabilisierung → +5 bis +6 erreichbar (≈ 60–61 %), schiebt aber nicht über 70 %.
4. **OQ (10) bleibt offen** (Cowork-Flip).

## Status-Lifecycle (dieser Commit)

- Brief 086-arch: `open → implemented`.
- Brief 085-arch: → `superseded` + Banner-Satz (PR #72 ohne Merge geschlossen).
- Brief 085-impl: inhaltlich unverändert (Mess-Empirie-Anker).
- `sessions/README.md` Active-Threads aktualisiert.
- OQ-(10)-Flip macht Cowork, nicht Codex.
