---
session: 2026-05-16-077
role: implementer
date: 2026-05-17
status: complete
slug: grand-alignment-junction-hygiene
parent: 2026-05-16-077-arch-grand-alignment-junction-hygiene
links:
  - 2026-05-16-077-arch-grand-alignment-junction-hygiene
  - 2026-05-16-076-impl-resolver-batch-4-axis-sliced
  - 2026-05-13-070-arch-faction-policy-hygiene
  - 2026-05-11-061-arch-ssot-loop
commits:
  - c8db331
  - 4ea8014
  - bd972f9
  - c293dac
  - 1395d4e
  - 90c4a0c
  - 54dc9b3
  - 0bd81fc
  - c0f70d6
---

# Grand-Alignment-Junction-Hygiene — implemented

## Summary

Skip-Logik für `imperium` / `chaos` `work_factions`-Junctions landet im Apply-Layer (pure helper `decideFactionSkips()` in `scripts/apply-override-skip.ts`, aufgerufen aus `applyBook` in `scripts/apply-override.ts`). Re-Apply über `ssot-w40k-001..020` putzt die existierenden redundanten Rows weg: `work_factions=1185 → 1020 (−165)`, davon `imperium 81 → 6 (−75)` und `chaos 133 → 43 (−90)`. Loop-Discipline ab `ssot-w40k-021` ist in Brief 061 verankert und im `run-ssot-loop.sh`-Trigger-Heredoc dupliziert; `faction-policy.md`-ADR trägt die Skip-Sektion + Revisit-Trigger für künftige Aeldari-Sub-Splits.

## What I did

Sequenziell in neun Commits auf `session-077-grand-alignment-junction-hygiene` (von `ingest/batches-016-020`-Tip aus = 076-Stand abgezweigt, weil 077 auf den 076-Apply-Stand aufsetzt; landet via PR auf `main`, sobald 076 dort gemerged ist).

- **Commit 1 (`c8db331`)** — Brief 077 + `sessions/README.md`-Active-Threads-Update (offen → CC-Step).
- **Commit 2 (`4ea8014`)** — Data-Patches. `scripts/seed-data/factions.json` `imperium`-Row trägt explizit `"alignment": "imperium"` (single source of truth statt `inferAlignmentFromTree`-Inferenz). `scripts/seed-data/faction-policy.json` trägt neue Top-Level-Field `"redundantWhenSubPresent": ["imperium", "chaos"]`.
- **Commit 3 (`bd972f9`)** — `src/lib/seed/alignment.ts` neu (Alignment-Type + `inferAlignmentFromTree` + `normalizeAlignment` + `FactionAlignmentInput`). `scripts/seed-resolver-extensions.ts:125–141` importiert jetzt von dort statt lokaler Kopien. Kein Verhaltens-Change (Step 1 hat die imperium-Row schon explizit alignment-getaggt; beide Pfade konvergieren).
- **Commit 4 (`c293dac`)** — Pure Skip-Helper `scripts/apply-override-skip.ts` mit DI-Signatur (`resolveFaction` als Parameter). Drei-Bedingungen-Skip aus Brief § Constraints; `skippedSurfaceForms` bewahrt alle Alias-Surface-Forms (nicht nur die Resolver-Dedupe-Survivors) via Re-Resolve über `original`-Block.
- **Commit 5 (`1395d4e`)** — Apply-Layer-Wiring. `scripts/apply-override.ts`: neuer `loadSkipContext()` lädt `faction-policy.json` + `factions.json` und baut `{redundantIds, alignmentById}`. Startup-Validation wirft, wenn ein `redundantWhenSubPresent`-Eintrag entweder nicht in `factions.json` existiert oder `alignment === "neutral"` ist (Guard gegen stille Policy-Drift). `applyBook` reordered: Faction-Resolution + `decideFactionSkips()` laufen jetzt VOR `buildSurfaceFormsBlock`, der die `factionsSkippedRedundant`-Bare-String-Array bekommt; `keepFactions` füttert das DELETE-then-INSERT-Write. `factionCount` im `BookApplyResult` reflektiert die Post-Skip-Zahl. `buildSurfaceFormsBlock` emittiert den neuen Bucket nur bei non-empty (Diff bleibt minimal für Bücher ohne Skip). Parallel-Edit: `scripts/apply-override-dry.ts` simuliert den Skip jetzt auch, damit die Dry-Run-Totals der DB-Realität entsprechen; neue Report-Zeile „skipped surface forms: N across M books, by name: ...".
- **Commit 6 (`90c4a0c`)** — `scripts/test-resolver.ts`: sechs Cases für `decideFactionSkips` (skip-fires für imperium/chaos, skip-fires-nicht für no-sub-only und chaos-peer-für-imperium-Tag, both-skip-mixed-block, multi-alias-audit-trail). 122/0 Tests grün (vorher 116).
- **Commit 7 (`54dc9b3`)** — Loop-Discipline. `sessions/2026-05-11-061-arch-ssot-loop.md` trägt neuen Constraint-Block `Faction-Granularity-Discipline (ab ssot-w40k-021 / W40K-0201)` direkt nach dem Public-Synopsis-Block, mit Verboten-Liste (Imperium / Imperium of Man / Imperium of Mankind, generic Chaos, Xenos / Aliens) + Erhaltungs-Pfad-Klärung + Begründung. `scripts/run-ssot-loop.sh` heredoc-Append nach Public-Synopsis-Discipline-Zeile — jede `claude -p`-Loop-Subsession ab nächstem Lauf bekommt die Discipline mit.
- **Commit 8 (`0bd81fc`)** — `brain/wiki/decisions/faction-policy.md`: neue h2 „Grand-Alignment-Junction-Skip" zwischen „Sonderfälle" und „Was wir bewusst NICHT entscheiden", mit Skip-Liste-Location, Drei-Bedingungen-Regel, Audit-Bucket-Location, Semantik-Note (Alignment-Equality funktioniert nur für imperium/chaos weil dort alignment = tree-root; bei xenos-Splits wäre Parent-Chain nötig), Backfill-Path, Forward-Discipline. Frontmatter `updated` 2026-05-13 → 2026-05-16, sources um Brief 077 + die zwei neuen Scripts erweitert. Neuer Revisit-Trigger für Aeldari-Sub-Splits-Aktivierung. `brain/wiki/index.md`-Catalog-Row date + description-Addendum.
- **Commit 9 (`c0f70d6`)** — `scripts/db-counts-077.ts` (Pre/Post-Counts-Probe mit imperium|chaos-Breakdown), `scripts/smoke-slugs-077.ts` (alignment-aware Smoke-Probe für sechs Brief-Slugs), `scripts/test-resolver-coverage.ts` mit Skip-Simulation auf Faction-Axis (Total-Zeile reflektiert DB-Realität).

## Decisions I made

- **`factions.json`-JSON-Patch UND Helper-Extract gewählt.** Brief Constraint § 2 lässt beides offen, Cowork-Empfehlung war JSON-Patch. Plan-Agent in Phase 2 hat den Helper-Extract als „pays for itself the moment the alignment map is needed in a third place" gerechtfertigt. Habe beide gemacht: imperium-Row trägt explizit `"alignment": "imperium"` (single source of truth), UND `inferAlignmentFromTree`/`normalizeAlignment` sind nach `src/lib/seed/alignment.ts` migriert. Konsequenz: apply-override.ts, apply-override-dry.ts und test-resolver-coverage.ts können den selben `normalizeAlignment(row)`-Pfad nehmen, ohne die Funktion zu duplizieren oder direkt `row.alignment` zu vertrauen.

- **Pure Skip-Helper in `scripts/apply-override-skip.ts`.** Brief Constraint § 1 verlangt Skip-Logik in apply-Layer, nicht im Resolver-Modul. Die *reine Entscheidungsfunktion* habe ich aus apply-override.ts in eine eigene File extrahiert, damit test-resolver.ts (das den Production-DB-Client nicht laden soll) die Funktion direkt importieren kann. DI-Signatur (`resolveFaction` als Parameter) macht die Funktion außerdem ohne Resolver-Mocking testbar — siehe Plan-Agent-Empfehlung.

- **Skip-Bucket als Bare-String-Array.** Brief Example zeigt `["Imperium", "Chaos", ...]` (Strings). Existierende Buckets in `buildSurfaceFormsBlock` (`factionsUnresolved` etc.) tragen `{name, role}`-Objects, also wäre Konsistenz auch ein Argument für Object-Shape gewesen. Ich bin bei den Bare Strings geblieben, weil (a) Brief-Example-Treue, (b) die Skip-Surface-Form-Audit-Info hat schon im Bucket-Namen die Semantik („skipped wegen redundant", role spielt keine Rolle für die Audit-Geschichte).

- **Dry-Run + Coverage-Test mitziehen.** Brief Notes § 5 erlaubt explizit „accept the dip and note in report". Ich habe beide Scripts mit-update't (apply-override-dry.ts simuliert den Skip jetzt auch, test-resolver-coverage.ts wendet `decideFactionSkips` auf der Faction-Axis an). Begründung: die Scripts sind Documentation + Sanity-Check; wenn sie pre-skip-Zahlen zeigen, divergieren sie von der DB-Realität, was zukünftig verwirrt. Beide Scripts laufen post-077 mit Post-Skip-Totals; die ursprüngliche „Coverage-Ratio sinkt leicht"-Beobachtung aus dem Brief ist als neue Sidecar-Metrik (`165 grand-alignment surface forms suppressed`) im Output erhalten.

- **Smoke-Probe-Logik präzisiert.** Mein erster Versuch (`scripts/smoke-slugs-077.ts`) hat fest auf „keine imperium/chaos-Junction" geprüft und 4 von 6 Slugs als FAIL gemeldet. Tatsächlich ist die Brief-Acceptance „keine imperium/chaos-Junction, *sofern alignment-gleiche Sub-Tags da sind*". Probe re-schrieb auf alignment-aware: imperium muss skipped sein (alle 6 Bücher tragen imperium-aligned subs), chaos-Status hängt vom Override-Block ab. Endstand: 0 Skip-Rule-Violations, alle 6 Slugs grün, alle 6 tragen `factionsSkippedRedundant` im `book_details.notes`-Bucket (im häufigsten Fall: `"Imperium"`).

- **Branch-Strategie.** Pro Memory-Rule branch-per-session aus `main`. Aber 076 ist noch nicht in main gemerged (`origin/ingest/batches-016-020` ist 9 Commits ahead). 077 baut auf 076's Apply-Stand auf (Post-076 DB hat `work_factions=1185`, der Backfill setzt darauf an). Habe `session-077-grand-alignment-junction-hygiene` von 076-Tip abgezweigt; nach 076-Merge wird 077 rebased / mergedim normalen PR-Pfad. Maintainer-Hinweis im README-Active-Threads-Pointer: „Reihenfolge: 076 mergen → 077 fahren".

## Verification

- `npm run lint` — 0 errors, 1 pre-existing warning (`src/app/layout.tsx:44` `@next/next/no-page-custom-font`, unrelated zu 077).
- `npm run typecheck` — clean.
- `npm run test:resolver` — **122 passed, 0 failed** (war 116 prä-077).
- `npm run test:resolver-data` — alle 10 Cases ok.
- `npm run test:resolver-coverage` — Totals `factions=1020/1301 (post-Brief-077-skip, 165 grand-alignment surface forms suppressed)`, `locations=417/493`, `characters=633/811`. `archmagos.factions=2/4` neu unter Threshold-3 (war 3/4 prä-Skip) — Data-Finding, kein Failure per Script-Design.
- `npm run test:apply-override-dry` — `[apply-override-dry] ok`, post-skip Junction-Totals `work_factions: 1020, work_locations: 417, work_characters: 633`, neue Report-Zeile `skipped surface forms: 165 across 139 books, by name: Chaos x90, Imperium x75`.
- `npm run brain:lint -- --no-write` — 0 blocking, 6 warnings (alle pre-existing oder Size-Budget-Soft-Limit; `faction-policy.md` jetzt 108 body lines vs. 100 soft — tolerabel weil die neue Section notwendig ist).
- **Re-Apply backfill:** zwanzig sequenzielle `npm run db:apply-override -- --batch=ssot-w40k-NNN` für N ∈ 001..020. Alle 200 Bücher als `updates=10 total=10` durchgelaufen, keine Insertions, keine Fehler.
- **Counts-Tabelle (`scripts/db-counts-077.ts`):**

  | Metrik | Pre (post-076) | Post (post-077) | Delta |
  |---|---:|---:|---:|
  | `works` | 200 | 200 | 0 |
  | `work_factions` | 1185 | 1020 | **−165** |
  | `work_factions(imperium\|chaos)` | 214 | 49 | **−165** |
  | `work_factions(imperium)` | 81 | 6 | −75 |
  | `work_factions(chaos)` | 133 | 43 | −90 |
  | `work_locations` | 417 | 417 | 0 |
  | `work_characters` | 633 | 633 | 0 |
  | `work_collections` | 56 | 56 | 0 |

  Andere Axes invariant — erwartet, Brief 077 berührt nur die Faction-Axis. Residual `imperium=6` / `chaos=43` sind Bücher ohne alignment-gleiche Sub-Faction im Override (Erhaltungs-Pfad, gewollt).

- **Smoke (`scripts/smoke-slugs-077.ts`):** 0 Skip-Rule-Violations über alle 6 Slugs (`space-wolf`, `the-anarch`, `inquisitor-draco`, `the-green-tide`, `armageddon-saint`, `13th-legion`). Per-Slug:

  | Slug | imperium | chaos | factionsSkippedRedundant Bucket |
  |---|---|---|---|
  | space-wolf | skipped (space_wolves + adeptus_astartes) | preserved (keine chaos-aligned sub) | `["Imperium"]` |
  | the-anarch | skipped (astra_militarum + tanith_first + …) | skipped (blood_pact + sons_of_sek) | `["Chaos"]` |
  | inquisitor-draco | skipped (callidus_temple + inquisition + …) | preserved (Tyranids/Genestealer xenos, nicht chaos) | `["Imperium"]` |
  | the-green-tide | skipped (astra_militarum + catachan_jungle_fighters) | preserved (Orks xenos) | `["Imperium"]` |
  | armageddon-saint | skipped (astra_militarum + ecclesiarchy + last_chancers) | preserved (Orks xenos) | `["Imperium"]` |
  | 13th-legion | skipped (astra_militarum + last_chancers) | n/a (chaos nicht im Block) | `["Imperium"]` |

## Open issues / blockers

Keine. Brief vollständig abgearbeitet pro Acceptance-Bullets. Vor PR-Merge:

1. 076 muss zuerst auf `main` gemerged sein — 077-Branch sitzt auf 076-Tip.
2. Nach 077-Merge auf `main`: Wiki-Hygiene-Pass (post-076 + post-077), dann Loop-Re-Trigger `ssot-w40k-021..025` via `bash scripts/run-ssot-loop.sh 5`. Die Faction-Granularity-Discipline aus Brief 061 § Constraints ist dann automatisch im Trigger-Heredoc drin.

## For next session

- **Locations-Axis-Hygiene-Sister-Pass.** Im `test:resolver-coverage`-Output taucht `Imperium x20` als unresolved Location auf (Bücher taggen `Imperium` als Filter-Surface auch auf der Locations-Axis). Out-of-scope für 077 (faction-only), aber strukturell analog: Locations-Policy fehlt ein Skip-Pfad für „Imperium als Location" (= keine Location, eher politisches Konzept). Kleiner Sister-Brief zwischen Loop-Re-Trigger und 5er-Resolver-Pass denkbar.
- **HH-Domain Pre-Heresy `alpha_legion` Cabal-Twist.** Brief 077 ist W40K-only, aber wenn HH-Bücher dazu kommen, kann ein Book `["Alpha Legion", "Imperium"]` tragen (Pre-Heresy Loyalist-Cabal-Doppelnatur). AL hat aktuell `alignment=chaos` (post-070-Reparent), würde imperium also NICHT skippen — Verhalten OK fürs Apply, aber dokumentations-würdig wenn HH-Domain aktiv wird. Habe einen Hinweis-Bullet in `faction-policy.md` § Revisit-Trigger nicht hinzugefügt (HH ist Brief-070-Out-of-Scope-Position); kann bei nächstem HH-Domain-Brief addressiert werden.
- **`smoke-slugs-077.ts` als CI-Smoke?** Heute ein ad-hoc-Probe. Wenn der UI-Rollup-Brief kommt, lohnt es sich, einen smoke-detail-Page-Counts-Test gegen die DB als reguläres `test:smoke-db`-Script zu wiederholen, damit Regressionen sichtbar werden.
- **`test:resolver-coverage` Total-Line wäre lesbarer mit Skip-Breakdown.** Habe nur die kombinierte `(post-skip, N suppressed)`-Form gewählt. Ein Two-Line-Output (`pre-skip: 1185/1301 (91%)` + `post-skip: 1020/1301 (78%)`) wäre informativer, war mir aber zu viel Scope für eine begleitende Edit. Maintainer-Empfehlung optional.
- **`brain:lint` Size-Budget-Warning auf `faction-policy.md` (108/100).** Tolerable für jetzt, aber wenn das ADR irgendwann mehr Sektionen sammelt (Aeldari-Splits, HH-Edge-Case, ...), lohnt ein Refactor-Move von Operational-Details (Skip-List-Location, Backfill-Path) nach `brain/wiki/pipeline-state.md` / Workflow-Pages.

## References

- Brief 077: [`sessions/2026-05-16-077-arch-grand-alignment-junction-hygiene.md`](./2026-05-16-077-arch-grand-alignment-junction-hygiene.md)
- ADR: [`brain/wiki/decisions/faction-policy.md`](../brain/wiki/decisions/faction-policy.md) — neue Section „Grand-Alignment-Junction-Skip"
- Loop-Brief: [`sessions/2026-05-11-061-arch-ssot-loop.md`](./2026-05-11-061-arch-ssot-loop.md) — neuer Constraint-Block „Faction-Granularity-Discipline"
- Loop-Driver: [`scripts/run-ssot-loop.sh`](../scripts/run-ssot-loop.sh) — heredoc-Append
- Helper: [`scripts/apply-override-skip.ts`](../scripts/apply-override-skip.ts), [`src/lib/seed/alignment.ts`](../src/lib/seed/alignment.ts)
- Apply: [`scripts/apply-override.ts`](../scripts/apply-override.ts) — reorder + skip-context
- Tests: [`scripts/test-resolver.ts`](../scripts/test-resolver.ts), [`scripts/test-resolver-coverage.ts`](../scripts/test-resolver-coverage.ts), [`scripts/apply-override-dry.ts`](../scripts/apply-override-dry.ts)
- Smoke + counts: [`scripts/db-counts-077.ts`](../scripts/db-counts-077.ts), [`scripts/smoke-slugs-077.ts`](../scripts/smoke-slugs-077.ts)
