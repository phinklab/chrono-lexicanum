---
session: 2026-06-18-155
role: architect
date: 2026-06-18
status: implemented
slug: book-review-web-pass
parent: 2026-06-17-154
links:
  - 2026-06-14-149
  - 2026-06-11-144
  - 2026-06-07-131
commits: []
---

# Buch-Reviewer Stage 3 — Strukturelle Sentinels per Web-Enrichment vervollständigen (CC-Direct, Opus + Web) (Board 122-B11 → B11.3)

## Goal

Baue den **Web-Enrichment-Pass** (B11-Maschinerie + Web-Search + Opus) und fahre ihn über die **~166 strukturellen Sentinels** (21 Factions + 145 Locations) aus dem B11-Lauf. Der Pass nimmt jeden bestätigten `__unresolved__:faction|location:<slug>` (B11 hat bereits geklärt, dass die Entity *ins Buch gehört*) und **reichert ihn zu einem vollständigen Katalog-Eintrag an** — er holt per Web-Lookup die Felder, die der Sentinel nicht trägt und ohne die die Entity in Map/Ask nicht funktioniert: für eine **Faction** `alignment` + `parent` + `tone` (+ `glyph`, falls eindeutig); für eine **Location** `sector` + `gx`/`gy` + `tags` (+ Flags). Alle Ergebnisse landen als **read-only Vorschläge** mit Quell-URL + Confidence; die Materialisierung in die Seed-Kataloge ist ein **Hand-Gate**. Ziel: aus Namen echte, kanonisch platzierte Entities machen — Factions, die **Ask the Archive** korrekt ranken kann, und Planeten, die als **Cartographer**-Pins erscheinen.

## Scope-Geschichte (Maintainer 2026-06-18) — warum dieser Brief so aussieht

Brief 155 war ursprünglich ein voller per-Buch-Web-Pass (strukturell + Character-Long-Tail + Voll-Re-Review aller 889 Bücher, Finder + Verifier). Nach Daten-Prüfung + Abwägung mit dem Maintainer dreimal verengt:

1. **Character-Sentinels (315 distinct) raus.** Verifiziert: jeder hängt an genau einem Buch — dünne Ein-Buch-Stubs bei größtem Triage-Aufwand, Produktnutzen unklar. Bleiben in der Queue geparkt, reversibel (eigener Folge-Brief, falls B12 sie braucht).
2. **Voll-Re-Review der Kanten raus.** Der web-Sweep über 889 Bücher (fehlplatzierte Kanten finden) entfällt — Kosten ohne belegten Mehrwert über die B11-Synopsis-Rate (4,9 %). Dieser Pass **entdeckt keine neuen Kanten**; er reichert nur bestehende strukturelle Additions-Sentinels an.
3. **Von „Finder + Verifier" auf „Enrichment".** B11 hat schon geklärt, *ob* die Entity ins Buch gehört (Finder + adversarialer Verifier, synopsis-basiert). Die übrige Arbeit ist nicht nochmal-prüfen, sondern **Daten holen**: Sektor/Koordinaten/Alignment/Parent stehen nicht in der Synopsis, sie sind pro Entity ein Web-Lookup. Der Pass ist deshalb ein Anreicherer, kein zweiter Finder. Eine **schlanke Verifikation der angereicherten Fakten** bleibt (s. Constraints) — besonders Faction-`alignment` (Ask-relevant); Planeten-Koordinaten sind bewusst fuzzy.

Modell **Opus** (mit Web-Search + Thinking): bei ~166 Entities ist der Lauf klein, Budget ist kein Faktor, und bei Map-Koordinaten + Alignment will man die bessere Disambiguierung.

## Context

- Direkter Nachfolger des B11-Voll-Laufs ([Brief 154](./2026-06-17-154-arch-book-reviewer.md) + impl [154](./2026-06-17-154-impl-book-reviewer.md), PR #180). B11 synopsis-only über 889 Bücher: 639 roh → 608 bestätigt → 31 widerlegt (~4,9 %); **96 hand-promoviert** (`reviewQueue` → `curation-overlay.final`), **Drukhari-Split** in die Referenz-Daten; beide SSOT-scharf, **noch nicht in der DB** (Freeze). Die **500 neuen-Entity-Sentinels** blieben geparkt.
- **Verifizierte Aufschlüsselung** (`book-review-queue.json`, 2026-06-18): **145 Location + 21 Faction = 166 strukturell** (alle Single-Book), **315 Character** (alle Single-Book). Die 166 strukturellen sind der **alleinige Worklist-Kern**; Character bleiben geparkt.
- **Warum die Felder gebraucht werden (die eigentliche Begründung des Passes).** Schema-Realität (verifiziert):
  - **Locations** tragen `id, name, sector, gx, gy, tags, capital, destroyed, warp`. Ein Pin auf der Map braucht `gx`/`gy` (+ `sector`). Von 300 bestehenden Locations haben **nur 28 Koordinaten** — die Map ist ein **kuratierter, platzierter** Satz. Ein roher Sentinel-Name hat **kein** `gx`/`gy`/`sector` → erscheint **nicht** auf der Map. Der Pass holt genau diese Felder.
  - **Factions** tragen `id, name, parent, alignment, tone` (+ `glyph`). Ask rankt über die Hierarchie — eine Faction ohne `alignment`/`parent` sitzt schief. Der Pass holt sie.
  - „Einfach mitnehmen" liefert also nur einen Buch-Tag auf der Buchseite, **nicht** die Map-Pins / Ask-Integration, für die der Maintainer sie will. Anreicherung ist der Punkt.
- **Maschinerie existiert schon** — diese Session **erweitert B11, baut nichts neu**: der CC-Direct-Driver (`scripts/run-book-review-loop.sh`), der Finding-Contract (`scripts/book-review/contract.ts`), das Sidecar-Merge (`scripts/book-review/sidecar.ts`), die DB-freie Projektion (`scripts/book-review/projection.ts`, geteilte Helfer `scripts/resolve-book-edges.ts`), die Konventions-Docs. Stage 3 hängt **Web-Search + Thinking** in die Subsession, schaltet auf **Opus**, ergänzt einen **Enrichment-Proposal-Pfad** und iteriert über **distinkte strukturelle Sentinel-Keys** statt über Bücher.
- **Lauf-Einheit ist der distinkte Sentinel, nicht das Buch.** Jeder der ~166 Keys geht einzeln (mit seinem Quell-Buch + dem `rawName` als Kontext zur Disambiguierung) in eine Subsession; die holt per Web die Felder. Das macht den Lauf klein.
- **DB-frei — der Pass braucht die rebuildte DB NICHT.** Die Projektion + der Dedup-Check lesen die **SSOT-Dateien** (`book-review-queue.json`, `factions.json`/`locations.json`/`sectors.json` + Aliases, `curation-overlay.json`), nicht die Live-DB. Die 96 + Drukhari liegen schon in diesen Dateien (nach PR #180-Merge). Genau deshalb ist der Enrichment-Lauf **unabhängig** vom Rebuild und der DB-Freeze hält über ihn (read-only).
- **Adversariales Muster, schlank** ([144](./archive/2026-06/2026-06-11-144-impl-technical-deep-review.md)): nicht mehr „gehört die Entity ins Buch" (B11 erledigt), sondern die **angereicherten Fakten** prüfen — s. Constraints.

## Constraints

- **Worklist = die ~166 strukturellen Sentinels, nichts anderes.** Distinkte `__unresolved__:faction:*` + `__unresolved__:location:*` aus `book-review-queue.json` (deterministisch, mit Quell-Buch-Kontext). Character-Sentinels + Kanten-Re-Review sind **out of scope**.
- **Anzureichernde Felder = exakt das Schema-Vokabular, gepinnt aus den Seed-Daten** (CC liest die erlaubten Werte aus den Katalogen, rät sie nicht):
  - **Faction:** `parent` (eine **existierende** Faction-`id`, z. B. ein Chapter unter `adeptus_astartes`), `alignment` (aus dem in `factions.json` benutzten Vokabular — imperium/chaos/xenos/…), `tone` (aus dem benutzten Vokabular), optional `glyph`. **Keine** Koordinaten.
  - **Location:** `sector` (eine **existierende** Sector-`id` aus `sectors.json`), `gx`/`gy` (Galaxie-Koordinaten — **nur**, wenn eine kanonische Position belegbar ist), `tags`, Flags (`capital`/`destroyed`/`warp`) wo belegt. Findet sich **keine** kanonische Kartenposition → `sector`-only **oder** als „unplatzierbar" markiert; **niemals** geratene Koordinaten.
- **Web-Quellen + Trust-Hierarchie + Evidenz-Schwelle (committet in die Konvention).** Der Reviewer rät nicht, er belegt. Trust-Rang: **Lexicanum** (40k-Fan-Kanon) **primär** für Existenz + kanonische Identität + Strukturfelder (Segmentum/Sektor, Parent-Legion/-Orden, Alignment); **40k-Fandom/Wikia** **sekundär** zur Bestätigung/Ergänzung; **Wikipedia / Black Library** nur für Publikations-Fakten, **nicht** für In-Universe-Felder. Editions-unabhängig (ein glaubwürdiger Wiki-Treffer genügt für Existenz + Strukturfelder; **nicht** über-verengen). Jeder Vorschlag trägt **Quell-URL(s) + Confidence**. Query-Strings/Prompt-Wording = CCs Wahl im Konvention-Doc; **Trust-Rang + Evidenz-Schwelle + Feld-Vokabular sind Vorgabe.**
- **Dedup gegen bestehende Kataloge ist Pflicht.** Vor jedem Vorschlag gegen den Alias-Index / die Seed-Kataloge prüfen: existiert die kanonische Entity schon (nur als Alias nicht erfasst), wird der Sentinel **kein neuer Entity-Vorschlag**, sondern ein **Alias-Vorschlag** auf die bestehende `id` (eigener Vorschlags-Typ, dieselbe read-only Proposal-Datei). Keine Dublette einer kanonischen Entity.
- **Schlanke Verifikation der angereicherten Fakten (Pflicht, aber fokussiert).** Eine **separate** Subsession prüft die kritischen abgeleiteten Felder gegen die zitierten Quellen — **Pflicht für Faction `alignment` + `parent`** (Ask-tragend) und für die **Existenz-/Identitäts-Behauptung** jeder neuen Entity; Planeten-`gx`/`gy` sind bewusst fuzzy und brauchen nur Sektor-Plausibilität, keine Pixel-Treue. Nur **bestätigte** Felder gehen in den Output; widerlegte/zweifelhafte → Feld leer + Note + in den Report. Frischer Prozess/Kontext, MECHANICAL-Präludium byte-genau wie Finder.
- **Reviewer schreibt nur Vorschläge, nie Wahrheit.** Enrichment-Ergebnisse + Alias-Vorschläge ausschließlich in eine **eigene, read-only Proposal-Datei** (Form = CCs Wahl, z. B. `scripts/seed-data/new-entity-proposals.json`) **ohne Apply-Pfad** — **nirgends** in `db:rebuild`, einen Seed-Loader oder einen DB-Write eingehängt. **Nie** direkter Katalog-Write durch den Reviewer, **nie** DB-Mutation. Materialisierung ausschließlich über die Hand-Gates.
- **Gestaffelte Hand-Gates (matcht „Factions früh, Planeten mit der Map").**
  - **Gate F (Factions, früh):** die 21 angereicherten Factions sind klein + Ask-tragend + ohne Koordinaten-Risiko → Maintainer/Codex promoviert sie zuerst von Hand in `factions.json` (+ `faction-aliases.json`), dieselbe Klasse wie die 96/Drukhari. Können in den **ersten** Folge-Rebuild.
  - **Gate L (Locations, mit der Map):** die 145 angereicherten Planeten promoviert der Maintainer, wenn die Map-Kuration dran ist; unplatzierbare bleiben sector-only/Sentinel. Eigener, späterer Schritt.
  - Der Reviewer führt **keines** der Gates aus.
- **Unresolved bleibt Sentinel, kein geratener Slug, keine geratenen Felder.** Kein glaubwürdiger Treffer → Sentinel bleibt `__unresolved__` + `rawName` + Note. Felder, die sich nicht belegen lassen, bleiben **leer** — nie geraten.
- **Kontext-Disziplin wie 131/154.** Ein Maintainer-Befehl; Bash-Driver iteriert, spawnt pro Chunk (von Sentinels) eine frische `claude -p`-Subsession (auto close/reopen, **kein** manuelles `/clear`), validiert JSON gegen den Contract, merged sequenziell/atomar. **Resumebar** (überspringt erledigte Sentinel-Keys — bei Web-Latenz unverzichtbar). **MECHANICAL-Präludium byte-genau** für Enricher **und** Verifier. **Null metered API** (CC-Direct, kein `@anthropic-ai/sdk`-Aufruf im Laufpfad). Chunk-Größe CCs Wahl, hart, im Report mit Token-Rahmen belegt (< ~120k inkl. Web-Treffern).
- **DB-Freeze (Brief 149/151) gilt über den Pass.** Read-only ggü. DB; einziger Output sind committete Vorschlags-Dateien. Kein Prod-`db:rebuild`/`db:migrate`/`db:apply-override` in dieser Session.
- **Modell = Opus (aktuell), mit Web-Search + Thinking.** Kein Versions-/Modell-Pin über die Absicht hinaus (CLAUDE.md § Version policy); CC wählt das exakte Alias und belegt es im Report. **TypeScript strict, server-seitig.**

## Out of scope (explizit NICHT anfassen)

- **Character-Sentinels (315).** Bleiben geparkt, nicht angereichert/angelegt. Reversibel.
- **Voll-Re-Review der Kanten / web-Sweep über die 889 Bücher.** Kein Entdecken neuer/fehlplatzierter Kanten; nur Anreicherung bestehender struktureller Sentinels.
- **Jede DB-Mutation + jeder Rebuild.** Stage 3 ist read-only ggü. der DB. Der/die Rebuild(s), die die Korrekturen + promovierten Entities in die DB ziehen, sind **separate Ops-Schritte** (s. Notes → Rebuild-Sequenz), nicht Teil dieser Session.
- **Direkter Katalog-Write durch den Reviewer.** Materialisierung bleibt Maintainer-/Codex-Hand-Schritt (Gates F/L).
- **Präzise Map-Pin-Kuration.** Der Pass schlägt `gx`/`gy` *vor*, wo belegbar; die endgültige kartografische Platzierung/Feinjustage ist Produkt-/Map-Arbeit (Gate L + Product-Strang), nicht dieser Datenlauf.
- **Facets / Series-/Event-Junctions / Synopsis-Qualität.** Unverändert read-only bzw. nicht im Scope.
- **Änderungen an `resolve.ts`/Alias-Index-**Logik**, am `curation-overlay`-Apply/Validator, an `db:rebuild`.** Der Reviewer **konsumiert** den Resolver read-only. Diff = 0. (Neue Aliase für promovierte Entities sind **Daten** über das Hand-Gate, keine Logik-Änderung.)

## Acceptance

The session is done when:

- [ ] Der **CC-Direct-Driver ist auf den Enrichment-Pass erweitert** (Web-Search + Thinking, Modell Opus), iteriert über die **distinkten strukturellen Sentinel-Keys** (mit Quell-Buch-Kontext), **Enricher + schlanke Fakten-Verifier-Subsession** (Faction-alignment/parent + Existenz Pflicht), resumebar, **null metered API**, MECHANICAL-Präludium byte-genau. Ein Maintainer-Befehl startet den Lauf; Chunk-Größe hart + Token-Rahmen im Report.
- [ ] Die **Konventions-Docs sind um eine Enrichment-Konvention erweitert**, inkl. **Quell-/Trust-Hierarchie + Evidenz-Schwelle** + dem **Feld-Vokabular pro Achse** (Faction: parent=existierende id, alignment/tone aus Katalog-Vokabular; Location: sector=existierende id, gx/gy nur wenn belegbar, sonst sector-only/unplatzierbar; nie geratene Koordinaten). Der **Finding-Contract** trägt die **Enrichment-Proposal-Form** (pro Achse die Felder) + die **Alias-Vorschlags-Form**, beide inkl. **Quell-URL(s) + Confidence**.
- [ ] **Der Pass ist über alle ~166 strukturellen Sentinels gelaufen** (21 Faction + 145 Location): bestätigte Anreicherungen liegen als Vorschläge in der **read-only Proposal-Datei** (mit Web-Provenance + Confidence), gegen die Kataloge **dedupliziert** (existierend → Alias-Vorschlag). Für jede Faction sind `alignment` + `parent` gesetzt **oder** als unbelegt geflaggt; für jede Location ist `sector` gesetzt **oder** als unplatzierbar geflaggt, `gx`/`gy` nur wo belegt.
- [ ] **Proposal-Datei hat keinen Apply-Pfad:** Beleg im Report, dass kein Script/`db:rebuild`/Seed-Loader sie in einen Katalog- oder DB-Write einhängt. Materialisierung ausschließlich über Gates F/L.
- [ ] **Findings-Tabelle** (pro Achse: roh / angereichert-bestätigt / Felder-unbelegt / als Alias dedupliziert / bleibt unresolved; Muster 144) + die verworfenen Felder mit Begründung im Log. **Auflösungs-Quote der 166** ausgewiesen.
- [ ] Bestehende Reviewer-Tests + `npm run lint` + `tsc --noEmit` grün. **Keine** Prod-DB-Mutation. Diff an `resolve.ts`-Logik, `curation-overlay`-Apply/Validator, `db:rebuild`, dem Facet-Pfad = 0.

## Open questions (im Report beantworten)

- **Auflösungs-/Anreicherungs-Quote:** wie viele der 21 Factions bekamen valides alignment+parent? Wie viele der 145 Locations bekamen echte `gx`/`gy` vs. nur `sector` vs. unplatzierbar? Was sagt das über den realen Map-Zuwachs?
- **Dedup-Treffer:** wie viele „neue" Sentinels waren in Wahrheit Aliase bestehender Entities? (Maß für die Katalog-Abdeckung.)
- **Endgröße der Proposal-Datei** + ist Gate F (21 Factions) in einem Rutsch handhabbar, und in welcher Form will der Maintainer Gate L (Locations) gestaffelt? Priorisierung nötig (Confidence, platzierbar-zuerst)?
- **Rebuild-Timing:** aus CCs Sicht — trägt die SSOT nach Gate F einen sauberen Rebuild (neue Factions als Reference-Rows zuerst seeden, dann Korpus + Overlay-Tail)? Welche Reference-Seed-Schritte braucht eine **neue** Faction/Location, damit der Rebuild nicht an einer FK hängt (vgl. Drukhari-Precondition, s. Notes)?

## Notes

- **Strang:** Batches (`chrono-lexicanum-batches`) → Branch `codex/ingest-batches-book-review-enrichment` o. ä.; Code → PR. Dieser Brief ist doc-only → liegt direkt auf `main`.
- **Kein UI-Anteil** — daher kein „Design freedom"-Abschnitt; reine Daten-/Pipeline-Arbeit. (Die spätere kartografische Platzierung der Planeten ist Product-Strang-Arbeit, nicht hier.)
- **Reuse-first, nicht neu bauen.** Stage 3 ist die B11-Maschinerie + Web-Search + Opus + Enrichment-Proposal-Pfad, iterierend über strukturelle Sentinels. B11-Helfer (Projektion, Sidecar, Contract, Driver) erweitern statt parallel nachbauen — dieselbe Disziplin wie 154 (geteilte `resolve-book-edges.ts`).
- **Rebuild-Sequenz (Kontext, eigener Ops-Schritt — nicht in dieser Session ausgeführt).** Der Maintainer bringt die Korrekturen in **zwei** Rebuilds in die DB: (1) **jetzt** der 96+Drukhari-Rebuild (Freeze für diesen Schritt gelift), (2) **später** ein zweiter Rebuild nach Gate F/L, der die promovierten strukturellen Entities mitzieht. Beide sind wiederholbar (Rebuild baut aus der SSOT). **Precondition für jeden Rebuild mit neuen Reference-Entities:** eine neue Faction/Location muss als **Reference-Row** existieren, bevor der Korpus-Re-Apply Kanten darauf zeigt — sonst hängt der Rebuild an der FK (exakt der Drukhari-Dry-Run-Halt im 154-Report). Der DB-freie Enrichment-Pass ist davon **unberührt**.
- **Zwei strukturelle 154-Grenzen gelten unverändert:** Junctions = nur Locations + Characters; keine Facets im Overlay. Architektur, nicht verhandelbar (schützen die 149/150-Content-Warning-Garantie).
- **ADR-Notiz (Koordinations-Pass):** Cowork faltet nach dem Report einen ADR/`log.md`-Eintrag, der die gesamte B11-Topologie festhält — CC-Direct Finder+Verifier → `reviewQueue`; Facets separat read-only; die Hand-Gate-Promotion (96/Drukhari + Stage-3-Entities); der Stage-3-**Enrichment**-Pass (nur strukturell, Anreicherung statt Re-Finden) mit Proposal-Pfad; die Vertagung von Character + Kanten-Re-Review. `brain/**` + `sessions/README.md` sind coordination-only → CC trägt substanzielle Fakten in den **Impl-Report**, Cowork backfillt.
- **Voraussetzung:** PR #180 ist gemerged, bevor Stage 3 startet — die korrigierte Baseline (96 in `final`, Drukhari in den Katalogen) ist die Datei-Grundlage des Dedup + der Projektion.
