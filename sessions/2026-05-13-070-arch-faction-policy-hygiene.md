---
session: 2026-05-13-070
role: architect
date: 2026-05-13
status: open
slug: faction-policy-hygiene
parent: null
links:
  - 2026-05-12-063-arch-resolver-50-books
  - 2026-05-12-069-impl-resolver-apply-evidence
commits: []
---

# Faction-Policy & Hierarchie-Hygiene

## Goal

Etabliere eine **Browse-Root-Policy** für Faktionen (deutet die UI-relevante Filter-/Browse-Ebene aus der lore-strukturellen Tree-Hierarchie heraus) und führe einen einmaligen **Hygiene-Audit** auf `scripts/seed-data/factions.json` durch, damit weitere Resolver-Batches (`ssot-w40k-006+`) nicht in Taxonomie-Drift laufen. Konkret: lege die Policy als Brain-Wiki-Seite plus kleine Datendatei ab, fixe vorhandene Lore-Bugs in `factions.json` (Heresy-Traitor-Legionen, Loyalist-Astartes-Chapters, `Chaos-Undivided`-Naming), ergänze das Resolver-Apply-Runbook um einen Parent-Hygiene-Check und führe einen optionalen `brain:lint`-Check ein. **Keine UI-Arbeit**, keine Schema-Migration, kein Re-Apply.

Hintergrund: Cowork-↔-Maintainer-Brainstorm 2026-05-13. Symptom-Anker: „niemand sucht nach Phantine Air Corps; das gehört unter Astra Militarum gerollt." Variante A (granular speichern, UI rollt hoch) ist die anvisierte Ziel-Architektur; dieses Brief ist die **leichtgewichtige Vorarbeit**, die nicht-blockierend zu Brief 061's Standing-Loop läuft.

## Context

**Stand 2026-05-13.** Resolver-Layer für 50 W40K-Bücher applied (069-Counts: `work_factions=318`, `work_locations=129`, `work_characters=363`). `factions.json` enthält 52 Einträge: ein Mix aus organisch früh geseedeten Faktionen (29 Pre-Resolver-Einträge) + 23 in Brief 063 hinzugefügten Resolver-Extensions. Hierarchie ist über `parent` (snake_case-FK auf eine andere `id`) modelliert; `factions.parentId` in der DB-Schema ist self-ref und genutzt.

**Beim Schreiben dieses Briefs entdeckte Lore-Bugs** in `factions.json` (siehe Notes-Tabelle 1 für vollständige Liste). Beispiele:
- Heresy-Traitor-Legionen `sons_of_horus`, `night_lords`, `thousand_sons`, `world_eaters` tragen `parent: "imperium"`. Lore-richtig ist `parent: "chaos"` (sie sind post-Heresy Chaos-Legionen; Pre-Heresy-Ambivalenz existiert lore-mäßig, aber für ein W40K-Wiki ist post-Heresy der Default).
- Loyalist-Astartes-Chapters `ultramarines`, `blood_angels`, `space_wolves`, `dark_angels`, `raven_guard`, `salamanders`, `imperial_fists`, `black_templars` tragen `parent: "imperium"`. Lore-richtig ist `parent: "adeptus_astartes"`.
- Der `chaos`-Faction-Row hat `name: "Chaos Undivided"` — semantisch missverständlich, weil dieser Row de facto als Chaos-Umbrella fungiert (Word Bearers, Iron Warriors, Blood Pact, Sons of Sek, Zoican Host, Daemons, Lords of the Unholy Host etc. zeigen alle als Kinder darauf), während „Chaos Undivided" in der Lore eine *spezifische* Worship-Form bezeichnet (Black Legion / Word Bearers Class), nicht das Sammelbecken.

**Browse-Root-vs-Tree-Root-Asymmetrie.** Im Schema existiert nur `parent_id`. „Browse-Root" = welche Faktion erscheint in der Filter-Leiste / im Hub-Dropdown als oberste UI-Klick-Ebene. Das ist NICHT identisch mit „Tree-Root" (`parent_id IS NULL`): Astra Militarum hängt strukturell unter Imperium (korrekte Lore-Hierarchie), soll aber UI-wirksam als Browse-Root auftreten. Imperium hingegen ist ein Grand-Alignment-Konzept (bereits abgedeckt durch `factions.alignment`), nicht eine sinnvolle Filter-Wahl. **Die Policy hält diese Unterscheidung in einer eigenen Datei fest, nicht in der DB** — das Schema bleibt unangetastet, bis später UI das Konzept wirklich braucht.

**Chaos-Umbrella-Entscheidung (Variante α aus dem Brainstorm 2026-05-13).** Wir behandeln „Chaos" als **Browse-Root mit eigenem Faction-Row** (uniforme UI-Logik: jeder Browse-Root ist ein Row). Der existierende `chaos`-Row dient als das Umbrella. `chaos_undivided` als separater, lore-spezifischer Eintrag wird **nicht in diesem Brief erstellt** — Entscheidung deferred, bis die Daten zeigen ob „Chaos Undivided" als unique-Worship-Form regelmäßig auftaucht.

**Sequenz zu Brief 061.** Der Standing-Loop pausiert auf 50er-Marke; Maintainer-Trigger für `ssot-w40k-006` läuft unabhängig von diesem Brief. Diese Hygiene ist **parallele, nicht-blockierende Arbeit** — der Loop kann fortlaufen, der Hygiene-Brief wird auf bestehende factions.json + zukünftige Resolver-Outputs einmal vorne dran appliziert und etabliert dann die Disziplin für die nächsten Batches.

**Open-Questions-Status.** OQ1 (Modell-Entscheidung), OQ2 (Vokabular-Erweiterung), OQ3 (Hand-Check-Workflow), OQ6 (Hardcover-Rating-Promotion) bleiben in `brain/wiki/open-questions.md` queued. Dieser Brief faltet keinen davon ein — die Faction-Policy-Hygiene wurde im Cowork-Brainstorm 2026-05-13 als parallele Sorge erkannt und wird hier addressiert ohne die anderen Queues zu blockieren.

## Constraints

### Brain-Wiki-Seite

- **Neue Datei** `brain/wiki/faction-policy.md` (Type: `decision` oder `overview`, CC's Wahl; Frontmatter inkl. `created`, `updated`, `confidence`, `sources`, `related` per Karpathy-Brain-Konvention — siehe `brain/CLAUDE.md`).
- Inhalt strukturiert die **drei Ebenen** explizit:
  - *Grand-Alignment* (existiert als `factions.alignment` enum: `imperium | chaos | xenos | neutral`)
  - *Browse-Root* (Filter-/Hub-Klick-Ebene; in der Policy-Datei aufgezählt; NICHT im DB-Schema)
  - *Sub* (alles unterhalb eines Browse-Roots; transitive `parent`-Kette)
- Listet die Browse-Roots auf (siehe Notes Tabelle 2) mit kurzer Lore-Begründung.
- Markiert die **Sonderfälle** explizit (siehe Notes Tabelle 3): Commissariat (institutionell-asymmetrisch — sitzt im Schema unter Imperium, wäre lore-präziser parallel zu Astra Militarum), `chaos` vs `chaos_undivided` (Naming-Entscheidung, `chaos_undivided` als getrennte Row deferred), Grey Knights (Chamber Militant des Ordo Malleus + Astartes-Grade — beide lore-richtig; CC's Wahl welcher Parent gewinnt), Genestealer Cults (lore-9th-Ed Sub der Tyraniden, ältere Lore behandelte sie separat; bleibt Sub).
- Hat einen Abschnitt **„Was wir bewusst NICHT entscheiden"**: Multi-Parent (DAG), Aeldari-Split (Craftworlds/Drukhari/Harlequins), Chaos-Gott-Splits (Khorne/Tzeentch/Nurgle/Slaanesh als separate Browse-Roots) — alles vertagt bis das Datenbild dichter ist.
- Verlinkt von `brain/wiki/index.md` aus (sub-section unter „decisions" oder „overviews", CC's Wahl) UND von `brain/wiki/project-state.md` (knapper Pointer im „What's running"- oder „Recently shipped"-Abschnitt nach Apply).

### Datendatei

- **Neue Datei** `scripts/seed-data/faction-policy.json`. Struktur:
  ```json
  {
    "browseRoots": ["astra_militarum", "adeptus_astartes", "inquisition", "mechanicus", "commissariat", "custodes", "sisters_of_battle", "ecclesiarchy", "imperial_navy", "grey_knights", "chaos", "eldar", "tau", "necrons", "tyranids", "orks"],
    "specialCases": {
      "chaos": "Synthetischer Umbrella-Row (name='Chaos'). Hosts Word Bearers / Iron Warriors / Blood Pact / Sons of Sek / Daemons / etc. 'Chaos Undivided' als separater Row ist deferred.",
      "commissariat": "Institutionell parallel zu Astra Militarum; im Schema unter Imperium (Single-Parent-Limit). Multi-Parent ist deferred.",
      "grey_knights": "Chamber Militant Ordo Malleus + Astartes-Grade. Single-Parent-Wahl in factions.json siehe Audit-Pass.",
      "genestealer_cults": "Sub-Faction der Tyraniden (parent='tyranids'), nicht eigener Browse-Root."
    }
  }
  ```
  Exakte Liste ist Notes Tabelle 2; obige illustriert die *Form*. CC darf die Form leicht anders strukturieren (z.B. zwei separate Files für browseRoots + specialCases), solange das Resolver-Apply-Runbook eine eindeutige Quelle für „ist X ein Browse-Root?" hat.
- **Keine** Drizzle-Schema-Änderung. Kein `kind`-/`browse_root`-Feld in der DB. Wenn später UI das Konzept braucht, ist eine eigene Migration und Brief-Entscheidung darüber wert.

### `scripts/seed-data/factions.json` — Audit-Pass

Reine `parent`-Korrekturen (kein Rename der `id`, keine neuen Rows in diesem Brief). Audit-Liste in Notes Tabelle 1. Konkret:

- **Chaos-Naming-Fix**: Row mit `id: "chaos"` ändert `name` von `"Chaos Undivided"` zu `"Chaos"`. Tone bleibt `"chaos"`. Parent bleibt `null`.
- **Heresy-Traitor-Legionen reparenten**: `sons_of_horus`, `night_lords`, `thousand_sons`, `world_eaters` von `parent: "imperium"` auf `parent: "chaos"`. `alpha_legion` ist lore-ambig (Cabal-Twist) — CC entscheidet (Empfehlung: `parent: "chaos"` mit `tone: "shadow"`; bei Abweichung im Report begründen).
- **Loyalist-Astartes-Chapters reparenten**: `ultramarines`, `blood_angels`, `space_wolves`, `dark_angels`, `raven_guard`, `salamanders`, `imperial_fists`, `black_templars` von `parent: "imperium"` auf `parent: "adeptus_astartes"`. `mortifactors` ist bereits korrekt (`parent: "adeptus_astartes"`).
- **`grey_knights`**: lore-ambig. CC's Wahl zwischen `parent: "adeptus_astartes"` (Astartes-Grade) oder `parent: "inquisition"` (Chamber Militant). Im Report begründen.
- **`alignment` setzen** wo heute fehlt: bei den oben gefixten Heresy-Legionen mindestens `alignment: "chaos"`; bei den Loyalist-Chapters `alignment: "imperium"`. Konvention aus dem Schema-Default ist `neutral` — Lore-eindeutige Fälle sollten explizit getaggt sein.
- **Existierende Resolver-Extensions** (die in 063 hinzugefügten 23 Einträge) sind durchgesehen und größtenteils korrekt geparented (Tanith First, Verghastite Ghosts, Belladon → astra_militarum-Linie; Blood Pact, Sons of Sek, Zoican Host etc. → `chaos`). CC durchgeht sie nochmal gegen die Policy zur Bestätigung; nur Korrekturen vornehmen wo lore-falsch (im Report dokumentieren).

**Idempotenz**: Diese Edits sind reine JSON-Patches an `factions.json`. Sie wirken auf die DB erst nach einem `db:seed-resolver-extensions`-Run (oder einem äquivalenten Re-Seed-Pfad). Da der heutige Seed-Skript via `INSERT … ON CONFLICT DO NOTHING` operiert, **erreicht ein Re-Run die Updates nicht** — Updates an `parent`/`name` für bereits-bestehende Rows brauchen entweder einen `ON CONFLICT DO UPDATE`-Pfad ODER einen separaten Mini-Update-Skript ODER ein Maintainer-handgesteuertes SQL-Statement. **Entscheidung dieser Sub-Frage ist CC's Wahl** (Notes Tabelle 4 für Optionen) — wichtig ist nur: nach dem Brief müssen sowohl `factions.json` (Source-of-Truth in Git) ALS AUCH die prod-DB den Lore-Fix-Stand reflektieren. Mechanik ist sekundär; im Report dokumentieren welcher Pfad gewählt wurde.

### Resolver-Apply-Runbook

- **`docs/resolver-apply-runbook.md`** erweitern um einen neuen Schritt: **„Pre-Apply Parent-Hygiene-Check"**. Vor jedem `db:apply-override --batch=ssot-w40k-NNN` durchläuft Maintainer (mit CC-Assistenz oder manuell):
  1. Diff `factions.json` HEAD vs. last-applied-batch-commit → neue Faction-Rows seit letztem Batch.
  2. Für jede neue Faction-Row: prüfen ob `parent` gesetzt ist und auf einen Browse-Root oder dessen Descendant zeigt.
  3. Bei Verstoß: `parent` korrigieren in `factions.json`, committen, `db:seed-resolver-extensions` (oder Update-Pfad aus Notes Tabelle 4) ausführen, dann erst den Apply-Sweep.
- Eingebaut im Runbook-Format des bestehenden Files (numerisches Schritt-Listing, kurze Begründung pro Schritt). CC orientiert sich am bisherigen Ton/Struktur.

### Optional: brain:lint Check

- **Nur falls trivial-cheap zu implementieren** (≤30 LOC im bestehenden lint-Skript): einen neuen Check, der über `scripts/seed-data/factions.json` iteriert und folgendes flagged:
  - Faction-Row mit `parent: null`, deren `id` NICHT in `faction-policy.json.browseRoots` ist → `warn`-Level.
  - Faction-Row mit `parent: "XXX"` wo `XXX` keine existierende Faction-ID ist (Dangling-FK) → `error`-Level.
- Falls die bestehende Brain-Lint-Architektur diesen Check nicht in ≤30 LOC sauber aufnimmt: **out of scope** für diesen Brief, dokumentieren im Report als Follow-up-Kandidat. Lieber sauber später als kompliziert jetzt.

### Verify

- `npm run lint` grün.
- `npm run typecheck` grün.
- `npm run brain:lint -- --no-write` grün (auch falls der neue Check NICHT eingebaut wurde — der existierende Lint darf nicht regressen).
- DB-Sanity-Check (Maintainer-trigger nach Update-Apply): `SELECT id, name, parent_id FROM factions WHERE id IN ('chaos', 'sons_of_horus', 'ultramarines', 'world_eaters', 'tanith_first') ORDER BY id;` — Output im Report. Erwartung: `chaos` heißt jetzt "Chaos", die vier ehemals-imperium-geparenteten Rows zeigen auf `chaos` bzw. `adeptus_astartes` entsprechend.
- **Keine Re-Apply existierender Batches.** Junctions sind unverändert; die `factions.parent_id`-Korrektur wirkt sich nur auf zukünftige Rollup-Queries aus (die noch nicht existieren).

## Out of scope

- **UI-Rollup-Implementierung.** Kein `WITH RECURSIVE`, kein neuer Faktions-Filter, keine `/fraktion/[slug]`-Page-Refactor, keine Buchdetail-Breadcrumb. Eigenes Brief, das sich nach reichhaltigerem Datenbild (post-`ssot-w40k-008+` schätzungsweise) anbietet.
- **Schema-Migration.** Kein `browse_root`-/`display_group`-/`kind`-Feld auf `factions`. Wenn UI das Konzept später wirklich braucht, ist eine eigene Brief-Entscheidung darüber wert (z.B. „lift `faction-policy.json` in eine DB-Spalte ja/nein").
- **Neue Faction-Rows.** Insbesondere: keine Khorne/Tzeentch/Nurgle/Slaanesh als separate Rows in diesem Brief; kein Sisters of Silence, kein Aeldari-Split, kein `chaos_undivided`. Diese Entscheidungen sind explizit deferred. Wenn der Resolver-Output in zukünftigen Batches sie surface'd, werden sie über das normale Resolver-Apply-Runbook (mit der neu hinzugefügten Hygiene-Check-Stufe) integriert.
- **Alias-Refactor.** Existierende `faction-aliases.json` bleibt unverändert. Insbesondere: das bestehende Alias `"Chaos" → "chaos"` bleibt; nach dem `name`-Rename ist „Chaos" direct-match, das Alias wird redundant — *darf* aufgeräumt werden, *muss* nicht (Resolver-Direct-Match-Pfad hat Priorität, das Alias schadet nicht). Im Report dokumentieren falls aufgeräumt.
- **Re-Apply von `ssot-w40k-001..005`.** Die Junction-Rows verweisen auf `faction_id`s, die unverändert bleiben (nur `parent_id` ändert sich auf der parent-Faction). Kein Apply-Sweep nötig.
- **HH-Domain.** Wenn der Loop später in die Heresy-Domain überrollt, kommen HH-spezifische Faction-Rows (verschiedene Primarchen, Legions-Disziplinen). Die Policy gilt dann unverändert für sie; konkrete HH-Audit-Liste ist eigenes Brief.
- **Aeldari-Split** (Craftworlds / Drukhari / Harlequins / Ynnari als separate Browse-Roots). Aktuelle `eldar`-Row mit `name: "Aeldari"` bleibt collapsed-Umbrella. Bei Daten-Bedarf separat.
- **Tone/Glyph-Anreicherung.** Die im Audit-Pass berührten Rows behalten ihre existierenden `tone`-Werte. Eigenes Anreicherungs-Brief.
- **`commissariat` Multi-Parent.** Keine Schema-Erweiterung für DAG-Hierarchie. Single-Parent-Status (`parent: "imperium"`) bleibt; institutionelle Parallel-Beziehung zu Astra Militarum lebt in der Policy-Beschreibung, nicht im Schema.

## Acceptance

The session is done when:

- [ ] **`brain/wiki/faction-policy.md`** angelegt, mit Frontmatter, Drei-Ebenen-Erklärung, Browse-Root-Liste, Sonderfall-Markierungen und „Was-wir-nicht-entscheiden"-Abschnitt. Verlinkt von `brain/wiki/index.md` und (knapp) von `brain/wiki/project-state.md`.
- [ ] **`scripts/seed-data/faction-policy.json`** angelegt, enthält mindestens `browseRoots` (Liste aus Notes Tabelle 2) und `specialCases` (Annotationen).
- [ ] **`scripts/seed-data/factions.json` audit-patched**: `chaos`-Row hat `name: "Chaos"`. Die in Notes Tabelle 1 aufgelisteten Reparent-Edits sind durchgeführt. `alignment` ist auf den explizit lore-eindeutigen Rows gesetzt.
- [ ] **prod-DB reflektiert den Fix**: Maintainer-Apply-Pfad (gewählter Mechanismus aus Notes Tabelle 4) ist ausgeführt, der oben spezifizierte SELECT zeigt die korrigierten Werte. Output im Report.
- [ ] **`docs/resolver-apply-runbook.md`** erweitert um den neuen „Pre-Apply Parent-Hygiene-Check"-Schritt.
- [ ] **`brain:lint`-Check**: entweder eingebaut (mit den zwei Regeln aus Constraints) ODER explizit als Follow-up dokumentiert mit Begründung warum nicht in diesem Brief.
- [ ] **`npm run lint` + `npm run typecheck` + `npm run brain:lint -- --no-write`** grün.

## Open questions

- **Update-Mechanik (Notes Tabelle 4)** — welcher Pfad wurde gewählt, um `factions.parent_id`-Updates in der prod-DB durchzusetzen (`ON CONFLICT DO UPDATE`-Refactor des Seed-Skripts vs. separates Mini-Update-Skript vs. Maintainer-SQL)? Begründung im Report. Cowork präferiert dauerhafte Lösung über Einmal-SQL, weil die Resolver-Apply-Runbook-Hygiene-Stufe denselben Pfad künftig wieder brauchen wird.

- **`grey_knights`-Parent** — `adeptus_astartes` oder `inquisition`? Im Report begründen. Cowork hat keine starke Präferenz; Lore stützt beide Lesarten. Pragmatik: was macht den Resolver-Output für zukünftige Bücher robuster?

- **`alpha_legion`-Parent** — `chaos` (post-Heresy-Default) oder `imperium` (Cabal-Twist / Pre-Heresy-Ambivalenz)? Cowork-Empfehlung `chaos`; bei Abweichung Lore-Begründung im Report.

- **Brain-Lint-Check Aufwand** — falls eingebaut: lohnt sich ein weiterer Check der überprüft, ob jede in `faction-policy.json.browseRoots` aufgeführte ID auch eine existierende Faction-Row in `factions.json` hat (Dangling-Reference in umgekehrter Richtung)? CC's Wahl ob in diesem Brief oder Follow-up.

- **Bereits-Resolver-eingefügte Faktionen mit Parent-Inkonsistenzen** — Cowork hat beim Brief-Schreiben die Brief-063-Tabelle gegen die Policy gequert und keine groben Falschsetzungen gefunden. Falls CC beim Audit-Durchgang einzelne Korrekturen vornimmt (z.B. `gereon_resistance` ist eher militia-improvisiert als formal Astra Militarum — pragmatisch egal, aber lore-präziser könnte ein eigenes Construct sein), im Report listen, damit Cowork in der nächsten Session daraus lernen kann.

## Notes

### Tabelle 1 — Audit-Liste (Reparent-/Rename-Edits in `factions.json`)

| Faction-ID | Edit-Typ | Heute | Soll | Begründung |
|---|---|---|---|---|
| `chaos` | `name`-Rename | `"Chaos Undivided"` | `"Chaos"` | Row fungiert als Umbrella; „Chaos Undivided" ist lore-spezifischer Worship-Begriff. |
| `sons_of_horus` | reparent | `imperium` | `chaos` | Post-Heresy-Traitor-Legion. |
| `night_lords` | reparent | `imperium` | `chaos` | dito |
| `thousand_sons` | reparent | `imperium` | `chaos` | dito |
| `world_eaters` | reparent | `imperium` | `chaos` | dito |
| `alpha_legion` | reparent | `imperium` | `chaos` (CC-Wahl, Cabal-Twist) | post-Heresy-Default Chaos; Pre-Heresy ist lore-spezifisch. |
| `ultramarines` | reparent | `imperium` | `adeptus_astartes` | Loyalist-Chapter, Sub-Astartes. |
| `blood_angels` | reparent | `imperium` | `adeptus_astartes` | dito |
| `space_wolves` | reparent | `imperium` | `adeptus_astartes` | dito |
| `dark_angels` | reparent | `imperium` | `adeptus_astartes` | dito |
| `raven_guard` | reparent | `imperium` | `adeptus_astartes` | dito |
| `salamanders` | reparent | `imperium` | `adeptus_astartes` | dito |
| `imperial_fists` | reparent | `imperium` | `adeptus_astartes` | dito |
| `black_templars` | reparent | `imperium` | `adeptus_astartes` | dito |
| `grey_knights` | reparent | `imperium` | CC-Wahl (`adeptus_astartes` ODER `inquisition`) | Chamber Militant Ordo Malleus + Astartes-Grade. |
| diverse | `alignment` setzen | (oft fehlend) | lore-eindeutig | Heresy-Traitor-Legionen `chaos`; Loyalist-Chapters `imperium`. |

Resolver-Extensions aus Brief 063 (`tanith_first`, `verghastite_ghosts`, `blood_pact`, `belladon`, `sons_of_sek`, `imperial_navy`, `ecclesiarchy`, `urdeshi`, `adeptus_astartes`, `genestealer_cults`, `valhallan_597th`, `phantine_air_corps`, `gereon_resistance`, `jantine_patricians`, `vervunhive_militia`, `zoican_host`, `aexegarian_forces`, `mortifactors`, `lords_of_unholy_host`, `daemons`) sind in der Spot-Check-Sichtprüfung policy-konform geparented. CC durchläuft sie nochmal gegen die Policy zur Bestätigung.

### Tabelle 2 — Browse-Root-Whitelist (für `faction-policy.json.browseRoots`)

| ID | Grand-Alignment | Lore-Kontext |
|---|---|---|
| `astra_militarum` | imperium | Imperial Guard, masseninfanterie |
| `adeptus_astartes` | imperium | Space Marines, alle Chapters Sub |
| `inquisition` | imperium | Inquisition + alle Ordos Sub |
| `mechanicus` | imperium | Adeptus Mechanicus / Forge-Welten |
| `commissariat` | imperium | Politische Officers, parallel zu AM |
| `custodes` | imperium | Adeptus Custodes (Imperial-Elite) |
| `sisters_of_battle` | imperium | Adepta Sororitas |
| `ecclesiarchy` | imperium | Imperial-Kirche |
| `imperial_navy` | imperium | Raumflotte |
| `grey_knights` | imperium | Daemon-Hunter (sieh Sonderfall) |
| `chaos` | chaos | Umbrella; alle Chaos-Subs |
| `eldar` | xenos | Aeldari (Craftworlds-Default, collapsed) |
| `tau` | xenos | T'au Empire |
| `necrons` | xenos | Necrons |
| `tyranids` | xenos | Tyranid + Genestealer Sub |
| `orks` | xenos | Orks |

Total: 16 Browse-Roots. **Imperium ist KEIN Browse-Root** — es ist Grand-Alignment, lebt in `factions.alignment`. Im Schema bleibt `imperium` weiterhin als Faction-Row (Lore-Wurzel der Imperial-Subs), aber das UI würde sie nicht als Filter-Option anbieten.

### Tabelle 3 — Sonderfall-Annotationen (für `faction-policy.json.specialCases`)

- **`chaos`**: Synthetischer Umbrella. Hosts: Word Bearers, Iron Warriors, Blood Pact, Sons of Sek, Zoican Host, Aexegarian Forces (?), Lords of the Unholy Host, Daemons + nach diesem Brief die Heresy-Traitor-Legionen (Sons of Horus, Night Lords, Thousand Sons, World Eaters, Alpha Legion). `chaos_undivided` als separater Row ist *deferred* — wird erwogen, sobald genug Daten zeigen, dass die Worship-Form regelmäßig auftaucht.
- **`commissariat`**: Institutional-Parallel zu Astra Militarum, kein Sub. Single-Parent-Schema-Limit zwingt `parent: "imperium"`; Multi-Parent (DAG) ist deferred — die Policy notiert die Asymmetrie.
- **`grey_knights`**: Lore-Doppelnatur (Astartes-Grade + Chamber Militant Ordo Malleus). CC wählt einen Parent im Audit-Pass; die Policy notiert dass dies eine pragmatische Single-Parent-Wahl ist.
- **`genestealer_cults`**: Sub-Faction der Tyraniden (`parent: "tyranids"`, 9th-Ed-Lore). NICHT Browse-Root. Falls Daten zeigen dass GSC-zentrische Bücher häufig sind, kann das später revidiert werden.
- **`eldar`** (Name „Aeldari"): kollabiert Craftworlds + Drukhari + Harlequins + Ynnari unter eine Browse-Root. Aufsplittung deferred.

### Tabelle 4 — Update-Mechanik (Vor-Auswahl für CC)

Da `INSERT … ON CONFLICT DO NOTHING` keine Updates an `parent` / `name` macht, braucht der Audit-Pass einen anderen Pfad. Drei Optionen:

**Option A — Seed-Skript zu `ON CONFLICT DO UPDATE` heben.** Aufwand: moderate Refactor in `scripts/seed-resolver-extensions.ts`. Vorteil: Idempotent + Reusable für zukünftige Audit-Passes (Resolver-Apply-Runbook-Hygiene-Stufe braucht denselben Pfad). Nachteil: macht den Skript invasiver — UPDATES überschreiben evtl. Maintainer-Hand-Edits in der prod-DB. Mitigation: explizit nur Spalten updaten, die aus `factions.json` stammen (`name`, `parent`, `alignment`, `tone`); nicht z.B. `glyph` falls Maintainer das später hand-pflegt.

**Option B — Separater Mini-Update-Skript.** `scripts/migrate-faction-parents-070.ts` mit den expliziten UPDATE-Statements, einmalig ausführbar. Vorteil: chirurgisch, kein Refactor des Seed-Skripts. Nachteil: One-Off — die Disziplin für zukünftige Audits muss neu erfunden werden.

**Option C — Maintainer-SQL direkt.** Brief lieferte das SQL, Maintainer führt es in Supabase aus. Vorteil: minimal-Code. Nachteil: keinerlei Reusability, kein Audit-Trail in Git außer dem Commit-Diff der `factions.json`.

**Cowork-Präferenz: A.** Die Resolver-Apply-Runbook-Hygiene-Stufe wird denselben Pfad wieder und wieder brauchen — eine einmal saubere `ON CONFLICT DO UPDATE`-Form zahlt sich aus. CC entscheidet final.

### Querverbindung zu Brief 063

Brief 063's Tabelle 1 hatte für ein paar Faktionen einen `(alias only → existing-id)`-Marker (Ordo Xenos / Malleus / Hereticus → `inquisition`). Diese Aliase leben in `faction-aliases.json` und sind **nicht** Faction-Rows — sie stören die Policy nicht (die Policy operiert auf Faction-Rows, nicht auf Aliasen). Nach diesem Brief bleibt das so.

### Resolver-Apply-Runbook-Schritt-Sketch (illustrativ, NICHT bindend)

Beispielhafter Eintrag im Runbook (CC formt nach Bedarf):

```markdown
### 0. Pre-Apply Parent-Hygiene-Check

Vor `db:apply-override --batch=ssot-w40k-NNN`:

1. `git diff HEAD~1 -- scripts/seed-data/factions.json` (oder weiter zurück bis last-applied-batch-commit) — neue Faction-Rows identifizieren.
2. Für jede neue Row: `parent` gesetzt? Zeigt auf einen Browse-Root oder dessen Descendant gemäß `scripts/seed-data/faction-policy.json`?
3. Bei Verstoß:
   - `parent` korrigieren in `factions.json`, committen.
   - `npm run db:seed-resolver-extensions` (mit `ON CONFLICT DO UPDATE`-Pfad nach Brief 070 Update-Mechanik).
4. Dann erst zum Apply-Schritt weiter.
```

### Tracked-for-future-briefs

- **UI-Rollup-Phase.** WITH-RECURSIVE-Helper in `src/lib/`, Faktions-Filter zeigt nur Browse-Roots, `/fraktion/[slug]` lernt zwei Modi (Browse-Root mit Sub-Liste vs. Sub mit Parent-Crumb), Buchdetail-Pills bekommen einen Parent-Indikator. Trigger: Datenbild ist dichter (Resolver-Pipeline hat ≥100–150 Bücher abgedeckt) UND UI-Polish-Phase ist anstehend.
- **Chaos-Gott-Splits**, falls Daten zeigen dass Khorne/Tzeentch/Nurgle/Slaanesh-Worship-Cluster regelmäßig auftauchen. Erwartung: HH-Domain triggert das deutlich klarer als W40K-40K-Domain.
- **Aeldari-Split** (Craftworlds/Drukhari/Harlequins/Ynnari). Datenbedarf abwarten.
- **`chaos_undivided` als separater Row**, wenn die Worship-Form-Spezifik datenrelevant wird.
- **Multi-Parent / DAG**, falls Sonderfälle (Commissariat, Sisters of Silence, Grey Knights) den Single-Parent-Limit häufig brechen.
- **Lift `faction-policy.json` in DB-Spalte**, wenn UI das Konzept wirklich braucht und die JSON-File-Lösung nicht mehr reicht (z.B. wegen Performance, Submission-Workflows oder Cross-Service-Konsistenz).
