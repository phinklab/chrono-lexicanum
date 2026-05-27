---
session: 2026-05-27-102
role: architect
date: 2026-05-27
status: open
slug: hh-consolidation-pass
parent: 2026-05-25-098-arch-w40k-consolidation-pass
links:
  - 2026-05-25-098-arch-w40k-consolidation-pass
  - 2026-05-25-098-impl-w40k-consolidation-pass
  - 2026-05-26-100-arch-resolver-hh
  - 2026-05-26-101-arch-hh-forward-ref-guard-reason-split
  - resolver-pass-15-impl-report
commits: []
---

# HH-Konsolidierungs-Pass — Full-Corpus-Dedup (W40K + HH) + verify-pass-Out-of-Range-Digest

## Goal

Den **Konsolidierungs-Pass 2** über die jetzt datenkomplette Reference-Schicht (W40K + HH = 202 factions / 288 locations / 491 characters) fahren, mit dem expliziten Fokus auf die Cross-Era-Ausfall-Mode aus Brief 100 (eine HH-Welle legt eine neue Canonical-Row an, wo schon eine W40K-Row existiert, statt zu aliasen). Die Brief-098-Maschinerie (`scripts/consolidation-aggregate.ts`, `consolidation-db-snapshot.ts`, `consolidation-db-sync.ts`, `sessions/consolidation-pass-runbook.md`) trägt — diese Session ergänzt die HH-spezifischen Aggregator-Signale, fährt den Pass und faltet die Brief-101-Open-Question `verify-pass.ts`-Out-of-Range-Digest als kleinen Bolt-on dazu.

Das ist der „verpflichtende finale Konsolidierungs-Pass nach HH-complete", der in Brief 094 § Cadence schon als zweiter Lauf desselben Runbooks angekündigt war. Kein neuer Pass-Typ, keine Architektur-Erweiterung — operative Folgesession am Korpus-datenkomplett-Meilenstein.

## Context

Der Korpus ist datenkomplett: **859/859 (565 W40K + 294 HH)** in Postgres applied, der Resolver-Loop emittiert `all-complete` (PR #107, post-Pass-15). Über die fünf clean Two-Domain-Pässe 11–15 sind in die JSON-Reference-Schicht **+23 factions / +54 locations / +87 characters** gegen den Pass-10-Stand gewachsen; Stand nach dem letzten Re-Apply: `factions=202`, `locations=288`, `characters=491`. Die Junction-Counts liegen bei `work_factions=2752`, `work_locations=1144`, `work_characters=1992`, `work_collections=196`, `work_persons=785`, `work_facets=16845`.

Der W40K-Konsolidierungs-Pass (Brief 098, Pass 1, PR #102) hat die Maschinerie gebaut und über das damals trivial-gescopte W40K-Set gefahren: 15 Kandidaten-Cluster → **2 Merges** (`vigilus_s → vigilus`, `magister_sek → anakwanar_sek`) + 13 No-Merges + 0 Flagged. Reference-Premerge-Snapshot, Maintainer-Review-Gate, Prod-DB-Pre-Mutation-Snapshot, transaktionaler DB-Sync und Post-Verify liefen sauber; das Geschwister-Runbook (`sessions/consolidation-pass-runbook.md`) und der `CLAUDE.md`/`AGENTS.md`-Session-Start-Callout liegen. **Diese Brief-102-Session erfindet nichts neu, sie nutzt diese Maschinerie ein zweites Mal.**

Was diesen Lauf von Pass 1 unterscheidet, ist die **Cross-Era-Failure-Mode**, die der Pass-1-Scope strukturell nicht testen konnte: das Entitäten-Set enthielt zu Pass-1-Zeit keine HH-Loop-kristallisierten Rows. Über die HH-Wellen 10–15 ist die Cross-Era-Disziplin operativ gefahren worden (Brief 100 ADR `cross-era-identities.md`: eine Canonical-Row pro Identität über Eras hinweg, Era-Surface-Forms als Aliases). Die Pass-10–15-Reports melden den `factionsSkippedRedundant`-Bucket für Cross-Era-Hits konstant leer und keine echte Identitäts-Disambig getriggert — das ist das **Operator-Selbstreport-Signal**, dass die Disziplin gehalten hat. **Verifiziert** wird sie erst durch den Konsolidierungs-Aggregator, der den Full-Corpus-Bestand global auf Cross-Wave-Cross-Era-Dubletten scannt. Pass 1 erwischte 2/15 echte Doubletten ≈ 13% Signal-Anteil über neun gut-disziplinierte W40K-Wellen; ein analoger Effekt über sechs HH-Wellen plus die Cross-Domain-Schnittstelle ist nicht ausgeschlossen.

`scripts/consolidation-pass.config.json` (Pass-1) trägt `aggregator.applyRange = { domain: "w40k", from: 1, to: 57 }`. Pass 2 braucht eine eigene Config, weil der Re-Apply **die volle kumulative Range** abdecken muss (siehe Constraints) und die Pass-1-Artefakt-Pfade (`consolidation-pass-1-*`) historisch sind.

`scripts/verify-pass.ts` emittiert heute (post-Brief-090) einen fixed-size Post-Apply-Digest aus drei Blöcken: Smoke-Slug-Junction-Counts, Rating-Coverage, Audit-Replica OLD/NEW (`drift_works` / `gap_works` / `content_in_collection`). Was er **nicht** zeigt: die Zahl der Constituent-Edges in der Apply-Range, die als `out-of-range` deferred sind (Brief 101 Reason-Split). Brief 101 § Open questions stellt die Frage explizit: lohnt sich ein eigener Folge-Brief, oder reicht die `apply-override-dry`-Console-Reason-Breakdown-Zeile? An einem datenkompletten Korpus ist der Disziplin-Wert klar — die Out-of-Range-Zahl post-Apply *muss* 0 sein, weil jeder Constituent in-range ist; die Digest-Zeile ist ein billiger, dauerhafter Tripwire, der einen vergessenen Bootstrap-Folge-Apply oder einen versehentlich verkleinerten `applyRange` sichtbar macht. Drei bis fünf Zeilen Diff in `verify-pass.ts` — Disziplin-Wert > Aufwand. Wir falten das in diesen Brief statt es als eigenen Mini-Brief später zu machen.

Die HH-Wellen 10–15 haben den `EXPECTED_RANGES`-Cap einmal gehoben (`locations.max 1100 → 1500` in Pass 15, ~24% post-bump headroom). `factions.max=3200` trägt `work_factions=2752` mit ~14% headroom; `characters.max=2200` trägt `work_characters=1992` mit ~9% headroom — der tightest bound. Nach diesem Pass darf die Char-Range neu kalibriert werden; nach einem Merge ist die Zahl tendenziell etwas kleiner, der Headroom wächst entsprechend.

## Constraints

**Operativer Rahmen — die Brief-098-Maschinerie bleibt der Träger:**

- **Pass läuft strikt nach `sessions/consolidation-pass-runbook.md`.** CC liest dieses Runbook, die Pass-2-Config und die per-Phase-Achs-Pakete (§ 1 Lese-Scope) — **keinen** Brief; dieser Brief hier ist Architektur-Rahmen für den Maintainer, nicht operative Spec für die Phasen. Phase-Reihenfolge: Aggregator → Factions → Locations → Characters → Maintainer-Gate + Re-Apply + DB-Sync + Verify. Maintainer-Review-Gate vor jeder Prod-DB-Mutation (Runbook §7) — session-interner Checkpoint, ausdrückliches Go vor Re-Apply.

- **Token-Budget 120k pro Phase** (Runbook §6) ist scharf. Das Entitäten-Set ist post-HH ungefähr ~85% größer als bei Pass 1 (981 vs 743 Reference-Rows); die `characters.json`-Phase ist der wahrscheinliche Engpass und wird per Default achsen-sliced gefahren — wenn die Achse den Cap sprengt, weiter slicen (Runbook §6 § stop-and-split). Der Pass-1-Impl-Report (§ For next session) hat das als erwartetes Risiko benannt.

- **Snapshot-/Gate-/Transaction-Disziplin unverändert.** Reference-Premerge-Snapshot vor der ersten Reference-JSON-Mutation (Schritt 4); Prod-DB-Pre-Mutation-Snapshot vor dem Re-Apply (Schritt 5); DB-Sync läuft in einer einzigen Postgres-Transaktion mit In-Tx-Verifikation gegen logische FKs (`factions.parent_id`, `characters.primary_faction_id`). Skripte lesen ausschließlich die maschinenlesbare Merge-Map, nie das Markdown-Dossier.

- **Resolver-Matching-Semantik bleibt unverändert.** Der Aggregator darf neue Heuristiken einsetzen (siehe Scope); der Resolver selbst (Surface-Form → ID) bleibt direct-match → alias-lookup, kein Fuzzy, kein Slug-Match (Brief 049/072). Ein Merge faltet einen Namen als exakten Alias.

- **Identitäts-Unsicherheit → `flagged`, nicht `merge`.** Insbesondere für Cross-Era-Fälle, bei denen lore-Tiefe nicht eindeutig auflöst (Era-Spezifika einer Persona, die in einer Era anders aufgetreten ist): lieber eine Dublette stehen lassen als zwei reale Entitäten falsch verschmelzen. Brief-098-Constraint, hier nochmal scharf gemacht.

**Pass-2-spezifische Architektur-Calls (das neue Material dieses Briefs):**

- **Dedizierte Pass-2-Config.** Eine neue `scripts/consolidation-pass-2.config.json` (Name CC's Call, solange er aussagekräftig und vom Pass-1-Pfad disjunkt ist) trägt `pass: "consolidation-pass-2"`, `scope: "Full-Corpus (W40K + HH)"`, Pfade zu den Pass-2-Artefakten unter `sessions/resolver-dossiers/consolidation-pass-2-*`, und einen `aggregator.applyRange`, der den **vollen kumulativen Korpus** abdeckt: `w40k 1..57` **und** `hh 1..30`. Pass-1-Artefakte und Pass-1-Config bleiben unangetastet — historisch.

- **Re-Apply deckt beide Domänen ab.** Cross-Domain-Merges (HH-Row → W40K-Row oder umgekehrt) remappen Junctions **beider** Domänen; ein Re-Apply nur über eine Domäne ließe verwaiste Junction-Refs in der anderen stehen. Das Config-Schema (`aggregator.applyRange`) trägt aktuell genau **eine** `{domain, from, to}`-Range. CC entscheidet die Mechanik (Schema-Erweiterung auf eine Range-Liste, `domain: "all"`-Sentinel, zwei sequenzielle Skript-Aufrufe gegen je eine Range — was sauberer ist und das `run-phase4-apply.sh`-Skript unangetastet lässt). Acceptance: nach dem Re-Apply zeigt **keine** Junction in **keiner** Domäne mehr auf eine gemergte Reference-ID.

- **HH-aware Aggregator-Signale.** Die Pass-1-Heuristiken (exact-normalized-name + Jaccard ≥ 0.5 + Substring + alias-coincidence + group-key) bleiben Basis. Für Pass 2 sind drei HH-relevante Klassen explizit zu adressieren — alle drei sind **Aggregator-Signale**, nicht Auto-Merges; jede Treffer-Klasse landet als Kandidaten-Cluster im Dossier und wird normal adjudiziert (`merge` | `no-merge` | `flagged`):

  - **(a) Slug-Distance-Schwelle für HH-Lore-Schreibvarianten.** Beispiele aus dem HH-Korpus: `isstvan_v` / `istvaan_v` / `isstvan-v`, `prospero` vs. eine eventuell entstandene `prosperan`-Row, `calth` vs. `caltha`. Die heutigen Heuristiken erwischen das eventuell schon (NFKD + Jaccard), aber eine explizite Edit-Distance ≤ 2 auf normalisierten Lokations-Slugs als zusätzliches Edge-Signal stellt sicher, dass keine 1-Buchstaben-Schreibvariante durchrutscht. Threshold ist CC's Call — der Wert muss zur konkreten HH-Lore-Schreibvarianten-Landschaft passen und darf nicht so weit aufgehen, dass `vigilus` ↔ `vigil` als Kandidaten erscheinen.

  - **(b) Cross-Era-Anker-Paare als known-okay markiert.** Brief 100 § 4 + die `cross-era-identities.md`-ADR fixieren explizite Cross-Era-Anker: `luna_wolves → sons_of_horus`, `imperial_army → astra_militarum`, `mechanicum → mechanicus`, `lucius → lucius_the_eternal`, `ezekyle_abaddon → abaddon_the_despoiler` (die in den Pass-10-Aliases gelandet sind), plus die Primarchen mit Era-Beinamen. Das Pass-1-Aggregator-Output zeigte, dass solche Anker-Paare als Noise-Kandidaten ohnehin nicht aufgetaucht wären — sie sind ja schon Aliase, keine separaten Canonical-Rows. **Falls aber doch eine Row** mit Era-Suffix-Naming als getrennte Canonical-Row im Reference-Bestand auftaucht (etwa eine versehentlich angelegte `horus_lupercal_warmaster`-Row neben `horus`/`horus_lupercal`, oder eine HH-Welle, die `magnus_pre_change` separat von `magnus_the_red` kristallisiert hat) — das ist ein **High-Priority-Cluster**, der im Dossier explizit als „Cross-Era-Discipline-Breach-Suspect" markiert wird. Das ist die Mode, die Brief 100's `factionsSkippedRedundant`-Selbstreport zu prüfen sucht; der Konsolidierungs-Aggregator ist die unabhängige Verifikation.

  - **(c) Primarchen Pre-/Post-Heresy.** Pre-Heresy- und Post-Heresy-Personae derselben Primarchen-Persona (Horus / Magnus / Mortarion / Fulgrim / Angron / Lorgar / Perturabo / Konrad Curze / Alpharius / Omegon — die acht traitor primarchs plus loyalist primarchs mit Heresy-Auftritten) sollen pro Cross-Era-ADR **eine** Canonical-Row sein. Diese Persona-Klasse explizit als gewichtete Aggregator-Achse hinzunehmen: jede `characters.json`-Row, deren Name auf einem bekannten Primarchen-Stamm matcht, bekommt einen Edge-Bonus gegen andere Rows mit demselben Stamm. Pflegehinweis: die Primarchen-Liste ist endlich (18) und leicht im Aggregator zu pinnen, ohne dass es einer eigenen JSON braucht. CC's Call ob als Edge-Bonus oder als eigene Edge-Klasse mit eigenem Marker im Aggregator-Output.

- **Cross-Domain-Scan explizit.** Der Aggregator scannt den vollen Bestand (das tat er in Pass 1 bereits), und das Dossier weist Cross-Domain-Cluster (Kandidaten, deren Rows nachweislich aus unterschiedlichen Wellen-Eras stammen) **als eigene Sektion** aus — getrennt von W40K-only- und HH-only-Clustern. Begründung: am Maintainer-Review-Gate ist die Cross-Domain-Tier die wertvollste; Mechanik-Tier-Trennung (Brief-098-Pattern) wird um eine Era-Tier-Trennung ergänzt. Welche-Welle-hat-die-Row-angelegt ist ableitbar (HH-Reference-Rows wurden ab Pass 10 hinzugefügt — implementer kann das per Reference-JSON-Git-Blame oder per Pass-Dossier-Lookup grob bestimmen; sauberer wäre ein Marker, aber das ist out-of-scope für diese Session).

- **`EXPECTED_RANGES.characters.max` Re-Tune.** Nach dem Re-Apply und DB-Sync den finalen `work_characters`-Count lesen und `characters.max` auf einen Wert mit ~20–25% headroom setzen — passend zum Profil von `locations.max` (post-Pass-15 ~24% headroom) und `factions.max` (~14% headroom; dort ist der Cap historisch enger gesetzt). Den exakten Wert wählt CC anhand der Post-Apply-Zahl; im Impl-Report die Rechnung dokumentieren (alter Cap, alter Count, neuer Count, gewähltes Headroom-Prozent, neuer Cap). Datei: dieselbe, in der `EXPECTED_RANGES.locations.max` in Pass 15 von 1100 auf 1500 gehoben wurde (CC weiß das Pfad-Detail; nicht-pinnen). `factions.max` und `locations.max` bleiben unangetastet, solange die Post-Konsolidierungs-Counts dort innerhalb des bestehenden Headrooms liegen.

- **`verify-pass.ts`-Out-of-Range-Digest-Zeile.** Eine zusätzliche Digest-Zeile am Ende des Audit-Replica-Blocks (oder als eigener kleiner Block — CC's Call zur Position), die pro Apply-Range die Zahl der Constituent-Edges zählt, deren Constituent-Work zwar im Roster steht, aber außerhalb der Apply-Range liegt — also genau der `out-of-range`-Reason aus Brief 101 § `apply-override-collections.ts`. An einem datenkompletten Korpus (`applyRange = w40k 1..57 + hh 1..30`) muss diese Zahl **0** sein; jede Nicht-Null ist ein Tripwire, der einen verkürzten `applyRange` oder einen vergessenen Bootstrap-Folge-Apply sichtbar macht. Diff sehr eng halten — drei bis fünf Zeilen SQL plus ein `run`-Aufruf; **kein** Refactor von `verify-pass.ts`'s Block-Struktur, **kein** Touch an `loadConfig` oder dem CLI-Interface. Tests: ein neuer Case in der vorhandenen Test-Schicht ist nice-to-have, aber kein Acceptance-Punkt, solange die Digest-Zeile manuell gegen den Pass-2-Re-Apply verifiziert ist (Erwartung: 0).

- **Pass-1-Maschinerie nicht in-place umbauen — neue Heuristiken in `consolidation-aggregate.ts`.** Pass 1 hat `consolidation-aggregate.ts` als deterministischen, byte-identisch re-runnable Aggregator gebaut. Die HH-Heuristiken landen **dort** als zusätzliche Edge-Klassen / Edge-Boni — nicht als neues Skript daneben. Determinismus muss erhalten bleiben: zwei aufeinanderfolgende Aggregator-Läufe gegen den unveränderten Reference-Bestand müssen byte-identische Outputs liefern.

- **`brain:lint` grün.** Faction-Merges berühren ggf. `faction-policy.json` (`browseRoots` / `knownTopLevelExceptions`) — CC zieht den Eintrag mit um (Pass-1-Pattern). `npm run brain:lint -- --no-write` muss grün bleiben.

- **Keine Tool-Versionen pinnen, keine neuen Dependencies.**

- **Worktree.** Batches-Strang (`chrono-lexicanum-batches`). Frische `codex/ingest-batches-*`-Branch aus aktuellem `origin/main`; `main` read-only. Worktree-/Strang-/Branch-Selbstprüfung am Start ansagen (CLAUDE.md § Parallel worktrees).

- **Rollup-Ownership (Brief 095).** `brain/**` und `sessions/README.md` werden in dieser Session **nicht** angefasst — substantielle System-Fakten in den Impl-Report („What I did" / „For next session"); Cowork zieht sie im Post-Merge-Koordinations-Pass nach. Den `CLAUDE.md`/`AGENTS.md`-Session-Start-Callout für den Konsolidierungs-Pass-Typ hat Brief 098 schon platziert — **nicht erneut** anfassen.

## Out of scope

Implementer sind eifrig — diese Dinge bleiben **explizit unangetastet**:

- **Keine neue Resolver-Welle, kein neuer SSOT-Batch, kein neues Crystallizing.** Der Korpus ist datenkomplett (859/859); diese Session konsolidiert, sie ergänzt nicht.
- **Keine Schema-Migration**, kein Touch an `src/db/schema.ts` / `src/db/migrations/`. Harter Blocker → `## Needs decision`-Stop. Der DB-Sync ist davon ausdrücklich ausgenommen (siehe Runbook §8 — Daten-Eingriff, kein Schema-Eingriff).
- **In-Place-Umbau bestehender Resolver-Skripte.** `aggregate-surface-forms.ts`, `seed-resolver-extensions.ts`, `apply-override*.ts` bleiben unverändert; `consolidation-aggregate.ts` / `consolidation-db-snapshot.ts` / `consolidation-db-sync.ts` werden um die HH-Heuristiken erweitert, **ohne** ihr deterministisches/idempotentes Verhalten zu ändern. Resolver-Trias (`test:resolver` / `test:resolver-data` / `test:resolver-coverage`) muss grün bleiben.
- **Pass-1-Artefakte (`consolidation-pass-1-*`).** Historisch, bleiben unangetastet.
- **`scripts/consolidation-pass.config.json` (Pass-1).** Bleibt — neue Config ist `scripts/consolidation-pass-2.config.json` (oder analoger sprechender Name).
- **`run-phase4-apply.sh`** bleibt unverändert (nimmt die Config als `$1` — auch wenn der Re-Apply zwei Domänen abdeckt, ist die Lösung in der Pass-Config oder im Wrapper, nicht im Shell-Skript).
- **`verify-pass.ts`-Refactors über die eine Digest-Zeile hinaus.** Block-Struktur, CLI-Interface, `loadConfig`-Signatur, Rating-/Smoke-/Audit-Replica-Blöcke bleiben unangetastet.
- **`scripts/seed-data/cross-era-identities`-Datei o. ä.** anlegen — die Primarchen-Liste lebt im Aggregator-Code (endlich, klein); keine neue JSON-Quelle nötig.
- **Override-Files inhaltlich umschreiben, neue Bücher resolven, Anthology-Constituent-Edges außerhalb der Apply-Range adressieren.** Der Re-Apply ist idempotent über den bestehenden Korpus; deferred Anthology-Constituent-Edges sind über Pässe 11–15 cumulativ materialisiert (`work_collections=196`), ihre weitere Materialisierung ist nicht Aufgabe dieses Passes.
- **UI / Audit-Cockpit / App-Routen, V2-Pipeline (`src/lib/ingestion/**`), Public-Page-Rating-Render, Cockpit-Drift-Tie-Group-Sub-Sortierung.** UI-Posten gehören an den Product-Strang / Brief 096; explizit nicht in diesem Brief.
- **OQ (3) Hand-Check-Workflow, OQ (13) Crawl-Simplification-Sichtung** — bleiben in der Open-Questions-Queue, hier **nicht** adressiert. Gleiche Begründung wie in Brief 098 § Notes.
- **`CLAUDE.md` / `AGENTS.md`.** Der Konsolidierungs-Pass-Session-Start-Callout liegt seit Brief 098 — **nicht erneut** anfassen.
- **Audit-Cockpit-Drift/Gap-Follow-up** für die kumulativ ~148 drift_works + ~98 gap_works über die HH-Domain (Pass-15-Forecast). Eigener späterer Data-Quality-Brief; nicht hier.

## Acceptance

Die Session ist fertig, wenn:

- [ ] **Pass-2-Config existiert** als `scripts/consolidation-pass-2.config.json` (oder vergleichbar benannter Pfad, im Impl-Report dokumentiert): `pass: "consolidation-pass-2"`, `scope` benennt „Full-Corpus (W40K + HH)", Artefakt-Pfade zeigen auf `sessions/resolver-dossiers/consolidation-pass-2-*`, `aggregator.applyRange` deckt sowohl `w40k 1..57` als auch `hh 1..30` ab (die konkrete Schema-Form ist CC's Call). Pass-1-Config bleibt unangetastet.

- [ ] **Aggregator emittiert HH-aware Kandidaten** — `scripts/consolidation-aggregate.ts` trägt die drei in Constraints § HH-aware Aggregator-Signale benannten Klassen ((a) Slug-Distance ≤ N auf normalisierten Locations-Slugs, (b) Cross-Era-Anker-Paar-Marker, (c) Primarchen-Pre-/Post-Heresy-Edge-Bonus) und bleibt determinitisch / byte-identisch re-runnable. Aggregator-Output unter `sessions/resolver-dossiers/consolidation-pass-2-aggregator-output.md`.

- [ ] **Dossier + Merge-Map mit Cross-Domain-Sektion.** `consolidation-pass-2-dossier.md` und `consolidation-pass-2-merge-map.json` (Schema-Erweiterung erlaubt, solange Pass-1-Konsumenten nicht brechen) weisen Cross-Domain-Cluster (HH-Row × W40K-Row) als eigene Sektion neben W40K-only- und HH-only-Clustern aus. Pro Cluster Achse / IDs / Entscheidung (`merge` | `no-merge` | `flagged`) / Evidenz / ggf. Field-Retention. `flagged`- und `no-merge`-Cross-Domain-Fälle zusätzlich im Impl-Report zusammengefasst.

- [ ] **Maintainer-Review-Gate passiert** — CC hat Dossier + Merge-Map + DB-Dry-Run-Plan vor der ersten Prod-DB-Mutation vorgelegt, **mechanisch-eindeutige / lore-tiefe / Cross-Era-Discipline-Breach-Suspect-Cluster getrennt ausgewiesen**, und ist erst auf ausdrückliches Maintainer-Go weitergefahren. Vetoete Cluster: in Dossier + Merge-Map als `no-merge`/`flagged` mit Maintainer-Begründung (Pass-1-Pattern). Vorlage und Freigabe im Impl-Report.

- [ ] **Reference-Premerge-Snapshot + Prod-DB-Pre-Mutation-Snapshot** liegen als selbsttragende JSON-Artefakte unter `sessions/resolver-dossiers/consolidation-pass-2-{reference-premerge-snapshot,db-snapshot}.json`. Rollback-Prozedur im Impl-Report (analog Pass 1).

- [ ] **Re-Apply deckt beide Domänen ab** — nach dem Re-Apply zeigt keine Junction in `work_factions` / `work_locations` / `work_characters` / `work_collections` / `work_persons` mehr auf eine gemergte Reference-ID, **weder in der W40K- noch in der HH-Range**. Die Mechanik (Schema-Erweiterung, Sentinel, zwei sequenzielle Apply-Aufrufe) ist im Impl-Report dokumentiert.

- [ ] **DB-Sync-Transaktion** läuft nach Pass-1-Pattern (Field-Retention-Spalten-Updates → FK-Remap → In-Tx-Verifikation → Delete) in einer einzigen Postgres-Transaktion; bei In-Tx-Verifikations-Fehler Rollback ohne Teil-Delete. `--confirm-go`-Flag bleibt scharf.

- [ ] **Post-Verify grün:** `npm run test:apply-override-dry` hält `dangling JSON FK/alias refs = 0` und `missing resolved FK targets = 0`; keine verwaisten Reference-DB-Rows für gemergte IDs; behaltene DB-Rows tragen die Field-Retention-Metadaten (gegen die Reference-JSONs verifiziert); `DB.locations.tags ⊇ JSON.locations.tags`. Junction-Counts vor/nach im Impl-Report dokumentiert und erklärt.

- [ ] **`EXPECTED_RANGES.characters.max` ist re-tuned** auf einen Wert mit ~20–25% headroom relativ zum Post-Konsolidierungs-`work_characters`-Count. Die Rechnung (alter Cap, alter Count, neuer Count, gewähltes Headroom-Prozent, neuer Cap) steht im Impl-Report. `factions.max` und `locations.max` bleiben unangetastet, solange die Post-Konsolidierungs-Counts dort innerhalb des bestehenden Headrooms liegen — im Impl-Report kurz bestätigt.

- [ ] **`verify-pass.ts`-Out-of-Range-Digest-Zeile gelandet** und manuell gegen den Pass-2-Re-Apply verifiziert: an `applyRange = w40k 1..57 + hh 1..30` liefert die Zeile `0`. Diff in `verify-pass.ts` eng (Größenordnung 3–5 Zeilen SQL + ein `run`-Aufruf); kein Refactor der Block-Struktur, kein Touch an CLI / `loadConfig`. Wert im Impl-Report dokumentiert.

- [ ] **Volle Resolver-Trias grün**: `npm run test:resolver`, `npm run test:resolver-data`, `npm run test:resolver-coverage`, `npm run test:apply-override-dry`, `npm run test:collection-refs`.

- [ ] `npm run lint`, `npm run typecheck`, `npm run brain:lint -- --no-write` grün.

- [ ] **Keine Phase über die 120k-Token-Grenze gegangen**; falls eine Phase weiter gesliced wurde (erwartete Engpass-Achse: `characters.json` post-HH), hält der Report fest, wo und warum.

- [ ] **Brief-098-Maschinerie unverändert in den Out-of-Scope-Punkten:** `aggregate-surface-forms.ts`, `seed-resolver-extensions.ts`, `apply-override*.ts`, `run-phase4-apply.sh`, `consolidation-pass.config.json` (Pass-1), `consolidation-pass-1-*`-Artefakte; `CLAUDE.md` / `AGENTS.md` über den existierenden Konsolidierungs-Pass-Callout hinaus.

- [ ] **Kanonischer Impl-Report** unter `sessions/2026-05-27-102-impl-hh-consolidation-pass.md` — verpflichtend (sessions-format § Naming; analog Pass 1). Per-Pass-Artefakte unter `sessions/resolver-dossiers/consolidation-pass-2-*` existieren zusätzlich, ersetzen den gepaarten Report nicht. Brief-Status auf `implemented` (Cowork-Post-Merge-Pass im Koordinations-Worktree, Rollup-Ownership Brief 095).

- [ ] **Stop-before-push**: Branch nicht gepusht, kein PR, bis Philipp `fertig` / `PR erstellen` sagt.

## Open questions

Inputs für den nächsten Architekten-Schritt, keine Blocker:

- **Wie viele Cross-Domain-Dubletten findet der Pass?** Das ist das empirische Signal dafür, wie stark die Cross-Era-Disziplin über die sechs HH-Wellen tatsächlich gehalten hat. Pass 1 fand 2/15 ≈ 13% Signal-Anteil über neun gut-disziplinierte W40K-Wellen; der HH-Lauf hatte deutlich engere Cross-Era-Aliase-Pflege im Voraus (Brief 100 Runbook §4 + Pass-10-Hand-off) — der erwartete Anteil ist niedriger. Eine Null-Cross-Domain-Findung wäre starke Validierung der ADR; jeder Treffer ist ein Lerngewinn fürs Runbook.

- **Welche der drei HH-Heuristik-Klassen trugen, welche produzierten nur Rauschen?** Wenn (a) Slug-Distance fast nur false positives liefert, ist die Schwelle wahrscheinlich zu locker; wenn (c) Primarchen-Edge-Bonus nichts triggert, ist die Cross-Era-Disziplin auf der Primarchen-Achse 100% — beides ist Lerngewinn für ein etwaiges drittes Lauf-Runbook-Refinement.

- **`work_characters`-Re-Tune-Headroom.** Welches Headroom-Prozent CC tatsächlich wählt — Pass-15 hat 24% bei Locations gewählt, factions liegt bei 14%; 20–25% ist die hier vorgeschlagene Range. Empirisch ist die Frage, ob HH-spätere Wellen-Reste (es gibt keine mehr; Korpus ist komplett) oder ein finaler Polish-Pass eine engere Bound bräuchte. CC's Empfehlung im Impl-Report ist hilfreich für künftige Caps-Tunings.

- **Verify-Pass-Digest-Zeile — Position und Spaltenform.** Direkt am Ende des Audit-Replica-Blocks (als zusätzliche Spalte oder als eigene Sub-Query) oder als eigener kleiner Block am Ende des Digests — CC's Call. Im Impl-Report kurz dokumentieren, wo und warum.

- **Token-Budget-Verhalten auf der gewachsenen `characters.json`-Achse.** Pass 1 hatte ein ungeslictes Set unter 120k; Pass 2 ist ~42% größer in `characters.json` (491 vs 345 Rows). Hat die Achse die Grenze gerissen? Wenn ja, wie wurde gesliced? Die Antwort prägt das Runbook für künftige Re-Konsolidierungen.

## Notes

- **Parent ist Brief 098.** Dieser Brief erfindet keine neue Architektur — er fährt die Brief-098-Maschinerie ein zweites Mal, mit drei HH-aware Aggregator-Erweiterungen, einer Config für den vollen Korpus und einem kleinen `verify-pass.ts`-Bolt-on. Brief 094 § Cadence hatte einen verpflichtenden finalen Pass nach HH explizit vorgesehen — das ist er.

- **Keine UI-Oberfläche → kein „Design freedom"-Abschnitt** (analog Brief 091/093/094/098 — reine Maschinerie).

- **Brief 101 § Open questions ist gefaltet.** Die `verify-pass.ts`-Out-of-Range-Digest-Frage landet hier als kleiner Bolt-on (Constraints + Acceptance), statt einen eigenen Mini-Brief später dafür zu machen. Disziplin-Wert > Aufwand, datenkompletter Korpus ist der natürliche Erst-Test (Erwartung: 0).

- **Cross-Era-ADR (`brain/wiki/decisions/cross-era-identities.md`) bleibt Modellierungs-Anker.** Findet Pass 2 echte Cross-Domain-Doubletten, ist das *Disziplin-Drift*, kein ADR-Versagen — der ADR sagt, wie die Welt aussehen soll, der Konsolidierungs-Pass ist das Werkzeug, das die Welt dort hinbringt. Im Impl-Report festhalten, falls ein „HH-domain post-consolidation hardened: <date>"-Halbsatz im ADR fällig wird; Cowork zieht ihn im Post-Merge-Koordinations-Pass nach (Brief-095-Rollup).

- **Form-Vorlagen liegen alle im Repo:** `sessions/consolidation-pass-runbook.md` (die ausführbare Spec für den Pass-Typ), `scripts/consolidation-aggregate.ts` (Pass-1-Deterministic-Aggregator als Erweiterungs-Basis), `scripts/consolidation-db-sync.ts` (Pass-1-Transaktions-Skript), `scripts/consolidation-pass.config.json` (Pass-1-Config als Vorlage für die neue Pass-2-Config), `sessions/resolver-dossiers/consolidation-pass-1-{dossier.md,merge-map.json,reference-premerge-snapshot.json,db-snapshot.json,dry-run-plan.md,aggregator-output.md}` (Pass-1-Artefakt-Muster), Pass-1-Impl-Report unter `sessions/2026-05-25-098-impl-w40k-consolidation-pass.md` (operatives Vorbild inkl. Tabellen-Form und Field-Retention-Doku). Keine Code-Skizzen in diesem Brief nötig.

- **Cadence post-102.** Mit diesem Pass ist der Brief-094-§-Cadence-Bogen geschlossen: verpflichtender finaler Pass nach HH ✓; ad-hoc-Zwischenläufe nach Bedarf, brief-frei via Runbook. Der nächste Architekten-Brief nach diesem ist freier — der natürliche Folge-Stoff ist der Audit-Cockpit-Drift/Gap-Follow-up für die kumulativ ~148 drift_works + ~98 gap_works über die HH-Domain (siehe `project-state.md` § What's open), aber das ist eine eigene Session.

- **Open-Questions-Queue.** OQ (3) Hand-Check-Workflow und OQ (13) Crawl-Simplification-Sichtung werden hier bewusst **nicht** gefaltet — gleiche Begründung wie in Brief 098: OQ (13) ist einen eigenen mittelgroßen Hygiene-Brief wert, OQ (3) ist auf Aktualität zu prüfen (post-CC-Direct-Curation womöglich superseded). Beide bleiben in `open-questions.md`.

- **Übergabe-Modus.** Normaler Batches-Strang-Modus: Stop-before-push, ein PR auf `fertig`. Der PR trägt die `consolidation-pass-2-*`-Artefakte, die Reference-JSON-Edits, die Aggregator-/Config-/Verify-Pass-Diffs und den Impl-Report. Zusätzlich der session-interne Maintainer-Review-Gate-Checkpoint vor dem Prod-DB-Prune (Pass-1-Pattern, Runbook §7): CC pausiert dort, legt Dossier + Merge-Map + DB-Dry-Run-Plan vor und fährt erst auf ausdrückliches Go weiter.
