---
session: 2026-05-20-087
role: architect
date: 2026-05-20
status: open
slug: goodreads-rating-pipeline
parent: 2026-05-20-086-arch-hardcover-hit-rate-pass-2
links:
  - 2026-05-20-086-arch-hardcover-hit-rate-pass-2
  - 2026-05-20-086-impl-hardcover-hit-rate-pass-2
  - 2026-05-11-061-arch-ssot-loop
commits: []
---

# Goodreads-Rating in die Batch-Pipeline — Loop-Disziplin + Override-Schema + Apply-Layer

## Goal

Die Goodreads-Rating-Beschaffung dauerhaft in den Standing-Loop (Brief 061) einbauen, sodass jeder neue `ssot-w40k-NNN`-Batch sein Rating automatisch mitbekommt — als vierte Loop-Disziplin, mit dem Rating **von der Goodreads-Buchseite gelesen, nie aus dem Such-Snippet**.

Brief 086 Phase 4 hat die ~200 geseedeten Bücher schon auf 197/200 Rating-Coverage gebracht und die Technik validiert. Dieser Brief macht aus dem einmaligen Phase-4-Backfill eine stehende Pipeline-Eigenschaft: ab `ssot-w40k-021` produziert der Loop pro Buch nicht nur Synopsis/Factions/Locations/Characters, sondern auch das Rating. Damit ist auch der „Voll-Roster"-Bedarf abgedeckt — die Coverage wächst inkrementell mit dem Loop (`021 → 057` W40K, dann HH), kein separater Bulk-Lauf.

## Context

**Brief 086 (gemerged, PR #73, `origin/main` af7d90c).** Drei Hardcover-Briefs (075/085/086) jagten die Rating-Hit-Rate; Pass 2 endete bei 116/200 = 58 %, unter dem 70-%-Ziel — strukturelle Hardcover-Katalog-Lücke. Phase 4 pivotierte auf Goodreads: eine Einzel-Websuche pro rating-losem Buch löste **78/81 = 96.3 %** und hob die DB-Coverage auf **197/200 (98.5 %)**. Der Pivot ist als ADR [`brain/wiki/decisions/hardcover-to-goodreads-pivot.md`](../brain/wiki/decisions/hardcover-to-goodreads-pivot.md) kodifiziert.

**Das harte Phase-4-Verdikt — der zentrale Design-Constraint dieses Briefs.** Der 086-Closing-Report: die Websuche-Technik trägt, **aber nur als Lokator, nicht als Quelle.** Google-Rich-Snippets lieferten in ~20 % der Fälle keine Zahl und in ~4 % eine plausible, aber *falsche* Zahl (Snippet 4.25 vs. realer Goodreads-Schnitt 3.62 bei *Shadowsun*; 4.5 vs. 4.11 bei *Catachan Devil*; 4.5 vs. 4.19 bei *Duty Calls*). Ein naiver Snippet-Parser hätte ~3–4 Bücher mit glaubwürdig-falschen Werten geschrieben. Konsequenz: die Pipeline-Version MUSS die Websuche nur zum **Auffinden der korrekten Goodreads-Buchseite** nutzen und Rating + Count **von der Seite selbst** lesen.

**Der Standing-Loop (Brief 061).** Pro `/clear` produziert eine `claude -p`-Subsession (via `scripts/run-ssot-loop.sh`) genau eine Override-Datei `scripts/seed-data/manual-overrides-ssot-w40k-NNN.json` für die nächsten 10 Bücher, mit `overrides.{synopsis, facetIds, factions[], locations[], characters[], flags[]}` pro Buch. CC recherchiert pro Buch mit WebSearch (Synopsis/Lore). Apply ist separat: `npm run db:apply-override -- --batch=…` schreibt über `scripts/apply-override.ts` in die DB. Brief 061 trägt am Ende der Constraints bereits **drei Forward-only-Disziplinen** ab `ssot-w40k-021` — Public-Synopsis (Brief 076/080), Faction-Granularity (Brief 077), Locations-Granularity (Brief 084). Dieser Brief fügt die **vierte** hinzu.

**Rating heute.** `book_details` trägt `rating` (numeric 0–5), `ratingCount` (int), `ratingSource` (`varchar(32)`, kein constrained enum — 086 Phase 4 hat das verifiziert). Die geseedeten 200 Bücher tragen 197 Ratings: 119 `hardcover` + 78 `goodreads`. Geschrieben wurden sie bisher von Standalone-Backfill-Scripts (`backfill-hardcover-rating.ts`, `backfill-goodreads-rating.ts`) **direkt gegen die DB**, nicht über den Override-/Apply-Pfad. Dieser Brief verlegt die Rating-Beschaffung in den Override-/Apply-Pfad, wo sie als Pipeline-Eigenschaft hingehört.

## Constraints

- **Rating-Quelle ist die Goodreads-Buchseite, nicht das Snippet.** Hard rule aus dem 086-Phase-4-Verdikt. Die Websuche dient ausschließlich dem Auffinden der korrekten Goodreads-Buchseite (`goodreads.com/book/show/…`). Durchschnittsrating und Ratings-Count werden von der gefetchten Seite gelesen. Ein Skript-`fetch()`-Selektor-Scraper ist **nicht** der Mechanismus — siehe nächster Punkt.

- **Integration als Loop-Disziplin, nicht als separates Skript.** Die Rating-Beschaffung wird ein Schritt, den die `claude -p`-Loop-Subsession pro Buch macht — gleichberechtigt neben Synopsis/Factions/Locations. CC findet die Goodreads-Seite per WebSearch und liest Rating + Count per `WebFetch` von der Seite. Das ist konsistent mit dem CC-Direct-Curation-ADR und robust gegen HTML-Änderungen (CC liest gerenderten Seitentext, kein brüchiger Selektor). Konkret zwei Edits an Brief 061: (a) eine neue Constraints-Section **„Goodreads-Rating-Discipline (ab `ssot-w40k-021`)"** analog zu den drei bestehenden Discipline-Sections; (b) der Trigger-Heredoc in `scripts/run-ssot-loop.sh` trägt die Discipline kurz mit, und `WebFetch` ist in den `--allowedTools` der Subsession.

- **Override-Schema-Erweiterung.** Der per-Buch-Override bekommt ein neues **optionales** Feld, das das Rating eines Buchs trägt. Anforderungen an die Form (genaue JSON-Key-Schreibweise wählt CC):
  - Trägt entweder einen **Rating-Wert** (Durchschnitt 0–5, Ratings-Count, Quelle `goodreads`) **oder** einen expliziten **„geprüft, noch keine Wertung"-Marker**.
  - Trägt in beiden Fällen die **Evidence-URL** der geprüften Goodreads-Buchseite (Audit-Anker, analog `evidenceUrl` in der 086-Override-JSON).
  - Quelle ist immer `goodreads`.
  - Bestehende Override-Dateien `001..020` tragen das Feld nicht — es ist optional, der Apply-Layer behandelt sein Fehlen als No-op.

- **Apply-Layer schreibt das Rating.** `scripts/apply-override.ts` schreibt das neue Feld nach `book_details.rating` / `ratingCount` / `ratingSource`. Idempotent (Re-Apply schreibt denselben Stand). `apply-override-dry.ts` simuliert es. Bestehende Validatoren / Pre-Pässe dürfen am neuen Feld nicht brechen.

- **„Geprüft, noch keine Wertung" ist ein sauberer, abfragbarer Zustand.** Junge Bücher (< ~6–12 Monate) haben oft keine aggregierte Goodreads-Wertung — der bekannte Ausfallmodus aus 086 Phase 4 (die 3 Misses waren alle 2025/26-Releases). CC **rät nicht**; es setzt den Unrated-Marker mit Grund. Der Apply-Layer muss daraus einen Zustand machen, der von „nie geprüft" unterscheidbar ist: `book_details.rating`/`ratingCount` bleiben NULL, aber der Check wird festgehalten. Empfohlene Form ohne Schema-Migration: `ratingSource = 'goodreads'` mit `rating IS NULL` — eine Zeile mit gesetztem `ratingSource` und leerem `rating` heißt „Goodreads geprüft, (noch) keine Wertung", eine Zeile mit beidem NULL heißt „nie geprüft". Findet CC dabei einen echten Schema-Konflikt: kleinste additive Migration, sonst kein Schema-Touch (analog der `ratingSource`-Entscheidung in Brief 086 Phase 4).

- **Edition-Disambiguierung.** Bei Serien mit Omnibus + Einzelromanen wählt CC die Goodreads-Edition, die zum DB-Buch passt (Einzelroman vs. Omnibus) — 086-Phase-4-Praxis. Bei Mehrdeutigkeit entscheidet das DB-Buch (Format/Titel), nicht die populärste Edition.

- **Goodreads-Skala = Hardcover-Skala.** Beide 0–5, keine Umrechnung. Mixed-source bleibt: `ratingSource` unterscheidet `hardcover`- und `goodreads`-Zeilen; die bestehenden 119 `hardcover`-Zeilen werden **nicht** angefasst.

- **Forward-only.** Die Discipline greift ab `ssot-w40k-021`, exakt wie die drei bestehenden Loop-Disziplinen. Die geseedeten `001..020` (200 Bücher) sind durch Brief 086 abgedeckt und werden nicht re-touched.

- **Kein neuer Dependency, keine Tool-Versionen pinnen.** Die Arbeit lebt in bestehendem Stack (TypeScript-Scripts, der Loop). Falls doch ein Paket nötig wird: in den Constraints/Report begründen, Version recherchiert CC.

- **Verifikation grün:** `npm run lint`, `npm run typecheck`, der Resolver-/Apply-Test-Lauf (`npm run test:resolver` oder gewählte Test-Datei), `npm run brain:lint -- --no-write` (0 blocking).

## Out of scope

- **Refresh-Button-UI.** Der per-Buch on-demand Refresh-Button steht im Roadmap-Ideas-Backlog und bekommt einen eigenen Brief. Nicht hier.
- **Auto-Nachzug junger Bücher.** Bücher ohne aggregierte Wertung werden nur als solche vermerkt (Unrated-Marker). Kein periodischer Re-Try, kein Cron-/Wartungs-Schritt in diesem Brief — das spätere Nachfassen ist Sache des Refresh-Buttons.
- **Re-Touch der geseedeten `001..020`.** Keine Re-Apply, kein Re-Fetch, kein Backfill der 200 bereits abgedeckten Bücher.
- **Re-Fetch der 119 `hardcover`-Zeilen.** Mixed-source bleibt; eine Quellen-Vereinheitlichung ist Make-Work.
- **Separater Voll-Roster-Bulk-Lauf.** Die Coverage wächst inkrementell mit dem Loop; kein Einmal-Lauf über alle 859 Roster-Bücher.
- **`backfill-goodreads-rating.ts`, `backfill-hardcover-rating.ts`, Hardcover-Library** (`src/lib/ingestion/v2/sources/hardcover.ts`, `.../hardcover/fetch.ts`) — nicht anfassen. Die Backfill-Scripts bleiben als Einmal-/Ad-hoc-Werkzeuge liegen.
- **Public-Page-Rating-Render.** `/buch/[slug]` rendert `book_details.rating` heute nicht. Das ist ein eigener kleiner UI-Brief (steht in `open-questions.md` / `project-state.md` als „Public-Page-Rating-Render"), nicht hier.
- **Schema-Migration über die kleinste additive Notwendigkeit hinaus.**
- **HH-Domain-spezifische Sonderlogik.** Die Discipline gilt domain-agnostisch; HH-Bücher kommen später durch denselben Loop.
- **Ein produktiver `021..025`-Loop-Lauf.** Dieser Brief baut die Mechanik; der erste echte Lauf ist der separat geplante Loop-Re-Trigger `ssot-w40k-021..025`. Verifikation hier ist Unit-Test + Single-Book-Smoke (siehe Acceptance), kein Voll-Batch.

## Acceptance

Die Session ist done, wenn:

- [ ] Brief 061 (`sessions/2026-05-11-061-arch-ssot-loop.md`) trägt eine neue Constraints-Section **„Goodreads-Rating-Discipline (ab `ssot-w40k-021` / `W40K-0201`)"** im Shape der drei bestehenden Discipline-Sections — was CC pro Buch tut (WebSearch zum Auffinden der Goodreads-Seite → `WebFetch` der Seite → Rating + Count von der Seite lesen → ins neue Override-Feld; Snippet ist verboten als Quelle), die Edition-Disambiguierungs-Regel, der Unrated-Marker für junge Bücher.
- [ ] `scripts/run-ssot-loop.sh` Trigger-Heredoc trägt die Discipline kurz mit; `WebFetch` ist in den `--allowedTools` der `claude -p`-Subsession.
- [ ] Das Override-Schema kennt das neue optionale Rating-Feld; die Form ist im Brief 061 (oder per Schema-Kommentar) dokumentiert, inkl. Wert-Form, Unrated-Marker-Form und Evidence-URL.
- [ ] `scripts/apply-override.ts` schreibt das Rating-Feld nach `book_details` (Wert oder Unrated-Zustand), idempotent; `scripts/apply-override-dry.ts` simuliert es; bestehende Validatoren / Pre-Pässe brechen nicht.
- [ ] Der „geprüft, noch keine Wertung"-Zustand ist abfragbar und von „nie geprüft" unterscheidbar (empfohlen: `ratingSource='goodreads'` + `rating IS NULL`; bei Schema-Konflikt kleinste additive Migration, im Report begründet).
- [ ] Test-Abdeckung für den Apply-Pfad: Rating-Wert vorhanden / Unrated-Marker / Feld ganz abwesend — alle drei Fälle. `npm run test:resolver` (oder gewählte Test-Datei) grün.
- [ ] **Single-Book-Smoke:** CC wählt ein noch nicht geseedetes Buch (ein `ssot-w40k-021`-Kandidat), fährt den Goodreads-Seiten-Lese-Schritt einmal echt durch, schreibt das Ergebnis in ein Mini-Fixture-Override und lässt `apply-override-dry.ts` darüber laufen — Beweis, dass Seiten-Lesen + Apply-Pfad zusammenspielen, ohne einen Voll-Batch zu fahren. Ergebnis im Closing-Report.
- [ ] Verifikation grün: `npm run lint`, `npm run typecheck`, Test-Lauf, `npm run brain:lint -- --no-write` (0 blocking).
- [ ] Closing-Report `sessions/2026-05-DD-087-impl-goodreads-rating-pipeline.md`: was an Brief 061 + `run-ssot-loop.sh` + Override-Schema + Apply-Layer geändert wurde; die gewählte JSON-Form des Rating-Felds; die gewählte „unrated"-DB-Repräsentation (+ ggf. Migration); Single-Book-Smoke-Ergebnis; ob `WebFetch` im headless Loop-Kontext zuverlässig war; For-next-session-Items.
- [ ] Brief 087-arch `status: open → implemented` im selben Commit wie der Report; `sessions/README.md` Active-Threads nachgezogen.

## Open questions

Inputs, die Cowork im Report sehen will — keine Blocker:

- **JSON-Form des Rating-Felds.** Verschachteltes Objekt (`overrides.rating: { value, count, source, sourceUrl, status }`) vs. flache Felder. Cowork-Tendenz: verschachteltes Objekt — ein Feld, das den ganzen Rating-Zustand inkl. Unrated-Fall + Evidence-URL trägt, ist sauberer als vier parallele Top-Level-Keys.
- **„Geprüft, noch keine Wertung"-Repräsentation in der DB.** `ratingSource='goodreads'` + `rating IS NULL` (kein Schema-Touch) vs. minimale additive Spalte vs. Notes-Marker. Cowork-Tendenz: `ratingSource='goodreads'` + `rating IS NULL`. CC prüft, ob bestehender Code (z. B. ein künftiger Public-Render) an dieser Kombination etwas missversteht, und entscheidet.
- **Hard-Guard oder reine Konvention?** Die Public-Synopsis-Discipline ist seit Brief 080 ein Apply-Layer-Hard-Throw. Soll die Rating-Discipline analog hart geguardet werden? Cowork-Tendenz: **nein, reine Loop-Konvention** — ein fehlendes Rating ist keine Daten-Korruption wie eine polluted Synopsis; ein Buch ohne Rating-Feld ist ein legitimer Zustand (das Override ist optional). Kein Hard-Throw.
- **`WebFetch` im headless `claude -p`-Loop.** Brief 086 Phase 4 hat Goodreads-Seiten per `WebFetch` gelesen; dieser Brief verlässt sich darauf im headless Loop-Kontext. Falls `WebFetch` dort unzuverlässig ist: im Report flaggen (nicht drumherum bauen) — dann plant Cowork eine Anpassung.
- **WebSearch-Budget pro Buch.** Die Rating-Beschaffung addiert grob +1 Websuche und +1 `WebFetch` pro Buch zum bestehenden Loop-Budget. CC dokumentiert im Loop-Log die tatsächlichen Mittel-/Max-Counts, damit Cowork sieht, ob der Soft-Cap aus Brief 061 angepasst werden muss.

## Notes

### Discipline-Section-Shape (illustrativ — CC formuliert final)

Die neue Section in Brief 061 spiegelt die drei bestehenden Disciplines. Grobe Form:

> **Goodreads-Rating-Discipline (ab `ssot-w40k-021` / `W40K-0201`).** Verankert durch Brief 087. Forward-only — `001..020` sind durch Brief 086 abgedeckt.
>
> Pro Buch: WebSearch zum **Auffinden** der Goodreads-Buchseite. Dann `WebFetch` der Seite; Durchschnittsrating + Ratings-Count werden **von der Seite** gelesen, **nie aus dem Such-Snippet** (Snippets sind in ~4 % plausibel falsch — Brief-086-Phase-4-Empirie). Bei Serien die zum DB-Buch passende Edition wählen (Einzelroman vs. Omnibus). Ergebnis ins `overrides.rating`-Feld. Findet sich keine aggregierte Wertung (typisch bei Büchern < ~6–12 Monate alt): Unrated-Marker mit Grund setzen — **nicht raten**.

### Warum Loop-Disziplin und nicht Auto-Skript

Maintainer-Entscheidung 2026-05-20 (`AskUserQuestion`). Ein Skript-`fetch()`-Scraper auf `goodreads.com` mit CSS-Selektoren wäre deterministisch scriptbar, aber spröde gegen HTML-/Anti-Bot-Änderungen — genau die „komplexe Maschinerie", vor der die [`brain/wiki/workflows/cowork-session.md`](../brain/wiki/workflows/cowork-session.md) § „Simplest thing first"-Regel warnt (frisch geschrieben aus genau dem Hardcover-Arc, der diesen Brief auslöst). CC, das die gerenderte Seite liest und das Rating als Judgment-Schritt extrahiert, ist robuster und konsistent mit dem CC-Direct-Curation-ADR. Kosten: +1 Search/+1 Fetch pro Buch — im bestehenden Loop-Budget vernachlässigbar.

### Bezugspunkte

- Override-Schema heute: `scripts/seed-data/manual-overrides-ssot-w40k-001.json` (Form-Vorlage) + Brief 061 § Constraints.
- Apply-Layer: `scripts/apply-override.ts`, `scripts/apply-override-dry.ts`.
- 086-Phase-4-Empirie: `scripts/seed-data/goodreads-ratings-086-phase4.json` (78 resolved + 3 skipped, jede Zeile mit `evidenceUrl`) — zeigt die Daten-Form, die Phase 4 erzeugt hat; gute Referenz für das neue Feld.
- Discipline-Vorlagen in Brief 061: die drei Sections „Public-Synopsis-Discipline", „Faction-Granularity-Discipline", „Locations-Granularity-Discipline".

### Branch-Konvention (Brief 082)

Batch/Ingestion-Strang. Aus dem `chrono-lexicanum-batches`-Worktree, frische Task-Branch `codex/ingest-batches-goodreads-rating-pipeline` aus `origin/main`.
