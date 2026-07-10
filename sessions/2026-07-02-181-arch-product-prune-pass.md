---
session: 2026-07-02-181
role: architect
date: 2026-07-02
status: implemented
slug: product-prune-pass
parent: null
links: [2026-06-03-121, 2026-07-02-177, 2026-07-08-185]
commits: []
---

# 181 — Product-Prune-Pass: Lab-Löschung + dokumentierte Dead-Code-Marker (121-Product)

> **Implemented by Session 185 / PR #226 (2026-07-08).** The app `/lab` routes, matcher bypass, dead Compendium/filter/token surfaces and duplicated search-index block were removed. Session 190 later added new static `public/lab/ofob` Ask prototypes; those are not a regression of the deleted app routes and have their own pre-launch disposition.

## Goal

Die im Website-Code angesammelten, **dokumentierten** Deferral-Marker in einem Pass abarbeiten: `/lab`-Prototypen löschen (Philipp-Entscheid 2026-07-02), `atlas/queries.ts` prunen + umbenennen, `fraktionen/filters.ts` halbieren, Legacy-Farbpalette + verwaiste Font-Tokens raus, Keyframe-Dupes, `.font-mono`-Rename, Search-Index-Helper. Reine Löschung/Konsolidierung — **null sichtbare Veränderung** (außer dass `/lab/*` verschwindet).

> **Startbedingung:** erst nach Merge von Brief 178 (Map-UI-Neubau) — der Neubau berührt Components + CSS großflächig; dieser Pass räumt danach auf, nicht parallel dazwischen. Pendant im Batches-Strang ist Brief 177 (Ingestion-Dead-Code) — bewusst getrennt, andere Fläche, anderer Worktree.

## Design freedom — read before everything else

Dies ist ein No-visual-change-Pass — es gibt keine ästhetischen Entscheidungen zu treffen, nur zu bewahren. Wo eine Löschung doch sichtbare Folgen hätte (z. B. der letzte Legacy-Palette-Consumer braucht einen Ersatz-Token), entscheidest du die konkrete Ersetzung selbst; Maßstab ist Pixel-Gleichheit.

## Context

Quelle: Status-quo-Review 2026-07-02 (adversarial verifiziert, `main` @ `add7ab5`). Die Review-Datei ist gitignored und liegt **nicht** in deinem Worktree — alle Findings stehen vollständig hier. Review § 6.4 dazu: „Das Projekt ist gut darin, tote Masse zu *dokumentieren* (P7/P11-Marker), aber die Pässe schieben sich" — dieser Brief terminiert sie. Und § 6.1 gibt die CSS-Richtung vor: **@theme trimmen, nicht Utilities adoptieren** — Tailwind bleibt Build-Pipeline + Token-Generator.

- **K30 · ~4,8K LOC `/lab`-Prototypen im Produktions-Bundle — LOW.** `src/app/lab/design/page.tsx` (727 LOC) + 4 Beispielseiten + 2.959 LOC zugehöriges CSS; statisch, kein DB-Zugriff, aber kompiliert & routbar. **Philipp-Entscheid 2026-07-02: löschen, nicht gaten** (git-Historie bewahrt sie; der referenzierte `#d8d2c2`-Wert aus `/lab/design` § Bausteine ist im ui-backlog bereits als Token-Kandidat notiert).
- **K13 · Lab-Routen umgehen das Preview-Gate — LOW, von Arch- UND Sec-Dimension gefunden.** Der Matcher-Ausschluss `lab/` in `src/proxy.ts` (für `public/lab`-Assets gedacht) matcht auch die App-Routen `src/app/lab/*` → `/lab/design` ist auf der Prod-URL **ohne Login erreichbar**, während alles andere gated ist. Die Löschung beseitigt die Fläche; danach den Matcher-Ausschluss so verengen, dass nur noch echte `public/lab`-Assets (falls nach Inventar überhaupt noch benötigt) ausgenommen sind.
- **K21/K29 · `src/lib/atlas/queries.ts` (1.049 LOC) ist ~60 % tot.** 9 tote Exports; der lebende Rest bedient ausschließlich `/compendium` (Raw-SQL, ~30 Counts in einem Round-Trip). Der Datei-Header dokumentiert den Prune selbst als „out of P11 scope". Fix: tote Exports raus, Modul ehrlich als Compendium-Modul benennen/verorten (Import-Pfade nachziehen).
- **K63 · `src/lib/fraktionen/filters.ts` ist ~50 % tot.** `ALIGNMENT_OPTIONS`, `parseFactionParams`, `applyFactionFilters` ohne Consumer, seit die Route ein Redirect ist; nur `loadFactionGuide` + `hasContent` leben (Compendium).
- **K18 · Legacy-Farbpalette: ~19 tote Tokens für 1 Consumer.** `styles/00-tokens.css:20-23` dokumentiert sie explizit als „reconcile later"; Paletten `void/aquila/frost/heresy` koexistieren mit der neuen `cl-*`-Palette. Review: **höchstwertiges Konsolidierungsziel im CSS.** Den einen Consumer auf `cl-*` migrieren, Legacy-Tokens löschen.
- **K53 · Space Grotesk verwaist.** `--font-grotesk` hat null Consumer; `next/font`-Load in `layout.tsx` entfernen + Token löschen. **⚠ Verwechslungsgefahr (Review Anhang A #1):** `--font-reader` (Newsreader) hat **6 Live-Consumer** in `30-ingest.css` — bleibt!
- **K45 · Duplizierte Keyframes.** `chronoSweep`/`chronoSpin` byte-identisch; `dmFade` ≙ `detailModalFade`. Dedupen.
- **K44 · `.font-mono`-Klasse kollidiert mit Tailwinds generierter Utility.** Rename → `.c-mono`, Consumer migrieren. (Das verwandte W6 — `--font-mono`-**Token** zeigt auf nie geladenes JetBrains Mono — reitet in Brief 182, nicht hier; nicht doppelt fixen, aber beim Rename nicht wundern.)
- **K14 · Search-Index-Block 3× kopiert.** Identische 4-Loader-`Promise.all` + Spread in `src/app/page.tsx`, `archive/page.tsx`, `archive/podcasts/page.tsx` (byte-identisch verifiziert). Ein `loadUnifiedSearchIndex()`-Helper beendet das Drift-Risiko.

## Constraints

- **Inventar vor Löschung** (Muster Brief 177): Kandidatenliste mit Verdict (gelöscht / behalten-weil-live / unklar-drin) in den Report; bei Unklarheit drinlassen und listen.
- **Null visuelle Veränderung** außer dem Verschwinden von `/lab/*` — vorher/nachher-Sichtprüfung der Hauptrouten; der Legacy-Palette-Consumer wird pixel-gleich migriert.
- Kein Refactoring lebender Pfade „wo man schon mal dran ist"; Umbenennung nur wie oben gelistet (atlas→compendium, `.font-mono`→`.c-mono`).
- `public/lab`-Assets: inventarisieren; wenn nach der Routen-Löschung consumer-los → mit löschen und Matcher-Ausnahme komplett entfernen.
- `@theme`-Trim nur auf die hier gelisteten Tokens — kein genereller Token-Kahlschlag (der UI-Gesamt-Pass kommt separat).
- `brain/**` + `sessions/README.md` nicht anfassen (Rollup-Ownership). Product-Worktree, ein PR.

## Out of scope

- W6-Token-Wiring, Focus-visible-Fix, SEO/OG (alles Brief 182).
- A11y-Polish-Items (Skip-Link etc.) — UI-Gesamt-Pass.
- Ingestion-/Scripts-Dead-Code (Brief 177, Batches).
- Keine Änderungen an Map-Code aus 178.
- Kein `@layer`-Umbau der CSS-Partials (dokumentierter Tradeoff, Trigger nicht erreicht).

## Acceptance

The session is done when:

- [ ] `src/app/lab/**` (+ zugehöriges CSS, + consumer-lose `public/lab`-Assets) gelöscht; Proxy-Matcher ohne Lab-Bypass; `/lab/design` liefert 404 hinter dem Gate.
- [ ] `atlas/queries.ts`: 9 tote Exports entfernt, Modul als Compendium-Modul benannt, `/compendium` funktional unverändert.
- [ ] `fraktionen/filters.ts`: tote Hälfte entfernt, Compendium-Consumer intakt.
- [ ] Legacy-Palette-Tokens + `--font-grotesk` (+ `next/font`-Load) entfernt; `--font-reader` unangetastet; Keyframe-Dupes dedupliziert; `.font-mono` → `.c-mono` migriert.
- [ ] `loadUnifiedSearchIndex()`-Helper ersetzt die 3 Kopien.
- [ ] `npm run lint` + `tsc --noEmit` + `next build` grün; Report beziffert den Abbau (Dateien/LOC).

## Open questions

- Findest du beim Inventar weitere dokumentierte Deferral-Marker (P7/P11-Kommentare), die in denselben Pass gehören? Listen + Aufwand schätzen, nicht eigenmächtig mitnehmen.
