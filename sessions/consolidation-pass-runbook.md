# Consolidation-Pass Runbook — eine Phase

> **Mechanischer Task, keine normale Session.** Dies ist die ausführbare Spec für **genau eine** Phase eines axis-sliced Consolidation-Passes. Wer dieses Runbook, die Pass-Config (`scripts/consolidation-pass.config.json`) und das Achs-Paket der eigenen Phase gelesen hat, hat alles, was er braucht — sonst nichts. **Kein Brief** wird gelesen — weder Brief 094 noch Brief 098. Die Herkunft der Rationale (Briefs 094 / 098) steht im Anhang am Ende — für eine Phase ebenfalls nicht lesen.

## 0. Bedienung

Ein Consolidation-Pass ist eine Sequenz von Phasen-Subsessions: **Phase 0 (Aggregator) → Phase 1 (Factions) → Phase 2 (Locations) → Phase 3 (Characters) → Phase 4 (Maintainer-Gate + Re-Apply + DB-Sync + Verify)**. Je ein frischer `/clear`-Kontext, je **ein** Commit. Phasen laufen **strikt sequenziell** (Phase 4 setzt die Adjudikations-Edits aus Phase 1–3 voraus; ein Re-Apply vor der Adjudikation würde die alten Junctions wieder festschreiben).

Der Pass operiert nicht auf Büchern, sondern auf dem **Entitäten-Set** (die Reference-Rows in `factions.json` / `locations.json` / `characters.json`). Er ist wellengrößen-unabhängig, aber wegen des Token-Budgets per Default **axis-sliced**: jede Reference-Achse bekommt ihre eigene Sub-Session.

Der erste Lauf (W40K-Konsolidierung) war brief-getrieben über Brief 098. Ab dem zweiten Lauf ist der Pass per Default **brief-frei**: das Runbook, die Pass-Config und die per-Pass-Artefakte unter `sessions/resolver-dossiers/consolidation-pass-N-*` sind die vollständige Spec. **Ausnahme:** wenn ein per-Pass-Brief existiert und Pass-spezifische Deltas trägt, die das generische Runbook nicht abdecken (neue Aggregator-Heuristiken, Verify-Erweiterungen, Cap-Re-Tunes, Schema-Erweiterungen der Pass-Config), lesen **Phase 0** (Aggregator-Implementierung) und **Phase 4** (Verify, Re-Tune, DB-Sync-Vorbereitung) diesen Brief zusätzlich. **Phasen 1–3** (Adjudikation pro Achse) lesen ihn nie — reine Adjudikation gegen das Aggregator-Output. Der per-Pass-Brief sagt selbst explizit, ob und für welche Phasen er gelesen wird.

**Die Config (`scripts/consolidation-pass.config.json`) ist der Parameter-Träger.** Sie nennt: `pass` (z. B. `"consolidation-pass-1"`), `scope` (das Entitäten-Set), die Pfade zu Dossier / Merge-Map / Reference-Premerge-Snapshot / DB-Snapshot / Dry-Run-Plan, und `aggregator.applyRange` für den Re-Apply. Die Config ist **getrennt** von `scripts/resolver-pass.config.json` — letztere ist resolver-loop-generierter Per-Welle-Zustand und würde von der nächsten Resolver-Welle überschrieben.

## 1. Lese-Scope (die Anti-Bloat-Regel)

**Jede Phase liest NUR:**
- dieses Runbook,
- die Pass-Config (`scripts/consolidation-pass.config.json`) — Pfade zu Dossier / Merge-Map / Snapshots / Dry-Run-Plan,
- das **Achs-Paket der eigenen Phase** (siehe §3),
- ab Phase 1: das **Phase-0-Aggregator-Output** (die deterministische Kandidaten-Liste — die Quelle für die Adjudikation).

**Lies NICHT** — eine Phase braucht nichts davon, und es ist budget-kritisch:
- **Keinen Brief** — Brief 094 und Brief 098 sind Rationale. Die Herkunft steht im Anhang. (Ausnahme nach § 0 Bedienung: wenn ein per-Pass-Brief Pass-spezifische Deltas trägt, lesen Phase 0 + Phase 4 diesen einen Brief zusätzlich; Phasen 1–3 nicht. Der Brief sagt das selbst.)
- die **`manual-overrides-ssot-*.json`-Files** (~310k Token für W40K) — script-only, **nie** in den LLM-Kontext.
- **`scripts/seed-data/book-roster.json`** (~100k+ Token) — script-only, nie in den Kontext.
- die anderen Achs-Pakete (Phase 2 liest nicht `characters.json`, usw.).
- alte Resolver-Dossiers/-Reports im Volltext — nur **gezielte Snippets** als Strukturvorlage, nicht ganze Files.

**Fahre NICHT die Session-Start-Leseroutine** aus `CLAUDE.md` / `AGENTS.md`. Das ist eine mechanische Consolidation-Phase, keine normale Session. **Kein Co-Author-Trailer** im Commit.

## 2. Pass-Semantik

Der Consolidation-Pass **deduplicates** die Reference-Schicht — er kristallisiert keine neuen Rows. Pro Kandidaten-Cluster eine von drei Entscheidungen:

- **`merge`** — eine Canonical-Row wird behalten („keeper"), die andere(n) entfernt („mergee"); der entfernte Name (plus dessen Alt-Aliase) wird in `*-aliases.json` als Alias-Eintrag auf die Keeper-ID gefaltet. Bei **Faction-Merges** zusätzlich jede `parent` / `primaryFactionId` auf die Mergee-ID DB-seitig und JSON-seitig umbiegen, und einen etwaigen `faction-policy.json`-Eintrag mitziehen.
- **`no-merge`** — Lore-Evidenz zeigt distinkte Entitäten; im Dossier mit Begründung dokumentiert, in der Merge-Map mit leeren `removedIds` / FK-Remaps.
- **`flagged`** — Identitäts-Unsicherheit. **Lieber eine Dublette übersehen als zwei Entitäten falsch verschmelzen** (Brief 098 § Constraints). Im Dossier mit Hinweis dokumentiert, in der Merge-Map mit `decision: "flagged"`; der Maintainer kann die spätere Konsolidierungs-Welle damit nachholen.

**Field-Retention** — vor jedem Merge werden Non-ID/Name-Felder beider Rows verglichen. Felder, die nur die Mergee-Row trägt, wandern in die Keeper-Row; konfligierende Non-null-Werte werden im Dossier adjudiziert und gehen mit `policy: "fill-keeper-nulls-from-mergee"` oder einer expliziten `manual-resolution` in die Merge-Map. `tags` (Locations) ist davon ausgenommen — Mengen-Spalte, Union, nicht skalarer Konflikt.

**Resolver-Matching bleibt unverändert.** Der Consolidation-Pass-Aggregator darf Ähnlichkeits-Heuristiken (normalisierter Name + Jaccard ≥ 0.5 + Substring + alias-coincidence + group-key) für die **Kandidaten-Generierung** benutzen. Der Resolver selbst (Surface-Form → ID) bleibt direct-match → alias-lookup, kein Fuzzy, kein Slug-Match (Brief 049/072). Ein Merge fügt der Reference-Welt nichts Unscharfes hinzu — er faltet einen Namen als exakten Alias.

## 3. Die Phasen (Achs-Paket + Aufgabe + Halt)

### Phase 0 — Aggregator

- **Lies NUR:** Runbook + Config.
- **Achs-Paket (Write-Scope):** `scripts/consolidation-aggregate.ts` (deterministisch, byte-identisch re-runnable), die per-Pass-Aggregator-Output-Datei (z. B. `sessions/resolver-dossiers/consolidation-pass-N-aggregator-output.md`).
- **Tun:** `npx tsx scripts/consolidation-aggregate.ts > <aggregator-output-path>` laufen lassen. Der Output ist eine **gefilterte Kandidaten-Liste pro Achse** — keine Pairwise-Matrix (für 700+ Rows zu groß). Wird ein Cluster verdächtig: gezielter Grep in `factions.json` / `locations.json` / `characters.json` (Volltext-Read der JSONs nur dann, wenn der Cluster es wirklich braucht). Ein Commit.

### Phase 1 — Factions

- **Lies NUR:** Runbook + Config + Aggregator-Output + Achs-Paket.
- **Achs-Paket:** `scripts/seed-data/factions.json`, `faction-aliases.json`, `faction-policy.json`, das Dossier (Faction-Sektion), die Merge-Map (Faction-Merges), der Reference-Premerge-Snapshot.
- **Tun:** Pro Faction-Kandidaten-Cluster adjudizieren (`merge` | `no-merge` | `flagged`). Vor JSON-Edit den **Reference-Premerge-Snapshot** der berührten Rows + Aliase schreiben (Schritt 4 § Reference-Premerge-Snapshot). Bei Merge: Keeper behalten, Mergee entfernen, Mergee-Name als Alias falten, `parent` / `primaryFactionId` auf Mergee-ID umbiegen, `faction-policy.json`-Eintrag mitziehen, Field-Retention dokumentieren. **`npm run brain:lint -- --no-write` muss grün bleiben** — der Faction-Policy-Check sonst rot. Ein Commit.

### Phase 2 — Locations

- **Lies NUR:** Runbook + Config + Aggregator-Output + Achs-Paket.
- **Achs-Paket:** `scripts/seed-data/locations.json`, `location-aliases.json`, ggf. `sectors.json`, das Dossier (Location-Sektion), die Merge-Map (Location-Merges), der Reference-Premerge-Snapshot.
- **Tun:** Pro Location-Kandidaten-Cluster adjudizieren. Reference-Premerge-Snapshot vor JSON-Edit aktualisieren. Bei Merge: Keeper behalten, Mergee entfernen, Mergee-Name als Alias falten, Field-Retention (Skalar-Felder: `sector` / `gx` / `gy` / `lexicanumUrl`; `tags` per Union). Ein Commit.

### Phase 3 — Characters

- **Lies NUR:** Runbook + Config + Aggregator-Output + Achs-Paket. (⚠ `characters.json` ist die größte Reference-JSON — wenn die Phase die 120k-Grenze sprengt, weiter slicen.)
- **Achs-Paket:** `scripts/seed-data/characters.json`, `character-aliases.json`, das Dossier (Character-Sektion), die Merge-Map (Character-Merges), der Reference-Premerge-Snapshot.
- **Tun:** Pro Character-Kandidaten-Cluster adjudizieren. Reference-Premerge-Snapshot vor JSON-Edit aktualisieren. Bei Merge: Keeper behalten, Mergee entfernen, Mergee-Name als Alias falten, Field-Retention (`primaryFactionId` / `lexicanumUrl` / `notes`). Sonderfall: zwei deliberate-split-Rows (z. B. classic-vs-modern-Imprint, primaris-reboot-coexistent) **nicht mergen**; im Dossier als `no-merge` mit Verweis auf den Split-Grund dokumentieren. Ein Commit.

### Phase 4 — Maintainer-Gate + Re-Apply + DB-Sync + Verify

- **Lies NUR:** Runbook + Config + die fertige Merge-Map + den Reference-Premerge-Snapshot + (nach Snapshot-Lauf) den DB-Snapshot.
- **Achs-Paket:** `scripts/consolidation-db-snapshot.ts`, `scripts/consolidation-db-sync.ts`, `scripts/run-phase4-apply.sh` (unchanged, takes the consolidation config as `$1`), der per-Pass-Dry-Run-Plan, der Apply-Digest `ingest/.last-run/phase4-digest.md`, der Impl-Report.
- **Tun:**

  **(i) Dry-Run-Plan + Maintainer-Gate.** `npx tsx --env-file=.env.local scripts/consolidation-db-sync.ts --plan` ausführen — der Plan landet in `<dryRunPlan>` (config-Pfad). Maintainer-Review-Gate ansagen: Dossier + Merge-Map + Dry-Run-Plan dem Maintainer vorlegen, **mechanisch-eindeutige Merges und lore-tiefe Merges getrennt ausgewiesen** (Dry-Run-Plan tut das automatisch). **Stoppen und auf ausdrückliches Go warten** (kein `## Needs decision`-Bounce — session-interner Checkpoint). Vetoete Cluster: in Dossier + Merge-Map auf `no-merge` / `flagged` mit Maintainer-Begründung setzen (`removedIds` / FK-Remaps leer), die zugehörigen Schritt-4-JSON-Edits über den Reference-Premerge-Snapshot rückgängig machen.

  **(ii) Prod-DB-Pre-Mutation-Snapshot.** `npx tsx --env-file=.env.local scripts/consolidation-db-snapshot.ts` — **vor** dem Re-Apply (der ersten Prod-DB-Mutation). Der Snapshot landet in `<dbSnapshot>` (config-Pfad). Pairs with the Reference-Premerge-Snapshot für selbsttragend-en JSON+DB-Rollback.

  **(iii) Re-Apply.** `bash scripts/run-phase4-apply.sh scripts/consolidation-pass.config.json` — idempotenter Phase-4a-Re-Apply über `aggregator.applyRange` (delete-then-insert pro Junction). Resolver-Extensions werden geseedet (factions upsert, locations.tags union, characters insert-only). Nach diesem Schritt zeigt keine Junction mehr auf eine weggemergte ID (jede Surface-Form resolved über den neuen Alias auf die Keeper-ID).

  **(iv) DB-Sync-Transaktion.** `npx tsx --env-file=.env.local scripts/consolidation-db-sync.ts --apply --confirm-go` — eine einzige Transaktion: Field-Retention-Spalten der Keeper-Locations/-Characters DB-seitig auf den JSON-Stand setzen → FK-Remap (`characters.primary_faction_id` für Faction-Merges) → In-Transaktions-Verifikation (keine Junction / kein logischer FK zeigt noch auf eine zu löschende ID) → Delete der Mergee-Rows. Schlägt die In-Tx-Verifikation an: Rollback, kein Teil-Delete. Das `--confirm-go`-Flag ist die mechanische Spiegelung des Maintainer-Gos — ohne es verweigert das Skript den Apply.

  **(v) Post-Verify.** Die Stage-(iii)-Counts erneut aus dem Plan ableiten und gegen 0 prüfen. Trias grün ziehen: `test:apply-override-dry` (`dangling JSON FK/alias refs = 0`, `missing resolved FK targets = 0`), `test:resolver`, `test:resolver-data`, `test:resolver-coverage`, `test:collection-refs`, `lint`, `typecheck`, `brain:lint -- --no-write`. Keeper-DB-Row gegen Keeper-JSON-Row in den DB-sync-synchronisierten Feldern verifizieren (Locations: `sector` / `gx` / `gy` / `lexicanum_url`; Characters: `primary_faction_id` / `lexicanum_url` / `notes`). `tags` als Superset prüfen (`DB ⊇ JSON`).

  **(vi) Impl-Report.** Den finalen `sessions/resolver-dossiers/consolidation-pass-N-impl-report.md` (für brief-freie Läufe — der erste Lauf hat zusätzlich einen gepaarten `NNN-impl`-Report) aus Dossier + Merge-Map + Snapshots + Apply-Digest + Trias-Status polieren. Reference-Row-Deltas und Junction-Count-Verschiebungen dokumentieren.

  Ein Commit (oder mehrere, wenn die Trennung sauberer wird — z. B. Snapshot-Commit getrennt vom Sync-Commit).

## 4. Adjudikations-Disziplin

- **Identitäts-Unsicherheit → `flagged`, nicht `merge`.** Ein verpasster Merge ist Bookkeeping-Drift, die ein späterer Lauf einfängt; ein falscher Merge verschmilzt zwei reale Entitäten und ist nur schwer rückgängig zu machen.
- **Lore-Tiefe nutzen.** Mechanisch hoch-eindeutige Fälle (eine Row-Name ist exakt ein bekannter Alias oder eine triviale Schreibvariante der anderen, gleiche `primaryFactionId` / `parent`, Phantom-Row mit falscher Metadata) → mergen. Lore-tiefere Fälle (Titel vs. Eigenname, Beiname, Imprint-Split) → LLM-Adjudikation aus den Row-Daten, bei Bedarf ein Lexicanum-Lookup; im Dossier die Quelle dokumentieren.
- **Deliberate Splits respektieren.** Das Schema kennt absichtlich getrennte Rows für dieselbe Lore-Persona über Imprints / Continuity-Layer hinweg (z. B. `gerontius_helmawr` vs `lord_helmawr` — classic-vs-modern Necromunda-Imprint; Soul Drinkers' `tone='primaris_reboot_coexistent'`). Diese **nicht mergen**; im Dossier mit Verweis auf den Split-Grund als `no-merge` dokumentieren.

## 5. Phase-übergreifende Reihenfolge

Phasen 1–3 (Adjudikation pro Achse) laufen **strikt vor** Phase 4 — Phase 4 setzt die JSON-Edits + Reference-Premerge-Snapshot voraus. Innerhalb Phase 4 ist die Reihenfolge zwingend: **Gate → DB-Pre-Mutation-Snapshot → Re-Apply → DB-Sync-Transaktion → Post-Verify**. Ein vorgezogener Re-Apply würde die alten Junctions wieder festschreiben; ein vorgezogener Snapshot wäre keine saubere Pre-Konsolidierungs-Baseline (`run-phase4-apply.sh` mutiert die DB bereits über `seed-resolver-extensions` / `seed-facets`); ein DB-Sync vor Re-Apply würde an der In-Tx-Verifikation scheitern (Junctions zeigen noch auf zu löschende IDs).

## 6. Token-Budget — harte 120k-Grenze pro Phase

- Der Aggregator emittiert **nur die gefilterte Kandidaten-Liste**, niemals eine Pairwise-Matrix.
- Das Dossier trägt einen **Budget-Cap**: Richtwert max. ~40k Token bzw. eine begrenzte Kandidaten-Zahl pro Achse. Sprengt eine Achse den Cap, wird sie weiter gesliced.
- Default ist der **achsen-sliced Lauf** (Phase 0 → 1 → 2 → 3 → 4), jede Achse mit eigenem Kontextfenster.
- Override-Files / `book-roster.json` / `characters.json`-Volltext sind script-only; nur gezielte Greps oder schmale Tail-Reads.
- Zeichnet sich ab, dass eine Phase >120k Token braucht: **stoppen und splitten**, nicht „durchziehen". Ein Split ist kein Fehler — er ist die vorgesehene Reaktion.

## 7. Maintainer-Review-Gate

Der Pass hält **vor jeder Prod-DB-Mutation (Re-Apply eingeschlossen)** an einem expliziten Maintainer-Checkpoint. CC legt vor:

- das **Dossier** (`<dossier>`-Pfad in der Config) — die menschliche Audit-Sicht,
- die **Merge-Map** (`<mergeMap>`) — die maschinenlesbare Entscheidungsquelle,
- den **Dry-Run-Plan** (`<dryRunPlan>`) — die Vorschau auf die DB-Sync-Transaktion mit mechanisch-eindeutigen und lore-tiefen Merges getrennt ausgewiesen.

**Stoppen und auf ausdrückliches Go warten.** Session-interner Checkpoint, kein `## Needs decision`-Bounce — die Session bleibt offen. Vetoete Cluster: in Dossier **und** Merge-Map als `no-merge` / `flagged` mit Maintainer-Begründung stehen lassen (`removedIds` / FK-Remaps leer); JSON-Edits über den Reference-Premerge-Snapshot rückgängig machen. Die Merge-Map bleibt damit die vollständige, konsistente Entscheidungsquelle.

**Begründung:** Snapshots und die DB-Transaktion sichern nur den Rollback *nach* einem Fehler bzw. gegen mechanischen Halbzustand. Gegen einen semantisch falschen, aber mechanisch sauber committeten Merge sichert allein die menschliche Sichtung *vor* dem ersten DB-Write.

## 8. DB-Sync-Disziplin

- **Maschinenlesbare Merge-Quelle.** `scripts/consolidation-db-sync.ts` liest seine Entscheidungen ausschließlich aus der Merge-Map (`<mergeMap>`), nie aus dem Markdown-Dossier.
- **Eine Transaktion.** Field-Retention-Sync + FK-Remap + In-Transaktions-Verifikation + Delete laufen in **einer** Postgres-Transaktion. Bei Verifikations-Fehler: Rollback, kein Teil-Delete, kein orphaned Field-Retention-Update.
- **Logical-FK-Schutz.** `factions.parent_id` und `characters.primary_faction_id` sind logische, nicht DB-erzwungene FKs (kein `references()` im Schema). Die In-Tx-Verifikation prüft sie explizit vor dem Delete in derselben Transaktion — die DB fängt einen dangling Verweis nicht selbst ab.
- **Snapshot-Pflicht.** Ohne Reference-Premerge-Snapshot (vor JSON-Edits) und DB-Snapshot (vor Re-Apply) ist der Pass nicht rückrollbar. Beide Snapshots sind versioniert und persistiert; die Rollback-Prozedur steht im jeweiligen Snapshot-Artefakt selbst.

## 9. Commit-Regel

- Ein Commit pro Phase (auch Phase 4 — oder, wenn die Trennung sauberer wird, je ein Commit für Snapshot / Re-Apply / DB-Sync / Verify-Polish).
- Nur Pfade aus dem Phase-Scope anfassen.
- **Kein Co-Author-Trailer.** Commit-Message imperativ, z. B. `Consolidation-Pass 1 Phase 4 (Re-Apply + DB-Sync) — W40K Entity Set`.

## 10. Verifikation

Code-/Daten-berührende Phasen (1–3, 4) halten die Trias grün, bevor committet wird:
`npm run test:apply-override-dry` (`dangling JSON FK/alias refs = 0`, `missing resolved FK targets = 0`), `npm run test:resolver`, `npm run test:resolver-data`, `npm run test:resolver-coverage`, `npm run test:collection-refs`, `npm run lint`, `npm run typecheck`, `npm run brain:lint -- --no-write` (insbesondere für Faction-Merges, die `faction-policy.json` berühren).

Phase 4 Post-Verify zusätzlich: keine verwaiste Reference-DB-Row für eine gemergte ID, kein dangling FK, behaltene DB-Row spiegelt die behaltene JSON-Row in allen DB-sync-synchronisierten Feldern, `DB.locations.tags ⊇ JSON.locations.tags` für jede berührte Location-Keeper.

## Anhang — Herkunft (überspringbar, nur Background)

Die operative Spec hier konsolidiert die Rationale aus den Briefs 094 (headless Resolver-Loop + brief-freier Runbook — gleicher mechanischer Pass-Typ-Stil) und 098 (Konsolidierungs-Pass — Aggregator, Maintainer-Review-Gate, DB-Sync-Transaktion, Reference-Premerge-Snapshot, Prod-DB-Pre-Mutation-Snapshot, dedizierte Pass-Config, achsen-sliced 120k-Budget). Ein per-pass Architect-Brief existiert für Folgeläufe **nicht**; der erste Lauf (W40K-Konsolidierung) war als Brief 098 brief-getrieben und hat einen gepaarten `NNN-impl`-Report. Wer das Runbook fährt, liest **keinen** dieser Briefs.
