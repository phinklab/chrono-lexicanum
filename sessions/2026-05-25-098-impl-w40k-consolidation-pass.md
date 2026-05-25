---
session: 2026-05-25-098
role: implementer
date: 2026-05-25
status: complete
slug: w40k-consolidation-pass
parent: 2026-05-25-098
links:
  - 2026-05-23-094-arch-resolver-loop
  - 2026-05-25-098-arch-w40k-consolidation-pass
commits: []
---

# W40K-Konsolidierungs-Pass — Cross-Wave-Canonical-Row-Dedup + resolver-loop-log-Verifikation

## Summary

Teil 1 verifiziert: `sessions/resolver-loop-log.md` ist kanonisch (Bootstrap + Pass 8 `046..051` + Pass 9 `052..057`), `npm run resolver:next-wave` meldet `w40k-complete`, kein Drift, kein Teil-1-Commit. Teil 2 gebaut **und** zum ersten Mal über das W40K-Entitäten-Set gefahren: 15 Kandidaten-Cluster → **2 Merges** (`vigilus_s → vigilus`, `magister_sek → anakwanar_sek`) + 13 No-Merges + 0 Flagged; Maintainer-Review-Gate mit ausdrücklichem „Go — beide Merges anwenden" passiert; Reference-Premerge-Snapshot + Prod-DB-Pre-Mutation-Snapshot + Re-Apply (`001..057`, alle 57 Batches `ok`) + DB-Sync-Transaktion (Field-Retention `anakwanar_sek.notes` + In-Tx-Verify + Delete) sauber durchgelaufen; Trias grün.

## What I did

### Teil 1 — Verifikation (no commit)

- `sessions/resolver-loop-log.md` gelesen — Bootstrap + Pass 8 (`046..051`, alle 6 Phasen `[x]`) + Pass 9 (`052..057`, alle 6 Phasen `[x]`) in kanonischer Form, wie der Detektor sie erwartet (H2-Wellen-Heading + sechs `[x]`-Phase-Checkboxen).
- `npm run resolver:next-wave` ausgeführt — Output: `{ "status": "w40k-complete" }` (`resolverProgressBatch = 057`, `nextPassNumber = 10` werden zugunsten des Terminal-Status nicht emittiert).
- Kein Drift → kein Teil-1-Commit.

### Teil 2 — Konsolidierungs-Pass-Maschinerie + erster W40K-Lauf

Neue Skripte (alle in `scripts/`, plus zugehörige Config):

- `scripts/consolidation-aggregate.ts` — deterministischer Dubletten-Kandidaten-Aggregator. Liest die drei Reference-JSONs + `*-aliases.json` und emittiert pro Achse eine **gefilterte** Kandidaten-Liste (NICHT Pairwise-Matrix). Heuristiken: exact-normalized-name (NFKD + lower + punct-strip + honorific-strip via achs-spezifische Honorific-Sets) ∪ Jaccard ≥ 0.5 auf Tokens ∪ Substring ∪ alias-name-coincidence; Edges weighted, Union-Find-Cluster, group-key-Filter (parent / primaryFactionId / sector); byte-identisch re-runnable.
- `scripts/consolidation-db-snapshot.ts` — versionierter Prod-DB-Pre-Mutation-Snapshot. Liest die Merge-Map, queryt alle berührten Reference-Rows + Junction-Refs + logische FKs (`factions.parent_id`, `characters.primary_faction_id`), schreibt ein selbsttragend-es Rollback-Artefakt.
- `scripts/consolidation-db-sync.ts` — DB-Sync mit `--plan` (read-only, schreibt Markdown-Dry-Run-Plan + stdout) und `--apply --confirm-go` (transaktional). Eine Postgres-Transaktion: Stage (i) Field-Retention-Spalten-Updates auf Keepers → Stage (ii) FK-Remap (`characters.primary_faction_id` für Faction-Merges) → Stage (iii) In-Tx-Verifikation (kein Junction / logischer FK zeigt mehr auf eine zu löschende ID) → Stage (iv) Deletes. Verifikations-Fehler ⇒ Rollback der gesamten Transaktion.
- `scripts/consolidation-pass.config.json` — dedizierte Pass-Config, **separat** von `scripts/resolver-pass.config.json` (letztere ist resolver-loop-generierter Per-Welle-Zustand). Trägt `aggregator.applyRange = w40k 1..57` für den Re-Apply.

Reference-JSON-Edits (über den Reference-Premerge-Snapshot abgesichert):

- `scripts/seed-data/locations.json` — `vigilus_s` Row entfernt.
- `scripts/seed-data/characters.json` — `magister_sek` Row entfernt; `anakwanar_sek.notes` per Field-Retention auf den Urdesh-Duology-Kontext gesetzt (vorher `null`).
- `scripts/seed-data/location-aliases.json` — `"Vigilus Core": "vigilus"` ergänzt.
- `scripts/seed-data/character-aliases.json` — `"Magister Sek": "anakwanar_sek"` ergänzt.

Dossier + Merge-Map + Snapshots + Dry-Run-Plan (alle unter `sessions/resolver-dossiers/`):

- `consolidation-pass-1-aggregator-output.md` — der deterministische Aggregator-Output (171 Zeilen, 15 Cluster).
- `consolidation-pass-1-dossier.md` — menschliche Audit-Sicht, pro Cluster Achse / IDs / Entscheidung / Evidenz / Field-Retention.
- `consolidation-pass-1-merge-map.json` — maschinenlesbare Entscheidungsquelle (Schema `consolidation-pass-merge-map-v1`); 2 Merges + 13 No-Merges. Der DB-Sync liest ausschließlich diese JSON, nicht das Markdown-Dossier.
- `consolidation-pass-1-reference-premerge-snapshot.json` — JSON-Side-Rollback-Artefakt, geschrieben **vor** der ersten Reference-JSON-Mutation.
- `consolidation-pass-1-db-snapshot.json` — DB-Side-Rollback-Artefakt, geschrieben **vor** dem Re-Apply.
- `consolidation-pass-1-dry-run-plan.md` — der Plan, der dem Maintainer am Gate vorlag.

Geschwister-Runbook + Session-Start-Routing-Callouts:

- `sessions/consolidation-pass-runbook.md` — schlanke, brief-freie ausführbare Spec analog zum Resolver-Pass-Runbook. Trägt achsen-sliced als Default, die 120k-Token-Grenze, die Snapshot-/Gate-/DB-Sync-Disziplin (Reference-Premerge-Snapshot → JSON-Edits → Dry-Run-Plan → Maintainer-Review-Gate → Prod-DB-Pre-Mutation-Snapshot → Re-Apply → DB-Transaktion → Post-Verify), die dedizierte Pass-Config und die Scope-Regel.
- `CLAUDE.md` — ein Consolidation-Pass-Session-Start-Callout ergänzt, analog zu den SSOT-Loop- / Resolver-Welle-Einträgen.
- `AGENTS.md` — derselbe Callout in englisch ergänzt.

## Decisions I made

- **Aggregator-Heuristik.** Vier Edge-Klassen kombiniert: (1) exact-normalized-name (NFKD-Decomposition + lower + punct-strip + achs-spezifischer honorific-strip), (2) Jaccard ≥ 0.5 auf honorific-gestrippten Tokens, (3) Substring-Relation, (4) alias-name-coincidence; plus Edge-Bonus auf shared group-key (parent / primaryFactionId / sector). Honorific-Sets pro Achse: Factions {the, house, clan, of}, Locations {the, sector, system}, Characters {ein großer Set inkl. inquisitor, lord, lady, sister, brother, chaplain, commander, magister, …}. Ergebnis für W40K: 15 Kandidaten — eine vernünftige Anzahl für Adjudikation in einem Phasen-Kontextfenster.
- **Achsen-sliced trotzdem in einem Kontextfenster gefahren.** Das W40K-Set ist klein genug (15 Kandidaten, alle Achsen zusammen), dass ein ungeslicter Lauf weit unter der 120k-Token-Grenze blieb. Im Report dokumentiert; das Runbook trägt den achsen-sliced Default für größere Sets (post-HH-Full-Corpus).
- **Field-Retention bei `magister_sek → anakwanar_sek`.** Keeper `anakwanar_sek` hatte `notes: null`, Mergee `magister_sek` trug die Urdesh-Duology-Kontextbeschreibung. Per Field-Retention-Regel die `notes` in die Keeper-Row übernommen, dabei leicht entkoppelt von der wellenspezifischen Pass-9-Selbstreferenz („Resolver-Pass 9 Phase 3 (7b spine): …" → „Anarch of the Sons of Sek, antagonist of Matthew Farrer's Urdesh duology …; cross-cluster appearance in Sabbat-Worlds-Crusade-Saga …; Consolidation-Pass 1 merge of magister_sek into anakwanar_sek."). Der Row ist jetzt cross-pass und reflektiert beide Saga-Auftritte.
- **Phantom-Row vs. echte Lore-Persona.** `vigilus_s` hatte name="Vigilus Core" mit Metadata, die mit dem canonical `vigilus`-Row inkonsistent war (sector=tempestus vs ultima, gx=520/520 vs 730/355) und auf die kein Override-File verwies. Klassifikation als Phantom-Row, der Mergee-Metadata wird in der Keeper-Row **nicht übernommen** (Field-Retention `fromMergee: []`). Der DB-Snapshot bestätigte die Klassifikation: 0 work_locations-Junctions referenzierten `vigilus_s`.
- **`gerontius_helmawr` vs `lord_helmawr` als no-merge.** Deliberate Split per Row-notes (classic-Imprint vs modern-Imprint Necromunda). Analoges Pattern zu `soul_drinkers` mit `tone='primaris_reboot_coexistent'`. Cross-Imprint-Personae werden im Schema absichtlich getrennt gehalten; im Dossier mit Verweis dokumentiert. Diese Regel auch im Runbook (§4) festgeschrieben.
- **Dedizierte Pass-Config statt resolver-pass.config.json wiederverwenden.** Letztere ist resolver-loop-generierter Per-Welle-Zustand; sie trägt heute zufällig `applyRange 1..57`, würde aber von der nächsten Resolver-Welle (HH) überschrieben. Die Konsolidierung darf nicht an Resolver-Fortschritt gekoppelt sein → eigene Config.
- **`run-phase4-apply.sh` unangetastet.** Das Skript nimmt den Config-Pfad bereits als `$1`-Argument und liest `aggregator.applyRange` daraus — keine Änderung nötig, der bestehende Resolver-Re-Apply-Pfad wird **shared**.
- **Maintainer-Review-Gate via AskUserQuestion + `--confirm-go`-Flag.** Das Gate hat zwei Sicherungen: (1) ich habe Dossier + Merge-Map + Dry-Run-Plan via `AskUserQuestion` (mit explizit ausgewiesener Mechanik-vs-Lore-Tier-Trennung) präsentiert und auf das Maintainer-Go gewartet; (2) das DB-Sync-Skript verweigert `--apply` ohne das `--confirm-go`-Flag, sodass ein versehentlicher Re-Run das Gate nicht versehentlich überspringt.
- **Bestehende Resolver-Skripte nicht in-place umgebaut.** Pro Out-of-Scope-Constraint des Briefs: `aggregate-surface-forms.ts`, `seed-resolver-extensions.ts`, `apply-override*.ts` blieben unverändert. Es gibt zwar konzeptuelle Überlappung mit `consolidation-aggregate.ts` (beide normalisieren Namen, beide arbeiten mit Aliasen), aber kein Refactor — die Resolver-Trias muss konstant grün bleiben, das war Priorität.
- **Co-Author-Trailer.** Nicht gesetzt (Memory-Regel: this repo verzichtet auf Claude-Co-Authoring).

## Verification

- `npm run resolver:next-wave` — meldet `{ "status": "w40k-complete" }` (Teil 1).
- `npm run test:apply-override-dry` — `missing resolved FK targets: 0`, `dangling JSON FK/alias refs: 0`, 57/57 Batches `clean`.
- `npm run test:resolver` — 287 passed, 0 failed.
- `npm run test:resolver-data` — alle 10 Integrity-Checks `ok`.
- `npm run test:resolver-coverage` — gelaufen; below-threshold rows sind data findings, keine fails.
- `npm run test:collection-refs` — 7/7 pass.
- `npm run lint` — 0 errors, 1 pre-existing Warning (custom-fonts in `src/app/layout.tsx`, unrelated).
- `npm run typecheck` — clean.
- `npm run brain:lint -- --no-write` — 0 blocking findings.
- `bash scripts/run-phase4-apply.sh scripts/consolidation-pass.config.json` — alle 57 Batches `applied: ok`, seed-resolver-extensions `ok`, seed-facets `ok`, `DONE`. Exit 0.
- DB-Sync-Transaktion (`--apply --confirm-go`) — exit 0; In-Tx-Verifikation passierte (post-Re-Apply zeigten 0 work_locations auf `vigilus_s` und 0 work_characters auf `magister_sek`).

**Junction-Counts (vor / nach Pass):**

| Tabelle | Pre | Post | Delta |
|---|---:|---:|---:|
| works | 565 | 565 | 0 |
| work_factions | 1903 | 1903 | 0 |
| work_locations | 733 | 733 | 0 |
| work_characters | 1220 | 1220 | 0 |
| work_collections | 147 | 147 | 0 |
| work_persons | 524 | 524 | 0 |
| work_facets | 11291 | 11291 | 0 |
| **factions** | **173** | **173** | **0** |
| **locations** | **225** | **224** | **−1** |
| **characters** | **345** | **344** | **−1** |
| facet_values | 86 | 86 | 0 |

Reference-Row-Delta: locations −1 (`vigilus_s` gelöscht), characters −1 (`magister_sek` gelöscht). Junction-Counts unverändert: die 2 work_characters-Junctions, die zuvor auf `magister_sek` zeigten, zeigen jetzt auf `anakwanar_sek` (Re-Apply remapped via neuen `"Magister Sek"`-Alias) — und das ist sauber ohne Kollision, weil kein Werk in den Junctions BEIDE Surface-Forms trug (sonst hätte sich `work_characters` per Merge um die kollidierende Kante verringert).

Aliases-Delta: `location-aliases.json` +1 (`Vigilus Core`), `character-aliases.json` +1 (`Magister Sek`).

**Field-Retention-Verifikation (Post-Sync, gegen JSON):**

- `locations.vigilus` (DB) == `locations.vigilus` (JSON) auf den DB-Sync-Skalar-Feldern (`sector_id='ultima'`, `gx=730`, `gy=355`, `lexicanum_url=null`) ✓. Kein Field-Retention-Update auf vigilus (Phantom-Row brachte nichts ein).
- `locations.vigilus.tags` (DB) `["ultramarines", "astra_militarum"]` ⊇ JSON `["ultramarines", "astra_militarum"]` ✓.
- `characters.anakwanar_sek` (DB) == `characters.anakwanar_sek` (JSON) auf `primary_faction_id='sons_of_sek'`, `lexicanum_url=null`, **`notes`** = der Urdesh-Duology-Merge-String ✓.

**Token-Budget:** Phase 0/1/2/3/4 alle deutlich unter 120k-Grenze gefahren — kein Split nötig. W40K-Set ist klein genug; der Default-axis-Slice greift erst beim post-HH-Full-Corpus.

## Open issues / blockers

Keine. Die Acceptance-Liste aus Brief 098 ist vollständig abgearbeitet:

- ✓ Aggregator deterministisch, byte-identisch re-runnable, gefiltert (keine Pairwise-Matrix).
- ✓ Adjudikations-Dossier mit Achse / IDs / Entscheidung / Evidenz / Field-Retention pro Cluster; flagged/no-merge zusätzlich im Impl-Report (oben unter „Decisions").
- ✓ Maschinenlesbare Merge-Map; DB-Sync liest ausschließlich diese JSON.
- ✓ Reference-JSON-Merges vollzogen; Aliase gefaltet; Field-Retention im Dossier adjudiziert.
- ✓ Maintainer-Review-Gate vor erster Prod-DB-Mutation; ausdrückliches Go („Go — beide Merges anwenden") im Session-Transkript.
- ✓ Re-Apply gegen dedizierte `scripts/consolidation-pass.config.json` grün; DB-Sync (Dry-Run-Plan → Snapshot → Re-Apply → Transaktion → Post-Verify) ohne Aborts.
- ✓ Reference-Premerge-Snapshot vor JSON-Edits; DB-Snapshot vor Re-Apply; beide selbsttragend für Rollback.
- ✓ Field-Retention DB-seitig synchronisiert (`anakwanar_sek.notes`), gegen JSON verifiziert.
- ✓ Neue `consolidation-*`-Skripte; bestehende Resolver-Skripte unangetastet; Resolver-Trias grün.
- ✓ `sessions/consolidation-pass-runbook.md` existiert, trägt achsen-sliced Default + 120k-Limit + Snapshot-/Gate-/DB-Sync-Disziplin.
- ✓ `CLAUDE.md` + `AGENTS.md` je ein Consolidation-Pass-Session-Start-Callout; sonst unverändert.
- ✓ Keine Phase über 120k.
- ✓ Trias + lint + typecheck + brain:lint grün.
- ✓ Dieser kanonische Impl-Report. Brief-Status auf `implemented` zu setzen (Cowork-Post-Merge-Pass im Koordinations-Worktree).

## For next session

Empirische Befunde aus dem ersten Lauf, die in den Brief für den Post-HH-Full-Corpus-Pass einfließen sollten:

- **Aggregator-Signal-Qualität.** Von 15 Kandidaten waren 2 echte Doubletten — Signal-Anteil ~13 %. Die größten Noise-Quellen: `sons of *` und `* of the emperor` (Token-Pair-Matches über semantisch sehr verschiedene Faction-Typen) und Vornamen-Substring-Coincidence (ivan / brielle). Für den Full-Corpus-Lauf könnte ein zusätzliches Negativ-Filter („head-token muss übereinstimmen oder eines muss honorific-status haben") Rauschen senken — aber Vorsicht, das könnte echte Doubletten verstecken. Empfehlung: erst empirisch über den Full-Corpus-Pass sehen, dann tunen.
- **Field-Retention war einfach.** In diesem Pass nur ein Fall (anakwanar_sek.notes), trivial — null vs string. Der Full-Corpus-Pass wird vermutlich mehr Konflikt-Felder zeigen (gx/gy bei zwei nicht-Phantom-Rows, primaryFactionId-Konflikte), und dann brauche ich für die manual-resolution-Tier eine eigene Schema-Variante in der Merge-Map.
- **`gerontius_helmawr` vs `lord_helmawr` deliberate split.** Lore-Decision sauber in den Row-Notes verankert — das Runbook §4 referenziert das Pattern. Für künftige cross-imprint-Splits wäre eine eigene Imprint-Annotation in den Reference-JSONs nice-to-have (statt sich auf Row-notes zu verlassen), aber out-of-scope hier.
- **DB-Sync-Output-Capture-Quirk.** Die `run_in_background`-Bash-Calls haben zweimal exit 0 ohne capture'd stdout geliefert — das DB-Sync-Skript hat sauber durchgelaufen (direkt per DB-Inspect bestätigt) und auch der DB-Snapshot. Future Devs sollten sich darauf nicht verlassen, sondern die produzierten Artefakte (DB-Snapshot-JSON, Dry-Run-Plan-MD) als Erfolgs-Signal nehmen.
- **Brief 094 § Cadence.** Ein finaler Post-HH-Full-Corpus-Konsolidierungs-Lauf bleibt eingeplant; ad-hoc-Zwischenläufe nach Bedarf. Das Runbook ist für beide bereit.

## References

- Brief 094 § Notes „Konsolidierungs-Pass — entschiedene Eckpunkte" (Pass-Typ-Entscheidung).
- Brief 098 § Goal / Teil 1 / Teil 2 / Acceptance (operative Spec dieses Laufs).
- `sessions/resolver-pass-runbook.md` (Form-Vorlage für `consolidation-pass-runbook.md`).
- `scripts/aggregate-surface-forms.ts` (Pattern-Muster für `consolidation-aggregate.ts`).
- `scripts/run-phase4-apply.sh` (Re-Apply-Pfad, shared).
- `scripts/seed-resolver-extensions.ts` (Asymmetrie-Spec für DB-Sync-Bedarf: factions upsert vs locations/characters insert-only).
- `src/db/schema.ts` (logische FKs `factions.parent_id` / `characters.primary_faction_id` ohne `references()`).
