---
session: 2026-06-01-112
role: architect
date: 2026-06-01
status: archived
slug: brain-lint-always-read-budgets
parent: 2026-06-01-111
links: []
commits: []
---

# brain:lint — always-read budget-guardrail

> **Archiviert 2026-06-03 → Board 122-B7.** Inhalt unverändert; dieser Brief ist
> ab jetzt das Input-Doc/Spec für die Umsetzung im Batches-Strang (Meta/Tooling).

## Goal

`brain:lint` um einen Budget-Check pro always-read-File erweitern, damit die in der Token-Diet (Brief 111) geschlankten Synthese-Files nicht wieder zu Append-Logs anwachsen. Code → Task-Branch + PR.

## Context

Brief 111 hat den Session-Start-Read-Order-Floor von ~91k auf ~18k Token zurückgesetzt (`project-state.md` 233k → ~13k Zeichen, `open-questions.md` 77k → ~6k, README entschlackt). Ursache des Wachstums: die immer-gelesenen Files waren über Monate zu Append-Logs verkommen — 12 gestackte „Latest pipeline state"-Snapshots, ~130 Zeilen Frontmatter-Changelog, ~14 von 16 `~~closed~~` OQ-Einträge. Die Budgets + das „current-state-only"-Prinzip stehen jetzt in [`brain/CLAUDE.md`](../brain/CLAUDE.md) § „Always-read budgets" + [`brain/wiki/workflows/session-end.md`](../brain/wiki/workflows/session-end.md) § „The leanness contract". **Was fehlt: die automatische Durchsetzung.** `brain:lint` hat bereits body-line-Soft-Budgets (z.B. `faction-policy.md` 108 vs. 100) — dieser Brief erweitert das um char/token-Budgets für die vier always-read-Files.

Die Lint-Logik lebt in `scripts/` → Code → Task-Branch + PR (PR-Policy). Meta/Infra-Arbeit → Koordinations-Worktree, Branch `codex/session-112-lint-budgets`.

## Spec

Neue Lint-Check-Kategorie „always-read budget":

- Pro File die **Zeichenzahl** messen (Token ≈ chars/4), **nicht** Zeilen — der Bloat versteckte sich in ~1400-Zeichen-Zeilen, eine reine Zeilen-Zählung hätte ihn nicht gefangen.
- Zwei-stufig: **warn** bei Soft, **error** (non-zero exit in `--no-write`) bei Hard. Schwellen single-source in `brain/CLAUDE.md` § „Always-read budgets":

  | File | Soft / warn | Hard / error |
  |---|---|---|
  | `brain/wiki/project-state.md` | ~25k chars (≈6k tok) | ~45k chars |
  | `brain/wiki/open-questions.md` | ~16k chars · oder >5 offene Items | ~28k chars |
  | `sessions/README.md` | ~14k chars | ~24k chars |
  | `brain/wiki/index.md` | ~24k chars | ~36k chars |

- `open-questions.md` zusätzlich: **offene Items zählen** (`## (N)`-Headings, die nicht durchgestrichen/„closed" sind) und warnen bei >5 — die Queue ist bewusst klein (3–5).
- Finding-Format wie die bestehenden Checks (File · gemessen · Budget · Severity).

## Out of scope

- **Den Inhalt der Files nicht ändern** — das ist Brief 111 (Sweep) + die laufende session-end-Routine; dieser Brief baut nur den Check.
- Keine Budgets für nicht-always-read-Files (`decisions/`, übrige `workflows/` etc. behalten ihre bestehenden Checks).
- Kein Re-Design der übrigen Lint-Kategorien.

## Acceptance

Die Session ist fertig, wenn:

- [ ] `brain:lint` flaggt ein über-Soft-File als warning, ein über-Hard-File als error (non-zero exit in `--no-write`).
- [ ] `open-questions.md` mit >5 offenen Items warnt.
- [ ] Der aktuelle Repo-Stand (post-Brief-111) ist **unter allen Soft-Budgets** → `npm run brain:lint -- --no-write` läuft grün (modulo der bekannten pre-existing warnings).
- [ ] Mind. ein Test/Fixture belegt warn + error (analog der bestehenden Lint-Tests).
- [ ] `npm run lint` + `tsc --noEmit` grün.

## Open questions

- Char-basiert bleiben oder echten Tokenizer nutzen? (Empfehlung: chars/4-Approximation — deterministisch, dependency-frei, gut genug.)
- Schwellen aus `brain/CLAUDE.md` parsen oder als Skript-Konstanten mit Doc-Verweis halten? (Empfehlung: Skript-Konstanten + Kommentar-Verweis — kein Markdown-Parsing.)
- Exakte Schwellen sind tunebar (Policy-Zahlen, keine Tool-Versionen); die Absicht ist „lean": Soft ≈ Lean-Größe + großzügiger Headroom, Hard weit unter den Vor-Diet-Größen.

## Notes

Paart mit Brief 111 (Sweep) + dem session-end „leanness contract"-Step. `brain:lint --no-write` läuft schon auf jedem PR; Direct-to-`main`-Doc-Commits skippen CI, aber Cowork zieht vor jedem Doc-Push `brain:lint -- --no-write` lokal grün — dort greift der neue Check dann auch.
