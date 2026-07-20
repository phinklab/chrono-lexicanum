---
session: 2026-07-20-253
role: implementer
date: 2026-07-20
status: complete
slug: werkstatt-wab1-archive-facet-filters
parent: launch-prompt (WA-Urteil Session 241; kein Architect-Brief — serielle Launch-Session aus dem Koordinations-Worktree)
links: []
commits:
  - (dieser PR)
---

# Werkstatt-Bau WA-B1 — Facetten-Filterleiste im Archiv

## Summary

Das Archiv-Register hat jetzt eine kombinierbare Facetten-Filter-UI hinter **einem** „Filters"-Aufklapper: unter dem Suchfeld bleibt eine konstante Kontroll-Zeile (Sort-Pills mit Richtungs-Toggle per Zweitklick + Filters-Trigger + reserviertes „Clear all" — kein Layout-Shift), der Trigger öffnet das **Filter-Ledger** im Hairline-Stil der Buchliste: Zeilen für Faction, Format und sechs Facetten-Kategorien (Tone, Plot Type, POV Side, Entry Point, Length, Theme — 37 Chips; Hopepunk/Satirical kuratiert raus). Semantik ODER innerhalb einer Kategorie / UND zwischen Kategorien, jede Kombination als teilbarer Link über wiederholte `facet`-URL-Params; aktive Chips tragen ein × und deselektieren per Re-Klick; der geschlossene Trigger summiert alle aktiven Filter als goldene Zahl. Alle bestehenden Ein-Facetten- und Sort-Links bleiben unverändert gültig. Kein Schema, keine neuen Daten, keine Dependency, kein Wire-Shape-Change. Zwei Review-Runden mit Philipp sind eingearbeitet (Runde 1: aufgeräumter Start; Runde 2: ein Aufklapper statt Akkordeon-Zeile, Sort-Richtungen, Shift-Fix, Ausschlüsse).

## What I did

- `src/app/archive/filters.ts` — Contract-Umbau: `WorksParams.facet: string|null` → `facets: string[]` (wiederholter `facet`-Param, ID_PATTERN-validiert, dedupliziert, URL-Reihenfolge). Kategorien-Gruppierung der Selektion wird aus dem Katalog selbst aufgelöst (`groupFacetSelection` — die URL trägt nie die Kategorie, die Gruppierung kann nicht von den Daten driften). Neu: `facetHitCounts` (selektionssensitive Trefferzahl je Chip über den **Gesamtkatalog**, Standard-Faceted-Search: die eigene Kategorie drosselt ihre Chips nicht), `buildFacetPanel` (v1-Gruppen mit Counts/Active-Flags), `resolveActiveFacets` (Selektion → Anzeige-Chips inkl. `inPanel`-Flag), `PANEL_FACET_CATEGORIES` + `PANEL_EXCLUDED_FACETS` (Hopepunk/Satirical) mit Begründung im Code. **Sort-Contract erweitert:** `SortKey` = `title | title_desc | release | release_asc` (alte Werte behalten ihre Bedeutung — Alt-Links gültig), gemeinsamer Validator `parseSortKey` für Server-Parse und Client-Island, `compare` mit Richtungs-Ästen (unbekannte Jahre sinken in **beiden** Release-Richtungen ans Ende).
- `src/app/archive/WerkeFilters.tsx` — Umbau auf **konstante Kontroll-Zeile + Filter-Ledger**: Zeile = Sort-Pills (Zweitklick auf die aktive Pill dreht die Richtung, Label wechselt „Title A–Z"↔„Title Z–A" / „Newest"↔„Oldest"; das „Sort"-Label entfiel — `aria-label` bleibt) + Hairline-Trenner + „Filters"-Trigger (FilterSelect-Idiom, `aria-expanded`, goldene Summen-Zahl in reserviertem 1ch-Slot). Die Zeile hat **keine zustandsabhängigen Teile** mehr und sitzt exakt zentriert unter der Konsole — „Clear all" wanderte als Server-`Link` in die Census-Zeile (Runde 3; Sort bleibt im Href erhalten, `scroll={false}`). Der Trigger öffnet das Ledger: Hairline-Zeilen mit Mono-Label-Spalte — Faction/Format (FilterSelect unverändert, Label per CSS in die Spalte eingereiht), sechs Facetten-Chip-Zeilen (Toggle-Buttons mit `aria-pressed`, Count je Chip, Null-Treffer gedimmt `is-void` statt versteckt, aktive Chips mit ×-Affordanz — Re-Klick deselektiert), plus „Other"-Zeile für Selektionen außerhalb des Panels (Such-Pick aus Nicht-v1-Kategorie, kuratiert ausgeschlossene IDs, Alt-Link) als entfernbare `browse-facet-chip`s — eine sichtbare Wahrheit pro Selektion, nichts filtert unsichtbar. Such-Vorschlag-Pick (`facet`-Kind) **addiert** zur Selektion statt zu ersetzen; `page` wird bei jedem Filterwechsel gelöscht (S6-Pager).
- `src/app/archive/page.tsx` — Rail + Active-Chips serverseitig gebaut und als Props gereicht; Pager-Hrefs tragen alle `facet`-Params; der alte Einzel-`activeFacet`-Block ist ersetzt.
- `src/app/archive/loader-live.ts` — zweites Sichtbarkeits-Gate: zusätzlich zu `isVisibleFacetCategory` (Content-Warning-Retirement, NEON-14) filtert der Loader jetzt `facet_categories.visible_to_users` — der DB-Schalter wirkt damit real auf alle Browse-Flächen (Rail, Suche, Buch-Popup-Feed). Achtung: In DB **und** Seed-Katalog steht `content_warning.visibleToUsers=true` — das zentrale `isVisibleFacetCategory`-Set bleibt also der tragende Gate, die Spalte ist der Zusatzschalter.
- `src/app/styles/61-browse.css` — `browse-filters-toggle` (FilterSelect-Idiom: Hairline-Unterstrich, Caret-Rotation — kein nackter Linien-Button, kein Glow), `browse-controls__sep` (vertikale Hairline zwischen Pills und Trigger), `filter-ledger` im Buchlisten-Stil (Hairline-Zeilen, Mono-Label-Spalte 104px, FilterSelect-Label per Descendant-Selector eingereiht), Chips kompakter (3px/8px), Gold nur auf Zustand. Mobile: `browse-controls`-Override **archiv-scoped** (`.catalogue--werke`) als zentrierte Wrap-Zeile (Sep dort ausgeblendet) — das geteilte 720px-Grid bedient weiter die Compendium-Verzeichnisse; Ledger-Zeilen stapeln (Label über Control/Chips), 44px-Targets für Trigger + Chips im `pointer:coarse`-Block.
- `src/app/styles/31-catalogue.css` — `catalogue-census__clear`-Link im `browse-clear`-Idiom (Unterstrich-Hairline, Gold auf Hover). Ein flankierendes Linien-Ornament an der Census war in Runde 3 gebaut und flog auf Philipps Urteil wieder raus — die Zeile bleibt schlicht.
- `scripts/test-archive-browse.ts` — sieben neue DB-freie Contract-Tests: Parse (Einzel-Link-Kompat, Dedup, Pattern), ODER/UND-Semantik, Counts ignorieren die eigene Kategorie, Cross-Kategorie-Sackgassen zählen 0, Panel nur aus v1-Kategorien + kuratierte Ausschlüsse bleiben gültige Filter-IDs, Sort-Key-Parse (4 Werte + Junk-Fallback), Richtungs-Inversion mit Null-Jahren am Ende.
- `docs/werkstatt-roadmap.md` — WA-B1 abgehakt (✔ 253).

## Decisions I made

- **v1-Kategorien = exakt die sechs aus dem Auftrag.** Von den 11 sichtbaren Kategorien draußen: `format` (der Format-Dropdown filtert bereits das reichere `book_format`-Enum — 9 Werte statt 3), `language` (1 Wert = keine Filterkraft), `protagonist_class` (11 Werte hätten die Rail-Höhe verdoppelt), `protagonist_gender` + `scope` (v2-Kandidaten). Alle bleiben über die Such-Vorschläge erreichbar und laufen durch **denselben** Mehrfach-Contract — die Rail ist eine Teilmenge, keine zweite Wahrheit.
- **URL-Form: wiederholte `facet`-Params** (`?facet=grimdark&facet=war_story`) statt Komma-Liste — native `URLSearchParams`-Semantik, und jeder existierende Ein-Facetten-Link ist automatisch ein gültiger Mehrfach-Link. Statistics-Boards, HomeSearch/PodcastsSearch-Navigation und Buchseiten brauchten **keine** Änderung.
- **Chip-Reihenfolge = Katalog-Frequenz absteigend**, nicht `facet_values.display_order`. Grund: `displayOrder` müsste durch `BrowseFacet` + Wire + persistenten Data Cache gefädelt werden (alte Cache-Einträge einer früheren Deploy-Generation hätten das Feld nicht); Frequenz ist aus den vorhandenen Daten ableitbar, selbstpflegend und **stabil während des Filterns** — bei Selektion ändern sich nur die angezeigten Counts, nie die Chip-Positionen (kein Springen unter dem Cursor).
- **Count-Semantik:** Zahl der Register-Treffer, die dieser Chip unter q/Faction/Format **und den Selektionen der anderen Kategorien** hätte (die eigene Kategorie ist ODER — sie drosselt ihre eigenen Chips nicht, sonst zeigten Zweit-Chips unmögliche Zahlen). Null = Sackgasse von hier aus → gedimmt, bewusst klickbar (Antwort ist der ehrliche Empty-State, keine verschwundene Option). Ein Pass über den Katalog (O(Bücher×Facetten), ~15k Zuweisungen — im Speicher trivial).
- **Unbekannte (aber pattern-valide) IDs** bilden eine eigene UND-Gruppe → filtern auf 0 Treffer, exakt das Verhalten des alten Einzel-Params; sie bleiben als entfernbarer Chip sichtbar.
- **Ein „Filters"-Aufklapper statt Akkordeon-Zeile** (Review-Runde 2; Runde 1 hatte erst eine offene Rail, dann ein Sechs-Köpfe-Akkordeon): das ganze Verfeinerungs-Element — inklusive der Faction/Format-Dropdowns — faltet hinter einen Trigger; die Seite öffnet mit einer einzigen konstanten Kontroll-Zeile. Im offenen Ledger sind alle Gruppen gleichzeitig sichtbar (kein Klick-pro-Kategorie beim Kombinieren). Panel-State nicht URL-gespiegelt (Browsing-Ergonomie, nicht Teil der teilbaren Ansicht); Auswahl bleibt bei geschlossenem Panel über die goldene Trigger-Zahl + Census sichtbar.
- **Layout-Shift + Zentrierung in einem Zug gelöst** (Runden 2+3): Der erste Fix (`visibility: hidden`-Reservierung für „Clear all") tilgte zwar den Shift, ließ die sichtbare Gruppe aber asymmetrisch links der Mitte sitzen. Endzustand: „Clear all" ist ein **Server-Link in der Census-Zeile** (deren Text sich mit jedem Result-Set ohnehin ändert — dort stört ein erscheinendes Glied nicht), die Kontroll-Zeile besteht nur noch aus zustandslosen Teilen und zentriert exakt.
- **Sort-Richtungs-Toggle als Contract-Erweiterung, nicht als eigener `dir`-Param:** vier `sort`-Werte, die alten zwei behalten ihre Bedeutung → jeder existierende Link sortiert wie bisher; der Pager braucht weiter nur `sort !== "title"`. Label wechselt mit der Richtung („Newest"↔„Oldest") statt eines Pfeil-Glyphen — dezenter.
- **Hopepunk + Satirical kuratiert raus** (Philipp, Runde 2): als `PANEL_EXCLUDED_FACETS` im Contract, nicht in den Daten — die IDs bleiben gültige Filter (Suche/Alt-Links zeigen sie als entfernbaren „Other"-Chip), sie werden nur nicht mehr als Chips angeboten.
- **Deselektion sichtbar gemacht:** Der Re-Klick-Toggle war von Anfang an im Contract, hatte aber keine Affordanz — aktive Chips tragen jetzt ein × (Spiegel des Summary-Chips).

## Verification

- `test-archive-browse` 18 Tests grün (7 neue); voller `npm test`-Lauf nach Runde 1: alle 41 Suiten grün; `npx tsc --noEmit` pass; `npm run lint` pass.
- Funktions-Checks gegen den laufenden Dev-Server (Manual-verify-Regel, kein Sweep): `/archive` 200, SSR zeigt die Kontroll-Zeile mit `Filters aria-expanded="false"`, `browse-clear is-idle` und **kein** Ledger im initialen Dokument; „Satirical"/„Hopepunk" kommen in der gesamten Seiten-Payload **0×** vor (auch aus den Island-Props raus); Kombi-Link `?facet=grimdark&facet=war_story&facet=series_start` → **75 · found / 896** (UND über drei Kategorien); `?facet=ensemble` (Off-Panel-Kategorie) → 112 Treffer + entfernbarer „Protagonist Gender: Ensemble"-Chip. Klick-/Mobile-Verhalten: Abnahme durch Philipp im Browser.
- **S6-Messwerte neu erhoben** (Dev-Server-HTML, SSR + inline RSC-Flight): `/archive` unfiltered 354.321 Bytes (~346 KB); das geschlossene Ledger kostet im SSR-HTML nur die Kontroll-Zeile, die Gruppen-Daten reisen als Island-Props im Flight (~5 KB) — **Zuwachs ≲ 6 KB**, weit im Budget. Data-Cache-Wire unverändert (kein Shape-Change; Size-Test bei bestehendem 1,5-MB-Budget grün, ~0,5 MB).

## Open issues / blockers

- **Geparkte vista-retire-Änderungen:** Beim Session-Start lagen uncommittete Änderungen der Session `codex/product-vista-retire` (kein Commit, kein PR) im Working Tree. Sie sind in einem Stash gesichert: `git stash list` → „vista-retire WIP geparkt vor WA-B1 (2026-07-20)"; Wiederherstellung auf dem vista-retire-Branch via `git stash pop`. Die untracked `zones-draft-backup-2026-07-18.json` liegt unangetastet im Tree.
- In DB und Seed-Katalog steht `content_warning.visible_to_users = true` — falls die Spalte je der alleinige Gate werden soll (und `isVisibleFacetCategory` fallen darf), muss sie vorher auf `false` geflippt werden (Batches-Einzeiler + Seed-Katalog-Update).

## For next session

- v2-Rail-Kandidaten, wenn die sechs Gruppen sich bewähren: `scope` (6 Werte) und `protagonist_class` (11 Werte, ggf. als eigene aufklappbare Zeile); `protagonist_gender` je nach Urteil.
- Reddit-Antwort-Muster jetzt möglich: „Grimdark + Standalone" = `https://…/archive?facet=grimdark&facet=standalone` — ggf. eine kleine „Link kopieren"-Affordanz an der Rail erwägen (nicht gebaut, kein Auftrag).

## References

- Launch-Prompt WA-B1 (docs/werkstatt-roadmap.md § 11) · WA-Urteil Session 241
- S6-Pagination/Payload-Kontext: `src/app/archive/filters.ts` Kopfkommentare, `scripts/test-archive-browse.ts`
