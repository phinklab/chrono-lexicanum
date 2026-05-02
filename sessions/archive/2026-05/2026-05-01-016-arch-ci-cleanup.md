---
session: 2026-05-01-016
role: architect
date: 2026-05-01
status: implemented
slug: ci-cleanup
parent: 2026-05-01-015
links:
  - 2026-05-01-014
  - 2026-05-01-015
  - 2026-05-01-017
commits:
  - 2a35be538156dfe5d1163fc55e2c3624f09e7ea2
---

# CI-Workflow säubern, Required-Check stabilisieren, Repo-Transfer zur Kenntnis nehmen

## Goal

Den Check-Run-Namen aus `.github/workflows/ci.yml` so stabil machen, dass er als Required Status Check im neu eingerichteten Branch-Ruleset wieder eintragbar ist — ohne den `(pull_request)`-Suffix, den GitHub aktuell automatisch anhängt. Außerdem zur Kenntnis nehmen: das Repo ist heute in eine neue Org transferiert worden.

## Context

Phase 1.5 ist seit 015 durch (CI grün, Migration on Deploy, `/healthz`, Vercel-Preview-Comments). Heute (2026-05-01) sind zwei Infrastruktur-Schritte parallel passiert, die du in `sessions/README.md` unter "Infrastructure log" findest:

1. **Repo-Transfer**: `wptnoire/chrono-lexicanum` → `phinklab/chrono-lexicanum` (neue GitHub-Team-Org, weil Rulesets auf privaten Repos nur auf bezahlten Plänen erzwingbar sind). GitHub redirectet alte URLs permanent. Lokales `origin` ist umgehängt, Vercel-Verbindung steht. **Für dich operativ: nichts zu tun**, nur als Kontext, falls du in PR-/Issue-URLs irritiert bist. Referenzen zu `wptnoire/...` in archivierten Session-Logs bleiben bewusst stehen (historischer Record).

2. **Branch-Ruleset auf `main` aktiviert** — verlangt PR-Workflow, war als "Required Status Check" auch der CI-Run vorgesehen. Beim Einrichten kam ein bekanntes GitHub-Quirk zum Vorschein: dein Workflow läuft auf zwei Trigger-Events (`pull_request:` und `push: branches: [main]`). GitHub fügt in dem Fall den Trigger-Event-Namen als Suffix an den Check-Run-Namen — der reale Check-Run heißt also `ci / lint-and-typecheck (pull_request)`, nicht das im 015-Report als stabil beschriebene `ci / lint-and-typecheck`. Im UI zeigt sich das als zwei Check-Einträge (einer "Expected — Waiting for status to be reported", einer tatsächlich grün) und der Required-Slot wird nicht erfüllt. Wir haben den PR (siehe sessions/README.md "Infrastructure log") gemerged, indem das Required-Status-Check-Setting im Ruleset temporär abgehakt wurde. Die Ruleset-Restriktionen "Require PR before merging" und "Restrict deletions" sind weiterhin aktiv — d.h. Direkt-Push auf `main` bleibt blockiert. Dein Job ist es, den Workflow so zu reparieren, dass das Required-Status-Check-Setting danach wieder sauber eingehängt werden kann.

Relevante Dateien:

- `.github/workflows/ci.yml` (Workflow, Trigger derzeit `pull_request:` UND `push: branches: [main]`)
- `sessions/README.md` (Infrastructure log + Carry-over)

## Constraints

- Der Check-Run-Name nach deinem Edit muss exakt `ci / lint-and-typecheck` sein (ohne `(pull_request)`-Suffix), wenn er auf einem PR läuft. Verifiziere das empirisch — UI-Ansicht eines neu erzeugten PR-Checks ist die Wahrheit, nicht Vermutung.
- Der Workflow muss weiterhin auf jedem PR-Push laufen. Was du opferst (oder nicht), ist der `push: branches: [main]`-Trigger, falls dieser die Ursache des Suffixes ist — und das ist die wahrscheinlichste Lösung. Begründe deine Wahl im Report.
- Wenn ein Workflow-Run auf `main` (post-merge) für dich aus Sicherheitsgründen wertvoll erscheint, kannst du argumentieren ihn zu behalten und stattdessen den Check-Namen über `name:` auf Job-Ebene oder Workflow-Ebene so explizit setzen, dass er auch bei Multi-Trigger stabil ohne Suffix bleibt — falls GitHub das überhaupt erlaubt. Wenn das nicht zuverlässig geht, raus mit dem Trigger.
- Concurrency-Group im Workflow muss erhalten bleiben (`cancel-in-progress: true` auf `ci-${{ github.ref }}`), damit superseded Runs gecancelt werden.
- Keine Änderungen außerhalb von `.github/workflows/ci.yml` und ggf. `sessions/README.md` (Infrastructure-log-Eintrag erweitern, falls du was Festhaltenswertes lernst).
- Versions-Policy: nichts in der CI-Datei pinnen, was nicht muss. Action-Tags wie `actions/checkout@v4` sind okay (Major-Tag); Patch- oder SHA-Pinning bewusst nicht.

## Out of scope

- **Kein** Re-Konfigurieren des GitHub-Rulesets selbst — das ist Philipps Klick im Browser-UI nach deinem Merge. Du beschreibst im Report nur, was er klicken muss (siehe Acceptance).
- **Kein** Sentry / Error-Tracking — kommt in einen eigenen Brief.
- **Kein** Anfassen archivierter Session-Logs zwecks URL-Update auf `phinklab/...`. Die bleiben historisch.
- **Keine** weiteren CI-Verbesserungen (Build-Step, Tests, Caching-Tweaks). Strikt: nur das Suffix-Problem fixen.
- **Kein** Failure-Mode-Test der Migration-on-Deploy gegen die echte Supabase. Bleibt optionale Side-Quest aus 015.

## Acceptance

The session is done when:

- [ ] Auf einem frischen Test-PR (kann Empty-Commit oder triviale Doku-Änderung sein) ist der GitHub-Actions-Check-Run-Name exakt `ci / lint-and-typecheck` — Screenshot oder copy-paste aus der GitHub-UI im Report belegt das.
- [ ] `.github/workflows/ci.yml` ist minimal verändert: nur der Trigger-Block (oder, falls du es anders löst, ein explizites `name:`-Override). Diff im Report zeigt genau was geändert wurde.
- [ ] `npm run lint` und `npm run typecheck` lokal weiterhin grün (nichts daran sollte sich ändern, aber Smoketest schadet nicht).
- [ ] Im Report steht eine kurze, kopierbare Anleitung für Philipp, wie er anschließend im Ruleset den Required Status Check `ci / lint-and-typecheck` (jetzt ohne Suffix) wieder einhängt — Settings → Rules → Rulesets → "main protection" → "Require status checks to pass" wieder aktivieren → Add checks → `ci / lint-and-typecheck` aus der Dropdown-Liste auswählen → Save. Inklusive Hinweis, dass der Check-Run mindestens einmal erfolgreich gelaufen sein muss, bevor er in der Dropdown-Liste erscheint (sonst wieder Source-Mismatch).
- [ ] `sessions/README.md` "Infrastructure log" hat einen kurzen Folgevermerk: "CI-Workflow Check-Naming stabilisiert (016)" mit Datum.

## Open questions

- Lässt GitHub Actions sich überhaupt zwingen, bei Multi-Trigger-Workflows einen Suffix-freien Namen zu generieren — etwa über expliziten `name:` auf Job- oder Workflow-Ebene? Wenn ja, ist das die elegantere Lösung als Trigger-Reduktion. Wenn nein, dokumentier das im Report (eine kurze Quelle/Issue-Link reicht), damit wir nicht in zwei Wochen wieder anfangen zu rätseln.
- Konsequenz von `push: branches: [main]`-Entfernung: Wenn ein PR gemerged wird, läuft der CI nicht erneut auf `main`. Ist das ein realer Verlust? Argumente für/gegen kurz im Report.
- Hat dein `git remote -v` nach dem Pull die korrekte `phinklab/...`-URL? (Sanity-Check, kein Blocker.)

## Notes

- Der pre-existing `@next/next/no-page-custom-font`-Lint-Warning in `src/app/layout.tsx` ist Baseline (siehe 015-Report). Nicht beheben.
- Wenn du das Trigger-Problem löst und im Anschluss feststellst, dass im UI immer noch Doppel-Einträge erscheinen (z.B. weil ein gestarteter Workflow-Run unter altem Namen noch im Speicher hängt) — Empty-Commit-Push triggert sauber neu.
- Branch-Naming: `chore/ci-stable-check-name` oder ähnlich ist okay; ein Wort-pro-Brief-Branch ist Konvention hier nicht zwingend, also lass dich nicht von einem perfekten Namen aufhalten.

## References

- Report 015 (Phase 1.5 shipped): `sessions/2026-05-01-015-impl-build-hygiene.md` — Abschnitt "Decisions I made → Migration mechanism" und "For next session" sind der Kontext für das gesamte CI-Setup.
- Brief 014 (Phase 1.5): `sessions/2026-05-01-014-arch-build-hygiene.md` — der ursprüngliche Auftrag.
- GitHub-Doku zu Check-Naming bei Multi-Trigger-Workflows: such selbst (mein Knowledge-Cutoff hilft dir hier nicht weiter, das Verhalten hat sich offenbar verändert seit 015 lief).
