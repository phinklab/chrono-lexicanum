---
session: 2026-05-16-076
role: implementer
date: 2026-05-16
status: complete
slug: resolver-batch-4-axis-sliced
parent: 2026-05-16-076-arch-resolver-batch-4-axis-sliced
links:
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-11-061-arch-ssot-loop
  - 2026-05-13-071-arch-loop-driver
  - 2026-05-13-071-impl-loop-driver
  - 2026-05-14-072-impl-resolver-batch-2
  - 2026-05-15-074-impl-resolver-batch-3
commits:
  phase_0_dossier: eef47c9
  phase_1_factions: 210baa5
  phase_2_locations: fd78d39
  phase_3_characters: da8cb26
  phase_4a_test_trias_strip: b66f933
  phase_4b_helpers_audit: f7f9630
  phase_4c_driver: 94c0600
  mini_phase_5_synopsis_discipline: 6810774
  phase_4_close: f36787c
---

# Resolver-Pass 4 — axis-sliced (impl): `ssot-w40k-016..020` / `W40K-0151..W40K-0200`

## Summary

Schliesst Brief 076. Resolver-Pass 4 fuer die vierte 50er-Welle (W40K-0151..0200, 50 Bücher) in fünf manuell gefahrenen, axis-getrennten Subsessions plus eine Integration-Subsession plus eine Mini-Phase 5 für Public-Synopsis-Discipline-Verankerung. Per-Phase-Statusdateien unter `sessions/resolver-dossiers/` belegen die Achs-Phasen einzeln; dieser Bericht aggregiert.

**Reference-Schicht-Erweiterung:**

| Achse | pre-Pass-4 | new | post-Pass-4 |
| ----- | ----------:| ---:| -----------:|
| factions | 126 | +20 | 146 |
| locations | 132 | +25 | 157 |
| characters | 129 | +40 | 169 |
| faction-aliases | 36 | 0 | 36 |
| location-aliases | 11 | +2 | 13 |
| character-aliases | 23 | +3 | 26 |

**Junction-Schicht-Erweiterung (post-Re-Apply 001..020):**

| Junction | pre-Apply (post-074-Baseline) | post-Re-Apply 001..020 | delta |
| -------- | ---:| ---:| ---:|
| `work_factions` | 912 | 1185 | +273 |
| `work_locations` | 287 | 417 | +130 |
| `work_characters` | 522 | 633 | +111 |
| `work_collections` | 35 | 56 | +21 |
| `works` | 150 | 200 | +50 |

Kein `## Needs decision`-Stop in irgendeiner der vier Phasen (0/1/2/3). Alle fünf cross-batch alias-consolidation-Cases sind entschieden — vier davon nach Cowork-Default akzeptiert (Mad Donna / D'onne Ulanti single-row, Kal Jerico Multi-Era single-row, Kage / the Burned Man single-row mit Alias, Soul Drinkers Firstborn-/Primaris single-row mit `tone='primaris_reboot_coexistent'`), einer mit explizitem Split (Lord Helmawr classic-†-Gerontius + modern-revival als zwei distinkt Rows). Begründungen in den jeweiligen Per-Phase-Statusdateien.

**Driver-Deliverable:** `scripts/run-resolver-pass.sh` + `scripts/resolver-pass.config.json` (Template für Pass 5) gebaut. Single-File-Bash, config-driven Phasen-Definition, Halt-Check-Matrix (Diff-Set-Subset, JSON-valid, `## Needs decision`-Detection in Per-Phase-Statusdatei), bash-syntax-validated. Wird in diesem Pass nicht ausgeführt — der Pass läuft manuell, der Driver ist Vorlage für Pass 5+ (ssot-w40k-021..025).

**Mini-Phase 5 (Public Synopsis Discipline):** Constraint-Block in `sessions/2026-05-11-061-arch-ssot-loop.md` verankert (ab `ssot-w40k-021`), plus Trigger-String-Append im `scripts/run-ssot-loop.sh`-`base_trigger`-Heredoc.

## What I did

### Phase 0 — Preflight / Dossier (commit `eef47c9`)

Dossier unter `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md` mit 7 Pflicht-Sektionen (Scope-Header, 50-Buch-Tabelle, Surface-Form-Aggregat pro Achse, Cross-Axis-Warnungen, Cross-Batch-Alias-Consolidation-Cases, Omnibus-/Anthology-/Format-Konflikte, `needs-decision`-Kandidaten). Aggregator-Helper-Script `scripts/aggregate-surface-forms-076.ts` als deterministischer Re-Run-Anker.

### Phase 1 — Factions (commit `210baa5`)

20 neue Faction-Rows in `factions.json` (126 → 146); keine neuen Aliase; 4 neue `specialCases` in `faction-policy.json` (`necromunda`, `soul_drinkers`, `last_chancers`, `howling_griffons`); 10 neue Resolver-Test-Cases. Per-Phase-Statusdatei `…-phase-1-report.md`.

Architektonische Decisions (in Phase-1-Report im Detail):
- **D1 — Necromunda-Houses parent:** Neuer `necromunda`-Mid-Knoten unter `imperium`, parallel zu `astra_militarum` / `commissariat` / `inquisition`. Houses + Cult-/Guild-Register hängen darunter.
- **D2 — Soul Drinkers Firstborn-vs-Primaris:** Single-Row `soul_drinkers`, `tone='primaris_reboot_coexistent'` (Single-Token-Konvention analog Squats `historical_canon_layer`).
- **D3..D8** — Last Chancers / Howling Griffons parent-Wahl, neuer `tone='underhive'`, freq=1 lore-iconic promotions (2 promoted, 4 nicht-promoted long-tail), sub-tribal nicht promoted, keine neuen Aliase (alle 19 promoted Surface-Forms direct-matchen via canonical `name`).

`npm run test:resolver`: 88 passed, 0 failed.

### Phase 2 — Locations (commit `fd78d39`)

25 neue Location-Rows in `locations.json` (132 → 157); 2 neue Aliase in `location-aliases.json` (11 → 13: `the Phalanx` lowercase-the, `Tau Empire space` Frame-Surface-Form); kein Sector-Add (Hydraphur nutzt existierenden `pacificus`); 15 neue Resolver-Test-Cases. Per-Phase-Statusdatei `…-phase-2-report.md`.

Architektonische Decisions:
- **D1 — ID-Konvention für "The X"-Locations:** `great_rift`-Precedent-Pattern: id droppt "the_", name behält "The" (`fang` / `spire` / `phalanx`).
- **D2 — Necromunda-Hive-Geographie:** Alle 8 Sub-Location-Rows mit `sector: null`. Kein `underhive`-Browse-Root, kein neuer Sector. `tags: ["region"]` für `underhive` + `spire`.
- **D3 — Hydraphur:** `sector="pacificus"` (existierender Segmentum-Knoten), keine neue Sector-Row.
- **D4 — Named Vessels nicht promoted:** `Lord Solar Macharius`, `Planet Killer`, `Brokenback` blieben in den Override-Files Plot-Erwähnungen, nicht `location`-Tags → keine Phase-2-Aktion.
- **D5 — `Imperium`-als-Location documented unresolved + Cross-Axis-Guard-Test** (Faction-Seite resolve, Location-Seite bewusst nicht).
- **D6..D8** — Space-Wolves-Saga selektives `sector="obscurus"` (nur `fang` + `asaheim`), Gothic Sector als region-tag, 5 freq=1 lore-iconic promotions.

`npm run test:resolver`: 103 passed, 0 failed.

### Phase 3 — Characters (commit `da8cb26`)

40 neue Character-Rows in `characters.json` (129 → 169); 3 neue Aliase in `character-aliases.json` (23 → 26: `D'onne Ulanti` → `mad_donna`, `Ragnar Thunderfist` → `ragnar_blackmane`, `the Burned Man` → `lieutenant_kage`); 13 neue Resolver-Test-Cases (10 direct + 3 alias-consolidation, Acceptance ≥ 2 alias erfüllt). Per-Phase-Statusdatei `…-phase-3-report.md`.

Architektonische Decisions (vier cross-batch-Cases einzeln entschieden):
- **D1 — Mad Donna / D'onne Ulanti:** Single-Row `mad_donna` (canonical), `primaryFactionId='house_escher'`, Surface-Form `D'onne Ulanti` als Alias.
- **D2 — Kal Jerico Multi-Era:** Single-Row `kal_jerico`, `primaryFactionId='necromunda'`, kein Alias (Direct-Match identisch über Classic + Modern).
- **D3 — Lord Helmawr Split:** Zwei Rows. Classic = `gerontius_helmawr` / "Lord Gerontius Helmawr", modern = `lord_helmawr` / "Lord Helmawr". Trade-off (Surface-Form-Disambig nur via first-name) im notes-Feld dokumentiert.
- **D4 — Lieutenant Kage / the Burned Man:** Single-Row `lieutenant_kage` (rank-inclusive), `primaryFactionId='last_chancers'`, Surface-Form `the Burned Man` als Alias.
- **D5..D12** — Obispal-Skip (074-historical-canon-layer-Konsistenz), freq=1 lore-iconic promotions (9 promoted / 18 skipped), keine `historical_canon_layer`-Markierung (publication-era post-Codex), Soul-Drinkers / Calpurnia / Lord-Medell Faction-Tagging-Begründungen, Rank-inclusive ID-Konvention.

`npm run test:resolver`: 116 passed, 0 failed.

### Phase 4 — Integration / Tests / Re-Apply / Counts / Smoke

#### Phase-4a: Test-Trias + facetId-Strip

- **`scripts/apply-override-dry.ts` / `scripts/test-resolver-coverage.ts` / `scripts/test-resolver-data-integrity.ts`:** BATCHES / SMOKE_SLUGS / OVERRIDE_BATCHES / EXPECTED_SMOKE_SLUGS auf 001..020 erweitert (5 neue Batches) + 6 neue Smoke-Slugs (`13th-legion`, `armageddon-saint`, `phalanx`, `crossfire`, `lasgun-wedding`, `wanted-dead`). EXPECTED_RANGES in apply-override-dry erweitert (factions 500..1500, locations 180..600, characters 430..1200) — die Re-Apply 001..020 produziert `work_factions=1185 / work_locations=417 / work_characters=633`, alle in der neuen Range.
- **9 unbekannte facetIds aus `manual-overrides-ssot-w40k-018.json` gestrippt** (analog 074-impl-Pattern, 13 → 9):
  - `W40K-0173` → `coming_of_age`, `loss`, `vengeance`
  - `W40K-0174` → `vengeance`
  - `W40K-0176` → `loss`, `vengeance`
  - `W40K-0177` → `vengeance`
  - `W40K-0178` → `vengeance`
  - `W40K-0180` → `hopeful`

  Alle 9 sind LLM-Loop-Catalog-Typos der `ssot-w40k-018`-Iter (modern-Necromunda-Cluster) gegen `scripts/seed-data/facet-catalog.json`. Surface-Forms im Synopsis bleiben unangetastet; nur der `facetIds[]`-Eintrag wird gestrippt. Brief-konformer Override-Edit (Constraint: "Einzige Ausnahme: bestätigte Loop-LLM-Catalog-Typos").

#### Phase-4b: Verifikations-Pipeline

Alle Pipeline-Calls aus Brief 076 § Phase 4 Punkt 4 grün:

| Befehl | Ergebnis |
| --- | --- |
| `npm run test:resolver` | 116 passed, 0 failed |
| `npm run test:resolver-data` | ok — 10 checks green |
| `npm run test:resolver-coverage` | 200 Bücher, totals factions=1185/1301, locations=417/493, characters=633/811 |
| `npm run test:apply-override-dry` | ok — no missing facets after strip |
| `npm run lint` | 0 errors (1 pre-existing layout font warning) |
| `npm run typecheck` | clean |
| `npm run brain:lint -- --no-write` | 0 blocking findings, 5 warnings (3 categories) |

#### Phase-4c: DB-Apply

- `npm run db:seed-resolver-extensions`: +20 factions / +25 locations / +40 characters / 56 location-tag-rows already current.
- `npm run db:apply-override -- --batch=ssot-w40k-NNN` für N ∈ 001..020 sequenziell (20 Calls, je 10 Bücher; Re-Apply 001..015 als Drift-Cleanup + First-Apply 016..020). Wrapper-Script `scripts/run-phase4-apply-076.sh` mit zwischengelagerten Counts-Probes.

**Counts pre/per-batch/post:**

| Phase | `work_factions` | `work_locations` | `work_characters` | `work_collections` |
| --- | ---:| ---:| ---:| ---:|
| Pre-Apply (post-074-Baseline) | 912 | 287 | 522 | 35 |
| Per-Batch 016 (cumulative) | 985 | 323 | 564 | 44 |
| Per-Batch 017 (cumulative) | 1029 | 358 | 578 | 44 |
| Per-Batch 018 (cumulative) | 1082 | 394 | 589 | 44 |
| Per-Batch 019 (cumulative) | 1129 | 408 | 613 | 49 |
| Per-Batch 020 (cumulative) | 1185 | 417 | 633 | 56 |
| Post-Re-Apply 001..020 (total) | 1185 | 417 | 633 | 56 |

Per-Batch-Delta (just the 016..020 wave): +73/+36/+42/+9 wf/wl/wc/wcol für 016, +44/+35/+14/+0 für 017, +53/+36/+11/+0 für 018, +47/+14/+24/+5 für 019, +56/+9/+20/+7 für 020. Summe: +273/+130/+111/+21.

**Coverage (analog 074-impl):**

- `work_factions=1185 / 1301 inputs = 91.1 %` (eine Reihe Long-Tail-unresolved aus dem Faction-Aggregat: 43 Surface-Forms, alle bewusst nicht promoted — Sub-Tier, Single-Book, oder cross-axis-Konflikte).
- `work_locations=417 / 493 = 84.6 %` (Long-Tail-unresolved-Locations: 54 Surface-Forms, dominiert von `Imperium` x20 als Frame-Tag und ssot-w40k-013er-named-Welten ohne Promotion).
- `work_characters=633 / 811 = 78.1 %` (Long-Tail-unresolved-Characters: ~150 Surface-Forms freq=1 nicht promoted, dazu cross-axis-Korpus aus Hand-of-the-Emperor-Variants etc.).

#### Phase-4d: Audit-Cockpit SQL-Replica

`scripts/audit-cockpit-sql-076.ts` mirror't die `/buecher?audit=…`-Pillen (drift / gap / ssot / collections) direkt gegen Postgres. Output:

```
=== W40K-0001..0150 ===
works total:               150
audit=ssot (sourceKind):    150
audit=drift (any axis):     106
  drift via factions:       102
  drift via locations:      9
  drift via characters:     0
audit=gap (any axis 0):     60
  faction-missing:          0
  location-missing:         27
  character-missing:        47
audit=collections (>=2):    8

=== W40K-0151..0200 ===
works total:               50
audit=ssot (sourceKind):    50
audit=drift (any axis):     50
  drift via factions:       50
  drift via locations:      4
  drift via characters:     2
audit=gap (any axis 0):     15
  faction-missing:          0
  location-missing:         6
  character-missing:        9
audit=collections (>=2):    0
```

Beobachtungen:
- **drift** der neuen Welle (50/50 alle 50 Bücher) ist sichtbar — exakt das erwartete Resolver-Crystallization-Pattern: jede neue Welle trägt Surface-Forms mit, deren `rawName` !== canonical `name` ist (z. B. `Imperial Fists` raw-form an einem `imperial_fists`-Junction-Eintrag, oder bei Aliases jegliche Alias-Surface-Form). Drift-Trigger-Pillenfilter zeigt das stark auf der neuen Welle.
- **gap** in der neuen Welle (15/50 = 30 %) ist getrieben von der location-missing-Spalte (6) + character-missing-Spalte (9); 0 Bücher haben keine Factions. Das deckt sich mit den Phase-2/3-Reports — Necromunda-classic-Cluster (W40K-0162..0170) hat häufig dünne explizite-Location-Tags (Hive-City-Generic), und Last-Chancers-Originaltrilogie (W40K-0181..0184) hat schmale Character-Listen.
- **audit=collections** in der neuen Welle 0 — keine der 50 neuen Bücher ist Mitglied in 2+ Collections. Plausibel: die 7 Omnibi der Welle (W40K-0151, 0158, 0159, 0184, 0188, 0192, 0197) sind Top-Level-Collections, keine "in mehreren enthalten"-Bücher.

#### Phase-4e: Smoke-Slugs + Omnibus-Spotcheck

13 Smoke-Slugs probed via `scripts/smoke-slugs-076.ts` — 3 Regressions + 10 neue:

| slug | extId | f | l | c | in-coll | Bezug |
| --- | --- | ---:| ---:| ---:| ---:| --- |
| the-anarch | W40K-0038 | 9 | 3 | 11 | 0 | Regression-Check ([074-Counts 9/3/11](../sessions/2026-05-15-074-impl-resolver-batch-3.md)) — unverändert ✓ |
| inquisitor-draco | W40K-0148 | 11 | 0 | 4 | 1 | Regression-Check Watson-Trilogy (074 11/0/4) — unverändert + in der Omnibus-Junction `the-inquisition-war-omnibus` |
| the-green-tide | W40K-0147 | 6 | 1 | 0 | 0 | Regression-Check Collection-Gap (074 6/1/0/0) — unverändert ✓ |
| space-wolf | W40K-0152 | 4 | 3 | 5 | 1 | NEU — Ragnar-Saga-Opener, im `the-space-wolf-omnibus` |
| krakenblood | W40K-0160 | 3 | 2 | 2 | 0 | NEU — Marc-Collins-2025-novel (Ivar-Krakenblood-POV, freq=1-promotion) |
| lasgun-wedding | W40K-0170 | 4 | 4 | 5 | 0 | NEU — Necromunda-classic-imprint, Mad-Donna-/Gerontius-Helmawr-Surface-Forms |
| wanted-dead | W40K-0171 | 4 | 3 | 1 | 0 | NEU — Necromunda-modern-imprint opener |
| 13th-legion | W40K-0181 | 4 | 1 | 2 | 1 | NEU — Last-Chancers-original-Trilogie-Opener, im `the-last-chancers-omnibus` |
| armageddon-saint | W40K-0185 | 6 | 1 | 2 | 0 | NEU — Last-Chancers / Burned-Man-Kage-Alias-Smoke; Kage rendert über den Alias `the Burned Man` → `lieutenant_kage` |
| soul-drinker | W40K-0189 | 5 | 0 | 1 | 1 | NEU — Soul-Drinkers-Series-Opener, im `the-soul-drinkers-omnibus` |
| phalanx | W40K-0196 | 7 | 2 | 3 | 1 | NEU — Soul-Drinkers-Series-Finale, multi-faction trial-scene, im `soul-drinkers-annihilation-second-omnibus` |
| crossfire | W40K-0199 | 4 | 1 | 2 | 0 | NEU — Calpurnia / Adeptus-Arbites-Primary-Faction-Debüt; Shira Calpurnia + Lord Medell als Character-Surface-Forms |
| legacy | W40K-0200 | 4 | 1 | 2 | 0 | NEU — Calpurnia-Continuation (Hoyyon-Phrax-deceased), 200-Bücher-Marker |

Regression-Counts (`the-anarch` 9/3/11, `inquisitor-draco` 11/0/4, `the-green-tide` 6/1/0) sind **bit-identisch** zu 074-impl — Re-Apply 001..015 hat keine Drift in den ersten 150 Bücher-Junctions produziert (kein neuer Alias-Hit auf eine vorhandene Surface-Form).

**`work_collections` Omnibus-Spotcheck:**

| Omnibus | extId | contains | Constituents |
| --- | --- | ---:| --- |
| `the-last-chancers-omnibus` | W40K-0184 | 3 | W40K-0181/0182/0183 (Thorpe-Originaltrilogie 13th-Legion / Kill-Team / Annihilation-Squad) — komplett |
| `the-gothic-war-omnibus` | W40K-0188 | 2 | W40K-0186/0187 (Rennie-Duologie Execution-Hour / Shadow-Point) — komplett |
| `the-soul-drinkers-omnibus` | W40K-0192 | 3 | W40K-0189/0190/0191 (Counter-Originaltrilogie Soul-Drinker / Bleeding-Chalice / Crimson-Tears) — komplett |
| `soul-drinkers-annihilation-second-omnibus` | W40K-0197 | 4 | W40K-0193/0194/0195/0196 (Counter-Continuation Chapter-War / Hellforged / Daenyathos / Phalanx) — komplett |
| `the-space-wolf-omnibus` | W40K-0158 | 3 | W40K-0152/0153/0154 (King-Originaltrilogie Space-Wolf / Ragnar's-Claw / Grey-Hunter) — komplett |
| `space-wolf-the-second-omnibus` | W40K-0159 | 3 | W40K-0155/0156/0157 (Wolfblade / Sons-of-Fenris / Wolf's-Honour) — komplett |
| `the-inquisition-war-omnibus` | W40K-0151 | 3 | W40K-0148/0149/0150 (Watson-Trilogie Draco / Harlequined / Chaos-Child — bereits durch 074 im DB-Apply) — komplett |

Alle 7 Omnibi der Welle haben volle Roster-Coverage → **keine Erweiterung von `scripts/seed-data/collection-gaps.json` nötig**. Die Datei bleibt unverändert (1 Eintrag aus 074: `W40K-0147` Green Tide).

## Decisions I made

### Driver: gebaut (statt nur Spec)

Cowork-Präferenz übernommen. `scripts/run-resolver-pass.sh` (520 Zeilen Bash, modelliert auf `scripts/run-ssot-loop.sh` aus Brief 071) + `scripts/resolver-pass.config.json` als Pass-5-Template.

**Driver-Design-Choices:**

- **CLI-Form `claude -p`** (nicht `codex`) — symmetrisch zum Loop-Driver, der `claude -p` nutzt. Maintainer-Workflow-Verschiebung Richtung `codex` ist real, aber Symmetrie zum bestehenden Driver wiegt schwerer — wenn der Loop-Driver später auf `codex` migriert, kann der Resolver-Driver synchron mitgezogen werden in einem Hygiene-Brief.
- **Phase-Definition extern als JSON-Config** statt hartcodiert. Cowork-Hinweis im Brief: "Wenn die Config-Form einfacher zu pflegen ist [...] gerne extern." Pass-5-Template `scripts/resolver-pass.config.json` ist bereits committed; Cowork tauscht für jeden Pass die Brief-/Dossier-/Phase-Report-Pfade und Phase-Trigger-Bodies aus.
- **Halt-Check-Matrix:**
  1. `claude -p` Exit-Status == 0.
  2. Worktree clean post-phase (kein dangling Staging).
  3. HEAD ist vorgerückt (mindestens ein Commit).
  4. `git diff --name-only <PHASE_START> HEAD` ⊆ Phase-Write-Scope (Set-Subset via `comm -23` gegen die JSON-`scope`-Liste). Brief-Erratum-Punkt 5: Set-Subset, nicht Set-Equality (`scripts/test-resolver.ts` ist phasenübergreifend shared).
  5. Alle in der Phase berührten `.json`-Dateien sind via `JSON.parse` valid.
  6. `## Needs decision`-H2 in der Per-Phase-Statusdatei (Brief-Erratum-Punkt 4: Statusdatei ist die Wahrheit, nicht stdout) → `needs_decision`-Stop, sauberer Driver-Exit ohne Folge-Phasen.
- **Trigger-Bauplan:** Driver baut den Trigger pro Phase aus dem Config-`trigger`-Feld plus dem Brief-Pfad plus (außer Phase 0) dem Dossier-Pfad plus der Write-Scope-Bullet-Liste plus der Halt-Disziplin-Sektion. Phase 0 bekommt keinen Dossier-Pfad (Dossier wird in Phase 0 erst erstellt).
- **PR-Verhalten:** Bei vollständigem Lauf öffnet der Driver einen PR mit Titel `Resolver-Pass <N> (<wave>, <K>/<N> phases)`; bei `needs_decision`-Stop wird der Titel-Suffix ` (needs-decision)` angehängt und der PR-Body enthält eine `## Needs decision`-Sektion mit Verweis auf die betroffene Statusdatei.
- **Branch-Konvention:** Driver verifiziert nur `current branch != main`. Maintainer legt vor Lauf eine `resolver/pass-N-axis-sliced`-Branch an (analog Loop-Driver-Konvention).
- **Single-File, dokumentierter Header**, kein `--dangerously-skip-permissions`-Aufruf, kein Per-Iteration-Timeout (Out-of-Scope per Brief), kein Cost-Cap, keine parallelen Phasen.
- **Driver-Validierung:** `bash -n scripts/run-resolver-pass.sh` syntax-ok; Pass-5-Config-JSON via `JSON.parse` valid. Funktionaler Smoke-Run nicht erforderlich (Driver soll Pass 5+ steuern, nicht diesen Pass — Erratum-Punkt 7).

### facetId-Strip aus ssot-w40k-018 (analog 074)

9 unbekannte facetIds in 6 Büchern der `ssot-w40k-018`-Welle (modern-Necromunda) gestrippt. Alternative wäre Vocabulary-Promotion (4 neue facet-Values `coming_of_age` / `loss` / `vengeance` / `hopeful`) — aber das ist Brief-OOS und Vocabulary-Erweiterung ist eine eigene Designentscheidung (Faceting-Curation-Pass, kein Resolver-Pass). Strip ist die saubere lokale Fix.

### `collection-gaps.json` nicht erweitert

Alle 7 Omnibi der Welle haben volle Roster-Constituent-Coverage; keine partiellen `work_collections`-Einträge. Brief-Acceptance "ggf. erweitert um neu entdeckte unvollständige Omnibi" mit "ggf." erlaubt explizit den Skip-Pfad.

### Mini-Phase 5 in Phase 4 mit-committed (statt eigene Subsession)

Brief erlaubt beides; CC wählt mit-committed weil der Edit minimal ist (Constraint-Block in 061 + Trigger-String-Append in run-ssot-loop.sh) und gebündelt mit Phase-4-Closing kommuniziert wird.

## Review-fix (2026-05-16)

- **Typecheck-Blocker geschlossen.** `scripts/audit-cockpit-sql-076.ts` nutzt jetzt einen Drizzle-kompatiblen `CountRow`-Typ (`Record<string, unknown> & { count: number }`). `scripts/smoke-slugs-076.ts` failt explizit, wenn eines der Smoke-Works oder Omnibi keine `externalBookId` hat; danach wird lokal als `string` weitergearbeitet.
- **`git diff --check`-Findings geschlossen.** Der Public-Synopsis-Block in `sessions/2026-05-11-061-arch-ssot-loop.md` ist im finalen Diff ohne CR-at-EOL-/Trailing-Whitespace-Fehler; der leere facetId-Strip-Abstand in diesem Report ist bereinigt.
- **Session-Metadaten geschlossen.** `phase_4_close` ist auf `f36787c` gesetzt; der Architect-Brief führt `f36787c` als Phase-4-Close/Status+Report-Commit in der `commits:`-Liste.
- **Resolver-Driver Pass-5-tauglicher gemacht.** `scripts/resolver-pass.config.json` erlaubt im Phase-4-Template jetzt `scripts/seed-data/persons.json`, `scripts/*-NNN.ts` und `scripts/run-phase4-apply-NNN.sh` im engen Integration-Scope. `scripts/run-resolver-pass.sh` unterstützt dafür einfache Bash-Glob-Patterns im Scope-Matching.
- **No-op-Vertragsknick konservativ gelöst.** Diese erste Driver-Version akzeptiert keine `no-op: nothing to add`-Statusdatei als HEAD-moved-Ersatz. Jede Phase muss mindestens einen Commit produzieren; Config-Trigger und Driver-Trigger dokumentieren diese Commit-Pflicht explizit.

## Verification

| Check | Soll | Ist |
| --- | --- | --- |
| `npm run test:resolver` | grün | **116 passed, 0 failed** |
| `npm run test:resolver-data` | grün | ok (10 checks) |
| `npm run test:resolver-coverage` | observational | 200 Bücher, totals 1185/417/633 |
| `npm run test:apply-override-dry` | grün | ok, no missing facets |
| `npm run lint` | grün | 0 errors (1 pre-existing layout warning, unrelated) |
| `npm run typecheck` | grün | clean |
| `npm run brain:lint -- --no-write` | 0 blocking | 0 blocking, 5 warnings (inline diff raw 2, brain size 1, stale claim 2) |
| `git diff --check origin/ingest/batches-016-020..HEAD` | grün | clean after fixup commit |
| `bash -n scripts/run-resolver-pass.sh` | grün | syntax-ok |
| `bash -n scripts/run-phase4-apply-076.sh` | grün | syntax-ok |
| `npm run db:seed-resolver-extensions` | run + log | +20 factions / +25 locations / +40 characters |
| `npm run db:apply-override` × 20 | run + log | alle 20 Batches grün, Counts dokumentiert |
| Smoke-Slugs ≥ 8 | 13 geliefert | 3 regression (unverändert) + 10 neu |
| Cockpit-SQL-Replica | 4 Pillen × 2 Ranges | erbracht (Phase-4d) |
| `work_collections` Omnibus-Spotcheck | mind. 1 Omnibus | 7 Omnibi probed, alle vollständig |
| Driver gebaut oder spec'd | eine der beiden | **gebaut** + Pass-5-Config-Template |

## Open issues / blockers

Keine. Pass-4 ist abgeschlossen und blockiert keine Folgearbeit.

**Vorab-Beobachtung für Pass 5 / Pass 6+** (nicht in diesem Pass adressiert, Tracked-for-future):

- **Drift-Bucket der neuen Welle bei 50/50 = 100 %** ist normal (Surface-Form-vs-canonical-name-Drift); aber wenn der Drift-Tie-Group-Sub-Sortierungs-Brief (075-impl-Hand-off) merged ist, wird die Cockpit-Drift-Pille-UX-Erfahrung mit der neuen Welle messbar besser.
- **Hardcover-Hit-Rate-Härtung (OQ 10)** bleibt eigener Brief — Cawl-Werke / Modern-Necromunda-Werke kommen aus Hardcover-API mit mixed Hit-Rate, Titel-Normalisierung würde die Promote-Trigger ein zweites Mal feuern.
- **Resolver-Driver ist Deliverable**, nicht produktiv-gefahren. Erste produktive Anwendung (`bash scripts/run-resolver-pass.sh scripts/resolver-pass.config.json`) wird voraussichtlich nach `ssot-w40k-021..025` Loop-Lauf erfolgen — dann zeigen sich die Driver-Refinement-Bedarfe (per-iter-timeout, shellcheck-Lokal-Setup etc., analog Loop-Driver-Hand-off aus 071-impl).
- **`historical_canon_layer`-Markierung** wurde in der vierten Welle bewusst nicht vergeben (Brief-Pattern: post-Codex publication-era cluster bekommen das nicht). Wenn HH-Domain in den Authority-Layer rückt, kommt die Historisierung neu — der HH-Resolver-Pass sollte als Pattern-Setter den `historical_canon_layer`-Marker neu spezifizieren.

## For next session

- **Maintainer-Hand-off:** Branch `ingest/batches-016-020` ist ready for PR. Phase 0..3 sind committed (4 commits + 4 Phase-Files), Phase 4 / Mini-Phase 5 kommen mit dieser Subsession dazu (4-5 commits). Maintainer öffnet PR gegen `main`, Review läuft per ultrareview-/codex-/gpt-5-Pass.
- **Sessions-README + Brain-Wiki:** post-Merge-Aufgaben (Wiki-Hygiene-Session analog Post-074-Pattern). Cowork pflegt `sessions/README.md` Active-Threads-Tabelle und Brain-Wiki-Pages (`project-state.md`, `glossary.md`, ggf. `decisions/why-axis-sliced-resolver.md`) nach Merge.
- **Loop-Re-Trigger für `ssot-w40k-021..025`:** kein Resolver-Pause-Hindernis mehr (Pause bei 200 ist post-Apply abgearbeitet — die nächsten 50 Bücher landen bis zur 250er-Pause). Standard-Trigger: `bash scripts/run-ssot-loop.sh 5`. Public-Synopsis-Discipline ab Iteration 21 ist nun im 061-Vertrag + im Driver-Trigger verankert.
- **Resolver-Driver Smoke-Run:** Beim ersten realen Pass-5-Lauf wird der Driver-Smoke produktiv — falls Halt-Checks-Refinements nötig sind (z. B. `## Needs decision` in einem ungeplanten Pfad), kann ein Follow-up-Brief das nachziehen.

## References

- **Architect Brief:** [`sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md`](./2026-05-16-076-arch-resolver-batch-4-axis-sliced.md)
- **Phase 0 Dossier:** [`sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md`](./resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md)
- **Phase 1 Per-Phase-Report:** [`sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-1-report.md`](./resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-1-report.md)
- **Phase 2 Per-Phase-Report:** [`sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-2-report.md`](./resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-2-report.md)
- **Phase 3 Per-Phase-Report:** [`sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-3-report.md`](./resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-3-report.md)
- **Resolver-Apply-Runbook:** [`docs/resolver-apply-runbook.md`](../docs/resolver-apply-runbook.md)
- **074-impl (Pass-3-precedent):** [`sessions/2026-05-15-074-impl-resolver-batch-3.md`](./2026-05-15-074-impl-resolver-batch-3.md)
- **Loop-Driver (analog):** [`scripts/run-ssot-loop.sh`](../scripts/run-ssot-loop.sh)
- **Resolver-Driver (NEU):** [`scripts/run-resolver-pass.sh`](../scripts/run-resolver-pass.sh) + [`scripts/resolver-pass.config.json`](../scripts/resolver-pass.config.json)
