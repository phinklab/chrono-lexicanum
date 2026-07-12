---
session: 2026-07-12-205
role: implementer
date: 2026-07-12
status: complete
slug: launch-s6-archive-payload
parent: docs/launch-master-plan.md § Session 6 (E8-Prompt-Betrieb, kein Architect-Brief)
links:
  - docs/launch-master-plan.md
commits: []
---

# Launch S6 — Such- & Archive-Payload

## Summary

Der Suggestions-Blob ist aus dem initialen Flight aller drei Routen raus (3.391 serialisierte Einträge → **0**; der Index kommt jetzt lazy per `GET /api/search-index` beim ersten Fokus/Tippen), das Archiv ist serverseitig paginiert (100 Zeilen/Seite, Suche/Filter/Counts/Facets unverändert über den **ganzen** Katalog), und der Browse-Katalog liegt nicht mehr als 2,05-MB-Blob im per-Instanz-Memory-Cache, sondern als **0,48-MB-normalisierter Wire-Entry im persistenten tagged Data Cache**. Messbar: `/archive` **1.984 KB → 293 KB** HTML (−85 %), Home **706 KB → 140 KB** (−80 %), Podcasts **714 KB → 148 KB** (−79 %). E3 steht: gefilterte Ankünfte (q/Facet/Format/Author/focus/page) landen am Ergebnisbereich, organische Besuche behalten den Hero.

## Messwerte (Prod-Build lokal, `next start`, PREVIEW_GATE=off)

| Route | HTML raw vorher → nachher | gzip vorher → nachher |
|---|---|---|
| `/` | 705.622 → 140.114 B (−80 %) | 126.072 → 22.586 B |
| `/archive` | 1.984.259 → 293.212 B (−85 %) | 281.014 → 46.764 B |
| `/archive/podcasts` | 713.520 → 147.995 B (−79 %) | 127.682 → 24.277 B |
| `/archive?q=fabius` | 710.243 → 145.140 B (−80 %) | 128.792 → 29.171 B |

- RSC-Flight (`RSC: 1`-Header): `/archive` 1.292.919 → 153.813 B; `/` 572.974 → 67.004 B.
- Suggestions-Marker (`kind\":\"`) im initialen HTML: vorher 3.391 (Home), nachher **0 auf allen drei Routen** (Acceptance „kein Suggestions-Blob im initialen HTML/RSC irgendeiner Route").
- `GET /api/search-index`: 505.952 B raw (3.391 Einträge: 896 book · 1.118 podcast · 366 faction · 570 character · 242 world · 108 author · 64 facet · 18 primarch · 9 format), ISR-prerendered (`x-nextjs-cache: HIT`), `Cache-Control: public, max-age=300`. Der Plan-Stand „3.096 ≈ 466 KB" ist schlicht mit dem Katalog gewachsen.
- Browse-Cache-Entry: flat minified **2,05 MB** @ 896 Bücher (über dem 2-MB-Cap — deshalb lag er im Memory-Cache); nach dem 7-Felder-Schnitt flat 1,73 MB (nur ~13 % Abstand, wächst weiter — verworfen); **normalisiert 0,48 MB** (~4× Sicherheitsabstand). Test-Budget 1,5 MB schlägt in CI an, bevor das Limit real wird.
- Initialer Archive-DOM: exakt 100 Registerzeilen/Seite (Seite 1: 100, Seite 9: 96) statt 896.

## What I did

**Suggestions lazy (Punkt 1):**

- `src/app/api/search-index/route.ts` (neu) — GET, `revalidate = 3600`, statisch prerendered aus dem Snapshot (S1b-Fassaden), innere Loader tragen die Catalogue-Tags → `POST /api/revalidate` refresht die Route mit; `Cache-Control: public, max-age=300` für Browser-Wiederverwendung innerhalb einer Session.
- `src/lib/search-index.ts` — `loadUnifiedSearchIndex` → `loadSearchSuggestions()` (Suggestions-only; einziger Consumer ist die API-Route). Die Seiten holen Bücher/Podcast-Counts wieder direkt bei `loadBrowseBooks`/`loadPodcastSearchIndex`.
- `src/components/browse/BrowseSearch.tsx` — `index`-Prop entfernt; modulweiter Fetch-Cache (ein Fetch pro SPA-Session, geteilt von allen drei Konsolen; Fehlschlag räumt den Slot → nächster Fokus retryt), Laden bei `onFocus`/`onChange`; **Ranking memoized** (`useMemo` über `[index, value]`); Dropdown-/Status-Zustände „Consulting the index…" (lädt) und „Suggestions unavailable — press Enter…" (Fehler) — der Freitext-Pfad (Enter → server-seitiges `q`) hängt nie am Index.
- `HomeSearch`, `PodcastsSearch`, `WerkeFilters` + die drei Pages — Index-Prop/`searchIndex`-Verdrahtung entfernt.

**Server-Pagination + tote Felder (Punkt 2):**

- `src/app/archive/filters.ts` — `page`-Param (parst defensiv auf 1), `WORKS_PAGE_SIZE = 100`, `paginateWorks()` (purer Slice NACH Filter+Sort über den vollen Katalog; Out-of-range clampt auf letzte/erste Seite statt leeres Register), `pagerItems()` (≤ 7 Seiten voll, sonst Fenster mit Ellipsen).
- `src/app/archive/page.tsx` — filtert/zählt/facettet weiter über den ganzen Katalog, rendert nur die Registerseite (Zeilennummern laufen über Seiten weiter); Census „N · found / M works · page X of Y"; `CataloguePager` als server-gerenderte `<Link>`s mit `#archive-results`-Hash (nativer Anker-Scroll → Pager-Schritt landet an den Zeilen, nicht am Hero; URL-first, Back/Forward-stabil); `?focus` unverändert über `bookSlugById` (Liste/Seite-unabhängig).
- `BrowseBook` um die 7 toten Felder erleichtert (`synopsis`, `coverUrl`, `startY`, `endY`, `pageCount`, `eraId`, `seriesIndex`) — in `loader.ts`, `loader-live.ts` (inkl. DB-Projektion: Spalten werden gar nicht mehr selektiert) und `scripts/build-snapshot.ts` (s. Decisions). `seriesName`/`eraName` bleiben (Suche; `eraName` null-tolerant).
- `src/app/archive/WerkeFilters.tsx` — jeder Filter-/Sort-/Query-Commit löscht `page`.
- `src/app/styles/31-catalogue.css` — `.catalogue-pager` in der Census-Vokabel (mono, Hairline, tabular-nums, Gold fürs offene Blatt, coarse-pointer-Padding).

**Prefetch (Punkt 3):**

- `WorkRow`-Links: `prefetch={false}` — vorher hätte Durchscrollen des Registers bis zu 896 `/book`-Viewport-Prefetches gefeuert; das Modal öffnet on demand hinter dem Route-Progress-Beam. Pager-/Mode-Toggle-Links behalten den Default (wenige, wahrscheinliche Ziele).

**Persistenter tagged Cache (Punkt 4):**

- `src/app/archive/browse-wire.ts` (neu, pur) — `compactBrowse`/`inflateBrowse`: Factions/Facets werden in per-Katalog-Dictionaries normalisiert (225 Factions, 64 Facets statt per-Buch-Duplikate), Bücher referenzieren per id (+ per-Buch-`role`). Inflate ist fail-loud bei unbekannter Referenz (S2: korrupter Cache-Entry wirft, statt still falsch zu rendern).
- `src/app/archive/loader.ts` — `loadBrowseBooks` von `memoryCachedRead` auf `cachedRead(["browse-books-wire"], tags: ["archive","books"])` über die Wire-Form; **eine** fixe Cache-Key, Inflate per React-`cache()` einmal pro Request. Build-Pfad (Snapshot) unverändert.
- Docstrings nachgezogen: `db-cache.ts`, `memory-cache.ts` (Memory-Cache ist jetzt ask-only), `/api/revalidate`-Header.

**E3 (Punkt 5):**

- `src/components/archive/ArchiveArrival.tsx` (neu) — Mount-Island: bei Ankunft mit `q`/`faction`/`format`/`facet`/`focus`/`page>1` **und** Viewport am Top instant zu `#archive-results` (Konsole + Census + Register); Browser-Scroll-Restore (Reload/History) gewinnt bewusst; organische Besuche unberührt. Pager-Schritte laufen über den Anker-Hash, nicht über die Island.

**Tests:**

- `scripts/test-archive-browse.ts` (neu, 11 Cases, DB-frei, läuft im `npm test`-Aggregat) — Page-Param-Parsing, Slice-/Clamp-/Naht-Verhalten, Pager-Fenster, **Wire-Roundtrip verlustfrei über den echten committeten Katalog**, 1,5-MB-Größenbudget als CI-Frühwarnung, fail-loud-Inflate.
- `scripts/test-loader-error-contract.ts` — Label aktualisiert + neuer Warm-Pfad-Case: geseedeter Wire-Entry inflatet zu `BrowseData`.

## Decisions I made

- **Normalisierte Wire-Form statt „Felder kürzen und hoffen".** Nach dem 7-Felder-Schnitt wäre der flache Entry 1,73 MB — 13 % unter dem 2-MB-Cap bei wöchentlich wachsendem Katalog ist kein „Sicherheitsabstand". Die Normalisierung (0,48 MB) ist gemessen, nicht geraten (Leitplanke 4), bleibt komplett im Cache-Layer (kein Consumer sieht sie) und hat einen CI-Wächter.
- **Pager-Scroll per `#archive-results`-Hash, E3-Ankunft per Island.** Erste Fassung hatte die Island auch Pager-Schritte scrollen lassen; das hängt am Remount-Verhalten der Loading-Boundary bei searchParams-Navigation (Framework-Interna). Der Anker-Hash ist deterministisch, funktioniert bei Hard- und Soft-Nav und macht jeden Pager-Schritt zu einer teilbaren URL. Die Island behält nur den Ankunftsfall — mit `scrollY < 4`-Guard, damit Browser-Scroll-Restauration (Reload, bfcache) nie überstimmt wird.
- **`WORKS_PAGE_SIZE = 100`** → 9 Seiten bei 896 Büchern. DOM-Deckel und HTML-Budget sind erfüllt, gefilterte Sichten (der Normalfall) bleiben fast immer einseitig. Die „Seite-12"-Stichprobe des Plans heißt hier „Seite 9" (tiefste Seite).
- **Suggestions-Route ISR statt dynamisch** — gleiche Frische-Semantik wie Home/Podcast-Index (Build aus Snapshot, stündlich, tag-invalidierbar). Bewusst KEINE per-Query-Suggest-API (begrenzte Key-Kardinalität, Ranking bleibt client-pur und pro Keystroke ohne Netz).
- **Fetch-Cache im Modul von `BrowseSearch`** statt eigenem Hook/Context — ein Consumer-Modul, drei Einbauorte; ein separates Abstraktionsmodul wäre Slop (Leitplanke 1/2).
- **Pfad-Ausnahme `scripts/build-snapshot.ts` (Batches-Pfad, ~15 Zeilen):** Der Exporter annotiert seine Browse-Projektion mit `BrowseBook[]`; nach dem Typ-Schnitt schlägen Excess-Property-Checks im Typecheck-Gate fehl — der Schnitt ist ohne diese Datei nicht mergebar. Analog zur deklarierten S1a-package.json-Ausnahme hier deklariert statt in einen eigenen „Mini-PR" gezwungen, der allein nicht grün wäre. Die neuen/angepassten `scripts/test-*.ts` folgen dem S2-Präzedenz (Product-Sessions liefern ihre DB-freien Suiten ins Aggregat).
- **`scripts/snapshot-data/browse-books.json` NICHT regeneriert** — Snapshot-Regen ist per E4 ein Content-Release (eigener Snapshot-PR = Deploy). Der committete Artifact trägt die 7 toten Felder bis zum nächsten Release mit; `compactBrowse`/alle Consumer picken Felder explizit, der Build toleriert die Extras (im Test dokumentiert). Der Exporter schreibt sie ab jetzt nicht mehr.
- **`/api/search-index` bleibt hinter dem Preview-Gate** (Proxy-Matcher unangetastet): Same-Origin-Fetch schickt den Preview-Cookie mit, eingeloggte Preview-Besucher bekommen den Index; nach Gate-off ist die Route öffentlich, `robots.txt` (S5) disallowt `/api/` bereits.

## Verification

- `npm run typecheck` — grün · `npm run lint` — grün · `npm test` — **39 Suiten grün** (inkl. neue `test-archive-browse` mit 11 Cases) · `npm run build` — grün (Route-Tabelle unverändert; `/archive` ƒ, Home/Podcasts ○ 1h).
- Payload-Messung vorher/nachher einmalig per curl gegen den lokalen Prod-Build (Tabelle oben); Server-Log ohne Errors/unhandledRejections (der frühere 2-MB-Set-Fail-Pfad ist weg).
- Stichprobe tief paginiertes Buch („The World Engine", Seite 9 von 9): `/archive?q=The World Engine` → „1 · found" + Row-Link; `/archive?focus=18e19b9a-…` → Focus-Opener auf `/book/the-world-engine` im HTML; `/archive?page=9` → Zeile gerendert. Serien-Suche `?q=Eisenhorn` → „4 · found / 896 works" (ganzer Katalog, nicht Seite). Clamp: `?page=99` → „page 9 of 9". Faction-/Facet-Optionen weiter aus dem vollen Katalog (Code-Pfad unverändert, s. page.tsx).
- `/api/search-index`: 200, gültiges `Suggestion[]` (Kind-Verteilung oben), `x-nextjs-cache: HIT`.
- **Nicht von mir verifiziert (Browser-Abnahme Philipp):** E3-Landung sichtbar ohne manuelles Scrollen, Pager-Gefühl, Typeahead-UX inkl. „Consulting the index…"-Moment, Back/Forward-Verhalten. Der ungegatete Prod-Server lief zuletzt auf :3000 (`PREVIEW_GATE=off npm run start`); vor einem `npm run dev` bitte beenden (Doppel-Server-Falle).

## Open issues / blockers

- Keine Blocker. Erst beim nächsten Content-Release schrumpft auch der committete `browse-books.json` (Exporter schneidet die Felder ab jetzt).
- Beobachtet, nicht angefasst: `BrowseData.eras` hat außer dem Loader selbst keinen src-Consumer mehr (Era ist weder Filter noch Spalte). Kandidat für einen späteren bewussten Schnitt — Exporter-Counts/Era-Parity hängen dran, gehört in einen Batches-Kontext.
- `WerkeFilters`-Commits tragen ein vorhandenes `focus`-Param weiter (Bestand, nicht S6); Pager-Links droppen es bewusst.

## For next session

- S7a (CSS, Fonts, Hero-LCP) laut Plan; die S6-Zahlen liefern die frische RSC-/HTML-Baseline (Home 140 KB raw / 22,6 KB gzip).
- UI-Feinschliff am Pager, falls Philipps Auge etwas findet → `docs/ui-backlog.md`-Pfad.

## References

- Next.js Docs: `unstable_cache` (2-MB-Entry-Limit), Route Handlers + ISR (`revalidate` bei statischen GET-Handlern), `Link`-`prefetch`-Semantik im App Router.
- Messbasis: committeter Snapshot (896 Bücher, 2026-07-12) + lokaler Prod-Build.
