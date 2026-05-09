---
session: 2026-05-02-032
role: implementer
date: 2026-05-02
status: complete
slug: phase3-ingestion-brainstorm
parent: 2026-05-02-031
links:
  - 2026-05-02-021
  - 2026-05-02-022
  - 2026-05-02-027
  - 2026-05-02-029
  - 2026-05-02-030
commits: []
---

# Phase 3 kickoff — Ingestion-Pipeline-Brainstorm (Research-Report)

## Summary

Empfohlene Architektur in einer Zeile: **GitHub Actions Scheduled
Workflow ruft Node/TSX-Crawler auf, die per dry-run einen JSON-Diff in
`ingest/.last-run/` committen; Apply-Step in einem zweiten Schritt
schreibt mit `ON CONFLICT (...) DO UPDATE WHERE works.source_kind !=
'manual'` in die DB.** Erste Quelle: Lexicanum (Cheerio + MediaWiki
api.php), zweite Open Library + Hardcover.app (Goodreads-API ist seit
Dez 2020 tot), dritte Black Library (vorsichtig, nur Synopsen +
Format-Verfügbarkeit). MVP-PR #1 schreibt **noch nichts in die DB** —
nur das Skelett, die Confidence-Map-Aktivierung der 7 hand-kuratierten
Werte aus 2b, und ein Lexicanum-Dry-Run, dessen Diff-File Philipp prüft.

Die wichtigste neue Information für Cowork: **Brief 031 § Context sagt
„`external_links` hat source_kind/confidence-Felder im Schema". Das
stimmt nicht — diese Spalten leben auf `works`, nicht auf
`external_links`.** Für die Pipeline ist das harmlos (wir tracken
Provenance auf Werks-Ebene), aber der Folge-Brief sollte die
Phrasierung korrigieren oder einen Schema-Patch („pro External-Link
auch source_kind + confidence") explizit budgetieren.

## Achse 1 — Trigger / Schedule

### Optionen

**(A) GitHub Actions Scheduled Workflow.** Eine `.yml` in
`.github/workflows/ingest-lexicanum.yml` mit
`on.schedule: - cron: '0 4 * * *'`, läuft auf einem
`ubuntu-latest`-Runner, ruft `npm run ingest:lexicanum -- --dry-run`.
Public-Repo (`phinklab/chrono-lexicanum` ist seit 2026-05-01 öffentlich,
siehe Sessions 015/Vercel-Hobby-Migration): **unlimited free minutes**.
Cron-Minimum 5 min (in der Praxis 15 min empfohlen wegen Drift,
hobby-Use-Case will sowieso 1×/Tag). Job-Timeout 6h, Drift bei hoher
Last 10–30 min. Logs 90 Tage in der Actions-UI sichtbar, Status-Badge
in `README.md` möglich. Secrets: GitHub Actions secrets (Repo-Settings).
Failure-Recovery: Auto-Email an Maintainer nach mehrfachem Failure;
manueller Re-Run mit einem Klick. **Caveat:** wenn das Repo 60 Tage
keine Aktivität hat (Commit/PR/Issue), deaktiviert GitHub den Schedule
automatisch — bei einem aktiven Hobby-Projekt unproblematisch, beim
„setzen + halbjährlich draufschauen"-Modus aber ein Trip-Wire (siehe
„For next session"). Fix: ein Bot-Commit pro Monat oder das
`schedule`-Trigger-Re-Enabling als Action.

**(B) Vercel Cron Jobs.** Hobby-Tier: **maximal einmal pro Tag**, und
der konkrete Invocation-Zeitpunkt drifted irgendwo innerhalb der
spezifizierten Stunde (Vercel verteilt Hobby-Cron-Last). 100 Cron-Jobs
pro Project across all plans (Jan-2026-Update). Function-Timeout
60 s default für Hobby-Functions — **Crawl-Welle für 200+ Bücher passt
da nicht rein**, selbst wenn man Lexicanum's 5 s-crawl-delay
respektiert. Pro-Tier hebt beide Limits, aber das ist €. Logs in der
Vercel-Dashboard, kein nativer Issue-Mechanism. Tightly coupled an den
Deploy-Lifecycle: Cron läuft nur, wenn die Function deployed ist.

**(C) Supabase pg_cron + Edge Functions.** pg_cron schedult einen
HTTP-Call via pg_net an eine Edge Function. **pg_net ist
fire-and-forget** — die Cron-Row sieht den Response nie, Status-Tracking
muss die Edge Function selbst zurück in eine Tabelle schreiben.
Edge-Function-Idle-Timeout 150 s; default Cron-UI-Timeout 5000 ms (kann
gehoben werden). Hinzu kommt eine zweite Operations-Surface (Supabase-
Logs, Edge-Function-Secrets) für vergleichbar wenig Mehrwert. Macht
Sinn für „pro neuem Buch in der DB embedde Synopsis"-Trigger
(Reaction-Pattern), nicht für „crawl Lexicanum daily"-Pull-Pattern.

**(D) Cowork-MCP-Scheduled-Tasks** (`mcp__scheduled-tasks__*`). Feuert
nur, **wenn Cowork's Session läuft**. Eine Pipeline, die Philipps
geöffnete Cowork-Session als Trigger braucht, ist nicht autonom — sie
würde die Brief-Anforderung „Hintergrund-Drift, halbjährlich
nachschauen" verfehlen. **No-Go für die Pipeline-Architektur**, taugt
aber für ad-hoc Cowork-getriebene Crawls einer einzelnen Buch-Adresse.

### Empfehlung

**Option (A): GitHub Actions Scheduled Workflow.** Begründung in einer
Zeile: das Repo ist public, also kosten Actions-Minuten nichts, und
der 6h-Job-Timeout deckt jede realistische Crawl-Welle ab, die wir bei
einem 100–500-Buch-Backfill mit Crawl-delay 5 s hinkriegen.

Sekundärgründe:

- **Logs + Diffs leben beide in git.** Der Action committet sowohl den
  Status-File (`ingest/.state/last-run.json`) als auch den Diff-File
  (`ingest/.last-run/<source>.diff.json`). Philipp sieht in `git log`
  und `git diff`, was passiert ist — keine separate Operations-UI.
- **Kein Vendor-Lock auf den Trigger.** Dieselben Scripts (`npm run
  ingest:lexicanum`) laufen lokal, in der Action, oder in einem
  hypothetischen Phase-6-Cron auf einem anderen Runner. Trigger ist
  austauschbar, Logik nicht.
- **Issue-Auto-Open bei Failure**: `actions/github-script` öffnet ein
  GitHub-Issue mit Tag `ingest-failure`, wenn ein Run rot wird. Das
  ist die „4:00-Uhr-Failure-mit-vier-Tagen-Verspätung-bemerkt"-Antwort
  aus Achse 6.

### Trade-offs (zusammengefasst)

| Dimension | GH Actions (A) | Vercel Cron (B) | Supabase pg_cron (C) | Cowork MCP (D) |
|---|---|---|---|---|
| Wartung | niedrig (yml + workflow) | mittel (vercel.json + Function) | hoch (zwei Surfaces) | n/a |
| Kosten | 0 € (public repo) | 0 € hobby aber unzureichend, sonst ab 20 €/Mo Pro | 0 € hobby | 0 € |
| Laufzeit-Limit | 6 h | 60 s hobby / 300 s Pro | 150 s edge | n/a |
| Min-Frequenz | 5 min (15 min praktisch) | 24 h hobby / 1 min Pro | 1 s | manuell |
| Secrets | GH Secrets | Vercel env | Supabase vault | inline |
| Logs | Actions UI 90d | Vercel Dashboard | Supabase Logs | Cowork-Transcript |
| Recovery | Re-run UI + Issue-Bot | Re-run UI | manuell | Cowork erneut |
| Drift-bei-Inaktivität | 60d disable | nein | nein | n/a |

## Achse 2 — Source-Reihenfolge + Quellen-Realität

### Lexicanum (`wh40k.lexicanum.com`)

- **API:** ✅ MediaWiki `api.php` ist verfügbar (offizielle Sandbox-
  Page existiert: `https://wh40k.lexicanum.com/wiki/Warhammer_40k_-_Lexicanum:API_sandbox`).
  Standard MediaWiki-Endpoints: `action=parse` für gerenderten HTML/Wikitext,
  `action=query&prop=revisions` für rohen Wikitext, `action=query&list=search`
  für Buch-Discovery. Kein Auth-Token nötig.
- **Robots:** ✅ `User-agent: *` mit `Crawl-delay: 5`. Disallowed sind
  nur `/mediawiki/{extensions,maintenance,includes,docs,bin,cache,
  languages,mw-config,serialized,resources,skins.bak}` — also der
  MediaWiki-Backend, nicht der Wiki-Content. Der Wiki-Content
  (`/wiki/*`, `api.php`) ist offen. Crawl-delay 5 s = 720 Pages/Stunde
  Ceiling, das reicht für die 200–500 Bücher in den nächsten Monaten
  bequem.
- **Felder, realistisch extrahierbar:** Buch-Titel, In-Universe-Years
  (in Lexicanum-Article-Boxes), Autor, Series-Position, ISBN sometimes,
  Page-Count sometimes, Publisher (BL), Erstausgabe-Year, Cover-URL,
  Faction-Listen, primary Locations, Charakter-Listen. Cite-friendly:
  Inline-Citations zu primary Sources, was Provenance-Tracking
  erleichtert. **34.235 Artikel** (vs. 6.244 auf Fandom-Wiki).
- **Pitfalls:** kleines Wiki-Team, manche Templates sind inkonsistent
  formatiert; Wikitext-Parsing für Article-Boxes braucht etwas
  Robustheit. Article-Slugs enthalten manchmal Sonderzeichen
  (URL-Encoding nötig — siehe `Ghazghkull_Thraka%3A_Prophet_of_the_Waaagh%21`-
  Beispiel in `2b-book-roster.md`). Die Zitations-Sources sind menschen-
  gepflegt, also gelegentlich nicht-kanonische Spekulation — wird via
  `confidence`-Feld auf 0.90 statt 1.00 reflektiert.
- **Tooling:** Cheerio + node-fetch für api.php-JSON, später optional
  HTML-Parsing für gerenderte Article-Boxes. **Playwright nicht nötig**
  — Lexicanum ist server-rendered MediaWiki, kein JS-Hydrate.
- **Empfehlung:** **Quelle #1.** Risiko/Ertrag bestes der drei: API
  vorhanden, Crawl-delay generös, Felder direkt mappable auf unser
  Schema, kein Cloudflare-Schutz, kein Auth.

### Goodreads

- **API:** ❌ **Tot seit Dezember 2020.** Goodreads hat keine neuen
  API-Tokens mehr ausgegeben und plant das Disabling existierender
  Keys. 2026 ist die API für Neueinsteiger nicht mehr verfügbar.
- **Scraping:** technisch möglich, aber ToS-grau (Amazon-eigentum, ToS
  prohibitiert "automated access").
- **Alternative #1: Open Library** (`openlibrary.org`). 30M+ Titel,
  kostenfrei, ISBN-Lookup via `https://openlibrary.org/isbn/{isbn}.json`,
  Cover via `covers.openlibrary.org/b/isbn/{isbn}-L.jpg`. **Rate-Limit:**
  3 req/s mit User-Agent + email-Header (sonst niedriger). Felder:
  publication_date, page-count, cover-url, ISBN, OCLC, LCCN. Open
  Source, Internet Archive-betrieben.
- **Alternative #2: Hardcover.app** (`api.hardcover.app/v1/graphql`).
  GraphQL, kostenfreier Token (Account → API), **Token expiriert
  jährlich am 1. Januar** (Rotation einplanen). Rate-Limit: 60 req/min.
  Felder: rating, review-counts, moods, tags, polished UX-first
  Metadata. Replace für „Goodreads average rating".
- **Empfehlung Goodreads-Slot: Open Library für ISBN/Cover/Pub-Year +
  Hardcover.app für Rating/Tags.** Goodreads selbst skippen.

### Black Library (`blacklibrary.com`)

- **Robots:** ✅ Generischer `User-agent: *` ist erlaubt für `/`, mit
  Disallow auf `/Basket.aspx`, `/Checkout.aspx`, `/Login.aspx`,
  `/DigitalDownload.aspx`, `/webresources.axd`, `/Home/Search-Results.html*`.
  **Konkrete Produkt-Pages (`/all-products/<slug>.html`) sind nicht
  disallowed.** Ein Set spezifischer Bots ist global geblockt
  (Ahrefs, MJ12, Seznam, Yeti, Sogou, Naver etc.) — das sind SEO-/
  Hostile-Crawler-Lists, kein generelles Scrape-Verbot.
- **ToS:** Games Workshop's Terms-of-Use prohibitieren explizit „use
  of website content to train generative AI", „introducing malicious
  material", „unauthorized access", „DDoS-Attacks". **Catalog-Scraping
  für Archiv/Datenbank-Zwecke ist nicht explizit verboten**, aber das
  Verlags-Material ist urheberrechtlich geschützt (siehe
  2b-book-roster.md, das Synopsen bewusst paraphrasiert, nicht
  kopiert).
- **Felder, realistisch extrahierbar:** Verlags-Synopse (ToS-konform
  paraphrasieren, nicht kopieren), Format-Verfügbarkeit (Hardcover/
  eBook/Audio), Preise (für Affiliate-Tracking irrelevant in Phase 3),
  Series-Tags, manchmal Author-Info. Kanonische Series-Zuordnung ist
  wertvoll, weil Lexicanum hier gelegentlich abweicht.
- **Pitfalls:** vermutlich Cloudflare-Front (WebFetch hat 403
  zurückgegeben, was auf Bot-Challenge hindeutet — siehe Reference);
  Page-Templates ändern sich mit Marketing-Kampagnen; out-of-print-
  Pages werden retired. **Affiliate-API** existiert ggf. für
  GW-Partner, müsste angefragt werden — wenn ja, wäre das die saubere
  Quelle und scrape entfiele.
- **Empfehlung:** **Quelle #3.** Hohe Friction (Cloudflare),
  niedriger Datenwert pro Page für unser Modell (Synopsis ist
  manuell-paraphrasiert; Format-Verfügbarkeit kommt auch via
  Audible-Direct), ToS-Grauzone bei AI-Konflikten. **Scope auf
  Synopsis-Cross-Check + Format-Tags begrenzen**, nicht als
  primary-Quelle behandeln. Manueller Editorial-Pfad mit Pipeline-
  Validation gegen Lexicanum-Cross-Check ist die ehrliche Antwort.

### Empfohlene Implementations-Reihenfolge

1. **Lexicanum** (PR #1+#2): API vorhanden, robots-OK, hochster
   Datenwert. Macht 80 % der canonical Felder.
2. **Open Library + Hardcover.app** (PR #3): füllt ISBN/Cover/Pub-Year
   (Open Library) und Rating/Tags (Hardcover) — die Felder, die
   Lexicanum schwach hat. APIs sauber, kein Scrape.
3. **Black Library** (PR #4 oder Phase 3.5): Synopsen-Cross-Check und
   Format-Verfügbarkeit, vorsichtig, mit Cloudflare-Bewusstsein.
4. **Phase-3.5-Kandidaten:** Audible (Audiobook-Narrators für `persons`),
   ISFDB (Bibliographic depth), Wahapedia (lore-Querprüfung) — alle
   Phase-3.5, nicht jetzt.

Begründung dieser Reihenfolge gegenüber der ROADMAP.md-Stand-Linie
(`manual > lexicanum > goodreads > black_library`):

- **Goodreads-Slot ersetzen** — die API-Realität von Dez 2020 zwingt
  uns. ROADMAP-Update wird im Folge-Brief mit-erledigt.
- **Black Library nach hinten schieben** — Cloudflare + ToS-Grauzone +
  niedrigerer Marginal-Wert. Lexicanum + Open Library decken 90 % der
  Pflicht-Felder.

## Achse 3 — Provenance + Confidence-Scoring

### Schema-Realität (Korrektur zum Brief)

**Brief 031 § Context formuliert irreführend:**

> external_links hat schon source_kind und confidence-Felder im
> Schema (siehe src/db/schema.ts); seed.ts hardcoded heute
> sourceKind = 'manual' und confidence = 1.00.

**Realität laut `src/db/schema.ts`:**

- `works.sourceKind` (Z. 192) — Enum mit `manual`, `lexicanum`,
  `goodreads`, `black_library`, `fandom_wiki`, `community`, `tmdb`,
  `imdb`, `youtube`, `wikidata`. Default `manual`.
- `works.confidence` (Z. 193) — `numeric(3,2)`, Default `1.00`.
- `external_links` (Z. 405–426) — hat **keine** sourceKind/confidence-
  Spalten. Nur `id`, `workId`, `kind`, `serviceId`, `url`, `label`,
  `region`, `affiliate`, `displayOrder`.

`scripts/seed.ts` Z. 418 hardcoded `sourceKind: "manual"` beim
**Works**-Insert (nicht beim External-Link-Insert).

**Konsequenz für die Pipeline:** wir tracken Provenance auf Werks-
Ebene, nicht pro External-Link. Das ist eine bewusste Architektur-
Entscheidung, nicht ein Bug — pro Buch ist die primary-Source klar.
Wer pro External-Link Provenance braucht (z. B. „diese Goodreads-URL
kommt von Hardcover, diese Audible-URL ist manuell"), muss Schema
erweitern. Empfehlung: **als Phase-3.5-Schema-Patch budgetieren**
(`external_links.source_kind` + `confidence` nachziehen), nicht in
PR #1 forcieren.

### Pro-Quelle-Confidence-Defaults

Vorschlag für eine typed const `src/lib/ingestion/source-confidence.ts`:

```ts
export const SOURCE_CONFIDENCE = {
  manual: 1.00,
  lexicanum: 0.90,    // cite-supported wiki, kanonisches 40k-Lore
  black_library: 0.85, // Verlags-Canon, aber Synopsen werden überarbeitet
  goodreads: 0.75,     // (für historische DB-Rows, nicht aktiv ingested)
  fandom_wiki: 0.70,   // weniger curiert
  // open_library + hardcover folgen, sobald sourceKind-Enum erweitert ist
} as const;
```

**Schema-Anmerkung:** der `sourceKind`-Enum kennt heute weder
`open_library` noch `hardcover`. Folge-Brief nimmt einen
`ALTER TYPE source_kind ADD VALUE 'open_library', 'hardcover'` mit auf
(Drizzle-Migration, eine Zeile).

### Confidence-Map aus 2b aktivieren

`docs/data/2b-book-roster.md` § Confidence-Map nennt 7 Bücher mit
editorial-Confidence < 1.00:

| Buch | Confidence |
|---|---|
| `pe01` Path of the Warrior | 0.7 |
| `gk01` Grey Knights | 0.7 |
| `pm01` Priests of Mars | 0.7 |
| `nl01` Soul Hunter | 0.8 |
| `bl01` The Talon of Horus | 0.7 |
| `gh01` Ghazghkull | 0.7 |
| `id01` Infinite & Divine | 0.6 |

Diese Werte sind **editorial uncertainty** (Cowork hat sich beim
Datierungs-Anchor weniger sicher gefestigt), nicht **provenance
uncertainty**. `sourceKind` bleibt für diese 7 also `manual` — nur
`confidence` weicht vom Default ab.

**Aktivierungs-Pfad** (Folge-Brief):

1. RawBook-Interface in `seed.ts` bekommt ein optionales `confidence?:
   number`-Feld.
2. Die 7 Bücher in `scripts/seed-data/books.json` bekommen ihre
   2b-Werte als `confidence`-Property.
3. Im Works-Insert: `confidence: b.confidence?.toFixed(2) ?? "1.00"`.
4. Manueller Test: `npm run db:seed && npm run db:studio` zeigt die
   Werte korrekt an.

### Konkrete Regel-Liste (für den Folge-Brief als Constraint)

1. **Manual-Protection:** Pipeline-Updates schreiben **nur**, wenn
   `works.source_kind != 'manual'`. SQL-Form: jeder UPSERT enthält
   `WHERE works.source_kind != 'manual'` in seiner ON-CONFLICT-DO-
   UPDATE-Klausel. Hand-kuratierte Werks-Rows sind sakrosankt.
2. **Neue Pipeline-Inserts:** `works.sourceKind = '<source>'`,
   `works.confidence = SOURCE_CONFIDENCE[source]`.
3. **2b-Confidence-Aktivierung** ist ein separater Schritt:
   `sourceKind = 'manual'` bleibt, `confidence` aus `books.json`-
   `confidence`-Field kommt rein (Default 1.00).
4. **Per-Source-Defaults** liegen als typed const in
   `src/lib/ingestion/source-confidence.ts`. Kein DB-Lookup, kein
   Config-File. Änderungen brauchen einen Code-Commit (auditable im
   git-log).
5. **Junction-Tables** (work_factions, work_locations, work_persons,
   work_facets) erben Provenance transitiv vom Parent-Work. Pro-Edge-
   Provenance ist Phase-3.5-Schema-Erweiterung; in PR #1 ignorieren.
6. **External-Links-Provenance** nicht in PR #1 — siehe Schema-
   Diskrepanz oben. Pipeline schreibt `external_links` mit korrekter
   `serviceId`, aber kein Provenance-Tag. Manual-Protection wird über
   die parent-Work erzwungen (Pipeline lässt Junction-/Link-Tables
   eines manual-locked-Works komplett unangetastet).

### Merge zwischen mehreren Quellen

**Phase-3-MVP: single-source-per-work.** Pro Buch wird *eine*
primary-Source bestimmt (z. B. Lexicanum), die alle Felder schreibt.
Wenn ein zweites Source-Run später läuft (z. B. Open Library für
Cover/ISBN), schreibt der **nur die fehlenden Felder** — keine
field-by-field-confidence-Vergleiche, keine merge-Konflikte.
Implementierung: jede Source-Pipeline schreibt nur Felder, die sie
authoritativ liefert; Open-Library schreibt z. B. `coverUrl` +
`isbn13`, aber nie `synopsis` oder `startY`.

Phase-3.5+: field-level-merge mit confidence-pro-Feld (würde Schema-
Erweiterung brauchen — `field_provenance`-Tabelle oder per-Spalte-
Tracking). Out of scope.

## Achse 4 — Idempotenz + Upsert-Strategie

### Natürliche Schlüssel pro Tabelle

| Tabelle | Natürlicher Schlüssel | ON CONFLICT |
|---|---|---|
| `works` | `slug` (UNIQUE INDEX existiert) | `(slug)` DO UPDATE |
| `book_details` | `work_id` (PK) | `(work_id)` DO UPDATE |
| `series` / `factions` / `eras` / `services` / `persons` / `characters` / `locations` / `sectors` / `facet_categories` / `facet_values` | `id` (PK string) | `(id)` DO UPDATE |
| `work_factions` / `work_characters` / `work_locations` / `work_persons` / `work_facets` | composite PK `(work_id, target_id [, role])` | `DO NOTHING` standard |
| `external_links` | **kein natural key heute** — Pipeline-PR braucht UNIQUE INDEX `(work_id, kind, service_id)` | `(work_id, kind, service_id)` DO NOTHING |

### Manual-Protection in einem Beispiel-Upsert

```sql
-- Pipeline-Lauf, der ein Buch updated:
INSERT INTO works (slug, kind, title, synopsis, start_y, end_y,
                   release_year, source_kind, confidence)
VALUES (
  $1, 'book', $2, $3, $4, $5, $6,
  'lexicanum', 0.90
)
ON CONFLICT (slug) DO UPDATE SET
  title       = EXCLUDED.title,
  synopsis    = EXCLUDED.synopsis,
  start_y     = EXCLUDED.start_y,
  end_y       = EXCLUDED.end_y,
  release_year= EXCLUDED.release_year,
  -- NICHT updaten: source_kind, confidence (bleibt was die primary-Source
  --  beim ersten Insert gesetzt hat — Phase-3.5 könnte das verfeinern)
  updated_at  = now()
WHERE works.source_kind != 'manual';  -- ← die kritische Klausel
```

In Drizzle-Notation:

```ts
await db
  .insert(works)
  .values({ slug, kind: 'book', title, synopsis, startY, endY,
            releaseYear, sourceKind: 'lexicanum', confidence: '0.90' })
  .onConflictDoUpdate({
    target: works.slug,
    set: { title: sql`EXCLUDED.title`, synopsis: sql`EXCLUDED.synopsis`,
           /* ... */ updatedAt: sql`now()` },
    where: sql`${works.sourceKind} != 'manual'`,
  });
```

### Re-Run-Verhalten (Idempotenz-Garantie)

- **Werks-Update läuft 2× nacheinander mit identischem Input:**
  zweiter Lauf updated identische Felder → semantisch idempotent;
  `updated_at` springt aber bei jedem Lauf. Diff-Modus (Achse 5)
  erkennt das und schreibt „skipped (no value change)" statt einer
  pseudo-Änderung.
- **Faction-Junction wird durch Re-Crawl re-discovered:** `INSERT …
  ON CONFLICT (work_id, faction_id) DO NOTHING` — keine Duplikate.
- **Cowork hat eine Faction manuell gelöscht, Re-Crawl bringt sie
  zurück:** das ist das Hand-curation-Override-Problem. **Lösung:**
  `books.json` bekommt ein optionales `junctionsLocked: true`-Flag pro
  Buch. Pipeline überspringt **alle** Junction-/External-Link-Writes
  für junctionsLocked-Bücher. Trade-off: locked-Bücher können nicht
  über die Pipeline angereichert werden — akzeptabel, weil
  hand-kuratierte Bücher in unserer Skala die Minderheit (26 von
  ggf. 500) sind und Cowork sie absichtlich gepflegt hat.
- **External-Link wurde manuell entfernt, Re-Crawl bringt ihn
  zurück:** gleiche Lösung via `junctionsLocked` (umfasst auch
  external_links). Wenn ein per-Link-Lock nötig wird, ist das
  Phase-3.5.

### Welche Schema-Änderungen würden dazu kommen (NICHT in dieser Session)

- `external_links` UNIQUE INDEX `(work_id, kind, service_id)` — ein
  Migration-Liner.
- `external_links.source_kind` + `confidence` Spalten — Phase-3.5,
  damit pro-Link-Provenance möglich wird.
- Optional ein `ingestion_runs`-Tabelle für Operations-Sichtbarkeit
  (siehe Achse 6) — Phase-4-Discovery-Layer-Brief.

## Achse 5 — Dry-Run / Diff-Modus

### Optionen

**(A) JSON-Diff-File ins Repo.** Pipeline schreibt
`ingest/.last-run/<source>-<YYYYMMDD-HHMM>.diff.json` mit Form

```json
{
  "source": "lexicanum",
  "ranAt": "2026-05-02T04:00:00Z",
  "added": [
    { "slug": "horus-rising-hh01", "fields": { } }
  ],
  "updated": [
    { "slug": "eisenhorn-eis01", "diff": { "synopsis": ["alt", "neu"] } }
  ],
  "skipped_manual_locked": ["dark-imperium-di01"],
  "skipped_unchanged": ["mechanicum-hh09"],
  "errors": []
}
```

Philipp `git status`, öffnet die Diff, reviewed. Apply-Step liest
genau diese Diff-File und führt die DB-Writes aus.

**(B) CLI Color-Diff.** `npm run ingest:lexicanum -- --dry-run` printet
einen colorized terminal-Diff. Ephemeral, keine git-history,
post-hoc-Review unmöglich. Nur als Begleit-Output zu (A) sinnvoll.

**(C) Staging-Tables in der DB.** `pending_ingest_works`-Tabelle, in
die der Crawler schreibt; Promotion via SQL-Statement nach manueller
Inspection. Heavy: zwei zusätzliche Tabellen pro fact-Tabelle, der
Diff-Modus überlebt `db:seed`-Wipes nicht (TRUNCATE-CASCADE in seed.ts
würde das Staging mit-zerstören), zusätzlicher SQL-Boilerplate.
Over-engineered für Hobby-Skala.

### Empfehlung

**Option (A): JSON-Diff-File.** Zwei zusätzliche Argumente für die
Empfehlung, die im Brief nicht genannt sind:

- **Diff lebt in git** — `git log ingest/.last-run/` zeigt komplette
  Pipeline-History; Diffs zwischen Läufen sind `git diff`-bar.
- **Apply ist trivial:** ein zweiter Script `npm run
  ingest:apply -- ingest/.last-run/<file>.diff.json` liest die JSON
  und feuert die ON-CONFLICT-Writes. Phase-3-MVP-PR #1 baut nur die
  Dry-Run-Hälfte (kein Apply), PR #2 ist der Apply.

### Workflow

```
GH Action 04:00 daily:
  1. checkout, npm ci
  2. npm run ingest:lexicanum -- --dry-run
       → schreibt ingest/.last-run/lexicanum-20260502-0400.diff.json
       → schreibt ingest/.state/last-run.json (success-marker)
  3. if (diff non-empty): commit + push to branch ingest/auto/<date>
                          gh pr create --title "Lexicanum drift <date>"
  4. exit 0

Phase 3 PR review:
  Philipp öffnet die PR, sieht die JSON-Diff im Diff-View,
  approves/rejects.

PR merge:
  Eine zweite GH Action „on push to main" detected die Diff-File-
  Änderung und ruft `npm run ingest:apply -- <file>` (DB-Schreib-
  Step). Bei Erfolg: removed das Diff-File mit einem Follow-up-Commit.
```

Dieser Workflow ist nicht in PR #1 — PR #1 hat nur den Dry-Run-Teil
und die manuelle Apply-Möglichkeit. PR #2 baut die Apply-Auto-Action.

## Achse 6 — Operationelle Sichtbarkeit

Failure-Mode: GH Action failed um 04:00, Philipp merkt es 4 Tage
später. Wie kriegen wir das auf den Schirm?

### Empfohlener Stack

- **Run-Logs:** GH Actions Tab, retain 90 Tage, Status-Badge in
  README.md (`![ingest](https://github.com/phinklab/chrono-lexicanum/actions/workflows/ingest-lexicanum.yml/badge.svg)`).
- **Last-successful-run-State:** File `ingest/.state/last-run.json`
  mit Form `{ "source": "lexicanum", "completedAt": "2026-05-02T04:00Z",
  "booksTouched": 12, "errors": 0, "diffFile":
  "ingest/.last-run/lexicanum-20260502-0400.diff.json" }`. Jeder
  erfolgreiche Run committed das. **Warum File und nicht DB-Tabelle:**
  visible in `git log`, kein Schema-Migration, kein DB-Roundtrip,
  überlebt `db:seed`-Wipes, audit-trailed via git-history.
- **Failure-Surfaces:**
  1. **GH Actions Auto-Email:** nach 3+ aufeinanderfolgenden Failures
     mailt GitHub per Default an den Maintainer. Free-Tier-Verhalten,
     keine Konfiguration nötig.
  2. **Status-Issue-Auto-Open:** `actions/github-script`-Step öffnet
     ein Issue mit Tag `ingest-failure` beim ersten roten Run. Issue
     bleibt offen, bis Philipp es schließt oder ein nächster Run
     grün wird (zweiter Step closed das Issue dann automatisch).
  3. **README-Badge:** rot/grün direkt im Repo-Index.
  4. *Optional, nicht PR #1:* Discord-Webhook bei Failure (eine
     Action-Step-Zeile mit `curl -X POST $DISCORD_WEBHOOK …`).

### Diff-Destination

Siehe Achse 5: `ingest/.last-run/<source>-<YYYYMMDD-HHMM>.diff.json`,
plus PR (auto-opened) für non-empty Diffs. Vier Tage später ist die
Diff in `git log` plus eventuell als ungemergter PR sichtbar.

### Auto-Retry vs. nicht-retry

**Empfehlung: kein Auto-Retry in PR #1.** Begründung:

- Lexicanum-API-Failures sind meist transient (5xx, network-blip);
  eine zweite Crawl-Welle 24 h später ist effektiv ein Retry.
- Auto-Retry verschleiert echte Probleme (Schema-Refactor auf der
  Quellseite würde sich erst nach mehreren Retries als „immer noch
  rot" zeigen).
- Manuell ist trivial: GH Actions UI hat einen „Re-run failed jobs"-
  Button, einen Klick.

In Phase-3.5: ein Step mit `if: failure() && fromJSON(steps.crawl.outputs.errors).length < 5`,
der einmal retried. Aber heute nicht nötig.

### Was würde dazu kommen (NICHT in PR #1)

- `ingestion_runs`-DB-Tabelle (run-id, source, started_at, finished_at,
  books_touched, error_count, diff_file_path) — Operations-Dashboard
  in Phase 4 Discovery-Layer-UI.
- `/admin/ingest-status` Route, die `ingestion_runs` rendert.

## MVP-Schnitt

### PR #1 — „Confidence-Activation + Lexicanum Dry-Run-Skeleton"

**Was reinkommt** (Folge-Brief 033 oder 034 schneidet das exakt zu —
NNN-Anpassung je nach Reihenfolge der nächsten Briefs):

1. **2b-Confidence-Aktivierung.** RawBook + Books.json + seed.ts → die
   7 Werte aus `2b-book-roster.md` landen im DB-Default-`confidence`-
   Feld. Reine seed-Änderung, kein Schema-Patch.
2. **Carry-over: `series.totalPlanned`-Korrekturen** für `gaunts_ghosts`
   (4→16+), `ciaphas_cain` (3→13+), `hh_more` Primarchs (4→14),
   `space_wolves_sw` (4→6), `siege_of_terra` (5→8+). In `series.json`
   pflegen, seed.ts liest unverändert. **Begründung:** diese Werte
   sind zwar Pipeline-Kandidaten (Lexicanum-Series-Pages liefern die
   Total-Zahl), aber sie sind hand-fixbar in einer Zeile pro Series.
   Schneller als auf den ersten Pipeline-Lauf zu warten.
3. **Source-Confidence-Map** als typed const in
   `src/lib/ingestion/source-confidence.ts`.
4. **Lexicanum-Crawler-Skeleton:**
   - `src/lib/ingestion/lexicanum/fetch.ts` — MediaWiki-api.php-Client
     mit User-Agent (`ChronoLexicanum/0.1 (https://github.com/phinklab/chrono-lexicanum; p.kuenzler@web.de)`),
     5 s-Crawl-delay, retry-on-5xx (max 3), kein retry-on-4xx.
   - `src/lib/ingestion/lexicanum/parse.ts` — Cheerio-Extractor für
     in-universe-Years, Factions, Series-Position aus Article-Boxes.
   - `src/lib/ingestion/dry-run.ts` — generic Diff-Computer: liest
     den existierenden DB-Stand, vergleicht mit dem extrahierten
     Payload, schreibt `ingest/.last-run/<source>-<ts>.diff.json`.
5. **Eine CLI:** `npm run ingest:lexicanum -- --dry-run [--slug <slug>]`.
   Single-Buch oder alle. **Schreibt nichts in die DB.**
6. **Eine GH Action:** `.github/workflows/ingest-lexicanum.yml`,
   schedule `'0 4 * * *'`, ruft `npm run ingest:lexicanum -- --dry-run`,
   committed das Diff-File auf einen `ingest/auto/<date>`-Branch
   (oder skip wenn Diff leer), öffnet ein Issue bei Errors.
7. **Status-File** `ingest/.state/last-run.json` mit
   `{source, completedAt, booksTouched, errors, diffFile}`.
8. **README-Badge** für die Workflow-Status.

**Was NICHT reinkommt (= PR #2 oder später):**

- DB-Apply-Step (der `--apply <diff.json>`-Befehl).
- Schema-Patch für `external_links.source_kind`/`confidence`.
- UNIQUE INDEX auf `external_links (work_id, kind, service_id)`.
- Open Library / Hardcover.app / Black Library Crawler.
- `ingestion_runs`-Tabelle.
- Discord-Webhook.
- Auto-Retry-Logic.

**Warum dieser Schnitt:**

- **Kein DB-Risiko in PR #1.** Pipeline kann in den ersten Tagen rot
  laufen, ohne dass Philipps 26 hand-kuratierte Bücher in Gefahr sind.
- **PR #1 ist review-bar in 60 min.** Drei Module (`fetch`, `parse`,
  `dry-run`) plus ein workflow-yml, plus Confidence-Aktivierung, plus
  series-Korrekturen. Klare Grenze.
- **Apply-Step in PR #2 ist klein und fokussiert.** Wenn der Diff
  mechanisch korrekt ist (PR #1-validated), ist die DB-Schreib-Logik
  ein paar `onConflictDoUpdate`-Calls plus die Manual-Protection-
  Klausel. Kann separat reviewed werden, mit fokussierter Aufmerksam-
  keit auf die WHERE `source_kind != 'manual'`-Stellen.
- **Quellen-Fortschritt ist additiv.** PR #3 (Open Library) und PR #4
  (Hardcover) können parallel zu Phase-4-Feature-Arbeit laufen, ohne
  PR #1/#2 zu blockieren.

## Permissions / Secrets-Footprint

### Inventory (für die empfohlene Architektur)

| Secret / Permission | Wo gespeichert | Wer hat Zugriff | Rotation |
|---|---|---|---|
| `SUPABASE_DB_URL` (für Apply-Step in PR #2) | GitHub Actions Repo Secret | Repo-Maintainer (Philipp + ggf. Cowork-Bot in Zukunft) | manuell wenn Supabase-Credentials wechseln; sonst nie |
| `LEXICANUM_USER_AGENT` | nicht secret — hardcoded const in `src/lib/ingestion/lexicanum/fetch.ts` mit Repo-URL + Email | n/a (committed) | n/a |
| `OPENLIBRARY_USER_AGENT` (PR #3) | gleicher Pattern, hardcoded | n/a | n/a |
| `HARDCOVER_TOKEN` (PR #3) | GitHub Actions Repo Secret | Philipp | **jährlich am 1. Januar** (per Hardcover-Doc) — Calendar-Reminder einplanen |
| Vercel env vars | unverändert — Pipeline berührt Vercel nicht | n/a | n/a |
| Supabase service-role | **nicht nötig** — gleiche `DATABASE_URL` mit anon-Privileges, wie seed.ts heute | n/a | n/a |
| Black Library Auth | **kein Auth nötig** — Catalog-Pages sind öffentlich | n/a | n/a |

### GitHub Actions Workflow Permissions

Standard `contents: write` (für Diff-File-Commits + auto-PR).
`pull-requests: write` (für `gh pr create` in der Action). Kein
`packages` oder `deployments` nötig. Die Workflow-Permissions werden
in der `.yml` per `permissions:`-Block scope-restricted, kein default
`GITHUB_TOKEN` mit Vollzugriff.

### Failure bei Token-Rotation

- **Hardcover-Token expiriert (1. Jan):** PR #3-Workflow läuft rot
  mit 401, auto-Issue öffnet sich (Achse 6), Philipp generiert neuen
  Token, updated GH Secret, Re-run.
- **Supabase-Pwd rotiert:** Apply-Workflow läuft rot, Pattern wie oben.

Beides ist via GH Actions-UI in <5 min korrigierbar.

## Open issues / blockers

1. **Schema-Diskrepanz: `external_links` hat keine source_kind/
   confidence-Spalten** (Brief 031 § Context formuliert das
   irreführend). Empfehlung: Folge-Brief korrigiert die Phrasierung
   und budgetiert eine Phase-3.5-Schema-Erweiterung
   (`external_links.source_kind` + `confidence`), aber PR #1 lebt mit
   Provenance auf Werks-Ebene. Nicht-blockierend.
2. **`source_kind`-Enum kennt heute weder `open_library` noch
   `hardcover`.** PR #3 (späterer Folge-Brief) muss eine ALTER TYPE
   Migration mit-haben. Nicht-blockierend für PR #1 (nur Lexicanum,
   bereits im Enum).
3. **Black-Library-Cloudflare-Verhalten ist unklar.** WebFetch hat
   während der Recherche 403 zurückgegeben, was auf Bot-Challenge
   hindeutet. Folge-Brief für PR #4 (BL-Crawler) muss vor dem
   Implementieren testen, ob curl-mit-Browser-User-Agent durchkommt
   oder ob ein Headless-Browser nötig wäre. **Needs Philipp zum
   Realtest** — kann nicht aus Cowork/CC heraus geklärt werden.
4. **GH-Actions-60-Tage-Inaktivitäts-Disable.** Der Schedule pausiert,
   wenn das Repo 60 Tage keine Commits/Issues/PRs hat. Bei einem
   aktiven Hobby-Projekt unproblematisch; beim
   „setze auf, halbjährlich draufschauen"-Modus ein Trip-Wire.
   **Mitigation:** der Pipeline-Workflow committet bei jedem
   erfolgreichen Run mindestens das `last-run.json` — das ist Aktivität
   und zählt als Reset. Daily Cron + Status-File-Commit = nie 60 Tage
   inaktiv. Selbst-heilend.

## For next session

Vorschlag für den Folge-Implementations-Brief. Skelett, das Cowork mit
Editorial-Polish überzieht:

- **Titel:** „Phase 3 Stufe 3a — Lexicanum Dry-Run + Confidence-Map-
  Aktivierung"
- **Goal:** PR #1 wie oben skizziert.
- **Scope (in scope):**
  - 7 Confidence-Werte aus 2b in `books.json` aktivieren, RawBook +
    seed.ts patchen.
  - `series.totalPlanned`-Korrekturen für die 5 bekannten Bugs
    (siehe MVP-Schnitt § 2).
  - Source-Confidence-Map als typed const.
  - Lexicanum-Crawler-Skeleton (fetch + parse + dry-run + CLI).
  - GH-Action `ingest-lexicanum.yml` mit dry-run-only-Schedule.
  - README-Badge + `ingest/.state/last-run.json`-Convention.
  - **Carry-over aus 030 / Brief 031: Index `book_details_primary_era_idx`
    setzen, falls die gleiche Migration-Welle ohnehin angefasst wird.**
    (Ist es nicht in PR #1, aber wenn der Folge-Brief eine separate
    Schema-Migration auslöst, mit-erledigen.)
  - **Carry-over aus 030 / Brief 031: Trim von `loadTimeline` für
    Overview-Counts.** Auch hier nur, wenn der Loader berührt wird;
    sonst nicht-blockierend.
- **Out of scope:** Apply-Step (PR #2), Open Library/Hardcover/Black
  Library, Schema-Patch external_links, ingestion_runs-Tabelle.
- **Constraints (aus Achse 3 Regel-Liste 1–6 oben).**
- **Acceptance:**
  - `npm run ingest:lexicanum -- --dry-run --slug eisenhorn-eis01`
    läuft lokal grün, schreibt eine sinnvolle Diff-JSON.
  - GH-Action in der ersten Schedule-Iteration grün, committed Diff
    (oder „no diff").
  - 7 confidence-Werte aus 2b sind in `db:studio` sichtbar.
  - 5 series-Total-Bugs gefixed.
  - `npm run lint` + `npm run typecheck` + `npm run check:eras` grün.

## References

### Trigger / Schedule

- [Vercel Cron Jobs — Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel Cron Jobs — 100 jobs per project (Jan 2026 changelog)](https://vercel.com/changelog/cron-jobs-now-support-100-per-project-on-every-plan)
- [GitHub Actions limits](https://docs.github.com/en/actions/reference/limits)
- [GitHub Actions — Billing & usage](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [Supabase pg_cron extension docs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions limits](https://supabase.com/docs/guides/functions/limits)
- [Supabase — Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)

### Quellen

- [Lexicanum API sandbox](https://wh40k.lexicanum.com/wiki/Warhammer_40k_-_Lexicanum:API_sandbox)
- [Lexicanum robots.txt](https://wh40k.lexicanum.com/robots.txt) — fetched 2026-05-02, `Crawl-delay: 5`, `User-agent: *` allowed for `/wiki/*`
- [Black Library — Terms of Use](https://www.blacklibrary.com/Home/terms-of-use-BL.html)
- [Black Library robots.txt](https://www.blacklibrary.com/robots.txt) — fetched 2026-05-02, generic `User-agent: *` allowed for `/`, specific bot-list blocked, /Cart/Checkout/Login disallowed
- [Goodreads API retirement (Hacker News, 2020)](https://news.ycombinator.com/item?id=25405737)
- [Open Library — APIs](https://openlibrary.org/developers/api)
- [Open Library — Rate limits issue](https://github.com/internetarchive/openlibrary/issues/10585)
- [Hardcover.app — API getting started](https://docs.hardcover.app/api/getting-started/)
- [Hardcover.app — Goodreads API alternative comparison](https://www.emgoto.com/hardcover-book-api/)
- [Wargamer — Lexicanum vs Warhammer 40k Wiki comparison](https://www.wargamer.com/warhammer-40k/wiki)

### Tooling

- [Cheerio vs Playwright — switch from Playwright (Apify blog)](https://blog.apify.com/switching-from-playwright-to-cheerio/)
- [Crawlee CheerioCrawler guide — 500 pages/min on 4 GB RAM](https://crawlee.dev/js/docs/guides/cheerio-crawler-guide)

### Internal

- `src/db/schema.ts` Z. 80–93 (sourceKind enum), Z. 192–193
  (works.sourceKind/confidence)
- `scripts/seed.ts` Z. 405–484 (per-book transactional helper, hardcodes
  sourceKind='manual')
- `docs/data/2b-book-roster.md` § Confidence-Map (7 Werte)
- `ROADMAP.md` § Phase 3 (current Plan-Stand)
- `sessions/2026-05-02-031-arch-phase3-ingestion-brainstorm.md` (dieser Brief)
