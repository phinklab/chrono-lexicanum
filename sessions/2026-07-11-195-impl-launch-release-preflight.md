---
session: 2026-07-11-195
role: implementer
date: 2026-07-11
status: complete
slug: launch-release-preflight
parent: null
links:
  - 2026-07-11-194
  - 2026-07-10-193
commits: []
---

# OQ-19-Preflight — Release-Reihenfolge vor S1a kanonisieren

## Summary

OQ 19 ist vollständig geschlossen: alle vier Release-Reihenfolge-Widersprüche sind entschieden (A1–A6 + B1–B3, von Philipp am 2026-07-11 als „beides bestätigt" abgenommen) und widerspruchsfrei in `docs/launch-master-plan.md` + `docs/launch-session-prompts.md` festgeschrieben. Nächster Schritt ist **S1a (Code-PR)** auf `codex/ingest-batches-snapshot-exporter` — ohne Architektur-Raten; diese Session hat **keine Code-, DB-, Deploy- oder Revalidation-Aktion** ausgeführt (reiner Koordinations-/Dokumentationspass).

## What I did

- `docs/launch-master-plan.md` — die vorgefundene uncommitted Vorarbeit (S1a-Zweiteilung, Era-Invariante, Exporter-Seam, Manifest-Determinismus, package.json-Ausnahme, 0015-Paritäts-Check) verifiziert und erweitert: E4 präzisiert (Revalidation = expliziter, fail-loud Post-Deploy-Befehl, nie automatisch aus `db:sync`); § S3a umbenannt (Release-Revalidation), Punkt 3 (Credential-Trennung = Zielbild, Consumer-Wechsel explizit S3b) und Punkt 5 (kein Auto-POST nach `db:sync`; expliziter Post-Deploy-Befehl, manueller curl für Releases vor S3a) neu gefasst, „Fertig wenn" angepasst; § S3b um Punkt 5 „Runtime-DB-Cutover" ergänzt (Übergangs-Fallback `RUNTIME_DATABASE_URL` → `DATABASE_URL`, vier Schritte, zwei Maintainer-Haltepunkte) inkl. „Fertig wenn" und Titel; Launch-Readiness: PR-Schnitt-Absatz (B3) + Punkt 6 („nur Runtime-Credential in Produktion"); Changelog-Punkt 9 korrigiert; der Nachtrag-Satz „OQ-19-Punkte 2–3 bleiben offen für einen S3a-Preflight" durch die getroffenen Entscheidungen ersetzt.
- `docs/launch-session-prompts.md` — Statustabelle (S3a-Titel; S3b-Titel + Voraussetzung „S0 (E6) + S3a"); S3a-Prompt (Release-Revalidation statt Apply-Hook, keine src/**-Änderung, Verifikation ohne Produktions-POST); S3b-Prompt (Cutover-Kernpunkt 5 mit beiden Haltepunkten, Fallback-Verifikation); S1a-Snapshot-Prompt (Punkt 6: Revalidation nie vor dem Deploy); Launch-Readiness-Prompt (B3: Protokoll = Koordinations-PR, getrennt vom Snapshot-PR). Die S1a-(Code-PR)- und S1a-Snapshot-Prompts der Vorarbeit gegen A1–A6 geprüft — konsistent, keine Nachschärfung nötig.
- `brain/wiki/open-questions.md` — OQ 19 auf einen knappen Abschlussvermerk reduziert (Queue jetzt leer); Session 195 als Quelle ergänzt.
- `brain/wiki/project-state.md` — Preflight-Absatz unter „Launch programme"; „Open now" auf die Operator-Checks reduziert; „Next action" = 195-PR mergen → S1a (Code-PR); stale „local working plan"-Formulierung korrigiert.
- `brain/wiki/worklist.md` — § A: OQ-19-Zeile von „still open" auf „closed (Session 195)" mit Kurzfassung der Sequenz.
- `brain/wiki/log.md` — Ingest-Eintrag 2026-07-11 (Session 195).
- `sessions/README.md` — Head auf `013c955` (PR #240); OQ-19-Bullet; 195-Zeile in der Thread-Tabelle; „Next" = S1a (Code-PR).
- `sessions/2026-07-11-195-impl-launch-release-preflight.md` — dieser Report.

## Decisions I made

**Bestätigte Entscheidungen (Philipp, 2026-07-11 — Teil A als Sammelbestätigung, Teil B einzeln vorgelegt):**

- **A1 — S1a-Release-Schnitt:** Code-PR ohne Produktions-Writes; nach Merge + Content-Freeze + explizitem Go genau ein `npm run db:sync`; „S1a-Snapshot" liefert Artefakte + Manifest auf frischem Branch (`codex/ingest-batches-initial-snapshot`); der Snapshot-PR ist der Deploy (E4); erst danach Revalidation + Live-Smoke. Kein produktiver Write mit ungemergtem Code.
- **A2 — Era-Semantik:** echte M41-Bücher behalten `time_ending` (44 von 97 book-dates-Einträgen mit `startY` in [41000, 42000) — exakt gegen die Daten verifiziert); verboten ist nur der undatierte Pauschalstempel; ohne Setting-Date ⇒ `NULL`; Acceptance = Dateninvariante, kein Literal-Grep; Curation-Overlay bleibt letzter Tail.
- **A3 — package.json-Ausnahme:** S1a (Code-PR) ergänzt ausschließlich den `snapshot:regen`-Eintrag; keine Dependency, kein package-lock-Diff.
- **A4 — Manifest-Determinismus:** Timestamp-Carry-forward bei inhaltlich identischem Export; Content-Hash je Datenartefakt, Manifest hasht sich nicht selbst; Repo- und DB-Migrationskopf werden erfasst und müssen übereinstimmen.
- **A5 — Exporter-Seam:** scripts-seitige, fail-closed Read-Projektionen; Typen aus `src/**` nur per `import type` + Contract-Tests; keine `src/**`-Änderung in S1a (Loader sind `server-only`, aus tsx nicht ausführbar — verifiziert an `src/lib/book/loadBook.ts:12`).
- **A6 — Migration 0015:** vor jedem produktiven `db:sync` read-only Repo-/DB-Kopf-Vergleich (Repo-Kopf `0015_keen_tag` verifiziert); bei Drift Stopp, keine improvisierte Migration; die Migration selbst ist nicht Teil von S1a.
- **B1 — Revalidation-Timing (OQ-19-Punkt 2):** `db:sync` löst keinen unaufschiebbaren Revalidation-POST aus. S3a liefert einen expliziten, fail-loud Post-Deploy-Befehl (`REVALIDATE_BASE_URL`, Timeout, Statusprüfung, Recovery-Meldung); das E4-Runbook ruft ihn genau einmal nach erfolgreichem Snapshot-Deploy auf; bei Sync-/Snapshot-/Deploy-Fehler keine Revalidation. Für Releases vor S3a (erster S1a-Snapshot) gilt der manuelle curl laut Runbook — ebenfalls erst nach dem Deploy.
- **B2 — RUNTIME_DATABASE_URL-Ownership (OQ-19-Punkt 3):** Rollen-/Migrations-/Script-Arbeit bleibt S3a (Batches); der Consumer-Wechsel in `src/db/client.ts` (liest heute `process.env.DATABASE_URL`, wirft beim Import ohne Wert — verifiziert `client.ts:18`) ist S3b (Product) mit Übergangs-Fallback; Vercel-Reihenfolge: Runtime-URL vor dem Merge setzen (Haltepunkt 1), nach verifiziertem Deploy privilegiertes `DATABASE_URL` entfernen (Haltepunkt 2); Launch-Readiness Punkt 6 verifiziert „nur Runtime-Credential in Produktion".
- **B3 — Evidence-/PR-Trennung (OQ-19-Punkt 4):** Snapshot-Artefakte im Batches-Release-PR; Impl-Reports fahren wie üblich im Strand-PR mit; Launch-Readiness-Protokoll + Brain-/README-Rollups sind separate Koordinations-PRs; kein gemischter Snapshot-/Brain-/Evidence-PR.

**Geänderte Session-/PR-Reihenfolge:** S0 ☑ → **S1a (Code-PR)** → **S1a-Snapshot** (nach Merge + Freeze + Go; PR = Deploy) → S1b → S2 → S3a → S3b (jetzt explizit nach S3a) → S4 → S4b → S5 → S6 → S7a → S8 → S9 → S10a (→ S10b bedingt) → Launch-Readiness → Launch → PL1/S7b/S11. Die Kürzel „S1a-A"/„S1a-B" werden nirgends verwendet.

**Haltepunkte und Stop-Bedingungen (kanonisch in Plan/Prompts):** S1a-Snapshot stoppt bei Migrations-Head-Drift (keine improvisierte Migration) und wartet auf explizites Go vor dem einen `db:sync`; S3b hat zwei Maintainer-Haltepunkte (Vercel-Env vor Merge, Credential-Entfernung nach verifiziertem Deploy); Revalidation nie vor bzw. ohne erfolgreichen Deploy; Launch-Readiness stoppt bei jedem roten Punkt.

**Abweichung vom vorgefundenen Entwurf (beauftragt):** der Nachtrag-Satz, der OQ-19-Punkte 2–3 auf einen S3a-Preflight vertagte, wurde ersetzt — beide Punkte sind in dieser Session entschieden.

## Verification

- Phase-1-Stichproben (read-only, vor jeder Änderung): `src/db/client.ts:18` liest `DATABASE_URL` + wirft beim Import — pass · `scripts/db-sync.sh` Schritt 2/9 = `apply:book --all` — pass · `src/lib/book/loadBook.ts:12` importiert `server-only` — pass · kein `snapshot:regen` in `package.json` — pass · Migrationskopf `0015_keen_tag` — pass · 44/97 book-dates-Einträge in M41 — exakt bestätigt · Working-Tree-Diff == beschriebene Vorarbeit — pass · OQ 19 mit genau vier Widersprüchen — pass.
- `git diff --check` — pass (keine Whitespace-Fehler).
- `rg`-Sweeps über `docs/` + `brain/wiki/` — je 0 Treffer: Revalidation direkt nach `db:sync` ohne Deploy · scripts-only vollständiger `RUNTIME_DATABASE_URL`-Cutover · gemischter Snapshot-/Koordinations-PR · absolutes Verbot jedes legitimen `time_ending` · `db:sync/apply:book --all` · `S1a-A`/`S1a-B`.
- Statustabelle ↔ Masterplan: Sequenz, Voraussetzungen (S3b: „S0 (E6) + S3a") und Branch-Namen stimmen überein.
- `npm run brain:lint -- --no-write` — pass (0 Blocking Findings).
- `git status` — ausschließlich Markdown-Diffs (docs/, brain/wiki/, sessions/); `outputs/` unangetastet und ungestaged.
- Nicht ausgeführt (out of scope, absichtlich): `npm run lint`/`tsc` (keine Code-Fläche berührt), jede DB-Verbindung, `db:sync`/apply/Snapshot/Revalidation/Deploy, Vercel-/Supabase-/DNS-Schritte.

## Open issues / blockers

- Keine für S1a (Code-PR) — die Session kann ohne Architektur-Raten starten.
- Operator-Checks unverändert offen: Produktionsbeleg Migration `0015` (wird spätestens im S1a-Snapshot-Preflight read-only erhoben; Drift ⇒ Stopp), optionaler Prod-`db:drift`, Pixel/Chrome-Verdikt zu Session 192.

## For next session

- **Exakter nächster Schritt: S1a (Code-PR)** — Kickoff-Prompt aus `docs/launch-session-prompts.md` § „S1a — Snapshot-Exporter, Manifest, Era-Fix, Release-Runbook (Code-PR)", Branch `codex/ingest-batches-snapshot-exporter`, Voraussetzung „S0 gemerged" ist erfüllt (PR #240).
- S3a-Implementierung: beim Bau des Revalidation-Befehls die Testumgebungs-Frage klären (wogegen der fail-loud-Beleg läuft — lokaler `next start` reicht vermutlich).
- S3b-Implementierung: prüfen, ob `drizzle.config.ts`/Skripte den Fallback-Namen mitlesen müssen oder bewusst auf `DATABASE_URL` bleiben (Plan sagt: Skripte bleiben privilegiert).

## References

- `docs/launch-master-plan.md` §§ S1a/S3a/S3b/Launch-Readiness + Nachtrag 2026-07-11 (die geänderte Spec)
- `docs/launch-session-prompts.md` (Statustabelle + Prompts S1a/S1a-Snapshot/S3a/S3b/Launch-Readiness)
- `brain/wiki/open-questions.md` (OQ-19-Abschlussvermerk), `brain/wiki/log.md` (Eintrag 2026-07-11 · Session 195)
- `sessions/2026-07-11-194-impl-launch-s0.md` (S0-Entscheidungen, OQ-19-Herkunft)
