---
session: 2026-06-29-172
role: architect
date: 2026-06-29
status: implemented
slug: podcast-weekly-maintenance
parent: 2026-06-29-171
links: [2026-06-28-170, 2026-06-29-171, 2026-06-30-171, 2026-06-09-133, 2026-06-14-151, 2026-06-27-168]
commits: []
---

# 172 - Podcast-Delta und Weekly-Orchestrierung

> **Eröffnet 2026-07-01 nach gemergtem Teil B** (171-Impl `sessions/2026-06-30-171-impl-per-book-ssot-migration.md`). Gegen die Impl-Reports 170 + 171 aktualisiert: der Buch-Korpus lebt jetzt **ausschließlich in `scripts/seed-data/books/<slug>.json`**, `db:sync` ist **9-schrittig** (Korpus = Schritt 2 `apply:book --all --mode post-retirement`; `apply:podcast --all` = Schritt 3, ein Tail), und die Batch-/Excel-/Loop-Maschinerie (`import:ssot-roster`, `db:apply-override`, `loop:next`, `run-ssot-loop.sh`) ist **retired**. Umsetzung im Batches-Worktree.

## Goal

Baue auf der Per-Buch-SSOT und targeted Applies aus Teil A/B die Wartungs-UX: `/add-podcast-episode`, `/add-podcast` und `/weekly-db-update`. Ziel ist ein maintainer-freundlicher, targetbarer Additions-Flow fuer neue Podcast-Episoden, neue Podcast-Shows und woechentliche Buch-/Podcast-Deltas.

## Preconditions

- Teil A (`2026-06-28-170`, PR #201) und Teil B (`2026-06-29-171`) sind gemergt.
- Dieser Brief ist bereits gegen beide Impl-Reports aktualisiert (siehe Kopfnotiz). Vor Start trotzdem den 171-Impl-Report (`sessions/2026-06-30-171-impl-per-book-ssot-migration.md`) querlesen — insbesondere den Abschnitt **„Teil-C (172) assumptions to revisit"** und die Consumer-Inventur-Tabelle; sie sind die maßgebliche Ausgangslage.
- Umsetzung im Batches-Worktree. `brain/**` und `sessions/README.md` nicht anfassen.

## Context

**Buch-Korpus (post-171).** Der gesamte Korpus lebt nur noch in `scripts/seed-data/books/*.json` (`book-v1`-Format). Buch-Promotion **läuft bereits** über den per-Buch-Pfad: `scaffold books/<slug>.json` → `npm run apply:book -- --slug <slug>`. `book-roster.json` + die 90 Override-Batches + `book-roster.extension.json` + `Warhammer_Books_SSOT.xlsx` sind **frozen Provenienz**; `import:ssot-roster`, `db:apply-override`, `loop:next`, `run-ssot-loop.sh` und `db:apply-scope` sind **retired** (CLIs verweigern mit per-Buch-Zeiger). `refresh-check.ts` liest bereits das effektive per-Buch-Roster (`loadEffectiveCorpusBooks()`), und `refresh/emit.ts`'s „Promote (Books)"-Text zeigt bereits auf `scaffold books/<slug>.json` → `apply:book -- --slug`. Teil C baut darauf auf — es reaktiviert **nichts** von der retirten Maschinerie.

**Apply-Ketten (post-171).** `db:sync` ist 9-schrittig: (1) `book-corpus-preflight`, (2) `apply:book --all --mode post-retirement` = **primärer Korpus-Schritt**, (3) `apply:podcast --all` = **Tail**, (4/5) audiobook-narrators + verify, (6/7) timeline + verify, (8/9) curation-overlay + verify. Podcast-Apply ist also ein Tail nach dem Korpus, kein Korpus-Schritt. `db:drift` ist ein read-only Health-Check (+ per-Buch/Podcast-`--verify`); der volle Korpus-Deep-Diff ist der Operator-Pfad `equiv:diff --db-snapshot`/`--compare` gegen eine disposable DB — **nicht** `db:drift` (Teil B hat das explizit so entschieden).

**Refresh-/Cron-Maschinerie aus Briefs 133/151/168 (unverändert):**

- `refresh:check` ist detection-only und schreibt seine Detektions-Artefakte (Report + Proposal) lokal unter `ingest/refresh/…`. `refresh:check:ci` ist die secret-freie CI-Variante.
- `refresh:audit-artifacts` ist read-only und prueft Podcast-Artefakt-DB-Drift lokal.
- `refresh:mark-reviewed` / `refresh:ignore-book` pflegen die Review-/Ignore-Cursor.
- Cron `.github/workflows/weekly-refresh.yml` oeffnet/aktualisiert einen Rolling-PR, CI bleibt detection-only (keine DB-Secrets).

**Podcast-Stand.** Vier Shows registriert in `scripts/seed-data/podcast-shows.json`; Extraktions-Artefakte liegen als `ingest/podcasts/<show>.extractions.json`. `apply:podcast` kennt heute `--all`, `--show <slug>` (einzelne Show; wirft bei unbekanntem Slug) und `--file <artifact>` (mutually exclusive zu `--show`/`--all`). CC-Direct-Tagging (`claude -p`-Subsessions, Brief 131/132) ist der bewährte Null-Kosten-Tagging-Pfad. Podcast-Promotion lief bisher oft full-show-orientiert; Teil C baut den **Delta-Pfad**, damit neue GUIDs nicht den Bestand neu taggen.

## Design

### Podcast-Delta

Delta-Pfad:

1. neue GUIDs je Show aus dem Detektions-Proposal (`refresh:check`) lesen;
2. Manifest nur fuer diese Episoden bauen;
3. cc-direct Tagging nur fuer diese Episoden fahren;
4. in bestehende `ingest/podcasts/<show>.extractions.json` mergen;
5. das Show-Manifest stabil neu assemblen;
6. targeted Apply: `apply:podcast -- --show <slug>` (verb existiert bereits) oder — falls ein Ein-Episoden-Delta ohne Full-Show-Reassembly gewuenscht ist — ein engeres neues Delta-Apply-Verb. Kein neuer Korpus-Schritt: Podcast-Apply bleibt ein Tail-analoges targeted Verb.

Unsichere Merges stoppen mit `needs-decision`: Prompt-Version, Source-Drift, GUID-Ambiguitaet, YouTube-Kanal-Beschaffung ohne belastbare Tooling-Faehigkeit. Kein Full-Show-Retagging und kein bestandsschrumpfendes `--limit N`.

### Maintainer-facing Commands

UX-Contracts:

```text
/add-podcast-episode <show-or-url> <episode-title-or-url>
/add-podcast <show-or-feed-or-channel-url>
/weekly-db-update
```

Repo-pruefbare Form: echte lokale Command-/Skill-Dateien, falls Tooling es erlaubt; sonst Runbook + npm-/TS-Scripts mit eindeutiger Ein-Befehl-Invocation. Namen oben sind der Contract; Aliase sind erlaubt, nicht Ersatz. (Präzedenz für den repo-lokalen Runbook-Stil: `scripts/runbooks/add-book-runbook.md` aus Teil A.)

`/add-podcast-episode`:

- Dup-Check gegen bestehende Artefakte und DB/Apply-Plan;
- Review-Gate;
- Delta-Tagging;
- Artefakt-Merge;
- targeted Apply nach DB-Write-Gate.

`/add-podcast`:

- neue Show/Feed/YouTube-Kanal registrieren (`podcast-shows.json`);
- passende Episoden beschaffen;
- Review-Gate;
- Delta-Tagging;
- Artefakt-Merge;
- targeted Apply nach DB-Write-Gate.

Wenn fuer ganze YouTube-Kanaele keine belastbare Beschaffung existiert, `needs-decision` statt improvisieren.

### Weekly-Orchestrierung

`/weekly-db-update` orchestriert:

1. Preflight: `test:refresh` + `refresh:audit-artifacts`;
2. frisches `refresh:check`;
3. Review-Gate: neue Buecher + Episoden knapp anzeigen;
4. Philipp entscheidet pro Item promote / ignore / defer;
5. promoted books -> per-Buch-File (`scaffold books/<slug>.json`) + `apply:book -- --slug <slug>`;
6. promoted episodes -> Podcast-Delta + targeted Podcast-Apply;
7. Cursors/Seen/Ignore aktualisieren (`refresh:mark-reviewed` / `refresh:ignore-book`);
8. Rolling-Cron-PR inspizieren und Empfehlung geben;
9. Dateien in CC-authored PR;
10. Zusammenfassung.

Manual-Add und Weekly bleiben getrennte UX. Gemeinsame Primitives sind gut, vermischte Invocation nicht. `/weekly-db-update` ist nicht fuer Einzelwuensche; dafuer gibt es `/add-book` (Runbook aus Teil A) bzw. `/add-podcast-episode`.

## What to build

1. Delta-Tagging/Merge-Pipeline fuer einzelne neue Podcast-GUIDs (mergt in `ingest/podcasts/<show>.extractions.json`, assembelt das Show-Manifest stabil neu).
2. Targeted Podcast-Apply-Invocation fuer einzelne Shows oder engeren Delta-Scope (baut auf dem vorhandenen `apply:podcast --show` auf; ein engeres Delta-Verb nur, wenn Ein-Episoden-Apply ohne Full-Show-Reassembly gebraucht wird).
3. `/add-podcast-episode` repo-lokal startbar oder eindeutig als Runbook+Script.
4. `/add-podcast` repo-lokal startbar oder eindeutig als Runbook+Script.
5. `/weekly-db-update` repo-lokal startbar oder eindeutig als Runbook+Script.
6. Refresh-Promote-Texte und Runbook sind fuer Buecher bereits auf den per-Buch-Pfad reconcilet (170/171) — fuer den **Podcast**-Delta-Pfad ergaenzen bzw. praezisieren, falls noetig; keine Rueckkehr zum Batch-/Extension-Pfad.
7. Cron wiederverwenden; nur bei echter Luecke minimal patchen und im Report begruenden.
8. Tests fuer Delta-Merge, Idempotenz, keine Bestandsschrumpfung, Duplicate-Guards, degraded/needs-decision-Faelle und Weekly-Orchestrierung. Die Podcast-Test-Suite (`test:podcast-apply`, `test:podcast-cc-direct`) erweitern statt duplizieren.

## Constraints

- CI bleibt detection-only; kein Auto-DB-Write aus GitHub Actions.
- Live-DB-Write nur nach Philipps ausdruecklicher Freigabe; Default bleibt Source-Files -> PR/Merge -> targeted Apply.
- Kein neuer metered `ANTHROPIC_API_KEY`-Pfad fuer Anreicherung (cc-direct-Tagging bleibt der Weg).
- Deltas taggen nur neue GUIDs und mergen in bestehende Artefakte.
- Kein Full-Show-Retagging als Default.
- Kein bestandsschrumpfendes `--limit N`.
- Existing Cron wiederverwenden.
- Manual-Add und Weekly getrennt halten.
- **`db:drift` bleibt read-only Health-Check + per-Buch/Podcast-`--verify`** (Teil-B-Entscheidung) — nicht zum wiederkehrenden Korpus-Deep-Diff ausbauen; der Deep-Diff bleibt der Operator-Pfad `equiv:diff --db-snapshot`/`--compare`.
- **Retirte Maschinerie nicht reaktivieren:** `import:ssot-roster`, `db:apply-override`, `loop:next`, `run-ssot-loop.sh`, `db:apply-scope` bleiben stillgelegt; `book-roster.json` + Batches + Excel bleiben frozen Provenienz.
- Buch-Promotion im Weekly laeuft ueber `books/<slug>.json` + `apply:book -- --slug`, nie ueber Batch/Extension/Import.
- Version-Policy: keine Version pinnen.
- Umsetzung im Batches-Worktree. `brain/**` und `sessions/README.md` nicht anfassen.

## Out of scope

- Per-Buch-Korpus-Migration oder Batch-Retirement (Teil B, bereits gemergt).
- Timeline/`book-dates` oder `curation-overlay` in per-Buch-Files einfalten.
- Audiobook-/Narrator-Credits in per-Buch-Files einfalten.
- DB-Schema-Redesign.
- Auto-Apply aus GitHub Actions.
- Voller Resolver-/Consolidation-Pass (die zugehoerigen Runbooks tragen seit Teil B LEGACY-Banner).
- Atlas-Regen, Brain-Rollups, `sessions/README.md`, Public UI, OFOB, faction-starters.

## Acceptance

- [ ] `/add-podcast-episode` fuehrt eine einzelne Episode ueber Dup-Check, Delta-Tagging, Artefakt-Merge und targeted Apply in die DB.
- [ ] `/add-podcast` registriert nach Review eine neue Show, reviewt/taggt passende Episoden und bringt sie targeted in die DB.
- [ ] Deltas taggen nur neue GUIDs und mergen in bestehende Artefakte; kein Full-Show-Retagging, kein bestandsschrumpfendes `--limit N`.
- [ ] Unsichere Merges inkl. YouTube-Kanal-Beschaffung stoppen mit `needs-decision`.
- [ ] `/weekly-db-update` orchestriert Preflight, frische Detection, Review-Gate, per-Item-Processing (Buecher via `apply:book --slug`, Episoden via Podcast-Delta), targeted DB-Writes, Cursor-Hygiene und PR-Zusammenfassung.
- [ ] Manual-Add und Weekly bleiben getrennte UX; sie teilen nur Primitives.
- [ ] Bestehender Cron wird wiederverwendet; CI bleibt detection-only; erneuter Lauf auf dieselben akzeptierten Items ist idempotent.
- [ ] Keine retirte Maschinerie reaktiviert; `db:drift` bleibt Health-Check.
- [ ] Kein neuer Codepfad nutzt `ANTHROPIC_API_KEY` fuer Anreicherung.
- [ ] Relevante neue Tests gruen; mindestens `npm run lint`, `npm run typecheck`, `npm run brain:lint -- --no-write` sofern lokal anwendbar.

## Open questions for report

- Welche repo-lokale Invocation-Form wurde fuer `/add-podcast-episode`, `/add-podcast`, `/weekly-db-update` gebaut?
- Wurde fuer den Ein-Episoden-Delta das vorhandene `apply:podcast --show` wiederverwendet oder ein engeres neues Delta-Verb gebaut? Warum?
- Welche Podcast-Delta-Edge-Cases stoppen mit `needs-decision`?
- Kann ein ganzer YouTube-Kanal sauber beschafft werden, oder braucht das einen Folgebrief?
- Welche Teile des bestehenden Weekly-Refresh-PR-Texts/Runbooks wurden fuer den Podcast-Delta-Pfad angepasst?

## Handover

1. Frischer Batches-Task-Branch, z. B. `codex/ingest-batches-podcast-weekly-maintenance`. (Dieser Brief liegt bereits in `sessions/` mit `status: open`.)
2. Vor Start den 171-Impl-Report querlesen — Abschnitt „Teil-C (172) assumptions to revisit" + Consumer-Inventur.
3. Impl-Report schreiben; diesen Brief im PR auf `implemented` setzen.
4. Nicht selbst mergen; Philipp merged.
