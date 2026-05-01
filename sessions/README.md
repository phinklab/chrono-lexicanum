# Sessions

This folder is the project's history. Every meaningful unit of work — an architect brief from Cowork, an implementation report from Claude Code — is one Markdown file here.

For the format, naming convention, status lifecycle, and full rules, see [`docs/agents/SESSIONS.md`](../docs/agents/SESSIONS.md).

## Quick reference

- **Naming:** `YYYY-MM-DD-NNN-{arch|impl}-{slug}.md` — e.g. `2026-04-28-002-arch-phase-1-handoff.md`
- **`NNN`** is monotonically increasing across the whole project (not reset daily)
- **Templates** live in `_templates/` — copy when starting a new session
- **Drafts** go in `_drafts/` (gitignored)
- **Archive:** when a phase wraps, move completed sessions to `archive/YYYY-MM/`

## Infrastructure log

Small infra changes that don't justify a session. Newest first.

- **2026-05-01** — CI-Workflow Check-Naming stabilisiert (sessions 016/017). `.github/workflows/ci.yml` läuft nur noch auf `pull_request:` — der `(pull_request)`-Suffix, den GitHub bei Multi-Trigger-Workflows an den Check-Run-Namen hängt, ist damit weg. Required-Status-Check `ci / lint-and-typecheck` ist im Ruleset wieder ohne Suffix einhängbar (Anleitung im Report 017). Trade-off: kein automatischer CI-Lauf mehr auf `main` post-merge — Vercel deploy ist die zweite Sicherung.
- **2026-05-01** — Repo transferred from `wptnoire/chrono-lexicanum` to `phinklab/chrono-lexicanum` (new GitHub Team org, needed because Rulesets don't enforce on private repos under the Free plan). New canonical URL: <https://github.com/phinklab/chrono-lexicanum>. GitHub redirects old URLs permanently; references to `wptnoire/...` in archived session logs are left as-is (historical record).

> Cosmetic UI polish items live in [`docs/ui-backlog.md`](../docs/ui-backlog.md) and are cleared in batched cleanup sessions, not folded into the next brief.

## Carry-over for the next architect brief

Items decided / surfaced between sessions that the **next** architect brief MUST address. Append here when you spot something at the end of a session that doesn't deserve its own brief but must not be forgotten. Cowork prunes items here once they've been folded into a brief or otherwise resolved.

- **🅿️ Session 018 (DetailPanel + Deep-Linking) ist auf Eis.** Wurde unter einem zwischenzeitlich revidierten Frontend-First-Plan geschrieben und darf NICHT an CC gegeben werden. Inhaltlich richtig, aber gegen das alte Schema gebaut — wird nach Stufe 2a (019) und 2b (021) als Stufe 2c entweder neu geschrieben oder substantiell überarbeitet. Active-Threads-Tabelle unten flaggt das. Briefs 019 + 021 sagen explizit: 018 nicht anfassen.
- **Confidence-Map aus Stufe 2b ungelesen.** Cowork hat in `docs/data/2b-book-roster.md` für 7 Bücher (`pe01` Path of the Warrior, `gk01` Grey Knights, `pm01` Priests of Mars, `nl01` Soul Hunter, `bl01` Talon of Horus, `gh01` Ghazghkull, `id01` Infinite & Divine) Confidence-Werte 0.6–0.8 festgehalten. seed.ts greift sie aktuell nicht ab — `sourceKind` ist hardcoded `manual`, `confidence` defaultet auf `1.00`. Aktivierung der per-Buch-Confidence-Persistenz ist Phase-4-Aufgabe (echte Provenance-Pipeline). Hier nur als Reminder, dass die Werte existieren und im Roster-Doc liegen, sobald sie gebraucht werden.
- **Era-Bucketing-Algorithmus inkonsistent.** Aufgetaucht in Report 022: Overview nutzt strict-midpoint, EraDetail nutzt midpoint ±5 Jahre — die beiden Komponenten widersprechen sich an Era-Grenzen. Mit den 26 Büchern landen `vt01`/`hr01`/`db01` (mid 41997-41999) sowohl in `time_ending` (Overview-Badge "14") als auch in `indomitus` (EraDetail "6"). Außerdem rutscht `id01 Infinite and the Divine` (mid 38499.5, weil M35→M41) durch eine Lücke zwischen `age_apostasy` und `time_ending` und erscheint in keiner Era. Stufe-2c-Optionen: kanonischer Algorithmus (eine Logik in beiden Komponenten), endY-Bucketing, oder explizite `eraId`-Spalte auf `book_details` (Multi-Era-fähig für Bücher wie id01). Cowork picks.

## Active threads

Open and recently-closed sessions, newest first. Cowork updates this list when it writes or reads a session. Older sessions stay in this folder until a phase ends, then move to `archive/`.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-02-022](2026-05-02-022-impl-rich-seed-2b.md) | implementer | complete | Stufe 2b shipped — 26 Bücher (3 Sanity + 23 neue) geseedet idempotent, Counts wie erwartet (29 factions / 21 series / 12 persons / 60 work_factions / 413 work_facets / 26 external_links). Discriminator-Sanity 0/0/0/0. Hub-Footer auf ISR `revalidate=3600` (Build bestätigt `Revalidate 1h`). BookDot-Tooltip wrap-fix für lange Titel (Ghazghkull 41 chars, Vaults of Terra 36 chars) via `max-width:260px + white-space:normal`. 2 Bücher fallen vom Brief-Era-Mapping ab (id01 in Era-Lücke, mf01 in indomitus statt time_ending) — flagged als Algorithmus-vs-Daten-Frage in carry-over, nicht in 2b gefixt. |
| [2026-05-01-021](2026-05-01-021-arch-rich-seed-2b.md) | architect | implemented | **Stufe 2b — Rich Seed (26 Bücher voll annotiert) + Hub-Count-Refresh.** Cowork hat `seed-data/*.json` per Hand populiert (Sanity-3 unverändert + 23 neue B&uuml;cher; +4 Factions, +7 Series, +10 Persons); Begleit-Doc `docs/data/2b-book-roster.md` mit Quellen-Links und Wert-Begründungen. CC-Tasks: `npm run db:seed` durchziehen, Discriminator-Sanity verifizieren, `revalidate = 3600` auf `src/app/page.tsx`, UI-Smoke-Checks bei 16 Büchern in `time_ending`. Keine Schema-Änderung, keine neuen UI-Surfaces — Design-Freiheit nur falls Crowding/Truncation in EraDetail bricht. |
| [2026-05-01-020](2026-05-01-020-impl-schema-foundation.md) | implementer | complete | Stufe 2a shipped — `works` + CTI-Detail-Tabellen + Junctions + 12 Facet-Kategorien (85 Werte inkl. NEON-14) + services/external_links + unified persons. Discriminator-Härtung via app-Helper PLUS CHECK-Trigger. Migration thematisch in 0002 (drop) / 0003 (create) gesplittet (drizzle-kit TTY-Workaround dokumentiert). Hub-Footer + Timeline-Route auf `works WHERE kind='book'`, `TimelineBook.authors: string[]` durchgezogen, 3 Sanity-Bücher voll annotiert, Build grün. |
| [2026-05-01-019](2026-05-01-019-arch-schema-foundation.md) | architect | implemented | **Stufe 2a — Schema-Foundation: `works` + Detail-Tabellen + Werk-Junctions + Facet-System (12 Kategorien inkl. NEON-14) + `external_links` + unified `persons`. Routen umgestellt, Build grün, 3 voll annotierte Sanity-Bücher.** Drop-and-create der alten `book*`-Tabellen, CTI-Pattern mit DB-erzwungener Discriminator-Integrität, `kind=tv_series` (Wort-Kollision vermieden), `audio_drama` als Format-Facet (nicht als kind). Post-Codex-Review: Forward-Migration festgelegt (kein Squash), Campaigns aus 2a gestrichen (nicht-FK-validiertes `text[]`-Pattern), Facet-Acceptance auf Konfigurations-Vollständigkeit statt Zahlen-Schwelle umformuliert. |
| [2026-05-01-018](2026-05-01-018-arch-detail-panel-deep-linking.md) | architect | **on hold** | **🅿️ Phase 2a.3 — DetailPanel + Deep-Linking — AUF EIS gelegt nach Plan-Wechsel zu DB-First (siehe Carry-over).** Brief-Inhalt ist nicht falsch, aber gegen das alte Schema gebaut. Reaktivierung als Stufe 2c nach Schema-Migration. |
| [2026-05-01-017](2026-05-01-017-impl-ci-cleanup.md) | implementer | complete | CI-Workflow Check-Run-Name suffix-frei — `push: branches: [main]` aus `ci.yml` raus, Required-Status-Check wieder einhängbar |
| [2026-05-01-016](2026-05-01-016-arch-ci-cleanup.md) | architect | implemented | CI-Workflow Check-Naming stabilisieren — `(pull_request)`-Suffix loswerden, Required-Status-Check im Ruleset wieder einsetzbar machen |
| [2026-05-01-015](2026-05-01-015-impl-build-hygiene.md) | implementer | complete | Phase 1.5 shipped — CI green on PRs, Drizzle migration runs on Vercel deploy, /healthz live, preview-URL comments confirmed |
| [2026-05-01-014](2026-05-01-014-arch-build-hygiene.md) | architect | implemented | Phase 1.5 Build-Hygiene — CI, Drizzle migration on Vercel deploy, /healthz, preview-URL comments |
| [2026-04-30-013](2026-04-30-013-impl-timeline-buzzy-hover-and-pin-scale.md) | implementer | complete | Timeline polish shipped — buzzy era-band glitch, themed focus brackets, per-era count badges replace ribbon pins |
| [2026-04-30-012](2026-04-30-012-arch-timeline-buzzy-hover-and-pin-scale.md) | architect | implemented | Timeline polish — buzzy/glitchy hover, focus-ring fix, book pins that scale to hundreds |
| [2026-04-29-011](2026-04-29-011-impl-timeline-overview-eraview.md) | implementer | complete | Phase 2a slim shipped — Overview ribbon + EraDetail at /timeline; ?era= contract migrated; 3-book fixture seeded |
| [2026-04-29-008](2026-04-29-008-arch-timeline-overview-eraview.md) | architect | implemented | Phase 2a slim — Overview ribbon + EraView track-view at /timeline; ?era= URL contract conflated; 2-3 book fixture |

Archived sessions live in [`archive/2026-04/`](archive/2026-04/) — Phase 1 (bootstrap, handoff), Phase 1.1 (stack bumps), Phase 2.0 (CSS + Hub + chrome), and the Aquila redesign side-quest.
