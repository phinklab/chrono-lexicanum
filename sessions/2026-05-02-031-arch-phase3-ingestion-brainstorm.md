---
session: 2026-05-02-031
role: architect
date: 2026-05-02
status: open
slug: phase3-ingestion-brainstorm
parent: null
links:
  - 2026-05-02-021
  - 2026-05-02-022
  - 2026-05-02-027
  - 2026-05-02-029
  - 2026-05-02-030
commits: []
---

# Phase 3 kickoff — Ingestion-Pipeline-Brainstorm (Research-Brief)

## Goal

Eine **architektonische Empfehlung** für die Daten-Ingestion-Pipeline ableiten — keine Implementation. Phase 3 ist groß, hat viele Entscheidungs-Achsen, und die Reihenfolge der Entscheidungen prägt alles weitere. Diese Session ist eine Research-/Brainstorm-Session: CC vergleicht Optionen anhand der unten gelisteten Achsen, benennt Trade-offs explizit, schlägt eine konkrete Form vor, und schreibt das in einen Report. Aus diesem Report leiten Cowork und Philipp dann den **eigentlichen ersten Implementations-Brief** für Phase 3 ab.

Hintergrund: Phase 2 hat 26 hand-kuratierte Bücher in der DB. Phase 4 wird der Discovery-Layer (Timeline-Reshape, DB-Suche, Detail-Seiten, persönliche Bibliothek). Damit Phase 4 sinnvoll groß werden kann, soll die DB sich parallel füllen — aber asynchron, ohne Philipps lokalen Rechner zu brauchen, ohne den Feature-Workflow zu blockieren. Ziel-Größenordnung in absehbarer Zeit: **einige Hundert gut-quellengeprüfte Bücher**, jeder Datensatz mit Provenance-Spur (`source_kind`, `confidence` — Felder existieren schon im Schema, werden aber heute nicht gefüttert).

Der Output dieser Session ist also kein Code, sondern eine **Entscheidungs-Vorlage**.

## Context

- **Schema steht.** Aus Stufe 2a (`works`+CTI, facets, external_links, persons) und 2c.0 (`book_details.primary_era_id`) heraus existieren die Tabellen, die die Pipeline füllen muss. `external_links` hat schon `source_kind` und `confidence`-Felder im Schema (siehe `src/db/schema.ts`); seed.ts hardcoded heute `sourceKind = 'manual'` und `confidence = 1.00`.
- **26 Bücher bestehen — Phase 3 ergänzt, ersetzt nicht.** Die Hand-kuratierten Datensätze haben Confidence 1.00 / sourceKind `manual` und sollen das auch behalten. Pipeline-Daten kommen mit niedrigerer Confidence (Quellen-abhängig) rein und dürfen Hand-Kuratierung nicht überschreiben.
- **Confidence-Map aus Stufe 2b liegt bereit.** `docs/data/2b-book-roster.md` hält für 7 Bücher Cowork-eingeschätzte Confidence-Werte (0.6–0.8) fest, die heute nicht in der DB sind. Aktivierung dieser Werte gehört zur Pipeline (Pipeline kann `manual_with_confidence` als sourceKind unterstützen oder ähnliches).
- **`series.totalPlanned` hat bekannte Daten-Bugs.** `gaunts_ghosts: 4` (real ≥16), `ciaphas_cain: 3` (real 13+), `hh_more (Primarchs): 4` (real 14), `space_wolves_sw: 4` (real 6), `siege_of_terra: 5` (real 8+). Erwartung an die Pipeline: Lexicanum-Series-Pages liefern die kanonische Total-Zahl und korrigieren die Werte automatisch.
- **Stack-Kontext (für Trigger-Optionen).** Repo unter `phinklab/chrono-lexicanum` auf GitHub (Team-Org-Plan, Rulesets aktiv). Hosting auf Vercel (Production + Preview-URLs pro Branch). DB auf Supabase Postgres (free tier). Drizzle Migrations laufen automatisch auf Vercel-Deploy via `vercel-build`. CI ist GitHub Actions (`.github/workflows/ci.yml` — derzeit nur lint+typecheck auf PRs). Keine Background-Worker-Infrastruktur heute.
- **Maintainer-Kapazität.** Eine Person (Philipp), Hobby-Projekt, Ziel: setze auf, dann Hintergrund-Drift, halbjährlich nachschauen. Lösungen, die einen Kubernetes-Cluster oder ein Monitoring-Stack erfordern, sind nicht angemessen — selbst wenn technisch besser.
- **Quellen-Set (heute geplant).**
  - **Lexicanum** (`warhammer40k.fandom.com` und/oder `lexicanum.com`) — kanonische Werks-Daten, Charaktere, Locations, Series-Listen.
  - **Goodreads** — Cover, ISBN, Publication-Year, Average-Rating, Page-Count.
  - **Black Library** — offizielle Synopsen, Format-Verfügbarkeit (Hardcover/eBook/Audio), kanonische Series-Zuordnungen.
  - Reihenfolge in `merge`-Confidence: `manual > lexicanum > goodreads > black_library` ist der heutige Plan-Stand (siehe ROADMAP.md). Begründung darf CC im Report angreifen, falls eine andere Reihenfolge belastbarer wäre.

## Constraints

- **Keine Implementation in dieser Session.** Kein `npm install`, keine neuen Crawler-Files, keine Schema-Migrationen, keine Pipeline-Skripte. CC produziert einen **Report** mit Recherche und einer Empfehlung. Ausnahmen: ein einzelnes illustratives Snippet in einem Codeblock im Report, falls es eine Idee schärft (z. B. „so würde der Trigger-File ungefähr aussehen") — kein vollständiges Modul.
- **Keine Versionsnummern pinnen.** Wenn CC Tool-Optionen vergleicht (Vercel Cron, GitHub Actions, Supabase Edge Functions, Bun, Playwright, Cheerio, …), beschreibt er sie in der **heutigen Form**, ohne `package.json`-Patches. Versionen werden im Folge-Implementations-Brief (oder beim ersten `npm install`) festgenagelt.
- **Robots.txt + ToS müssen respektiert werden.** Wenn eine Quelle Scraping verbietet (Black Library z. B. ist hier unbekanntes Terrain), darf die Empfehlung nicht „wir scrapen es trotzdem" lauten. Alternativen: nur das, was in Atom/RSS-Feeds öffentlich ist; nur das, was Lexicanum bereits aggregiert hat; manuelle Hinterlegung. Die Empfehlung muss das pro Quelle benennen.
- **Wartbarkeit > Eleganz.** Eine Pipeline, die alle drei Monate halb durch Page-Refactors auf der Quellseite kaputt geht, ist nicht akzeptabel — Selbstheilungs-/Notification-Mechanismen müssen Teil der Empfehlung sein. Eine 200-Zeilen-Lösung mit klarer Fehler-Sichtbarkeit schlägt eine 1000-Zeilen-Lösung mit perfektem Architektur-Modell.
- **Idempotenz ist Pflicht, kein Nice-to-have.** Jeder Lauf muss sich wiederholen lassen, ohne Duplikate zu erzeugen oder Hand-Kuratierung zu überschreiben. Die Empfehlung muss konkret beschreiben, wie das durchgesetzt wird (Upsert-Keys, source_kind-Vorrang-Regel, change-detection).
- **Confidence-Felder müssen tatsächlich gefüttert werden.** Schema-Felder, die im Phase-3-Datenfluss leer bleiben, sind ein Failure-Mode des Briefs — eine der Achsen unten ist explizit „wie befüllen wir Provenance".
- **Hand-kuratierte Daten haben Vorrang.** `manual` (Confidence 1.00) darf von Pipeline-Updates nie überschrieben werden. Die Empfehlung muss das Update-Verfahren konkret beschreiben (z. B. „Pipeline-Updates schreiben nur wenn `source_kind != 'manual'`").

## Out of scope

- **Welche Bücher** in welcher Priorität gescrapt werden — das ist eine Editorial-Frage für eine spätere Session, nicht jetzt.
- **Tone/Theme/Content-Warning-Auto-Tagging.** Subjektive Facets bleiben Hand-Editorial. Pipeline berührt sie nicht. Wenn das später anders entschieden wird, ist es ein eigener Brief.
- **Schema-Änderungen.** `sourceKind`, `confidence`, `external_links` existieren bereits. Wenn die Empfehlung eine Schema-Erweiterung braucht (z. B. eine `ingestion_runs`-Tabelle für Operations-Sichtbarkeit), wird sie als „würde dazu kommen" benannt, aber **nicht in dieser Session migriert**.
- **Front-End-Surfaces für die Pipeline.** Ein Operations-Dashboard ist erwünscht (siehe ROADMAP § Phase 3 letzter Punkt), aber als UI-Konzept gehört es in einen späteren Discovery-Layer-Brief — heute nur die Pipeline-interne Sichtbarkeit (Logs, JSON-Status-File, CLI-Ausgabe etc.).
- **Andere Quellen** (Audible, Wahapedia, Reddit-Indexes, …) — heute nicht im Set. Kann CC im Report als „Phase-3.5-Kandidat" erwähnen, soll aber die drei Hauptquellen nicht damit verwässern.
- **Ask-the-Archive / Cartographer / Detail-Seiten.** Phase 5 / Phase 4. Pipeline-Empfehlung bleibt auf das Werks-Daten-Modell fokussiert.

## Acceptance

Die Session ist durch, wenn der Implementer-Report — der diesmal ein **Research-Report**, kein Implementations-Report ist — folgende Bausteine liefert:

- [ ] **Achse 1 — Trigger / Schedule.** Konkreter Vergleich von mindestens drei Optionen (z. B. GitHub Actions Scheduled Workflow vs. Vercel Cron vs. Supabase pg_cron+Edge-Functions vs. Cowork-Scheduled-Tasks), mit Trade-offs in den Dimensionen: Wartungsaufwand, Kosten, Laufzeit-Limits, Secret-Handling, Logging-Sichtbarkeit, Failure-Recovery. **Eine Empfehlung mit Begründung.** Wenn die Empfehlung „kombiniert" lautet (z. B. „GH Actions für Crawl, Vercel-Hook für Ingest"), das explizit als Form ausweisen.
- [ ] **Achse 2 — Source-Reihenfolge + Quellen-Realität.** Pro Quelle (Lexicanum, Goodreads, Black Library) ein Status-Check: gibt es eine API? Robots.txt-Status? ToS-Hinweise auf Scraping? Welche Felder lassen sich realistisch extrahieren? Welche bekannten Pitfalls (Page-Refactor-Häufigkeit, Rate-Limiting, Cloudflare-Schutz, Login-Walls) sind heute zu erwarten? **Eine Empfehlung für die Implementation-Reihenfolge** (welche Quelle bauen wir zuerst, weil dort das Risiko/Ertrag-Verhältnis am besten ist).
- [ ] **Achse 3 — Provenance + Confidence-Scoring.** Konkretes Schema-Mapping: wie befüllen Pipeline-Läufe `source_kind` und `confidence` in `external_links`, in `book_details`, in den facet/junction-Tabellen? Wo speichert man pro-Quelle-Confidence-Defaults (Code-Konstante? Config-File? DB-Tabelle)? Wie integriert sich die bestehende Confidence-Map aus Stufe 2b (`docs/data/2b-book-roster.md`)? Wie verhält sich der Merge zwischen mehreren Quellen — additiv? Source-Vorrang? **Eine konkrete Regel-Liste**, präzise genug, dass der Folge-Implementations-Brief sie als Constraint verwenden kann.
- [ ] **Achse 4 — Idempotenz + Upsert-Strategie.** Welche Spalten bilden den natürlichen Schlüssel pro Tabelle? Welche `ON CONFLICT`-Klausel pro Upsert? Wie verhindert man, dass ein Re-Run dieselbe `external_link` doppelt einfügt, eine deletete Faction-Zuordnung wieder zurückbringt, oder Hand-Kuratierung überschreibt? Konkrete Antworten, kein Hand-Wave.
- [ ] **Achse 5 — Dry-Run / Diff-Modus.** Wie zeigt man „was würde sich ändern, wenn ich diesen Lauf jetzt ausführe", ohne tatsächlich zu schreiben? JSON-Diff-File ins Repo? CLI-Output mit Color-Diff? Staging-Tabellen in der DB? **Eine Empfehlung**, die Philipp ohne Setup-Aufwand vor jedem real-Run prüfen kann.
- [ ] **Achse 6 — Operationelle Sichtbarkeit.** Was passiert, wenn ein Lauf failed um 4:00 Uhr nachts, und Philipp es vier Tage später bemerkt? Wo lebt der Logs-/Status-Stream? Wie wird ein gefailter Lauf auto-retryed (oder bewusst nicht)? **Konkrete Antworten** auf: Where do failures show up? Where do diffs land? Where does „last successful run was 3h ago, here's what changed" leben?
- [ ] **MVP-Schnitt.** Welcher Subset der oben genannten Achsen bildet den **ersten** Implementations-Brief — also was geht zuerst, was kommt später? Empfehlung mit Begründung: was muss zwingend in PR #1 sein, was kann separat folgen? Faustregel: PR #1 ist klein genug, dass er review-bar bleibt.
- [ ] **Permissions/Secrets-Footprint.** Eine Liste aller Auth-Tokens, API-Keys, GitHub-App-Permissions, Vercel-Env-Vars, Supabase-Service-Roles, die für die empfohlene Architektur entstehen. Pro Secret: wo gespeichert (GitHub Actions secrets, Vercel env, Supabase vault, etc.), wer hat Zugriff, was passiert bei Rotation.

Dieser Report wird nicht „grün" oder „rot" gegen `npm run build` geprüft. Er wird gegen die Frage geprüft: **„Reicht das, um den nächsten Brief zu schreiben?"** Wenn ja, ist die Session durch.

## Open questions

Punkte, bei denen Cowork explizit Inputs vom Implementer einholen will. Keine Blocker.

- **Scraping-Tool-Stack.** Cheerio + node-fetch genügt heute oft, oder lohnt sich ein Headless-Browser (Playwright) für JS-rendered Pages auf Lexicanum/Goodreads? Pro Seite verschieden? Welche Größenordnung an Memory/Disk braucht das in einer Cron-Action?
- **Lexicanum-API-Status.** Hat MediaWiki (das Lexicanum betreibt Fandom MW oder eine eigene Instanz, abhängig davon ob `warhammer40k.fandom.com` oder `lexicanum.com` die kanonische Quelle ist) eine öffentliche API, die Scraping ersetzt? Falls ja, was kostet die Migration scrape→API später? Falls nein, gibt es einen Dump?
- **Goodreads-API.** Goodreads hat seine API 2020 für neue Tokens geschlossen. Was ist der heutige Status? Gibt es einen offiziellen Workaround (Open Library? ISBNdb?), oder ist nur noch der ISBN-Lookup als Fallback? CC darf hier eine andere Quelle empfehlen, wenn Goodreads tatsächlich tot ist.
- **Black Library Robots/ToS.** Cowork hat keine aktuelle Lesung von `blacklibrary.com/robots.txt` und der ToS-Sprache. Falls Scraping ausgeschlossen ist: was bleibt? Atom-Feeds? Affiliate-API? Manueller Editorial-Path mit Pipeline-Validation gegen Lexicanum?
- **Vercel Cron vs. GH Actions Trade-off in der Praxis.** Vercel Cron läuft serverless mit Time-Limit (Hobby-Tier: 10s, was eventuell nicht reicht). GH Actions Scheduled Workflows laufen auf Runner-VMs mit großzügigem Time-Limit, aber haben den GH-Actions-Free-Tier-Quota. Wie groß sind die Lauf-Zeiten, die wir für eine Crawl-Welle realistisch erwarten?
- **Cowork-Scheduled-Tasks als Trigger?** Cowork hat ein Scheduled-Tasks-Tool (`mcp__scheduled-tasks__*`). Im Cowork-Kontext laufen die — taugen sie als Trigger für Phase 3, oder ist das ein No-Go, weil Pipeline-Läufe von einer User-Session abhängig wären? CC darf das einschätzen.
- **„Last successful run"-State.** Wo liegt das? Ein File in `ingest/.state/last-run.json`, eine DB-Tabelle, ein S3-Bucket? Welche Form hat den geringsten Overhead?

## Notes

### Form des Reports

Da es ein Research-Report ist, weicht er von der üblichen `## What I did / ## Decisions / ## Verification`-Struktur ab. Bevorzugte Form:

```
## Summary
## Achse 1 — Trigger / Schedule
  ### Optionen
  ### Empfehlung
  ### Trade-offs
## Achse 2 — Source-Reihenfolge
  …
…
## MVP-Schnitt
## Permissions/Secrets-Footprint
## Open issues / blockers   ← Standard-Sektion, falls Recherche eine Quelle nicht klären konnte
## For next session         ← Standard-Sektion, dort die konkreten Implementations-Brief-Inputs
## References               ← URLs zu Robots/ToS-Dokumenten, GH/Vercel-Docs etc.
```

Pro Achse mindestens drei Optionen vergleichen, klare Empfehlung. Recherche-URLs gehören in `## References`. Wenn eine Frage nicht innerhalb der Session klärbar ist (z. B. „BL ToS auf nicht-EU-Region anders?"), nicht raten — als „blocker, needs Philipp" benennen.

### Verbindlichkeit der Empfehlung

Die Empfehlung im Report wird **nicht automatisch** zur Implementations-Architektur. Cowork und Philipp lesen den Report, ggf. mit Rückfragen, und schreiben dann einen **eigentlichen Implementations-Brief** (Brief 032 oder 033), der die Empfehlung übernimmt **oder** abändert. Das heißt: Empfehlung darf opinionated sein. Es ist kein Versuch, alle Optionen offen zu halten — eine klare „so würde ich es bauen"-Aussage ist hilfreich, weil sie etwas bietet, das man annehmen oder ablehnen kann.

### Feldgröße der Recherche

Achse 1 (Trigger) und Achse 2 (Quellen) brauchen reale Recherche — bitte Web-Search/Fetch nutzen, weil die Tool-Landschaft seit Anfang 2025 mehrfach umgebaut wurde (Vercel Cron-Pricing, GH Actions-Quota-Änderungen, Supabase Edge-Functions-Maturity). Achsen 3–6 sind primär Architektur-/Schema-Überlegung mit dem Repo-Code in der Hand — weniger externe Recherche nötig.

### Was nach diesem Brief kommt

Der natürliche Folge-Brief ist „Phase 3 — Implementation Stufe 3a", der die Empfehlung dieser Session als Constraint nimmt und die erste konkrete Crawler-Quelle in Code gießt. Dieser Folge-Brief wird voraussichtlich:

- die Confidence-Map aus Stufe 2b aktivieren (d. h. die 7 Werte aus `docs/data/2b-book-roster.md` in die DB schreiben)
- den ersten Crawler bauen (vermutlich Lexicanum, abhängig von Achse 2)
- die `series.totalPlanned`-Korrekturen automatisch mit-erledigen (siehe Carry-over)
- den Index `book_details_primary_era_idx` mit-setzen, falls in der gleichen Migration sinnvoll (Carry-over)
- den Trim von `loadTimeline` für Overview-Counts mit-erledigen, falls Berührung der Loader ohnehin passiert (Carry-over)

Diese vier Punkte werden im Folge-Brief explizit gefoldet, also CC muss sie hier nicht selbst auflisten — er darf sie aber im Report § „For next session" referenzieren, wenn sie sich aus der Empfehlung natürlich ergeben.
