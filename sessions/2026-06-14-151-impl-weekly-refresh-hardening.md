---
session: 2026-06-14-151
role: implementer
date: 2026-06-14
status: complete
slug: weekly-refresh-hardening
parent: 2026-06-14-151
links:
  - 2026-06-12-149
commits: []
---

# Weekly-Refresh Hardening — operativer Preflight, bevor der Cron Standardprozess wird

## Summary

Alle vier Reifegrad-Lücken aus Brief 151 geschlossen, **detection-only, ohne Prod-DB-Mutation**: der PR-Body trägt jetzt einen copy-paste-fertigen Review-Prompt, ein Totalausfall aller Quellen wird als `degraded` klassifiziert und schließt den Rolling-PR **nicht** mehr, `curation-state.json` + `book-seen.json` sind gebootstrappt + committed, und ein read-only `refresh:audit-artifacts` macht Podcast-Artefakt-↔-DB-Drift lokal sichtbar. Wichtigster Fakt für Cowork: der CI-Pfad (`refresh:check:ci`) bleibt nachweislich DB-frei — der einzige DB-lesende Teil (der Audit) ist ein separater, nur-lokaler npm-Script, der ohne `DATABASE_URL` sauber mit Exit 0 abbricht.

## What I did

- `scripts/refresh/emit.ts` — **Task 1**: `reviewPromptSection()` hängt einen abgegrenzten ```text```-Prompt-Block an `report.md` (= PR-Body) an — deterministisch (nur `isoWeek` interpoliert), mit der „Prod-DB nur bei ausdrücklicher Bestätigung"-Klausel, den Mark-Reviewed-Schritten und dem Sequencing-Trap (mark nach Merge). **Task 4**: neue pure `classifyRefreshRun()` → `findings | degraded | noop`.
- `scripts/refresh-check.ts` — **Task 4**: ersetzt das binäre `proposalHasFindings` durch die Drei-Wege-Klassifikation; `noop`/`degraded` schreiben kein Proposal (kein leerer PR), beide Exit 0; Output-Contract-Doku um `REFRESH_RESULT=degraded` ergänzt.
- `.github/workflows/weekly-refresh.yml` — **Task 4**: parst das `kind`-Wort (findings/degraded/noop) und gated die Steps über `steps.detect.outputs.result`; `degraded` emittiert eine `::warning::`-Annotation und überspringt **sowohl** Open- als auch Close-PR — der bestehende Rolling-PR bleibt offen. `add-paths: ingest/refresh/**` unverändert.
- `ingest/refresh/curation-state.json` — **Task 3**: alle 4 Shows auf Baseline `2026-01-01` gebootstrappt (via `refresh:mark-reviewed -- --all --date 2026-01-01`).
- `ingest/refresh/book-seen.json` — **Task 3**: 2026-W24-Backlog (30 Titel) gebootstrappt (via `refresh:mark-reviewed -- --books`).
- `scripts/refresh/artifact-audit.ts` *(neu)* — **Task 2**: pure Set-Diff-Logik (`auditArtifactDrift`, `hasDangerousDrift`), DB-frei, offline getestet.
- `scripts/refresh-audit-artifacts.ts` *(neu)* — **Task 2**: read-only Orchestrator (nur `SELECT`); Env-Guard **vor** dem DB-Client-Import (dynamischer Import), ohne `DATABASE_URL` Exit 0; Exit 1 nur bei gefährlicher Drift (DB \ Artefakt).
- `package.json` — neuer Script `refresh:audit-artifacts` (`tsx --env-file=.env.local …`, lokal-only).
- `scripts/test-refresh.ts` — +13 Tests (degraded-Klassifikation inkl. skipped≠degraded, PR-Prompt-Präsenz + DB-Klausel + Sequencing, Drift-Audit beide Richtungen + missing-artifact). 65 grün.
- `scripts/runbooks/weekly-refresh-runbook.md` — Audit als Preflight verankert; degraded-Verhalten + die zwei gebootstrappten State-Files dokumentiert.

## Decisions I made

- **`degraded` = ≥1 Quelle down (nicht nur „Totalausfall")**, exakt nach Task-4-Definition: Buchquelle `unreachable` **oder** irgendeine Show `failed`, und keine frischen Findings. Begründung: das ist die sichere Richtung — wäre auch nur eine Quelle still ausgefallen, darf die Woche nicht als „alles ruhig → PR schließen" durchgehen (genau die „Outage sieht aus wie Ruhe"-Falle). `skipped` (YouTube ohne Key) zählt als gesund, nicht degraded.
- **Drittes `REFRESH_RESULT=degraded`-Token** (statt eines Flags am `noop`-Wort) — Antwort auf die Open Question: robuster, weil der Workflow das `kind`-Wort mit **einem** simplen `[a-z][a-z]*`-sed zieht und die greedy `books=`/`pending=`/`path=`-seds nur noch im `findings`-Zweig laufen. `path=` bleibt letztes Token; degraded/noop tragen gar keine Tokens.
- **Bootstrap-Cursor: Baseline `2026-01-01` für alle Shows** (konservativ, nicht aggressiv vorrücken). Wirkungsgleich zum heutigen Empty-File-Fallback, aber jetzt als committeter, echter High-Water-Mark — ein Vorrücken auf „heute" würde echte, nie reviewte neue Folgen unterdrücken. `book-seen.json` mit dem 2026-W24-Backlog, damit die ~30 Standing-Bücher nicht jede Woche den PR neu anführen (genau der Zweck des Cursors).
- **Audit ist ein eigener npm-Script, kein Modus von `refresh:check`** — hält den Detection-Pfad sauber DB-frei. Die optionale Drift-Warnung im lokalen `refresh:check`-Report habe ich **bewusst weggelassen** (im Brief als „optional, wenn billig" markiert): sie hätte DB-Code in den Detection-Pfad gezogen und die „CI ist artefakt-only"-Invariante verwässert.
- **Audit Exit 1 bei DB \ Artefakt** — damit „lokal grün ziehen" eine echte Pass/Fail-Bedeutung hat. Läuft nie im CI, also färbt das CI nie rot.

## Verification

- `npm run test:refresh` — **65 passed, 0 failed** (deckt degraded-Klassifikation, PR-Prompt-Präsenz, Drift-Audit-Logik offline ab).
- `npm run typecheck` (`tsc --noEmit`) — pass.
- `npm run lint` (`eslint .`) — pass.
- Task 3 Determinismus demonstriert: ein `--show lorehammer`-Mark erzeugt einen **1-Zeilen-Diff**; ein anschließendes `--all --date 2026-01-01` stellt das File **byte-identisch** wieder her (leerer Diff).
- Audit-Guard manuell: `env -u DATABASE_URL … refresh-audit-artifacts.ts` → Hinweis + **Exit 0** (kein DB-Import, CI-safe).
- `refresh:check:ci` bleibt DB-frei: kein `@/db/client`-Import in `scripts/refresh-check.ts` oder `scripts/refresh/**` (grep-verifiziert; der einzige DB-Reader ist der separate, lokal-only Audit).
- **Keine** Prod-DB-Mutation in dieser Session.

## Open issues / blockers

Keine. Die DB-lesende Verifikation des Audits gegen die echte Postgres (statt nur des Env-Guards) braucht `DATABASE_URL` + Netz und ist bewusst dem Maintainer überlassen — `npm run refresh:audit-artifacts` lokal laufen lassen, bevor dem Wochenlauf vertraut wird.

## For next session

- Der Audit ist read-only und nur lokal; ein „On-merge auto-apply" bleibt deferred (Runbook § PR2) — unverändert.
- Die im Brief erwähnten Follow-ups (prose+LLM-Fallback für den Book-Tracker, Identity-Firewall-Tuning) bleiben out of scope und im Runbook getrackt.
- Brief 149 (Kurations-Overlay) ist der nächste Batches-Schritt — 151 hat den Wochen-Rhythmus jetzt belastbar gemacht.

## References

- Brief: `sessions/2026-06-14-151-arch-weekly-refresh-hardening.md`
- Runbook: `scripts/runbooks/weekly-refresh-runbook.md`
