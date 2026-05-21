# Resolver-Pass Runbook — eine Phase

> **Mechanischer Task, keine normale Session.** Dies ist die ausführbare Spec für **genau eine** Phase eines axis-sliced Resolver-Passes (Brief 076 = Design, Brief 090 = lean-Umbau). Wer dieses Runbook, die Pass-Config (`scripts/resolver-pass.config.json`) und das Achs-Paket der eigenen Phase gelesen hat, hat alles, was er braucht — sonst nichts. Das Design-Rationale (warum es den Resolver-Pass gibt, die Achsen-Aufteilung, der Driver) steht in Brief 076; **für eine Phase nicht lesen.** Der per-pass Architect-Brief (`*-arch-resolver-pass-N.md`) ist optional und ebenfalls Rationale — er wird **nicht** zum Fahren einer Phase gelesen.

## 0. Bedienung

Ein Resolver-Pass ist eine Sequenz von 5 Phasen-Subsessions (Phase 0 → 1 → 2 → 3 → 4), je ein frischer `/clear`-Kontext, je **ein** Commit. Der Maintainer gibt pro `/clear` an, welche Phase dran ist; CC liest dieses Runbook + die Config und fährt genau diese eine Phase. Phasen laufen **strikt sequenziell** (Phase 1 muss vor Phase 3 liegen — `primaryFactionId` neuer Characters zeigt auf das Phase-1-Faction-Set, sonst FK-Trap). Optional fährt `scripts/run-resolver-pass.sh <config>` die Phasen headless hintereinander (gleiche Spec, gleiche Halt-Checks) — Driver bleibt konsistent zu diesem Runbook, ist aber nicht „scharf" (supervised by default).

**Die Config (`scripts/resolver-pass.config.json`) ist der Parameter-Träger.** Sie nennt für genau diesen Pass: `pass`, `wave` (z. B. `ssot-w40k-026..030`), `dossier`-Pfad, `runbook`-Pfad und pro Phase `name` / `trigger` / `scope` / `statusFile`. Die wave-spezifischen Pfade (Dossier, Phase-Reports, Override-Range) kommen **aus der Config**, nicht aus diesem Runbook — das Runbook ist wave-unabhängig.

## 1. Lese-Scope (die Anti-Bloat-Regel)

**Jede Phase liest NUR:**
- dieses Runbook,
- die Pass-Config (`scripts/resolver-pass.config.json`) — Phase-Name, Scope, Pfade,
- das **Achs-Paket der eigenen Phase** (siehe §3 — der kleine File-Set = Write-Scope der Phase),
- ab Phase 1: das **Phase-0-Dossier** (Config-Feld `.dossier`) — der vom Aggregator erzeugte, vorverdichtete Input.

**Lies NICHT** — eine Phase braucht nichts davon, und es ist budget-kritisch (Brief 090 § Mess-Befund):
- **Brief 076** oder den per-pass Architect-Brief (`*-arch-resolver-pass-N.md`) — beides Rationale, ~22k Token, die jede Phase fünfmal frisch laden würde.
- die **`manual-overrides-ssot-*.json`-Files** — der Aggregator (Phase 0) hat sie verarbeitet; ab Phase 1 steht alles im Dossier. (Phase 4 wendet sie über Scripts an, **liest** sie aber nicht in den Kontext.)
- das **volle `sessions/ssot-loop-log.md`** (≫100k Token) — nur Tail-Read der relevanten Wellen-Blöcke (§8), nie Volltext.
- die anderen Achs-Pakete (Phase 2 liest nicht `characters.json`, usw.).

**Fahre NICHT die Session-Start-Leseroutine** aus `CLAUDE.md` / `AGENTS.md` (`brain/CLAUDE.md`, `wiki/index.md`, `project-state.md`, `open-questions.md`, `cc-session.md`). Das ist eine mechanische Resolver-Phase, keine normale Session. **Kein Co-Author-Trailer** im Commit.

## 2. Resolver-Semantik (unverändert, Brief 049/072)

Eine Surface-Form wird zu einer Canonical-ID über **direct match → alias lookup**, exakt wie `src/lib/resolver/index.ts`: Stage 1 = exakter Name-Match gegen die Reference-JSON, Stage 2 = exakter Lookup gegen die `*-aliases.json`. **Kein** Fuzzy-Match, **kein** Slug-Match, **keine** Titel-Normalisierung. Unresolved bleibt unresolved — lieber Long-Tail offen lassen als eine falsche Canonical-Kante schreiben.

## 3. Die fünf Phasen (Achs-Paket + Aufgabe + Halt)

Jede Phase berührt **nur** Files in ihrem Scope (Driver-Halt-Check = Diff-Set-Subset gegen Config-`scope`; `scripts/test-resolver.ts` ist phasenübergreifend shared → append/sectioned Edits, sequenziell). Mindestens **ein** Commit pro Phase. JSON muss valide bleiben. Bei architektonischer Unsicherheit → `## Needs decision`-H2-Block in die Per-Phase-Statusdatei und **stoppen** (Driver erkennt das, beendet sauber ohne Folge-Phasen).

### Phase 0 — Preflight/Dossier
- **Lies NUR:** Runbook + Config. **Nicht** die Override-Files, **nicht** das volle Loop-Log.
- **Achs-Paket (Write-Scope):** das Dossier (Config `.dossier`) + der Aggregator `scripts/aggregate-surface-forms.ts` (stabil, wave-parametrisiert — Wave aus Config/Arg, kein neues `-NNN`-Klon).
- **Tun:** `npx tsx scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` laufen lassen; der deterministische Output liefert 6 der 7 Dossier-Sektionen (Buch-Tabelle, Surface-Form-Aggregat pro Achse, Cross-Axis-Konflikte, Omnibus-Scan, data_conflict-Scan). Den Aggregator-Output ins Dossier falten; die 7. Sektion (Kandidaten für `needs-decision` / Cross-Batch-Alias-Konsolidierung) als LLM-Synthese ergänzen, dafür ggf. **Tail**-Read der Wellen-Blöcke aus dem Loop-Log (§8). Ein Commit.
- **Budget:** Phase 0 liest **nie** die 10–100 Override-Files — der Aggregator hat sie verarbeitet (Brief 090 Baustein 3).

### Phase 1 — Factions
- **Lies NUR:** Runbook + Config + Dossier + Achs-Paket.
- **Achs-Paket:** `scripts/seed-data/factions.json`, `faction-aliases.json`, ggf. `faction-policy.json` (nur `specialCases`-Notiz, **kein** neuer Browse-Root ohne Maintainer-Decision), `scripts/test-resolver.ts`, Per-Phase-Statusdatei.
- **Tun:** belastbar häufige Faction-Surface-Forms der Welle in `factions.json` / `faction-aliases.json` aufnehmen (Promotions-Regel §4). Idempotenz pro Row prüfen, nur fehlende anlegen. ≥ 5 neue Resolver-Test-Cases. Statusdatei (Done-Summary oder `## Needs decision`). Ein Commit.

### Phase 2 — Locations
- **Lies NUR:** Runbook + Config + Dossier + Achs-Paket.
- **Achs-Paket:** `scripts/seed-data/locations.json`, `location-aliases.json`, ggf. `sectors.json` (nur falls eine neue Location einen Sector-FK braucht), `scripts/test-resolver.ts`, Per-Phase-Statusdatei.
- **Tun:** häufige Location-Surface-Forms aufnehmen; Vessel-/Space-Hulk-Locations nach 072/076-Konvention (`tags:['vessel']`, `gx/gy:null`). ≥ 4 neue Test-Cases. Idempotenz prüfen. Statusdatei. Ein Commit.

### Phase 3 — Characters
- **Lies NUR:** Runbook + Config + Dossier + Achs-Paket. (⚠ `characters.json` ist die größte Reference-JSON und wächst je Welle — Brief 090 § For next session: ab ~mid-Korpus ggf. Achs-Slice nötig. Bei `001..025` unkritisch.)
- **Achs-Paket:** `scripts/seed-data/characters.json`, `character-aliases.json`, `scripts/test-resolver.ts`, Per-Phase-Statusdatei.
- **Tun:** Character-Surface-Forms aufnehmen, mit besonderer Vorsicht bei Cross-Batch-Alias-Konsolidierung (ein Charakter über mehrere Batches → **eine** Row). `primaryFactionId` neuer Characters muss auf das Phase-1-Faction-Set zeigen (darum Phase 1 strikt zuvor). ≥ 5 neue Test-Cases, davon ≥ 2 für Alias-Konsolidierung. Statusdatei. Ein Commit.

### Phase 4 — Integration / Apply / Verify / Report
- **Lies NUR:** Runbook + Config + Dossier + die Integration-Scripts im Scope + die **Digests** (§7) — **nie** rohe Per-Batch-Apply-Logs, **nie** die Override-Files im Kontext.
- **Achs-Paket:** `scripts/seed-resolver-extensions.ts` (Insert-Liste erweitern), `scripts/apply-override-dry.ts` / `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts` (Batch-Range der Trias auf die kumulative Range ausweiten), `scripts/seed-data/collection-gaps.json` (bei Bedarf), `scripts/seed-data/facet-catalog.json` (nur bei einem Call-2-artigen Facet-Add), die stabilen Tools (`db-counts.ts`, `seed-facets.ts`, `run-phase4-apply.sh`, `verify-pass.ts`), der finale impl-Report, das Status-Update des Briefs.
- **Tun:** §7 (digest-only). Resolver-Extension-Rows + ggf. neue Facet-Values seeden, dann re-apply über die kumulative Range, **alles über Digest-Scripts**. Counts-Tabelle Pre/Per-Batch/Post, Smoke-Slugs, Audit-Replica — aus den Digests, nicht aus Rohausgabe. Finalen Report schreiben, Brief-Status auf `implemented`. ≥ 1 Commit (mehrere erlaubt).

## 4. Promotions- & Alias-Disziplin (stabile Regel, aus 072/074/076)

- **Promotion nur bei Evidenz.** Default-Schwelle: **freq ≥ 2 strict** + eine kuratierte Liste lore-ikonischer **freq=1**-Promotionen (aus Dossier / Loop-Log / source-backed Notes). Bei Identitäts-Unsicherheit → `needs-decision`, **nicht** raten.
- **Keine over-broad Aliases.** Ein `*-aliases.json`-Eintrag ist nur legitim, wenn (a) die Surface-Form in der Welle konkret auftaucht, (b) die Ziel-Canonical-ID lore-eindeutig ist, (c) keine Cross-Axis-Disambiguation-Falle besteht (Surface-Form auf zwei Achsen). Sonst unresolved lassen.
- **Surface-Form-Treue.** Reference-Namen kanonisch, aber keine erfundenen Entitäten — jede Promotion braucht eine Dossier-/Source-Basis.

## 5. Phase-übergreifende Reihenfolge & FK-Sicherheit

Phase 1 (Factions) **strikt vor** Phase 3 (Characters). Phase 4 läuft zuletzt und setzt die Phasen-1–3-Commits auf dem Branch voraus. Der Driver erzwingt die Reihenfolge über die Config-`phases[]`-Reihenfolge; manuell der Maintainer über die `/clear`-Sequenz.

## 6. Phase-0-Token-Dichte (Baustein 3)

Phase 0 liest **nur** den Aggregator-Output + (bei Bedarf) Tail-Blöcke des Loop-Logs. Die Override-Files werden **nie** von der Phase-0-Subsession gelesen — der Aggregator (`scripts/aggregate-surface-forms.ts`, deterministisch, byte-identisch re-runnable) hat sie verarbeitet und emittiert 6 der 7 Dossier-Sektionen mechanisch. Darf der Aggregator mehr emittieren (z. B. Cross-Batch-Alias-Kandidaten-Liste, `needs-decision`-Heuristik), um die LLM-Synthese zu verkleinern, ist das erlaubt — solange der Output deterministisch bleibt.

## 7. Phase-4-Digest-Disziplin (Baustein 4, korpus-unabhängig)

Jeder Phase-4-Schritt, dessen Kosten mit der Gesamt-Buchzahl wächst — das Re-Apply über `001..NNN`, die Smoke-Slug-Checks, die Audit-Cockpit-SQL-Replica — läuft als **Script, das einen fix-großen Digest emittiert** (Counts-Tabelle, Inserts/Updates-pro-Batch-Tabelle, Smoke-Tabelle). Die Phase-4-Subsession liest **den Digest, nie die rohe Per-Batch-Ausgabe.** Damit ist Phase-4-Kontext korpus-**un**abhängig (~konstant, egal ob 250 oder 859 Bücher).

- `scripts/run-phase4-apply.sh <config>` — seedet Resolver-Extensions + Facets (non-destruktiv), wendet jeden Batch der kumulativen Range an und schreibt einen **kompakten Digest** (Pre/Per-Batch/Post-Counts), **nicht** die rohe `npm run db:apply-override`-Ausgabe pro Batch in den Kontext.
- `scripts/db-counts.ts` — generische Junction-/Reference-/Works-Counts (eine Tabelle).
- `scripts/seed-facets.ts` — idempotenter Facet-Catalog-Upsert (`ON CONFLICT DO NOTHING`).
- `scripts/verify-pass.ts --config …` — emittiert den Verify-Digest (Smoke-Slug-Junction-Counts für die Config-Slug-Liste, Rating-Coverage der Wellen-Range, Drift/Gap/Collection-Audit-Replica für Alt- + Neu-Range). Pass-spezifische Einzel-Checks ergänzt die Phase als ad-hoc-SQL, falls nötig.

**Validierung (Brief 090):** der Re-Apply ist idempotent (delete-then-insert pro Junction über die existierenden Bücher) — genau das, was Phase 4 ohnehin tut. Das ist **kein** Production-Pass und mutiert keinen neuen Inhalt.

## 8. Loop-Log Tail-Read & Append ohne Voll-Last

`sessions/ssot-loop-log.md` ist ≫100k Token — **nie** im Volltext lesen. Phase 0 braucht nur die Blöcke der eigenen Welle: Tail-Read (`tail`/Offset) oder gezielte Grep-Suche nach den Wellen-Batch-IDs. Resolver-Pässe **schreiben** normalerweise nicht ins Loop-Log (das tut der SSOT-Loop); falls ein Pass einen Marker anhängt, dann per Shell-Append (`>>`), nicht via Voll-Read+Rewrite.

## 9. Commit-Regel

- Ein Commit pro Phase (Phase 4 darf mehrere). Nur Pfade aus dem Phase-Scope anfassen.
- **Kein Co-Author-Trailer.** Commit-Message imperativ, z. B. `Resolver-Pass 6 Phase 1 (Factions) — ssot-w40k-026..030`.

## 10. Verifikation

Code-berührende Phasen (1–4) halten die Resolver-Trias grün, bevor committet wird:
`npm run test:resolver`, `npm run test:resolver-data`, `npm run test:resolver-coverage`, `npm run test:apply-override-dry`. Phase 4 zusätzlich `npm run lint` + `npm run typecheck`, wenn Scripts geändert wurden. Phase 0 (reines Dossier-Markdown + deterministischer Aggregator) darf die Trias überspringen — im Phase-Report kurz vermerken.
