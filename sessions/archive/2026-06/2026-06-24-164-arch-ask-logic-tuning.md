---
session: 2026-06-24-164
role: architect
date: 2026-06-24
status: implemented
slug: ask-logic-tuning
parent: null
links: [2026-06-03-121, 2026-06-03-122, 2026-06-03-125, 2026-06-03-126, 2026-06-04-127]
commits: []
---

# 164 — Ask-Overhaul: Contract-Reduktion + Anker-Signal + Precompute-Matrix (Board 122-B12 / 121)

## Goal

Die Ask-Empfehlung in einem Zug auf drei Ebenen überholen: **(1) Contract** — den Fragen-Funnel von 5 auf 4 Fragen verschlanken und die Achsen entrümpeln (`era_pref` raus; `faction_love`: `imperium`+`inquisition` → ein `imperium_of_man`; `tone`: `mythic` raus, `political`→`investigative`; plus echte `any_faction`/`any_tone`-Optionen, die als **Aggregation** statt als eigene Zellen funktionieren). **(2) Ranking-Mechanik** — kanonische Einstiegs-Anker als **lane-skopiertes Merit-Signal** ins Scoring, plus Stichentscheid-Fix (Recency-Bias raus, ein geteilter Comparator). **(3) Auslieferung** — Ask bekommt eine **precomputed Ergebnis-Matrix** (pro vollständigem Profil Top-6; UI zeigt Top-3, „Load more" +3, dann „Browse deeper" → echte Query). Erfolg ist **audit-messbar** (Baseline gegen den neuen Contract → tunen → Re-Audit grün).

## Design freedom — read before everything else

Diese Runde fasst `/ask`-UI an (Top-3/Load-more/Browse-deeper, neue Option-Copy, Aufräumen der „fünf Fragen"-Texte). **Alle ästhetischen und Copy-Entscheidungen gehören dir.** Du hast den frontend-design Skill; nimm ihn.

Dir gehören: Layout und Visuals der gestaffelten Ergebnis-Enthüllung (Top-3 vs. nachgeladene 3, Übergänge, Timings), die exakte Wortwahl jedes neuen Buttons/Labels („Load more" / „Browse deeper"), die Player-facing Labels + Subs der neuen Optionen (`imperium_of_man`, `investigative`, `any_faction`, `any_tone` — ich gebe nur Option-**ID** + Semantik vor, der Text ist deine Voice), das Korrigieren der jetzt falschen „five / V / QVINQVE QVAESTIONES / … / ERA"-Copy auf den 4-Fragen-Stand (inkl. lateinischer Variante), Animations-/Stagger-Werte, Klassen-Shapes, oklch/px/ms.

Mir gehören (nicht ändern ohne Rückfrage): die Option-**IDs** und ihre Semantik (Contract), das Datenmodell von `reasons`/`recommendation`, die Server-/Client-Grenze, der URL-Contract, die Staffel-**Struktur** (Top-3 → +3 → live „Browse deeper"), und Accessibility-Outcomes (Tastatur-Bedienbarkeit der Staffelung, `prefers-reduced-motion`, SSR-fähiger Erst-Render ohne JS-Abhängigkeit für die initialen Top-3).

## Context

Engine-Dateien, die der Umbau anfasst — Ripple-Karte für CC:

**Contract / Typen**
- `src/lib/ask/types.ts` — SSOT der Typen: `ASK_QUESTION_IDS` (enthält noch `era_pref`), `ASK_OPTION_IDS_BY_QUESTION` (faction_love = imperium/heretic/loyalist_sm/inquisition/xenos; tone = grimdark/heroic/political/military/mythic; era_pref = …), `ASK_WEIGHT_TAGS` (enthält `era_*`, `tone_mythic` und den bereits verwaisten `faction_guard` — keine Option erzeugt ihn).
- `scripts/seed-data/ask-questions.json` — SSOT der Optionen + Gewichte. `length` hat bereits eine `any_length`-Option mit leerem Gewicht `{}` (Präzedenz für „No preference").
- `src/lib/ask/params.ts` — Parse/Serialize. Liest nur bekannte Question-IDs → unbekannte Query-Params (alte `era_pref=…`-Links) werden bereits stillschweigend ignoriert, kein Crash. Keine zusätzliche Toleranz-Logik nötig.
- `src/lib/ask/questions.ts` — importiert das JSON als typisierte `ASK_QUESTIONS`.

**Scoring / Ranking**
- `src/lib/ask/recommend.ts` — `score = Σ (Gewicht × 10 × Multiplier)`; `evaluateTag`-Switch ist exhaustiv über `AskWeightTag` (Tag entfernen = Switch-Case + `TAG_LABELS` + Evaluator mitentfernen, sonst Typfehler). `faction_imperium` matcht via Alignment/Baum bereits den Inquisitions-Teilbaum (Inquisition liegt unter `imperium`). `compareRecommendations`: `score → rating → releaseYear(neuer zuerst) → title → slug` — der `releaseYear`-Schritt ist die Recency-Verzerrung. Buch-Load ist in-memory gecacht (`cachedAskBooks`, geleert über `/api/revalidate`).
- `src/lib/ask/curation.ts` — Overlay-Tail nach dem Base-Ranking. `compareAppliedRecommendations` dupliziert denselben `score → rating → releaseYear → title → slug`-Vergleich (plus pinOrder davor). `parseWhen` validiert `when`-Clauses gegen `ASK_OPTION_IDS_BY_QUESTION` → wenn Option-IDs wegfallen, wirft das Overlay beim Laden, bis `ask-curation.json` migriert ist.
- `src/lib/ask/boundaries.ts` — Hard-Gates. `predicateForFactionAnswer` ist ein exhaustiver Switch über die Faction-Optionen (imperium/heretic/loyalist_sm/inquisition/xenos) → muss mit dem neuen Faction-Contract mitgehen. `any_length` heißt bereits „kein Length-Gate".
- `scripts/seed-data/ask-curation.json` — 4 Bestandsregeln (B4.3-Ära), `when` nutzt `faction_love:"inquisition"` (2×) und `:"xenos"` + `tone:"political"`. Zwei Pins (`xenos`, `the-infinite-and-the-divine`): Beleg, dass die Engine diese Anker nicht selbst hochbringt.

**Auslieferung / UI**
- `src/app/ask/page.tsx` — ruft heute bei vollständigem Profil live `recommend()` (server, `cacheBooks:true`). Stale Copy: Metadata „Answer **five** questions", `ASK_READOUT_LINES` („· **V** QVAESTIONES", „… TONE / LENGTH / **ERA**"), Footer `mid="QVINQVE QVAESTIONES"`. Der `… OF ${ASK_QUESTIONS.length}`-Zähler ist dynamisch (zieht automatisch auf 4).
- `src/components/ask/AskClient.tsx` — `QUESTION_TOPIC: Record<AskQuestionId,string>` enthält `era_pref:"Era"` → wird beim Entfernen von `era_pref` aus dem Typ zum Typfehler (Excess-Property). Eyebrow „QVINQVE QVAESTIONES", Sub „**Five** questions …", Kommentar „five marks". Funnel rendert datengetrieben aus `questions` (Schrittzahl folgt automatisch).
- `src/components/ask/ResultCard.tsx` — rendert heute alle `recommendations` (Prime + Runner), nutzt `partitionByLengthIntent` (`src/lib/ask/length-match.ts`) für die exact/further-Aufteilung. Hier landet die Top-3 → +3-Staffelung; mit der Length-Partition zu versöhnen.

**Audit / Tests**
- `scripts/audit-ask-combinations.ts` — `npm run audit:ask-combinations` → `ingest/ask/audit-ask-combinations.{md,json}`. Stale: `scenarioAnswers(…, era)` hat einen Era-Param; `new-guard` setzt `faction_love:"guard"` (keine Option); `heresyExposure()` liest `answerValue(…, "era_pref")`; `explicit-heresy` hängt an `era_pref:"heresy"` + `tone:"mythic"` (beide weg). Reviewer-Aid, kein Frontend-Datenquell.
- `scripts/test-ask-questions.ts` — strukturelle Validierung; Faction-Boundary-Test nutzt `faction_love:"inquisition"`/`"imperium"` + Inquisition-Ancestry-Kandidaten.
- `scripts/test-ask-recommend.ts` — DB-Smoke; `PROFILES` nutzen `era_pref` + `tone:"mythic"`/`"political"` + `faction_love:"inquisition"`; `assertRecommendationShape` erwartet exakt 5; Curation-Subtests boosten den `faction_guard`-Tag + `when tone:"political"`/`faction_love:"inquisition"`.
- `scripts/test-curation-overlay.ts` (`npm run test:curation-overlay`) — prüft das Overlay; mit Contract-Migration mitziehen.

**Maintainer-Entscheide:**
- **Ein großer Brief** (kein Arc) — alles in diese Runde.
- **Faction-Merge:** `imperium` + `inquisition` → `imperium_of_man`.
- **Tone:** `mythic`/`cosmic` raus, `political` → `investigative` (ID-Umbenennung).
- **Precompute-Matrix:** jetzt mit rein (Top-3 / Load-more / Browse-deeper).
- **Deep × Klassiker:** `experience = deep` schließt das Anker-/Klassiker-Set hart aus (eigenes Experience-Hard-Gate, Spiegel HH-aus-`new`). Kein Live-DB-Sonderpfad für deep — deep wird aus der Matrix bedient. Expliziter Old-Book-/Nischen-Autor-Booster nicht Teil dieser Runde.
- **Dominanz:** Anker-Bonus pro Buch auf eine Lane gekappt; Audit listet Dominanz pro Buch; Über-Präsenz per Overlay-`ban` entschärft. Automatische Cross-Cell-Kappung out of scope (Revisit-Trigger).

## Produkt-Entscheidungen & Rationale

Quellen-Frame für Anker: FanFiAddict, WH40K Book Club, Grimdark Magazine, r/40kLore-/HH-Konsens.

- **Faction-Merge.** Nach dem Merge disambiguiert die Tone-Achse die Imperium-Sub-Lanes: *military* → Astra Militarum (Gaunt/Cain/Cadia), *investigative* → Inquisition (Eisenhorn), *heroic/grimdark* → generische Imperiums-Helden. Anker hält die kanonischen Einstiege oben. Eisenhorn kommt über `imperium_of_man` + `investigative` + Anker zurück, nicht über eine eigene Faction-Option — 4 statt 5 Faction-Optionen ohne Lane-Verlust.
- **`mythic` raus.** Schwacher Newcomer-Filter. `mythic` und `era_pref` trugen bisher die HH-Intention; beide weg — Ersatz regelt das HH-Experience-Gate.
- **HH × Experience-Gate.** HH ist kein Newcomer-Stoff: `experience = new` filtert HH-Bücher hart raus (neues Hard-Gate); `some`/`deep` berücksichtigen sie voll, HH-Anker (*Horus Rising* etc.) auf `some`/`deep` laned. HH-Erkennung aus Buch-Daten (`primaryEraId` ∈ {great_crusade, horus_heresy} bzw. `startY` in M30–M31, = `isHeresy()`-Logik im Audit); kein era-Answer-Tag. Die Gating-Absicht wandert von der entfallenden era-Frage zu einer Experience-Regel.
- **`any` = Aggregation, kein Eimer.** `any_faction`/`any_tone` geben keine „Punkte auf alles" und sind keine eigenen handkuratierten Zellen; sie mergen deduped die konkreten Profile (Phase 2).
- **Precompute.** Nach der Reduktion ist die Matrix klein: konkret (ohne `any`) 3×4×4×3 = **144** Zellen, sichtbar (mit `any`) 3×5×5×3 = **225**. Top-6 pro Profil vorberechenbar; nur „Browse deeper" geht live.
- **Anker-Ausschluss bei `deep` statt Old/Obscure-Booster.** „deep" signalisiert: kenne die Klassiker, zeig was anderes. Der Hard-Ausschluss des Anker-Sets liefert genau das ohne neue Scoring-Maschinerie; der vorhandene `deep_cut`-Tag zieht deep ohnehin zu tieferer/älterer Backlist. Ein expliziter Old-Book-Booster (Pub-Date-Gewicht, Autor-Popularität) ist zurückgestellt, bis Deep-Nutzung das rechtfertigt (Open Question). Invariante: der Ausschluss darf keine sichtbare deep-Zelle leeren (Audit `empty = 0` auch für deep).
- **Dominanz erst soft + sichtbar.** „Eisenhorn überall" kommt von Anker-Boni, die über mehrere Tone-Lanes desselben Faction-Slice stapeln. Drei Hebel erschlagen das strukturell: strikt lane-gebundene Anker, Tone-Disambiguierung, Bonus-Cap auf eine Lane pro Buch. Rest-Dominanz aus dem Basis-Score macht der Audit pro Buch sichtbar; Maintainer entscheidet gezielt per `ban`. Auto-Cross-Cell-Cap birgt neue Fehler (ein Buch in einer Lane demoten, wo es legitim das beste ist) → erst die einfache, hand-steuerbare Stufe; Auto-Cap nur, wenn Bans nachweislich nicht reichen (Revisit-Trigger).

## Approach (Outcomes, keine Zahlen)

Exakte Punktwerte, Multiplier-Stufen, Gewichts-Justierungen, Klassen-Shapes und Copy sind Implementer-Sache (gegen den Audit getunt bzw. per Design-Freedom). Empfohlene Reihenfolge = Phasen-Reihenfolge. **Wenn das Context-Window eng wird: sauberer Split nach Phase 2** (Contract + Engine + Matrix stehen, getestet) **vor Phase 3** (UI) — als zweiter Commit/PR-Teil, nicht als halbe Phase.

### Phase 0 — Contract reduzieren
- `era_pref` (Frage + alle Optionen) raus aus `ask-questions.json` + `types.ts` (`ASK_QUESTION_IDS`, `ASK_OPTION_IDS_BY_QUESTION`). Funnel rendert dann 4 Fragen automatisch.
- `faction_love`-Optionen → **`imperium_of_man`, `loyalist_sm`, `heretic`, `xenos`, `any_faction`** (5 sichtbar, 4 konkret + 1 `any`). `imperium`/`inquisition` entfallen als eigene IDs.
- `tone`-Optionen → **`grimdark`, `heroic`, `investigative`, `military`, `any_tone`** (`mythic` raus; `political`→`investigative`; +`any_tone`).
- `length` bleibt (standalone/trilogy/any_length).
- `any_faction`/`any_tone` als reale Optionen mit leerem Gewicht `{}` (wie `any_length`); die Aggregation passiert in der Engine, nicht über Gewichte.
- **Minimaler UI-Typ-/Copy-Fix in derselben Änderung** (sonst rot): `QUESTION_TOPIC` in `AskClient.tsx` verliert `era_pref`; „five/V/QVINQVE/ERA"-Copy in `page.tsx` + `AskClient.tsx` auf 4-Fragen-Stand. `params.ts` braucht nichts (ignoriert alte Params schon).

### Phase 1 — Engine & Scoring
- **Verwaiste Tags weg.** `era_heresy`/`era_m41`/`era_indomitus`, `tone_mythic` und der verwaiste `faction_guard` raus aus `ASK_WEIGHT_TAGS`, `TAG_LABELS`, dem `evaluateTag`-Switch und den Evaluatoren (`evaluateEra`, `tone_mythic`-Gruppe, `faction_guard`/`GUARD_ROOTS`). Tag-Union spiegelt den Live-Contract; Audit zeigt keine unused/never-active Tags.
- **Merged-Faction-Semantik.** `imperium_of_man` matcht Imperium-Aligned inkl. Inquisitions-Teilbaum (`faction_imperium` tut das via Baum bereits; ob `faction_inquisition` als interner Beitrags-Tag bleibt oder verschmilzt = dein Call, im Report begründen). Kein Verlust der Inquisition-/Eisenhorn-Sichtbarkeit (Tone + Anker tragen sie).
- **Boundaries.** `predicateForFactionAnswer` auf den neuen Faction-Contract; `any_faction` = kein Faction-Hard-Gate. **Neu: HH-Hard-Gate** — `experience = new` filtert HH-Bücher (`primaryEraId`/`startY`) raus; `some`/`deep` lassen sie durch. Dafür braucht `passesHardAskBoundaries` das Era-Signal des Buchs → `AskBoundaryCandidate` um `primaryEraId` (und/oder `startY`) erweitern (liegt am `AskBookWork` in `recommend.ts` bereits vor; im `boundaryCandidate()`-Builder von `test-ask-questions.ts` mit-ergänzen). **Neu: Deep-Anker-Gate** — `experience = deep` filtert das Anker-/Klassiker-Set hart raus (zweites experience-skopiertes Hard-Gate). „Klassiker" = Buch ist Anker für irgendeine Lane; `passesHardAskBoundaries` braucht dazu die Anker-Set-Mitgliedschaft (zusätzliches Boundary-Candidate-Feld oder -Parameter). **Wechselwirkung HH-Anker × Deep-Gate:** Anker wie *Horus Rising* sind auf `some`/`deep` laned; das Deep-Gate übersteuert das für `deep` und schließt sie dort wieder aus. *Horus Rising* trägt damit effektiv `some`, `deep` bekommt tiefere HH-Cuts aus dem Basis-Score; der Lane-Tag `deep` an HH-Ankern darf im JSON bleiben (Gate übersteuert ihn, kein Entfernen nötig). Achte auf die ≥1-Ergebnis-Invariante: der Ausschluss darf keine sichtbare deep-Zelle leeren.
- **Anker-Daten-Signal (lane-skopiert, neu).** Committetes Seed-JSON (Präzedenz `ask-curation.json`), in-memory an die geladenen Bücher gejoint — kein Schema, keine Migration, kein DB-Read-Pfad. Jeder Eintrag ist profil-/lane-gebunden (nicht global): Buch + die Lane(s), für die es Anker ist (ein `when`-artiges Teil-Profil, z. B. Faction/Tone/Experience-Subset), `sources[]`, `confidence`, `note`. Der Bonus fließt als Merit ins Scoring vor dem Overlay-Tail und nur, wenn das aktive Profil die Lane(s) trifft. Gating (z. B. nur bei Base-Score > 0 / Boundaries bestanden) = dein Call, im Report begründen. **Bonus pro Buch auf eine Lane gekappt** — trifft das aktive Profil mehrere Lanes desselben Buchs, zählt nur die stärkste (kein Stacking innerhalb einer Wertung). Die getrennte Frage „ein Buch führt zu viele Zellen an" fängt der Dominanz-Report + Ban (Phase 5/4), nicht der Cap.
- **Stichentscheid-Fix + geteilter Comparator.** Den `score → rating → … → title → slug`-Vergleich in einen geteilten Comparator ziehen, den `recommend.ts` und `curation.ts` nutzen (Curation komponiert pinOrder davor). `releaseYear` darf nicht über Kanonizität/Rating als Merit-Proxy wirken — höchstens als später, deterministischer Diskriminator (oder ganz raus). Gleiche Antworten → identische Rangfolge über Läufe.

### Phase 2 — `any`-Aggregation + Precompute-Matrix
- **Precompute pro vollständig-konkretem Profil** (kein `any` auf Faction/Tone; `length` inkl. `any_length` zählt als konkreter Boundary-Zustand) → **144 Zellen**, je **Top-6**.
- **`any` = Aggregation, deterministisch.** `any_faction` = deduped Merge der 4 konkreten Faction-Zellen bei gleichem experience/tone/length; `any_tone` analog über die 4 konkreten Tones; beide `any` = Merge über die Faction×Tone-Konkret-Matrix. Merge = dedupe nach slug, neu sortieren mit dem geteilten Comparator, Top-6. Keine „Punkte auf alles", kein Doppelzählen. Lane-skopierte Anker kommen automatisch mit (sie liegen in ihrer konkreten Zelle, die der Merge einschließt).
- **Mechanismus (Empfehlung, nicht Vorschrift):** in-memory aufgebaut aus dem gecachten Buch-Set, geleert über denselben Revalidate-Pfad wie `cachedAskBooks`. Immer frisch, kein Stale-Artefakt, kein Commit-Churn; das Audit ist ohnehin die reviewbare Projektion derselben Rechnung. Falls du ein generiertes, committetes Artefakt bevorzugst (z. B. DB-frei zur Build-Zeit), ist das ok — Regen-Trigger + Rationale in den Report.
- **Hot-Path ohne Per-Request-DB.** Der Ergebnis-Pfad für ein fertiges Profil wird aus der Matrix bedient (kein Live-`recommend()` mehr in `page.tsx`); `recommend()` bleibt für Matrix-Bau, Audit und „Browse deeper". Jede der **225** sichtbaren Kombinationen liefert ≥1 Ergebnis.

### Phase 3 — `/ask`-Auslieferung (UI; Design-Freedom)
- `page.tsx` liest die Matrix-Zelle(n) für das Profil (Server) statt live zu ranken; sendet nur die nötige(n) Zelle(n) an den Client.
- **Staffel-Struktur (mir gehörig), Aussehen (dir gehörig):** initial **Top-3**; „Load more" enthüllt die nächsten **3** aus derselben precomputed Top-6; **danach** „Browse deeper" → echte Query (Live-`recommend()` über Top-6 hinaus oder Archiv-/Suche prefiltered auf das Profil — Ziel + Wording deins, muss live & profilbezogen sein, keine weiteren precomputed Zellen).
- Initiale Top-3 müssen SSR-fähig rendern (kein JS-Zwang für den Erst-Render); Staffelung tastatur-bedienbar; `prefers-reduced-motion` respektiert.
- `ResultCard.tsx` Staffelung mit `partitionByLengthIntent` versöhnen (exact/further-Aufteilung bleibt innerhalb der Staffelung sinnvoll).

### Phase 4 — Overlay-Revision (schlank)
- `ask-curation.json` `when`-Clauses auf den neuen Contract migrieren (`inquisition`→`imperium_of_man`, `political`→`investigative`), sonst wirft das Overlay beim Laden.
- Regeln, die das neue lane-skopierte Anker-Signal jetzt von selbst erledigt (insb. die zwei Pins `xenos` / `the-infinite-and-the-divine`), entfernen oder entschärfen — kein Doppel-Push. Overlay bleibt der letzte Tail für echte Ausnahmen; keine flächendeckende Neu-Bestückung.
- **Dominanz-Remedy (Ban).** Wo der Dominanz-Report (Phase 5) ein Buch über den Schwellen zeigt, das Lane-Scoping + Bonus-Cap nicht einfangen, entschärft ein gezielter Overlay-`ban` in der/den betroffenen Lane(s). Nicht präventiv bannen — nur gegen konkrete Audit-Befunde, so eng wie möglich (der Klassiker bleibt in seiner richtigen Lane sichtbar, führt nur nicht alle Tones an). Vorgeschlagene Bans wie die Anker im PR menschenlesbar listen (Lane + Grund + Report-Zahl); Philipp bestätigt vor Merge.

### Phase 5 — Audit-Neudefinition + Baseline + Re-Audit
- Audit iteriert den neuen sichtbaren Contract (**225**); Era-Param raus aus `scenarioAnswers`.
- Plausibilitäts-Szenarien neu: `new-guard` raus/umgebogen (Guard-Familien Gaunt/Cain/Cadia jetzt über `imperium_of_man` + `military`); `explicit-heresy` als **`some`-Profil** ohne `era_pref`/`mythic` (Faction + HH-Anker, erwartet *Horus Rising* / frühe HH; `some` bewusst, da *Horus Rising* unter `deep` vom Deep-Anker-Gate ausgeschlossen wird). Die 6 Anker-Familien bleiben, neu ausgedrückt.
- `heresyExposure()` ohne `era_pref` neu definieren. **Harte Erwartung:** HH-Anteil in `experience = new`-Kombis = **0**; HH sichtbar für `some`/`deep`. Weitere Metrik = dein Call.
- **Deep-Anker-Ausschluss prüfen.** Audit bestätigt **0** Anker-/Klassiker-Bücher in **allen** `deep`-Kombis und `empty = 0` für deep. Stichprobe in den Report: eine `deep`-Zelle zeigt andere, tiefere Titel als die `new`/`some`-Zelle desselben Faction/Tone.
- **Dominanz-Report (pro Buch).** Audit listet pro Buch, in wie vielen sichtbaren Zellen es Top-1 bzw. in den Top-N steht (über `new`/`some` — `deep` ist anker-frei). „Eisenhorn überall" wird namentlich sichtbar und liefert die Kandidatenliste für gezielte Bans (Phase 4). Schwellen Top-1 ≥10 % / Top-N ≥25 %.
- **Baseline** (`npm run audit:ask-combinations`, nach Phase 0, vor dem Mechanik-Tuning) im Report festhalten; am Ende **Re-Audit grün** gegen die Zielmarken, Vorher/Nachher-Delta in den Report.

**Initiale Anker-Liste:** CC schlägt sie aus den im Audit kodierten Plausibilitäts-Familien + den referenzierten Einsteiger-Guides vor — ~30–50 Bücher, jeweils lane-gebunden (Eisenhorn/*Xenos* [imperium_of_man+investigative], Gaunt's Ghosts/*First and Only* & Ciaphas Cain [imperium_of_man+military], Ultramarines/Uriel Ventris & Space Wolves [loyalist_sm], Night Lords [heretic], *Horus Rising* [HH-Anker, laned auf `some`/`deep`; `deep` vom Deep-Gate überstimmt], *The Infinite and the Divine* [xenos]). CC committet das Anker-JSON in den PR; **Philipp bestätigt/ergänzt vor dem Merge** (kein Mid-Session-`needs-decision`-Stop). CC listet die Anker im Impl-Report zusätzlich menschenlesbar (nach Lane gruppiert, mit Quelle + Note). Anker ≠ „bestes Buch absolut", sondern „verlässlicher Einstieg für sein Profil".

## Constraints

- **Contract — final.** Genau diese Achsen/IDs: experience(3) · faction_love{imperium_of_man, loyalist_sm, heretic, xenos, any_faction} · tone{grimdark, heroic, investigative, military, any_tone} · length{standalone, trilogy, any_length}. Keine weiteren Fragen/Optionen erfinden, splitten oder umsortieren. Option-IDs sind Contract (meins); Labels/Subs sind Copy (deins).
- **`any` marginalisiert, vergibt nicht.** Keine eigenen handkuratierten Zellen, keine „Punkte auf alles" — nur deduped Aggregation aus konkreten Profilen.
- **Anker gebändigt, lane-gebunden & gekappt.** Nudged nur im passenden Slice, hebelt Hard-Boundaries nicht aus, flutet kein Profil mit themenfremden Ankern. Bonus pro Buch auf eine Lane gekappt. Provenienz je Eintrag.
- **Determinismus.** Keine Zufalls-/Zeit-Komponente; gleiche Antworten → identische Top-N (inkl. `any`-Merge) über Läufe.
- **Kein Schema, keine Migration.** Anker-JSON in-memory gejoint. Hält CC eine DB-Spalte für sauberer → zurück an Cowork (`needs-decision`), nicht eigenmächtig migrieren.
- **Server bleibt server.** `recommend.ts`/Matrix-Bau importieren weiter den DB-Client; nichts davon wandert in eine `'use client'`-Insel. Matrix-Hot-Path ohne Per-Request-DB; nur „Browse deeper" geht live.
- **HH-Hard-Gate.** `experience = new` schließt HH-Bücher hart aus (era-Signal aus Buch-Daten, nicht aus einem Answer-Tag); `some`/`deep` lassen sie zu. Zusätzlich zum Faction-/Length-Gate.
- **Deep-Anker-Gate.** `experience = deep` schließt das Anker-/Klassiker-Set hart aus (Membership „ist Anker für irgendeine Lane"); deep bleibt in der Matrix, kein Live-Sonderpfad. Übersteuert die `some`/`deep`-Lane der HH-Anker für `deep`. ≥1-Invariante gilt auch nach Ausschluss (Audit `empty = 0` für deep).
- **Dominanz sichtbar + hand-steuerbar.** Anker-Bonus auf eine Lane gekappt; Audit weist Dominanz pro Buch aus; kein Buch über den Schwellen; Remedy = gezielter Overlay-`ban`. Automatische Cross-Cell-Kappung out of scope (Revisit-Trigger).
- **Invariante:** jede der **225** sichtbaren Kombinationen liefert ≥1 Empfehlung (Audit `empty = 0`).
- **Keine Version-Pins. Keine neuen Entity-Bilder.**

## Out of scope

- **Faction-Gate-Recall-Lockerung** (`boundaries.ts` Lead-Faction-Fallback). Diese Runde nur dokumentieren, falls der Audit konkrete False-Negatives zeigt (→ Open Question für Folge-Brief). Hard-Boundary-Semantik bleibt konservativ.
- **Funnel-Umbau über das Festgelegte hinaus** — keine weiteren Achsen, kein Print-vs-Audio als Frage, keine Marine-Chapter-als-Faction-Splits. „One Faction, One Book" liegt separat in `brain/wiki/roadmap.md` § Ideas Backlog.
- **`db:sync`/Apply-Pfad.** Anker-JSON ist Frontend-Recommend-Daten (importiert), kein DB-Apply.
- **Deep Live-DB-Sonderpfad.** Verworfen (zu komplex, ungewisse Nutzung) — deep bleibt Matrix-bedient. Nicht bauen.
- **Expliziter Old-Book-/Lesser-Known-Author-Booster.** Vertagt; Anker-Ausschluss bei `deep` + `deep_cut`-Tag tragen deep vorerst. Kein neuer Pub-Date-/Autor-Popularitäts-Score in dieser Runde.
- **Automatische Cross-Cell-Dominanz-Kappung.** Vertagt; erst Lane-Scoping + Bonus-Cap + Audit-Sichtbarkeit + manuelle Bans. Revisit-Trigger s. Open Questions.
- **Map/P14, URL-EN/P12, Mobile/P13** — andere Stränge.
- **`brain/**` + `sessions/README.md`** schreibt CC hier nicht — Cowork rollt nach dem Merge nach (PR-Policy). CC staged nur die Brief-Datei + Code/Daten und flippt im PR `status: open → implemented`.

## Acceptance

Die Session ist fertig, wenn:

**Contract**
- [ ] 4 Fragen; `era_pref` (Frage+Optionen) raus aus `ask-questions.json` + `types.ts`; `AskAnswers`/Parser/URL ohne `era_pref`; alte `era_pref=…`-Links crashen nicht.
- [ ] `faction_love` = {imperium_of_man, loyalist_sm, heretic, xenos, any_faction}; `tone` = {grimdark, heroic, investigative, military, any_tone}; `any_*` mit leerem Gewicht.
- [ ] `QUESTION_TOPIC` + alle „five/V/QVINQVE/ERA"-Copy auf 4-Fragen-Stand; Typecheck grün.

**Engine**
- [ ] Verwaiste Tags (`era_*`, `tone_mythic`, `faction_guard`) vollständig entfernt; Audit zeigt keine unused/never-active Tags.
- [ ] `imperium_of_man` matcht Imperium inkl. Inquisitions-Teilbaum; Eisenhorn-Lane via `investigative`+Anker erhalten.
- [ ] Lane-skopiertes Anker-JSON: committet, per-Eintrag-Provenienz, in-memory in `recommend()` vor dem Overlay gejoint, ohne Schema/Migration; initiale Liste im PR (Philipp-Bestätigung via PR-Review).
- [ ] Ein geteilter Comparator in `recommend.ts` und `curation.ts`; `releaseYear` nicht länger Merit-Proxy; Ranking deterministisch/stabil.
- [ ] **HH-Hard-Gate:** `experience = new` liefert keine HH-Bücher (audit-bestätigt = 0); `some` zeigt HH inkl. HH-Anker; `deep` zeigt HH, aber ohne Anker (Deep-Gate übersteuert die HH-Anker-Lane).
- [ ] **Deep-Anker-Gate:** `experience = deep` liefert keine Anker-/Klassiker-Bücher (audit-bestätigt: 0 in allen deep-Kombis); deep-Zellen nicht leer (`empty = 0`).
- [ ] **Dominanz-Cap:** Anker-Bonus pro Buch auf eine Lane gekappt; im `imperium_of_man`-Slice führt je Tone ein anderes Buch (investigative→Eisenhorn; military/heroic/grimdark→andere); kein Buch über den Schwellen.

**Auslieferung**
- [ ] Precompute: 144 konkrete Zellen Top-6; `any_faction`/`any_tone`/beide als deterministischer deduped Merge; Hot-Path ohne Per-Request-DB; alle 225 sichtbaren Kombis ≥1 Ergebnis.
- [ ] `/ask`: initial Top-3 (SSR-fähig) → „Load more" +3 → „Browse deeper" (live, profilbezogen); tastatur-bedienbar; `prefers-reduced-motion` respektiert.

**Overlay & Audit**
- [ ] Overlay `when` migriert; durch das Anker-Signal redundante Regeln entfernt/entschärft; kein Doppel-Push.
- [ ] Audit neu: 225 Kombis, kein Era-Param, kein `guard`-Szenario, `explicit-heresy` ohne era/mythic; Baseline (post-Phase-0) und Re-Audit im Report mit Delta.
- [ ] **Dominanz-Report:** Audit weist pro Buch Top-1-/Top-N-Häufigkeit über die sichtbaren `new`/`some`-Kombis aus; etwaige Über-Schwellen-Bücher per gezieltem `ban` entschärft (Bans im PR gelistet, Philipp-Bestätigung).
- [ ] **Re-Audit grün:** alle 6 Plausibilitäts-Szenarien `visible` (HH-Anker-Sichtbarkeit gegen ein `some`-Profil geprüft, da `deep` anker-frei); kein Buch über den Schwellen (Top-1 ≥10 % / Top-N ≥25 %); weak-combos ggü. Baseline gesenkt; `empty = 0` (inkl. deep).

**Grün**
- [ ] `npm run test:ask-questions`, `npm run test:ask-recommend`, `npm run test:curation-overlay` angepasst + grün (neue Optionen; Anker-Surfacing + Tie-Break + `any`-Merge abgedeckt; `test-ask-recommend` darf nicht mehr „exakt 5" hart erwarten).
- [ ] `npm run audit:ask-combinations` läuft sauber durch.
- [ ] `npm run lint`, `npm run typecheck`, `npm run brain:lint -- --no-write` grün.

## Open questions (für den Report)

- Wie groß fiel die initiale Anker-Liste aus, und welche Lanes blieben trotz Anker schwach?
- Greift das HH-Experience-Gate sauber (0 HH bei `new`, gute Sichtbarkeit bei `some`/`deep`), oder fängt der `primaryEraId`/`startY`-Detektor HH-Bücher unsauber (z. B. M31-Bücher ohne gesetzte `primaryEraId`)?
- Zeigt der Audit konkrete Faction-Gate-False-Negatives (Wunsch-Faction nur supporting, weggefiltert)? Wenn ja: Liste für einen Boundaries-Folge-Brief.
- Hat der Faction-Merge eine Inquisitions-Sichtbarkeitslücke erzeugt, die `investigative`+Anker nicht schließt?
- Precompute-Mechanismus: in-memory oder generiertes Artefakt? Wenn Artefakt — wie/wann regeneriert?
- Wie ist die `rating`-Abdeckung im Korpus (relevant für die neue Tie-Break-Ordnung)?
- Reicht für `deep` der Anker-Ausschluss + `deep_cut`-Tag, oder fehlt ein expliziter Old-/Obscure-Booster? (Entscheiden, sobald Deep-Nutzung sichtbar ist.)
- Zeigt der Dominanz-Report nach Lane-Scoping + Bonus-Cap noch Bücher über den Schwellen? Wenn ja: reichen gezielte Bans, oder rechtfertigt Zahl/Streuung die automatische Kappung?

## Notes

- **Strang/Worktree:** Cross-cutting, im **Product-Worktree** `chrono-lexicanum-product` gefahren, Branch z. B. `codex/product-ask-overhaul` — ein PR. Neben `/ask`-UI (`src/app/ask/**`, `src/components/ask/**`) fasst die Runde bewusst Batch-typische Pfade mit an: `src/lib/ask/**`, `scripts/audit-ask-combinations.ts` + `scripts/test-ask-*.ts` + `scripts/test-curation-overlay.ts`, `scripts/seed-data/ask-*.json` (+ neues `ask-anchors.json`) und ggf. einen Matrix-Build. **Architekt-vorgesehen** — kein §6-„falscher-Strang"-Halt. Worktree/Strang/Branch am Session-Start trotzdem ansagen. Parallele Batches-Arbeit, die `src/lib/ask`/`scripts/seed-data/ask-*`/die Ask-Skripte berührt, bis zum Merge anhalten (oder danach rebasen). `brain/**` + `sessions/README.md` schreibt CC nicht (Cowork-Rollup im Post-Merge-Pass).
- **Illustrativer Shape des lane-skopierten Anker-JSON (Form, kein Zwang):**

  ```jsonc
  // scripts/seed-data/ask-anchors.json  (Form, nicht Inhalt)
  {
    "version": 1,
    "anchors": [
      {
        "book": "xenos",
        "lanes": [{ "faction_love": "imperium_of_man", "tone": "investigative" }],
        "sources": ["fanfiaddict", "wh40kbookclub"],
        "confidence": "high",
        "note": "Eisenhorn — Inquisition entry via Imperium+investigative"
      }
      // …
    ]
  }
  ```
