---
session: 2026-06-11-140
role: implementer
date: 2026-06-11
status: complete
slug: backend-deep-review
parent: (kein Arch-Brief — Direktauftrag Philipp, Review-Session)
links: [2026-06-10-137, 2026-06-09-133]
commits:
  - (der Commit, der diesen Report trägt)
---

# Backend-Deep-Review — DB-Zukunftssicherheit, Pipeline-Angemessenheit, Concurrency/Last

> Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion,
> Branch: `codex/ingest-batches-backend-deep-review`.
> **Read-only-Session:** keine DB-Writes, kein apply/rebuild/migrate, keine Crawls.
> Einzige Schreibzugriffe: diese Datei. Live-DB wurde nur mit SELECT/Counts/
> information_schema/EXPLAIN befragt.

## Summary

Drei Dimensionen, 96 Roh-Findings aus 10 parallelen Finder-Agents, **jedes einzelne
adversarial von einem zweiten Agent gegen Code und Live-DB verifiziert**: 13 voll
bestätigt, 69 bestätigt mit Detail-Korrekturen (im Report eingearbeitet), 14 widerlegt
und aussortiert (§ „Widerlegte Findings"). Die wichtigsten Ergebnisse:

1. **Die DB ist strukturell gesund.** Indizes decken die echten Loader-Queries ab
   (EXPLAIN über die ~10 heißesten Queries: keine relevanten Seq-Scans, alles unter
   1 ms außer den bewusst fetten Browse-Loadern), keine verwaisten Rows, Apply-Pfade
   weitgehend idempotent. Die Befunde der Dimension A sind Härtungs-Feinschliff
   (fehlende CHECKs/NOT NULLs, ein doppelter Index, Provenance-Lücken auf Junctions),
   kein strukturelles Problem.
2. **Die größte einzelne Baustelle ist Caching, nicht die DB** (Dimension C):
   `/archive`, `/buch/[slug]` und `/buecher` treffen die DB pro Request, obwohl sich
   die Daten höchstens wöchentlich ändern. Das Connection-Budget (Client `max:5`
   gegen Pooler-default_pool_size ~15, `max_connections=60`) ist bewusst knapp
   kalibriert und **richtig so** — die Kante bei 20+ Nutzern verschiebt man am
   billigsten mit ISR/`cachedRead` auf den drei genannten Routen, nicht mit mehr
   Connections.
3. **Die Pipeline ist für den Tröpfel-Betrieb überdimensioniert, aber nicht kaputt.**
   ~20 Scripts sind tote Bulk-Relikte (Stilllegungs-Kandidaten mit Beleg), die
   Runbooks beschreiben teils veraltete Zustände, und es gibt **9 operative
   Landminen** (Reihenfolge-Abhängigkeiten nur in Runbooks/Köpfen, Muster OQ 16a) —
   vollständige Liste mit Absicherungs-Vorschlägen in § B3. Der entworfene
   **Nachzügler-Pfad** (ein Buch von Discovery bis applied, 5 Stationen, 2 neue dünne
   Wrapper, Rest Wiederverwendung) ist nach Feasibility-Review umsetzbar — mit der
   wichtigen Korrektur, dass Nachzügler-Batches dem erzwungenen Namensschema
   `ssot-w40k-NNN` folgen müssen (Regex in `apply-override.ts:138`), nicht einem
   neuen `single-*`-Schema.
4. **Schiedsspruch TRUNCATE-Semantik** (weil zwei Verifizierer sich widersprachen):
   `TRUNCATE works CASCADE` leert `event_works` und `podcast_episode_details` mit —
   TRUNCATE-CASCADE folgt FK-*Referenzen*, unabhängig von der ON-DELETE-Regel
   (`event_works.work_id` ist `NO ACTION`, wird trotzdem truncated). Das deckt sich
   mit der Postgres-Doku und dem empirischen Befund aus impl 137 / OQ 16a. Aussagen
   einzelner Agents, der TRUNCATE würde an der NO-ACTION-FK „hart scheitern", sind
   falsch und wurden nicht übernommen.

Am Ende: § „Brief-Kandidaten" mit einem Schnittvorschlag in priorisierte Briefs.

## Methodik

- Workflow mit 107 read-only Agents (Explore-Typ): 9 Finder (A1–A3, B1, B3, C1–C4)
  + 1 Nachzügler-Pfad-Designer; danach 1 adversarialer Verifizierer **pro Finding**
  (Auftrag: aktiv widerlegen, file:line nachschlagen, SQL nachfahren) + 1
  Feasibility-Reviewer für das Pfad-Design.
- Verdikte: `confirmed` (13), `adjusted` (69 — Kern bestätigt, Details korrigiert;
  dieser Report enthält die **korrigierten** Fassungen), `refuted` (14 — aussortiert,
  Begründungen in § „Widerlegte Findings").
- Live-DB-Stand 2026-06-11: works 1987 (889 Bücher + 1094 Podcast-Episoden + 4 Shows),
  work_facets 17299, work_factions 4324, work_characters 2563, work_locations 1526,
  external_links 1108, book_details 889, characters 500, locations 300, event_works
  223, factions 206, events 144, persons 136. Postgres 17.6, `statement_timeout` der
  App-Rolle 120 s, `max_connections` 60 (3 superuser-reserviert).
- Kennzeichnung unten: **[✓]** = voll bestätigt, **[✓±]** = bestätigt mit Korrektur
  (Korrektur eingearbeitet). Impact: hoch/mittel/niedrig · Aufwand: S/M/L.

---

## Dimension A — DB-Zukunftssicherheit

### A.1 Indizes & Schema-Hygiene

**A1-12/A1-4 [✓±] Doppelter Slug-Index auf `works`** — *Indizes · mittel/S (Impact
niedrig, aber gratis)*
`src/db/schema.ts:242` (`.unique()`) **und** `:289` (`index("works_slug_idx")`)
erzeugen zwei identische Indizes auf `slug`: `works_slug_unique` (208 kB, idx_scan=0)
und `works_slug_idx` (208 kB, idx_scan=2786). Der UNIQUE-Index allein erfüllt beide
Zwecke (Constraint + Lookup); der explizite Index ist redundant und kostet doppelte
Index-Maintenance bei jedem Write.
**Vorschlag (fixen):** `slugIdx`-Zeile aus schema.ts entfernen + Migration 0013 mit
`DROP INDEX works_slug_idx`. Sonst keine Index-Probleme: pg_indexes/EXPLAIN-Abgleich
über alle Loader-Queries fand **keine fehlenden Indizes** (C2-8, bestätigt; die
beiden index-losen FK-Spalten `works.setting_anchor_event_id` und
`video_details.channel_work_id` sind ohne WHERE-Nutzung bzw. auf leerer Tabelle —
kein Handlungsbedarf, A1-1 [✓±]).

**A1-11 [✓] Fehlende FKs: `characters.primaryFactionId`, `factions.parentId`** —
*Integrität · mittel/S*
Beide Spalten referenzieren `factions.id` ohne FK-Constraint (Migration 0000 definiert
keine). Heute 0 Orphans (Live-Check), aber ein künftiger Faction-Delete hinterließe
stille Orphans bzw. erlaubt zirkuläre `parentId`-Ketten.
**Vorschlag (fixen):** FKs mit `ON DELETE SET NULL` in Migration 0013 — oder bewusste
Doku „optional hints, App-Verantwortung" im Schema-Kommentar. Empfehlung: FK, kostet
nichts.

**A1-3 [✓±] `external_links.confidence` nullable trotz Default** — *Nullability ·
niedrig/S*
`source_kind` ist NOT NULL, `confidence` nur `.default("1.00")` ohne `.notNull()`
(schema.ts:644). 0 NULLs in 1108 Rows, weil alle Insert-Pfade beide setzen — Silent
Contract. **Vorschlag:** `SET NOT NULL` in 0013 (keine Datenänderung nötig) +
`.notNull()` im Schema.

**A1-6 [✓] `events.source_kind`/`confidence` ohne Validierung** — *text-vs-enum ·
niedrig/M*
`source_kind` text (20 Distinct-Werte: `lex`, `fandom`, `chron`, … + Kombis
`lex/fandom`), `confidence` varchar(1) (nur H/M/L) — bewusst flexibel (schema.ts:754
dokumentiert das). Asymmetrische App-Validierung: `apply-timeline-data.ts:220` prüft
confidence streng gegen {H,M,L}, `:209` prüft sourceKind nur auf „nicht leer" —
Tippfehler-Varianten kämen durch. **Vorschlag:** confidence als pgEnum('H','M','L')
(stabil seit Brief 137); source_kind bleibt text, bekommt aber eine Whitelist-Warnung
im Apply (kein Hard-Fail, Kurations-Vokabular darf wachsen).

**A1-7 [✓±] Keine `start_y <= end_y`-Checks** — *numeric-Skala · mittel/S*
numeric(10,3) ist konsistent über works/events/eras (information_schema bestätigt),
0 Ordnungsverletzungen live. Aber: `apply-timeline-data.ts` validiert startY>endY nur
für book-dates.json (Z. 336), **nicht** für events.json/eras.json. **Vorschlag:**
(1) Validierung im Apply für events+eras nachziehen (S); (2) optional DB-CHECK
`start_y IS NULL OR end_y IS NULL OR start_y <= end_y` in 0013 als Defense-in-Depth.

**A1-10 [✓±] `film_details`/`video_details` leer** — *Doku · niedrig/S*
Bewusste Phase-4+/5-Platzhalter (Schema-Kommentar + Relations belegen das), kein Bug.
**Vorschlag:** Schema-Kommentar präzisieren, dass beide bewusst leer bleiben bis zur
Non-Book-Ingestion — verhindert Maintainer-Verwirrung. Nichts löschen.

### A.2 Provenance

**A1-8 [✓] Junctions ohne `source_kind`/`confidence`** — *Provenance · niedrig/S*
`works` und `external_links` tragen vollständige Provenance (0 NULLs live);
`work_factions`/`work_characters`/`work_locations` haben nur `raw_name` (Brief 063),
keine source_kind/confidence. Für den heutigen manuellen Betrieb (CC-Direct-Curation,
kein LLM-Enrichment) reicht raw_name + works-Level-Provenance; die Lücke wird erst
relevant, falls je ein automatischer Pass diese Junctions anreichert.
**Vorschlag:** dokumentierte Entscheidung („Junction-Audit = raw_name + Parent-
Provenance") in den Schema-Kommentar — Spalten-Nachrüstung (6 ALTER ADD, S) nur wenn
LLM-Enrichment der Junctions wieder geplant wird.

### A.3 Integrität & Idempotenz der Apply-Pfade

Geprüft: apply-override, apply-podcast, apply-timeline-data, apply-audiobook-narrators,
seed, db-reset-for-ssot, db-rebuild. Ergebnis: **kein Orphan in der Live-DB** (alle
Junction-FKs existieren, LEFT-JOIN-Probes = 0), alle Haupt-Pfade upserten idempotent
in per-Buch-Transaktionen. Zwei echte Lücken:

**A2-2 [✓] `applyCollections()` ohne Transaktionsklammer** — *Idempotenz · mittel/S*
`apply-override.ts:1087–1092` (zwei DELETEs) + `:1140` (INSERT) laufen **außerhalb**
einer Transaktion — Abbruch dazwischen hinterlässt halb-gelöschte `work_collections`,
die kein Retry rekonstruiert (Retry inserted nur die neuen Paare). Kontrast: 
`applyBook()` (Z. 819) wrappt korrekt in `db.transaction()`.
**Vorschlag (fixen):** beide DELETEs + INSERT in eine `db.transaction()` ziehen. S.

**A2-4 [✓±] Collections-Idempotenz hängt an unausgesprochener Roster-Annahme** —
*Doku · niedrig/S*
Die Delete/Insert-Logik ist nur idempotent, solange `book-roster.json` zwischen
Batch-Applies unverändert bleibt (Collections zentral im Roster). Heute gegeben;
bricht, falls Collections je inkrementell in Override-Files wandern.
**Vorschlag:** ASSUMPTION-Kommentar über `applyCollections()`.

**A2-1** (apply:timeline fehlt im Rebuild) → konsolidiert als **Landmine 1** in § B3.

### A.4 Wachstum 2x/5x

Kernbild: Bei 5x (works ~10k, work_facets ~86k, Episoden ~5.5k) bleiben die
Index-Pfade gesund — was kippt, sind die **Vollscan-Loader und ungecachten Routen**,
nicht die DB selbst. Die Wachstums-Befunde überschneiden sich deshalb stark mit
Dimension C (Caching) und sind dort actionable; hier die Substanz:

**A3-002 [✓±] Browse-Listen ohne Limit/Pagination** — *Pagination · hoch/M*
`/archive` (`loadBrowseBooks()`, src/app/archive/loader.ts:54, 4 Relationen) und
`/buecher` (`loadBooks()`, src/app/buecher/page.tsx:146, 6 Relationen) laden **alle
889 Bücher samt Relationen** pro Request ohne `.limit()`; Filter laufen danach
in-memory. Korrektur des Verifizierers: das Ergebnis ist server-gerendertes HTML
(kein JSON-Payload an den Client), aber das HTML ist bei 889 expandierbaren Einträgen
bereits mehrere MB und wächst linear. Bei 5x: ~4.5k Bücher pro Request laden + rendern.
**Vorschlag:** DB-seitige Pagination (`?page=`/Load-more) für beide Listen — oder
mindestens ISR + `cachedRead` als Sofortmaßnahme (→ C3). Drizzle erzeugt für die
`with:`-Relationen übrigens separate Batch-Queries, **keinen** kartesischen Join
(C2-2 [✓±]) — die im Roh-Finding zitierten 180 ms stammten aus einer künstlichen
JOIN-Vergleichsquery, nicht aus dem echten Loader (A3-001 [✓±]).

**A3-011 [✓±] Entity-Loader ohne Limit** — *Limits · mittel/M*
`loadEntity()` lädt alle Related Works ungebremst (loader.ts:288–304 u. a.); größte
echte Gruppen heute: Astra Militarum 234, Orks 223, Terra 184, The Emperor 118 Werke.
Render-Seite zeigt alles (RelatedWorks.tsx:42–68). Bei 5x werden Faction-Seiten
mehrere hundert Einträge rendern. **Vorschlag:** Pagination oder Tab-Lazy-Load auf
Entity-Detailseiten; Schwelle nicht akut, aber vor einem Reddit-Launch sinnvoll.

**A3-009 [✓±] Podcast-Suchindex im RSC-Payload** — *Payload · niedrig/M*
`loadPodcastSearchIndex()` serialisiert alle 1094 Episoden (~159 kB unkomprimiert,
~145 B/Episode) in jede Seite mit Suchfeld; UI zeigt Top-6. Bei 5x ~800 kB. Gzip
mildert (~40 kB), trotzdem Verschwendung. **Vorschlag:** Typeahead auf API-Route +
Lazy-Load bei Fokus umstellen, wenn Episoden-Zahl weiter wächst.

**A3-003/A3-010 [✓±] Build-Zeit-Statik** — *Build · niedrig (heute)/M*
generateStaticParams erzeugt heute 1146 Entity-Seiten (500 Charaktere + 206 Fraktionen
+ 300 Welten + 136 Personen + 4 Podcasts; /buch/[slug] hat **kein** Prerender). Zwei
belegte Datenpunkte entschärfen die Sorge: Brief-109-Messung ~1004 Seiten in 3.6 s
(~3.6 ms/Seite, C2-11-Refutation), und `/archive/podcasts/[slug]` wurde am 2026-06-11
(Commit 2d476dc) bereits auf leeres generateStaticParams + ISR umgestellt;
`staticPageGenerationTimeout: 180` ist gesetzt. **Vorschlag:** kein Akut-Handeln; bei
5x das Podcast-Muster (leeres generateStaticParams + `revalidate`) auf die
Entity-Routen ausdehnen. Achtung Datenpunkt Pooler: beim lokalen Build reichten 15
parallele Export-Worker für Timeouts — Remote-Build (Vercel) und Brief-109-Messung
zeigen das Problem nicht; die Grenze ist die lokale Worker-Parallelität gegen den
Pooler, nicht die Seitenzahl.

---

## Dimension B — Pipeline-Angemessenheit (Tröpfel-Betrieb)

Kontext: 859/859 konsolidiert (Roster inzwischen 889 Bücher in 90 Batches — 60 W40K +
30 HH; die „87 Batches"-Zahl im ssot-loop-runbook ist veraltet, B1-8 [✓±]).

### B1 Toter / stillzulegender Pipeline-Code

Inventar über alle 91 Scripts + 60+ npm-Targets, gegengeprüft per grep über Runbooks,
CI, Scripts, brain/wiki und Sessions:

| # | Kandidat | Beleg | Vorschlag |
|---|---|---|---|
| B1-1 [✓] | **15 versionsgebundene Wellen-Helfer**: `aggregate-surface-forms-{074,076}`, `audit-cockpit-{replica-074,sql-076}`, `db-counts-{076,077,084}`, `run-phase4-apply-076.sh`, `smoke-drift-sort-075`, `smoke-locations-084`, `smoke-slugs-{074,076,077}`, `snapshot-counts-074`, `strip-unknown-facets-074` | Header sagen explizit „one-shot / Brief NNN helper"; 0 Referenzen in Runbooks/CI/npm; letzter Session-Bezug Mai 2026 | Stilllegen: nach `scripts/archive/` verschieben + `scripts/ARCHIVED_SCRIPTS.md` (Brief, Zweck, Datum). mittel/S |
| B1-2 [✓] | `test-discovery-merge.ts` (+ npm `test:discovery-merge`) | V2-Discovery seit Brief 061 ausgemustert (ADR why-excel-ssot-not-crawl, why-cc-direct-curation); 0 Runbook-/CI-Referenzen | Mit-archivieren. niedrig/S |
| B1-3 [✓±] | `ingest-backfill.ts` (V2-Pipeline-CLI, `--pipeline=v2`) | Funktionsfähig, aber seit Brief 061 operativ ersetzt durch CC-Direct-Curation; bewusste Reaktivierungs-Sicherung (Option A im ADR) | **Nicht** löschen; `@deprecated`-Header mit ADR-Link. niedrig/S |
| B1-4 [✓±] | Crawler-Adapter `src/lib/ingestion/{tlbranson,wikipedia,discovery,v2/llm}` | Nur von ingest-backfill/test-discovery-merge importiert; **Board 122-B6** hat sie bereits als Stilllegungs-Kandidaten — Brief steht aus | An 122-B6 übergeben (nicht hier doppeln): `@deprecated`-Header + Manifest, Carve-out im B6-Brief. mittel/M |
| B1-7 [✓] | npm `generate:blurbs` vs. Runbook | entity-blurbs-full-run.md verbietet explizit den API-Pfad, npm-Target existiert trotzdem prominent | Target als Fallback kennzeichnen (Kommentar/Rename), Runbook ist korrekt. niedrig/S |

Nicht tot (geprüft, Fehlalarm): Consolidation-Scripts (Pass 2 lief am 2026-05-27,
Commit c11de13 — B1-9 widerlegt), `check-eras`/`brain:lint`/`test:*` (spezialisierte
Ebenen, keine Redundanz — B1-12 [✓±], dort bleibt nur der Wunsch nach einer
Standard-QA-Guidance im ssot-loop-runbook).

### B2 Runbooks vs. gelebte Realität

- **B1-5 [✓±] / B3-7 [✓]:** db-rebuild-runbook erwähnt `apply:timeline` nicht
  (→ Landmine 1) und verlangt „Migrationen vorher angewandt" ohne dass db-rebuild.sh
  das prüft (→ Landmine 4).
- **B1-11 [✓±]:** weekly-refresh-runbook § PR2 sagt „deferred", aber
  `.github/workflows/weekly-refresh.yml` (116 Zeilen) ist seit 2026-06-09 (Commit
  4654391) live — Runbook auf „implemented" nachziehen, die zwei „open questions"
  sind entschieden (rolling Branch `automation/weekly-refresh`, kein Auto-Apply).
- **B1-8 [✓±]:** ssot-loop-runbook trägt „57+30=87 Batches"; real 60+30=90 (889
  Bücher). Zahlen nachziehen + Hinweis, dass die 10er-Batch-Größe an die
  `externalId`-Arithmetik des Resolver-Loops gekoppelt ist
  (`resolver-loop-detect.ts:345–349`, Formel `(first-1)*10+1`) — Batch-Größe ändern
  ist **nicht** trivial und lohnt für Tröpfel nicht; ein Nachzügler-Batch darf
  schlicht <10 Bücher enthalten (Batch 060 hat heute 2).
- **B1-6/B1-10 [✓±]:** Resolver-Wellen-Sizing (WAVE_TARGET=50) und
  Phase-4-Digest-Disziplin sind Bulk-dimensioniert, funktionieren aber nachweislich
  auch für kleine Wellen (Pass 16: 22 Bücher, sauber durchgelaufen). Kein Umbau —
  nur ein Satz Doku, dass kleine Wellen über die Standard-Maschinerie laufen, plus
  optionaler „Lite-Pfad"-Abschnitt, falls Refresh dauerhaft 3–20-Buch-Wellen erzeugt.

### B3 Operative Landminen (Reihenfolge-Abhängigkeiten)

Systematische Liste — pro Mine: Auslöser → stille Folge → heutige Absicherung →
Vorschlag. Die Minen 1–3 hängen alle am Rebuild und sollten als **ein** Brief
geschnitten werden.

**Landmine 1 — `db:rebuild` löscht Timeline-Daten, `apply:timeline` läuft nicht
automatisch.** [✓ — Konsolidierung aus A2-1, B3-1, B1-5, A1-2, A2-3; = OQ 16a]
Auslöser: `db-rebuild.sh` → `db-reset-for-ssot.ts:153` `TRUNCATE works CASCADE` →
leert `event_works` (223 Rows) und `works.startY/endY/setting*` (97 datierte Werke,
53 event-anchored). Die vier Rebuild-Schritte (reset, phase4-apply, audiobook-apply,
verify) stellen das **nicht** wieder her; `grep apply:timeline db-rebuild.sh` = 0
Treffer; Runbook sagt explizit „kein apply:timeline". Heutige Absicherung:
Interim-Regel in open-questions.md — d. h. ein Kopf-Wissen.
**Vorschlag:** (a) `npm run apply:timeline` als Schritt 5 in db-rebuild.sh (vor dem
finalen Verify; apply-timeline ist idempotent, ein zweiter Lauf erreicht
bitidentische Counts — impl 137); (b) Post-Rebuild-Assertion `count(event_works)>0
AND count(works WHERE setting_anchor_event_id IS NOT NULL)>0`; (c) Hilfe-Text von
db-reset-for-ssot um den event_works-Hinweis ergänzen. Impact hoch / Aufwand S.

**Landmine 2 — Rebuild leert auch Podcast-Daten; `apply:podcast` ist nirgends
Pflicht-Schritt.** [✓± — B3-2, C4-2-Teilbefund]
`TRUNCATE works CASCADE` erfasst `podcast_episode_details` (1094 Rows) und
`podcast_details` (FK CASCADE auf works). `apply:podcast` existiert (idempotent,
committed Inputs unter `ingest/podcasts/*.json`), wird aber nur im
weekly-refresh-runbook (Z. 241) im Promotion-Kontext erwähnt — weder db-rebuild.sh
noch ein Runbook nennt ihn als Wiederherstellungs-Schritt. Zusätzliche
Verifikationslücke: die Post-TRUNCATE-Assertion in db-reset-for-ssot prüft nur die 12
expliziten TRUNCATE_TARGETS, nicht die mitgerissenen event_works/podcast-Tabellen.
**Vorschlag:** Entscheidung dokumentieren (Podcasts = Core-Content?); wenn ja:
`apply:podcast -- --all` als Rebuild-Schritt + Verify (Show-/Episode-Counts); die
beiden mitgerissenen Tabellen in die Reset-Verifikation aufnehmen. Impact mittel,
Aufwand S–M.

**Landmine 3 — Keine Vollständigkeits-Validierung nach Rebuild.** [✓± — B3-6]
Nur Audio bekommt heute ein `--verify`. Es fehlt ein Gesamt-Smoke („alle
Datenkategorien wieder da?"): works/book_details/junctions (phase4), narrators,
ratings, podcasts, timeline. **Vorschlag:** kleines `verify-rebuild.ts` (nur Counts
gegen Erwartungswerte aus den committed Quellen) als letzter Rebuild-Schritt; macht
Mine 1+2 dauerhaft unmöglich statt nur dokumentiert. Impact hoch / Aufwand M.

**Landmine 4 — Rebuild prüft nicht, ob Migrationen angewandt sind.** [✓ — B3-7]
Runbook-Vorbedingung ohne Gating; bei fehlender Migration scheitert der Reset mit
kryptischem Schema-Fehler — nach dem TRUNCATE-Start. **Vorschlag:** Pre-Check in
db-rebuild.sh (pending-Migrations-Abfrage gegen `__drizzle_migrations`, nonzero exit).
mittel/S.

**Landmine 5 — Ratings-Backfill-Reihenfolge: Hardcover MUSS vor Goodreads.**
[✓± — B3-5]
`backfill-goodreads-rating.ts` schreibt nur `rating IS NULL`-Rows (Fallback);
`backfill-hardcover-rating.ts` (ohne `--force`) ebenfalls. Läuft Goodreads zuerst,
kann Hardcover (kanonische Quelle) seine 81+ Ziel-Rows nie mehr setzen. Nichts
erzwingt die Reihenfolge. **Vorschlag:** npm-Target `backfill:all-ratings`
(orchestrierte Sequenz) + Quellen-Hierarchie-Kommentar in beiden Script-Headern.
mittel/S.

**Landmine 6 — `primaryEraId`-Platzhalter überstempelt Kuration bei jedem Upsert.**
[✓ — B3-10; = OQ 16b]
`apply-override.ts:129–137` hardcodet `'time_ending'` in jeden Upsert — eine manuelle
Era-Kuration auf einem Buch wäre nach dem nächsten Apply weg. Bereits als OQ 16b
getrackt; hier nur die Landminen-Perspektive ergänzt: **Vorschlag kurzfristig** eine
Warnung im Apply, wenn ein Buch mit abweichendem primaryEraId überschrieben würde;
langfristig Bucketing aus Setting-Dates (OQ 16b). mittel/S (Warnung).

**Landmine 7 — Phase-4-Digest wird am Lauf-Anfang geleert, nicht validiert.**
[✓± — B3-9]
`run-phase4-apply.sh:38` leert den Digest (`: > "$DIGEST"`) **vor** dem Lauf; bricht
Phase 4a ab, liest Phase 4b einen unvollständigen Digest ohne es zu merken (keine
Timestamp/DONE-Validierung). Bestätigter Doku-Widerspruch: der Phase-4b-Trigger nennt
den Digest „Pflichtlektüre" (`resolver-loop-detect.ts:413`), das `scope`-Array
(`:513`) listet ihn nicht. **Vorschlag:** Digest-Header mit Timestamp + DONE-Marker;
Phase 4b validiert beides; scope-Array ergänzen. niedrig/M.

**Landmine 8 — Seed ohne Post-Assertion und mit Validierungs-Lücken.** [✓± — B3-11]
`validateReferenceData()` (seed.ts:266–299) prüft characters/locations/factions/
book-characters, **nicht** book.factions[].id, book.persons[].id, book.series →
FK-Crash statt frühem Fehler. Kein Count-Log am Ende. **Vorschlag:** Validierung
komplettieren + Count-Summary nach „Done.". niedrig/S–M.

**Landmine 9 — `work_persons`-Rollen-Ownership ist implizit.** [✓± — B3-4]
Der Durability-Pact (apply-override besitzt author/editor, audiobook-apply besitzt
narrator/co_narrator/full_cast) funktioniert und clobbert sich nicht — aber 6 der 11
Enum-Rollen (translator, director, …) besitzt **niemand**; ad-hoc eingefügte Rows
dieser Rollen würden nie bereinigt. Heute 0 solcher Rows (Live-Check).
**Vorschlag:** Ownership-Kommentar im Schema (Z. 506) + in beiden Apply-Headern:
„neue Rolle ⇒ eigener Apply-Pfad mit Scoping-Muster". niedrig/S.

Dazu **B3-12 [✓]** als Klammer: eine zentrale `scripts/DEPENDENCY-MATRIX.md`
(Script → Inputs/Outputs/Pflicht-Reihenfolge/DB-Mutationen + ASCII-Sequenz
SSOT-Loop → Resolver → Phase 4 → optionale Applies → Rebuild-als-Fallback), auf die
alle 6 Runbooks verweisen. mittel/M. — Hinweis: B3-3 (PODCAST_LLM_MODEL ohne
Default/Warnung) wurde **widerlegt**: der Fallback ist dokumentiert
(`extract.ts:52–57`) und das aufgelöste Modell wird geloggt (`ingest-podcast.ts:392`).
Die Memory-Regel „immer `PODCAST_LLM_MODEL=claude-sonnet-4-6` setzen" bleibt
operativ richtig, aber der stille Teil ist weniger still als erinnert.

### B4 Empfohlene Ziel-Pipeline für den Tröpfel-Betrieb

Kohärentes Bild, kombiniert aus B1/B3 und dem verifizierten Nachzügler-Pfad-Design
(Feasibility-Korrekturen eingearbeitet):

**Es bleiben vier lebende Abläufe:**

1. **Weekly-Refresh (Discovery)** — läuft bereits automatisiert
   (`weekly-refresh.yml`, rolling Branch). Bleibt unverändert der einzige
   Discovery-Kanal; Ignore-Liste (`refresh:ignore-book`) bleibt das
   Ablehnungs-Werkzeug.
2. **Nachzügler-Pfad (NEU, dünn)** — ein Buch von Proposal bis applied, ohne Loops:

   | Station | Kommando | Status |
   |---|---|---|
   | A Roster-Eintrag | `npm run book:add -- --isbn/--title …` → schreibt `book-roster.extension.json` (validiert via `parseExtensionBook()`), schlägt nächste freie ID vor | **neu** (dünner Wrapper) |
   | A' Merge | `npm run import:ssot-roster` (byte-stabil, existiert) | vorhanden |
   | B Kuration | `npm run book:curate -- --id=…` → schreibt Override-JSON mit den SSOT-Loop-Disziplinen (Synopsis-Guard via `lintSynopsis()`, Faction-/Location-Granularität, Surface-Form-Treue, facetIds aus `facet-catalog.json`) | **neu** (Wrapper oder schlicht ein Nachzügler-Runbook für eine CC-Session) |
   | C Review-Gate | `apply-override-dry.ts --file <override.json>` — das `--file`-Flag **existiert bereits** und ist der korrekte Single-Book-Weg (Feasibility-Korrektur; kein neues Script nötig, nur lesbareres Single-Book-Reporting) | vorhanden, kleiner Tweak |
   | D Apply | `npm run db:apply-override -- --batch=ssot-w40k-061` — **wichtigste Korrektur aus dem Feasibility-Review:** das Batch-Namensschema ist per Regex erzwungen (`/^ssot-(w40k|hh)-\d{3}$/`, apply-override.ts:138, 1158–1162). Nachzügler-Batches heißen also `ssot-w40k-061`, `-062`, … und dürfen 1 Buch enthalten (Präzedenz: Batch 060 hat 2). Kein `single-*`-Namensraum. | vorhanden |
   | E Folge-Applies | optional, nicht blockierend: Blurbs später im Sweep; `apply:timeline` nur falls book-dates.json das Buch datiert; Narrators nur bei Audio-Ausgabe; Podcast-Tags kommen ohnehin über den nächsten Podcast-Ingest | vorhanden |

   Offene Maintainer-Entscheidungen (aus dem Design, gekürzt): interaktiv vs.
   vollautomatisch für `book:add`/`book:curate` (Empfehlung: interaktiv);
   Apply auf Bestätigung direkt aus `book:curate` oder separat; ob Nachzügler nach
   Apply automatisch auf die Ignore-Liste sollen (Empfehlung: ja, sonst re-proposed
   der Refresh sie wöchentlich).
3. **Ad-hoc-Applies als Bibliothek** — apply-override-Engine, apply:podcast,
   apply:timeline, Narrators, Ratings (mit Landmine-5-Orchestrierung) bleiben die
   Werkzeuge, die sowohl Nachzügler-Pfad als auch Rebuild nutzen.
4. **`db:rebuild` als seltener Disaster-Recovery-Pfad** — gehärtet um Landminen 1–4
   (Timeline-Tail, Podcast-Entscheidung, Vollständigkeits-Verify, Migrations-Gate).

**Eingefroren (nicht gelöscht, dokumentiert stillgelegt):** SSOT-Loop
(run-ssot-loop.sh + loop-next-batch) und Resolver-Wellen-Loop (run-resolver-loop.sh)
als Bulk-Maschinerie — reaktivierbar, falls je wieder ein Bulk ansteht; für
Nachzügler reicht der Dry-Run-Check, ungelöste Surface-Forms landen wie bisher in
`book_details.notes` und werden gesammelt nachgezogen, eine Resolver-Welle lohnt erst
bei Rückstau. Konsolidierungs-Passes nur noch on-demand. Die 15+2 toten Scripts aus
B1 wandern ins Archiv; V2-Pipeline + Crawler-Adapter gehen den 122-B6-Weg.

---

## Dimension C — Concurrency / Last (Ziel: smooth bei 20+ Nutzern)

### C1 Connection-Budget

**Faktenlage (verifiziert):** DATABASE_URL zeigt auf den Supabase
**Transaction-Pooler (Port 6543)**; Client `src/db/client.ts`: `max:5`,
`prepare:false` (pgbouncer-Pflicht), `idle_timeout:20`, `connect_timeout:10`,
`fetch_types:false`, `ssl:require`. DB: `max_connections=60`, 3 superuser-reserviert;
pgbouncer `default_pool_size` Free-Tier ~15. Die `max:5` ist **bewusst und korrekt**
kalibriert (Kommentar im Client dokumentiert die Poison-Cascade aus impl 129:
Queries queuen in pgbouncer bis `statement_timeout`, der Abbruch vergiftet die
nächste Anfrage). **Nicht erhöhen** — mehr Client-Connections verschieben die Queue
nur in den Shared-Pool und vergrößern den Blast-Radius (C1-1 [✓±]).

**Budget-Rechnung für 20+ Nutzer:** Pro warmer Vercel-Instanz 1 Client × max 5
Connections; wie viele Instanzen Hobby parallel aufmacht, ist **nicht dokumentiert**
und nicht aus dem Code belegbar — alle konkreten Lambda-Zahlen aus den Roh-Findings
wurden als Spekulation gestrichen (C1-4 [✓±]). Belegt ist die Kante von der anderen
Seite: **15 parallele Build-Worker reichten lokal für Pooler-Timeouts** — d. h. die
~15er-Backend-Poolgröße ist die echte Grenze, und 3 Instanzen × 5 sind rechnerisch
schon dort. Die Konsequenz ist dieselbe wie in C3: Die Kante verschiebt man **nicht**
über Connections, sondern indem dynamische Routen die DB seltener treffen. Mit
gecachten Routen ist der Bestfall belegt: 36 simultane /compendium-Requests ohne
Pool-Stress (impl 129).

**Timeout-Mismatch (C1-5 [✓±]):** Vercel-Function-Timeout 30 s vs.
`statement_timeout` 120 s — eine weggelaufene Query lebt nach dem Request-Abbruch
weiter und blockiert eine der 5 Connections. `SET LOCAL statement_timeout` (pro
Transaktion, pgbouncer-kompatibel) ist als Future-Change für /atlas dokumentiert.
Empfehlung: bei Gelegenheit für die fetten Loader nachrüsten; kein Akut-Problem.

**Observability (C1-2 [✓±]):** Es gibt keinerlei Produktions-Sichtbarkeit für
Pool-Stress (Drizzle-Logger nur in Dev; postgres-js 3.4.9 exportiert keine
Pool-Metriken — der Roh-Vorschlag mit Event-Listenern war technisch unhaltbar und
wurde korrigiert). Billigster Schritt: `/healthz` um DB-Ping-Latenz + Uptime
erweitern (>3 s ⇒ degraded-Status) + Timing-Log >2 s um die Loader. mittel/S.

Kleinkram: `globalThis.__chronoPg` nur in Dev zu cachen ist **kein** Prod-Risiko
(Module-Closure persistiert pro Instanz; nur Doku-Asymmetrie, C1-7 [✓±]);
Session-Mode-Upgrade-Pfad (Pro-Tier, Port 5432, `prepare:true`) als Absatz in
why-drizzle-supabase.md dokumentieren (C1-6 [✓±]).

### C2 EXPLAIN der heißesten Queries

Ergebnis erfreulich unspektakulär — **keine fehlenden Indizes in den kritischen
Pfaden** (C2-8 [✓±]):

- Slug-Lookups, Junction-Reads, Timeline-`start_y`: Index-Scans, 0.01–0.15 ms
  (z. B. work_facets per work_id: Index-Only-Scan, 23 Rows, 0.015 ms).
- `resolveEpisodeShows()`: korrekte Batch-Query statt N+1 — gemessen ~0.1 ms vs.
  ~231 ms als N+1 (C2-3 [✓±], Vorbild-Pattern).
- `/atlas`-Bridge: 31 InitPlans in einem Statement, 9.7 ms total — bewusste
  Single-Statement-Architektur gegen Pool-Thrashing, admin-only, im Budget
  (C2-7 widerlegt als Problem).
- Einzige messbare Mini-Optimierung: `loadPodcastShow()` macht 3 **sequenzielle**
  Queries (Show → Episode-IDs → Works) statt einer Subquery — bei 4 Shows irrelevant,
  Merkposten bei Podcast-Wachstum (C2-6 [✓±], niedrig/M). `facet_values` (86 Rows)
  wird per Seq-Scan gejoint — bei der Größe korrekt und schneller als ein Index
  (C2-5 [✓±], kein Handlungsbedarf).
- Composite-Indizes ((kind,start_y) u. ä.) brächten heute <2 % — erst bei realen
  Filter-Features neu bewerten (C2-4 [✓±]).

Die teuren „Queries" sind in Wahrheit die Loader-Aggregate aus A3/C3 (alle Bücher
samt Relationen) — das Problem ist die Frequenz (pro Request), nicht der Plan.

### C3 Caching-Schichten — der billigste Hebel

Bestandsaufnahme `db-cache.ts`: sauberer `unstable_cache`-Layer (TTL 300 s, Tags
deklariert aber ungenutzt, `isDegraded`-Guard gegen das Cachen leerer
Fehler-Ergebnisse, dokumentiertes 2-MB-Limit) — wird aber nur vom Compendium genutzt.
Routen-Audit (C3-10 [✓±] als Klammer):

| Route | Heute | DB pro Request | Befund |
|---|---|---|---|
| `/` Home, `/archive/podcasts`(+`[slug]`) | `revalidate=3600` bzw. ISR | nein (im TTL-Fenster) | gut |
| `/compendium`(+`[category]`) | `revalidate=300` + `cachedRead` | nein | gut (Kategorie-Seiten bleiben wegen searchParams dynamisch, Daten kommen aus dem Data-Cache — C3-5 [✓±]) |
| **`/archive`** | kein revalidate, Loader ungecacht | **ja** (~2 schwere Queries) | **Hebel 1** (C3-2/C3-9/C2-1) |
| **`/buch/[slug]`** | kein Prerender, kein revalidate | **ja** (8 Queries in Promise.all, loadBook.ts:56–128) | **Hebel 2** (C3-3) |
| **`/buecher`** | kein revalidate | **ja** (4 Queries, 6 Relationen) | Hebel 3, aber Audit-Tool (C3-1) |
| `/timeline` | kein revalidate | Basis-Visit: **nein** (Roster-Overlay, DB-frei); nur `?book=` → 1–3 Queries | klein (C3-7 [✓±]) |
| `/ask` | dynamisch (searchParams) | **ja** — `recommend()` lädt bei jeder Quiz-Antwort alle Bücher zweifach-relational, weil `cacheBooks` nicht gesetzt wird (page.tsx:55) | kleiner Fix (C3-8 [✓±]) |
| `/charakter|fraktion|welt|person/[slug]` | generateStaticParams + dynamicParams | nur on-demand für neue Slugs | ok |
| Modal-Slots (@modal) | wie Basis-Route, React-cache pro Request | wie Entity/Book | erst bei Messung handeln (C1-8 [✓±]); C3-12 (Doppel-Request-These) widerlegt — Interceptors sind kein zweiter HTTP-Request |

**Empfohlene Reihenfolge (Aufwand je S–M):**
1. `/archive`: `export const revalidate = 3600` + `loadBrowseBooks` in `cachedRead`
   (Payload ~1.2–1.8 MB — unter dem 2-MB-Limit, aber knapp; `isDegraded` auf leere
   Liste). Größter Public-Traffic-Hebel.
2. `/buch/[slug]`: `generateStaticParams` (neue `listBookSlugs()` — Achtung,
   `listEntityIds()` kennt den Typ `book` **nicht**, Feasibility-Korrektur aus C3-3)
   + `dynamicParams=true`, analog zu den Entity-Routen; alternativ `revalidate`.
3. `/ask`: `cacheBooks:true` an `recommend()` übergeben — Einzeiler, eliminiert die
   Doppel-Query pro Quiz-Schritt.
4. `READ_CACHE_TTL` 300 → 3600 s (Korpus ändert sich wöchentlich; die „min(TTL,
   revalidate)"-These aus dem Roh-Finding ist falsch — die Layer sind orthogonal —
   aber 300 s erzeugt schlicht unnötige Misses, C3-4 [✓±]). Langfristig sauberer:
   `revalidateTag` nach Apply-Läufen statt TTL-Raten — die tags-API liegt ungenutzt
   bereit.
5. `/buecher`: **nicht** naiv cachen — die 6-Relationen-Payload überschreitet
   vermutlich das 2-MB-Limit und `unstable_cache` scheitert dann als unfangbare
   unhandledRejection (db-cache.ts:64–69). Entweder schmale Audit-Projektion cachen
   oder als Maintainer-Tool bewusst dynamisch lassen (niedrige Besucherzahl).

### C4 Locks & Betrieb unter Last

**Schreibpfade blockieren Leser praktisch nicht** — mit einer Ausnahme:

- **`db:rebuild` (C4-2 [✓±]):** `TRUNCATE works CASCADE` nimmt ACCESS-EXCLUSIVE-Locks
  auf 14 Tabellen (12 TRUNCATE_TARGETS + kaskadiert event_works,
  podcast_episode_details). Der **Lock selbst ist kurz** (<1 s) — das echte
  Nutzer-Problem ist das **Daten-Fenster danach**: bis Phase-4-Apply durch ist
  (~90 sequenzielle npm-Prozesse ≈ 5–7.5 min, C4-10 [✓±] — die „43 min" aus dem
  Roh-Finding waren eine Verwechslung von Batches mit Büchern), plus Tail-Applies,
  sieht die Site leere/halbe Kataloge. MVCC schützt vor Locks, nicht vor leeren
  Tabellen. **Vorschlag:** Runbook-Hinweis „außerhalb von Peak-Zeiten fahren";
  ein atomarer Swap-Ansatz (Staging-Tabellen + Rename) lohnt erst, wenn Rebuilds
  häufiger als ~1×/Monat würden (heute: „sehr selten").
- **`apply:timeline`** (wholesale delete+insert auf event_works): läuft in **einer**
  Transaktion (Z. 682/734) — Leser sehen bis zum Commit den Alt-Stand, dann atomar
  den neuen. 223 Rows, <1 ms. Kein Problem (C4-4 widerlegt als Risiko; C4-7 [✓]
  bestätigt die FK-Schutz-Logik samt erwünschtem Hard-Fail bei dangling Anchors).
- **`apply-override`/`apply-audiobook-narrators`:** per-Buch-Transaktionen (859/66) —
  bewusstes Fehlertoleranz-Muster, kein Lock-Thema; UPDATE/DELETE/INSERT blockieren
  SELECTs nicht. Der Bloat dadurch ist normal: work_facets 2848 dead tuples (~14 %),
  Autovacuum lief zuletzt vor ~20–24 h, gesund (C4-1/C4-5/C4-8 [✓±] — die
  „4-Tage-stale"-Behauptung war ein Rechenfehler des Finders).
- **Settings:** `idle_in_transaction_session_timeout=0` (Free-Tier nicht änderbar;
  Risiko theoretisch, pg_stat_activity zeigt 0 hängende Transaktionen — C4-3 [✓±]);
  `statement_timeout` 120 s reicht für alle Apply-Statements locker (max. 33 Rows
  pro DELETE, C4-9 [✓±]).
- **Konventionen:** künftige Migrationen mit `CREATE INDEX CONCURRENTLY` (alle
  bisherigen 0000–0012 nutzen blockierendes CREATE INDEX — bei heutigen Größen egal,
  als Konvention festschreiben, C4-6 [✓]). Operator-Sichtbarkeit: run-phase4-apply
  leitet sämtliche Apply-Ausgabe ins gitignorierte Verbose-Log um — während eines
  Rebuilds herrscht Terminal-Stille; ein `echo "[hh:mm:ss] processing $batch"` pro
  Batch genügt (C4-11 [✓±]). Sidecar audiobook-narrators.json als einzige
  Provenance-Quelle für 88 Audio-Credits: Warnkommentar + Snapshot-Routine
  (C4-12 [✓±], niedrig).

---

## Widerlegte Findings (aussortiert, mit Kurzgrund)

| ID | Behauptung | Widerlegung |
|---|---|---|
| A1-5 | podcast_episode_details.podcast_work_id ohne Index | Index existiert (Migration 0010:28, pg_indexes + EXPLAIN-Nutzung belegt) |
| A1-9 | podcast-Kinds „untested", Cascade-Robustheit fraglich | Index existiert, Schema robust, Live-Pfade in Nutzung |
| A3-004 | loadPodcastShow = N+1 | Konstant 2–3 Queries unabhängig von N; Standard-Drizzle-Muster |
| A3-006 | ROSTER_BY_SLUG-Heap-Overhead pro Render | Module-Level-Konstante, einmal geladen — Missverständnis der Module-Semantik |
| A3-007 | fehlender Index work_facets(facet_value_id) | existiert; zudem falsche Code-Behauptungen (Sortierung, Route) |
| A3-012 | fehlender Index work_facets(work_id) | Composite-PK (work_id, …) deckt Leading-Column ab; EXPLAIN: Index-Only 0.016 ms |
| B1-9 | Consolidation-Scripts verwaist nach Pass 1 | Pass 2 komplett gelaufen + gemerged (c11de13, 2026-05-27), DB-belegt |
| B3-3 | PODCAST_LLM_MODEL ohne Default/Warnung | Fallback dokumentiert (extract.ts:52–57), Modell wird geloggt (ingest-podcast.ts:392) |
| B3-8 | Audiobook-Apply fehlt im Phase4-Loop | bewusste, im Code begründete Architektur (db-rebuild.sh:24–33: kein Tail im Wellen-Engine) |
| C2-7 | Atlas-Query teuer/sequentiell | 31 InitPlans, 9.7 ms gegen 1.5-s-Budget; Architektur bewusst pool-schonend |
| C2-9 | Entity-Reverse-Links-Query-Problem | referenzierte Funktion/Query existiert so nicht (falsche file:line, kein `work_union`) |
| C2-11 | generateStaticParams sprengt Build | Brief-109-Messung: ~1004 Seiten in 3.6 s (~3.6 ms/Seite) |
| C3-12 | @modal lädt doppelt pro Navigation | Interceptors sind parallele Slots im selben Render-Pass, kein zweiter Request |
| C4-4 | apply:timeline-Delete+Insert = Lock-Risiko | 223 Rows, eine Transaktion, <1 ms — atomar und harmlos |

## Brief-Kandidaten (Schnittvorschlag für Cowork)

1. **„Rebuild härten"** (Landminen 1–4 + Reset-Verifikationslücke; schließt OQ 16a):
   apply:timeline-Tail, Podcast-Entscheidung, verify-rebuild.ts, Migrations-Gate,
   Runbook-Update. Impact hoch, Aufwand S–M. *Dringendster Schnitt.*
2. **„Caching-Welle 2"** (C3): /archive ISR+cachedRead, /buch/[slug] Prerender via
   listBookSlugs, /ask cacheBooks, TTL 300→3600, optional revalidateTag-Anbindung an
   die Apply-Pfade. Impact hoch für das 20+-Nutzer-Ziel, Aufwand M. *Achtung:
   Routen/Loader liegen im Product-Strang — Strang-Zuordnung durch Cowork.*
3. **„Nachzügler-Pfad v1"** (B4): book:add + book:curate-Runbook + Single-Book-
   Dry-Run-Report; Batch-Konvention ssot-w40k-061+. Aufwand M.
4. **„Script-Hygiene"** (B1 + B3-12): 15+2 Scripts archivieren, ARCHIVED_SCRIPTS.md,
   DEPENDENCY-MATRIX.md, Runbook-Zahlen/PR2-Status nachziehen, @deprecated-Header
   (122-B6-Anschluss für Crawler). Aufwand S–M, gut als Sammel-Brief.
5. **„Schema-Migration 0013"** (A1/A2): DROP works_slug_idx, FKs auf
   primaryFactionId/parentId (SET NULL), external_links.confidence NOT NULL,
   confidence-Enum auf events, optional start_y/end_y-CHECKs; dazu
   applyCollections()-Transaktion und Ratings-Orchestrierung (Landmine 5). Aufwand M.
6. **Klein & unabhängig:** /healthz-Latenz + Loader-Timing-Logs (C1-2);
   CREATE-INDEX-CONCURRENTLY-Konvention + Phase4-Progress-Echo (C4) — kann in 4 oder
   5 mitfahren.

## Read-only-Bestätigung

Keine DB-Mutationen, keine apply/rebuild/migrate/seed/crawl-Läufe, keine Edits an
`brain/**` oder `sessions/README.md`. Live-DB ausschließlich SELECT/EXPLAIN/
information_schema. Einzige neue Datei: dieser Report.
