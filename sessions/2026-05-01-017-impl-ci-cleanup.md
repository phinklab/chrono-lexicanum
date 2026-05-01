---
session: 2026-05-01-017
role: implementer
date: 2026-05-01
status: complete
slug: ci-cleanup
parent: 2026-05-01-016
links:
  - 2026-05-01-014
  - 2026-05-01-015
  - 2026-05-01-016
commits:
  - 2a35be538156dfe5d1163fc55e2c3624f09e7ea2
---

# CI-Workflow Check-Naming stabilisiert — `(pull_request)`-Suffix gefallen

## Summary

`.github/workflows/ci.yml` läuft nur noch auf `pull_request:`. Auf PR #4 ist der GitHub-Check-Run jetzt ein einzelner Eintrag mit Namen exakt `ci / lint-and-typecheck` — Required-Status-Check kann im Ruleset wieder eingehängt werden.

## What I did

- `.github/workflows/ci.yml` — `push: branches: [main]` aus dem `on:`-Block entfernt. Workflow-`name: ci`, Job-Id `lint-and-typecheck`, Concurrency-Group, Steps: alles unverändert.
- `sessions/2026-05-01-016-arch-ci-cleanup.md` — `status: open → implemented`, `commits:` mit den beiden SHAs gefüllt, Cross-Link auf 017 ergänzt.
- `sessions/README.md` — Active-threads-Tabelle: 016 auf `implemented` geflippt, 017 als neueste Zeile eingefügt. Infrastructure-log: Folgevermerk "CI-Workflow Check-Naming stabilisiert (016/017)".

## Decisions I made

### Trigger gestrichen, nicht durch `name:`-Override umgangen

Der Brief lässt offen, ob ein expliziter `name:` auf Job- oder Workflow-Ebene den `(pull_request)`-Suffix bei Multi-Trigger-Workflows unterdrücken kann. Recherche: nein. Die GitHub-Community-Diskussion [#26940](https://github.com/orgs/community/discussions/26940) ist eindeutig — wenn ein Workflow `pull_request` *und* `push` als Trigger hat, listet GitHub auf einem PR die Jobs aus beiden Event-Sichten als separate Check-Einträge mit Event-Suffix; es gibt keinen Schalter, um nur die `pull_request`-Variante zu zeigen. `name:`-Overrides ändern den Suffix nicht. Einzige saubere Lösung: den überflüssigen Trigger entfernen.

### Post-Merge-Run auf `main` aufgegeben — bewusste Wahl

Was wir verlieren, wenn `push: branches: [main]` weg ist: Nach einem Merge läuft auf `main` kein zweiter CI-Durchgang. Der Wert eines solchen Runs wäre, semantische Merge-Konflikte zu fangen — z.B. PR A und PR B sind einzeln grün, kollidieren aber inhaltlich, und der Merge bricht nichts file-wise, aber den Build doch. Argumente, das hier zu opfern:

- Ein-Maintainer-Repo, parallele PRs gibt's de facto nicht.
- Der PR-Check ist das Gate vor dem Merge (Ruleset, sobald wieder eingehängt).
- Vercel deployt auf `main` und scheitert, falls `next build` bricht — das ist die zweite Sicherung in der Praxis.
- Wenn das Bedürfnis je echt wird, kann ein zweiter Workflow-File mit eigenem Namen (`ci-main.yml` o.ä.) den Post-Merge-Lauf zurückbringen, ohne den Required-Check auf PRs zu vergiften.

### Concurrency-Group bewusst nicht angefasst

`group: ci-${{ github.ref }}` mit `cancel-in-progress: true` bleibt erhalten. Auf PRs ist `github.ref` der PR-Ref (`refs/pull/N/merge`), das funktioniert weiterhin und cancelt superseded Runs sauber.

### Branch-Strategie / lokale Reset-Frage

Beim Start war ich auf `chore/repo-transfer-note` (lokal noch ungemerged), während `origin/main` bereits den squash-mergten Repo-Transfer-Commit `11dbe1a` enthielt. Lösung: `git stash` auf Brief-016-Datei + README-Diff, `main` per fast-forward auf `origin/main` gezogen, neu von dort gebrancht (`chore/ci-stable-check-name`), Stash zurückgespielt. Kein Force-Push, keine History-Manipulation auf `main`.

## Verification

- `npm run lint` — pass (ein vorbestehender `@next/next/no-page-custom-font`-Warning in `src/app/layout.tsx`, Baseline aus 015).
- `npm run typecheck` — pass.
- **PR #4** auf `phinklab/chrono-lexicanum`: GitHub-Check-Run-Rollup zeigt **einen** Eintrag, `workflowName: "ci"`, `name: "lint-and-typecheck"`, `conclusion: SUCCESS`, in 29s gelaufen. Kein zweiter Eintrag, kein `(pull_request)`-Suffix, kein "Expected — Waiting for status to be reported"-Phantom.

```json
{"statusCheckRollup":[{"__typename":"CheckRun","name":"lint-and-typecheck","workflowName":"ci","conclusion":"SUCCESS","status":"COMPLETED","completedAt":"2026-05-01T12:19:54Z"}]}
```

PR-URL: <https://github.com/phinklab/chrono-lexicanum/pull/4>.

## Open issues / blockers

Keine. Nach Merge dieses PR muss Philipp den Required-Status-Check im Ruleset wieder einhängen — siehe nächster Abschnitt.

## For Philipp — Required-Status-Check wieder aktivieren (nach Merge)

Reihenfolge wichtig: der Check-Run-Name `ci / lint-and-typecheck` (ohne Suffix) muss nach dem Merge mindestens **einmal grün** auf `main` oder einem PR gegen `main` gelaufen sein, damit er in der Ruleset-Dropdown-Liste auftaucht. Da der `push: branches: [main]`-Trigger weg ist, taucht der neue Name erst auf, wenn der nächste PR gegen `main` läuft. Praktisch:

1. Diesen PR (#4) mergen.
2. Erstes Mal Required-Check **noch nicht** versuchen — die Dropdown-Liste kennt den Namen ohne Suffix unter Umständen noch nicht.
3. Beim **nächsten** PR (z.B. zum Re-Aktivieren des Required-Checks selber, oder dem nächsten Feature-Brief) wartest du, bis der Check `ci / lint-and-typecheck` einmal grün durchgelaufen ist.
4. Dann: Settings → Rules → Rulesets → "main protection" (oder wie die Regel bei dir heißt) → bearbeiten → "Require status checks to pass" wieder aktivieren → "Add checks" → in der Suche `ci / lint-and-typecheck` tippen → den Eintrag **ohne** `(pull_request)`-Suffix auswählen → Save.
5. Sanity-Check: noch einen Empty-Commit auf einem Test-PR pushen (`git commit --allow-empty -m "ci: verify required check"`), CI muss als Required laufen, Merge-Button bleibt rot bis grün.

Falls der Eintrag mit Suffix in der Dropdown-Liste **auch** noch existiert (Cache aus alten Runs): nicht auswählen, einfach den ohne Suffix nehmen. Der alte Eintrag verschwindet nach ein paar Tagen, wenn keine neuen Runs ihn mehr nähren.

## For next session

- Falls Sentry / Error-Tracking als nächste Phase 1.5-Erweiterung kommt (im Brief 016 erwähnt als „eigener Brief"), bietet sich an, dabei direkt auch über `merge_group:` als zusätzlichen Trigger nachzudenken — falls je eine GitHub Merge Queue eingeführt wird, muss die im `on:`-Block stehen, sonst blockiert das den Required-Check. Heute nicht relevant (kein Merge Queue), nur als Notiz.
- Die `chore/repo-transfer-note`-Branch lokal kann gelöscht werden — die Commits sind via Squash in `11dbe1a` auf `main` gelandet. Optional, kein Blocker.
- Failure-Mode-Test der Migration-on-Deploy gegen die echte Supabase steht weiterhin als optionale Side-Quest aus 015 / 016 offen.

## References

- GitHub Community Discussion [#26940 — Pull requests trigger duplicate checks for both [push] and [pull_request]](https://github.com/orgs/community/discussions/26940) — bestätigt, dass das Verhalten by-design ist und es keinen Schalter gibt, nur eine Event-Sicht zu zeigen.
- GitHub Community Discussion [#57827 — Prevent workflow jobs run twice on push and PR](https://github.com/orgs/community/discussions/57827) — gleicher Sachverhalt, gleicher Fix-Pattern (einen Trigger streichen).
- GitHub Docs: [Troubleshooting required status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/troubleshooting-required-status-checks) — Hintergrund zu "Expected — Waiting for status to be reported"-Hängern bei Required-Checks ohne passenden Run.
