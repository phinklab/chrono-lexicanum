---
session: 2026-07-12-202
role: implementer
date: 2026-07-12
status: complete
slug: launch-s4-canonical-routes
parent: docs/launch-master-plan.md § Session 4 + Anhang A (E8-Prompt-Betrieb, kein per-Session-Brief)
links:
  - docs/launch-master-plan.md
commits: []
---

# Launch S4 — Kanonische Routen & Book-ISR

Worktree: `chrono-lexicanum` (Koordination, E8-Ausnahme) · logischer Strang:
Product · Branch: `codex/product-canonical-routes` (frisch von `origin/main`
@ a8b32b7, S3b gemerged).

## Summary

URL-Matrix aus Anhang A vollständig umgesetzt (EN-Entity-Routen inkl. Audit,
EN-Compendium-Slugs, `/ask/faction`, Modal-Intercepts 1:1, 16 unbedingte
308-Redirects mit Query-Durchreichung), `/api/revalidate` auf die neuen Pfade
gezogen, und `/buch/[slug]` → `/book/[slug]` ist jetzt SSG/ISR (Region-State
als Client-Island, kein `headers()`/`searchParams`-Treiber mehr; Build zeigt
`● /book/[slug]`). **Wichtigste Punkte für Cowork/Philipp:** (1) Die
committeten Snapshot-Entity-Artefakte tragen noch eingebackene `/buch/`-Hrefs —
bis zum S4b-Regen decken die 308er das ab, S4b muss zusätzlich die
Href-Literale im Exporter mitziehen (Liste unten). (2) `/book/[slug]` bekommt
KEINEN Path-Purge in `/api/revalidate` — der `books`-Tag deckt die neue
ISR-Seite ab (A.4-Verifikation, Begründung im Route-Header). (3) Die
IP-Geo-Region (`x-vercel-ip-country`) entfällt bewusst zugunsten der
Browser-Sprache — der akzeptierte Preis der statischen Buchseite.

## What I did

**Routen-Renames (git mv, History erhalten):**

- `src/app/buch → book` (inkl. `[slug]/audit`, `loading.tsx`),
  `charakter → character`, `fraktion → faction`, `welt → world`;
  `@modal/(.)buch|charakter|fraktion|welt → (.)book|character|faction|world`;
  `ask/fraktion → ask/faction`. `/person` bleibt (deckt Autoren UND Sprecher).
- `src/app/fraktionen/page.tsx` + `loading.tsx` gelöscht — der Kurzweg ist
  jetzt eine next.config-308 direkt auf `/compendium/factions` (vorher
  Page-Level-`redirect()` = 307 mit Doppel-Hop-Risiko). `loader.ts`/`filters.ts`
  bleiben als Modul-Heimat des Faction-Guides unter `src/app/fraktionen/`
  liegen (kein page.tsx ⇒ nicht routbar): `scripts/build-snapshot.ts` +
  Contract-Tests importieren exakt diesen Pfad — Verschieben wäre cross-strand
  (S4b kann es mitnehmen). Header beider Dateien erklären das.

**Redirects (`next.config.ts`):** 12 neue Zeilen per A.2 — `/buch/:slug`
(+`/audit`), `/charakter`, `/fraktion`, `/welt`, die 5 Compendium-Kategorien,
`/fraktionen` (Ziel-Update, ein Hop), `/ask/fraktion/:path*` (matcht auch den
nackten Pfad). Alle `permanent: true` (=308), keine Destination schreibt eine
eigene Query (Next reicht den Querystring verbatim durch — `?store=`,
`?alignment=` etc. überleben). Bestand (`/buecher`, `/werke`, `/podcasts*`)
unverändert.

**URL-Contract-Module:**

- `src/lib/entity/types.ts` — `TYPE_TO_ROUTE` → `/character` `/faction`
  `/world` `/person`; `TYPE_TO_COMPENDIUM` → EN-Kategorie-Slugs.
- `src/lib/compendium/categories.ts` — die fünf Slugs → `factions · primarchs
  · characters · worlds · authors`.
- `src/lib/compendium/loader.ts` — Item-Hrefs, `loadCategoryItems`-Dispatch,
  `loadCompendiumCounts`-Keys (alle Konsumenten keyen über `c.slug` —
  verifiziert, kein Literal-Zugriff).
- `src/app/archive/filters.ts` — die vier `*FocusHref`-Helfer auf EN-Slugs.
- `src/lib/work-links.ts` — `workHref("book")` → `/book/…`.
- `src/app/compendium/page.tsx` — `statLine`-Switch auf EN-Slugs.

**Touchpoints (A.5) + interner Link-Sweep:** `src/proxy.ts`
(`isAdminPath`-Regex → `/book/*/audit`) · `src/app/timeline/page.tsx`
(Legacy-`?book=` → `/book/<slug>`) · `DetailModal` (`DETAIL_PREFIXES`,
Book-Hop-Erkennung) · `EntityBackLink` (via `TYPE_TO_COMPENDIUM`) ·
`HomeSearch`/`PodcastsSearch`/`WerkeFilters`/`BrowseSearch` (navigate-Ziele) ·
`HomeExplore` (5 Kategorie-Hrefs) · `ResultCard`/`FactionPickPanel` (Ask-Picks)
· `AskToolTabs` (`/ask/faction`) · `WorldPanel` (Buch-/Welt-Links) ·
`PodcastEpisodeArchive` (Faction-Chips) · `archive/page.tsx` (Row-Links +
`?focus`-Opener) · Audit-Seite (3 Links; Metadata-Titel „Buch-Audit" →
„Book Audit") · Entity-/Modal-Seiten (absorbed-Twin-Redirects auf
`/character/…`). Dazu Kommentar-Sweep über src (inkl. CSS-Kommentare in
59-entity/61-browse; `63-fraktionen.css` bleibt unangetastet — S7a löscht sie).

**`/api/revalidate`:** `ENTITY_ROUTES` → `/character|world|faction|person/
[slug]`. `/book/[slug]` bewusst NICHT ergänzt (A.4): `loadBook` liest durch
die getaggte `cachedRead`-Schicht (`books`-Tag, loadBook.ts:166-170), die
Route ist neu in S4 ⇒ jede gecachte Render-Instanz postdatiert den Tag; die
„pages rendered before the tag existed"-Begründung des Entity-Path-Purge
greift hier nicht. Im Route-Header dokumentiert.

**Book-ISR:**

- `src/components/book/StoreActions.tsx` (NEU, Client-Island) — Region-Auflösung
  im Browser: `?store=`-Override (via `useSearchParams`) → `navigator.languages`
  (gleiche Tabelle/Präzedenz wie das alte Accept-Language-Parsing) →
  `DEFAULT_REGION` (US). Browser-Read über `useSyncExternalStore` mit No-op-
  Subscribe + `null`-Server-Snapshot (hydration-sicher, kein
  setState-in-effect — die naive Effect-Variante schlug im Lint).
- `src/lib/store-links.ts` — pure Helfer `normalizeStoreRegion` +
  `regionFromLanguageTags` ergänzt (das Modul ist bewusst next-frei/client-safe).
- `src/lib/store-region.ts` GELÖSCHT (beide Konsumenten umgestellt; kein
  weiterer Import).
- `src/components/book/BookDetailView.tsx` — `region`-Prop raus; Acquire-Block
  rendert `<StoreActions>` in `<Suspense>`, Fallback = `<BuyListenActions
  region={US}>` — die prerenderte Shell und No-JS-Besucher behalten
  funktionierende Store-Links.
- `src/app/book/[slug]/page.tsx` — `searchParams` + `resolveRegion` raus;
  `dynamicParams = true`, `revalidate = 86400` (Entity-Muster),
  `generateStaticParams` → `[]` mit S4b-Vormerkung (siehe unten).
- `@modal/(.)book/[slug]/page.tsx` — ebenfalls region-frei; `?store=` wirkt im
  Modal identisch über die Island.

**Smokes:** `scripts/test-canonical-routes.ts` (NEU, DB-frei, auto-discovered
von `npm test`) — 9 Checks: A.2-Tabelle vollständig/308/unbedingt ·
Query-Regel (keine Destination-Query) · keine Redirect-Ketten (Destination ∩
Source = ∅ ⇒ `/fraktionen` landet in einem Hop) · Routen-Ordner EN da/DE weg ·
Intercepts 1:1 · purer URL-Contract (TYPE_TO_ROUTE/COMPENDIUM ↔ Kategorien
driftfrei) · Book-SSG-Contract (revalidate + generateStaticParams, kein
searchParams/headers()/force-dynamic im Code) · Timeline-`?book=`-Ziel ·
**Alt-Link-Grep als ausführbare Invariante** (kein Alt-Pfad-Literal in
src/**). Bestehende Suiten nachgezogen: `test-revalidate-route.ts`
(Pfad-Asserts), `test-search-index.ts` (Focus-Hrefs).

## Decisions I made

- **IP-Geo entfällt, Browser-Sprache übernimmt.** `x-vercel-ip-country` hat
  kein Client-Äquivalent ohne Extra-Request; `navigator.languages` ist ohnehin
  das bessere Store-Signal (englischer Browser in Berlin will i. d. R. den
  .com-Store). Wer explizit wechselt, hat `?store=` — der Switcher-Contract
  ist unverändert.
- **Suspense-Fallback = US-Actions statt Skeleton** — die statische Shell und
  No-JS-Besucher bekommen echte (Default-)Links statt einer Lücke.
- **`buildStoreUrl` läuft jetzt im Client-Bundle** (das Modul kündigt das
  selbst an: „stays pure so it can be exercised from … a client island").
  Folge: der `STORE_AFFILIATE_TAGS`-Env-Override würde client-seitig nicht
  greifen (kein `NEXT_PUBLIC_`). Affiliate ist heute AUS; wenn es kommt, den
  In-Code-Map-Pfad nutzen oder die Var public machen — Notiz reicht, kein
  Blocker.
- **`generateStaticParams` → `[]` statt Hot-Subset:** der committete Snapshot
  hat noch keine Buch-Projektion; ein Build-Prerender würde ~900
  `loadBook`-Reads in die DB fächern und das DB-freie-Build-Gate brechen.
  ISR-on-demand erfüllt das „prerendert/ISR"-Kriterium; S4b liefert das
  snapshot-gestützte Hot-Subset (Kommentar an Ort und Stelle).
- **`/fraktionen`-Redirect von Page-`redirect()` (307) auf config-308
  umgestellt** — A.2 verlangt 308 für jede Zeile; nebenbei entfällt der
  Doppel-Hop-Pfad und die tote Page.
- **`src/app/fraktionen/{loader,filters}.ts` NICHT verschoben** — Batches-
  Skripte importieren den Pfad (Strand-Reinheit E7); als S4b-Option notiert.
- **Kein `/book`-Path-Purge in `/api/revalidate`** (A.4-Verifikation, s. o.).
- **Audit-Metadata-Titel mit-migriert** („Book Audit") — Admin-Fläche, aber
  „durchgehend englisch" gilt; einziger sichtbarer Copy-Change der Session.

## Verification

- `npx tsc --noEmit` — grün (nach `next build`; der erste Lauf schlug auf dem
  bekannten stalen `.next/types`-Validator fehl, Memory-Muster).
- `npm run lint` — grün (nach `useSyncExternalStore`-Umbau).
- `npm test` — 38/38 Suiten grün, inkl. neuer `test-canonical-routes.ts`.
- `npm run build` — zweimal grün (2,3 s Compile, 157 statische Seiten aus dem
  Snapshot); Routentabelle zeigt `● /book/[slug]` (SSG), `ƒ /book/[slug]/audit`
  (dynamisch, korrekt — Admin), alle `(.)`-Intercepts auf den EN-Segmenten,
  `/ask/faction` mit allen 45 statischen Knoten.
- Alt-Link-Grep: als Test-Assert kodiert (kein `/buch/`-, `/charakter/`-,
  `/fraktion/`-, `/welt/`-, DE-Kategorie- oder `/ask/fraktion`-Literal in
  src/**); manuell gegengeprüft — Rest-Treffer sind ausschließlich
  Modul-Pfade (`@/app/fraktionen/*`), Snapshot-Artefakt-Keys
  (`charaktereRows` …), deutsche Rechtstext-Prosa (imprint/privacy) und der
  tote `63-fraktionen.css`-Import.
- Redirects inkl. Query: per Config-Contract-Test abgedeckt (308-Flag,
  Query-Regel, Ketten-Freiheit); Klick-/URL-Abnahme im Browser macht Philipp
  (Dev-Server läuft, s. u.).

## Open issues / blockers

Keine Blocker. Nicht in diesem PR (bewusst):

- **Snapshot-Artefakte tragen `/buch/`-Hrefs** (z. B. 90× in
  `entities/faction/ultramarines.json`) — prerenderte Entity-Seiten linken bis
  zum S4b-Regen auf Alt-Pfade; die 308er fangen das ab (ein Hop, kein Bruch).
- **Batches-seitige Alt-Pfad-Literale** (S4b-Paket, ein Batches-PR):
  `scripts/build-snapshot.ts` (Buch-Href-Literal in der Entity-Projektion muss
  auf `/book/` — sonst friert der Regen die alten Links wieder ein!) ·
  `scripts/runbooks/content-release-runbook.md:146-147` (Smoke-Beispielpfade)
  · Mock-Payload in `scripts/test-release-revalidate.ts:111` (kosmetisch).

## For next session (S4b-Mini, Batches)

1. Exporter um die **Buch-Projektion** erweitern (`loadBook`-Shape) + Manifest;
   `/book/[slug]/generateStaticParams` auf das snapshot-gestützte Hot-Subset
   umstellen (Entity-Muster `listHotEntityIds`).
2. Beim Regen die o. g. `/buch/`-Href-Literale im Exporter fixen — danach
   verschwinden die letzten Alt-Links aus den committeten Artefakten.
3. Optional: `src/app/fraktionen/{loader,filters}.ts` in eine neutrale
   Modul-Heimat ziehen (Import-Pfade in build-snapshot/test-build-snapshot/
   test-loader-error-contract hängen daran).
4. Runbook-Smoke-Pfade (content-release-runbook) auf EN-Routen.

## References

- `docs/launch-master-plan.md` § Session 4 + Anhang A (verbindliche Spec).
- Next.js Doku: `redirects()` (permanent ⇒ 308, Query-Pass-Through-Default),
  `useSearchParams`-Bailout + Suspense, `useSyncExternalStore`-Muster für
  client-only Snapshots, `dynamicParams`/`revalidate`-Segment-Config.
