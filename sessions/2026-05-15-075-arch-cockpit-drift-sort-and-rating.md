---
session: 2026-05-15-075
role: architect
date: 2026-05-15
status: open
slug: cockpit-drift-sort-and-rating
parent: null
links:
  - 2026-05-15-074-impl-resolver-batch-3
  - 2026-05-14-073-arch-maintainer-audit-cockpit
  - 2026-05-11-061-arch-ssot-loop
commits: []
---

# Cockpit-Refinement (Drift-Sort + Auch-enthalten-Panel) und OQ6 Hardcover-Rating-Promotion

## Erratum (2026-05-15, post-Codex-Review)

Codex-Review hat vier Stellen gefunden, die gegen den realen Code-/Daten-Stand verstoßen oder operationell unsicher sind. **Lies diesen Block, bevor du dem Rest folgst — diese Korrekturen überschreiben gegenteilige Aussagen weiter unten.**

1. **NPM-Script und Direkt-Aufruf brauchen `--env-file=.env.local`.** Der Drizzle-Client in `src/db/client.ts:18` wirft hart, wenn `process.env.DATABASE_URL` nicht gesetzt ist; `HARDCOVER_API_TOKEN` liegt ebenfalls in `.env.local`. `package.json` hat als Konvention für DB-Skripte konsistent `tsx --env-file=.env.local …` (`db:migrate`, `db:seed`, `db:apply-override`, `db:seed-resolver-extensions`, `ingest:backfill`, `atlas:regen`). Konsequenz für Track B:
   - **`package.json`-Eintrag:** `"backfill:hardcover-rating": "tsx --env-file=.env.local scripts/backfill-hardcover-rating.ts"` (NICHT ohne `--env-file`).
   - **Acceptance-Bullet** „das Script läuft mindestens einmal real gegen die DB durch (mit echtem `HARDCOVER_API_TOKEN`)" bleibt unverändert in Wortlaut; der Skript-Aufruf in der Verifikation ist `npm run backfill:hardcover-rating` bzw. (für `--force`) `npm run backfill:hardcover-rating -- --force`.

2. **Backfill-Scope muss W40K-SSOT-eng sein, nicht „alle `bookDetails.rating IS NULL`".** Brief sagt Goal-Zeile „150 applied W40K-Bücher", aber die Constraint-Zeile „über `works` JOIN `book_details` wo `book_details.rating IS NULL`" wäre breiter und würde zukünftige HH-/Manual-/OL-Rows mit fassen. **Verbindlicher Scope-Filter für 075:**
   - Default-Modus: `book_details.rating IS NULL AND works.source_kind = 'ssot' AND works.external_book_id LIKE 'W40K-%' AND works.kind = 'book'`.
   - `--force`-Modus: gleicher Source-/ID-Filter, nur ohne den `rating IS NULL`-Teil. `--force` darf ausdrücklich **nicht** über alle Werke laufen.
   - Damit ist die Trefferliste deterministisch auf die heute 150 applied W40K-Bücher beschränkt; jede zukünftige Erweiterung (HH-Bücher, OL-Quelle, Manual-Override) verlangt eine bewusste Scope-Erweiterung im Folge-Brief, nicht einen Side-effect von 075.
   - Falls CC einen sauberen Drizzle-Where-Filter (`and(eq(works.sourceKind, 'ssot'), like(works.externalBookId, 'W40K-%'), eq(works.kind, 'book'), isNull(bookDetails.rating))`) findet — Default; SQL-Raw-Where nur falls Drizzle nicht trägt.

3. **Author-Missing-Rows dürfen Hardcover-Suche NICHT mit `expectedAuthor=undefined` aufrufen.** `discoverHardcoverClaimV2(title, expectedAuthor?)` greift bei fehlendem `expectedAuthor` per `hits[0]` (`src/lib/ingestion/v2/sources/hardcover.ts:93-96`) — also der erste Suchtreffer ohne Author-Match-Guard. Mit gegebenenfalls 5+ Author-Missing-Rows in der DB (074-impl-Report Z. 143: W40K-0141 Mike Brooks / W40K-0142 Jonathan D. Beer / W40K-0143 Robbie MacNiven / W40K-0146 Rhuairidh James / W40K-0147 Green-Tide-Omnibus multi-author) ist das ein offener False-Positive-Pfad: ein 40K-Buch ohne Author-Hint kann auf einen gleichnamigen Non-40K-Treffer (oder ein 40K-Buch desselben Titels in einer anderen Ausgabe) joinen.
   - **Verbindlich für 075:** Wenn `primaryAuthor` aus `work_persons` (role='author' o. ä.) leer/`null` ist, **kein `discoverHardcoverClaimV2`-Call**. Stattdessen Miss-Bucket `no_author`.
   - Reason-Bucket-Liste damit explizit (statt informell wie in Constraint-Sektion): `null_result` / `author_mismatch` / `no_author` (NEU) / `graphql_error` / `token_missing` / (CC darf weitere ergänzen, wenn das Hardcover-Result-Shape welche nahelegt).
   - Für die 5 Author-Missing-Bücher ist der Backfill heute also kein Rating-Write, sondern eine im Report dokumentierte Miss-Reason. Der Roster-Author-Fix bleibt im Maintainer-Excel-Workflow (Brief 074-impl, Out-of-Scope-Liste); 075 schreibt für diese 5 Bücher kein Rating, auch im `--force`-Modus nicht.

4. **`/buecher` rendert `containedIn` bereits in den Row-Details (`src/app/buecher/page.tsx:576-587`).** Eine inline-Audit-Zeilen-Variante für „Auch enthalten in:" wäre Duplikat-UI. Konsequenz für die optionale DetailPanel-Variante:
   - **Zielsurface ist `/buch/[slug]` (Public-Detail-Page),** weil dort die `containedIn`-Information heute NICHT gerendert wird (überprüft: kein `containedIn`/`Auch enthalten`/`Enthält`-Match in `src/app/buch/[slug]/page.tsx`).
   - Die im Brief-Body genannten Alternativen „inline in der `/buecher`-Audit-Zeile" und „beides" entfallen. CC's Wahl reduziert sich auf: (i) Panel auf `/buch/[slug]` Public-Lean (Constraint aus 073: nur Collection-Titel als Link, keine Audit-Felder) **oder** (ii) Weglassen — Brief sagt explizit „optional".
   - Die `/buecher`-Audit-Zeile kriegt damit in 075 keine zusätzliche containedIn-Ausgabe. Wenn CC für die Audit-Surface eine Drift-spezifische Affordance findet (z. B. Mikro-Liste der Drift-Surface-Forms in der Audit-Strap), bleibt das in Track A's Design-Freiheit, ist aber **kein** „Auch enthalten in:"-Panel.

Die im Rest des Briefs genannten Stellen (Track-A-Constraints-Sektion „DetailPanel-Sichtbarkeit per Modus", Acceptance-Bullets, „Notes"-Reference-Liste) sind durch diesen Erratum-Block **überschrieben** in den genannten Punkten. CC liest unten weiter mit dem Erratum im Hinterkopf.

## Goal

Zwei kleine, voneinander unabhängige Tracks in einem Brief — bewusst klein gehalten, damit CC sie in einer Session abräumt und der Loop-Re-Trigger für `ssot-w40k-016` nicht zusätzlich blockiert wird.

**Track A — Cockpit-Refinement.** Mache die `drift`-Pille im `/buecher`-Audit-Modus für Maintainer-Triage actionable: innerhalb der drift-gefilterten Liste sortiert nach Drift-Frequenz (und sekundär Confidence), damit die freq≥2-Drift-Bücher zuerst auftauchen. Plus optional ein kleines „Auch enthalten in:"-DetailPanel, das die heute nur im Audit-Detail (`/buch/[slug]/audit`) sichtbare `containedIn`-Information dort sichtbar macht, wo sie Maintainer am ehesten lesen — entweder als Inline-Expansion der `/buecher`-Audit-Zeile oder als kompakter Block auf der Public-Detail-Seite. CC's Call (siehe Design freedom).

**Track B — OQ6 Hardcover-Rating-Promotion.** Schließe die offene OQ6 (`brain/wiki/open-questions.md`): drei Architektur-Calls (Field-Schema, OL-Fallback, retroaktive Strategie) plus ein kleiner Backfill-Script-Pfad, der Hardcover-Ratings für die heute 150 applied W40K-Bücher in `bookDetails.rating` schreibt, ohne Schema-Migration und ohne den V2-LLM-Pfad zu reaktivieren.

**Sicherheitsventil für OQ6.** Sollte sich beim Implementieren von Track B herausstellen, dass OQ6 mehr Aufwand verlangt als hier veranschlagt — z. B. Hardcover-GraphQL-Schema-Erweiterung um `ratings_count` ist nicht trivial, oder die Hit-Rate für die 150 Bücher fällt katastrophal (< 50 %), oder es taucht eine architektonische Frage auf, die nicht in dieser Session entschieden werden sollte — dann **darf CC Track B abbrechen und als separate Folge-OQ in `open-questions.md` auskoppeln** (Cowork prunt im Session-End). Track A blockiert nicht auf Track B; beide Tracks landen ggf. in eigenen Commits.

## Design freedom — read before everything else

Du hast den **frontend-design-Skill** installiert. Track A ist *architektonisch* eng (welcher Filter, welche Achse, welche Spalte ist sortable, welche Daten sind im DetailPanel) und *ästhetisch* offen. Alles, was visuelle Sprache, Spacing, Typografie, Animation, exakte Copy, oklch-Tokens, Klassen-Shapes betrifft, ist deine Entscheidung.

Was das konkret heißt — kein Pixel, kein ms, kein oklch-Triplet, keine Klassen-Shape von mir:

- **Drift-Sort-Affordance** — ich sage „im Audit-Modus mit aktiver `drift`-Pille sortieren nach (a) Drift-Frequenz, (b) Confidence absteigend, (c) `updatedAt desc` als Tie-Breaker". Ob das ein zusätzlicher Sort-Pill-Eintrag in `SortPills.tsx` ist („Drift-Triage" / „Drift first"), ob die `drift`-Pille im aktivierten Zustand visuell signalisiert, dass die Sortierung jetzt anders ist (Mikro-Caption „nach Drift-Frequenz sortiert", oder ein subtiles Icon, oder garnichts), ob die `updated`/`title`-Sort-Pills im Drift-Modus ausgeblendet, gedimmt oder normal aktivierbar bleiben — komplett deine. Wichtig ist nur das beobachtbare Outcome: ein Maintainer, der `?audit=drift` öffnet, sieht oben die Bücher mit den meisten Drift-Surface-Forms, nicht die zuletzt aktualisierten.

- **„Auch enthalten in:"-DetailPanel (optional)** — ich gebe dir den Inhalt (Collection-Titel als Link auf die Collection-Detail-Page, ggf. mit `displayOrder` und `basis` wenn audit-Modus, ohne in Public-Modus) und den Auslöser (nur rendern wenn `containedIn.length > 0`). Wo das Panel lebt, ist deine Wahl: (i) als Inline-Expansion in der `/buecher`-Audit-Zeile (etwa unter dem `row-audit-strip`), oder (ii) als kompakter Block auf `/buch/[slug]` (Public-Detail-Page, slim — nur Collection-Namen ohne Provenance), oder (iii) beides. Begründung im Report. Cogitator-Terminal-Voice darf in der Cockpit-Variante laut sein („CONTAINED ∈ {…}"); in der Public-Variante leise („Auch enthalten in:" mit Komma-Liste oder Pille-Strip). Falls dir der DetailPanel-Pfad nicht überzeugend einfällt, **lass ihn weg** und liefere nur den Drift-Sort — der Brief sagt explizit „optional".

- **Animations-Timings, Stagger, oklch-Triplets, Spacing-Skala, exakte Copy, Mikro-Caption-Voice** — komplett deine. Reference-Points zur Kalibrierung: aktuelle `SortPills.tsx` + `AuditPills`-Block in `src/app/buecher/page.tsx`, der bestehende `audit-collection-grid`-Block in `src/app/buch/[slug]/audit/page.tsx`. Brief 073 hat den Audit-Frame visuell etabliert — Track A baut auf dieser Voice auf, nicht daneben.

Wenn du dich beim Lesen ertappst, eine Klasse / einen Pixel / einen oklch-Wert hier erwartet zu haben — bewusst weggelassen.

Track B ist data engineering und braucht keine Design-Freiheits-Klausel — die einzige UX-Frage dort ist, ob das Backfill-Script Progress-Output formatiert; das gehört zur Implementer-Disziplin und nicht hier ins Brief.

## Context

**Pipeline-Stand 2026-05-15, post-Brief-074-impl (PR #57, `6ac4295`).** 150 W40K-Bücher in der Authority-Schicht (`ssot-w40k-001..015`). Globale Junction-Counts: `work_factions=912`, `work_locations=287`, `work_characters=522`, `work_collections=35`. Brief 061 (Standing-Loop) ist paused bei 150; Re-Trigger via Maintainer-Skip-Marker für `ssot-w40k-016`. Brief 073 (Maintainer-Audit-Cockpit) hat `/buch/[slug]/audit` und die vier `/buecher?audit=drift,gap,ssot,collections`-Pillen geliefert; Brief 074-impl hat eine SQL-Replica der Cockpit-Logik gegen den 150-Bücher-Stand laufen lassen.

**074-Cockpit-Quality-Feedback (Ursprung dieses Briefs, Track A).** Aus dem 074-impl-Report, Sektion „Audit-Cockpit-Tour via SQL":

> Die `drift`-Pille ist primärer Triage-Wert (raw_name-Audit), aber sie unterscheidet nicht zwischen „erwartetes lore-thin-Sub-Regiment-Surface-Form" und „resolver-Promotion-Kandidat" — die nächste Cockpit-Iteration könnte einen `confidence` / `frequency`-Sort innerhalb der drift-gefilterten Liste hinzunehmen, damit Maintainer-Triage die freq≥2-Drifts zuerst sieht.

Konkret: SQL-Replica zeigte für `W40K-0001..0100` `drift=72`, für `W40K-0101..0150` `drift=34`. Insgesamt ~106 Drift-Bücher; ohne Sortierung scrollt der Maintainer durch alle ~106 in `updatedAt desc`-Reihenfolge und sieht freq=1-Sub-Sub-Regiment-Surface-Forms (z. B. „472nd Siege Regiment" als raw_name auf `astra_militarum` resolved) gleichrangig mit freq=3-cross-batch-Drifts (z. B. „Drukhari" → `eldar` über mehrere Bücher hinweg). Die freq≥2-Drifts sind Resolver-Promotion-Kandidaten oder Alias-Hygiene-Kandidaten; die freq=1-Drifts sind erwartetes Long-Tail-Verhalten.

**Heutiger Drift-Begriff** (`src/app/buecher/page.tsx:120-122`): `hasResolvedDrift` ist `true`, wenn mindestens eine Junction-Row pro Buch ein `rawName ≠ name` trägt (Faction / Location / Character — alle drei Junction-Achsen). Drift ist heute eine pro-Buch-Boolean; Drift-Frequenz pro Buch ist trivial aus den `factionAuditRows` / `locationAuditRows` / `characterAuditRows` ableitbar (`rows.filter(r => r.rawName !== null && r.rawName !== r.name).length`, summiert über die drei Achsen).

**OQ6-Stand (Ursprung Track B).** In `brain/wiki/open-questions.md` OQ6 („Hardcover-Rating-Promotion + Open-Library-Fallback-Decision"). OQ6 wurde im Juni-2026-V2-Kontext aufgemacht: V2-Slim-Prompt hat `rating` aus `PUBLISH_ENRICHMENT_TOOL` rausgenommen, weil LLM via Web-Search keinen verlässlichen Wert produziert. Hardcover-GraphQL liefert ihn deterministisch und kostenlos; V2's `discoverHardcoverClaimV2` schreibt ihn bereits in `claim.raw.audit.averageRating` (`src/lib/ingestion/v2/sources/hardcover.ts:120`). Die Architektur-Lücke war: kein Promote-Pfad in einen renderable `BookV2Record.fields.rating`-Slot.

**Pipeline-Verschiebung post-OQ6-Anlage (relevant für Track B).** Seit Brief 061 (Standing-Loop) und insbesondere Brief 074 + Wiki-Hygiene-Pass 2026-05-15 ist die V2-LLM-Stage de-facto durch CC-Direct-Curation ausgemustert (`brain/wiki/decisions/why-cc-direct-curation.md`). Damit fällt die ursprüngliche OQ6-Form („`BookV2Record.fields.rating` als Field-Slot") als V2-Pipeline-Frage weg — aber:

- **Die DB-Spalten existieren bereits.** `bookDetails.rating numeric(3,2)`, `bookDetails.ratingSource varchar(32)`, `bookDetails.ratingCount integer` sind seit dem Phase-2-Schema da (`src/db/schema.ts:275-277`). **Keine Schema-Migration nötig.**
- **`discoverHardcoverClaimV2(title, expectedAuthor)` ist eine pure Library-Funktion**, importierbar aus einem Standalone-Script. Sie hängt nicht an der V2-LLM-Stage und braucht keinen Pipeline-Refactor.
- **Hardcover-GraphQL liefert heute `rating` aber NICHT `ratings_count`.** Der `SEARCH_QUERY` in `src/lib/ingestion/v2/sources/hardcover.ts:27-42` selektiert nur `id / title / slug / cached_tags / rating / contributions{author{name}}`. Wenn der Brief `ratingCount` als first-class Field will, ist das eine kleine GraphQL-Schema-Erweiterung (Hardcover-API-Field-Name validieren — `users_count` oder `ratings_count` oder ähnlich) plus Field-Pass-through.

**`apply-override.ts`-Touchpoints für Track B** (nur für Validierung des Pfads, nicht als Brief-Anforderung an apply-override-Änderung): heute schreibt `apply-override` Junction-Rows + `work_facets` + ggf. `book_details.notes`. Der Rating-Backfill läuft in 075 explizit **außerhalb** von apply-override (eigenes Script). Keine apply-override-Anpassung in diesem Brief.

**Sequenz zu offenen Briefs.** Brief 075 ist orthogonal zu Brief 061-Re-Trigger (`ssot-w40k-016`) und zur Wiki-Carry-over-Bedienung. Maintainer-Tool-Reihenfolge nach 074-Merge: 075 (Track A + Track B) → Brief-061-Re-Trigger für 016. Track A landet erst, Track B kann unabhängig davon in 075-eigene Commits.

## Constraints

### Shared (beide Tracks)

- **Keine Schema-Migration.** Track A nutzt vorhandene Audit-Daten in `/buecher`-Catalogue; Track B nutzt die bereits existierenden `bookDetails.rating` / `ratingSource` / `ratingCount`-Spalten.
- **Kein V2-LLM-Pipeline-Touch.** Track B importiert höchstens `discoverHardcoverClaimV2` als Library-Funktion; die V2-Enrichment-Stage selbst (`src/lib/ingestion/v2/llm/`) bleibt unangetastet. Auch keine Wiki-/ADR-Änderungen zu CC-Direct-Curation in diesem Brief.
- **Keine `apply-override.ts`-Änderung.** Track B's Backfill ist ein Standalone-Script. Falls CC während der Implementierung überzeugend findet, dass eine Mini-Integration in apply-override sauberer ist, im Report begründen und Cowork validiert im Folge-Brief — Default ist Standalone.
- **Brief-Konvention Reference-Daten.** Falls für Track A oder Track B ein neuer NPM-Dep nötig wäre: bitte im Report begründen, nicht stillschweigend hinzufügen. Default für 075: keine neuen Deps.

### Track A — Cockpit-Refinement

- **Drift-Sort gilt nur, wenn der Audit-Filter `drift` aktiv ist.** Im Public-Modus (`audit=` nicht gesetzt) bleibt `updated` / `title` der einzige Sort-Pfad — keine Drift-Sichtbarkeit für Public-Reader.
- **Sortierung deterministisch und stabil.** Primärschlüssel: Drift-Frequenz pro Buch (Summe über `work_factions` + `work_locations` + `work_characters` wo `raw_name ≠ name`, also exakt die Achsen, die heute `hasResolvedDrift` füttern). Sekundär: `works.confidence desc` (höchste Confidence zuerst, weil saubere Confidence + Drift = klarer Promotion-Kandidat). Tertiär: `updatedAt desc` als Tie-Breaker.
- **Drift-Frequenz wird im selben DB-Read berechnet, der heute `hasDrift` baut.** Kein zweiter Query, keine N+1. Idealerweise ein neues Feld `audit.driftCount: number` auf `CatalogueBook.audit`, das `matchesAudit`/`sortBooks` lesen kann.
- **Kein neuer Audit-Pillen-Modus.** Drift bleibt eine Pille; Sortierung schaltet implizit um, wenn drift aktiv ist (oder per zusätzlicher Sort-Pill „Drift first" — CC's Design-Call, siehe Design freedom).
- **Drift-Sort soll mit anderen Audit-Pills komposierbar bleiben** — wenn ein Maintainer `?audit=drift,ssot` aktiviert (Drift ∩ SSOT-Books), gilt weiterhin Drift-Frequenz-Sort. Audit-Filter und Sort sind orthogonal.

### Track A — „Auch enthalten in:"-DetailPanel (optional)

- **Datengrundlage: existierende `containedIn`-Information.** Die Catalogue-Page hat `containedIn: ReadonlyArray<{ collectionSlug, collectionTitle }>` bereits; die Audit-Detail-Page hat zusätzlich `displayOrder`/`confidence`/`basis`. Track A nutzt vorhandene Felder, fügt keine neuen DB-Reads hinzu.
- **Sichtbarkeit per Modus:**
  - Wenn das Panel auf `/buch/[slug]` (Public) landet: **nur Collection-Titel als Link**, keine Audit-Felder (kein `displayOrder`, kein `confidence`, kein `basis` — Public-Lean-Constraint aus 073).
  - Wenn das Panel inline in `/buecher` Audit-Modus-Zeile landet: Maintainer-Voice mit Audit-Feldern erlaubt.
  - Wenn beides: zwei Komponenten oder eine Komponente mit `mode: 'public' | 'audit'`-Prop — CC's Wahl.
- **Wenn `containedIn.length === 0`: nichts rendern**, kein „Auch enthalten in: keine"-Placeholder im Public-Modus.
- **Falls Public-Variante: bleibt der „Public-Lean"-Konstraint aus Brief 073 gewahrt.** Keine Audit-Lärm-Spalten auf der Public-Page; das Panel ist ein Reader-Feature („dieses Buch ist Teil von …"), nicht ein Audit-Trail.

### Track B — Field-Schema (Cowork-Entscheidung)

- **Verwende die bereits existierenden Spalten:** `bookDetails.rating` (numeric 3,2 — 0,00 bis 9,99 möglich; Hardcover liefert 0–5 mit Decimals), `bookDetails.ratingSource` (varchar 32 — Werte `'hardcover'` für 075-Scope, `'openlibrary'` reserved für ggf. Folge-Brief), `bookDetails.ratingCount` (integer, nullable).
- **`ratingCount` ist optional in 075.** Wenn Hardcover's heutiger `SEARCH_QUERY` keinen Count liefert (so wie es aussieht), bleibt die Spalte `NULL` und Backfill setzt nur `rating` + `ratingSource='hardcover'`. **CC's Call:** wenn das Hardcover-GraphQL-Schema einen Count-Field unterstützt (CC validiert via Hardcover-Docs oder Schema-Introspection), darf der `SEARCH_QUERY` um dieses Feld erweitert werden und Backfill schreibt `ratingCount` mit. **Nicht zwingend** — keine GraphQL-Schema-Erweiterung als 075-Acceptance.
- **Kein zweites Rating-Field.** `BookV2Record.fields.rating` (V2-Pipeline-Form aus OQ6) ist explizit moot post-CC-Direct-Curation; der V2-Pfad bekommt in 075 keinen Rating-Slot. Die Single-Source-of-Truth ist `bookDetails.rating`.

### Track B — OL-Fallback (Cowork-Entscheidung)

- **In 075: kein OL-Fallback.** Hardcover-only.
- **Begründung.** (i) Wir wissen empirisch noch nichts über die Hit-Rate; ohne Daten Open-Library-Calls einzubauen, ist over-engineering. (ii) OL-Ratings für 40K-Titel sind statistisch dünn (0–5 Ratings pro Titel — Rauschen) — der Marginal-Value pro OL-Call ist niedrig. (iii) Track B soll klein bleiben; OL-Fallback verdoppelt den Fehlerpfad (Auth-frei, aber Rate-Limiting, Endpoint-Stabilität).
- **Promote-Trigger für OL-Folge-Brief.** Wenn der 075-Backfill-Lauf eine Hardcover-Hit-Rate < 70 % über die 150 W40K-Bücher zeigt, schreibt CC im Report eine For-next-session-Empfehlung „OQ Hardcover-OL-Fallback öffnen"; Cowork promotet das dann in `open-questions.md`. ≥ 70 % Hit-Rate: Track B gilt als abgeschlossen.

### Track B — Retroactive-Strategie

- **Standalone Backfill-Script.** `scripts/backfill-hardcover-rating.ts`. Iteriert über `works` JOIN `book_details` wo `book_details.rating IS NULL` (Default-Modus, idempotent) oder über alle `works` (`--force`-Flag, überschreibt bestehende Rating-Werte). Pro Buch: `discoverHardcoverClaimV2(work.title, primaryAuthor)` aufrufen, wenn Hit `bookDetails.rating = matched.rating`, `ratingSource = 'hardcover'`, ggf. `ratingCount = matched.<count_field>`. Persistiert pro Buch via direkten Drizzle-UPDATE.
- **Hit/Miss-Buchhaltung im Report.** CC schreibt eine kompakte Counts-Tabelle: total / Hits / Misses (mit Reason-Bucket: `null_result` / `author_mismatch` / `no_author` / `graphql_error` / `token_missing` — siehe Erratum-Punkt 3; CC darf weitere ergänzen, wenn das Hardcover-Result-Shape welche nahelegt), pro `ssot-w40k-NNN`-Batch oder global — CC's Wahl der Granularität. Ziel: Hit-Rate berechenbar.
- **Idempotent + reproduzierbar.** Default-Pfad (`bookDetails.rating IS NULL`) ist mehrfach-laufbar ohne Side-effect. `--force` ist explicit opt-in für Refresh-Läufe.
- **NPM-Script-Eintrag.** `package.json` bekommt `"backfill:hardcover-rating": "tsx --env-file=.env.local scripts/backfill-hardcover-rating.ts"` (siehe Erratum-Punkt 1 — `--env-file=.env.local` ist verbindlich, konsistent mit `db:apply-override`, `db:seed-resolver-extensions`, `db:migrate`, `ingest:backfill`).
- **`HARDCOVER_API_TOKEN` ist Voraussetzung.** Das Script bricht loud ab, wenn Token fehlt (`isHardcoverEnabled()`-Check vorne, klare Fehlermeldung). `.env.example` wird *nicht* angefasst (Token-Variable existiert dort schon laut V2-Pipeline-Konventionen — CC verifiziert, sonst minimaler Hinweis).
- **Keine Anpassung an `apply-override.ts`.** Backfill läuft als post-loop-Schritt. Wenn der nächste Loop-Wave (Brief 061 `ssot-w40k-016+`) frische Bücher in die DB schreibt, läuft der Backfill danach noch einmal über die neuen Rows (idempotenter Default).

## Out of scope

- **Schema-Migration.** Nicht in 075 — beide Tracks reichen mit existierenden Spalten / Feldern aus.
- **OL-Fallback-Implementation.** Reserved für ggf. Folge-OQ, siehe Promote-Trigger oben.
- **`apply-override.ts`-Integration für Rating.** Backfill bleibt standalone.
- **V2-LLM-Pipeline-Reaktivierung / -Refactor.** Nicht hier; siehe `brain/wiki/decisions/why-cc-direct-curation.md`.
- **Universe-Year-Walker / Multi-Era-Sichtbarkeit / `availability`-Field-Promotion.** Bleibt in `brain/wiki/deferred-questions.md`.
- **Brief 061 Loop-Re-Trigger für `ssot-w40k-016`.** Separat — Maintainer-Workflow-Schritt nach 075-Merge.
- **Tag-Hygiene / Vokabular-Erweiterung.** Bleibt in der laufenden Cockpit-Triage (OQ2-Closure-Note in `open-questions.md`).
- **Cawl/Watson-Retinue-Cockpit-Markierung.** Falls bei der Drift-Sort-Arbeit erkennbar wird, dass `tone: 'historical_canon_layer'` oder die `notes: 'historical_canon_layer; …'`-Marker im Cockpit eine eigene Pille / Filter verdienen — **nicht in 075** umsetzen; im Report flaggen, Cowork öffnet ggf. eine eigene OQ.
- **`hasJunctionGap`-Sort-Refinement.** Analoge Frage zu Track A („sortiere `gap` nach Anzahl fehlender Junction-Achsen") — bewusst nicht in 075; nur drift.
- **Public-Detail-Page Audit-Lärm.** Die `/buch/[slug]`-Public-Page bleibt slim (Brief-073-Constraint). Die optional-DetailPanel-Variante darf dort nur Collection-Titel als Link rendern, keine Audit-Felder.

## Acceptance

### Track A — Drift-Sort

Die Session ist für Track A done, wenn:

- [ ] `/buecher?audit=drift` zeigt Bücher absteigend nach Drift-Frequenz (Anzahl `raw_name ≠ name` über alle drei Junction-Achsen summiert), Tie-Break über `works.confidence desc`, dann `updatedAt desc`.
- [ ] Drift-Sort ist composable mit anderen Audit-Pills (`?audit=drift,ssot`, `?audit=drift,gap` etc.) — drift bleibt primärer Sortier-Schlüssel, solange `drift` aktiv ist.
- [ ] Im Public-Modus (`audit` nicht gesetzt) bleibt das bestehende Sort-Verhalten (`updated` / `title`) unverändert.
- [ ] Drift-Frequenz wird einmalig im `/buecher`-Server-Component-Read berechnet, ohne zusätzlichen DB-Round-Trip (kein N+1).
- [ ] Visuelle Affordance, die einem Maintainer signalisiert, dass die Sortierung im Drift-Modus anders ist (Form: deine — Mikro-Caption, Sort-Pill-Eintrag, Pill-Active-State, oder etwas dazwischen).
- [ ] `npm run lint`, `npm run typecheck`, `npm run dev` (Hot-Reload < 5s) sind green.
- [ ] Smoke-Spot-Check im Report: 3–5 Bücher mit dokumentiertem Drift-Count + Confidence + erwarteter Reihenfolge. Idealerweise inklusive eines freq=1- und eines freq≥2-Drift-Buchs, damit die Sortierung sichtbar greift.

### Track A — „Auch enthalten in:"-DetailPanel (optional)

Falls implementiert:

- [ ] Panel rendert nur, wenn `containedIn.length > 0`.
- [ ] Im gewählten Surface (Public / Audit / beides): Collection-Titel ist Link auf die Collection-Buch-Detail-Page.
- [ ] Public-Variante: keine Audit-Felder (`displayOrder` / `confidence` / `basis`) sichtbar.
- [ ] Smoke-Spot-Check im Report mit mindestens einem Buch, das `containedIn ≥ 2` Collections hat (Brief 072: 35 `work_collections`-Rows global, mehrere multi-collection-Bücher vorhanden — CC findet sie via `/buecher?audit=collections`).
- [ ] Falls nicht implementiert: kurze Begründung im Report („nicht überzeugend platzierbar in 075-Scope" / „Datengrundlage reicht nicht ohne zweiten Query" o. ä.). Akzeptiert — der Brief sagt explizit „optional".

### Track B — Hardcover-Rating-Promotion

Die Session ist für Track B done, wenn:

- [ ] `scripts/backfill-hardcover-rating.ts` existiert, importiert `discoverHardcoverClaimV2`, schreibt `bookDetails.rating` + `bookDetails.ratingSource = 'hardcover'` für die 150 applied W40K-Bücher in der DB (Scope-Filter `works.source_kind='ssot' AND works.external_book_id LIKE 'W40K-%' AND works.kind='book'` — siehe Erratum-Punkt 2).
- [ ] Default-Modus ist idempotent (zusätzlich `bookDetails.rating IS NULL` Filter); `--force` Flag überschreibt explizit, bleibt aber im W40K-SSOT-Scope (Erratum-Punkt 2).
- [ ] Author-Missing-Rows (`primaryAuthor` leer/`null`) werden NICHT an `discoverHardcoverClaimV2` übergeben — Miss-Bucket `no_author` (Erratum-Punkt 3).
- [ ] `package.json` trägt `"backfill:hardcover-rating": "tsx --env-file=.env.local scripts/backfill-hardcover-rating.ts"` (Erratum-Punkt 1).
- [ ] Counts-Tabelle im Report: total / Hits / Misses, Hit-Rate als Prozentzahl. Reason-Buckets bei Misses (`null_result` / `author_mismatch` / `no_author` / `graphql_error` / `token_missing` — Erratum-Punkt 3, CC darf weitere ergänzen).
- [ ] `npm run typecheck` green; das Script läuft mindestens einmal real gegen die DB durch (mit echtem `HARDCOVER_API_TOKEN`).
- [ ] CC dokumentiert im Report die Entscheidung zu `ratingCount`: ob das Field aus dem Hardcover-Schema verfügbar ist und ob `SEARCH_QUERY` erweitert wurde oder nicht. Wenn nicht erweitert: `bookDetails.ratingCount` bleibt `NULL` für alle 150 Bücher.
- [ ] **Falls Hardcover-Hit-Rate < 70 %**: For-next-session-Empfehlung im Report „OQ Hardcover-OL-Fallback öffnen" mit Trigger-Begründung. Cowork promotet das im Session-End in `open-questions.md`.

### Sicherheitsventil

- [ ] **Falls Track B während der Implementierung architektonisch unsicher wird** (Hardcover-API-Schema-Erweiterung non-trivial, Hit-Rate-Vorab-Probe katastrophal, anderes Architektur-Element taucht auf), darf CC Track B abbrechen — Track A landet trotzdem, und der Report dokumentiert in „For next session" die Sub-OQ-Spec für die Folge-Session. **Cowork akzeptiert Track-B-Abbruch explizit; Track A blockiert nicht auf Track B.**

## Open questions

Inputs, die Cowork im Folge-Brief gerne hätte (nicht Blocker):

- **Drift-Sort vs. Audit-Pill-State.** Welche Form hat sich für die „Sort schaltet implizit um"-UX am natürlichsten angefühlt? Zusätzlicher Sort-Pill-Eintrag? Mikro-Caption unter den Audit-Pills? Indikator auf der `drift`-Pille selbst? — Damit Cowork weiß, ob das Pattern auf `hasJunctionGap` / `isInMultipleCollections` übertragbar wäre (Folge-Briefs).
- **DetailPanel-Platzierung.** Falls implementiert: Public oder Audit-Inline oder beides — und warum? Falls weggelassen: woran lag's? — Hilft Cowork bei der Frage „Public-Page um Reader-Features erweitern, oder Cockpit-Lärm-Verdichtung weiter pflegen".
- **Hardcover-Hit-Rate.** Konkrete Zahl plus Reason-Bucket-Verteilung. Wenn z. B. 90 % der Misses `author_mismatch` sind, ist das ein Anti-False-Positive-Wert (gut), nicht ein Coverage-Loch.
- **`ratingCount` aus Hardcover-Schema.** Ist es deterministisch erreichbar (existiert ein `ratings_count` / `users_count` / ähnlich)? Falls ja: hat CC den `SEARCH_QUERY` erweitert oder bewusst nicht?
- **Drift-Frequenz-Verteilung über die 106 Drift-Bücher.** Pareto-artig (wenige Bücher mit hoher Drift, viele mit 1-2) oder gleichmäßig? — Hilft Cowork, die Triage-Disziplin in `brain/wiki/workflows/`-Cockpit-Section zu kalibrieren.

## Notes

**Was 075 NICHT versucht.** Ein „großer" Cockpit-Refinement-Brief (Detail-Panels für jede Achse, mehrere Sortier-Modi, Vokabular-Triage-UI) wäre zu breit. 075 macht *einen* Schritt — drift gewinnt Sort-Priority, weil das 074-impl-Feedback eindeutig war. Wenn Track A landet und sich bewährt, kommen analoge Schritte für `gap` / `collections` in eigenen kleinen Briefs.

**Was Track B NICHT versucht.** Eine vollständige „Rating-Ingestion-Strategie" (Hardcover + OL + Goodreads-Lookalike + UI-Anzeige + Sort-by-Rating in `/buecher`) wäre Phase-4-Material. 075 schließt nur die OQ6-Architektur-Calls und schreibt Werte in eine existierende Spalte. UI-Sichtbarkeit (`bookDetails.rating` auf `/buch/[slug]` rendern) bleibt für einen Folge-Brief — heute liest die Public-Detail-Page kein `rating`-Feld, und das ist Public-Surface-Design, kein Mini-Brief.

**Reference-Files.**

- `src/app/buecher/page.tsx` — Catalogue (Drift-Compute in Z. 120-122, `audit`-Block in Z. 294-307, `matchesAudit` in Z. 327-334, `sortBooks` in Z. 317-325).
- `src/app/buecher/SortPills.tsx` — Sort-Pill-Komponente; Reference-Voice für Track A's Drift-Sort-Affordance.
- `src/app/buch/[slug]/audit/page.tsx` — Audit-Detail mit `audit-collection-grid` (Z. 452-489), Reference für eine „Auch enthalten in:"-Variante.
- `src/app/buch/[slug]/page.tsx` — Public-Detail-Page; rendert heute NICHT `containedIn` — wäre der natürliche Public-Surface für die optionale DetailPanel-Variante.
- `src/lib/ingestion/v2/sources/hardcover.ts:66-126` — `discoverHardcoverClaimV2`-Funktion plus `SEARCH_QUERY` für Track B's Backfill.
- `src/db/schema.ts:272-277` — `book_details.rating` / `rating_source` / `rating_count` Spalten.
- `brain/wiki/open-questions.md` — OQ6-Eintrag, der mit 075-Track-B fallen sollte (sofern Track B nicht abbricht); 075-Carry-over für ggf. neue OL-Fallback-OQ.
- `brain/wiki/decisions/why-cc-direct-curation.md` — Pipeline-Shift-ADR, kontextuell relevant für „warum kein V2-Slot".
- `sessions/2026-05-15-074-impl-resolver-batch-3.md` — 074-impl-Report mit dem Cockpit-Quality-Feedback, das Track A motiviert.

**Brief-Größe.** Bewusst klein — zwei orthogonale Tracks, jeder rund ein Tag CC-Arbeit, beide ohne Schema-Migration. Wenn Track B abbricht, ist 075 trotzdem ein erfolgreicher Mini-Refinement-Brief für die Cockpit-UX-Triage; OQ6 wandert dann in eine eigene Folge-Session mit präziserer Spec.
