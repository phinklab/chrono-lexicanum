---
session: 2026-05-04-041
role: architect
date: 2026-05-04
status: implemented
slug: ingestion-dashboard
parent: null
links:
  - 2026-05-03-035
  - 2026-05-03-037
  - 2026-05-03-039
  - 2026-05-04-040
  - 2026-05-04-043
commits: []
---

# Phase 3.5 — Ingestion-Dashboard (read-only Diff-Inspector)

## Goal

Eine öffentliche Route `/ingest` bauen, die alle bisher und zukünftig committed Diff-Files aus `ingest/.last-run/*.diff.json` chronologisch (neuester zuerst) als Summary-Cards rendert, mit Klick-zu-Detail-Drill-down auf per-Buch-Ebene. Read-only — keine Apply-Trigger, keine Mutations, keine DB-Schreib-Ops. Datenquelle ist ausschließlich Filesystem (committed JSON), nicht DB. Updates werden sichtbar nach `git push` + Vercel-Deploy.

Der Dashboard ist Operator-Tooling für den batched 3e Voll-Lauf (Philipp will Sessions à 50–100 Bücher machen statt einem 38-Stunden-Übernachtlauf, und nach jeder Session den Diff inspizieren ohne raw JSON aufmachen zu müssen). Sekundär ist es ein nettes „transparency"-Feature für den Reddit-Launch — Besucher sehen was wann von wo geholt wurde.

## Design freedom — read before everything else

Das gesamte visuelle Vokabular des Dashboards gehört dir. Ich beschreibe nur das *Verhalten* und die *Outcomes*; jede ästhetische Entscheidung ist deine:

- **Layout-Form** für die Run-Liste — Cards (gestapelt), Table (dichter), List-with-sidebar, Magazine-Style — was zur restlichen Site-Identität passt und 4 → 50 Einträge gut aushält.
- **Color-Coding** für die Entry-Kategorien (added / updated / skipped_manual / skipped_unchanged / field_conflicts / errors / llm_flags). Ob du Pills, Badges, Bar-Chart-Mini-Visualisierung, oder farbcodierte Counter-Cells nutzt — frei. Die Token-Counter (`totalTokensIn`, `totalWebSearches`, `estUsdCost`) brauchen ein eigenes Farb-Pattern wenn du sie hervorheben willst.
- **Typography** — Mono für die Counter und IDs vs Sans für Prosa, oder durchgängig eine Schrift, oder Mischung; alles deine Entscheidung. Die Wikipedia-Titel der Bücher sind Buchtitel und sollten als solche aussehen (Italics? Specific weight?).
- **Drill-down-Mechanik** — Klick auf eine Run-Card öffnet eine Detail-View. Ob das ein Modal, ein Inline-Expand, ein Slide-over-Panel, oder eine eigene Route `/ingest/[runId]` ist: völlig frei. Wenn du Routing wählst, wähle das Routing-Pattern selbst (Slug aus Filename, kebab-case-runId aus Timestamp, etc.).
- **Per-Buch-Detail-Form** — wie ein einzelnes added/updated/skipped_manual-Entry visualisiert wird (Source-by-Source-Daten, Field-Origins, Hardcover-Audit-Tags, LLM-Synopse, Facet-IDs, Discovered-Links, Plausibility-Flags). Das sind 6–8 Daten-Sektionen pro Buch — wie die strukturiert sind (Tabs, Accordion, dichte Tabelle, Side-by-Side) ist deine Entscheidung. **Wichtig nur:** alle Felder die im DiffFile-Type stehen, müssen für ein Buch sichtbar oder klick-aufrufbar sein — das ist der Wert des Dashboards.
- **Animations + Micro-Interactions** — Hover-States, Transitions, Stagger beim Mount, Expand/Collapse-Easing. Frei. Empfehlung: zurückhaltend (Operator-Tooling), aber wenn du ein paar gute Touches einbauen willst, gerne — `prefers-reduced-motion` respektieren wie immer.
- **Empty-State + Loading + Error-Copy** — was steht da wenn keine Diffs existieren, was steht da bei einem korrupten JSON, wie heißt der Header der Seite, was sind die Sektion-Titel. Voice: technisch-präzise (das ist Operator-Tooling), aber der Site-Voice darf durchscheinen. „Ingestion-Läufe", „Diff", „Plausibilitäts-Befunde" sind die kanonischen Wörter aus der Pipeline-Doku — frei nutzbar.
- **Treatment der Cost-Daten** — `llmCostSummary` ist eine sensitive UX-Stelle. Das ist *real money spent*; manche User-Personas wollen das prominent sehen, andere finden es hässlich. Deine Wahl, ob das ein dezenter Footer-Text ist oder ein bewusst hervorgehobener Datenpunkt.
- **Site-Identity-Integration** — `globals.css` + die existierenden Routes (`/`, `/timeline`, `/map`, `/ask`, `/buch/[slug]` etc.) zeigen das visuelle Vokabular der Seite (CSS-Vars, Schriften, Farb-Palette, Spacing-Skala, gothic-imperial-Anklänge). Der Dashboard sollte sich anfühlen als gehöre er zur Site, nicht als wäre er ein generischer Admin-Bolt-on. Wie weit du da gehst — same-feel vs explicit-tooling-feel — Trade-off ist deins.

Was du explizit **nicht** in einem zweiten Brief klären musst: alle obigen Knobs. Treff sie und im Report kurz erklären (1–2 Sätze pro substantielle Entscheidung — nicht jeder Pixel-Wert, sondern die Geste).

## Context

- **Was 035/037/039 produziert haben.** Vier reale Diff-Files liegen in `ingest/.last-run/` committed: `backfill-20260503-1115.diff.json` (3a Skeleton-Test, 5 Bücher), `backfill-20260503-1328.diff.json` (3b Aux-Sources-Test, 10 Bücher), `backfill-20260503-2037.diff.json` (3c Sonnet, 20 Bücher), `backfill-20260503-2130.diff.json` (3c Haiku, 20 Bücher). Brief 040 wird einen fünften produzieren (Re-Test auf Bücher 21–40 mit gehärtetem Haiku-Setup). Phase 3e wird 8–16 weitere produzieren (50–100 Bücher pro Batch über mehrere Wochen).
- **Diff-File-Form.** Strukturiert via `DiffFile`-Interface in `src/lib/ingestion/types.ts:356`. Die wichtigen Top-Level-Felder: `ranAt` (ISO-Timestamp), `discoverySource`, `discoveryPages`, `activeSources` (Welche Crawler aktiv waren), `discovered` (roster size), `added` (AddedEntry[]), `updated` (UpdatedEntry[]), `skipped_manual`, `skipped_unchanged`, `field_conflicts`, `errors`, optional `discoveryDuplicates`, optional `llmModel`/`llmPromptVersion`/`llm_flags`/`llmCostSummary`. Pro AddedEntry: `wikipediaTitle`, `slug`, `payload: MergedBook` (mit `fields`, `fieldOrigins`, `externalUrls`, `confidence`, `primarySource`), optional `rawHardcoverPayload`, optional `rawLlmPayload`. UpdatedEntry hat zusätzlich `dbSlug` + `diff: Record<string, DiffFieldChange>`. SkippedManualEntry hat `wouldBeDiff`. Der Type ist die single source of truth — CC muss kein neues Schema erfinden, nur konsumieren.
- **Filename-Pattern.** `backfill-YYYYMMDD-HHMM.diff.json` für die Sortier-Logik. Sortier-Reihenfolge ist neuester zuerst. CC kann den Timestamp aus dem Filename parsen oder aus `DiffFile.ranAt` lesen — deine Wahl, beide sind authoritative (`ranAt` ist exakter, Filename ist sortier-stabil).
- **Existing routes als Style-Reference.** `/timeline` ist die bisherige Haupt-Anwendung des Site-Vokabulars (FilterRail, EraDetail, Cards). `/buch/[slug]` ist eine Detail-Pattern-Reference. CC kennt die Site, Brief soll keine spezifischen Klassen vorschreiben.
- **Vercel-Deploy + Git-Pull-Refresh.** Philipp committed die Diff-JSONs nach jedem Lauf, pusht, Vercel deployt (~30s). Damit ist „live" effektiv „live nach Push". Das ist explizit gewählt (Alternative wäre DB-Persistenz mit Schema-Migration, wurde verworfen).
- **Batching-Plan für 3e.** Der ursprüngliche 800-Buch-Übernachtlauf-Plan ist aus zwei Gründen ersetzt durch 50–100-Buch-Batches: (1) Philipp will den PC nicht 38h durchlaufen lassen, (2) er will nach jedem Batch sichtbar sehen ob alles okay ist — das ist *die* Existenzberechtigung des Dashboards. Das CLI hat `--limit N --offset M` schon, State-Resume schützt vor Neuanfang. Die Batches sind ein operationelles Pattern, kein Code-Change. Der Dashboard ist das fehlende Stück.
- **Phase-Einordnung.** Das ist Phase 3.5 — eine Brücke zwischen 3c (LLM-Anreicherung, ✅ implementiert) und 3d (Apply-Step, kommt). Es blockiert weder 040 noch 3d/3e. Aber es macht 3e signifikant angenehmer und verändert die Akzeptanz-Form für „ist die Ingestion gut": statt raw JSON greppen schaut Philipp auf eine Webseite.

## Constraints

- **Server Component.** Filesystem-Read passiert auf dem Server. Keine `fs`-Imports in `'use client'`-Files. Wenn CC client-side Interaktivität braucht (Expand/Collapse, Tab-Switch), entweder als isolierte kleine Client-Komponenten innerhalb der Server-Page, oder via reine CSS (`<details>`/`<summary>` etc.).
- **Datenquelle ist Filesystem.** Reads aus `ingest/.last-run/*.diff.json`. Keine DB-Anfragen für die Ingestion-Daten selbst. Wenn CC es nützlich findet die DB für „X Bücher aktuell in der DB" als Kontext-Footer/Header anzuzeigen: gerne, aber das ist Nice-to-Have, kein Acceptance-Bullet.
- **Read-only.** Keine Forms, keine API-Routes, keine Mutations, keine Apply-Trigger-Buttons, keine „Re-run this batch"-Knöpfe. Wenn CC sich denkt „das wäre cool" — bitte als „For next session" im Report dokumentieren statt einbauen.
- **Public Route.** `/ingest` (so heißt die Route — CC darf die exakte Path-Form wählen wenn er einen besseren Namen sieht: `/ingestion`, `/dev/ingest`, `/ingest-runs`. Aber bitte nicht versteckt, kein cryptic-slug, kein ENV-Gate). Keine Auth.
- **DiffFile-Type ist authoritative.** CC importiert `DiffFile` aus `src/lib/ingestion/types.ts`. Wenn ein Feld in der Type nicht existiert: nicht in der UI rendern. Wenn ein älterer Diff (3a-Test) ein Feld nicht gesetzt hat (z.B. `llmModel` ist `undefined`): die UI muss das gracefully handhaben (kein Crash, kein leeres `null` rendern, sondern „kein LLM-Step in diesem Lauf" oder analog).
- **Sortier-Reihenfolge: neuester zuerst.** CC kann `ranAt` (ISO) oder Filename-Timestamp benutzen.
- **Drill-down zeigt alle Felder eines Eintrags an, oder macht sie klick-erreichbar.** Pro AddedEntry/UpdatedEntry/SkippedManualEntry müssen mindestens sichtbar sein: title/slug, sources die contributiert haben, field-by-field merged values mit field-origins, conflicts wenn vorhanden, raw Hardcover-Audit (tags + averageRating wenn vorhanden), raw LLM-Payload (facetIds + discoveredLinks + model wenn vorhanden), Plausibility-Flags wenn das Buch eine slug-anker'd flag hat. CC entscheidet wie das visuell strukturiert ist (Accordion, Tabs, dichte Tabelle, Side-by-Side) — aber die Daten dürfen nicht hinter „mehr im JSON" oder ähnlichen Outs versteckt sein.
- **Performance.** Der erwartete größte Diff (3e-Batch mit ~100 Bücher + LLM-Daten) liegt bei ~500–800 KB JSON. CC parst das einmal pro Request server-side (oder cached es per Build via `cache()`/`unstable_cache` — Wahl frei). Pro Run-List-Page: nicht alle 16 Diffs vollständig laden — Header-Daten (totals, model, timestamp, cost) reichen für die Summary-Cards. Volle Per-Buch-Daten erst beim Drill-down. Wenn CC Lust hat eine `parseDiffHeader(filepath)`-Hilfsfunktion zu schreiben die nur die Counter-Felder zurückgibt: gerne. Wenn das mit voll-laden + Throw-away noch performant genug ist: auch okay.
- **Stale-Diff-Tolerance.** Ältere Diffs aus 3a/3b haben weniger Felder als 3c-Diffs (kein `llmModel`, kein `llmCostSummary`). Die UI muss das ohne Crash rendern, mit einer klaren Anzeige „LLM-Step war in diesem Lauf nicht aktiv" oder analog. Diese Pattern wird auch zukunftsfähig: wenn eines Tages neue Felder dazukommen, sollte die UI nicht durch ältere Diffs brechen.
- **Keine Versions-Pins.** CC pinnt selbst (z.B. wenn er eine Date-Formatierungs-Lib oder eine kleine Render-Helper-Lib will).
- **Build green.** `npm run typecheck`, `npm run lint`, `npm run build` müssen grün sein.
- **Existing tests bleiben grün.** Die Pipeline-Tests (`scripts/check-eras.ts`, ggf. weitere) berühren das Dashboard nicht — aber der Dashboard sollte auch sie nicht brechen.

## Out of scope

- **DB-Persistenz von Runs (`ingestion_runs`-Tabelle).** Bewusst verworfen in der Cowork-Diskussion 2026-05-04. Wenn jemals Live-View ohne git-push gewünscht wird, ist das ein eigener Brief mit Schema-Migration.
- **Apply-Trigger aus dem Dashboard.** Apply bleibt CLI-Operation in 3d. Kein „Run Apply"-Button, keine API-Route.
- **Cross-Diff-Tracking pro Buch.** „Welcher Lauf hat dieses Buch zuerst gesehen, welche Felder haben sich über Läufe verändert" — ist ein eigener Brief wenn nötig (Phase 3.5+ oder Phase 4). Heute zeigt der Dashboard pro Run die Daten dieses Runs, nicht die History pro Buch.
- **Auth.** Public route, keine Login-Wand.
- **Live-Polling, SSE, WebSockets.** „Live" ist im 040-/041-Sinn = „nach git push sichtbar", nicht „während ein Lauf läuft sichtbar".
- **Edit-UI für einzelne Bücher.** Read-only. Hand-Korrekturen passieren via Override-File-Workflow den der zukünftige 042-Brief definieren wird.
- **Dashboard für Seed-Data-Step** (`scripts/seed-data/*.json`). Eigener Concern, eigener (potentieller) Brief wenn jemals nötig.
- **PR-Generierung aus Diffs.** Phase 3e Workflow-Frage, nicht Dashboard-Frage.
- **`coverUrl`-Höher-Auflösung** falls der Dashboard Cover anzeigen will. Phase-4-Detail-Pages-Frage; CC darf für den Dashboard die existierenden coverUrls (aus den Diffs) als-they-are nutzen oder ganz weglassen.
- **i18n / Übersetzung.** Site ist heute deutsch-mit-englischen-Tech-Begriffen. Dashboard auch.
- **Maintenance-Crawler / GitHub-Actions-Scheduling.** Phase 3f.
- **`--no-llm`-CLI-Flag** für Chat-only-Pfad. Verworfen in der Diskussion 2026-05-04.

## Acceptance

The session is done when:

- [ ] Route `/ingest` (oder CC's gewählter Path-Form) rendert mit allen 4 existierenden Diffs aus `ingest/.last-run/` als Summary-Cards/Listings, neuester zuerst.
- [ ] Pro Diff sichtbar in der Summary-Card: Timestamp (`ranAt`), Modell (`llmModel` oder „kein LLM-Step"), `activeSources`, totals (count of added/updated/skipped_manual/skipped_unchanged/field_conflicts/errors/llm_flags), Cost (`llmCostSummary.estUsdCost` wenn vorhanden), Discovery-Roster-Size.
- [ ] Drill-down auf eine Run zeigt alle Bücher mit allen Feldern wie unter Constraints spezifiziert (title, sources, field-origins, conflicts, hardcover-audit, llm-payload, flags). Format der Drill-down-Page ist CCs Wahl.
- [ ] Per-Buch-Detail zeigt klar welche Source jedes Feld geliefert hat (`fieldOrigins`-Map des MergedBooks).
- [ ] Plausibility-Flags (`llm_flags`) sind pro Buch sichtbar oder mit dem Buch verknüpft (klick auf Flag → springt zu Buch, oder umgekehrt — CC's Wahl).
- [ ] Ältere Diffs (3a-Test ohne `llmModel`/`llmCostSummary`/`llm_flags`) rendern ohne Crash und zeigen klar an, dass kein LLM-Step gelaufen ist.
- [ ] Die Cost-Daten aus 2037 ($7.00 Sonnet) und 2130 ($2.21 Haiku) sind beide klar lesbar — der Dashboard ist explizit auch dafür da, Cost-Vergleiche zu sehen.
- [ ] Server Component (Filesystem-Read passiert serverside). Keine `fs`-Imports in `'use client'`-Files.
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` grün.
- [ ] Existing routes (`/`, `/timeline`, `/map`, `/ask`, `/buch/[slug]`, etc.) bleiben unverändert in Verhalten.
- [ ] Wenn CC eine Hilfsfunktion zum Diff-Reading schreibt (z.B. `loadDiffSummary(filepath)`), ist sie typisiert gegen `DiffFile` aus `src/lib/ingestion/types.ts` — kein neuer Type-Mirror.

## Open questions

Inputs für den nächsten Cowork-Brief, keine Blocker:

- War der größte aktuelle Diff (`backfill-20260503-2130.diff.json`, ~20 Bücher mit voller LLM-Anreicherung) in der UI noch flott genug, oder hast du bereits Pagination/Virtualization gebraucht? Antwort hilft die 3e-Batch-Größe (50 vs 100) zu wählen.
- Caching-Strategie: hast du `cache()`/`unstable_cache` benutzt, force-dynamic, oder default static SSG? Wenn static SSG: ist beim nächsten Re-Deploy nach dem 040-Re-Test der neue Diff automatisch sichtbar oder muss Vercel forciert werden?
- Hast du eine Route-Form gewählt (`/ingest` vs `/ingest/[runId]` mit Master/Detail) oder Inline-Drill-Down (Modal/Accordion)? Was hat sich beim Bauen besser angefühlt?
- Sind die älteren Diffs (3a/3b) im UI noch sinnvoll lesbar, oder fühlen sie sich wie „Test-Lauf-Müll" der die Liste verstopft? Falls letzteres, könnte Brief 042 einen Archiv-Folder einführen — bis dahin: leben damit.

## Notes

### Dateipfade die CC braucht

- `src/lib/ingestion/types.ts` — `DiffFile` und alle abhängigen Types. Single source of truth für Datenstruktur.
- `ingest/.last-run/*.diff.json` — die 4 existierenden Diffs als Test-Daten.
- `src/app/page.tsx` + `src/app/timeline/page.tsx` — Style-Reference für Server-Component-Page-Pattern.
- `src/app/globals.css` — CSS-Vars, Schriften, Farb-Tokens.
- `src/db/client.ts` — falls CC für Bonus-Footer „X Bücher aktuell in DB" einen DB-Read machen will (optional, kein Acceptance-Bullet).

### Was passiert wenn ein Diff-File korrupt ist (z.B. broken JSON)

CC entscheidet die UX: einen Error-State pro Card („Diff korrupt — siehe `<filename>` im Repo"), oder die Card weglassen mit einem Top-Level-Warning. Beide Pattern sind okay; Crash ist nicht okay.

### Erweiterungs-Pfad nach 041

Wahrscheinliche Folge-Briefe (nicht Teil von 041, nur damit CC den Kontext einordnen kann):

- **042 (post-3e):** Override-File-Format für Philipps externe Hand-Check-Korrekturen aus Claude.ai-Sessions. Der Dashboard wird dafür ggf. eine Anzeige bekommen welche Bücher ein aktiv anliegendes Override haben. Aber das ist 042's Concern, nicht 041's.
- **043 (3d):** Apply-Step. Schreibt aus den Diffs + Overrides in die DB. Dashboard könnte später eine post-Apply-View bekommen ("X Bücher applied, Y outstanding"). Auch 043's Concern.
- **distant:** Cross-Diff-Tracking-View, „Audit-Trail pro Buch über alle Läufe".
