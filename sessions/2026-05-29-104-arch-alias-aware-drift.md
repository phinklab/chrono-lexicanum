---
session: 2026-05-29-104
role: architect
date: 2026-05-29
status: open
slug: alias-aware-drift
parent: 2026-05-27-103-arch-audit-drift-gap-sweep
links:
  - 2026-05-27-103-arch-audit-drift-gap-sweep
  - 2026-05-28-103-impl-ui-audit-drift-gap-sweep
  - 2026-05-26-100-arch-resolver-hh
commits: []
---

# Alias-aware Drift — bekannte Edition-Renames im Cockpit ruhigstellen + gemeinsames Alias-Modul für die Suche

> **▶ Stand 2026-06-01 (Cowork-Pre-Flight vor dem Lauf — Prämissen bestätigt, ready):**
>
> - **Alias-SSOT existiert wie beschrieben:** `scripts/seed-data/faction-aliases.json` (~73 Einträge), `character-aliases.json` (~66), `location-aliases.json` (~25) liegen auf `main`. `src/lib/aliases/` existiert noch **nicht** (= dein Deliverable).
> - **Die drei Klassifikations-Call-Sites existieren weiter** (`src/lib/atlas/queries.ts`, `src/app/buecher/page.tsx`, `src/app/buch/[slug]/audit/page.tsx`). **Aber die unten zitierten Zeilennummern sind seit PR #110/#113 verschoben** — greppe `countResolvedDrift` / `isDrift` / `globalDriftFreq`, verlass dich nicht auf die Zeilen-Refs.
> - **Neuer Drift-Konsument seit dem Brief:** das `/atlas`-Surface (`src/components/atlas/pages/WerkePage.tsx`, `src/components/atlas/EntityTable.tsx`) **rendert** `row.hasDrift` / `row.driftCount`, **klassifiziert aber nicht** selbst — es liest die in `queries.ts` (`WerkeRow`) berechneten Felder. Heißt: stellst du die Klassifikation an der Quelle (`queries.ts`) auf „nur verdächtiger Drift" um, propagiert das automatisch nach `/atlas`. Kurz verifizieren, dass diese beiden nur **lesen** (kein vierter Klassifikator) — es kommt **kein** neuer Call-Site dazu, die drei oben bleiben die Wahrheit.

## Goal

Das Audit-Cockpit hört auf, bekannte Edition-Renames als verdächtigen Drift zu flaggen, und legt dabei das gemeinsame Alias-Auflösungs-Modul an, das später auch die Suche bedient.

Konkret: Surface-Forms wie `Imperial Guard` (→ `astra_militarum`, kanonisch „Astra Militarum"), `Eldar` und `Dark Eldar` (→ `eldar`, kanonisch „Aeldari") sind **bereits korrekt aufgelöst** — sie stehen nur im Drift-Bucket, weil der Drift-Test ein reiner Namensvergleich ist (`rawName ≠ canonical.name`) und die registrierten Aliase nicht kennt. Dieser Brief macht den Drift-Test alias-bewusst: eine `rawName`, die ein registrierter Alias der aufgelösten Entität ist, zählt nicht mehr als verdächtiger Drift, sondern als eigene ruhige Klasse „known alias". Das nimmt ~133 Junctions (Imperial Guard ×77 + Eldar ×34 + Dark Eldar ×22) aus dem verdächtigen Drift-Signal, ohne ein einziges Datum zu ändern.

Zweitens — und mit demselben Asset bezahlt: das Alias-Modul exponiert eine Auflösungs-Funktion `Surface-Form → kanonische Entität`, die das (noch zu bauende) Suchfeld konsumieren MUSS, damit „Imperial Guard" die Astra-Militarum-Bücher findet und „eldar" die Aeldari-Bücher. Das Suchfeld selbst wird in diesem Brief **nicht** gebaut — nur das Modul und der Contract.

## Design freedom — read before everything else

Du hast den **frontend-design Skill** und entscheidest alles Visuelle besser als ich. Deins, ohne Rückfrage:

- Wie die „known alias"-Klasse in der Listenansicht `/buecher` und auf der Detailseite `/buch/[slug]/audit` aussieht — Farbe, Glyph/Tag/Badge-Form, Tonalität, Position in der Row, ob ein eigenes Pillen-/Filter-Element dafür entsteht oder es als dezenter Inline-Marker lebt. Outcome-Vorgabe: es liest **unmissverständlich als „erwartet, kein Bug"**, klar abgesetzt vom verbleibenden verdächtigen Drift, und bleibt im Detail einsehbar (nicht wegradiert).
- Die Copy/Wording für die Klasse — „known alias", „edition rename", „Synonym", „erwartet" — was zum bestehenden `AuditPills.tsx`/`/buch/[slug]/audit`-Vokabular passt.
- Ob und wie das Cockpit die alias-aufgelöste Form anzeigt (z.B. „Imperial Guard → Astra Militarum"), und in welchem Layout.
- Exakte Pixel-, oklch-, ms-, Stagger-Werte, Klassen-Shapes, Marker-Symbole, Pillen-Form — alles deins.
- Falls du dem Maintainer ein optionales Sicht-Filter für die known-alias-Klasse gibst (analog zur Audio-Drama-Toggle aus Brief 103): Form, Default-Sichtbarkeit und URL-Param-Key sind deine Wahl — solange der Mechanismus URL-getrieben bleibt (kein localStorage), konsistent mit dem bestehenden `/buecher`-Filter-Flow.

Was ich vorgebe, sind **Outcomes, Datenquellen und die Klassifikations-Logik**, nicht Pixel.

## Context

### Wo wir stehen (Stand 2026-05-29, post-PR-111)

- Korpus datenkomplett + konsolidiert: 859/859 Bücher (565 W40K + 294 HH), 202 factions / 288 locations / ~490 characters.
- Brief 103 (Audit-Cockpit Drift/Gap-Sweep) ist `implemented` (Daten via PR #109, UI via PR #111). Der UI-Pass hat im Drift-Branch von `sortBooks()` die Tie-Group-Sub-Sortierung nach `driftScore = sum(globalDriftFreq(rawName))` gelandet und pro Row ein sichtbares `· drift «Surface-Form» ×N`-Signal eingeführt.
- Aus dem PR-111-UI-impl (OQ 2) kam der Befund, der diesen Brief auslöst: die globale `rawName`-Häufigkeit über alle drift_works zeigt klare Edition-Rename-Cluster — Imperial Guard ×77, Eldar ×34, Dark Eldar ×22 als die fettesten; dahinter messier Material (Mechanicum ×19, Horus Lupercal ×19, Lucius ×11 — siehe Out of scope).

### Prämissen-Korrektur (wichtig — der ursprüngliche Plan war falsch)

Der Carry-over-Vorschlag lautete: „ein Alias-Eintrag pro Form in `scripts/seed-data/faction-aliases.json` räumt ~133 Junctions aus dem Drift-Bucket, Klein-Diff Batches-Strang". Die Verifikation in dieser Cowork-Session hat das widerlegt:

1. **Die Aliase existieren bereits.** `scripts/seed-data/faction-aliases.json` enthält schon `"Imperial Guard": "astra_militarum"`, `"Eldar": "eldar"`, `"Dark Eldar": "eldar"`, `"Aeldari": "eldar"`, `"Drukhari": "eldar"`. Die ~133 Junctions sind über genau diese Aliase **korrekt aufgelöst** — sie zeigen auf die richtige Fraktion.
2. **Drift ist kein Auflösungs-Signal.** Drift ist im Code definiert als reiner Surface-vs-Canonical-Namensvergleich:
   - `countResolvedDrift()` in `src/lib/atlas/queries.ts` (Zeilen 250–258): `rawName !== null && rawName !== "" && rawName !== row.name`.
   - identische `countResolvedDrift()` in `src/app/buecher/page.tsx` (Brief 103 verortet sie bei Zeilen 121–127).
   - `isDrift(rawName, canonicalName)` in `src/app/buch/[slug]/audit/page.tsx` (Zeile 228): `rawName !== null && rawName !== "" && rawName !== canonicalName`.
   `astra_militarum` heißt kanonisch „Astra Militarum", `eldar` heißt kanonisch „Aeldari". Also: `rawName="Imperial Guard"` ≠ „Astra Militarum" → Drift. `rawName="Eldar"` ≠ „Aeldari" → Drift. Erwartetes, strukturelles Drift — kein Bug, aber Lärm.
3. **Das Cockpit liest die Alias-Maps gar nicht**, und es gibt **keine Alias-DB-Tabelle** (`grep` über `src/db/schema.ts` → kein `alias`-Table; die `*-aliases.json` werden ausschließlich vom Resolver/Seed zur Apply-Zeit konsumiert).

Konsequenz: Alias-Einträge hinzufügen räumt **0** Junctions aus dem Drift-Bucket — sie sind schon drin, und der Drift-Filter sieht die Datei nicht. Der reale Hebel sitzt in der **App-Schicht** (Read-Path + Cockpit-Render), nicht in den Daten. Damit ist das ein **Product-Strang**-Brief, kein Batches-Brief.

### Architekturkonzept

Ein Asset, zwei Konsumenten. Die Alias-Maps „Surface-Form → kanonische ID" (`faction-aliases.json`, `location-aliases.json`, `character-aliases.json` in `scripts/seed-data/`) sind die Single-Source-of-Truth für Surface-Form-Synonyme. Heute liest sie nur Node-Script-Code zur Apply-Zeit. Dieser Brief macht sie für die App-Schicht verfügbar über ein gemeinsames Modul (z.B. `src/lib/aliases/`), das zwei Fragen beantwortet:

- **Für Drift (Cockpit, jetzt):** „Ist diese `rawName` ein registrierter Alias, der auf **genau diese** aufgelöste Entität zeigt?" → wenn ja, ist es kein verdächtiger Drift, sondern known-alias.
- **Für Suche (Contract, später):** „Welche kanonische(n) Entität(en) meint dieser Suchstring?" → normalisierte Auflösung der Surface-Form.

Die drei Drift-Call-Sites (`queries.ts`, `buecher/page.tsx`, `buch/[slug]/audit/page.tsx`) werden über **eine** gemeinsame Klassifikations-Funktion aus diesem Modul geroutet, damit die Drift-Semantik an einer Stelle lebt statt dreimal kopiert zu sein.

## Constraints

### Allgemein

- **TypeScript strict, App Router server components default.** Keine `any`. Die Alias-Klassifikation läuft serverseitig im Read-Path (`queries.ts` / `buecher`-`getBooks()` / Audit-Detailseite sind Server-Code). Wo neuer Client-State nötig wäre (optionales known-alias-Sicht-Filter), `'use client'` analog zu `AuditPills.tsx`.
- **Keine Versions-Pins.** Es sollten keine neuen Dependencies nötig sein (reines JSON-Lesen + Map-Aufbau im bestehenden Stack). Falls doch, im Report rechtfertigen.
- **Keine Schema-Migration, keine DB-Felder, keine Drizzle-Schema-Touches, kein Override-/Resolver-Touch.** Alle Datenpunkte existieren: die Junctions tragen `rawName`, die Entitäten tragen `id` + `name`, die Alias-Maps liegen als committed JSON.

### Alias-Modul (SSOT + zwei APIs)

- **Single Source of Truth bleiben die existierenden `scripts/seed-data/*-aliases.json`.** Keine zweite Kopie der Alias-Daten anlegen. Wie das Modul an die JSONs kommt (direkter Import aus `scripts/seed-data/`, ein dünner Re-Export unter `src/`, ein Build-/Codegen-Schritt) ist deine Implementierungs-Wahl — Bedingung: genau eine Quelle, keine Duplikation, kein Drift zwischen Resolver-Sicht und App-Sicht.
- **Drei Achsen.** Das Modul deckt factions, locations und characters ab (alle drei haben `*-aliases.json` und alle drei haben Drift-Junctions). Die Klassifikations-Funktion ist achsen-parametrisiert.
- **Drift-Klassifikation ist entity-genau (nicht-verhandelbar).** Eine `rawName` zählt nur dann als known-alias, wenn der Alias-Eintrag auf **dieselbe** kanonische ID zeigt, auf die die Junction tatsächlich aufgelöst ist. Wenn `rawName` zwar ein registrierter Alias ist, aber auf eine **andere** Entität zeigt als die der Junction, bleibt es **verdächtiger** Drift (das wäre ein echter Fehl-Resolve und muss sichtbar bleiben). Das heißt: die Klassifikation braucht die kanonische **ID** der Junction, nicht nur den Namen. In `queries.ts` ist die Faction-/Location-/Character-`id` bereits geladen (z.B. `wf.faction.id`, Zeile 268 holt `columns: { id: true, name: true }`) — die Audit-Row-Strukturen müssen die `id` mitführen, wo sie es heute nicht tun.
- **Drift-Match ist exakt** gegen die gespeicherte `rawName` (case-sensitive, wie der Alias-Key im JSON, der die Auflösung erzeugt hat). Keine Normalisierung auf dem Drift-Pfad.
- **Such-Auflösung (Contract, nicht in diesem Brief verdrahtet)** ist normalisiert: case-insensitive Match gegen Alias-Keys **und** kanonische Namen, sodass `imperial guard`, `Imperial Guard`, `astra militarum` alle auf `astra_militarum` zeigen. Die exakten Normalisierungs-Regeln (Casefold, Trim, Diakritika wie `T'au`) entscheidet die spätere Such-Session — dieser Brief legt nur die Funktions-Signatur + das dokumentierte Verhalten fest, plus mindestens einen Unit-Test, der die Top-3-Renames abdeckt.
- **Map-weit, nicht nur die Beispiele (nicht-verhandelbar).** Imperial Guard / Eldar / Dark Eldar sind nur die volumenstärksten Cluster. Beide APIs — Drift-Klassifikation **und** Such-Auflösung — gelten für **jeden** registrierten Alias über alle drei Maps, ohne Hardcode einer Auswahl. `Drukhari` und `Dark Eldar` lösen beide auf `eldar` auf, jede Surface-Form jeder Fraktion/Welt/Person mit registriertem Alias wird gleich behandelt. Die Abdeckung ist exakt der Inhalt der `*-aliases.json` zur Laufzeit — fehlende Synonyme ergänzt ein späterer Daten-Task in den Maps, nicht dieser Brief (siehe Out of scope).

### Drift → drei Zustände

Der Drift-Test wird von boolean auf drei Zustände erweitert, an **allen drei** Call-Sites konsistent (via gemeinsame Modul-Funktion):

1. **kein Drift** — `rawName` leer/null oder `rawName === canonical.name`.
2. **known alias** — `rawName ≠ canonical.name`, ABER `rawName` ist ein registrierter Alias, der auf die kanonische ID der Junction zeigt. → ruhige Klasse.
3. **verdächtiger Drift** — `rawName ≠ canonical.name` UND nicht known-alias. → das verbleibende echte Audit-Signal.

- **Der Cockpit-Drift-Count zählt nur noch verdächtigen Drift.** `driftCount` / `hasDrift` in `WerkeRow` (`queries.ts`) und das Drift-Äquivalent in `buecher/page.tsx` zählen Zustand 3, nicht mehr Zustand 2. Ein Buch, dessen Drift ausschließlich aus known-aliases besteht, ist **nicht** mehr `hasDrift` und erscheint **nicht** mehr unter `?audit=drift`.
- **Die known-alias-Information bleibt erhalten und sichtbar** als eigene Klasse (Count + Detail), nicht gelöscht. Form: deine Wahl (Design freedom). Ob sie als eigener Count im Listen-Row, als eigenes optionales Filter, oder nur auf der Detailseite `/buch/[slug]/audit` erscheint, entscheidest du — Bedingung: sie ist irgendwo einsehbar, der Maintainer kann nachvollziehen „diese Junction ist ein bekannter Edition-Rename".
- **Die Brief-103-Drift-Sub-Sortierung bleibt funktionsfähig.** Der `driftScore = sum(globalDriftFreq(rawName))`-Pre-pass und das `· drift «Surface-Form» ×N`-Signal im Drift-Branch von `sortBooks()` müssen weiter korrekt arbeiten — jetzt über die **verdächtigen** Drift-rawNames (Zustand 3), nicht über known-aliases. `globalDriftFreq` darf known-alias-rawNames nicht mehr mitzählen, sonst rangiert die Sub-Sortierung nach Lärm, den wir gerade entfernt haben.

### No-regression

- `?audit=ssot`, `?audit=collections`, `?audit=gap` (inkl. der Brief-103-Audio-Drama-Dämpfung + `hideAudio`-Toggle), kombinierte AND-Filter und alle Sort-Pillen bleiben im Verhalten unverändert.
- Der Default-Sort der Liste ohne Audit-Filter bleibt unverändert.
- Die Audit-Detailseite `/buch/[slug]/audit` bleibt funktional vollständig — sie zeigt jetzt zusätzlich die known-alias-Klasse abgesetzt vom verdächtigen Drift.

## Out of scope

- **Das Suchfeld nicht bauen.** Es existiert noch nicht. Dieser Brief liefert nur das Alias-Modul + den Such-Contract (Funktions-Signatur + Verhalten + Test). Die Verdrahtung in eine UI-Suchkomponente ist eine spätere Session.
- **Keine neuen Alias-Einträge erfinden.** Die Top-3 sind bereits in `faction-aliases.json`. Dieser Brief konsumiert die existierenden Maps; er kuratiert sie nicht. (Wenn dir beim Implementieren ein offensichtlich fehlender Alias auffällt, notier ihn im Report — nicht im Code dieses Briefs hinzufügen.)
- **Die messigeren Cluster nicht anfassen.** Mechanicum ×19, Horus Lupercal ×19, Lucius ×11 sind **keine** reinen Edition-Renames: Mechanicum ist der Heresy-Ära-Begriff (nicht 1:1 zu `mechanicus`/`adeptus_mechanicus`), Horus Lupercal ist eine Person (Charakter, keine Fraktion), Lucius ist mehrdeutig. Sie fallen ggf. ohnehin unter die known-alias-Klasse, falls sie als Alias registriert sind — aber dieser Brief führt **keine** Sonderbehandlung, Cross-Era-Logik oder Identitäts-Disambiguierung für sie ein. Cross-Era-Identitäten bleiben wie in der ADR `decisions/cross-era-identities.md` (eine Canonical-Row pro Identität, Era-Surface-Forms als Aliases).
- **rawName in der DB nicht normalisieren/überschreiben.** Die Provenance (welche Quelle welche Surface-Form lieferte) ist der Zweck von `rawName` + `confidence` und bleibt erhalten. Drift wird im Read-Path klassifiziert, nicht in den Daten gelöscht.
- **Keine Alias-DB-Tabelle, keine Drizzle-Migration.** Die Maps bleiben JSON; das Modul liest sie in den App-Prozess.
- **Den Drift/Gap-Erkennungs-Algorithmus aus Brief 073/103 nicht neu erfinden.** Dieser Brief verfeinert nur die Klassifikation (boolean → drei Zustände) und routet sie durch ein gemeinsames Modul. Gap-Logik (`hasJunctionGap`) bleibt unangetastet.
- **Kein Brain-/Wiki-/`sessions/README.md`-Schreibe-Versuch aus dem Product-Worktree** (Brief 095, Rollup-Ownership). Substanzielle Fakten in den Impl-Report; Cowork zieht sie im Post-Merge-Pass nach.

## Acceptance

Der Brief ist done wenn:

- [ ] Ein gemeinsames Alias-Modul existiert (z.B. `src/lib/aliases/`), das die existierenden `scripts/seed-data/*-aliases.json` als einzige Quelle liest (keine Duplikat-Kopie) und zwei APIs exponiert: eine entity-genaue Drift-Klassifikation (factions/locations/characters) und eine normalisierte Such-Auflösung `Surface-Form → kanonische Entität(en)`.
- [ ] Der Drift-Test ist an allen drei Call-Sites (`src/lib/atlas/queries.ts`, `src/app/buecher/page.tsx`, `src/app/buch/[slug]/audit/page.tsx`) über die gemeinsame Modul-Funktion geroutet und unterscheidet kein-Drift / known-alias / verdächtiger-Drift.
- [ ] Die Klassifikation ist entity-genau: eine `rawName`, die ein registrierter Alias **einer anderen** Entität als der aufgelösten ist, bleibt verdächtiger Drift. (Belegbar an einem konstruierten Beispiel oder Unit-Test.)
- [ ] `/buecher?audit=drift` zeigt die ~133 known-alias-Junctions (Imperial Guard / Eldar / Dark Eldar) **nicht** mehr als verdächtigen Drift; Bücher, deren Drift ausschließlich known-alias ist, fallen aus dem `?audit=drift`-Bucket. Im Impl-Report die Vorher/Nachher-Zahl der drift_works dokumentieren (erwartet: deutlicher Rückgang gegenüber dem Brief-103-Stand).
- [ ] Die known-alias-Klasse ist im Cockpit und/oder auf `/buch/[slug]/audit` als „erwartet, kein Bug" sichtbar abgesetzt (Form = CC-Wahl), und im Detail nachvollziehbar (welche Surface-Form auf welche kanonische Entität).
- [ ] Die Brief-103-Drift-Sub-Sortierung (`driftScore`, `· drift «Surface-Form» ×N`) arbeitet weiter korrekt und basiert jetzt auf den verdächtigen Drift-rawNames; known-alias-rawNames fließen nicht mehr in `globalDriftFreq` ein.
- [ ] Such-Contract belegt: mindestens ein Unit-Test, der `imperial guard` / `Imperial Guard` → `astra_militarum` und `eldar` / `dark eldar` → `eldar` auflöst (case-insensitiv, Surface-Form **und** kanonischer Name).
- [ ] **Browser-Smoke** (manuelle Sichtprüfung im Dev-Server, kein E2E nötig), Desktop + mobile Breite (≤ ~640px): `/buecher?audit=drift` (known-aliases nicht mehr als verdächtiger Drift, verbleibender Drift + Sub-Sort lesbar), `/buch/[slug]/audit` für ein Buch mit known-alias-Junction (Klasse klar abgesetzt), und ein No-regression-Blick auf `?audit=gap` (Brief-103-Audio-Drama-Verhalten unverändert). Pro Variante kurz im Report: Layout intakt, Marker lesbar.
- [ ] `npm run lint` + `npm run typecheck` grün; volle Test-Suite, die der Worktree fährt, grün; kein Schema-/DB-/Override-Touch.
- [ ] Impl-Report unter `sessions/2026-05-NN-104-impl-{slug}.md` mit „What I did" + „For next session"; keine direkten `brain/**`- oder `sessions/README.md`-Edits aus dem Product-Worktree.

## Open questions for your report

Inputs für die nächste Architekten-Session — keine Blocker:

1. **Konkrete Drift-Reduktion.** Wie viele drift_works bleiben nach dem alias-aware-Cut übrig (vs. der Brief-103-Stand)? Welche Surface-Forms dominieren den **verbleibenden** verdächtigen Drift — sind das die messigeren Cluster (Mechanicum / Horus Lupercal / Lucius) oder etwas anderes? Material für die Frage, ob die nächsten Cluster echte Alias-Kandidaten, Cross-Era-Fälle oder Fehl-Resolves sind.
2. **Modul-Anbindung an die JSONs.** Welchen Weg hast du gewählt (direkter Import / Re-Export / Codegen), und warum? Gab es ein Bundling-/Server-Boundary-Problem damit, dass App-Code aus `scripts/seed-data/` liest?
3. **Such-Auflösung — Mehrdeutigkeit.** Beim normalisierten Match: gibt es Surface-Forms, die auf mehr als eine kanonische Entität zeigen (über Achsen hinweg oder innerhalb)? Wie verhält sich deine Signatur dann (Liste statt Einzelwert)?
4. **known-alias-Sichtbarkeit.** Welche Form hast du gewählt (eigener Count / optionales Filter / nur Detailseite), und hat das Brief-096-Redesign deine Pillen-/Marker-Sprache beeinflusst?

## Notes

- **Strang:** Product (`chrono-lexicanum-product`). Berührt `src/lib/aliases/` (neu), `src/lib/atlas/queries.ts`, `src/app/buecher/` und `src/app/buch/[slug]/audit/`. Kein `scripts/`-, kein `src/db/`-Touch. CC checkt am Session-Start Pfad + Branch (`git branch --show-current`, `git status --short --branch`), kündigt Worktree/Strang/Branch in einem Satz an, und hält an, falls der Worktree nicht passt.
- **PR-Policy:** Code-Pass (`src/`) → branch + PR. Branch-Vorschlag `codex/product-alias-aware-drift` (andere Wahl okay, solange die Strang-Zugehörigkeit lesbar ist). Brief 104 selbst (diese Datei) ist doc-only → committet direkt auf `main`, kein Branch. CC flippt `status: open → implemented` in der Frontmatter dieser Datei innerhalb des Code-PRs.
- **NNN-Vergabe:** Dieser Brief belegt `104`. Der ausstehende Sessions-Archive-Sweep, der die zwei NNN-kollidierenden Product-Followup-Files (`2026-05-27-098-impl-map-dive-flicker-followup.md`, `2026-05-27-099-impl-map-transition-polish.md`) umbenennt, nutzt die nächsten freien Nummern ab **105** (nicht 104).
- **Daten der Verifikation** (informativ): `faction-aliases.json` enthält heute u.a. `"Imperial Guard": "astra_militarum"`, `"Eldar": "eldar"`, `"Dark Eldar": "eldar"`. Kanonische Namen: `astra_militarum` = „Astra Militarum", `eldar` = „Aeldari". Keine Alias-Tabelle im DB-Schema.
- **Skill-Note:** Der frontend-design Skill ist hier richtig — die known-alias-Visualisierung (Marker / Klassen-Abgrenzung / optionales Filter) sind genau die Pixel-Entscheidungen, die er besser trifft als ich.
- **Dokumentation post-Merge:** Cowork zieht die Outcomes in `project-state.md` § What's open (Watch-item (a) Edition-Rename-Alias-Cluster → closed/reduziert, mit korrigierter Prämisse), `open-questions.md` (keine numerierte OQ), `sessions/README.md` (Active-Threads). Alles im Koordinations-Worktree, doc-only auf `main`.
