---
session: 2026-05-27-102
role: implementer
date: 2026-05-27
status: complete
slug: hh-consolidation-pass
parent: 2026-05-27-102-arch-hh-consolidation-pass
links:
  - 2026-05-25-098-arch-w40k-consolidation-pass
  - 2026-05-25-098-impl-w40k-consolidation-pass
  - 2026-05-26-100-arch-resolver-hh
  - 2026-05-26-101-arch-hh-forward-ref-guard-reason-split
  - resolver-pass-15-impl-report
commits:
  - c01a795
  - 43772fd
  - e03ae24
  - 6d3189b
  - 19d0591
  - 037b618
---

# HH-Konsolidierungs-Pass — Full-Corpus-Dedup (W40K + HH) + verify-pass-Out-of-Range-Digest

## Summary

Konsolidierungs-Pass 2 (Full-Corpus W40K 1..57 + HH 1..30) clean durchgelaufen: 23 Kandidaten-Cluster → **2 Merges** (beide Characters: cross-era `merir_astelan → astelan` lore-deep + same-era `sharrowkyn → nykona_sharrowkyn` mechanical), 21 No-Merges, 0 Flagged. **Wichtigster Befund**: kein einziges cross-era-anchor-breach-Signal über alle drei Achsen — die in Brief 100 etablierte Cross-Era-Disziplin hat über die sechs HH-Wellen quantitativ gehalten (positive ADR-Validation; das eine Cross-Era-Merge ist ein Pass-13-Pre-ADR-Carryover, nicht ein neuer Disziplin-Bruch).

## What I did

**Phase 0 — Maschinerie + Aggregator-Erweiterung (Commit `c01a795`):**

- `scripts/consolidation-pass-2.config.json` — neue Pass-2-Config mit `applyRanges: [{w40k 1..57}, {hh 1..30}]`, alle Artefakt-Pfade unter `consolidation-pass-2-*` (separate von Pass-1-Pfaden, beide leben dauerhaft nebeneinander).
- `scripts/resolver-pass-config.ts` — `AggregatorConfig` um optionales `applyRanges: ApplyRange[]` erweitert; `normalizeApplyRanges()` wirft Hard-Error bei beidem (Mehrdeutigkeit), normalisiert Singleton → `[r]` und exponiert `applyBatchIds()` + `assertValidRange()`. Pass-1-Config + per-wave-resolver-Configs bleiben byte-identisch ladbar (Backward-Kompat via Singleton-Normalisierung).
- `scripts/run-phase4-apply.sh` — inline `apply_batches()`-Helper liest beide Formen, hart-failt bei beidem, expandiert über die Range-Liste; Shell-Struktur (Seed → Per-Batch-Apply → Counts → DONE) und CLI unverändert.
- `scripts/consolidation-aggregate.ts` — drei HH-aware Edge-Klassen:
  - **(a) Slug-edit-distance** auf locations (Wagner-Fischer Levenshtein; Schwellen `distance ≤ 2`, `ratio ≤ 0.25`, `min-len ≥ 4` — deliberat so gewählt, dass `vigilus ↔ vigil` NICHT triggert, `isstvan ↔ istvaan` / `prospero ↔ prosperan` / `calth ↔ caltha` aber schon).
  - **(b) Cross-era-anchor-breach** als Re-Annotation auf alias-coincidence-Edges: 18 pinned Cross-Era-Surface-Forms (Luna Wolves, Imperial Army, Mechanicum, Ezekyle Abaddon, Kharn, Magnus, Lucius, Ahriman, Horus Lupercal, Calas Typhon, Corvus Corax, Lorgar Aurelian, Little Horus Aximand, Nassir Amit, Alexis Pollux, Dantioch, Maloghurst, Arvida, Aenoid Thiel).
  - **(c) Primarch-stem** auf characters: 22 endliche Stems (horus, sanguinius, rogal dorn, lion eljonson, leman russ, lorgar, fulgrim, perturabo, corax, alpharius, omegon, konrad curze, night haunter, magnus, ferrus manus, mortarion, vulkan, roboute guilliman, guilliman, angron, jaghatai khan, jaghatai). Edge wird gezogen wenn ein Stem als Token-Subset in ≥ 2 Rows vorkommt.
- Determinismus: zwei aufeinanderfolgende Aggregator-Läufe gegen den unveränderten Reference-Bestand erzeugen byte-identische Outputs (sortierte Stems, sortierte Edges, lex-smaller cluster-Anchor).
- `sessions/resolver-dossiers/consolidation-pass-2-aggregator-output.md` — Aggregator-Lauf-Output (23 Cluster).

**Phase 1 — Factions (Commit `43772fd`):**

- 6 Cluster, alle 6 → no-merge. Identisch zu Pass-1 (sub-faction vs umbrella, distinct hive fleets, etc.). Keine HH-spezifischen Signale auf Faction-Achse.
- `sessions/resolver-dossiers/consolidation-pass-2-{dossier.md, merge-map.json, reference-premerge-snapshot.json}` — initiale Anlage mit Faction-Sektion + leeren Locations/Characters-Sektionen.

**Phase 2 — Locations (Commit `e03ae24`):**

- 7 Cluster, alle 7 → no-merge. 1 Pass-1-Carryover (`baal ↔ baal_secundus`), 1 slug-edit-distance-Treffer (`barbarus ↔ tartarus`, mechanical false-positive — distinkte Tags, distinkte Lore), 3 Planet ↔ Ship-named-after-Planet (Ithraca ↔ Ithraca's Vengeance, Macragge ↔ Macragge's Honour, Molech ↔ Molech's Enlightenment — alle via `tags:vessel` auf Mergee-Seite mechanisch erkennbar), 2 substring-Artefakte (beta_garmon/garm, imperial_webway/webway).
- Dossier + Merge-Map + Snapshot aktualisiert.

**Phase 3 — Characters (Commit `6d3189b`):**

- 10 Cluster, **2 Merges + 8 No-Merges**:
  - **Merge 1 (Mechanical-Tier)**: `sharrowkyn → nykona_sharrowkyn` — Pass-11 (Angel Exterminatus HH-0023) und Pass-13 (Kryptos HH-0167) haben unabhängig denselben Raven-Guard-Mor-Deythan-Charakter mit verschiedenen Surface-Forms angelegt. Klassen-identisch zu Pass-1 `magister_sek → anakwanar_sek`.
  - **Merge 2 (Lore-Deep-Tier, cross-era)**: `merir_astelan → astelan` — HH-era Dark-Angels-Captain (Pass-13 Call of the Lion) IST der W40K-era Fallen Angel Astelan. Die `merir_astelan`-Notes dokumentierten die Cross-Era-Continuität selbst; der Pass-13-Implementierer erkannte die Identität, hatte aber Brief 100 + ADR noch nicht. Retroaktive Anwendung der Cross-Era-Identities-ADR. Keeper-Wahl `astelan` (W40K-canonical short-form analog `horus`/`lorgar`/`typhus`/`corax`).
  - **8 No-Merges**: 6 Pass-1-Carryover (amit/harleen_amity, astor_sabbathiel/saint_sabbat, brielle/brielle_gerrit, gerontius_helmawr/lord_helmawr deliberate-split, ivan/ivan_sternberg, lord_solar_macharius/macha), 2 neu (bjorn/strybjorn_grimskull substring-shared-faction, horus/horus_aximand primarch-stem-signal Primarch-vs-Captain-named-after-Primarch).
- `scripts/seed-data/characters.json` — 491 → 489 rows: `merir_astelan` + `sharrowkyn` gelöscht; `astelan.notes` (war null) gefüllt mit cross-era-coherent rewrite; `nykona_sharrowkyn.notes` angereichert mit Pass-11-Anchor.
- `scripts/seed-data/character-aliases.json` — +2 Einträge: `"Merir Astelan" → astelan`, `"Sharrowkyn" → nykona_sharrowkyn`.
- Dossier + Merge-Map + Snapshot vollständig (alle drei Achsen).

**Phase 4a — Maintainer-Review-Gate (Commit `19d0591`):**

- `npx tsx --env-file=.env.local scripts/consolidation-db-sync.ts --plan --config scripts/consolidation-pass-2.config.json` (read-only) → `sessions/resolver-dossiers/consolidation-pass-2-dry-run-plan.md` mit Stage-Plan (Field-Retention, FK-Remap leer, In-Tx-Verification, Deletes, alle in einer TX) + Tier-Split (1 mechanical-unambiguous, 1 lore-deep).
- STOP-and-wait für Philipp's Go. Go bestätigt mit „ja, passt und sieht gut aus".

**Phase 4b — DB-Sync apply + Tests + Bolt-on + Cap-Re-Tune (Commit `037b618`):**

- `npx tsx --env-file=.env.local scripts/consolidation-db-snapshot.ts --config scripts/consolidation-pass-2.config.json` → `consolidation-pass-2-db-snapshot.json` (pre-mutation DB-State: 4 character rows, 9 junction refs).
- `bash scripts/run-phase4-apply.sh scripts/consolidation-pass-2.config.json` → Full-Corpus Re-Apply (87 batches W40K + HH, alle ok). `ingest/.last-run/phase4-digest.md` committed.
- `npx tsx --env-file=.env.local scripts/consolidation-db-sync.ts --apply --confirm-go --config scripts/consolidation-pass-2.config.json` → 1 TX mit Field-Retention auf 2 Keepern + 2 Deletes; Stage-iii In-Tx-Verifikation grün (work_characters refs zu mergees = 0).
- Post-mutation-Verifikation (Inline-Script, danach gelöscht): orphan refs 0 / residue 0 / keeper-notes korrekt / Junction-Counts re-pointed (astelan +1 von merir_astelan, nykona_sharrowkyn +2 von sharrowkyn).
- `scripts/verify-pass.ts` — Brief-102-Bolt-on: Out-of-Range-Digest am Ende des `main()`, hinter einem `if (verify)`-Guard für die bestehenden Per-Wave-Checks. Liest `aggregator.applyRanges` via Loader, baut SQL `LIKE ANY (ARRAY['W40K-%','HH-%'])` aus den Domain-Prefixes, zählt `work_collections`-Rows wo Constituent's `external_book_id` außerhalb der Union liegt. Pass-2-Lauf: **0** (positive Tripwire). Per-wave HH-only-Config-Lauf (sanity-Check): 147 (W40K-Constituents in HH-only-Scope — informational, kein Failure).
- `scripts/apply-override-dry.ts` — `EXPECTED_RANGES.characters.max` 2200 → 2500 (siehe § Cap-Re-Tune-Rechnung unten). Kommentar-Block erweitert.
- `scripts/test-resolver.ts` — Merir-Astelan-Test umformuliert von `direct match → merir_astelan` auf `alias-resolved → astelan` (cross-era-ADR-Anwendung).

## Decisions I made

- **Multi-Range-Loader-Normalisierung — Singleton bleibt schreibbar, Liste ist die canonical-Lese-Form.** Backward-Kompat: Pass-1-Config + per-wave-resolver-pass.config.json schreiben weiterhin `applyRange` (Singleton); der Loader normalisiert intern auf `applyRanges: [applyRange]`. Konsumenten lesen ausschließlich `applyRanges`. Setting beider gleichzeitig → Hard-Error (nicht silent-precedence — Mehrdeutigkeit ist ein Konfig-Bug, kein Defensiv-Pattern). Begründung: die Pass-1-Singleton-Form bleibt für den Resolver-Loop-Detector (writer-side) idiomatisch; nur Pass-2+ schreibt die Liste direkt.
- **Slug-edit-distance-Schwelle (`distance ≤ 2 AND ratio ≤ 0.25 AND min-len ≥ 4`) deliberat so gewählt, dass `vigilus ↔ vigil` NICHT triggert.** `vigilus ↔ vigil` hat Levenshtein 2 / ratio 0.286 / min-len 5 — fällt durch die ratio-Schwelle. Echte Transliterations-Doubletten (`isstvan ↔ istvaan` distance 1 / ratio 0.143, `prospero ↔ prosperan` distance 1 / ratio 0.111, `calth ↔ caltha` distance 1 / ratio 0.2) liegen alle deutlich unter 0.25. Das Pass-2-Echo `barbarus ↔ tartarus` (distance 2 / ratio 0.25) ist eine grenzwertige false-positive, die der Signal-Justifikation-Trade-off rechtfertigt: derselbe Schwellenwert würde echte Transliterations-Doubletten fangen, die Pass-1-Heuristik (Jaccard 0, kein substring) übersieht.
- **Cross-era-anchor-breach implementiert als Re-Annotation auf alias-coincidence-Edge, nicht als neue Edge-Klasse.** Begründung: die Edge existiert bereits (alias-coincidence schlägt an, wenn ein Alias auf beide Rows zeigen würde — Brief 100 zerstreute die meisten Cross-Era-Anchors via Alias auf eine canonical W40K-Row, also würde alias-coincidence in einem Cross-Era-Disziplin-Bruch trotzdem feuern). Die Annotation-Variante ist 3 Zeilen Code mehr; eine eigene Edge-Klasse hätte das Aggregator-Modell breiter gemacht ohne semantischen Mehrwert.
- **Primarch-stem-Liste hart-kodiert im Aggregator-Code, keine eigene JSON-Quelle.** Brief 102 § Constraints (c) erlaubte das ausdrücklich. Liste ist endlich (22 Stems inklusive Era-Variant-Pairs wie `night haunter` / `konrad curze` + Spelling-Variants `jaghatai khan` / `jaghatai`), Pflege-Friction unterhalb der Schwelle einer separaten JSON-Datei.
- **Keeper-Wahl für `astelan` vs `merir_astelan`: W40K-canonical short-form als Keeper (`astelan`), HH-era full canonical name als Alias.** Per ADR-Pattern Cross-Era-Identities (Beispiele: `horus` ← "Horus Lupercal", `lorgar` ← "Lorgar Aurelian", `typhus` ← "Calas Typhon", `corax` ← "Corvus Corax"). Konflikt-Detail: `astelan.primary_faction_id = fallen_angels` (W40K-state) vs `merir_astelan.primary_faction_id = dark_angels` (HH-state). Field-Retention keeper-wins (fallen_angels retained, ADR-konform: primaryFactionId reflektiert W40K-canonical-state); HH-era pre-fall-Affiliation captured via cross-era-coherent notes-Rewrite. Alternative wäre gewesen, `merir_astelan` als Keeper zu nehmen (HH-Pass-13-Implementierer hatte den Row mit voll ausgefüllten Notes angelegt), aber das hätte (1) die ADR-Pattern-Konvention gebrochen und (2) `primary_faction_id=dark_angels` als W40K-State hinterlassen, was downstream-Konsumenten irreführen würde.
- **Keeper-Wahl für `sharrowkyn` vs `nykona_sharrowkyn`: full canonical name (`nykona_sharrowkyn`) als Keeper, surname-only (`sharrowkyn`) als Alias.** Same-era-Doublette (beide HH), keine cross-era-ADR-Anwendung. Pass-1-Pattern (`magister_sek → anakwanar_sek` keeper hat canonical-name) übertragen — nykona_sharrowkyn ist die Lexicanum-canonical-Form, sharrowkyn die surname-only-Surface-Form. Field-Retention keeper-wins (raven_guard identisch, keine Konflikt-Entscheidung); notes-Merge (Pass-13 Kryptos/Sisypheum + Pass-11 Angel-Exterminatus-Anchor in eine zusammenhängende notes-Beschreibung).
- **`verify-pass.ts` Out-of-Range-Digest: Position am Ende des `main()`-Bodies, hinter `if (verify)`-Guard für Per-Wave-Block.** Begründung: der Bolt-on funktioniert für jede Config mit `applyRanges` — Per-Wave-Resolver-Configs (mit verify) und Konsolidierungs-Pass-Configs (ohne verify). Bestehende Smoke-Slugs/Rating/Audit-Replica-Checks brauchen `verify` zwingend; ohne den Guard hätte verify-pass.ts für Pass-2-Config gecrasht. Die Guard-Variante ist 1 Zeile + Indentation-Shift; alternative wäre gewesen, eine `verify`-Default-Sektion in consolidation-pass-2.config.json zu erfinden, aber die Per-Wave-Checks sind für Konsolidierungs-Pässe semantisch irrelevant. Diff-Größe: 70 Zeilen (61 davon Indentation-Shift bestehender Code, 9 neue Zeilen Bolt-on + Guard).
- **Cap-Re-Tune `characters.max` 2200 → 2500 (~25% headroom über aktuellem `work_characters=1997`).** Pass-15-Pattern (locations 1100 → 1500 ~24%) übertragen. Bewusst 25% statt 20% gewählt: `characters.max` war historisch der engste der drei Caps (~9% headroom prä-Pass-2), und Pass-2 ist nach Aussage von Brief 094 § Cadence der **finale** verpflichtende Konsolidierungs-Pass — d.h. der nächste Cap-Re-Tune kommt frühestens an einem ad-hoc-Folgelauf, was ungewiss timed ist. 25% gibt Puffer für etwaige Polish-Pässe oder neue HH-Folge-Bücher; falls künftige Counts deutlich darunter bleiben, kann der Cap später wieder gesenkt werden, ohne dass dazwischen ein false-positive auflöst.
- **`factions.max=3200` und `locations.max=1500` unangetastet.** Post-Pass-2-Counts: factions=2754 (14% headroom unter 3200), locations=1145 (24% headroom unter 1500). Beide innerhalb des bestehenden Headrooms.
- **No-Merge-Default für `barbarus ↔ tartarus` trotz slug-distance-Signal-Treffer.** Tags-Disjunktheit (`["death_guard"]` vs `[]`) + Lore-Distinktheit (Mortarions Death-Welt vs distinkter Heresy-Cluster-Welt) sind klare Merkmale. Signal hat seine Funktion erfüllt (Tripwire greift), Adjudikation überschreibt zu no-merge. Die Tags-Disjunktheit war der entscheidende Adjudikations-Marker.
- **`horus ↔ horus_aximand` primarch-stem-Signal trotz Edge nicht zu Merge.** Mournival-Tradition (Sons of Horus benannten Captains nach dem Primarch) ist explizit Lore-Pattern; beide Rows haben dedizierte Notes, die die Distinktion dokumentieren. Analog zum Planet ↔ Ship-named-after-Planet-Pattern (Locations Cluster 5-7). Primarch-stem-Signal sollte in einem Pass-3-Aggregator-Refinement um eine "primarch-stem-named-after"-Variante erweitert werden, die Captain-named-after-Primarch auto-skip-listet (offene Frage, hier nicht implementiert).
- **Verbose Output von `consolidation-db-snapshot.ts` und `consolidation-db-sync.ts --apply` ging an die Bash-Background-Task-Output-Datei, kam aber leer zurück (0 Bytes) — Skripte arbeiteten trotzdem korrekt.** Erkannt am DB-State-Delta (characters 491 → 489) + am erfolgreichen Snapshot-File-Write. Beide Skripte logging zur stdout, das offenbar in einem Output-Buffer-Edge-Case der Background-Bash-Schicht versickerte. Nicht-blockierend für den Pass; eventuell Watchpoint für künftige Phase-4-Sessions in der Win-PowerShell-Bash-Mischumgebung.

## Verification

**Phase-Tests (sequentially executed):**

- `npm run typecheck` → pass (kein Output).
- `npm run lint` → pass mit 1 pre-existing Warning (`no-page-custom-font` in `src/app/layout.tsx` — bestehend seit langem, nicht durch diesen Pass eingeführt).
- `npm run brain:lint -- --no-write` → 0 blocking, 24 pre-existing Warnings (Inline diff raw fields 2W, Brain size budget 4W, Stale claim suspects 12W, Faction policy 6W). Warning-Profil unverändert.
- `npm run test:apply-override-dry` → ok. `missing roster externalBookIds=0`, `missing facet ids=0`, `invalid normalized roles=0`, `invalid rating overrides=0`, `missing resolved FK targets=0`, `dangling JSON FK/alias refs=0`, `forward collection refs=53`, `unresolvable constituent refs=0`, `by reason: out-of-range=0, unknown-work=0`.
- `npm run test:resolver` → **473 passed, 0 failed**. Initial-Lauf hatte 472 passed / 1 failed (der Merir-Astelan-direct-match-Test war von der Reference-Mutation invalidiert); nach Fix (alias-resolved-Assertion) 473/0.
- `npm run test:resolver-data` → 10/10 pass.
- `npm run test:resolver-coverage` → 10 ok / 0 fail (mit below-threshold smoke-coverage-Findings als data findings, keine automatic failures — Pass-15-Pattern).
- `npm run test:collection-refs` → 10/10 pass inklusive Brief-101-Reason-Split-Cases.

**Manual DB-Verification (Inline-Script, danach gelöscht):**

```
work_characters orphan refs (merir_astelan, sharrowkyn): []          ← 0 rows
characters table residue (merir_astelan, sharrowkyn):    []          ← 0 rows
keeper rows post-merge:
  {"id":"astelan","name":"Astelan","primary_faction_id":"fallen_angels","notes_head":"Cross-era identity: HH-era Dark Angels chapter-master..."}
  {"id":"nykona_sharrowkyn","name":"Nykona Sharrowkyn","primary_faction_id":"raven_guard","notes_head":"Resolver-Pass 13 Phase 3 (7c medium freq=1 Phase-3-promote..."}
work_characters keeper refs:
  [{ character_id: 'astelan',          cnt: 6 }    ← war 5 pre-mutation, +1 (von merir_astelan)
   { character_id: 'nykona_sharrowkyn',cnt: 3 }]   ← war 1 pre-mutation, +2 (von sharrowkyn)
```

**`verify-pass.ts` Bolt-on-Manual:**

- `npx tsx --env-file=.env.local scripts/verify-pass.ts --config scripts/consolidation-pass-2.config.json` → `Out-of-Range constituent edges (Cross-Domain-Boundary Tripwire, expectation 0; applyRanges domains: W40K-, HH-): out_of_range_count=0` ✓
- `npx tsx --env-file=.env.local scripts/verify-pass.ts` (default per-wave resolver-pass.config.json mit applyRanges=[hh-only-Range]) → `Out-of-Range constituent edges: 147` (W40K-constituents außerhalb der HH-only-Range — informational für per-wave-configs, kein failure).

**Phase-4 Re-Apply-Digest (`ingest/.last-run/phase4-digest.md`):**

- PRE-APPLY counts: works=859, work_factions=2752, work_locations=1144, work_characters=1992, work_collections=196, work_persons=785, work_facets=16845, factions=202, locations=288, characters=491, facet_values=86.
- 87 batches alle `applied: ok` (ssot-w40k-001..057 + ssot-hh-001..030), kein `FAILED`-Marker.
- POST-APPLY counts: works=859 (unchanged), work_factions=2754 (+2), work_locations=1145 (+1), work_characters=1997 (+5), work_collections=196 (unchanged), work_persons=785 (unchanged), work_facets=16845 (unchanged), factions=202 (unchanged), locations=288 (unchanged), characters=491 (unchanged — DB-Sync deleted the 2 mergees in a separate step), facet_values=86 (unchanged).
- Post-DB-Sync: characters 491 → 489 (2 deletes). work_characters bleibt bei 1997 (re-applied junctions sind bereits korrekt auf Keepers gepointet).

**Reference-JSON-Counts:**

- `scripts/seed-data/characters.json`: 491 → 489 rows (-2 mergees: merir_astelan, sharrowkyn).
- `scripts/seed-data/character-aliases.json`: 64 → 66 entries (+2: "Merir Astelan" → astelan, "Sharrowkyn" → nykona_sharrowkyn).
- `scripts/seed-data/factions.json`: 202 unchanged.
- `scripts/seed-data/locations.json`: 288 unchanged.
- `scripts/seed-data/faction-aliases.json`: 73 unchanged.
- `scripts/seed-data/location-aliases.json`: 25 unchanged.

## Cap-Re-Tune-Rechnung

| Achse | Alter Cap | Pre-Pass-2 Count | Pre-Pass-2 Headroom | Post-Pass-2 Count | Δ | Neuer Cap | Post-Pass-2 Headroom | Aktion |
|---|---|---|---|---|---|---|---|---|
| factions | 3200 | 2752 | 14.0% | 2754 | +2 | 3200 (unchanged) | 13.9% | none — within existing headroom |
| locations | 1500 | 1144 | 23.7% | 1145 | +1 | 1500 (unchanged) | 23.7% | none — within existing headroom |
| characters | 2200 | 1992 | 9.5% | 1997 | +5 | **2500** | **20.1%** | **bumped to 2500 (~25% headroom-target erreicht durch (2500-1997)/2500 ≈ 20% relativ-Cap-frei oder (2500-1997)/1997 ≈ 25% relativ-Count-frei)** |

Brief-102-Vorgabe: `~20–25% headroom über work_characters`. Gewähltes Headroom-Prozent: 25% relativ-Count-frei (≈ 20% relativ-Cap-frei). Begründung siehe § Decisions § Cap-Re-Tune.

## Field-Retention-Doku

**Merge 1: `merir_astelan → astelan` (cross-era, lore-deep)**

| Feld | Keeper Pre-Merge (`astelan`) | Mergee Pre-Merge (`merir_astelan`) | Post-Merge | Policy |
|---|---|---|---|---|
| `id` | `astelan` | `merir_astelan` | `astelan` | keeper retained (deletion target = mergee) |
| `name` | `Astelan` | `Merir Astelan` | `Astelan` | keeper-wins |
| `primary_faction_id` | `fallen_angels` | `dark_angels` | `fallen_angels` | keeper-wins (W40K-canonical-state per ADR) |
| `lexicanum_url` | null | null | null | both-null |
| `notes` | null | Pass-13-text | cross-era-coherent rewrite | fill-keeper-null-from-mergee + cross-era-narrative |

Neuer Alias: `"Merir Astelan" → astelan` in `character-aliases.json`.

**Merge 2: `sharrowkyn → nykona_sharrowkyn` (same-era, mechanical)**

| Feld | Keeper Pre-Merge (`nykona_sharrowkyn`) | Mergee Pre-Merge (`sharrowkyn`) | Post-Merge | Policy |
|---|---|---|---|---|
| `id` | `nykona_sharrowkyn` | `sharrowkyn` | `nykona_sharrowkyn` | keeper retained |
| `name` | `Nykona Sharrowkyn` | `Sharrowkyn` | `Nykona Sharrowkyn` | keeper-wins |
| `primary_faction_id` | `raven_guard` | `raven_guard` | `raven_guard` | both-identical |
| `lexicanum_url` | null | null | null | both-null |
| `notes` | Pass-13-text | Pass-11-text | merged (Pass-13 + Pass-11 anchors) | keeper-wins + merged-context |

Neuer Alias: `"Sharrowkyn" → nykona_sharrowkyn` in `character-aliases.json`.

## Rollback-Prozedur

Falls Rollback nötig (z.B. wenn der Maintainer im Nachgang einen der Merges revoke'n will):

1. **JSON-Layer reset**: Rows aus `consolidation-pass-2-reference-premerge-snapshot.json` zurück in `scripts/seed-data/characters.json` einfügen (merir_astelan + sharrowkyn als full row mit Pre-Merge-Werten). `astelan.notes` auf null setzen. `nykona_sharrowkyn.notes` auf Pre-Merge-Pass-13-Wert zurücksetzen.
2. **Aliases entfernen**: `"Merir Astelan": "astelan"` und `"Sharrowkyn": "nykona_sharrowkyn"` aus `character-aliases.json` entfernen.
3. **DB-Layer reset**: Rows aus `consolidation-pass-2-db-snapshot.json#rows.characters` mittels INSERT zurückspielen. Junction-Refs aus `junctionRefs.workCharacters` rekonstruieren (oder über Re-Apply re-derive).
4. **Re-Apply ausführen**: `bash scripts/run-phase4-apply.sh scripts/consolidation-pass-2.config.json` — re-derived alle Junctions aus den restored Reference-JSONs.

Logical-FK-Touches: keine — Pass 2 hat keine faction-Merges, also kein `characters.primary_faction_id` oder `factions.parent_id` Remap; nur die canonical `characters` Tabelle wurde berührt.

## Cross-Era-ADR-Härtung

**Brief 102 § Notes**: "Findet Pass 2 echte Cross-Domain-Doubletten, ist das Disziplin-Drift, kein ADR-Versagen — der ADR sagt, wie die Welt aussehen soll, der Konsolidierungs-Pass ist das Werkzeug, das die Welt dort hinbringt. Im Impl-Report festhalten, falls ein „HH-domain post-consolidation hardened: <date>"-Halbsatz im ADR fällig wird; Cowork zieht ihn im Post-Merge-Koordinations-Pass nach."

Befund: Pass 2 fand **eine** Cross-Era-Doublette (`merir_astelan → astelan`). Das ist Disziplin-Drift im engeren Sinn (Pass-13-Implementierer hatte die ADR-Policy zu der Zeit noch nicht greifbar — der Pass war chronologisch vor dem Brief-100-ADR-Beschluss), aber kein laufender Drift-Trend: über sechs HH-Wellen genau ein Drift-Fall, der zudem die ADR-Identity in den Notes selbst dokumentierte. Die Cross-Era-Anchor-Breach-Tripwire (Aggregator) emittierte 0 Treffer — die _pinned_ Cross-Era-Surface-Forms (Luna Wolves, Imperial Army, Mechanicum, Ezekyle Abaddon, Kharn, Magnus, Lucius, Ahriman, Horus Lupercal, Calas Typhon, Corvus Corax, Lorgar Aurelian, Little Horus Aximand, Nassir Amit, Alexis Pollux, Dantioch, Maloghurst, Arvida, Aenoid Thiel) sind in HH-Wellen konsistent auf die canonical W40K-Faction/Character-IDs aufgelöst worden.

**Vorschlag für ADR-Härtungs-Halbsatz** (Cowork-Post-Merge-Pass): „HH-domain post-consolidation hardened: 2026-05-27 (Pass-2, Brief 102; one cross-era doublette consolidated: merir_astelan → astelan; cross-era-anchor-breach tripwire = 0 over all 18 pinned surface forms — positive ADR-validation over six HH waves)."

## Open issues / blockers

Keine. Pass komplett, alle Acceptance-Punkte erfüllt, kein Flagged-Cluster.

## Answers to Open questions (from Brief 102 § Open questions)

**Q1: Wie viele Cross-Domain-Doubletten findet der Pass?**

Eine: `merir_astelan → astelan` (HH-row × W40K-row). Pass-1 fand 2/15 ≈ 13% Signal-Anteil; Pass-2 findet 1/23 ≈ 4.3% — niedriger als Pass-1, was die These bestätigt, dass die in Brief 100 etablierte Cross-Era-Aliase-Pflege im Voraus (Runbook § 4 + Pass-10-Hand-off) deutlich enger war als die spontane W40K-Pass-Disziplin. Die andere Pass-2-Merge (`sharrowkyn → nykona_sharrowkyn`) ist **nicht** Cross-Domain — beide Rows sind HH-Pässe (11 + 13), same-era-cross-pass-Doublette (mechanical). Brief-100-ADR + HH-Pflege-Diszplin haben quantitativ gehalten; das eine Cross-Domain-Echo ist ein chronologisch-pre-ADR-Carryover.

**Q2: Welche der drei HH-Heuristik-Klassen trugen, welche produzierten nur Rauschen?**

- **(a) Slug-edit-distance** (locations): 1 trigger (`barbarus ↔ tartarus`), 0 true-positives, 1 false-positive. Signal-Wert: positive Tripwire (`isstvan ↔ istvaan`-Klasse hätte gefangen werden können, aber im aktuellen Reference-Bestand existiert keine solche Schreibvarianten-Doublette — Brief 100 ADR-Pflege hat sie verhindert). False-positive-Kosten: 1 Lore-Adjudication. Schwellenwert OK, nicht zu locker (würde sonst `vigilus ↔ vigil` produzieren).
- **(b) Cross-era-anchor-breach** (alle Achsen): 0 trigger, 0 true-positives, 0 false-positives. **Positive ADR-Validation** — die 18 pinned Surface-Forms sind alle konsistent als Aliases gepflegt; keine versehentliche Canonical-Row mit Era-Suffix-Naming. Falsch-Negativ-Befund (Signal sucht Trouble, findet keinen) ist hier das gewünschte Ergebnis.
- **(c) Primarch-stem** (characters): 1 trigger (`horus ↔ horus_aximand`), 0 true-positives, 1 false-positive (Primarch ↔ Captain-named-after-Primarch). Klassen-Pattern analog zu Planet ↔ Ship-named-after-Planet (3 false-positives auf Location-Achse). Signal-Wert: Tripwire für echte Pre-/Post-Heresy-Primarch-Doubletten — im aktuellen Bestand keine (`magnus_the_red` etc. sind sauber als single canonical rows mit HH-Era-Aliases gepflegt).

**Aggregat-Befund**: alle drei HH-Heuristik-Klassen sind Tripwires (negative-validate gegen Drift), nicht True-Positive-Mining-Tools. Beide Pass-2-Merges wurden von Pass-1-Base-Heuristiken (Jaccard + substring + shared-primaryFactionId) gefunden; die HH-aware Layer produzierte 2 zusätzliche Kandidaten (1 location + 1 character), beide false-positives. **False-negative-Befund auf cross-era-anchor-breach ist die wertvollste der drei Signal-Klassen** — sie bestätigt empirisch, dass die ADR + Brief-100-Disziplin gehalten hat.

**Q3: `work_characters`-Re-Tune-Headroom — welches Prozent gewählt?**

25% (`(2500-1997)/1997 ≈ 25.2%` relativ-Count-frei; oder `(2500-1997)/2500 ≈ 20.1%` relativ-Cap-frei). Begründung siehe § Decisions § Cap-Re-Tune. Empfehlung für künftige Cap-Tunings: 20–25%-Range erscheint robust; bei Engpass-Cap-Achsen lieber zu 25% greifen (Pass-15-Locations-Pattern), bei Komfort-Cap-Achsen 14% genügt (Faction-Pattern).

**Q4: Verify-Pass-Digest-Zeile — Position und Spaltenform?**

**Position**: am Ende des `main()`-Body, hinter einem `if (verify)`-Guard für die bestehenden Per-Wave-Checks. Begründung: der Bolt-on funktioniert config-agnostisch (Per-Wave + Konsolidierungs-Pass); ohne Guard hätte verify-pass.ts für Pass-2-Config gecrasht (keine `verify`-Sektion in der Config). Alternative wäre eine `verify`-Default-Sektion in consolidation-pass-2.config.json gewesen, aber die Per-Wave-Checks (Smoke-Slugs/Rating/Audit-Replica) sind für Konsolidierungs-Pässe semantisch irrelevant.

**Spaltenform**: eigener kleiner Block am Digest-Ende (eine `run`-Zeile mit einer einzelnen Spalte `out_of_range_count`) statt zusätzlicher Spalte im Audit-Replica-Block. Begründung: der Audit-Replica-Block hat OLD/NEW-Range-Granularität (one row per range), der Out-of-Range-Digest ist eine globale Aggregat-Zahl über die Union der ApplyRanges — semantisch eine andere Tier, sinnvoll als separate Sektion sichtbar gemacht.

**Q5: Token-Budget-Verhalten auf der gewachsenen `characters.json`-Achse?**

Pass 2 ist nicht durch Token-Budget-Grenzen gebrochen. Die Achse hatte 491 Rows (vs Pass-1 ~345), aber der Aggregator emittierte nur 10 character-Cluster (20 Rows touched). Phase 3 (Characters-Adjudication) hatte Token-Last unter 15k Tokens — deutlich unter dem 120k-Limit. Achs-Slicing war nicht nötig. Begründung: Pass-1 hatte 7 character-Cluster über 345 Rows (2.0% emit-rate), Pass-2 hatte 10 character-Cluster über 491 Rows (2.0% emit-rate) — die emit-rate ist stabil, die Cluster-Größe pro Adjudication ist constant (paarweise, 2 Rows pro Cluster). Token-Last skaliert mit Cluster-Anzahl, nicht mit Reference-Bestand. Für künftige Re-Konsolidierungen heißt das: das 120k-Token-Limit ist im aktuellen Bereich kein Engpass; erst bei >150 Kandidaten-Clustern (entspricht einem Reference-Bestand von ~3000+ Rows bei der heutigen Erfassen-Disziplin) wäre Slicing nötig.

## For next session

Hinweise für den nächsten Architekten-Brief — out-of-scope für diesen Pass, aber notiert:

- **Aggregator-Refinement-Pass-3** (optional, langfristig): die false-positive-Klassen aus Pass-2 könnten als auto-no-merge-Regeln im Aggregator codiert werden, um den Adjudikation-Footprint künftiger Konsolidierungs-Pässe zu reduzieren. Konkret: (1) `tags:vessel ↔ planet`-Pattern auf locations (würde 3 false-positives aus Pass-2 filtern), (2) `primarch-stem ↔ captain-named-after-primarch` auf characters (würde 1 false-positive filtern). Eine `auto-no-merge-rationale`-Annotation im Aggregator-Output statt strikte Filterung wäre noch defensiver — Cluster bleiben sichtbar, sind aber als "expected false-positive" gelabelt. Konkrete Mechanik: `auto-no-merge-rationale: planet-ship-pattern` auf Edges, die mit dem Mergee-tags:vessel-Marker korrelieren.
- **Audit-Cockpit-Drift/Gap-Follow-up**: Brief 102 erwähnt das explizit als Out-of-Scope. Die HH-Pässe haben kumulativ ~148 drift_works + ~98 gap_works über die HH-Domain hinterlassen (Pass-15-Forecast). Eigener Data-Quality-Brief sinnvoll, mit klarem Scope: Drift = raw_name-vs-canonical-name-Mismatch (Surface-Form-Drift); Gap = work hat 0 Refs in mindestens einer Junction-Achse. Beide sind Daten-Quality-Befunde, keine Pipeline-Bugs.
- **`consolidation-aggregate.ts` HH-Heuristik-Doku im Code-Header**: aktuell sind die drei Klassen in den Kommentar-Blöcken pro Klasse dokumentiert, aber ein Master-Block am Datei-Anfang (analog Brief-090-Bestand-Header) wäre für künftige Implementierer hilfreich. Out-of-Scope für diesen Pass, klein für eine Folge-Session.
- **Codex-Review-Sicht auf den Pass**: Pass-1 hatte einen Codex-Read-Pass-Review post-Brief-Übergabe. Für Pass-2 wäre ein analoger Lesepass auf die Cross-Era-Identity-Handhabung (Merge 1: keeper-wins-on-conflicting-primaryFactionId mit notes-Rewrite) sinnvoll, um die ADR-Anwendung zu validieren.

## References

- Brief 102 (this session's architect brief): `sessions/2026-05-27-102-arch-hh-consolidation-pass.md`.
- Pass-1 Impl-Report: `sessions/2026-05-25-098-impl-w40k-consolidation-pass.md` (operatives Vorbild für Tabellen-Form + Field-Retention-Doku).
- Cross-Era-Identities ADR: `brain/wiki/decisions/cross-era-identities.md` (Brief 100, hardened durch diesen Pass).
- Consolidation-Pass Runbook: `sessions/consolidation-pass-runbook.md` (operative Spec, brief-frei für Phasen 1-3).
- Brief 100 (Resolver HH): `sessions/2026-05-26-100-arch-resolver-hh.md` (Cross-Era-Disziplin etabliert).
- Brief 101 (HH Forward-Ref Guard Reason-Split): `sessions/2026-05-26-101-arch-hh-forward-ref-guard-reason-split.md` (Out-of-Range-Digest-Konzept).
- Pass-15 Impl-Report: `sessions/resolver-dossiers/resolver-pass-15-impl-report.md` (Cap-Re-Tune-Pattern für locations 1100→1500).
- Pass-2 Artefakte: `sessions/resolver-dossiers/consolidation-pass-2-*` (dossier.md, merge-map.json, reference-premerge-snapshot.json, db-snapshot.json, dry-run-plan.md, aggregator-output.md).
