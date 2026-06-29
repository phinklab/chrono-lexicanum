# Resolver-Pass Runbook — eine Phase

> **⛔ LEGACY (Brief 171 Teil B).** Der Resolver-Pass operierte auf der Batch-Welt (`manual-overrides-ssot-*.json` via `run-phase4-apply.sh` → `db:apply-override`). Diese Batch-Welt ist jetzt eingefrorene Provenienz (der Korpus lebt in `scripts/seed-data/books/*.json`), und `db:apply-override` verweigert. Es laufen **keine neuen Resolver-Wellen** mehr; dieses Runbook bleibt nur als historische Spec stehen. Resolver-Logik selbst (`@/lib/resolver`, `resolve-book-edges.ts`) bleibt produktiv — sie crystallisiert die Edges jedes per-Buch-Applies.

> **Mechanischer Task, keine normale Session.** Dies ist die ausführbare Spec für **genau eine** Phase eines axis-sliced Resolver-Passes. Wer dieses Runbook, die Pass-Config (`scripts/resolver-pass.config.json`) und das Achs-Paket der eigenen Phase gelesen hat, hat alles, was er braucht — sonst nichts. **Kein Brief** wird gelesen, weder Brief 076 noch ein per-pass Architect-Brief (existiert seit Brief 094 nicht mehr), noch der „höchste offene Brief". Die Herkunft der Rationale (Briefs 076 / 090 / 091 / 094) steht im Anhang am Ende — für eine Phase ebenfalls nicht lesen.

## 0. Bedienung

Ein Resolver-Pass ist eine Sequenz von 6 Phasen-Subsessions (Phase 0 → 1 → 2 → 3 → 4a → 4b), je ein frischer `/clear`-Kontext, je **ein** Commit. Phasen laufen **strikt sequenziell** (Phase 1 muss vor Phase 3 liegen — `primaryFactionId` neuer Characters zeigt auf das Phase-1-Faction-Set, sonst FK-Trap). `scripts/run-resolver-loop.sh` ist der scharfe Pfad: Detektor → Auto-Config → Pass-Driver → Loop-Log, fährt aufeinanderfolgende Wellen automatisch (Brief 094). `scripts/run-resolver-pass.sh <config>` fährt eine einzelne Welle standalone — gezielter Re-Run, Diagnose, Ein-Wellen-Manuell-Lauf. Beide Pfade nutzen denselben Phase-Driver, dieselben Halt-Checks, dieselbe Config-Shape.

**Die Config (`scripts/resolver-pass.config.json`) ist der Parameter-Träger.** Sie nennt für genau diesen Pass: `pass`, `wave` (z. B. `ssot-w40k-026..030`), `dossier`-Pfad, `runbook`-Pfad und pro Phase `name` / `trigger` / `scope` / `statusFile`. Die wave-spezifischen Pfade (Dossier, Phase-Reports, Override-Range) kommen **aus der Config**, nicht aus diesem Runbook — das Runbook ist wave-unabhängig.

## 1. Lese-Scope (die Anti-Bloat-Regel)

**Jede Phase liest NUR:**
- dieses Runbook,
- die Pass-Config (`scripts/resolver-pass.config.json`) — Phase-Name, Scope, Pfade,
- das **Achs-Paket der eigenen Phase** (siehe §3 — der kleine File-Set = Write-Scope der Phase),
- ab Phase 1: das **Phase-0-Dossier** (Config-Feld `.dossier`) — der vom Aggregator erzeugte, vorverdichtete Input.

**Lies NICHT** — eine Phase braucht nichts davon, und es ist budget-kritisch:
- **Keinen Brief** — weder Brief 076 noch einen per-pass Architect-Brief (existiert seit Brief 094 nicht mehr). Beides Rationale, ~20k+ Token, die jede Phase sechsmal frisch laden würde. Die Herkunft steht im Anhang.
- die **`manual-overrides-ssot-*.json`-Files** — der Aggregator (Phase 0) hat sie verarbeitet; ab Phase 1 steht alles im Dossier. (Phase 4a wendet sie über Scripts an, **liest** sie aber nicht in den Kontext.)
- das **volle `scripts/logs/ssot-loop-log.md`** (≫100k Token) — nur Tail-Read der relevanten Wellen-Blöcke (§8), nie Volltext.
- die anderen Achs-Pakete (Phase 2 liest nicht `characters.json`, usw.).

**Fahre NICHT die Session-Start-Leseroutine** aus `CLAUDE.md` / `AGENTS.md` (`brain/CLAUDE.md`, `wiki/index.md`, `project-state.md`, `open-questions.md`, `cc-session.md`). Das ist eine mechanische Resolver-Phase, keine normale Session. **Kein Co-Author-Trailer** im Commit.

## 2. Resolver-Semantik (unverändert, Brief 049/072)

Eine Surface-Form wird zu einer Canonical-ID über **direct match → alias lookup**, exakt wie `src/lib/resolver/index.ts`: Stage 1 = exakter Name-Match gegen die Reference-JSON, Stage 2 = exakter Lookup gegen die `*-aliases.json`. **Kein** Fuzzy-Match, **kein** Slug-Match, **keine** Titel-Normalisierung. Unresolved bleibt unresolved — lieber Long-Tail offen lassen als eine falsche Canonical-Kante schreiben.

## 3. Die sechs Phasen (Achs-Paket + Aufgabe + Halt)

Jede Phase berührt **nur** Files in ihrem Scope (Driver-Halt-Check = Diff-Set-Subset gegen Config-`scope`; `scripts/test-resolver.ts` ist phasenübergreifend shared → append/sectioned Edits, sequenziell). Mindestens **ein** Commit pro Phase. JSON muss valide bleiben. Bei architektonischer Unsicherheit → `## Needs decision`-H2-Block in die Per-Phase-Statusdatei und **stoppen** (Driver erkennt das, beendet sauber ohne Folge-Phasen).

### Phase 0 — Preflight/Dossier
- **Lies NUR:** Runbook + Config. **Nicht** die Override-Files, **nicht** das volle Loop-Log.
- **Achs-Paket (Write-Scope):** das Dossier (Config `.dossier`) + der Aggregator `scripts/aggregate-surface-forms.ts` (stabil, wave-parametrisiert — Wave aus Config/Arg, kein neues `-NNN`-Klon).
- **Tun:** `npx tsx scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` laufen lassen; der deterministische Output liefert 6 der 7 Dossier-Sektionen (Buch-Tabelle, Surface-Form-Aggregat pro Achse, Cross-Axis-Konflikte, Omnibus-Scan, data_conflict-Scan). Den Aggregator-Output ins Dossier falten; die 7. Sektion (Kandidaten für `needs-decision` / Cross-Batch-Alias-Konsolidierung) als LLM-Synthese ergänzen, dafür ggf. **Tail**-Read der Wellen-Blöcke aus dem Loop-Log (§8). Ein Commit.
- **Budget:** Phase 0 liest **nie** die 10–100 Override-Files — der Aggregator hat sie verarbeitet.

### Phase 1 — Factions
- **Lies NUR:** Runbook + Config + Dossier + Achs-Paket.
- **Achs-Paket:** `scripts/seed-data/factions.json`, `faction-aliases.json`, ggf. `faction-policy.json` (nur `specialCases`-Notiz, **kein** neuer Browse-Root ohne Maintainer-Decision), `scripts/test-resolver.ts`, Per-Phase-Statusdatei.
- **Tun:** belastbar häufige Faction-Surface-Forms der Welle in `factions.json` / `faction-aliases.json` aufnehmen (Promotions-Regel §4). Idempotenz pro Row prüfen, nur fehlende anlegen. ≥ 5 neue Resolver-Test-Cases. Statusdatei (Done-Summary oder `## Needs decision`). Ein Commit.

### Phase 2 — Locations
- **Lies NUR:** Runbook + Config + Dossier + Achs-Paket.
- **Achs-Paket:** `scripts/seed-data/locations.json`, `location-aliases.json`, ggf. `sectors.json` (nur falls eine neue Location einen Sector-FK braucht), `scripts/test-resolver.ts`, Per-Phase-Statusdatei.
- **Tun:** häufige Location-Surface-Forms aufnehmen; Vessel-/Space-Hulk-Locations mit `tags:['vessel']`, `gx/gy:null` (Welt-Geographie schreibt sie nicht auf die Karte). ≥ 4 neue Test-Cases. Idempotenz prüfen. Statusdatei. Ein Commit.

### Phase 3 — Characters
- **Lies NUR:** Runbook + Config + Dossier + Achs-Paket. (⚠ `characters.json` ist die größte Reference-JSON und wächst je Welle; ab mid-Korpus ggf. weiteres Achs-Slicing nötig.)
- **Achs-Paket:** `scripts/seed-data/characters.json`, `character-aliases.json`, `scripts/test-resolver.ts`, Per-Phase-Statusdatei.
- **Tun:** Character-Surface-Forms aufnehmen, mit besonderer Vorsicht bei Cross-Batch-Alias-Konsolidierung (ein Charakter über mehrere Batches → **eine** Row). `primaryFactionId` neuer Characters muss auf das Phase-1-Faction-Set zeigen (darum Phase 1 strikt zuvor). ≥ 5 neue Test-Cases, davon ≥ 2 für Alias-Konsolidierung. Statusdatei. Ein Commit.

### Phase 4a — Integration / Apply
- **Lies NUR:** Runbook + Config + Dossier + die Apply-seitigen Integration-Scripts im Scope — **nie** rohe Per-Batch-Apply-Logs, **nie** die Override-Files im Kontext.
- **Achs-Paket:** `scripts/seed-resolver-extensions.ts` (Insert-Liste erweitern), `scripts/apply-override-dry.ts` + `scripts/apply-override-collections.ts` / `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts` (Batch-Range der Trias auf die kumulative Range ausweiten), `scripts/seed-data/collection-gaps.json` (bei Bedarf), `scripts/seed-data/persons.json`, die Override-File-Globs der Welle, die stabilen Apply-Tools (`db-counts.ts`, `seed-facets.ts`, `run-phase4-apply.sh`), der committete Apply-Digest `ingest/.last-run/phase4-digest.md`, die 4a-Statusdatei. (`facet-catalog.json` ist bewusst **nicht** im Scope — ein Call-2-artiger Facet-Add ist ein `## Needs decision`-Stop.)
- **Tun:** Mutations-Hälfte. Resolver-Extension-Rows seeden, die Trias-Ranges ausweiten, dann re-apply über die kumulative Range **über die Digest-Scripts** (§7): `run-phase4-apply.sh` schreibt + committet den kompakten Apply-Digest. Apply-seitige Trias grün ziehen (§10, inkl. `npm run test:collection-refs`). Eine **selbst-enthaltene 4a-Statusdatei** schreiben: Counts-Tabelle Pre/Per-Batch/Post, Reference-Row-Deltas, etwaige Override-/facetId-Strips, jede Anomalie oder Ermessens-Entscheidung, und entweder einen „ready for 4b"-Marker oder einen `## Needs decision`-Block. Ein Commit.

### Phase 4b — Verify / Report
- **Lies NUR:** Runbook + Config + die **4a-Statusdatei** + den committeten **Apply-Digest** (`ingest/.last-run/phase4-digest.md`) — **nie** rohe Apply-Ausgabe, **nie** die Override-Files, **nie** die Apply-seitigen Skripte.
- **Achs-Paket:** `scripts/verify-pass.ts` und der finale impl-Report.
- **Tun:** Read-only-Hälfte. `verify-pass.ts --config …` selbst fahren — es **emittiert** den Verify-Digest nach stdout (es gibt **keine** Verify-Digest-Datei; §7). Dann `lint` + `typecheck` (§10) — **keine** Trias-Re-Run (4a hat die Code-Edits bereits grün gezogen; 4b schreibt nur Markdown), **kein** zweiter DB-Apply. Den finalen Impl-Report aus 4a-Statusdatei + Apply-Digest + verify-pass.ts-stdout polieren (Counts-Tabelle, Smoke-Slugs, Audit-Replica) — **keinen** Zustand neu herleiten. Ein Commit.

## 4. Promotions- & Alias-Disziplin

- **Promotion nur bei Evidenz.** Default-Schwelle: **freq ≥ 2 strict** + eine kuratierte Liste lore-ikonischer **freq=1**-Promotionen (aus Dossier / Loop-Log / source-backed Notes). Bei Identitäts-Unsicherheit → `needs-decision`, **nicht** raten.
- **Keine over-broad Aliases.** Ein `*-aliases.json`-Eintrag ist nur legitim, wenn (a) die Surface-Form in der Welle konkret auftaucht, (b) die Ziel-Canonical-ID lore-eindeutig ist, (c) keine Cross-Axis-Disambiguation-Falle besteht (Surface-Form auf zwei Achsen). Sonst unresolved lassen.
- **Surface-Form-Treue.** Reference-Namen kanonisch, aber keine erfundenen Entitäten — jede Promotion braucht eine Dossier-/Source-Basis.

### Cross-Era-Identitäten (HH ↔ W40K)

**Eine kanonische Identität = eine Canonical-Row. Era-spezifische Bezeichnungen wandern in `*-aliases.json`.** Die Zeit-Achse (Pre-Heresy → Heresy → Post-Heresy) ist eine **Story-Property**, keine **Identitäts-Property**. `Luna Wolves` und `Sons of Horus` sind dieselbe organisatorische Einheit unter zwei Bezeichnungen; `Kharn` und `Kharn the Betrayer` sind dieselbe Person mit zwei Surface-Forms. Eine zweite Canonical-Row würde Junction-Counts künstlich teilen und das Audit-Cockpit zerlegt eine Identität in zwei Drift-Cluster.

Konkrete Modellierungs-Regeln, die jeder HH-Resolver-Pass anwendet:

- **Faction-Rename** (Luna Wolves → Sons of Horus o. ä. bei Heresy-Era-Übergängen): die heute existierende Post-Heresy-Canonical-Row (`sons_of_horus`) ist der Anker; HH-Surface-Forms (`Luna Wolves`) werden in `faction-aliases.json` auf diese Canonical-ID gemappt. **Keine** separate `luna_wolves`-Row.
- **Character-Honor-Title-Split** (Kharn ↔ Kharn the Betrayer, Abaddon ↔ Abaddon the Despoiler, Magnus ↔ Magnus the Red, Lucius ↔ Lucius the Eternal): die existierende W40K-Canonical-Row (`kharn_the_betrayer` etc.) ist der Anker; HH-Surface-Form (`Kharn`) wird Alias zur W40K-Row. Pre-Heresy-Charaktere ohne W40K-Pendant (`Garviel Loken`, `Nathaniel Garro`, `Tarik Torgaddon` u. ä.) bekommen frische Canonical-Rows.
- **Primarchen.** Bestehende Canonical-Rows mit Honor-Titles bleiben Anker (`magnus_the_red`, `ferrus_manus`, `mortarion`, `vulkan`, `roboute_guilliman`). HH-Surface-Forms ohne Title (`Magnus`, `Mortarion`) werden Aliases. Primarchen ohne heutige Row (`Horus`, `Sanguinius`, `Rogal Dorn`, `Lion El'Jonson`, `Leman Russ`, `Lorgar`, `Fulgrim`, `Perturabo`, `Corax`, `Alpharius`, `Konrad Curze` u. a.) werden frische Canonical-Rows.

**Ausnahme — echte Identitäts-Disambig.** Stößt der Pass auf eine echte Gleichnamigkeit (gleicher Surface-Form, andere Identität — selten, aber denkbar bei generischen Namen wie „Marcus"), `## Needs decision`-Stop in der Phase-Statusdatei. Kein Raten.

**Surface-Form-Treue bleibt unverändert.** HH-Override-Files tragen die Lore-korrekte Surface-Form („Luna Wolves" bleibt „Luna Wolves" in der Override-Datei) — das Resolving zur Canonical-ID via Alias passiert in Phase 4a (Apply-Layer), nicht in der Override-File.

## 5. Phase-übergreifende Reihenfolge & FK-Sicherheit

Phase 1 (Factions) **strikt vor** Phase 3 (Characters). Phase 4a läuft nach 1–3 (setzt deren Commits auf dem Branch voraus); Phase 4b läuft **strikt nach 4a** und liest dessen 4a-Statusdatei + den committeten Apply-Digest. Phase 4b ist die letzte Phase. Der Driver erzwingt die Reihenfolge über die Config-`phases[]`-Reihenfolge; manuell der Maintainer über die `/clear`-Sequenz.

## 6. Phase-0-Token-Dichte (Baustein 3)

Phase 0 liest **nur** den Aggregator-Output + (bei Bedarf) Tail-Blöcke des Loop-Logs. Die Override-Files werden **nie** von der Phase-0-Subsession gelesen — der Aggregator (`scripts/aggregate-surface-forms.ts`, deterministisch, byte-identisch re-runnable) hat sie verarbeitet und emittiert 6 der 7 Dossier-Sektionen mechanisch. Darf der Aggregator mehr emittieren (z. B. Cross-Batch-Alias-Kandidaten-Liste, `needs-decision`-Heuristik), um die LLM-Synthese zu verkleinern, ist das erlaubt — solange der Output deterministisch bleibt.

## 7. Phase-4a/4b-Digest-Disziplin (korpus-unabhängig)

Jeder Phase-4a-Schritt, dessen Kosten mit der Gesamt-Buchzahl wächst — das Re-Apply über `001..NNN`, die Smoke-Slug-Checks, die Audit-Cockpit-SQL-Replica — läuft als **Script, das einen fix-großen Digest emittiert** (Counts-Tabelle, Inserts/Updates-pro-Batch-Tabelle, Smoke-Tabelle). Phase 4a schreibt + committet den Apply-Digest; Phase 4b liest **den committeten Apply-Digest, nie die rohe Per-Batch-Ausgabe**, und fährt `verify-pass.ts` selbst für den Verify-Digest (s. u.). Damit ist Phase-4a/4b-Kontext korpus-**un**abhängig (~konstant, egal ob 250 oder 859 Bücher).

- `scripts/run-phase4-apply.sh <config>` — **Phase 4a**: seedet Resolver-Extensions + Facets (non-destruktiv), wendet jeden Batch der kumulativen Range an und schreibt einen **kompakten Digest** `ingest/.last-run/phase4-digest.md` (Pre/Per-Batch/Post-Counts), **nicht** die rohe `npm run db:apply-override`-Ausgabe pro Batch in den Kontext. 4a committet diesen Digest — er ist 4bs Apply-seitiger Input.
- `scripts/db-counts.ts` — generische Junction-/Reference-/Works-Counts (eine Tabelle).
- `scripts/seed-facets.ts` — idempotenter Facet-Catalog-Upsert (`ON CONFLICT DO NOTHING`).
- `scripts/verify-pass.ts --config …` — **Phase 4b** fährt es selbst; es **emittiert** den Verify-Digest nach **stdout** (keine Datei): Smoke-Slug-Junction-Counts für die Config-Slug-Liste, Rating-Coverage der Wellen-Range, Drift/Gap/Collection-Audit-Replica für Alt- + Neu-Range. Pass-spezifische Einzel-Checks ergänzt die Phase als ad-hoc-SQL, falls nötig.

**Validierung:** der Re-Apply ist idempotent (delete-then-insert pro Junction über die existierenden Bücher) — genau das, was Phase 4a ohnehin tut. Das ist **kein** Production-Pass und mutiert keinen neuen Inhalt.

## 8. Loop-Log Tail-Read & Append ohne Voll-Last

`scripts/logs/ssot-loop-log.md` ist ≫100k Token — **nie** im Volltext lesen. Phase 0 braucht nur die Blöcke der eigenen Welle: Tail-Read (`tail`/Offset) oder gezielte Grep-Suche nach den Wellen-Batch-IDs. Resolver-Pässe **schreiben** normalerweise nicht ins Loop-Log (das tut der SSOT-Loop); falls ein Pass einen Marker anhängt, dann per Shell-Append (`>>`), nicht via Voll-Read+Rewrite.

## 9. Commit-Regel

- Ein Commit pro Phase (auch 4a und 4b je einer). Nur Pfade aus dem Phase-Scope anfassen.
- **Kein Co-Author-Trailer.** Commit-Message imperativ, z. B. `Resolver-Pass 6 Phase 1 (Factions) — ssot-w40k-026..030`.

## 10. Verifikation

Code-berührende Phasen (1–3, 4a) halten die Resolver-Trias grün, bevor committet wird:
`npm run test:resolver`, `npm run test:resolver-data`, `npm run test:resolver-coverage`, `npm run test:apply-override-dry` (Phase 4a zusätzlich `npm run test:collection-refs`). Phase 4a zusätzlich `npm run lint` + `npm run typecheck`, wenn Scripts geändert wurden. Phase 4b läuft **read-only**: `scripts/verify-pass.ts --config …` (DB-Verify-Digest) + `npm run lint` + `npm run typecheck`, **keine** Trias-Re-Run (4a hat die Code-Edits bereits grün gezogen; 4b schreibt nur Markdown). Phase 0 (reines Dossier-Markdown + deterministischer Aggregator) darf die Trias überspringen — im Phase-Report kurz vermerken.

## Anhang — Herkunft (überspringbar, nur Background)

Die operative Spec hier konsolidiert die Rationale aus den Briefs 076 (Design des axis-sliced Resolver-Passes), 090 (lean-Umbau: Runbook statt Volltext-Brief, Aggregator-Digest, Phase-4-Apply-Digest), 091 (Phase-4-Split in 4a/4b + range-aware forward-ref Guard), 094 (headless Resolver-Loop + brief-freier Runbook) und 100 (Resolver-Loop zwei-domänen-fähig W40K + HH, Cross-Era-Identitäten, HH-Bootstrap-Wave-Sizing). Ein per-pass Architect-Brief existiert seit Brief 094 **nicht mehr**; das `brief`-Feld in der Config wurde entfernt. Wer das Runbook fährt — egal ob via `scripts/run-resolver-loop.sh` (Loop) oder `scripts/run-resolver-pass.sh` (Einzel-Welle) — liest **keinen** dieser Briefs.
