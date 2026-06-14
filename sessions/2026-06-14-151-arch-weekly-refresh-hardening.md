---
session: 2026-06-14-151
role: architect
date: 2026-06-14
status: open
slug: weekly-refresh-hardening
parent: null
links:
  - 2026-06-03-122
  - 2026-06-09-133
  - 2026-06-12-148
  - 2026-06-12-149
commits: []
---

# Weekly-Refresh Hardening — operativer Preflight, bevor der Cron Standardprozess wird (Board 122-B10-Nachzug)

## Goal

Der wöchentliche `weekly-refresh`-Cron (Board 122-B10, shipped in 133/148) soll **vertrauenswürdiger Standardprozess** werden: er läuft einmal pro Woche unbeaufsichtigt, öffnet **einen** Rolling-PR, und Philipp gibt Claude/Codex danach nur noch **einen fertigen Prompt** — der bereits im PR steht. Vier Reifegrad-Lücken stehen dem heute im Weg; dieser Brief schließt sie. **Reine Detection — kein DB-Write aus CI, keine Prod-Mutation.** Dieser Brief ist der von Philipp gewünschte Vor-Brief; er sollte **vor** [149](./2026-06-12-149-arch-curation-foundation.md) implementiert werden, weil er den Wochen-Rhythmus erst belastbar macht.

## Context

- Die Detection läuft (`.github/workflows/weekly-refresh.yml` → `refresh:check:ci`), schreibt bei Findings `ingest/refresh/<week>/{report.md,proposal.json}` und öffnet/aktualisiert den Rolling-PR auf `automation/weekly-refresh`; `report.md` ist der **PR-Body** (`body-path`). Runbook: `scripts/runbooks/weekly-refresh-runbook.md`.
- **Vier Befunde (Codex + Cowork-Verifikation am 2026-06-14):**
  1. **Kein PR-Prompt.** Der PR-Body (`report.md`) endet mit einer „Promote"-Stichpunktliste, aber es gibt keinen copy-paste-fertigen Review-Prompt. Philipp muss den Auftrag jedes Mal selbst formulieren.
  2. **Podcast-Duplicate-Falle.** `scripts/refresh/podcast-diff.ts` difft Live-Feed-GUIDs gegen das committete Artefakt `ingest/podcasts/<slug>.json` — **nicht** gegen die DB. Ist eine Episode schon in der DB (`apply:podcast`), aber das Artefakt nicht nachgezogen (Artefakt *hinter* DB), taucht sie wieder als „neu" auf. Es gibt einen Fail-Soft-Guard (fehlendes Artefakt → `failed`, nie „alles neu"), aber **keinen Artefakt-↔-DB-Drift-Check**.
  3. **Cursor-Lifecycle unreif.** `ingest/refresh/curation-state.json` und `ingest/refresh/book-seen.json` existieren **lokal nicht** (nur `book-ignore.json` ist committed). Jede Show fällt damit auf die Baseline (`2026-01-01`) zurück, Bücher re-detecten potenziell jede Woche. Die `refresh:mark-reviewed`-Werkzeuge existieren und schreiben deterministisch sortiert — aber der Anfangszustand wurde nie gebootstrappt/committed.
  4. **Outage sieht aus wie Ruhe.** `proposalHasFindings` (in `scripts/refresh/emit.ts`) ist `false`, wenn Bücher `unreachable` **und** alle Shows `failed` sind. Der Workflow behandelt das als `noop` → **schließt den Rolling-PR** (`gh pr close --delete-branch`). Ein Totalausfall aller Quellen ist heute ununterscheidbar von einer echten ruhigen Woche und **schließt den PR**.

## Constraints

- **Detection-only bleibt hart.** `refresh:check:ci` importiert weiter **keinen** DB-Client, braucht **kein** Anthropic-/Supabase-Secret, schreibt **nichts** in Postgres/Excel/Roster. Der `add-paths: ingest/refresh/**`-Guardrail im Workflow bleibt.
- **DB-Crosscheck nur lokal.** Jeder Check, der die DB liest (Befund 2), läuft ausschließlich im lokalen Pfad mit `--env-file` (wie `refresh:check`), **nie** im CI-Pfad (`refresh:check:ci`). CI bleibt artefakt-only. Mach diese Trennung im Code explizit (eigener npm-Script bzw. Flag, das ohne DB-Env laut/sauber abbricht statt CI rot zu färben).
- **Keine Prod-Mutation.** Dieser Brief schreibt **nicht** die DB: kein `db:migrate`, kein `db:apply-override`, kein `db:rebuild`, kein Live-Cleanup. Der Drift-Audit ist **read-only** (nur `SELECT`).
- **Determinismus erhalten.** `proposal.json` bleibt timestamp-frei (Rolling-PR thrashed nicht). Neue committed State-Files (`curation-state.json`, `book-seen.json`) werden deterministisch (Slugs/Titel sortiert) serialisiert — sie liegen schon so vor, beim Bootstrap beibehalten.
- **Offline testbar.** Jede Verhaltensänderung (Degraded-Klassifikation, PR-Prompt im Report, Drift-Audit-Logik) ist über `npm run test:refresh` (`scripts/test-refresh.ts`, kein Netz, keine DB) mit injizierten Fakes abgedeckt.

## Tasks

### 1. Copy-paste-fertiger Review-Prompt im PR-Body
`buildReportMarkdown` (`scripts/refresh/emit.ts`) hängt einen klar abgegrenzten Prompt-Block an `report.md` an (reiner String, kein IO). Inhalt sinngemäß — der Reviewer-Agent soll:
- diesen Weekly-Refresh-PR prüfen, Kandidaten **entscheiden/promoten/ignorieren** (Bücher → `book-roster.extension.json`; Ignore → `refresh:ignore-book`; Podcasts → `ingest:podcast`/`apply:podcast`),
- nach Review **`refresh:mark-reviewed -- --books` bzw. `-- --show <slug>`** laufen lassen (nach Merge — siehe Sequencing-Trap im Runbook),
- die **Prod-DB nur bei ausdrücklicher Bestätigung** durch Philipp anfassen; ohne explizite Freigabe bleibt es bei Roster-/Override-/State-Datei-Änderungen + PR.
Der Block ist deterministisch (keine Run-Zeit darin außer der ohnehin schon vorhandenen `generatedAt`-Zeile). Konkrete Befehle/Pfade so weit drin, dass der Prompt allein aus dem PR ableitbar ist.

### 2. Podcast-Artefakt-↔-DB-Drift sichtbar machen (read-only, lokal)
Ein **read-only** Audit (neuer npm-Script, z. B. `refresh:audit-artifacts`, oder ein `--verify-artifacts`-Modus des lokalen `refresh:check`) vergleicht pro Show die GUID-Menge des committeten Artefakts `ingest/podcasts/<slug>.json` gegen die DB (`episode_guid` der jeweiligen Show). Report beider Differenzen, mit klarer Gewichtung:
- **DB \ Artefakt** (Episode in DB, nicht im Artefakt) = die **gefährliche** Menge → würde als „neu" re-detecten. Laut melden.
- **Artefakt \ DB** (Artefakt voraus) = harmlos, nur informativ.
Rein `SELECT`, keine Schreibpfade. Doku: als Preflight im Runbook verankern („vor dem Vertrauen auf den Wochenlauf einmal `refresh:audit-artifacts` lokal grün ziehen"). Optional, wenn billig: wenn der **lokale** `refresh:check` (DB-Env vorhanden) läuft, eine Drift-**Warnung** in den Report aufnehmen — CI bleibt unberührt.

### 3. Cursor-Lifecycle härten
- **Bootstrap + commit** des Anfangszustands: `ingest/refresh/curation-state.json` (alle registrierten Shows auf einen bewussten Cursor — Baseline `2026-01-01` oder den real reviewten Stand, deine Begründung in den Report) und `ingest/refresh/book-seen.json` (mindestens valides leeres Schema, idealerweise der heute schon gesichtete Backlog). Ohne diese committeten Files ist der Wochen-Delta unzuverlässig.
- **Commit-Freundlichkeit verifizieren:** `refresh:mark-reviewed -- --books` und `-- --show <slug>` müssen nach Review einen **kleinen, deterministischen, eindeutig committbaren** Diff erzeugen (sortiert, stabil). Falls heute nicht der Fall (z. B. Reihenfolge-Jitter), glattziehen.
- **Sequencing-Trap** (mark erst nach Merge/Fetch des PR) im Runbook **und** im PR-Prompt (Task 1) sichtbar machen.

### 4. Outage ≠ Ruhe
Ein **Quellen-Ausfall** darf nicht still als „alles klar → PR schließen" durchgehen. Unterscheide:
- **Genuine noop** — alle Quellen gesund (`books.status==='ok'`, alle Shows `ok`/`skipped`) **und** keine Findings → wie heute: PR schließen.
- **Degraded** — ≥1 Quelle `unreachable`/`failed` **und** keine frischen Findings → PR **nicht** schließen; CI-Warnung/Annotation emittieren, bestehenden Rolling-PR offen lassen.
Mechanik frei (z. B. drittes `REFRESH_RESULT=degraded` Token; Workflow überspringt den Close-Step bei `degraded`), aber die Garantie „Totalausfall schließt den PR nicht" muss offline testbar sein. `noop`/`findings`/`degraded` bleiben alle Exit 0 (nur ein echter Bug ist Exit 1). Wenn auf `degraded` kein Proposal geschrieben wird (heute schreibt `refresh:check` nur bei Findings), ist „Close-Step überspringen + Warnung" das Minimum — keinen leeren PR erzwingen.

## Out of scope

- **Kein On-Merge-Auto-Apply** — die DB-Schreibgrenze bleibt maintainer-getrieben (Runbook § „On-merge auto-apply" — deferred bleibt deferred).
- **Keine neue Quelle** (kein prose+LLM-Fallback für den Book-Tracker; das ist ein eigenes Follow-up im Runbook).
- **Kein Identity-Firewall-Tuning** (Subtitle-/Edition-Drift bleibt der dokumentierte v1-Recall-over-Precision-Tradeoff; das Human-Gate fängt es).
- **Keine Hand-Override-Mechanik** — das ist [149](./2026-06-12-149-arch-curation-foundation.md).

## Acceptance

The session is done when:

- [ ] `report.md` (= PR-Body) enthält einen copy-paste-fertigen Review-Prompt mit der „Prod-DB nur bei ausdrücklicher Bestätigung"-Klausel und den Mark-Reviewed-Schritten.
- [ ] Ein read-only `refresh:audit-artifacts` (o. ä.) existiert, meldet pro Show die DB-↔-Artefakt-Drift (DB \ Artefakt laut), läuft **nur** mit DB-Env und **nie** im CI-Pfad; im Runbook als Preflight dokumentiert.
- [ ] `ingest/refresh/curation-state.json` + `ingest/refresh/book-seen.json` sind gebootstrappt + committed; `refresh:mark-reviewed -- --books` / `-- --show <slug>` erzeugen kleine, deterministische, committbare Diffs (im Report demonstriert).
- [ ] Totaler Quellen-Ausfall wird als `degraded` (o. ä.) klassifiziert, schließt den Rolling-PR **nicht**, und ist in `test:refresh` mit injizierten Fakes abgedeckt.
- [ ] `refresh:check:ci` schreibt nachweislich weiterhin keine DB / kein Secret nötig; `add-paths`-Guardrail unverändert.
- [ ] `npm run test:refresh` + `npm run lint` + `tsc --noEmit` grün. **Keine** Prod-DB-Mutation in dieser Session.

## Open questions

- Bootstrap-Cursor für `curation-state.json`: Baseline-Datum für alle Shows, oder pro Show der real gesichtete Stand? (Deine Empfehlung + Begründung in den Report — billig zu ändern, also lieber konservativ als zu aggressiv vorrücken.)
- Drittes `REFRESH_RESULT`-Token vs. ein Flag am `findings`/`noop`-Wort: was hält den Workflow-Sed am robustesten (der Parser ist heute greedy, `path=` muss letztes Token bleiben)?

## Notes

- Strang: Batches (`chrono-lexicanum-batches`), Branch `codex/ingest-batches-weekly-refresh-hardening` o. ä.; Code → PR.
- Reihenfolge: **151 vor 149.** Beide sind Batches-Strang (sequentiell auf demselben Worktree), aber technisch unabhängig (151 fasst `emit.ts`/`podcast-diff`/`curation-state`/Workflow an; 149 baut einen neuen Overlay-Tail). 151 zuerst, weil es den Wochen-Rhythmus belastbar macht, den Philipp jetzt will — und den der große Buch-Reviewer (B11) später als Findings-Lieferant braucht.
