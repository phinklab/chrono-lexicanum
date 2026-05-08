---
session: 2026-05-08-049
role: architect
date: 2026-05-08
status: open
slug: karpathy-brain-atlas-reset
parent: null
links:
  - 2026-05-08-047
  - 2026-05-08-048
commits: []
---

# Karpathy-Reset — Chrono Brain (im Repo) + Chrono Atlas (externer Vault)

## Goal

Bevor weiter Phase-3-Pipeline-Arbeit läuft, das Projektgedächtnis nach Karpathys LLM-Wiki-Pattern (`raw/` + `wiki/` + Schema-Datei, drei Operationen Ingest/Query/Lint) auf zwei klar getrennte Speicher umstellen:

1. **Chrono Brain** — kleines, immer-mitgeladenes *Engineering-Gedächtnis* unter `brain/` im Repo. Was das Projekt ist, was entschieden wurde, wie man arbeitet, was offen ist. Ziel: jede Cowork-/CC-Session findet in <5 Sekunden Lesezeit den aktuellen Stand. Pflege durch das LLM, gegen `raw/`-Quellen.
2. **Chrono Atlas** — externer Obsidian-Vault `chrono-atlas/`, **außerhalb** dieses Repos. Großer, browseable, graph-fähiger Read-only-View der Buchdomäne (Bücher, Autoren, Fraktionen, Serien, Eras, Quellen, Quality Views). Aus Postgres generiert via `npm run atlas:regen`. Niemals automatisch im LLM-Kontext, nur auf explizites „Schau in den Atlas".

Diese Session liefert das Gerüst (Verzeichnisse, Schema-Datei, leere Wiki-Seiten mit definierten Aufgaben, Atlas-Regen-Skript-Skeleton), die erste Ingest-Pass über bestehendes Material, und die Workflow-Dokumentation. **Keine App-Feature-Arbeit, keine DB-Migration, keine Pipeline-Code-Änderung.**

## Context

### Warum jetzt

Phase 3 hat Material produziert, das schwer zu navigieren wird: 50+ Sessions, 5 Diff-Files, 2 externe Code-Reviews, 800-Bücher-Pipeline mit ~10 Modulen. Die `sessions/README.md`-„Carry-over"-Liste ist auf 9 Punkte angewachsen (nominales Limit: 3–5). README.md / ARCHITECTURE.md / ONBOARDING.md sind seit dem Plan-Reshuffle 2026-05-02 stale (Brief 048 war öffnender Patch dafür — siehe unten). Cowork findet sich beim Session-Start nur durch Lesen von `sessions/README.md` (~85 Zeilen) plus 2–3 jüngste Reports zurecht — das ist Lesearbeit, kein Pattern.

Karpathy adressiert genau diesen Schmerz: das LLM pflegt synthetisierte Wiki-Seiten gegen immutable Rohquellen, und antwortet nicht mehr aus rohen Logs sondern aus kuratiertem Wissen.

### Domänen-Trennung — der entscheidende Schnitt

Chrono Lexicanum hat **zwei** Wissensdomänen, die nicht vermischt werden dürfen:

- **Engineering-Wissen.** Wie das Projekt aufgebaut ist, warum wir Drizzle gewählt haben, wie die Pipeline funktioniert, wie ein 3e-Batch läuft, was offen ist. Klein, ändert sich pro Session, immer-relevant fürs LLM. → **Brain**.
- **Buch-Domänen-Wissen.** ~800 Bücher × N Felder, Quellen pro Feld, Tags, Plot-Synopsen, Faction-Zuordnungen, Era-Zuordnungen. Riesig, ändert sich pro Pipeline-Lauf, **selten** relevant fürs LLM (nur wenn explizit nachgefragt). Postgres ist Wahrheit. → **Atlas**.

Karpathys Pattern lebt vom *kleinen* Wiki — wenn wir Buchdaten ins Brain mischen, fressen sie den Token-Vorteil sofort. Trennung ist nicht-verhandelbar.

### 047 + 048 sind durch — was sie 049 mitgeben (Stand 2026-05-08, post-Bundle-Push)

Cowork hatte den Reset zunächst als Pause auf 047/048 gerahmt; in der Zwischenzeit hat CC das 047/048-Bundle abgearbeitet und gepusht (047-impl `4da6184`, 048-impl im selben Push). Die Pause-Banner in 047 und 048 sind zurückgenommen, beide haben jetzt status `implemented`. Der Reset läuft nicht mehr *vor* 047/048, sondern *nach*. Das ändert den Brief in zwei Punkten:

- **Top-Level-Files sind frisch geputzt.** 048 hat README/ARCHITECTURE/ONBOARDING auf den realen Phase-3-Stand gebracht (TypeScript statt Python, Phase 3 statt 4, Wikipedia + Lexicanum + OpenLibrary + Hardcover + LLM statt Lexicanum + Goodreads, 26 manuelle Bücher statt „intentionally empty"). Die Schnappschüsse, die unter `brain/raw/historical/2026-05-08-pre-reset/` landen, sind damit *akkurate* Phase-3-Dokumentation — nicht zu verwechseln mit Pre-Reshuffle-Stand. Das macht den Migration-Schritt risikoärmer.
- **Pipeline ist gehärtet, nicht „wackelig".** 047 hat fünf Hebel A–E gezogen (`source_kind`-Enum + `pickPrimarySource`, Lore-Coverage via Lexicanum-URL-Patterns + LLM-Junctions, Format/Availability-Validation, OL-Edition-Filter via `language=eng` + parse-time-Year-Cross-Check, Hardcover-Author-Hint im LLM-Prompt). Acceptance-Diff `backfill-20260508-2101.diff.json` (9 Bücher, Lauf nach Buch 9 abgebrochen): Junction-Coverage 0/50→6/6 (100% statt 0%), `releaseYear`-Field-Conflicts 11/15→0/0, 0 invalide format/availability, 0 `value_outside_vocabulary`-Flags. Das heißt: die Pipeline ist nahe am 3d-Apply-fähigen Zustand. Reset findet damit auf einer Codebasis statt, die *fast* ready ist — er bremst keinen unklaren Stand, er ordnet eine bekannte Welt.

Zwei Befunde aus 047-impl, die in 049 nicht aktiv adressiert werden, aber als künftige Carry-over-Items in `brain/wiki/open-questions.md` mit-eingespeist werden müssen (siehe Acceptance-Bullet zur Migration der Carry-over-Section):

- **Lexicanum trägt KEINE Junction-Daten zur Pipeline bei.** `lexicanum/parse.ts` extrahiert title/authorNames/releaseYear/isbn13/startY/endY, aber nicht factionNames/locationNames/characterNames — Lexicanum-Body-Wikitext ist Prosa, nicht Infobox. Junction-Coverage in 047 (6/6) kommt zu 100% aus dem LLM-Output. FIELD_PRIORITY `["lexicanum", "llm"]` für die drei Junction-Felder ist effektiv `["llm"]`. Künftiger Brief: `extractLoreFromBody`-Pass in `lexicanum/parse.ts` (Cheerio-Walks über `.mw-parser-output` mit Heuristiken für Faction/Location/Character-Linktexte), oder die FIELD_PRIORITY auf `["llm"]` reduzieren und ehrlich sein. Out of scope für 049.
- **Hebel E (Hardcover-Author-Hint für Anthologien) ist code-verifiziert aber nicht empirisch validiert.** Test-Lauf brach nach Buch 9 ab; einzige Anthologie im 0–9-Slice wäre Tales of Heresy (Buch 10) gewesen. Die 5 Hardcover-Hits im Sample waren alle Single-Author-Novels, Hint feuerte korrekt nicht. Empirischer Test braucht Anthologie-Sample (`tales-of-heresy`, `mark-of-calth`, `sons-of-the-emperor`). Out of scope für 049 — eigener Mini-Brief nach Reset.

Plus 048-impl hat in seiner „Other stale references found while reviewing"-Sektion einen Patch-Pfad markiert (CLAUDE.md:33+99 Stack-Tabelle, `scripts/seed-data/README.md:101`, `next.config.ts:7-11`-Comment, `.env.example:43+56-57` Sonnet-Reference, `ROADMAP.md:90` selbiges, `src/app/page.tsx:15` Phase-4-Comment). Diese Punkte fließen *nicht* in einen separaten Mini-Brief — sie werden im 049-Reset-Pass sowieso konsolidiert: CLAUDE.md kriegt den neuen Brain-Abschnitt und kann gleich auch die Stack-Tabelle korrigieren; `.env.example` und `ROADMAP.md`-Sonnet-Pin werden in der nächsten Modell-Entscheidung adressiert (Carry-over bleibt); `seed-data/README.md`-Comment + `next.config.ts`-Comment + `page.tsx`-Comment sind Cosmetic-Fixes, die als Acceptance-Bullet in 049 mitlaufen können (siehe unten).

### Top-Doc-Fate (entschieden, nicht offen)

Du hast gefragt: was sagt Karpathy zu README/ARCHITECTURE/ROADMAP/ONBOARDING? Strikt-Karpathy-konform: jedes davon ist *eine geschriebene Quelle zu einem Zeitpunkt* — also Kandidat für `brain/raw/historical/`. Die *lebende Funktion* (was steht heute drin, was sollte heute drinstehen) wandert in `brain/wiki/`-Seiten, die das LLM gegen `brain/raw/` aktuell hält.

Aber: README.md ist GitHub-Frontpage. Ein externer Reddit-Besucher landet dort, nicht in `brain/`. Also:

- **README.md bleibt auf Top-Level** — aber als *dünne* Datei: Projektpitch (3–4 Absätze), Status-Badge (Phase, Feature-Set live), Pointer zu `brain/` für Mitarbeiter und zu `https://chrono-lexicanum.vercel.app` (oder finale URL) für Leser. **Keine** Architektur-Details, keine Stack-Tabelle, keine Roadmap. Pflege durch das LLM gegen `brain/wiki/project-state.md`.
- **ARCHITECTURE.md, ROADMAP.md, ONBOARDING.md** — wandern als *immutable Schnappschuss* nach `brain/raw/historical/2026-05-08-pre-reset/`. Werden im Top-Level durch *thin redirects* ersetzt (eine Zeile: `> Diese Datei lebt jetzt unter brain/wiki/architecture.md (bzw. roadmap.md, onboarding.md). Historischer Stand vom 2026-05-08 unter brain/raw/historical/2026-05-08-pre-reset/.`). Keine Inhalts-Doppelung.
- **CLAUDE.md** (Top-Level, Stack-Konventionen) bleibt wo es ist. Es ist *die Repo-Schema-Datei für CC's Auto-Lade-Mechanik* — nicht zu verwechseln mit Karpathys Schema-Datei für das Wiki (das wird `brain/CLAUDE.md`, eine Etage tiefer; CC's Auto-Lade-CLAUDE.md verweist auf `brain/CLAUDE.md`). Update nötig: ein Abschnitt „Brain & Atlas" ergänzen, der CC bei jedem Session-Start zur `brain/`-Lektüre verpflichtet.

### Brain-Ort (entschieden, nicht offen)

Du hast gefragt: was bedeutet „Brain im Repo"? Karpathys Gist selbst ist *nur* eine Ordnerstruktur (`raw/` + `wiki/` + `CLAUDE.md`-Schema) — er sagt nicht, wo die Ordner liegen müssen. Implementierungen, die ich gesehen habe, splitten sich:

- **Solo-Notebook-Use-Cases** (Personal-Knowledge-Base, Lese-Notizen): eigener Obsidian-Vault, Brain ist „dein zweites Hirn".
- **Software-Projekte** (Brain pflegt Engineering-Wissen, das mit Code mitwächst): Brain *im* Repo, weil jede Code-Änderung idealerweise im selben Commit den Brain-Update mitbringt.

Chrono Lexicanum ist Fall 2. Brain lebt unter `brain/` im Repo. Vorteile, die das entscheiden:

1. **Atomare Commits.** „Pipeline gehärtet + Wiki-Eintrag dazu in einem Commit" → spätere Reviews sehen Code-Änderung und Wissens-Update zusammen.
2. **CLAUDE.md-Auto-Load.** Cowork und CC laden bei jedem Start die Top-Level-CLAUDE.md. Ein Pointer dort auf `brain/CLAUDE.md` zieht das Brain in den Standard-Lese-Pfad — keine separate Sync-Disziplin.
3. **Karpathy-Spirit, niedrige Friction.** Karpathy's Bedingung war eine Ordnerstruktur, kein Vault. Obsidian-Bedienbarkeit kann der externe Atlas decken; Brain wird via VS Code / IDE bearbeitet, ohnehin schon offen.
4. **Symmetrie zum Atlas-Schnitt.** Atlas ist *außerhalb* des Repos, Brain ist *innerhalb* — die physische Trennung spiegelt die domänen­logische Trennung.

Atlas bleibt wie geplant ein eigener Obsidian-Vault außerhalb des Repos. (Postgres → Markdown → Obsidian Graph-View ist *der* Use-Case dafür.)

### Atlas-Regen-Trigger (entschieden, nicht offen)

Manuell per `npm run atlas:regen`. Auto-Trigger nach 3d-Apply ist verlockend, aber:

- 3d-Apply gibt's noch nicht (Phase 3 vor Apply-Step pausiert).
- Atlas darf stale sein — Postgres ist Wahrheit.
- Lazy-Trigger heißt: keine Wartezeit beim Apply, keine Coupling, keine Race-Conditions zwischen Pipeline-Schreiben und Atlas-Lesen.

Wenn manueller Aufruf irgendwann zu Friction wird: Auto-Hook in einem späteren Brief nachrüsten. Heute: zu früh.

## Constraints

- **Brain ist klein, Atlas ist groß.** Brain darf insgesamt nicht über die Größenordnung „kann in 30 Sekunden überflogen werden" hinauswachsen. Wiki-Seiten >300 Zeilen sind ein Lint-Failure-Kandidat. Atlas hat keine Größenobergrenze.
- **`raw/` ist immutable.** Nichts unter `brain/raw/` wird vom LLM editiert. Falls eine raw-Quelle korrigiert werden muss (Tippfehler in einem alten Session-Report), passiert das per separat begründetem Cowork-Brief, nicht im Ingest-Lauf.
- **Atlas ist Read-only-Output.** Markdown-Dateien unter `chrono-atlas/` werden ausschließlich vom Regen-Skript geschrieben. Korrekturen an Buchdaten gehen in `scripts/seed-data/*.json` oder ein noch zu definierendes Override-File (Brief 050+, out of scope hier) — niemals direkt in den Atlas.
- **Postgres bleibt Single-Source-of-Truth für Buchdomäne.** Atlas spiegelt, nicht bestimmt. Wenn Postgres und Atlas auseinanderlaufen, ist Postgres recht und der Regen-Lauf hatte einen Bug.
- **Brain bleibt Single-Source-of-Truth für Engineering-Domäne.** Wenn `brain/wiki/project-state.md` und `ROADMAP.md` (Top-Level-thin-redirect) auseinanderlaufen, ist Brain recht. (Nach diesem Reset existiert ROADMAP.md auf Top-Level eh nur noch als Redirect.)
- **CLAUDE.md-Top-Level lädt das Brain mit.** Ein neuer Abschnitt „## Brain & Atlas" verpflichtet jede Cowork-/CC-Session zur Lektüre von `brain/CLAUDE.md` + `brain/wiki/project-state.md` + `brain/wiki/open-questions.md` *vor* der eigentlichen Arbeit.
- **Atlas ist nicht Teil des Repos.** Der Pfad `chrono-atlas/` (Sibling-Ordner zum Repo: `~/chrono-atlas/`) ist im README dokumentiert; nichts darin landet jemals in `git add`. Das Regen-Skript akzeptiert einen `ATLAS_PATH`-Parameter (env oder CLI-Flag) und legt den Vault dort an, falls er fehlt.
- **TypeScript/Node strict.** Regen-Skript ist TypeScript, läuft mit `tsx`, lebt unter `scripts/atlas-regen.ts`. Keine neuen Dependencies, falls vermeidbar (`drizzle`-Client + Node-fs reicht).
- **Versionspolitik.** Falls für Atlas-Regen eine Markdown-Builder-Lib gebraucht wird: CC entscheidet Lib + Version. Cowork pinnt nicht.
- **Wiki-Frontmatter.** *Jede* Datei unter `brain/wiki/**/*.md` (außer `log.md`, das hat eigene Append-Form) trägt YAML-Frontmatter mit mindestens: `title` (string), `type` (`overview | decision | workflow | concept | source-summary | reference`), `created` (YYYY-MM-DD), `updated` (YYYY-MM-DD), `sources` (Array von relativen Pfaden zu raw/-Files oder `sessions/...md` oder `src/**/*.ts`), `related` (Array von relativen Markdown-Links zu anderen Wiki-Seiten), `confidence` (`high | medium | low`). CC darf zusätzliche Felder ergänzen, falls ein Page-Type das braucht (z.B. `decision-date` auf Decision-Pages). Ohne Frontmatter ist eine Wiki-Seite Lint-Failure (auch wenn das Lint-Skript erst in einer Folge-Session entsteht — die *Konvention* gilt ab jetzt).
- **`raw/`-Frontmatter-Banner.** Files unter `brain/raw/historical/` tragen einen YAML-Banner: `snapshot-of` (relativer Pfad zur Original-Datei zum Zeitpunkt des Schnappschuss), `snapshot-date`, `snapshot-reason`, `canonical-now` (Pointer auf die Wiki-Seite, die diese Datei jetzt synthetisiert). Files unter `brain/raw/reviews/` tragen: `review-date`, `review-source` (z.B. `codex`, `gpt-5`, `external-author`), `review-target` (was wurde reviewt — Pfad oder Session-ID).

## Out of scope

- **Phase-3-Pipeline-Code.** Härtung (047), Modell-Wechsel, Vokabular-Erweiterung, weitere 3e-Batches, 3d-Apply — alles wartet bis nach 049.
- **DB-Migrationen.** Diese Session schreibt kein SQL.
- **App-Features.** Kein Timeline-, Map-, Ask-Code wird angefasst.
- **Atlas-Inhalts-Vollständigkeit.** Das Regen-Skript muss nicht jedes Buch perfekt rendern — Skeleton + ein Buch-Typ + ein Faction-Typ pluse Index reicht. Vollständige Renderung folgt in einem späteren Brief, sobald wir den Regen einmal benutzt haben und sehen, was fehlt.
- **Lint-Implementierung.** Diese Session definiert *was* Lint prüft (siehe `brain/wiki/workflows/lint.md`), das Skript dafür ist nächster Brief.
- **Migration der Sessions in den Brain-Ordner.** `sessions/` bleibt auf Top-Level. Brain referenziert es als raw-Quelle. Move-Operationen sind unnötiges Risiko.
- **`docs/` migrieren.** `docs/agents/COWORK.md`, `docs/agents/CLAUDE_CODE.md`, `docs/agents/SESSIONS.md`, `docs/data/2b-book-roster.md`, `docs/ui-backlog.md` bleiben wo sie sind. Brain referenziert sie als raw. (Eventueller Move ist späterer Brief.)
- **CC-Memory / Skills-Customization.** Nicht in dieser Session.

## Acceptance

Die Session ist fertig, wenn:

- [ ] **`brain/`-Skeleton existiert** mit folgender Struktur (Inhalte siehe „Notes" — `[seed]` heißt: erster Pass-Inhalt aus dem 049-Ingest, mit YAML-Frontmatter; `[stub]` heißt: Datei mit klarer Aufgabenbeschreibung im Body, leeres Inhalts-Skelett, Hinweis „Befüllt durch nächsten Ingest-Pass"):
  ```
  brain/
    CLAUDE.md                            [seed: Karpathy-Schema-Datei, was Brain ist + read-order]
    wiki/
      index.md                           [seed: Master-Catalog, jeder Ingest aktualisiert]
      log.md                             [seed: append-only Operation-Log; erster Eintrag = 2026-05-08 Reset]
      project-state.md                   [seed: ersetzt Starmorphs `overview.md`]
      open-questions.md                  [seed: Carry-over migriert]
      architecture.md                    [seed]
      roadmap.md                         [seed]
      onboarding.md                      [seed]
      glossary.md                        [seed]
      pipeline-state.md                  [seed]
      book-data-overview.md              [seed: high-level Zahlen, NICHT Atlas-Ersatz]
      decisions/
        no-goodreads.md                  [seed]
        why-drizzle-supabase.md          [seed]
        why-multi-source-merge.md        [seed]
        why-haiku-not-sonnet.md          [seed]
        why-bulk-backfill.md             [seed]
        plan-reshuffle-2026-05-02.md     [seed]
        karpathy-reset-2026-05-08.md     [seed: dieser Brief]
      workflows/
        cowork-session.md                [seed: aus docs/agents/COWORK.md synthetisiert]
        cc-session.md                    [seed: aus docs/agents/CLAUDE_CODE.md synthetisiert]
        sessions-format.md               [seed: aus docs/agents/SESSIONS.md synthetisiert]
        ingest.md                        [seed]
        query.md                         [seed]
        lint.md                          [seed]
        session-end.md                   [seed]
        atlas-regen.md                   [seed]
    raw/
      historical/
        2026-05-08-pre-reset/            [files: ARCHITECTURE.md, ROADMAP.md, ONBOARDING.md, README.md verschoben + Frontmatter-Banner]
      reviews/                           [empty dir mit README; künftige Codex/External Reviews landen hier]
        README.md                        [seed]
    outputs/                             [getrennt vom Wiki — generierte Artefakte, nicht LLM-gepflegt]
      lint/                              [empty dir mit README; Lint-Reports YYYY-MM-DD.md landen hier]
        README.md                        [seed]
  ```
  *Hinweis:* Kein `brain/INDEX.md` mehr (war in der ersten Brief-Version) — `wiki/index.md` ist Karpathy-/Starmorph-konform der einzige Master-Catalog. `brain/CLAUDE.md` referenziert `wiki/index.md` als ersten Read-Stop.

- [ ] **Top-Level-Files konsolidiert.** ARCHITECTURE.md, ROADMAP.md, ONBOARDING.md im Top-Level werden zu Ein-Zeilen-Redirect-Files (Format siehe „Notes"). Originale liegen unter `brain/raw/historical/2026-05-08-pre-reset/`. README.md wird auf einen schlanken Stand gebracht (Pitch + Status-Badge + Brain-Pointer + Live-URL); der ausgehöhlte Vor-Reset-Stand landet ebenfalls im Historical-Ordner als `README.md`. CLAUDE.md (Top-Level) bekommt einen neuen Abschnitt „## Brain & Atlas" *am Anfang* der Datei (vor „What this project is"), der jede Session zur Brain-Lektüre verpflichtet.

- [ ] **Atlas-Vault-Skeleton + Regen-Skript.** `scripts/atlas-regen.ts` existiert, ist mit `npm run atlas:regen` ausführbar, akzeptiert `--out=<path>` (default: `~/chrono-atlas/` bzw. äquivalenter Cross-Platform-Default; CC entscheidet die genaue Pfad-Resolution-Strategie). Skript-Verhalten in dieser Session minimal: legt den Vault-Ordner an, schreibt eine `INDEX.md` mit Generated-Zeitstempel + Postgres-Schema-Revision, einen `books/`-Ordner mit *einem* generierten `books/{slug}.md` als Proof-of-Render (Buch-Auswahl: erstes Buch alphabetisch via `SELECT slug FROM works ORDER BY slug LIMIT 1`), einen `factions/`-Ordner mit *einer* generierten `factions/{slug}.md`. Wikilink-Format: `[[books/eisenhorn-xenos|Eisenhorn: Xenos]]`. Volle Renderung (alle Bücher, alle Factions, alle anderen Entitäten, Quality-Views) ist eigener späterer Brief.

- [ ] **`sessions/README.md` umgebaut.** Die „Carry-over"-Sektion und die „Active threads"-Tabelle bleiben (sie sind Teil des Session-Workflows, nicht Brain-Wissen). Die „Infrastructure log"-Sektion wird stark gekürzt: nur die letzten 5 Einträge bleiben, der ältere Schwanz wandert nach `brain/raw/historical/sessions-readme-log-pre-2026-05-08.md` als immutable Schnappschuss. Cowork's Disziplin nach Reset: Infra-Log-Einträge wandern beim Schreiben in entsprechende `brain/wiki/decisions/` oder `brain/wiki/project-state.md`-Edits, statt sich in `sessions/README.md` zu sammeln.

- [ ] **Erster Ingest-Pass abgeschlossen.** Die `[seed]`-Wiki-Seiten haben tatsächlichen Inhalt — synthetisiert aus den raw-Quellen, die unten unter „Erste Ingest-Reihenfolge" stehen. Jede Wiki-Seite hat: einen Titel, einen Zwei-Satz-„Wofür ist diese Seite", den eigentlichen Inhalt, eine „Quellen"-Sektion mit Links zu raw-Files (Sessions / Code / Top-Level-Doku-Schnappschuss). Glossary-Einträge haben ein-bis-drei-Sätzen-Definition + Beispiel + Querverweis (Wikilink-Format). Decision-Pages haben das Format: Kontext / Optionen / Entscheidung / Datum / Querverweis-Sessions.

- [ ] **`brain/CLAUDE.md` ist die Schema-Datei.** Inhalt: Was ist Brain, was ist Atlas, was ist `raw/`, was ist `wiki/`, was ist `outputs/`, wie wird Brain gepflegt (Ingest/Query/Lint), was ist *kein* Brain-Inhalt (= Buchdaten, Code, Pipeline-Output → DB/Atlas). Frontmatter-Konvention dokumentiert (mit Type-Werte-Liste). Karpathy-Pattern explizit referenziert (Link auf den Original-Gist), Compiler-Analogie als mentale Klammer (`raw/` = source, LLM = compiler, `wiki/` = executable, `outputs/lint/` = test reports, Query = runtime). Read-Order auf Session-Start: (1) diese Datei, (2) `wiki/index.md`, (3) `wiki/project-state.md`, (4) `wiki/open-questions.md`, (5) was-auch-immer-für-die-Aufgabe-relevant-ist.

- [ ] **`brain/wiki/index.md` ist der Master-Catalog.** Strukturierte Liste aller Wiki-Seiten gruppiert nach Type (Overview, Decisions, Workflows, Concepts, References), jeweils mit relativem Link, Ein-Zeilen-Beschreibung, `updated`-Datum (aus Frontmatter gezogen). Wird bei jedem Ingest aktualisiert. Wird beim Query-Read zuerst geladen — verhindert Brute-Force-Lade aller Wiki-Files in den Kontext.

- [ ] **`brain/wiki/log.md` ist append-only.** Erster Eintrag (vom 049-Reset selbst): `## 2026-05-08 · Karpathy-Reset Initial Ingest` mit Aufzählung welche raw-Quellen ingestiert wurden, welche Wiki-Seiten dabei erzeugt wurden, welche Top-Level-Files migriert wurden. Format ist eine Sektion pro Operation, jeweils mit Datum, Op-Typ (`Ingest | Update | Lint | Move | Decision`), Liste affected files. CC darf das Format frei wählen, solange es chronologisch und append-only ist.

- [ ] **`brain/wiki/workflows/session-end.md` ist die einzige Quelle für die Session-End-Routine.** Inhalt definiert das Cowork-Verhalten *nach* Lesen eines CC-Reports: (1) Report lesen, (2) `project-state.md` updaten falls Stand verschoben, (3) `open-questions.md` pflegen (neue Frage rein, gelöste raus), (4) ggf. neue oder geänderte `decisions/*.md` schreiben, (5) ggf. `pipeline-state.md` / `architecture.md` aktualisieren falls System-Änderung, (6) bei externer Review (Codex et al.): das Original-File nach `brain/raw/reviews/<date>-<source>.md` legen + Lint-Einträge daraus extrahieren. Der Workflow ersetzt die heutige „infrastructure log"-Pflege.

- [ ] **`brain/wiki/workflows/atlas-regen.md`** beschreibt den manuellen Atlas-Regen: wann lohnt's (vor visueller Inspektion, vor Reddit-Launch-Screenshots, vor Phase-Boundary), wie man es ausführt, wie man Vault-Pfad konfiguriert, was bei Diskrepanz zur DB tun (Antwort: Postgres ist Wahrheit, Bug im Skript fixen, nicht Atlas händisch).

- [ ] **`brain/wiki/workflows/lint.md`** beschreibt was Lint prüft (ohne dass es schon implementiert ist): stale claims (Wiki-Seite verweist auf `Phase 2 offen` — stimmt das noch?), broken interne Links, orphan pages (>0 Inbound-Links erwartet außer für `index.md` selbst), Wiki-Pages ohne Frontmatter oder mit fehlenden Pflichtfeldern, Wiki-Pages mit `confidence: low` älter als 30 Tage (Reminder zur Re-Ingestion), raw-Files unter `historical/` ohne `snapshot-*`-Frontmatter, Decision-Pages ohne `decision-date`. Output-Format: `brain/outputs/lint/YYYY-MM-DD.md` mit Sektionen pro Befund-Kategorie.

- [ ] **Cosmetic stale-reference-Fixes** aus 048-impl's „Other stale references found while reviewing"-Sektion mitnehmen, soweit sie *Comments / Documentation-Strings* sind und keine Versions-Pin-Entscheidung erfordern: `CLAUDE.md:33` + `:99` (Stack-Tabelle Ingestion-Row + Repo-Layout-Comment „Phase 4: Python crawlers" → Phase 3 + TypeScript), `scripts/seed-data/README.md:101` („Once Phase 4 (the ingestion pipeline) is live" → Phase 3 ist live), `next.config.ts:7-11` (Goodreads-Image-Domain auskommentiert lassen, aber Comment-Label um „API stilllegung 2020"-Hinweis ergänzen), `src/app/page.tsx:15` Code-Comment „Phase 4 ingestion" → Phase 3. *Nicht* in 049 fixen: `.env.example:43+56-57` und `ROADMAP.md:90` mit Sonnet-Pins — die hängen an der nächsten Modell-Entscheidung und gehören in deren Brief. Wenn CC findet dass die obige Comment-Liste den 049-Scope sprengt, einen Cut machen und die Reste ins `brain/wiki/open-questions.md` als Carry-over schieben (mit klarem Owner und Folge-Brief-Pointer).

- [ ] **Build & Lint grün.** `npm run lint` und `tsc --noEmit` laufen sauber. Keine neue ESLint-Disable-Zeile. Falls `scripts/atlas-regen.ts` einen tsconfig-Pfad-Eintrag braucht (etwa `tsconfig.scripts.json`), CC fügt ihn hinzu und dokumentiert das im Report.

## Open questions

- **Wikilink-Konvention im Brain.** GitHub rendert Markdown-Standard-Links sauber, Obsidian rendert `[[Wikilinks]]` sauber. Brain wird primär in IDE und auf GitHub gelesen. Empfehlung: relative Markdown-Links innerhalb des Brain (`[Project state](./project-state.md)`); Wikilinks reserviert für den Atlas, der primär in Obsidian gelesen wird. CC: bestätigen oder widersprechen mit Begründung.

- **Glossar-Granularität.** Wieviele Begriffe wandern in `brain/wiki/glossary.md` als ein Eintrag, wieviele bekommen eigene Seiten? Vorschlag: alles unter ~3 Sätzen Definition bleibt im Glossar; alles, das eigene Architektur-Begründung trägt (z.B. „M-Skala", „Source-Priority", „Manual-Protection-Comparator"), bekommt eigene Seite unter `brain/wiki/concepts/<slug>.md`. Dieser Brief reserviert dafür *keine* eigenen Seiten — CC entscheidet beim Ingest-Pass, ob Glossar-Eintrag oder eigene Concept-Seite, und dokumentiert den Cut im Report.

- **`brain/raw/sessions/` als Pointer oder als Kopie?** Die Sessions liegen in `sessions/` (Top-Level). Brain referenziert sie als raw-Quelle. Variante A: Brain hat keinen `raw/sessions/`-Ordner, die Wiki-Seiten linken direkt zu `../sessions/<id>.md`. Variante B: `brain/raw/sessions/` ist Symlink (POSIX) bzw. Hardlink/Junction (Windows). Empfehlung: Variante A — keine Symlinks im Repo, weil Cross-Platform-Bruchstelle. CC: bestätigen oder Alternative vorschlagen.

- **CLAUDE.md-Top-Level vs `brain/CLAUDE.md`.** Heute lädt Cowork und CC die Top-Level-`CLAUDE.md` automatisch. Karpathys Pattern erwartet eine Schema-Datei *im Wiki-Root* (also `brain/CLAUDE.md`). Vorschlag: Top-Level-CLAUDE.md bleibt der Auto-Load-Anker (Stack-Konventionen + neuer Abschnitt „Brain & Atlas"); `brain/CLAUDE.md` ist *zusätzlich* Karpathy-konform und wird via Top-Level-Pointer mitgeladen. CC: bestätigen oder einen Single-File-Ansatz vorschlagen, falls die Doppelung schmerzt.

- **Atlas-Cross-Plattform-Default-Pfad.** Default `~/chrono-atlas/` ist POSIX-Konvention; auf Windows lebt das unter `C:\Users\<name>\chrono-atlas\`. CC entscheidet, ob `os.homedir()` reicht oder ob man auf das Repo-Sibling-Pattern zurückfällt (`../chrono-atlas/`). Im Report begründen, was gewählt wurde und warum.

- **Erste Ingest-Pass-Größe.** Diese Brief listet 7 Decision-Pages + 8 Workflow-Pages + 8 Top-Wiki-Pages (inkl. `index.md` und `log.md`) + Glossary = ~23 Seiten. Ist das eine vernünftige Single-Session-Größe oder sollte ein zweiter Brief 049b den zweiten Pass machen? CC: wenn das Ingest-Volumen zu groß wird (Token-Budget, Kontext-Größe), einen logischen Cut machen und im Report dokumentieren, was als Stub bleibt und einen Folge-Brief begründen.

- **CC-Skills für Wiki-Operationen — jetzt oder später?** Starmorph schlägt `/wiki-ingest` und `/wiki-lint` als Claude-Code-Skills vor (in `.claude/skills/` o.ä.). Vorteile: standardisierte Operationen, gut für wiederkehrende Cowork-Session-End-Routine. Nachteile: einmaliger Skill-Bau-Aufwand, und wir sind ein Solo-Projekt — der Workflow-Markdown unter `brain/wiki/workflows/` reicht möglicherweise. **Empfehlung: nicht in dieser Session.** Sobald wir den Workflow 2–3 Sessions lang manuell gefahren haben, sehen wir wo die Friction sitzt und können einen Skill-Brief gezielt aufsetzen. CC: bestätigen oder Skill-Stubs schon in 049 einplanen, falls das Mehrwert bringt.

- **QMD / Dataview als Future-Search-Layer.** Starmorph (mit Verweis auf Karpathys Empfehlung) erwähnt [QMD](https://github.com/tobi/qmd) als BM25/Vector/LLM-rerank-Search über Markdown-Files, mit MCP-Server. Dataview als Obsidian-Plugin für strukturierte Cross-Page-Queries. **Beide nicht in 049.** Werden relevant, sobald (a) das Brain auf >50 Wiki-Seiten gewachsen ist, oder (b) der Atlas in Obsidian benutzt wird und Cross-Buch-Queries lohnen. CC: keine Aktion, nur als „distant"-Notiz im `brain/wiki/workflows/query.md` festhalten, dass diese Tools existieren.

## Notes

### Karpathy-Original und unsere Instanziierung

Original-Gist: <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>. Drei-Schichten-Architektur (`raw/` immutable, `wiki/` LLM-generiert, Schema-Datei) plus drei Operationen (Ingest, Query, Lint). Konkrete Konventionen (Frontmatter-Schema, `index.md` + `log.md` im Wiki, `outputs/` getrennt) folgen Starmorphs Implementations-Guide: <https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide>. Wir folgen dem Pattern, mit zwei projekt-spezifischen Anpassungen für Chrono Lexicanum:

1. **Domain-Split.** Engineering-Wissen ins `brain/`, Buch-Domänen-Wissen in den externen `chrono-atlas/`. Karpathy/Starmorph hatten einen einzigen Wiki-Vault. Wir splitten, weil unsere Buch-Domäne den Token-Vorteil sonst auffrisst.
2. **Atlas ist generated-not-curated.** Karpathys Wiki ist 100% LLM-Synthese gegen `raw/`. Atlas ist 0% LLM-Synthese; er ist mechanische Spiegelung von Postgres. Das ist *kein* Karpathy-Wiki — Atlas ist eine *Visualisierungsschicht* über strukturierten Daten. Brain *ist* das Karpathy-Wiki.

### Compiler-Analogie (für die Schema-Datei)

Karpathy frame-t das System als Compiler — nimm das in `brain/CLAUDE.md` mit auf, weil es die Operationen mental sortiert:

- `raw/` = source code (immutable inputs)
- LLM (Cowork / CC) = compiler (liest source, produziert artefakt)
- `wiki/` = executable (das was du benutzt; hat eine Form, ist gegen source verifiziert)
- `outputs/lint/` = test reports (sagen dir was kaputt ist, ohne Source/Executable selbst zu sein)
- Query = runtime (läuft das executable, gibt Antwort)

Diese Analogie ist die einfachste Erklärung, warum `outputs/` *nicht* unter `wiki/` lebt: ein Test-Report ist kein Teil des executable.

### Erste Ingest-Reihenfolge (für CC's Ausführung)

Reihenfolge ist nicht beliebig — frühe Pages dienen späteren als Referenz. Die Wiki-Seite muss synthetisieren (1–4 Absätze pro Section, Wikilinks/Markdown-Links zu raw-Quellen), nicht raw-File kopieren. Stub-Hinweis: wenn eine Quelle nicht ausreicht, lieber „TODO: Sektion X — Quelle fehlt, nächster Ingest" stehenlassen, als spekulieren.

1. **`brain/CLAUDE.md`** — Schema. Quellen: Karpathy-Gist + dieser Brief 049 + Top-Level-CLAUDE.md (wegen Stack-Konventionen-Verweis).
2. **`brain/INDEX.md`** — Pointer-Karte. Quellen: das Skeleton selbst.
3. **`brain/wiki/glossary.md`** — Quellen: `src/db/schema.ts`, `scripts/seed-data/README.md`, alle bisherigen Sessions (besonders 020/022/024/035/037/039 für Schema- und Pipeline-Begriffe). Mindestmenge: M-Skala, Source-Priority, Manual-Protection, source_kind, confidence, junctionsLocked, work_facets, primaryEra, secondary_era_ids, llm_flags, llm_cache, llmCostSummary, fieldOrigins, discovered, discoveryDuplicates, fieldConflict, batched-3e, dry-run, apply-step, override, pipeline-Engine, Aux-Source. Wikilink-fähig.
4. **`brain/wiki/architecture.md`** — Quellen: `ARCHITECTURE.md` (vor Move), `src/db/schema.ts`, `src/lib/ingestion/`. Inhalt: System-Map (App + DB + Pipeline + Atlas), Datenfluss, wo welche Wahrheit liegt.
5. **`brain/wiki/roadmap.md`** — Quellen: `ROADMAP.md` (vor Move). Aktueller Phasen-Stand, Plan-Reshuffle-Notiz, Ideas-Backlog.
6. **`brain/wiki/onboarding.md`** — Quellen: `ONBOARDING.md` (vor Move). Erste-Schritte für einen neuen Mitarbeiter (oder ein neues LLM-Subagent).
7. **`brain/wiki/pipeline-state.md`** — Quellen: `src/lib/ingestion/`, Reports 035, 037, 039, 042, 043, 044, 045, **047**, alle Diff-Files unter `ingest/.last-run/` (inkl. `backfill-20260508-2101.diff.json` als jüngstem). Inhalt: aktuelle Pipeline-Architektur (post-047-Stand: 5 Hebel A–E gezogen, Migration 0007 committed-aber-nicht-applied), jede Source mit Status (inkl. Lexicanum-Junction-Coverage-Befund: trägt zu Title/Year/ISBN/Y bei, NICHT zu factionNames/locationNames/characterNames), neueste Cost-Zahlen ($0.114/Buch in 047 vs. $0.118/Buch in 044), neueste Flag-Verteilung, was als nächstes auf Pipeline-Ebene ansteht (Anthologie-Re-Test für Hebel E, Lexicanum-Body-Lore-Pass oder ehrliche FIELD_PRIORITY-Reduktion, Modell-Entscheidung, Vokabular-Erweiterung, dann 3d-Apply).
8. **`brain/wiki/book-data-overview.md`** — Quellen: `scripts/seed-data/books.json`, Diff-Summaries, `docs/data/2b-book-roster.md`. Inhalt: high-level Zahlen (wieviele Bücher in DB, wieviele Manuals, wieviele 3e-Batches durch, neueste Cost), *keine* per-Buch-Details (das ist Atlas-Job). Diese Seite ist explizit *nicht* Atlas-Ersatz — sie beantwortet „in welchem Datenstand sind wir grob".
9. **`brain/wiki/project-state.md`** — Quellen: alle anderen Wiki-Seiten dieses Pass. Eine knappe „Where are we now"-Seite (≤2 Bildschirmlängen), die für jede neue Session der Standard-Einstieg wird. Phase, was läuft, was offen ist (Pointer auf `open-questions.md`), nächster Brief-Kandidat.
10. **`brain/wiki/open-questions.md`** — Quellen: `sessions/README.md`-Carry-over-Sektion + zwei neue Items aus 047-impl-Befunden (siehe Context-Sektion oben): (a) Anthologie-Re-Test für Hebel E unausstehend; (b) Lexicanum trägt keine Junction-Daten — Body-Lore-Pass oder FIELD_PRIORITY-Reduktion. Migrations-Logik: jeder Carry-over-Punkt wird zu einem nummerierten Item mit klarem Owner („Cowork beantwortet", „CC implementiert", „beide"), Querverweis-Sessions, und einem „Zu-Folge-Brief"-Pointer falls schon klar. Nach Migration: `sessions/README.md`-Carry-over-Sektion behält das Schema, aber alle Items wandern hierher; sie wird leer mit Pointer-Hinweis nach `brain/wiki/open-questions.md`.
11. **`brain/wiki/decisions/` (alle 7 Seiten)** — Quellen pro Datei:
    - `no-goodreads.md` → Sessions 031, 032, README-Phase-3-Strategie-Schwenk-Eintrag
    - `why-drizzle-supabase.md` → Bootstrap-Brief 001, frühe Phase-1-Sessions
    - `why-multi-source-merge.md` → Sessions 033 (zurückgezogen, Retraction lesen!), 034, 035
    - `why-haiku-not-sonnet.md` → Sessions 038, 039, 040, 042
    - `why-bulk-backfill.md` → Sessions 031, 032, 034, README-Eintrag 2026-05-02
    - `plan-reshuffle-2026-05-02.md` → ROADMAP.md-„Plan-Reshuffle"-Sektion, README-Eintrag selbiges Datum
    - `karpathy-reset-2026-05-08.md` → dieser Brief 049 selbst (kurze Zusammenfassung der Entscheidung Brain+Atlas)
12. **`brain/wiki/workflows/` (alle 8 Seiten)** — Quellen pro Datei:
    - `cowork-session.md` → `docs/agents/COWORK.md` (raw bleibt erhalten; Wiki-Seite ist die *aktuelle* Synthese)
    - `cc-session.md` → `docs/agents/CLAUDE_CODE.md`
    - `sessions-format.md` → `docs/agents/SESSIONS.md`
    - `ingest.md` → dieser Brief + Karpathy-Gist
    - `query.md` → dieser Brief + Karpathy-Gist
    - `lint.md` → dieser Brief + Karpathy-Gist
    - `session-end.md` → dieser Brief
    - `atlas-regen.md` → dieser Brief
13. **`brain/raw/historical/2026-05-08-pre-reset/`** — Move-Operationen: `ARCHITECTURE.md`, `ROADMAP.md`, `ONBOARDING.md`, plus eine Kopie des aktuellen `README.md` (vor dem Slim-Down). Jede Datei bekommt einen YAML-Frontmatter-Banner wie `--- snapshot-of: README.md / snapshot-date: 2026-05-08 / snapshot-reason: pre-Karpathy-reset / canonical-now: brain/wiki/onboarding.md ---` damit Lint später erkennen kann „das ist historisch, nicht stale".
14. **Top-Level-Redirects.** ARCHITECTURE.md / ROADMAP.md / ONBOARDING.md im Top-Level werden zu Ein-Zeilen-Files (siehe Format unten).
15. **Top-Level-README.md** wird neu geschrieben (nicht nur ge-redirected): externe Leser landen dort, sie brauchen einen echten Pitch.
16. **Top-Level-CLAUDE.md** bekommt den neuen Abschnitt „## Brain & Atlas" am Anfang.

Reihenfolge ist *Empfehlung* — CC darf neu sortieren, falls eine Synthese eine Vorgänger-Seite zwingend braucht, die später käme. Im Report dokumentieren.

### Format-Skizzen

#### Top-Level-Redirect (illustrativ)

```markdown
> Diese Datei ist nach dem Karpathy-Reset 2026-05-08 nicht mehr Single-Source-of-Truth.
> Aktuelle, gepflegte Version: [`brain/wiki/architecture.md`](./brain/wiki/architecture.md)
> Historischer Schnappschuss vor dem Reset: [`brain/raw/historical/2026-05-08-pre-reset/ARCHITECTURE.md`](./brain/raw/historical/2026-05-08-pre-reset/ARCHITECTURE.md)
```

CC darf den Wortlaut frei gestalten, solange beide Pointer drin sind.

#### Wiki-Page-Frontmatter (illustrativ — exakte Felder verbindlich, Form frei)

```yaml
---
title: Why Drizzle + Supabase
type: decision
created: 2026-04-28
updated: 2026-05-08
sources:
  - ../../../sessions/archive/2026-04/2026-04-28-001-arch-bootstrap.md
  - ../../../src/db/schema.ts
related:
  - ./why-bulk-backfill.md
  - ../architecture.md
confidence: high
decision-date: 2026-04-28
---
```

#### Decision-Page (illustrativ, freie Gestaltung)

```markdown
---
title: Why Drizzle + Supabase
type: decision
created: 2026-04-28
updated: 2026-05-08
sources: [...]
related: [...]
confidence: high
decision-date: 2026-04-28
---

# Why Drizzle + Supabase

**Status:** active · **Decided:** 2026-04-28 · **Sessions:** [001](../../../sessions/archive/2026-04/2026-04-28-001-arch-bootstrap.md), [...]

## Context
Was war das Problem zum Zeitpunkt der Entscheidung.

## Options considered
- A: Just JSON files
- B: Supabase + Drizzle ← gewählt
- C: ...

## Decision
Was wir gewählt haben.

## Why
Trade-offs in Stichpunkten.

## When this decision should be revisited
Wenn ... oder wenn ...
```

CC entscheidet die genaue Form. Wichtig nur: Datum + Querverweis + Optionen + Entscheidung + Revisit-Trigger.

#### `brain/CLAUDE.md` (Schema-Datei) — illustrative Struktur

```markdown
# Brain Schema (Karpathy-style LLM Wiki)

This folder is the project's engineering memory, structured per Karpathy's LLM Wiki pattern.

## Layout
- `wiki/` — synthesized pages, LLM-maintained, the thing you READ
- `raw/` — immutable sources, never edited by LLM
- `INDEX.md` — pointer map

## Read order on session start
1. This file (CLAUDE.md)
2. INDEX.md
3. wiki/project-state.md
4. wiki/open-questions.md
5. Whatever is relevant to today's work

## Three operations
- Ingest: ...
- Query: ...
- Lint: ...

## What does NOT live here
- Book domain data → Postgres + chrono-atlas (external Obsidian vault)
- App code → src/
- Pipeline code → src/lib/ingestion/
- Session logs in raw form → sessions/ (top-level)
```

CC schreibt das in seinen eigenen Worten, mit Wikilinks/Markdown-Links auf die raw-Quellen, denen er folgt.

### Obsidian-Setup (Phil-Task, läuft parallel zur CC-Session — *nicht* im Acceptance-Bereich)

Obsidian ist Reader/Editor für den Atlas, nicht Voraussetzung dafür dass der Atlas existiert. CC produziert den Vault-Inhalt; Obsidian-Installation und -Konfiguration sind Phil-Side-Aufgaben, weil CC keinen Zugriff aufs OS außerhalb des Repo-Ordners hat. Reihenfolge ist egal — du kannst Obsidian vor, während oder nach der CC-Session aufsetzen.

1. **Obsidian installieren** (kostenlos, <https://obsidian.md/download>). Windows-Installer, Standard-Setup.
2. **Atlas-Vault öffnen.** In Obsidian: „Open folder as vault" → den `chrono-atlas/`-Ordner wählen, den `npm run atlas:regen` angelegt hat (Default: `~/chrono-atlas/` bzw. `C:\Users\<name>\chrono-atlas\`, wird vom Regen-Skript bestätigt).
3. **Optional: Plugins.** Dataview (für Cross-Page-Queries), Graph-View (built-in, einfach öffnen). Beides nicht-kritisch — der Atlas funktioniert ohne. Wenn du QMD später ausprobieren willst (Karpathys-empfohlene Markdown-Search), das ist eine eigenständige Installation, gehört aber nicht in 049.
4. **Brain in Obsidian — *nicht* empfohlen.** `brain/` ist primär IDE-/GitHub-Lesestoff. Wenn du Brain *zusätzlich* in Obsidian öffnen willst (z.B. um den Graph der Decision-Querverweise zu sehen), ist das technisch möglich (`brain/` als zweiter Vault), aber zwei-Vaults-für-zwei-Domänen ist Overhead, der den Domain-Split-Vorteil aushöhlt. Empfehlung: Brain ausschließlich in der IDE lesen.

CC dokumentiert diese Setup-Schritte zusätzlich in `brain/wiki/onboarding.md`, damit ein neuer Mitarbeiter (oder du in 6 Monaten) die Abfolge nicht aus diesem Brief rekonstruieren muss.

### Cowork-Vorarbeit (passiert *vor* Brief-Handover, in dieser Session)

Vor `git push` dieses Briefs erledigt Cowork (in diesem Reload nachgeholt, weil die ursprüngliche 049-Fassung noch von einer Pre-047/048-Welt ausging):

1. Pause-Banner in `sessions/2026-05-08-047-arch-pipeline-hardening.md` und `2026-05-08-048-arch-doc-refresh.md` zurücknehmen (✓ erledigt).
2. Frontmatter-Status auf `implemented` setzen, 047 trägt commit `4da6184` ein (✓ erledigt).
3. `sessions/README.md` aktualisieren: 049 als active thread aufnehmen, 047/048-arch zu `implemented` setzen, 047-impl + 048-impl als active threads mit Status `complete` ergänzen, Infra-Log-Eintrag fürs 047/048-Bundle, Carry-over-Section minimal pflegen.

Damit ist beim CC-Pull die Welt konsistent.

### Nach Merge dieser Session

- 047 und 048 sind durch — kein Re-Evaluation-Bedarf mehr. Nächster Pipeline-Brief ist *nicht* 047, sondern (a) ein Anthologie-Re-Test für Hebel E (Tales of Heresy / Mark of Calth / Sons of the Emperor) und (b) der Lexicanum-Body-Lore-Pass (oder, alternativer Cut, FIELD_PRIORITY ehrlich auf `["llm"]` reduzieren). Beide nicht in 049.
- Neuer Default für Cowork: jede Session beginnt mit `brain/CLAUDE.md` → `brain/wiki/index.md` → `brain/wiki/project-state.md` → `brain/wiki/open-questions.md`. Dann erst zur Aufgabe.
- Carry-over-Section in `sessions/README.md` schrumpft auf einen Eintrag: „Items siehe [`brain/wiki/open-questions.md`](../brain/wiki/open-questions.md)".
- Erste echte Belastungsprobe für den Workflow: der erste Cowork-Brief nach 049 zieht den Anthologie-Re-Test oder die Modell-Entscheidung — Cowork muss dann das Session-End-Routine-Pattern (Ingest des CC-Reports ins Brain) sauber durchziehen. Wenn der erste Lauf schmerzt, ist Brief 051 der Workflow-Tweak.
