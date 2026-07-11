---
session: 2026-07-11-196
role: implementer
date: 2026-07-11
status: complete
slug: launch-s1a-snapshot-exporter
parent: null
links:
  - 2026-07-11-195
  - 2026-07-11-194
commits: []
---

# Launch S1a (Code-PR) — Snapshot-Exporter, Manifest, Era-Fix, Release-Runbook

## Summary

Alle vier S1a-Deliverables sind implementiert und lokal belegt: der fail-closed,
deterministische Snapshot-Exporter (`npm run snapshot:regen`, Doppellauf gegen
die unveränderte DB ⇒ **byte-identisch**, inkl. Manifest-Timestamp-Carry-forward),
der Era-Fix im Apply-Pfad (Pauschalstempel raus, purer Bucket-Helper
`scripts/era-bucket.ts`, Equivalence-Gate weiter leer), das zweistufige
Content-Release-Runbook (E4) und der eine erlaubte `package.json`-Eintrag.
**Kein Produktions-Write, keine committeten Artefakte** — die lokal erzeugten
Snapshot-Dateien wurden nach dem Determinismus-Beweis gelöscht; die
Era-Invariante materialisiert erst der erste `db:sync` der Folgesession
„S1a-Snapshot". Wichtigster Befund unterwegs: die Migrations-Head-Parität wäre
mit striktem Byte-Hash **fälschlich rot** gewesen — 7 der 16 in der DB
registrierten drizzle-Hashes sind die LF-Variante von .sql-Dateien, die im
Windows-Checkout heute CRLF tragen; der Paritäts-Check ist deshalb bewusst
zeilenenden-tolerant (Inhalt zählt, echte Edits fallen weiter durch).

## What I did

**Era-Fix (Apply-Pfad):**

- `scripts/era-bucket.ts` (neu) — der EINE pure Helper: `deriveEraId(startY, eras)`
  (inklusive `[start, end]`-Buckets), `buildEraContext(book-dates × eras)` mit
  Drift-Guards (Dup-Slug / unbucketbarer startY ⇒ throw), `loadEraContext()`
  (committete Seeds, sync, DB-frei), `primaryEraIdFor(ctx, slug)` (keine
  book-dates-Zeile ⇒ `NULL`).
- `scripts/book-apply-shared.ts` — `M41_ERA_ID`-Konstante + Kommentarblock
  entfernt; `ComputedBookRows.bookDetails.primaryEraId: string | null`;
  `computeBookRows`/`applyBook` nehmen `eraCtx` als sechsten Parameter (Muster
  der Skip-Contexts); Header-Authority-Tabelle aktualisiert.
- `scripts/apply-book.ts` — lädt den Era-Context einmal pro Lauf (gilt für
  `--slug` wie `--all`); Header + `--help` aktualisiert.
- `scripts/equivalence-diff.ts` / `scripts/test-migration-equivalence.ts` —
  Call-Sites auf die neue Signatur; beide Seiten des Diffs nutzen denselben
  Era-Context (der Anker leitet sich aus dem beweisbar gleichen Slug ab, kann
  also nie Diff-Fläche werden). Gate weiter leer.
- `scripts/test-apply-book.ts` — der alte `M41_ERA_ID`-Assert ersetzt durch zwei
  `computeBookRows`-Tests (datierter Slug ⇒ Bucket, undatiert ⇒ `NULL`).
- `scripts/test-era-bucket.ts` (neu, läuft in `npm test`) — 9 Checks: jede
  inklusive Start-/End-Grenze der committeten `eras.json`, Nachbar-Eras teilen
  exakt bei `end`/`end+1`, kanonische Anker (30730 ⇒ great_crusade, 31001 ⇒
  horus_heresy, 41000/41999 ⇒ time_ending, 42000 ⇒ indomitus),
  Out-of-range ⇒ null, beide Drift-Guards, NULL-Fall, und die Dateninvariante
  über alle 97 book-dates-Zeilen (jede bucketet in eine bekannte Era; echte
  M41-Bücher behalten `time_ending`).
- Runbooks: `add-book-runbook.md` Schritt 8 (Bucketing + „book-dates-Zeile im
  selben PR, wenn Setting-Date bekannt"), `weekly-refresh-runbook.md` Punkt 4
  analog, `db-rebuild-runbook.md` § „Was die Apply-Pfade NICHT tun" (der
  „OQ-16(b) bleibt"-Satz war ab dieser Session faktisch falsch).

**Snapshot-Exporter (E1):**

- `scripts/snapshot-shared.ts` (neu) — die PURE Hälfte: Artefakt-Registry
  (`scripts/snapshot-data/`), deterministische Serialisierung (2-Space-JSON +
  Newline), sha256, Manifest-Typen, `resolveGeneratedAt` (Carry-forward),
  `parseManifest`, Plausibilitäts-Floors (`MIN_COUNTS` ≈ 50 % der am 2026-07-11
  read-only gemessenen Live-Counts), Era-Set-Parität DB↔`eras.json`.
- `scripts/build-snapshot.ts` (neu) — CLI (`--check-migrations`, `--help`,
  Default = Vollexport), Migrations-Head-Parität, und die Projektionen als
  wörtliche Transplantate der server-only Loader (je Block mit Quellzitat):
  `browse-books.json` (BrowseData), `podcast-index.json` (PodcastIndexShow[]),
  `podcast-search.json` (PodcastSearchData), `faction-guide.json` /
  `charaktere-rows.json` / `welten-rows.json` / `personen-rows.json`
  (Compendium-`cachedRead`-Quellschicht), `entity-hot-ids.json` + ein
  `entities/<type>/<id>.json` (EntityView) pro Hot-ID, `manifest.json`
  (generatedAt, Quell-Migrationsstand, Counts, sha256 pro Datenartefakt —
  hasht sich nicht selbst). Prune-Schritt entfernt verwaiste Dateien (z. B.
  eine Hot-ID, die die kuratierte Liste verlässt).
- `scripts/test-build-snapshot.ts` (neu, läuft in `npm test`) — 17 Checks:
  **neun Compile-Time-Shape-Contracts** (Exporter-Rückgabetyp ↔
  Loader-Rückgabetyp per `Equals<A,B>`-Mutual-Assignability, alles über
  `import type`, also ohne die server-only Module je zu laden), Serialisierung,
  Carry-forward-Fälle, Manifest-Parsing, Floors + Era-Parität + Hot-ID-Payload-
  Gate, `entityArtifactPath`, und der Wiring-Guard „package.json trägt exakt
  den einen `snapshot:regen`-Eintrag".
- `package.json` — genau ein Eintrag: `"snapshot:regen": "tsx
  --env-file=.env.local scripts/build-snapshot.ts"` (neben `atlas:regen`, dem
  mechanischen Zwilling). Keine Dependency, kein Lock-Diff.

**Release-Runbook (E4):**

- `scripts/runbooks/content-release-runbook.md` (neu) — Content-Freeze →
  read-only Migrations-Paritäts-Preflight (`--check-migrations`; Abweichung ⇒
  STOPP, keine improvisierte Migration) → explizites Go → genau EIN vollständig
  grüner `db:sync` (enthält `apply:book --all`; persons.json-Änderung ⇒ STOPP)
  → Snapshot auf frischem Batches-Branch + Prüfblock (Diff-Plausibilität,
  Manifest, Hot-ID-Stichprobe, Doppellauf ⇒ leerer Diff, Era-Dateninvariante)
  → Snapshot-PR = Deploy → **erst danach** Revalidation (bis S3a: manueller
  curl mit Bearer-Token, genau ein POST) + Live-Smoke; Fehlerfall-Tabelle;
  Sonderabschnitt für den ersten Lauf („S1a-Snapshot").

## Decisions I made

- **Compendium-Seam = `cachedRead`-Quellschicht, nicht die fertigen
  Suggestion-Arrays.** Snapshot enthält `FactionGuide[]` / `CharaktereRow[]` /
  `WeltenRow[]` / `PersonenRow[]`; alles darüber (`loadFactionItems`,
  `loadPrimarchSuggestions`, `loadCompendiumSearchSuggestions`, Counts) ist
  pur und bleibt zur Buildzeit lauffähig — verifiziert: `@/lib/aliases` und
  `@/app/archive/filters` sind DB-frei. S1b tauscht damit exakt vier
  Quell-Reads statt die Presentation-Builder zu forken.
- **`import type`-Regel operationalisiert:** Typen aus server-only Modulen
  ausschließlich type-only (Return-Typ-Annotationen = Compile-Contract);
  Runtime-Imports aus `src/**` nur für dokumentiert PURE Module + die
  DB-Schicht, die jedes Skript nutzt: `@/db/client`+`schema`,
  `@/lib/entity/hot-subset` (HOT_ENTITY_IDS), `@/lib/compendium/primarchs`
  (PRIMARCH_MERGES), `@/lib/entity/types` (kindLabel),
  `@/lib/facet-visibility`, `@/lib/work-links` (workHref/resolveEpisodeShows —
  kein `server-only`-Import, gegen den Code geprüft). Grund: genau diese
  kuratierten Konstanten dürfen keine zweite, driftende Kopie bekommen; die
  Duplikat-Fläche bleibt auf die Query+Transform-Körper beschränkt und endet
  in S1b.
- **Migrations-Parität ist zeilenenden-tolerant.** Befund: drizzle hasht rohe
  Dateibytes; 7/16 DB-Hashes entsprechen der LF-Variante von .sql-Dateien, die
  im Checkout CRLF tragen (git autocrlf-Historie; per Hash-Vergleich exakt
  verifiziert). Der Check akzeptiert pro Migration {raw, LF, CRLF}; Anzahl und
  Journal-Timestamps müssen zusätzlich exakt stimmen; ein echter Content-Edit
  fällt weiter durch. Das Manifest speichert den **LF-normalisierten** Hash
  (checkout-unabhängig reproduzierbar). Ohne diese Toleranz wäre jeder
  Runbook-Preflight auf Philipps Rechner dauerhaft falsch-rot gewesen.
- **Deterministische Ordnungs-Abweichungen von den Live-Loadern** (die
  inzidentelle DB-Reihenfolge zurückgeben, was Doppellauf-Byte-Identität
  unmöglich machte): Browse-Books nach Slug; Autoren nach
  `work_persons.display_order` (korrekter als der Live-Zufall); Hot-ID-Listen
  aufsteigend; Podcast-Rohzeilen nach Slug/ID vorsortiert; SQL-`ORDER BY` mit
  ID-Tiebreaker. Konsumenten sortieren/ranken downstream — sichtbar ist
  höchstens Tie-Reihenfolge. Im Exporter-Header dokumentiert; S1b sollte das
  beim Loader-Umbau gegenlesen.
- **Fail-closed konkret:** kein try/catch um Projektionen; `MIN_COUNTS`-Floors;
  Era-Set-Gleichheit DB↔eras.json; jede intersectete Hot-ID MUSS ein
  EntityView-Payload liefern (kuratiert-aber-fehlend in der DB = laute Warnung,
  wie das dokumentierte Prod-Verhalten „drops to on-demand"); verwaiste
  Podcast-Episode (Show unauffindbar) = Abbruch statt des stillen Drops des
  src-Loaders. Alles VOR dem ersten Write.
- **Era-Helper als eigenes Modul** statt in `book-apply-shared` — DB-frei
  importierbar (Tests brauchen den DATABASE_URL-Stub nicht), und der Exporter
  oder künftige Checks können ihn ohne Apply-Kopplung nutzen. `eraCtx` als
  Parameter (statt Modul-Global) hält `computeBookRows` pur und die
  Equivalence-Beweise explizit.
- **Kein `test:era-bucket`-/`test:build-snapshot`-npm-Script** — `npm test`
  auto-discovert `scripts/test-*.ts`; die package.json-Ausnahme bleibt exakt
  der eine `snapshot:regen`-Eintrag (im Test-Wiring-Guard festgeschrieben).
- **`db-rebuild-runbook.md` mit-editiert** (über die zwei im Plan genannten
  Runbooks hinaus): dessen „Kein OQ-16(b)-Fix"-Bullet wäre ab diesem PR eine
  falsche Aussage gewesen; Batches-reiner Pfad, eine Zeile.

## Verification

- `npm run typecheck` — grün (enthält die neun Shape-Contracts).
- `npm run lint` — **904 Probleme, alle vorbestehend** (der im Plan § S1b
  Punkt 4 dokumentierte Traversal-Befund: `.claude/worktrees/**`, verschachtelte
  `.next`, `timeline-workshop/design-export/**`). Scoped-Lint über alle zehn in
  dieser Session angefassten TS-Dateien: **0 Probleme**.
- `npm test` — 32 Suiten grün (30 vorbestehend + `test-era-bucket` +
  `test-build-snapshot`), inkl. `test:apply-book` (25 Checks, neuer
  Era-Vertrag) und dem weiterhin **leeren** Full-Corpus-Equivalence-Gate.
- `npm run build` — **zweiter Lauf vollständig grün** (158/158 statische Seiten
  ohne einen einzigen Retry, Static-Gen 1,3 s). Der **erste** Lauf scheiterte an
  transienten DB-Timeouts (300 s × 3 Versuche) beim Prerender von `/` und
  `/archive/podcasts` — exakt die im Plan dokumentierte Build-DB-Fragilität
  (15 Worker × `max:5` gegen ~15 Pooler-Slots), deren Sofortschutz
  (`experimental.cpus: 2`) und Loader-Weiche **S1b** gehören (Product-Pfad,
  hier bewusst nicht angefasst). Kein Zusammenhang mit dieser Session: der
  Diff liegt vollständig unter `scripts/**` + `package.json`-Scriptzeile; der
  TypeScript-Schritt des Builds war in beiden Läufen grün.
- `--check-migrations` gegen die Produktions-DB — grün: 16 Migrationen, Head
  `0015_keen_tag` (der im Preflight-195 noch offene Produktionsbeleg für 0015
  ist damit read-only erbracht).
- **Exporter-Doppellauf gegen die unveränderte DB:** Lauf 1 schreibt 104
  Artefakte + Manifest (Counts: books 889 · eras 8 · shows 4 · search-episodes
  1114 · factions 227 · characters 500 · worlds 442 · persons 136 · hotIds
  30/39/13/14 · entityViews 96; **alle 96 kuratierten Hot-IDs existieren in der
  DB**, keine Missing-Warnung). Lauf 2 ⇒ „content unchanged — generatedAt
  carried forward", `sha256sum`-Vergleich über alle 105 Dateien ⇒
  **byte-identisch**. Stichproben: `entities/character/alpharius.json` = Merge
  „Alpharius Omegon" (9 Bücher + 9 Episoden, Blurb aufgelöst),
  `thousand_sons` mit Parent-Faction-Ref, Browse-Autoren in displayOrder.
  Danach `scripts/snapshot-data/` **gelöscht** — dieser PR enthält keine
  Artefakte (E4: sie entstehen erst im S1a-Snapshot-PR nach dem Sync).
- **Kein Produktions-Write:** ausschließlich SELECTs (Probe-Skript, Exporter,
  Paritäts-Check); kein `db:sync`, kein `apply:*`. DB-Ist-Zustand unverändert
  (weiterhin 889 × `time_ending` — der Fix wirkt per Design erst mit dem
  ersten Sync der Folgesession).
- **Ask/Suche-Nulltoleranz (lesend verifiziert):** `src/lib/ask/boundaries.ts:58-62`
  guardet `primaryEraId != null`; Fallbacks über `startY` + kuratierte
  Slug-Liste bleiben; `src/app/archive/filters.ts:105` filtert `null` aus dem
  Such-Haystack (`eraName` dann nur für echt datierte Bücher treffend —
  planintendiert). Keine src-Änderung nötig.
- **Erwartete Era-Verteilung nach dem ersten Sync** (aus book-dates × eras
  abgeleitet, als Prüfwert für S1a-Snapshot): 97 gebucketet — time_ending 44,
  horus_heresy 19, the_forging 16, indomitus 12, great_crusade 4, the_waning 2 —
  Rest `NULL` bzw. Overlay-kuratiert.

## Open issues / blockers

Keine Blocker. Zwei Befunde, bewusst NICHT hier gefixt:

- `scripts/apply-timeline-data.ts` liegt **committed mit einem NUL-Byte** im
  Dateiinhalt (`file` klassifiziert „data", grep behandelt es als binär —
  läuft unter tsx trotzdem). Vorbestehend, nicht angefasst; Kandidat für einen
  späteren Batches-Hygiene-PR.
- ESLint-Traversal-Befund (904) bleibt bis S1b (dort geplant).

## For next session

**S1a-Snapshot (PR 2, direkt nach Merge):** `content-release-runbook.md`
Abschnitt „Erster Lauf" fahren — Freeze → `--check-migrations` → Go → ein
`db:sync` → `snapshot:regen` auf `codex/ingest-batches-initial-snapshot` →
Prüfblock inkl. Era-Invariante (Erwartungswerte oben) + Doppellauf-Beleg →
Snapshot-PR.

**S1b (Loader-Weiche), Koordinationsnotizen:**

- Artefakt→Loader-Zuordnung steht im Registry-Kommentar von
  `scripts/snapshot-shared.ts`; die Shape-Contracts in
  `scripts/test-build-snapshot.ts` brechen den Typecheck, sobald eine Seite
  driftet — beim Umbau bewusst mitziehen.
- `loadUnifiedSearchIndex` ist reine Komposition der vier snapshotteten
  Quellen (Browse + PodcastSearch + zwei Suggestion-Builder über den
  Compendium-Rows); `buildPodcastSuggestions`/`buildEntitySuggestions`/
  `listAliasEntries`/`hasContent`/`factionDot` sind DB-frei und bleiben
  Build-seitig lauffähig.
- Entity-Langschwanz bleibt Laufzeit-DB (ISR/on-demand) — der Snapshot deckt
  nur `generateStaticParams` (hot-ids) + die Hot-Payloads.
- `loadPrimarchItems` ruft für Merge-Einträge `loadEntity` — auf Home nicht im
  Spiel (nur die billigen Suggestions), `/compendium` ist force-dynamic; für
  die Loader-Weiche also irrelevant, aber nicht aus Versehen in den DB-freien
  Build-Pfad ziehen.
- Stale Kommentare (report-only, S2/S6 einsammeln):
  `src/lib/ask/boundaries.ts:46` + `src/lib/ask/heresy-books.ts:4` behaupten
  „primaryEraId uniformly time_ending" — nach dem ersten Sync falsch; Regel 1
  von `isHeresyBook` beginnt dann regulär zu greifen (Verbesserung, war als
  Forward-Compat gebaut). `src/lib/compendium/loader.ts:46` nennt „~2400
  location rows" (real: 442).

## References

- `docs/launch-master-plan.md` § Session 1a (+ Arbeitsmodus, Leitplanken,
  Nachtrag OQ-19-Preflight) — verbindliche Spec dieser Session.
- drizzle-orm Migrator-Verhalten (Hash = sha256 der rohen .sql-Bytes,
  `created_at` = Journal-`when`) — empirisch gegen `drizzle.__drizzle_migrations`
  verifiziert (16/16 Timestamps exakt, Hash-Varianten s. o.).
