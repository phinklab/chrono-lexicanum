---
session: 2026-05-04-043
role: implementer
date: 2026-05-04
status: complete
slug: ingestion-dashboard
parent: 2026-05-04-041
links:
  - 2026-05-04-041
  - 2026-05-04-040
  - 2026-05-04-042
commits: []
---

# Phase 3.5 — Ingestion-Dashboard (Implementer Report)

## Summary

Read-only Dashboard auf Public-Route `/ingest` plus Drill-down `/ingest/[runId]`. Server Components mit SSG (`generateStaticParams` über die committed Diff-Files), `<details>`/`<summary>` für die per-Buch-Accordion-Mechanik (kein Client-JS, keine Hydration). Datenquelle ist Filesystem über einen neuen Helper `src/lib/ingestion/diff-reader.ts`, typed gegen `DiffFile` (kein Type-Mirror). Alle 5 committed Diffs (3a `1115`, 3b `1328`, 3c Sonnet `2037`, 3c Haiku `2130`, 040-Re-Test `2308`) rendern grün, Cost-Vergleich Sonnet $7.00 vs Haiku $2.21/$2.24 ist auf der Liste prominent sichtbar.

## What I did

- `src/lib/ingestion/diff-reader.ts` (NEU) — Server-side Loader mit drei Funktionen:
  - `listDiffFiles()` — listet `ingest/.last-run/*.diff.json`, parst pro File die Top-Level-Header-Felder (`ranAt`, `discoveryPages`, `activeSources`, `discovered`, alle Counts via `array.length`, optionale LLM-Felder). Returnt `DiffListEntry[]` als Discriminated Union `{ kind: "ok"; summary }` oder `{ kind: "error"; error }` — korrupte Files crashen die Liste nicht. Sortiert per `ranAt` neuester zuerst; `localeCompare`-stabiler Fallback auf runId wenn Timestamp unparsable.
  - `loadDiffById(runId)` — vollständiger DiffFile-Load für Detail-View, `null` bei ENOENT (→ `notFound()`), `throw` bei JSON-Parse-Failure (→ Vercel-Error-Page). Input-Validation gegen Path-Traversal: `runId` muss `/^[a-zA-Z0-9._-]+$/` matchen.
  - `listValidRunIds()` — für `generateStaticParams`. Filtert korrupte Files aus dem SSG-Bake; defekte Files erscheinen nur in der Liste (mit Error-Card), haben keine prerenderte Detail-Route.
- `src/app/ingest/page.tsx` (NEU) — Listen-View. Server Component, default SSG. Header mit Cinzel-Heading + Reader-Prose-Sub. Liste aus Cards (`<ol>`) — jede Card ist ein `<Link>` zur Detail-Route, mit Bracket-Corners, Counter-Grid (8 Counter), Source-Pills im Footer. Empty-State mit Hinweis auf `npm run ingest:backfill`-Befehl. Korrupte Files rendern als rotgesäumte Error-Card mit Filename + Parse-Fehlertext.
- `src/app/ingest/[runId]/page.tsx` (NEU) — Detail-View. Server Component, `generateStaticParams` returnt alle valid runIds. Header zeigt RunId + Meta-Grid (8–10 Felder je nach LLM-on/off). Sektionen für Added / Updated / Skipped (manual) / Skipped (unchanged) / Field-Konflikte / Errors / orphan LLM-Flags — jeweils unterdrückt wenn leer. Pro Buch ein `<details>`-Accordion mit 5–7 Subsektionen (Felder + Origins, External URLs, Hardcover-Audit, LLM-Payload, Plausibility-Flags). `groupFlagsBySlug()` aggregiert die Top-Level-`llm_flags` zurück zu den Büchern; Flags ohne korrespondierenden Eintrag landen in der eigenen "LLM-Flags ohne Buch-Eintrag"-Sektion. `formatValue()` ist die uniforme Serialisierungs-Hilfe für unbekannte Werte (string/number/boolean/array → JSON, sonst stringify).
- `src/app/ingest/[runId]/not-found.tsx` (NEU) — Fallback für `notFound()`. Reuse der Detail-Shell + Back-Link.
- `src/app/globals.css` (~470 Zeilen ergänzt) — Neuer Block "Ingestion-Dashboard (Phase 3.5)" am Ende. Klassen-Namespace `ingest-*` (separat vom Hub/Timeline-Vokabular, aber konsumiert die gleichen `--color-*`/`--font-*`-Tokens). Drei Kategorien: Listen-Shell (`ingest-shell`, `ingest-header`, `ingest-card` mit Bracket-Corner-Reuse, `ingest-counter` mit accent-Varianten lum/amber/chaos/gold/muted), Detail-Shell (`ingest-detail-shell`, `ingest-meta-block`, `ingest-section`, `ingest-entry` als `<details>` mit Hover-/Open-State), Per-Buch-Subsections (`ingest-fields-table` als 3-Spalten-Tabelle mit synopsis-Spezial-Renderer, `ingest-pill-list` für Facets, `ingest-link-list` für External URLs, `ingest-flag` als gold-gerahmte Card, `ingest-diff-table` mit alt/neu strikethrough/lum-Zeilen, `ingest-error` als chaos-border-left).

Kein Client-Component, keine Mutation-Forms, keine API-Routes. `'use client'` taucht nirgendwo auf. Drizzle/`db` wird nicht importiert. Filesystem-Read passiert ausschließlich in `diff-reader.ts` (Node-only via `fs.promises`).

## Decisions I made

- **Eigene Detail-Route `/ingest/[runId]` statt Modal/Inline-Accordion.** Begründung dreifach: (a) Shareable URLs — Philipp kann einem 3e-Triage-Reviewer einen Link auf einen einzelnen Run schicken; (b) SSG-Performance — die Listen-Page lädt nur Header-Daten (~3 KB pro Run), die Detail-Route lädt erst bei Klick den vollen ~150-KB-Diff; (c) sauberer Server-Component-Pfad — Modals brauchten Client-State + Hydration. Brief gab Design-Freedom; ich habe die Route-Form gewählt.
- **`<details>`/`<summary>` als Accordion-Mechanik statt Tabs.** Per-Buch-Detail wird häufig nur für 1–3 Bücher ausgeklappt (gezielter Audit), nicht alle 20+ gleichzeitig. Native HTML-Element bedeutet null Client-JS-Cost, perfekt zugänglich (Keyboard-Toggle über `Enter`/`Space` out-of-the-box), und respektiert `prefers-reduced-motion` automatisch (kein Animation-Code von mir nötig).
- **SSG mit `generateStaticParams` statt `dynamic = "force-dynamic"`.** Diff-Files ändern sich nur bei `git push` → Vercel re-build → SSG-Bake — also genau der Zeitpunkt wann neue Diffs sichtbar werden sollen. Per-Request-FS-Read auf Vercel-Serverless wäre Cold-Start-Cost ohne Mehrwert. Trade-off: bei jedem neuen Diff muss neu deployed werden, was sowieso passiert (committed Diffs landen im git push). Build prerendered alle 5 Diff-Detail-Routen sauber (sichtbar im `next build`-Output: `● /ingest/[runId]` mit 5 prerenderten Pfaden).
- **Detail-Route loaded den vollen DiffFile statt einer schmalen Detail-Shape.** Bei aktueller Skala (max ~150 KB Diff = ~50 KB gzipped) ist das vertretbar; ein Custom-Detail-Loader würde nur Boilerplate ohne Mess-Win sein. Wenn 3e-Voll-Lauf-Batches > 1 MB werden, kann der Loader später paginiert werden.
- **Top-Level `llm_flags` zurück zu Büchern aggregiert via `groupFlagsBySlug()`.** Brief verlangt explizit „Plausibility-Flags pro Buch sichtbar oder mit dem Buch verknüpft (klick auf Flag → springt zu Buch, oder umgekehrt)" — letzteres ist die saubere Form für `<details>`-Accordion: Flag-Pill in der Summary-Zeile + voller Flag-Block im Body. Orphan-Flags (Slug existiert nicht in added/updated/skipped_manual) bekommen eine separate Sektion am Ende — das ist ein realer Edge-Case (kann passieren wenn ein Buch in einem späteren Apply-Step gelöscht wird, aber der Diff vorher committed war).
- **Field-Konflikte in eigener Sektion statt per-Buch eingebettet.** Im DiffFile-Type sind `field_conflicts` Top-Level mit Slug-Anker, NICHT als Subfeld auf `AddedEntry`. Ich habe sie nicht künstlich auf die Bücher geheftet — der Reader sieht das Slug + Field-Name in der Konflikt-Liste und kann selber via Browser-Search ins Accordion springen. Cleaner als in beiden Stellen redundant zu rendern.
- **Counter-Grid mit accent-Klassen statt Bar-Charts.** Brief erlaubt explizit Bar-Charts; ich habe mich für Mono-Counter mit Tinted-Numerals entschieden — dichter (8 Counter passen in eine Zeile auf Desktop), präziser ablesbar (real-Zahlen statt visueller Approximation), und matcht das Console-Aesthetic ("Counter-Wand wie ein Cockpit-Display"). Memory-Constraint "no glow halos, no warm gradients" ist respektiert: Pills haben nur 1px-Border, kein Glow.
- **Cost prominent sichtbar in Card-Header (Mono, amber)** statt im Footer. Brief: "Cost-Vergleich ist eines der Existenzgründe". Auf der Liste sieht man Sonnet $7.00 vs Haiku $2.21/$2.24 direkt nebeneinander, ohne Klick. Auf Detail erscheint die Cost im Meta-Grid mit den Token-Counts daneben.
- **Buchtitel als Cormorant-Italic.** Site-Konvention (Memory: gothic-imperial) — Buchtitel sind Buchtitel und sollten als solche aussehen. Slug bleibt Mono, weil das ein technischer Identifier ist.
- **Kein Re-Build des `--font-cormorant` für andere Inhalte.** Die Font war bereits in `globals.css` für andere Stub-Routes geladen; ich nutze sie nur für die Entry-Titles im Dashboard. Kein zusätzlicher Font-Cost.
- **De-DE-Sprache in der UI** statt Englisch — matcht die Site (Hub Heading-Mix EN/DE, Brief 041 selbst auf deutsch). „Ingestion-Läufe", „Diff", „Plausibilitäts-Flags" sind die kanonischen Wörter aus der Pipeline-Doku, frei aus Brief 041 übernommen.
- **Kein neuer dependency.** Brief erlaubte explizit eine Date-Format-Lib; ich habe stattdessen 4 Zeilen native `Date.getUTCDate()` etc. geschrieben. Eine Lib für „dd.mm.yyyy HH:MM UTC" wäre Overkill.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass (1 pre-existing warning aus `src/app/layout.tsx`, nicht von 041)
- `npm run build` — pass. 12 Routes generated; relevant für 041:
  - `○ /ingest` (Static)
  - `● /ingest/[runId]` (SSG via `generateStaticParams`) mit 5 prerenderten Pfaden: `backfill-20260503-2308`, `backfill-20260503-2130`, `backfill-20260503-2037`, `backfill-20260503-1328`, `backfill-20260503-1115` (`+2 more paths` im Output sind 1328 und 1115).
- `npm run dev` + `curl` Smoke-Tests (localhost:3000):
  - `GET /ingest` → 200, ~52 KB HTML, alle 5 RunIds sichtbar (`backfill-20260503-{1115,1328,2037,2130,2308}`), Cost-Strings `$2.24`/`$2.21`/`$7.00` rendered (mit React's `<!-- -->`-Inter-Text-Marker zwischen `$` und Number — normal).
  - `GET /ingest/backfill-20260503-2308` → 200, ~580 KB HTML (20 Bücher × ~25 KB Detail-Markup), `claude-haiku-4-5` + Hash `f6272d57626d` im Meta-Grid, 410 `ingest-entry`-Strings (~20 Bücher mit ~20 String-Vorkommen pro Buch durch HTML+RSC-Payload-Doppelung in Dev).
  - `GET /ingest/backfill-20260503-1115` → 200, ~55 KB HTML, "kein LLM-Step"-Sektion + "ohne LLM-Anreicherung"-Hinweis sichtbar; keine Crash auf fehlenden `llmModel`/`llmCostSummary`/`llm_flags`.
  - `GET /ingest/does-not-exist` → 404 mit "Lauf nicht gefunden"-Page (not-found.tsx greift).
  - Existing-Routen-Sanity: `GET /` → 200, `GET /timeline` → 200, `GET /ask` → 200. Keine Regression.
- Browser-Manual-Spot-Check (DevTools beim Dev-Server-Lauf): Counter-Grid bricht auf Mobile-Viewport-Breite nicht, `<details>`-Accordion öffnet sauber, External-URL-Links sind `target="_blank" rel="noreferrer noopener"`.

## Open issues / blockers

- **Field-Konflikte sind aktuell in eigener Sektion, nicht in den Per-Buch-Drill-down eingebettet.** Falls Cowork das anders haben will (z.B. Konflikt-Block direkt unter dem Buch), ist das eine 20-Zeilen-Änderung in `groupConflictsBySlug()` + neue Subsection in den Entry-Cards. Heute kein Blocker — der Reader sieht in der separaten Sektion welcher Slug welchen Konflikt hat und kann via Browser-Search ins Accordion springen.
- **Seed-Data-Step-Diffs sind out of scope** (vom Brief explizit ausgenommen). Das Dashboard zeigt nur Backfill-Diffs, nicht z.B. die Seed-JSON-zu-DB-Apply-Diffs. Wenn Phase 4 das gebraucht, neuer Brief.
- **Korrupte Files erscheinen in der Liste, aber haben KEINE Detail-Route.** `generateStaticParams` filtert sie aus (`listValidRunIds()`), damit der SSG-Bake nicht stirbt. Klick auf eine Error-Card würde im Dev-Modus 404 zeigen — die Card ist aber bewusst kein `<Link>`, sondern ein `<article>`, also nicht klickbar. Heute kein Issue (keine korrupten Files committed).

## For next session

Suggestions für Cowork — adressiert die offenen Fragen aus Brief 041:

- **Performance bei größtem Diff:** Der größte aktuelle Diff (`backfill-20260503-2130.diff.json`, 133 KB) lädt im SSG-Bake einmalig — Runtime-Cost auf Vercel ist 0, weil das prerendered HTML statisch ausgeliefert wird. Bei 3e-Batches mit 100 Büchern wären das geschätzt ~700 KB pro Diff, × 16 Batches = ~11 MB Build-Memory-Footprint — vertretbar. Pagination ist heute nicht nötig; bei 800-Buch-Single-Diff ggf. ja, aber 3e ist gerade auf Batch-Modus angepasst worden.
- **Caching-Strategie:** Default SSG mit `generateStaticParams`. Nach `git push` läuft Vercel ein `npm run build`, der die neuen Diff-Files ins Bake aufnimmt. Kein `revalidate`/`force-dynamic` nötig. Falls jemals Live-View ohne Push gewünscht ist, ist das ein expliziter neuer Brief mit DB-Persist-Layer.
- **Routing-Form vs Inline-Drill-Down:** Eigene Route gewinnt klar — Detail-Page hat 5 Sektionen + 7 Subsektionen pro Buch + Run-Header; das wäre als Modal claustrophobisch.
- **Stale-Diff-Lesbarkeit (3a/3b):** Lesbar, aber kurz — 4 added + 1 skipped_manual rendert in 4 Klick-Frames. Ältere Diffs sind nicht "Müll", sondern Kontext für die Pipeline-Evolution. Kein Archiv-Folder nötig; sie nehmen in der Liste 2 Cards ein — kompakt.
- **3e Voll-Lauf-Batch-Workflow ist jetzt einsetzbar.** Empfehlung für ersten Batch: `npm run ingest:backfill -- --dry-run --limit 50 --offset 40` (Bücher 41–90, weil 1–40 schon getestet sind). Dashboard rendert dann 6 Cards, neuester zuerst.
- **`Field-Konflikte` & per-Buch-Verknüpfung:** Wenn Cowork die Konflikte direkt unter den Büchern sehen will, klein adjustment am `Section`-Layout. Heute haben wir 7 Konflikte im Re-Test-Diff, alle gut lesbar in der Standalone-Sektion mit Slug-Anker.
- **Tracking pro Buch über Diffs:** Carry-Over für späteren Brief (Brief 041 hat das explizit out-of-scope). Sinnvoll wenn die Pipeline mehrere Wochen Diffs produziert hat und Cowork wissen will "was hat sich für `horus-rising` über die letzten 4 Läufe verändert".

## References

- Brief 041 (`sessions/2026-05-04-041-arch-ingestion-dashboard.md`) als Spec.
- `DiffFile`-Type (`src/lib/ingestion/types.ts:356`) als single source of truth — kein neuer Mirror.
- Existing patterns konsultiert: `src/app/timeline/page.tsx` (Server-Component-async-Pattern + try/catch-Empty-Fallback), `src/app/page.tsx` (Hub-Card-Pattern + Bracket-Corners), `src/app/globals.css` (Token-System: `--color-bg-1`, `--color-ink-{0,1,2,3}`, `--color-line-{0,1,2}`, `--color-{lum,amber,gold,chaos}`, `--font-{cinzel,cormorant,grotesk,mono,reader}`).
- Next.js 16.2.4 `generateStaticParams` Doku (App Router SSG): <https://nextjs.org/docs/app/api-reference/functions/generate-static-params>.
- HTML `<details>`/`<summary>` Accessibility-Default — keyboardable, screenreader-aware out-of-the-box.
