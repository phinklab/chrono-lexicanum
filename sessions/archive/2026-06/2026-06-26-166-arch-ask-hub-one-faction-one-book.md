---
session: 2026-06-26-166
role: architect
date: 2026-06-26
status: implemented
slug: ask-hub-one-faction-one-book
parent: 2026-06-24-164
links: [2026-06-03-121, 2026-06-24-164]
commits: []
---

# 166 — Find your next book: Ask-Hub + „1 Faction, 1 Book" + Diamond-Rückbau (121-Product)

## Goal

`/ask` wird vom Einzel-Fragebogen zu einem **„Find your next book"-Hub**, der zwei Wege trägt: (1) den bestehenden Fragebogen (unverändert, Brief 164) und (2) ein neues Tool **„1 Faction, 1 Book"** — Reader wählt eine Faction und bekommt einen kuratierten Einstiegs-Buchvorschlag, mit **Reshuffle**, wenn mehrere Picks hinterlegt sind. **Jeder Pick ist klickbar und öffnet das Buch-Info-Popup**; CC matcht die (teils tippfehlerhaften) Excel-Titel **tolerant** gegen den Korpus und legt Philipp in einem **Zwischenstep** die nicht oder nur unsicher gefundenen Titel zur Nachlieferung/Prüfung vor (Misses inkl. Audio-Dramen = DB-Nachpflege später). Datenquelle ist eine **maintainer-gepflegte Kurations-JSON**, generiert aus Philipps **Excel** (`scripts/seed-data/source/Warhammer_OFOC_SSOT.xlsx`, geliefert 2026-06-26 — zwei Sheets: Top-Level-Fraktionen + Subfraktionen, im Tool als **Drilldown** dargestellt). CC baut die Liste **verbatim** ein (Excel → validierte JSON, Schema + UI — siehe § Quell-Pipeline). Das Tool selbst rendert **zur Laufzeit DB-frei** — die Buch-Referenzen löst ein **deterministischer Convert-Step** (manuell per `npm run`, Muster `import:ssot-roster`) auf und schreibt sie in die committete JSON; `next build` liest nur diese JSON, das Popup lädt seine Daten als normale Route. Dazu ein kosmetischer Rückbau: das ◇/◆-Glyph vor den Fragebogen-Choices fliegt raus.

## Design freedom — read before everything else

Diese Runde fasst `/ask` neu an — Hub-Rahmen, neue Tool-Oberfläche, Copy-Reframe, Glyph-Rückbau. **Alle ästhetischen und Copy-Entscheidungen gehören dir.** Du hast den frontend-design Skill; nimm ihn.

Dir gehören:

- **Der Hub-Reframe.** „Ask the Archive" soll Richtung „find your next book" wandern, besser formuliert und ans Setting angepasst — die exakte Benennung der Seite, der zwei Tools und aller Labels/Eyebrows/Subs ist deine Voice. Dazu gehört das Aufräumen der jetzt seitenweit verstreuten Latein-Chrome (`QVATTVOR QVAESTIONES`, `INTERROGATORIVM`, die `ASK_READOUT_LINES`, `ArchiveFooter mid=…`, `<title>`/Metadata) auf den neuen Hub-Stand.
- **Wie die zwei Tools nebeneinander sitzen** — Tabs, zwei Karten, Landing mit Auswahl, Switch: deine Entscheidung, solange der URL-/SSR-Vertrag unten hält.
- **Die ganze Optik des Faction-Tools**: der Faction-Picker (Liste/Grid/Dropdown/Sigil-Kacheln — `FactionClassIcon`/`faction-icon.ts` existiert, Sigil aber **best-effort/optional**, weil Philipps Liste auch Subfactions ohne `factions.json`-Eintrag enthalten kann), **die konkrete Drilldown-Optik** (wie die Subfraktions-Ebene aufgeht — Accordion, zweite Spalte, nested, Breadcrumb, eigene Sub-Ansicht; meins ist nur das Outcome „gewählte (Sub-)Faction + Pick #1 sind SSR-sichtbar und deep-linkbar"), die Pick-Karte (Titel, optional Autor/Format-Badge/Note — alles aus der JSON, kein Cover-Zwang), das **Reshuffle-Control** (Label, Geste, Motion/Stagger), Übergänge, Timings.
- **Der Diamond-Rückbau**: wie der Selektionszustand der Fragebogen-Choices jetzt liest, nachdem das ◇/◆ weg ist (vorhandenes `data-selected`/`aria-pressed` trägt den Zustand schon — Treatment ist dein Call).
- Jeder px/ms/oklch-Wert, jeder Klassen-Shape, jede Animations-Kurve.

Mir gehören (nicht ohne Rückfrage ändern): der URL-/SSR-Vertrag, die Server-/Client-Grenze, das **Datenmodell** der Kurations-JSON (Feld-Semantik, nicht Feld-Namen-Ästhetik), die Reshuffle-**Struktur** (geordnete Picks, ephemeral), die Validierungs-Garantie, und die Accessibility-Outcomes. Details unten.

## Context

Ist-Stand `/ask` nach Brief 164 (gemergt) — Ripple-Karte für dich:

- **`src/app/ask/page.tsx`** — Server-Component. Liest `searchParams` → `parseAskAnswers` (Brief-164-Contract: `experience`/`faction_love`/`tone`/`length`, optional `deeper=1`). Vollständiges Profil → `getAskMatrixCell` (precomputed Top-6, Hot-Path) bzw. `recommend(...)` für „Browse deeper". Rendert `AskClient`. Stale Copy hier: `metadata.title`, `ASK_READOUT_LINES`, `ArchiveFooter mid="QVATTVOR QVAESTIONES"`.
- **`src/components/ask/AskClient.tsx`** — Client-Funnel; rendert die Fragen datengetrieben aus `ASK_QUESTIONS`.
- **`src/components/ask/QuestionCard.tsx`** — rendert je Option einen `<button className="ask-opt">`; das `<span className="ask-opt__glyph">{selected ? "◆" : "◇"}</span>` (Z. 47–49) ist das Diamant-Glyph vor jeder Choice. Selektionszustand liegt schon redundant auf `data-selected` + `aria-pressed`.
- **`scripts/seed-data/ask-anchors.json`** — **die Vorlage für deine neue JSON**: `{ version, _doc, anchors: [{ book: "<slug>", lanes, sources, confidence, note }] }`, in-memory per Slug gejoint in `src/lib/ask/recommend.ts`, **kein DB-Schema**. Genau dieses Muster (Slug-Referenz + in-memory-Join, kein Migration-Pfad) übernimmt das Faction-Tool.
- **Factions**: kanonische IDs in `scripts/seed-data/factions.json` (z. B. `thousand_sons`); Faction-Hub-Route `/fraktion/[slug]` existiert; Sigil-Helper `src/lib/.../faction-icon.ts` + `FactionClassIcon` aus Brief 150.
- **Buch-Auflösung**: Slug → Buchdaten läuft heute über den in-memory Buch-Loader des Ask-Pfads (`cachedAskBooks` in `recommend.ts`); Bücher haben `/buch/[slug]`.

Hintergrund-Backlog-Eintrag (Quelle, jetzt durch diesen Brief promoviert): `roadmap.md` § Ideas Backlog „One Faction, One Book" — inkl. Kandidaten-Startliste + Quell-Podcast. **Philipp pflegt die finale Liste selbst** (playable factions; Korpus- *und* Nicht-Korpus-Einträge), CC entscheidet **nicht** über Inhalte.

## Architektonischer Vertrag (meiner — bitte einhalten)

**1. URL- / SSR-Vertrag**

- **Fragebogen bleibt unangetastet auf `/ask`** mit seinem exakten Brief-164-Param-Contract (`searchParams`, Deep-Links, SSR-First, Matrix-Hot-Path). Kein Redirect, keine Param-Umbenennung.
- **Das Hub-Gerüst** (beide Tools erreichbar + benannt) ist präsentational — du wählst Tabs/Karten/Landing. Harte Anforderung: von der `/ask`-Oberfläche kommt der Reader klar zum Faction-Tool und zurück.
- **Faction-Tool ist eigenständig deep-linkbar + SSR-gerendert — über beide Ebenen.** Default-Schnitt: Sub-Route **`/ask/fraktion`** (Picker, keine Auswahl) + **`/ask/fraktion/[faction]`** (gewählte Top-Level-Faction). Wegen des **Drilldowns** (Top-Level-Fraktionen + Subfraktionen) muss auch eine **Subfraktion** deep-linkbar + SSR-sichtbar sein — entweder als geschachteltes Segment **`/ask/fraktion/[faction]/[subfaction]`** oder als flacher (Sub-)Faction-Key, deine Wahl. Outcome-Vertrag: ein Deep-Link auf einen **Leaf-Knoten** (Top-Faction mit eigenem Pick **oder** Subfraktion) zeigt **Pick #1 server-gerendert**; ein Deep-Link auf einen **Gruppen-Knoten** ohne eigenen Pick (z. B. `Space Marines`) zeigt **die aufgeklappte Subfraktions-Ebene** SSR-sichtbar. Du darfst statt der Sub-Route einen reservierten Query-Key auf `/ask` nehmen — **wenn** (a) er nicht mit den Fragebogen-Antwort-Params kollidiert, (b) gewählte (Sub-)Faction + Pick #1 ohne JS SSR-sichtbar sind, (c) Back/Forward korrekt sind. Im Zweifel die Sub-Route.
- **Der aufgelöste `book`-Identifier ist der Buch-Slug; das Klick-Ziel ist `/buch/{slug}`.** Das öffnet über die bestehende Intercepting-Route (`@modal/(.)buch/[slug]`) bereits das Buch-Info-Popup — **keine neue Route nötig**. Der Pick liefert nur den Slug; das Popup lädt seine Daten selbst.
- **Reshuffle steht NICHT in der URL.** Es ist ephemerer Client-State; ein Deep-Link landet immer auf Pick #1 des gewählten (Sub-)Faction-Knotens.

**2. Datenmodell der Kurations-JSON** (Feld-Semantik meiner; Namen/Form darfst du an die Hausschreibweise angleichen)

Neue Seed-Datei (Vorschlag `scripts/seed-data/faction-starters.json`), Muster wie `ask-anchors.json`, aber **DB-frei** (kein Slug-Join gegen die Buch-Tabelle) und **zweistufig** (Drilldown), weil die Excel zwei Ebenen trägt (Top-Level-Fraktionen + Subfraktionen):

- Top-Level `version` + `_doc` (erklärt Herkunft, „aus `Warhammer_OFOC_SSOT.xlsx` generiert, Philipp pflegt verbatim", DB-frei, kein Apply).
- Eine geordnete Liste von **Faction-Knoten**. Jeder Knoten:
  - `label`: Anzeige-Name (Philipps Wort — **nicht** gegen `factions.json` validiert; darf eine Subfaction sein, die in der DB gar nicht existiert; Schreibweise verbatim außer Trim, z. B. `Drukhari `/`Nekrons` bleiben so).
  - optional `slug`/`id`: Schlüssel für die Deep-Link-URL (sonst slugifiziert CC `label`); optional best-effort fürs Sigil.
  - optional `picks`: **geordnetes** Array (s. u.), `picks[0]` = primär, Reshuffle zykelt der Reihe nach (Wrap-around).
  - optional `children`: geordnete Liste von **Subfraktions-Knoten** (gleiche Form, **genau eine** Ebene tief). Ein Knoten hat `picks`, `children` **oder beides**: ein Gruppen-Knoten ohne eigenen Pick (z. B. `Space Marines`, `Chaos Space Marines`) trägt nur `children`; ein Leaf trägt `picks`; `Astra Militarum` trägt **beides** (eigener Pick **und** Subfraktionen).
- Ein **Pick** trägt mindestens `title` (Pflicht), optional `author`/`kind`/`note`. Format-Hinweise stehen in der Excel **inline im Titel** (`(Audiodrama)`, `(Audiobook)`, `Series`, `trilogy`, `Omnibus`, `(short story?)`) — der Convert-Step darf sie **best-effort** in `kind`/`note` herausziehen und den bereinigten Titel zur Auflösung nutzen; Pflicht ist das nicht. Der **Convert-Step löst den Titel tolerant gegen den Korpus auf** (Normalisierung + Fuzzy gegen Tippfehler/Varianten) und schreibt die Buch-Referenz (**Slug**, Link `/buch/{slug}`) in die generierte JSON → zur Laufzeit ist der Pick **klickbar** und öffnet das Buch-Info-Popup (reine Seiten-Navigation; das Tool fragt die DB nicht ab). **Nicht oder nur unsicher aufgelöste Titel** landen in der **Review-Liste** und rendern bis dahin ohne Popup-Link (Titel/`note` bleiben sichtbar). **Erwartung: ein erheblicher Teil löst nicht eindeutig auf** — viele Excel-Einträge sind Reihen-/Sammelbegriffe (`Watchers of the Throne Series`, `Path of the Eldar`, `Belsarius Cawl Trilogy`) oder Audio-Dramen, kein einzelnes Korpus-Buch. Das ist kein Fehler, sondern Futter für die Review-/Gap-Liste.
- **Welche Knoten im Picker erscheinen, ist rein datengetrieben**: exakt die Einträge dieser Datei (Datei-Reihenfolge oder optionales `displayOrder`), Top-Level + Drilldown. Kein hartkodiertes Faction-Set, keine `factions.json`-Abhängigkeit.

**3. Server-/Client-Grenze**

- Der **Render-Pfad** liest **ausschließlich die statische, generierte Kurations-JSON** — **kein** DB-/Buch-Loader-Zugriff, weder server- noch client-seitig. Die JSON kann statisch importiert + SSR-gerendert werden (Pick #1 + alle Picks des gewählten Knotens sind sofort da).
- Die **Titel→Buch-Auflösung passiert im Convert-Step** (deterministisches `npm run`-Script, **vor** dem App-Build — Muster `import:ssot-roster`), **nicht** zur Laufzeit und **nicht** in `next build`/`prebuild`. `next build` liest nur die committete, generierte JSON; die trägt die fertigen Referenzen. Das Buch-Popup ist eine **eigene Route**, die ihre Daten selbst lädt — der Pick liefert nur den Slug.
- Reshuffle ist reiner Client-State; keine Server-Roundtrips.

**4. Reshuffle-Semantik**

- Reshuffle-Control nur zeigen, wenn der gewählte **(Sub-)Faction-Knoten ≥ 2 Picks** hat. Zykelt geordnet, wrap-around, ephemeral. Gruppen-Knoten ohne eigene Picks (z. B. `Space Marines`) zeigen kein Reshuffle — sie führen in die Subfraktions-Ebene.

**5. Validierung / Integrität (strukturell, NICHT gegen DB/Katalog)**

- **Strukturell:** jeder Knoten hat ein `label` und entweder ≥ 1 Pick mit `title` **oder** ≥ 1 `children`-Knoten (Gruppen-Knoten); Felder wohlgeformt. **Labels werden NICHT gegen `factions.json` validiert** — Philipps Input verbatim (Subfactions ohne DB-Eintrag erlaubt).
- **Excel-Parsing fail-loud:** der Convert-Step muss die Zwei-Sheet-Form sauber verarbeiten — `Main faction` im In-Depth-Sheet ist **forward-filled** (nur die erste Zeile einer Gruppe trägt den Namen), **Leerzeilen-Spacer** zwischen Gruppen werden übersprungen, und jede In-Depth-`Main faction` muss auf einen vorhandenen Big-Faction-Knoten matchen (sonst loud-error, Muster `import:ssot-roster`). Eine Big-Faction-Zeile mit `Book` = „look into In-Depth Faction" erzeugt **keinen** eigenen Pick, sondern einen Gruppen-Knoten.
- **Buch-Auflösung (Convert-Step, tolerant + Hand-Gate):** jeder Pick-Titel wird **tolerant** gegen den Korpus aufgelöst (Normalisierung + Fuzzy gegen Tippfehler/Varianten, z. B. „Space Wolfes Omnibus" → „Space Wolf Omnibus"). High-Confidence-Treffer → Buch-**Slug** in die JSON. **Kein/unsicher/mehrdeutig → nicht raten**, sondern in die **Review-Liste** (`scripts/seed-data/faction-starters.review.md`, committed, reitet im PR mit): (a) nicht gefunden, (b) unsicherer Best-Guess (markiert), je mit Faction-Kontext. CC legt sie als **Zwischenstep an Philipp** (vor der finalen JSON); er liefert nach/korrigiert/bestätigt → Re-Run. Misses (inkl. Audio-Dramen) = DB-Nachpflege-Liste. Der Convert-Step bricht bei Auflösungs-Misses **nie** ab (nur bei malformed Zeilen/Header); ungelöste Picks bleiben **ohne `book`** in der JSON und rendern ohne Popup-Link.

**6. Accessibility-Outcomes**

- Picker, **Drilldown** und Reshuffle voll tastaturbedienbar; Reveal-/Reshuffle-/Drilldown-Motion respektiert `prefers-reduced-motion`; SSR-First (gewählte (Sub-)Faction + Pick #1 ohne JS sichtbar).

## Quell-Pipeline: Excel-SSOT → validierte JSON

Philipp liefert die Faction→Buch-Liste als **Excel**, nicht als handgeschriebene JSON. Der Fluss ist **konsistent mit dem bestehenden Excel-SSOT-Muster des Projekts** (`scripts/seed-data/source/Warhammer_Books_SSOT.xlsx` → deterministischer `npm run`-Loader → committete JSON; Decision `why-excel-ssot-not-crawl.md`).

**Excel-Vertrag (Ist-Stand, geliefert 2026-06-26).** Quelle = `scripts/seed-data/source/Warhammer_OFOC_SSOT.xlsx`, **zwei Sheets**:

- **`Big Faction`** — Spalten `Faction | Book | Alternative` (16 Top-Level-Fraktionen). `Book` = primärer Pick (`picks[0]`); `Alternative` = **komma-getrennte** Zusatz-Picks (`"Rose at War, Rose in Darkness, Morvenn Vahl - Spear of Faith"` → drei Picks), leer erlaubt. Zwei Zeilen (`Space Marines`, `Chaos Space Marines`) tragen als `Book` den Pointer **„look into In-Depth Faction"** → **kein** eigener Pick, sondern Gruppen-Knoten. Die Leerzeile direkt unter dem Header wird übersprungen.
- **`In-Depth Faction`** — Spalten `Main faction | Subfaction | Book | Alternative`. `Main faction` ist **forward-filled** (nur die erste Zeile je Gruppe trägt den Namen; darunter leer). `Subfaction` = `label` des Child-Knotens; `Book`/`Alternative` wie oben. **Leerzeilen-Spacer** zwischen Gruppen werden übersprungen. Jede `Main faction` matcht auf einen Big-Faction-Knoten (`Astra Militarum`, `Space Marines`, `Chaos Space Marines`).

Mapping → Datenmodell (§ Vertrag 2): Big-Faction-Zeilen → Top-Level-Knoten; In-Depth-Zeilen → `children` unter ihrer (forward-filled) `Main faction`; `Astra Militarum` bekommt eigenen Pick **und** `children`. Format-Hinweise stehen inline im Titel (`(Audiodrama)`, `Series`, `trilogy`, `Omnibus`) — best-effort in `kind`/`note`, bereinigter Titel zur Auflösung.

**Convert-Step:**

1. **Excel = SSOT**, abgelegt unter `scripts/seed-data/source/` (Präzedenz: Books-/Map-SSOT liegen dort).
2. **Ein deterministisches Convert-Script** (manuell per `npm run`, **nicht** `next build`/`prebuild` — Muster `import:ssot-roster`) liest beide Sheets, validiert Header + jede Zeile gegen das Schema (**fail-loud bei Malformed / Header-Mismatch / unbekannter `Main faction`**) und **löst jeden Buch-Titel tolerant gegen den Korpus auf** — Normalisierung + Fuzzy gegen Tippfehler/Varianten (z. B. „Space Wolfes Omnibus" → das echte „Space Wolf Omnibus"), gegen den committeten Buch-Katalog. High-Confidence-Treffer → Buch-**Slug** in die **committete `faction-starters.json`**.
3. **Review-Zwischenstep (Hand-Gate):** kein/unsicher/mehrdeutig gefundene Titel landen in **`scripts/seed-data/faction-starters.review.md`** (committed, read-only Liste, reitet im PR mit) — (a) nicht gefunden, (b) unsicherer Best-Guess (markiert), je mit Faction-Kontext. CC legt sie Philipp **vor**, *bevor* die finale JSON steht; Philipp korrigiert/liefert nach/bestätigt, dann Re-Run → finale JSON. **Nicht raten, nicht abbrechen** — unresolved Picks bleiben ohne `book`. Die Miss-Liste (inkl. Audio-Dramen, Reihen-/Sammelbegriffe) ist zugleich die DB-Nachpflege-Liste.
4. App liest nur die generierte JSON — Laufzeit **DB-frei**, SSR; Klick auf einen Pick öffnet das Buch-Popup (`/buch/{slug}`, eigene Route).

Das deckt sich mit dem Best-Practice für kleine, kuratierte Inhalte: **lokale, typisierte Content-Dateien mit Convert-Zeit-Validierung statt Headless-CMS** (CMS wäre Overkill), Spreadsheet→JSON, Schema-Validierung am Excel→JSON-Übergang. **CC recherchiert die konkrete Lib + den aktuellen Stand und pinnt** (Version-Policy — `read-excel-file` ist im Repo und treibt den bestehenden Loader; CC bestätigt/wählt). Absicht: *maintainer-editierbare Excel-SSOT, deterministischer validierter `npm run`-Convert-Step, committete typisierte JSON, kein Runtime-CMS, kein DB-Zugriff, `next build` nur lesend.*

Bestätigt: Convert-Script wird ein `npm run`-Step (wie die anderen Seed-Loader), die JSON bleibt im Repo-Diff committet (reviewbar, deterministisch). Offen für CCs Report nur noch der genaue Script-Name + ob neben der `.review.md` ein zweites maschinenlesbares Review-Artefakt (JSON) sinnvoll ist.

## Constraints

- TypeScript strict, kein `any`; ein Pick = selbsttragende Anzeige-Daten (`title` Pflicht, `book`-Slug optional → Klick-Ziel `/buch/{slug}`), sauber typisiert.
- **Das Tool fragt zur Laufzeit nie die DB ab** — der Render-Pfad liest nur die statische JSON. Die Titel→Buch-Auflösung passiert im **Convert-Step** (manuell per `npm run`, **vor** dem App-Build), **nicht** in `next build`/`prebuild`; kein neues DB-Schema, keine Migration.
- Faction-**Labels** nicht gegen `factions.json` validieren — verbatim (Subfactions ohne DB-Eintrag erlaubt). **Buch-Titel** dagegen werden aufgelöst + verlinkt; Misses → Review-/Gap-Liste (nicht raten, nicht abbrechen).
- Fragebogen-Logik (`recommend`/Matrix/Scoring/Boundaries aus Brief 164) bleibt unberührt; `/ask` darf nur Hub-Chrome + den Glyph-Rückbau bekommen.
- CC entscheidet **nicht** über Buch-Inhalte. Quelle ist Philipps **Excel** (`Warhammer_OFOC_SSOT.xlsx`, geliefert — § Quell-Pipeline); die generierte `faction-starters.json` stammt **vollständig** aus der Excel. CC **erfindet keine Buch-Inhalte** und schreibt **keine** Platzhalter-/Beispiel-Einträge in die echte JSON. Brauchen Convert-/Schema-Tests Beispieldaten, liegen die als kleine, klar getrennte **Test-Fixture** (z. B. unter einem `__fixtures__`-/Test-Pfad), nie als erfundene Bücher in `faction-starters.json`.
- Version-Policy: keine Versionsnummern pinnen außer was du selbst installierst/recherchierst.

## Out of scope

- **Faction-Hub `/fraktion/[slug]` nicht anfassen.** Das Tool lebt diese Runde auf `/ask`, nicht auf den Hubs. (Spiegelung auf die Hubs ist ein möglicher Folge-Kandidat — nicht jetzt.)
- **`ResultCard`s „◆ Top match"-Marker bleibt** — der Diamond-Rückbau betrifft nur das Choice-Glyph in `QuestionCard`. Wenn du den Tier-Marker auch ändern willst, erst zurückfragen.
- Kein Refactor an `factions.json` / `faction-policy.json`, am Buch-Loader oder am Brief-164-Scoring.
- Keine DB-/Atlas-Arbeit, kein `db:sync`. Reine Frontend-+-Seed-Daten-Runde.
- Kein „best book absolutely"-Algorithmus — die Picks sind redaktionell (Philipps Liste), nicht berechnet.
- **Kein Laufzeit-DB-Zugriff durch das Faction-Tool** (kein Live-Ranking, kein Buch-Loader-Join im Render-Pfad). Die Buch-Auflösung ist ein **Build-Schritt**; das Popup ist eine bestehende Route.
- **Kein „I want more" / Such-Link** — bewusst draußen (zu komplex). „Mehr" liefert allein das Reshuffle über die hinterlegten Picks.
- **Keine DB-Mutation / kein Eintrag neuer Bücher in dieser Runde** — fehlende Bücher/Audio-Dramen kommen in den Gap-Report; das tatsächliche Hinzufügen zur DB ist eine spätere, separate Aufgabe.

## Acceptance

Die Session ist fertig, wenn:

- [ ] `/ask` präsentiert sich als Hub mit zwei klar benannten Wegen (Fragebogen + Faction-Tool), in setting-passender Copy; der Fragebogen funktioniert unverändert inkl. seiner bestehenden Deep-Links.
- [ ] Eine neue Kurations-Seed-JSON existiert mit dem oben spezifizierten **zweistufigen** Schema (`version`/`_doc`/Knoten mit `label` → optional geordnete `picks` und/oder `children`; `title` Pflicht, `book`-Slug im Convert-Step aufgelöst; Laufzeit DB-frei) und ist **vollständig aus `Warhammer_OFOC_SSOT.xlsx` generiert** (keine erfundenen/Platzhalter-Einträge).
- [ ] Quelle ist Philipps Excel unter `scripts/seed-data/source/Warhammer_OFOC_SSOT.xlsx`; ein deterministischer, schema-validierter `npm run`-Convert-Step (Muster `import:ssot-roster`) liest **beide Sheets** (`Big Faction` + `In-Depth Faction`, inkl. Forward-Fill der `Main faction` + Skip der Spacer-Zeilen) und erzeugt die committete `faction-starters.json` (fail-loud bei malformed Zeilen / Header-Mismatch / unbekannter `Main faction`). `next build` liest nur die committete JSON.
- [ ] Das Faction-Tool rendert den **Drilldown**: Top-Level-Faction wählen → entweder Pick #1 server-gerendert (Leaf) **oder** aufgeklappte Subfraktions-Ebene (Gruppen-Knoten); Subfraktion wählen → Pick #1 server-gerendert. Bei ≥ 2 Picks erscheint ein Reshuffle-Control, das durch die geordneten Picks zykelt (Wrap-around, ohne URL-Änderung).
- [ ] Jeder aufgelöste Pick ist **klickbar und öffnet das Buch-Info-Popup** über `/buch/{slug}` (der Convert-Step hat den Buch-Slug gesetzt); nicht aufgelöste Picks rendern Titel/Note ohne toten Link.
- [ ] Die Titel-Auflösung ist **tolerant** (Normalisierung + Fuzzy gegen Tippfehler/Varianten); High-Confidence → verlinkt, unsicher/kein Treffer → **nicht geraten**.
- [ ] Ein **Review-Zwischenstep** (`scripts/seed-data/faction-starters.review.md`, committed, reitet im PR mit) listet nicht gefundene **und** unsichere Titel mit Faction-Kontext und geht an Philipp, *bevor* die finale JSON steht; er kann nachliefern/prüfen. Der Convert-Step bricht nicht ab; unresolved Picks bleiben ohne `book`.
- [ ] Das Faction-Tool macht zur Laufzeit keine DB-Abfrage (Render aus der statischen JSON).
- [ ] Gewählte (Sub-)Faction ist deep-linkbar + SSR-sichtbar (geschachteltes Sub-Route-Segment, flacher Key oder kollisionsfreier Query-Key); ein Gruppen-Knoten deep-linkt auf die aufgeklappte Subfraktions-Ebene; Back/Forward korrekt.
- [ ] Das ◇/◆-Glyph vor den Fragebogen-Choices ist weg; Selektionszustand bleibt visuell + für Screenreader eindeutig.
- [ ] Picker, Reshuffle und Choices sind tastaturbedienbar; Motion respektiert `prefers-reduced-motion`.
- [ ] Der strukturelle Daten-Check (jeder Knoten: `label` + ≥ 1 Pick mit `title` **oder** ≥ 1 `children`) läuft; Labels werden **nicht** gegen `factions.json` geprüft; Buch-Titel werden aufgelöst und Misses in der Review-/Gap-Liste gelistet (kein Raten).
- [ ] `npm run lint` + `tsc --noEmit` (bzw. die Repo-üblichen Gates) grün.

## Open questions (für deinen Report — keine Blocker)

- URL-Schnitt: geschachteltes `/ask/fraktion/[faction]/[subfaction]`, flacher (Sub-)Faction-Key oder Query-Key auf `/ask` — welcher fiel dir für den Drilldown am saubersten, und warum?
- Format-Hinweise stehen in der Excel inline im Titel (`(Audiodrama)`, `Series`, `trilogy`, `Omnibus`, `(short story?)`) — welche hast du in `kind`/`note` extrahiert, welche als Teil des Titels gelassen? (Damit das Schema dokumentiert ist.)
- Gegen welche committete Katalog-Quelle hat der Convert-Step die Titel aufgelöst (`book-roster.json`, `seed-data/books.json`, DB-Snapshot …) — und wie hoch war die Trefferquote vs. Review-Liste?

## Notes — illustrativer Schema-Sketch (NICHT die finale Implementierung)

Nur zur Form; Feldnamen/Typen sind deine. Knoten tragen `picks` und/oder `children`; Picks tragen `title` (Pflicht); den Buch-Slug (`book`) löst der `npm run`-Convert-Step auf — Philipp kann einen bekannten Slug vorab setzen. Die Beispiel-Knoten sind echte Excel-Zeilen (Slugs illustrativ):

```jsonc
{
  "version": 1,
  "_doc": "Faction → kuratierte Einstiegs-Picks (Brief 166), generiert aus Warhammer_OFOC_SSOT.xlsx (zwei Sheets, verbatim). Knoten = Top-Level-Faction; optional 'children' = Subfraktionen (genau eine Ebene). Labels NICHT gegen factions.json validiert (Subfactions ohne DB-Eintrag erlaubt). Buch-Titel löst der npm-run Convert-Step tolerant (Normalisierung + Fuzzy) gegen den Korpus auf -> 'book'-Slug -> klickbares Popup (/buch/{slug}); nicht/unsicher gefundene Titel -> faction-starters.review.md (Zwischenstep an Philipp) + DB-Nachpflege. Laufzeit DB-frei. picks[0] primär, Reshuffle zykelt.",
  "starters": [
    {
      "label": "Adeptus Sororitas",
      "picks": [
        { "title": "Our Martyred Lady", "kind": "audio-drama" },
        { "title": "Rose at War" },
        { "title": "Rose in Darkness" },
        { "title": "Morvenn Vahl - Spear of Faith" }
      ]
    },
    {
      "label": "Space Marines",
      "children": [
        {
          "label": "Ultramarines",
          "picks": [
            { "title": "Dark Imperium Trilogy" },
            { "title": "uriel ventris series" }
          ]
        },
        {
          "label": "Black Templars",
          "picks": [ { "title": "Helsreach", "book": "helsreach" } ]
        }
      ]
    },
    {
      "label": "Astra Militarum",
      "picks": [ { "title": "Fifteen Hours", "kind": "audiobook" } ],
      "children": [
        { "label": "Death Korps of Krieg", "picks": [ { "title": "Death Korps Novels (Krieg und Siege of Vraks)" } ] },
        { "label": "Cadian", "picks": [ { "title": "Cadia Stands", "book": "cadia-stands" }, { "title": "Minka Lesk" }, { "title": "Catachan Devil" } ] }
      ]
    }
  ]
}
```

Worktree: **Product** (`chrono-lexicanum-product`). Wie bei Brief 164 reitet die neue `scripts/seed-data/…`-Datei bewusst im Product-PR mit (Ask-Seed-Daten sind hier Product-Scope), zusammen mit `src/app/ask/**`, `src/components/ask/**`, dem Convert-Script + Typen/Check, der Source-Excel und der `faction-starters.review.md`. Ein PR.

> **Hinweis Source-Excel.** `Warhammer_OFOC_SSOT.xlsx` muss im **Product-Worktree** unter `scripts/seed-data/source/` liegen, damit der Convert-Step sie findet; CC committet sie im Product-PR (Präzedenz: die anderen `*_SSOT.xlsx` sind committet).

## Revision 2026-06-26 — Review-Pass eingearbeitet + Excel geliefert

Codex-Review zu Brief 166 (vier Findings) + Philipps OFOC-Excel sind hier eingearbeitet:

- **P0 (Input fehlte).** Excel geliefert: `scripts/seed-data/source/Warhammer_OFOC_SSOT.xlsx`. Exakter Sheet-/Spalten-Vertrag dokumentiert (§ Quell-Pipeline → „Excel-Vertrag"): zwei Sheets `Big Faction` (`Faction|Book|Alternative`) + `In-Depth Faction` (`Main faction|Subfaction|Book|Alternative`, forward-filled, Spacer-Rows), `Alternative` komma-split, „look into In-Depth Faction"-Pointer = Gruppen-Knoten.
- **P1 („beim Build" missverständlich).** Überall ersetzt durch **deterministischer `npm run`-Convert-Step vor dem App-Build** (Muster `import:ssot-roster`); `next build`/`prebuild` lesen nur die committete JSON, kein Schreibpfad.
- **P1 (Review-Artefakt ohne Pfad).** Festgelegt: `scripts/seed-data/faction-starters.review.md`, committed, reitet im PR mit; Regel: unresolved/uncertain Picks bleiben ohne `book`.
- **P2 (Beispiele vs. „nicht raten").** JSON stammt **vollständig** aus der Excel; keine erfundenen/Platzhalter-Einträge; Test-Beispiele nur als getrennte Test-Fixture.
- **Scope-Klärung (mit Philipp).** Zwei-Ebenen-**Drilldown** gewählt → Datenmodell um optionale `children` erweitert (genau eine Ebene); `book` = Slug, Link `/buch/{slug}` (Intercepting-Route existiert, keine neue Route).
