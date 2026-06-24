---
session: 2026-06-24-164
role: architect
date: 2026-06-24
status: open
slug: ask-logic-tuning
parent: null
links: [2026-06-03-122, 2026-06-03-125, 2026-06-03-126, 2026-06-04-127]
commits: []
---

# 164 — Ask-Logik-Tuning: Anker-Signal + Stichentscheid (Board 122-B12)

> **✅ FINAL — bereit für CC.** Der Deep-Research-Pass (2026-06-24) ist gelaufen und eingearbeitet (siehe § „Research-Pass (abgeschlossen)"). Der Fragen-Contract ist final: **4 Fragen** (`era_pref` gestrichen). Brief kann implementiert werden.

## Goal

Die Ask-Empfehlung auf zwei Ebenen schärfen: (1) **Ranking-Mechanik** — die `recommend()`-Rangfolge so härten, dass die kanonischen Einstiegs-Anker bei passenden Profilen **zuverlässig oben** erscheinen (Anker-Daten-Signal als Merit-Beitrag + Stichentscheid-Fix gegen Recency-Bias). (2) **Funnel-Substanz** — der **Fragen-Contract** wurde durch den Research-Pass (s. u.) geprüft: Ergebnis ist die **Streichung von `era_pref`** (Funnel 5 → 4 Fragen); die übrigen vier Fragen (`experience`/`faction_love`/`tone`/`length`) bleiben unverändert. Erfolg der Mechanik-Ebene ist **audit-messbar** (Baseline → tunen → Re-Audit grün).

B12 war hinter B11 geparkt; mit dem voll gelaufenen Buch-Reviewer (154) + Stage 3 (155) + Gate F/L (158) ist die Facet-/Faction-Datenqualität jetzt belastbar, gegen die getunt werden darf.

**Vier Bausteine** (Reihenfolge der Implementierung empfohlen): (0) `era_pref` streichen → Baseline-Audit gegen den neuen 4-Fragen-Contract; (1) Anker-Daten-Signal; (2) Stichentscheid-Fix; (3) Overlay-Revision. Details unten.

## Context

Stand der Engine (gelesen 2026-06-24, Cowork):

- **Scoring** (`src/lib/ask/recommend.ts`): `score = Σ über aktive Tags (Gewicht × TAG_POINT_UNIT(=10) × Multiplier)`. Multiplier sind grob gestuft (0 / 0.35 / 0.5 / 0.6 / 0.65 / 0.75 / 0.8 / 0.85 / 1) → viele Bücher landen auf **identischen Score-Bändern**.
- **Stichentscheid** (`compareRecommendations`): bei Score-Gleichstand `rating → releaseYear (neuer zuerst) → title → slug`. Der `releaseYear`-Schritt ist eine **Recency-Verzerrung**, die ältere Klassiker (z. B. `xenos`/Eisenhorn, 2001) unter gleich gut bewertete, neuere Bücher drückt.
- **Kein Merit-Signal für „kanonischer Einstieg".** Die Engine kennt die Anker-Familien nicht. Der Audit (`scripts/audit-ask-combinations.ts`) *prüft* sie als 6 Plausibilitäts-Szenarien (Eisenhorn/Bloodlines/Vaults of Terra · Gaunt/Cain/Cadia · Uriel Ventris/Brothers of the Snake · Night Lords/Talons/Iron Warriors · The Infinite and the Divine · explizite Horus Heresy), aber sie fließen **nicht** ins Scoring.
- **Hand-Overlay** (`src/lib/ask/curation.ts` + `scripts/seed-data/ask-curation.json`): 4 Regeln, alle aus der B4.3-Ära, decken nur Inquisition/Xenos. Zwei davon (`pin xenos`, `pin the-infinite-and-the-divine`) sind der lebende Beweis, dass die Engine diese Anker **nicht aus eigener Kraft** nach oben bringt. Overlay läuft als deterministischer Tail nach dem Base-Ranking; Pin default 80 P, Boost default 25 P.
- **Hard Boundaries** (`src/lib/ask/boundaries.ts`): Faction-Gate (Lead-Faction muss zur gewählten Faction passen; Fallback nimmt erste Nicht-Antagonist-Faction als Lead) + Single-Volume-Gate bei `length=standalone`. Filter, keine Gewichte.
- **Contract (alt → neu):** *bisher* 5 Fragen (`experience` ×3, `faction_love` ×5, `tone` ×5, `length` ×3, `era_pref` ×4) = 900 Kombinationen. **Final nach diesem Brief:** `era_pref` gestrichen → **4 Fragen** (`experience` ×3, `faction_love` ×5, `tone` ×5, `length` ×3) = **225 Kombinationen**. `scripts/seed-data/ask-questions.json` ist die SSOT der Optionen + Gewichte (NB: die „1080" in Boards/Rollups war ohnehin stale — Cowork korrigiert das im Koordinations-Pass).
- **Audit-Artefakte:** `npm run audit:ask-combinations` → `ingest/ask/audit-ask-combinations.{md,json}`. Reviewer-Aid, **kein** Frontend-Datenquell. Misst u. a.: empty/weak combos, Overdominanz (Top-1 ≥10 % / Top-N ≥25 % der Kombis), Tags ohne Ranking-Effekt, Plausibilitäts-Status `visible|review`, Coverage je Option.
- **Test:** `scripts/test-ask-recommend.ts` existiert als Recommend-Test.

Maintainer-Entscheid (2026-06-24): **Weg 2 + Stichentscheid** — Anker als systemisches Daten-Signal *plus* der billige Stichentscheid-Fix. Das Overlay bleibt, wird aber zur **Ausnahme-Schicht** degradiert, nicht weiter aufgebläht.

## Approach (Architektur — Outcomes, keine Zahlen)

Vier Bausteine. Die exakten Punktwerte, Multiplier-Stufen und Gewichts-Justierungen sind **Implementer-Sache** (gegen den Audit getunt); dieser Brief legt Form, Grenzen und Akzeptanz fest.

0. **Fragen-Contract: `era_pref` streichen (zuerst).** Die fünfte Frage entfällt — Begründung im Research-Pass unten. Outcome: `era_pref` (samt aller vier Optionen) raus aus `scripts/seed-data/ask-questions.json`; der Funnel rendert dann 4 Fragen; das `AskAnswers`-Shape verliert das `era_pref`-Feld. **Ripple, die CC abräumt:**
   - **`AskAnswers`-Typ / Parser / URL- & Persistenz-Contract.** Das `era_pref`-Feld fällt aus dem Answers-Typ und aus der URL-/State-Serialisierung. Alte Links mit `era_pref=…` dürfen **nicht crashen** — unbekannten Query-Param tolerant ignorieren (kein Hard-Fail, keine Redirect-Pflicht).
   - **Scoring.** Alle `era_*`-Answer-Tags (`era_heresy`/`era_m41`/`era_indomitus`) verschwinden als aktive Tags. Falls Bücher facetten-seitig `era_*`-Tags tragen, werden die jetzt nie mehr aktiviert → das ist akzeptabel (kein Fehler), darf aber **keine** „active-but-never-matched"-Warnung auf der *Frage*-Seite hinterlassen (es gibt die Frage nicht mehr). Die Horus-Heresy-/Ära-Intention wird künftig über `tone=mythic` + `faction_love` + das **Anker-Signal** (Baustein 1, HH-Anker) getragen, nicht über eine Ära-Frage.
   - **Audit.** `scripts/audit-ask-combinations.ts` iteriert künftig 225 statt 900 Kombinationen; die `era_pref`-Coverage-Sektion entfällt; die 6 Plausibilitäts-Szenarien bleiben (das „explizite Horus Heresy"-Szenario wird ohne Ära-Frage gestellt — über Tone/Faction/Anker). Audit muss nach der Streichung sauber durchlaufen.
   - **UI (`/ask`, Board 121) — nicht in diesem Brief bauen, aber nicht brechen.** Wenn die `/ask`-Frontend-Komponente die Fragenliste aus `ask-questions.json` rendert, fällt die 5. Frage automatisch weg; hartkodierte Annahmen „5 Fragen" / Fortschrittsanzeige sind ein **121-Folgepunkt** (hier nur als Übergabe vermerken, falls CC beim Test darauf stößt — nicht selbst am UI schrauben).

1. **Anker-Daten-Signal (neu).** Eine committete, hand-kuratierbare Seed-Daten-Datei (Präzedenz: `ask-curation.json`) listet die kanonischen Einstiegs-Anker per Buch-`slug`/`id`. Sie wird wie das Overlay **als JSON importiert und in-memory** an die geladenen Bücher gejoint — **kein Schema-Change, keine Migration, kein DB-Read-Pfad**. Jeder Eintrag trägt Provenienz (welche Quelle/welcher Einsteiger-Guide ihn als Anker ausweist) im Sinne der 122-Guardrail (`source_kind`/`confidence`-Geist; hier Kurations-Provenienz, nicht Scrape). Das Signal fließt als **Merit-Bonus ins Scoring** — bewusst *vor* dem Overlay-Tail, damit es Teil der „verdienten" Rangfolge ist, nicht der Hand-Korrektur.

2. **Stichentscheid-Fix.** Der `releaseYear`-Recency-Schritt darf nicht länger als Merit-Proxy bei Score-Gleichstand wirken. Outcome: bei gleichem Score rankt ein Anker-/höher-angesehenes Buch über einem bloß *neueren*; der finale Tie-Break bleibt **deterministisch und stabil** (gleiche Antworten → identische Rangfolge über Läufe). `releaseYear` darf als *letzter* deterministischer Diskriminator bleiben, aber nicht über Kanonizität/Rating dominieren.

3. **Overlay-Revision (schlank).** Die 4 Bestandsregeln gegen die aktuelle Datenlage + das neue Anker-Signal prüfen: Regeln, die ein Anker jetzt von selbst erledigt, **entfernen oder entschärfen** (kein Doppel-Push, der ein Buch absurd hoch pinnt). Overlay bleibt der letzte Tail (Hand gewinnt zuletzt), aber nur noch für echte Ausnahmen. **Keine** flächendeckende Neu-Bestückung — das ist genau der Hand-Spickzettel, den Weg 2 vermeidet.

**Initiale Anker-Liste:** CC schlägt sie aus den im Audit bereits kodierten Plausibilitäts-Familien + den zwei referenzierten Einsteiger-Guides (FanFiAddict, WH40K Book Club) vor — Größenordnung ~30–50 Bücher. Die Liste landet als Vorschlag im Report; **Philipp bestätigt/ergänzt** vor dem finalen Apply. Anker ≠ „bestes Buch absolut", sondern „verlässlicher Einstieg für sein Profil".

## Research-Pass (abgeschlossen 2026-06-24)

Deep-Research-Pass gelaufen (Quellen: FanFiAddict, WH40K Book Club, Grimdark Magazine, r/40kLore- + Horus-Heresy-Konsens). Frage: „sind das die richtigen Fragen, und sind die Anker die richtigen?" Ergebnis, eingearbeitet:

- **Frage 5 (`era_pref`) gestrichen.** Kein maßgeblicher Einsteiger-Guide routet Newcomer über Ära (M30/M31/M41/Indomitus) — die 4-Optionen-Frage verwirrt mehr als sie hilft und ist der wahrscheinlichste weak-combo-Treiber; ihr einziges valides Signal (M41 vs. Horus Heresy) rechtfertigt keine eigene Frage und wird künftig über Tone/Faction/Anker getragen. Konkrete Umsetzung + Ripple: Baustein 0 oben.
- **Übrige vier Fragen bleiben unverändert** (`experience`/`faction_love`/`tone`/`length`). Geprüft und bestätigt: `faction_love` hat **Inquisition bereits als eigene Option** (gut — Eisenhorn ist eine eigene Einstiegs-Lane, ≠ Guard); die `tone`-Achse (grimdark/heroic/political/military/mythic) deckt die Routing-Vokabeln der Guides ab (brutal/heroisch/Detektiv-Intrige/militärisch/Epos); `length` ist faktisch die Commitment-Achse (standalone/2+/egal), die die Guides real nutzen. **Kein Options-/Gewichts-Umbau in dieser Runde** — nur `era_pref` raus.
- **Anker-Familien bestätigt** (die 6 Audit-Szenarien decken sich mit dem Quellen-Konsens) + zwei Schärfungen für die Anker-Kuration (Baustein 1): **Inquisition** als eigene Lane (Anker: Eisenhorn/*Xenos*) und **Space Wolves** als zweiter Marine-Anker neben Ultramarines/Uriel Ventris. Konsens-Top-Anker für die Initial-Liste: Eisenhorn/*Xenos*, Gaunt's Ghosts/*First and Only*, Ciaphas Cain, Ultramarines/Uriel Ventris, Space Wolves, Night Lords (Chaos), *Horus Rising*-Trilogie (HH), *The Infinite and the Divine* (Xenos/Necron).
- **Print-vs-Audio** wird **nicht** zur Scoring-Frage — Format ändert nicht *welche* Story passt, nur die Konsumform → höchstens Result-Card-Facette / optionaler Filter (121), kein Funnel-Input.
- **Verwandte, separat geführte Idee:** „One Faction, One Book" (Every-Faction-Must-Read-Contentschicht) liegt als eigener Eintrag in `brain/wiki/roadmap.md` § Ideas Backlog — **nicht** Teil dieses Briefs.

Research-Quellen (für Provenienz, falls in `brain/raw/reviews/` abgelegt): FanFiAddict „So you want to start reading Warhammer 40,000", WH40K Book Club „Beginner's Guide", Grimdark Magazine „Where to start reading", Wargamer/PC-Gamer Horus-Heresy-Reading-Order, At Boundary's Edge zu *The Infinite and the Divine*.

## Constraints

- **Contract — final.** Die **einzige** zugelassene Fragen-Contract-Änderung ist die Streichung von `era_pref` (Baustein 0). Die übrigen vier Fragen — Fragen-IDs, Options-IDs, Reihenfolge — bleiben **byte-identisch**; das `AskAnswers`-Shape ändert sich nur um das entfallende `era_pref`-Feld. Tunebar sind die **Gewichts-Werte** in `ask-questions.json` und die Multiplier-/Scoring-Logik in `recommend.ts`. **Keine** weiteren Fragen/Optionen umbenennen, hinzufügen, umsortieren oder neu formulieren — auch nicht die Frage-/Options-*Copy* (das ist ggf. ein separater 121-UI-Pass, nicht hier).
- **Server-only bleibt server-only.** `recommend.ts` importiert weiter den DB-Client; nichts davon wandert in eine `'use client'`-Insel. **Kein UI-Change** (das ist 121 — `AskClient.tsx`/`ResultCard.tsx` nicht anfassen).
- **Kein Schema, keine Migration.** Anker-Signal lebt als Seed-Daten-JSON, in-memory gejoint. Wenn CC eine DB-Spalte für sauberer hält → **zurück an Cowork** (status: needs-decision), nicht eigenmächtig migrieren.
- **Determinismus.** Keine Zufalls-/Zeit-Komponente im Ranking. Gleiche Antworten → identische Top-N über Läufe.
- **Invariante hält:** jede der **225** Kombinationen (4-Fragen-Contract) liefert ≥1 Empfehlung (Audit `empty = 0`).
- **Anker-Bonus ist gebändigt.** Er nudged einen Anker *innerhalb seines passenden Slices* nach oben, darf aber Hard Boundaries nicht aushebeln und ein Profil nicht mit themenfremden Ankern fluten. Gating-Detail (z. B. nur wenn Base-Score > 0 / Boundaries bestanden) = CC, im Report begründen.
- **Provenienz** je Anker-Eintrag (Quelle des Anker-Status). Keine Version-Pins. Keine neuen Entity-Bilder.

## Out of scope

- **Faction-Gate-Recall-Lockerung.** Der Lead-Faction-Fallback in `boundaries.ts` *kann* legitime „supporting-faction"-Treffer wegfiltern. Diese Runde **nicht** lockern — nur **dokumentieren**, falls der Audit konkrete False-Negatives zeigt (→ Open Question für einen Folge-Brief). Hard-Boundary-Semantik bleibt konservativ.
- **Funnel-Umbau über `era_pref` hinaus.** Die einzige Contract-Änderung ist die `era_pref`-Streichung (Baustein 0). **Keine** weiteren Fragen umbauen, splitten (z. B. Marine-Chapter als eigene Faction-Optionen), zusammenlegen oder neu texten; **kein** Print-vs-Audio als Frage. Solche Ideen → künftiger Brief / Backlog.
- **UI / `/ask`-Frontend** (121). Reason-Captions etc. nur insoweit, wie das Datenmodell der `reasons` unverändert bleibt.
- **`db:sync`/Apply-Pfad.** Das Anker-JSON ist Frontend-Recommend-Daten (importiert), kein DB-Apply — keine Berührung der Apply-Kette.
- **Overlay flächendeckend neu bestücken** (s. o.).

## Acceptance

Die Session ist fertig, wenn:

- [ ] **`era_pref` gestrichen:** Frage + alle vier Optionen aus `ask-questions.json` entfernt; `AskAnswers`-Typ/Parser/URL-Serialisierung ohne `era_pref`; alte `era_pref=…`-Links crashen nicht (tolerant ignoriert); Audit iteriert 225 statt 900 Kombinationen; keine „active-but-never-matched"-Warnung durch entfallene `era_*`-Tags.
- [ ] **Baseline dokumentiert:** `npm run audit:ask-combinations` gegen den **neuen 4-Fragen-Contract** *vor* dem Mechanik-Tuning gelaufen, Kennzahlen (weak/empty count, Overdominanz-Liste, Plausibilitäts-Status, Tags ohne Effekt) im Report festgehalten.
- [ ] **Anker-Signal** als committetes Seed-Daten-JSON existiert, per-Eintrag-Provenienz, in-memory in `recommend()` gejoint, ohne Schema/Migration; initiale Liste als Vorschlag im Report (Philipp-Bestätigung eingeholt).
- [ ] **Stichentscheid** bevorzugt bei Score-Gleichstand nicht länger das neuere Buch als Merit-Proxy; Ranking bleibt deterministisch/stabil (im Recommend-Test abgesichert).
- [ ] **Overlay-Revision:** redundante/übersteuernde Bestandsregeln entfernt oder entschärft; verbleibende Regeln begründet; kein Doppel-Push.
- [ ] **Re-Audit grün gegen Zielmarken:** alle **6 Plausibilitäts-Szenarien `visible`**; **kein Buch** über den Overdominanz-Schwellen (Top-1 ≥10 % / Top-N ≥25 %); weak-combos messbar gesenkt ggü. Baseline; **keine** „active-but-never-matched"-Tags; `empty = 0` gehalten. Vorher/Nachher-Delta im Report.
- [ ] `scripts/test-ask-recommend.ts` erweitert/grün (Anker-Surfacing + Tie-Break-Verhalten abgedeckt).
- [ ] `npm run lint` + `tsc --noEmit` grün.

## Open questions (für den Report)

- Wie groß fiel die initiale Anker-Liste tatsächlich aus, und welche Slices blieben trotz Anker schwach (→ Kandidaten für gezielte Overlay-Ausnahmen)?
- Zeigt der Audit konkrete Faction-Gate-False-Negatives (Buch mit Wunsch-Faction nur supporting, weggefiltert)? Wenn ja: Liste für einen Boundaries-Folge-Brief.
- Wie ist die `rating`-Abdeckung im Korpus? Wenn dünn, hängt der alte Stichentscheid faktisch fast nur an `releaseYear` — relevant für die Begründung der neuen Ordnung.

## Notes

- Strang/Worktree: **`chrono-lexicanum-batches`**, Branch `codex/ingest-batches-ask-tuning` (Daten/Logik, kein UI). Code/Daten/Config → branch + PR. `brain/**` + `sessions/README.md` nicht anfassen (Rollup).
- Referenz-Frame für Anker liegt schon im Audit-Header kodiert (zwei Einsteiger-Guides + erwartete Familien) — das ist der Startpunkt der Anker-Kuration, nicht neu zu erfinden.
- Mentales Modell der Lösung (ELI5, für den Report-Kontext): Stichentscheid-Fix = „bei Gleichstand nicht "das neuere", sondern das besser angesehene Buch zuerst"; Anker-Signal = „Klassiker-Aufkleber, den die Engine selbst erkennt", statt eines ewig wachsenden Hand-Spickzettels.
- Illustrativer Shape des Anker-JSON (kein Implementierungs-Zwang):

  ```jsonc
  // scripts/seed-data/ask-anchors.json  (Form, nicht Inhalt)
  {
    "version": 1,
    "anchors": [
      { "book": "xenos", "note": "Eisenhorn — Inquisition entry", "source": "fanfiaddict|wh40kbookclub" }
      // …
    ]
  }
  ```
