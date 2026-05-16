---
report: 2026-05-16-076-resolver-pass-4-phase-1
brief: sessions/2026-05-16-076-arch-resolver-batch-4-axis-sliced.md
dossier: sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-dossier.md
phase: 1
axis: factions
status: done
generated: 2026-05-16
---

# Phase 1 (Factions) — Done summary

> Per-Phase-Statusdatei laut Brief 076 § Phasen-Write-Scopes / Erratum-Punkt 4+8. Kurze Done-Summary. Finaler konsolidierter impl-Report folgt in Phase 4.

## Outcome

20 neue Faction-Rows in `scripts/seed-data/factions.json` (126 → 146). Keine neuen Aliase. 4 neue `specialCases`-Notes in `scripts/seed-data/faction-policy.json` (`necromunda`, `soul_drinkers`, `last_chancers`, `howling_griffons`). 10 neue Resolver-Test-Cases in `scripts/test-resolver.ts` (Acceptance ≥ 5; alle Direct-Match-Cases). `npm run test:resolver` grün: **88 passed, 0 failed** (78 + 10 neue).

Kein `needs-decision`-Stop. Alle 5 cross-batch alias-consolidation-Cases aus dem Dossier sind durchgelaufen (Case 5 Soul-Drinkers in Phase 1 entschieden; Cases 1–4 sind Phase-3-Domain).

## New faction rows (20)

Logische Gruppierung, Append-Only an `factions.json`:

| # | id | name | parent | alignment | tone |
| - | -- | ---- | ------ | --------- | ---- |
| 1 | `necromunda` | Necromunda | imperium | imperium | underhive |
| 2 | `house_helmawr` | House Helmawr | necromunda | imperium | underhive |
| 3 | `house_koiron` | House Ko'iron | necromunda | imperium | underhive |
| 4 | `house_ulanti` | House Ulanti | necromunda | imperium | underhive |
| 5 | `house_cawdor` | House Cawdor | necromunda | imperium | underhive |
| 6 | `house_escher` | House Escher | necromunda | imperium | underhive |
| 7 | `house_goliath` | House Goliath | necromunda | imperium | underhive |
| 8 | `house_orlock` | House Orlock | necromunda | imperium | underhive |
| 9 | `house_delaque` | House Delaque | necromunda | imperium | underhive |
| 10 | `house_van_saar` | House Van Saar | necromunda | imperium | underhive |
| 11 | `redemptionists` | Redemptionists | necromunda | imperium | underhive |
| 12 | `guilders` | Guilders | necromunda | imperium | underhive |
| 13 | `spyrers` | Spyrers | necromunda | imperium | underhive |
| 14 | `necromunda_enforcers` | Necromunda Enforcers | necromunda | imperium | underhive |
| 15 | `ratskins` | Ratskins | necromunda | imperium | underhive |
| 16 | `venators` | Venators | necromunda | imperium | underhive |
| 17 | `last_chancers` | Last Chancers | astra_militarum | imperium | line |
| 18 | `house_belisarius` | House Belisarius | navis_nobilite | imperium | archive |
| 19 | `soul_drinkers` | Soul Drinkers | heretic_astartes | chaos | primaris_reboot_coexistent |
| 20 | `howling_griffons` | Howling Griffons | adeptus_astartes | imperium | imperial |

Idempotenz: `node -e "const f=require('./scripts/seed-data/factions.json'); const ids=new Set(); for(const r of f){if(ids.has(r.id))throw new Error('dup: '+r.id); ids.add(r.id);}"` zeigt 0 Duplikate.

## Decisions

### D1 — Necromunda-Houses parent-Wahl (Brief OQ / Dossier §7.1)

**Gewählt:** Neuer `necromunda`-Mid-Knoten unter `imperium`, parallel zu `astra_militarum` / `commissariat` / `inquisition` (Cowork-Tendenz #1). Alle Necromunda-internen Faktionen (Houses + Cult-/Guild-Register) hängen darunter.

**Begründung:**

- Strukturell eigene Cluster: Houses + Spyrers + Guilders + Enforcers + Ratskins + Venators sind hive-world-planetary, nicht regulär Astra-Militarum / Adeptus-Arbites-Tier.
- Single-parent-Limit im Schema (`factions.parent`) zwingt zu einer Wahl; `necromunda` bündelt sauberer als die Alternative (alle direkt unter `imperium`, was Necromunda-Cluster-Information in der Faction-Hierarchie verliert).
- `necromunda` als Faction-Row kollidiert NICHT mit der gleichnamigen Location-Row — Achs-getrennte Tables, der Resolver disambiguiert via `resolveFaction` vs. `resolveLocation`.
- KEIN Browse-Root-Promote (Brief-Constraint + `faction-policy.json` unverändert für `browseRoots`).

`faction-policy.json` `specialCases.necromunda` dokumentiert die Cluster-Mitgliedschaft + den No-Browse-Root-Status.

### D2 — Soul Drinkers Firstborn vs. Primaris (Dossier §5 Case 5)

**Gewählt:** Eine Row `soul_drinkers`, parent=`heretic_astartes`, alignment=`chaos`, **tone=`primaris_reboot_coexistent`** (Single-Token-Konvention analog Squats `historical_canon_layer`).

**Begründung:**

- Cowork-Default akzeptiert: dasselbe Chapter-Name + Heraldry-Setup; Firstborn-Continuity endet mit *Phalanx* (W40K-0196); Primaris-Reboot in *Traitor by Deed* (W40K-0198) ist eine era_frame-Frage, keine Faction-Identitäts-Frage; Resolver-Schema trägt heute keine Primaris-vs-Firstborn-Dimension.
- `parent=heretic_astartes` weil die Mehrheit der Authority-Layer-Auftritte (9 von 10 Büchern: W40K-0189..0197) Excommunicate-Traitoris ist; der Primaris-Reboot (W40K-0198) ist publication-era-continuity der Single-Row-Identität.
- `tone='primaris_reboot_coexistent'` markiert die Spezialkonstellation für künftige Resolver-Pässe und Audit-Cockpit-Tags (analog Squats-Pattern).
- **Alternative geprüft + verworfen:** Zwei Rows (`soul_drinkers` + `soul_drinkers_primaris`) — verletzt das Cowork-Default + Loop-Log-Befund "fifteen-year publication gap, post-Cicatrix continuity ... Resolver-class disambiguation deferred". Schema-konform wäre das zwar, aber strukturelle Inflation ohne Authority-Layer-Need.

`faction-policy.json` `specialCases.soul_drinkers` dokumentiert die Continuity-Marker-Wahl.

### D3 — Last Chancers parent (Brief-Vorgabe)

**Gewählt:** `parent='astra_militarum'`, alignment='imperium', tone='line'. Brief-Vorgabe direkt übernommen (Sub-Faction-Tier wie `tanith_first` / `volpone_bluebloods` / `cadian_shock_troops`).

### D4 — Howling Griffons parent

**Gewählt:** `parent='adeptus_astartes'` (nicht `imperial_fists`-sub-tier). Howling Griffons sind canonical ein Ultramarines-Successor, nicht IF-Successor. Für die Authority-Layer-Coverage reicht `adeptus_astartes` als parent — wenn ein späterer Resolver-Pass die UM-Successor-Hierarchie ausbaut, kann eine Hygiene-Session das nachreichen.

### D5 — `tone='underhive'` als neuer Single-Token

Alle 16 Necromunda-Sub-Faktionen (inkl. parent `necromunda`) tragen `tone='underhive'`. Single-Token-Konvention analog vorhandenen Tones (`feral`, `heterodox`, `historical_canon_layer`, `engine`, `plague`, `excess`). Keine UI-Konsumenten-Validierung in dieser Phase (Brief-Constraint "keine UI-Arbeit") — wenn das Tone-Token unerwartet in Renderern auftaucht und ein Default-Look fehlt, kann ein Hygiene-Brief das nachreichen.

### D6 — `freq=1` lore-iconic Promotions

Promoted (2):

- `house_koiron` (W40K-0163, *Salvation* — Spire-Noble-House, canonical Necromunda-Mainstay).
- `house_ulanti` (W40K-0177, *Soulless Fury* — Mad-Donna-Origin-House; Phase-3-Cross-Batch-Charakter-Konsolidierung profitiert davon, dass die Faction-Row schon existiert).

Nicht-promoted (4, Long-Tail-unresolved):

- `Corpse Guild` (freq=1, W40K-0178)
- `Guild of Light` (freq=1, W40K-0179)
- `Razorheads` (freq=1, W40K-0168)
- `House of Chains` (freq=1, W40K-0180)

Begründung: Cowork-Faustregel "lieber Long-Tail unresolved als falsche Canonical-Kanten". Diese vier Surface-Forms tauchen je nur in einem Buch und mit niedriger Lore-Ikonik auf; bei künftigen Resolver-Pässen können sie hinzukommen, wenn die Frequenz steigt oder eine Cowork-Decision sie freigibt.

### D7 — Sub-tribal / Sub-cohort: nicht promoted

`Grimskull tribe` (freq=2, W40K-0152/0158) + `Thunderfist tribe` (freq=2, W40K-0152/0158) bleiben **unresolved**. Begründung analog Brief-Pattern aus 072 / 074: Origin-Tribes für Recruits wie Ragnar Thunderfist / Strybjorn Grimskull sind kein Faction-Tier; die Authority-Layer-Faction ist `space_wolves` (existing).

### D8 — Keine neuen Aliase

Alle 19 promoted Surface-Forms direct-matchen via ihre canonical `name`-Felder. Override-File-Grep über die Welle (`016..020`-Books, `book[].overrides.factions` Surface-Form-Set) zeigt keine Shortform-/Alternative-Schreibweise, die einen Alias rechtfertigen würde. Cowork-Faustregel "alias nur bei ≥1× konkret auftauchendem Surface-Form" → keine Edits an `faction-aliases.json`.

## Resolver-Status-Veränderung

Pre-Phase-1 (post-074-Baseline, aus Dossier §1):

```
factions: 126 rows / 36 aliases
faction surface forms in wave: 27 resolved (direct: 21 / alias: 6), 34 unresolved (Dossier-Summary)
```

Post-Phase-1:

```
factions: 146 rows (+20) / 36 aliases (unchanged)
faction surface forms in wave: 46 resolved (direct: 40 / alias: 6), 15 unresolved
```

Long-Tail-unresolved (15, alle bewusst nicht promoted):

- freq=1 keine-lore-iconic: Corpse Guild, Guild of Light, Razorheads, House of Chains
- freq=2 sub-tribal: Grimskull tribe, Thunderfist tribe

(Die Dossier-Summary "34 unresolved" weicht von der gezählten Tabelle ab — die Tabelle zeigt 25 unresolved Surface-Forms; Differenz ist ein Dossier-internes Zählungs-Inkonsistenz im Header, nicht in den per-Surface-Form-Daten. Phase-1 hat 19 davon resolved, 6 belassen.)

## Test-Coverage

10 neue Faction-Test-Cases in `scripts/test-resolver.ts` (Acceptance ≥ 5):

1. `Necromunda` → `necromunda` (Mid-Knoten-Smoke)
2. `House Escher` → `house_escher` (freq=7 cluster-iconic)
3. `House Helmawr` → `house_helmawr` (freq=6 noble-House, Classic-+-Modern-Imprint-Coverage)
4. `House Ko'iron` → `house_koiron` (freq=1 lore-iconic-promotion, Apostroph-im-Surface-Form)
5. `Necromunda Enforcers` → `necromunda_enforcers` (Multi-Word-Direct-Match)
6. `Guilders` → `guilders` (freq=20 high-frequency-resolution)
7. `Last Chancers` → `last_chancers` (under astra_militarum)
8. `Soul Drinkers` → `soul_drinkers` (Firstborn-+-Primaris-coexistent-Row)
9. `Howling Griffons` → `howling_griffons` (Chapter-War-Smoke)
10. `House Belisarius` → `house_belisarius` (Navigator-House)

`npm run test:resolver` Ergebnis: **88 passed, 0 failed** (alle bestehenden 78 unverändert).

## Files touched (Phase-1 Write-Scope)

- `scripts/seed-data/factions.json` (+20 rows, append-only)
- `scripts/seed-data/faction-policy.json` (+4 `specialCases` keys)
- `scripts/test-resolver.ts` (+10 test cases, sectioned-append nach `Triarch Council` block)
- `sessions/resolver-dossiers/2026-05-16-076-resolver-pass-4-phase-1-report.md` (diese Datei, neu)

**Nicht berührt** in dieser Phase:

- `scripts/seed-data/faction-aliases.json` (keine neuen Aliase nötig — alle Promotions resolvable über Direct-Match).
- Keine Pfade außerhalb des Write-Scopes.

## Hand-off to Phase 2 (Locations)

- Faction-Policy-Hierarchie ist konsistent: `necromunda` als parent verfügbar, Houses + Cult-Rows angelegt.
- Phase-3-Vorgriff: `house_ulanti` ist für die Mad-Donna-/D'onne-Ulanti-Konsolidierung als `primaryFactionId`-Target nutzbar; `last_chancers` für Schaeffer / Kage / Lorii; `soul_drinkers` für Sarpedon / Daenyathos / Iktinos / Tellos / Yeceqath the Voice of All.
- Cross-Axis-Achtung Iyanden-Style: `Imperium`-als-Location bleibt in Phase 2 unresolved (Dossier §4) — die Faction-Seite ist via Alias bereits resolved (`Imperium → imperium`).

## Open issues / blockers

Keine. Phase 2 (Locations) ist freigegeben.
