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

## Carry-over for the next architect brief

Items decided / surfaced between sessions that the **next** architect brief MUST address. Append here when you spot something at the end of a session that doesn't deserve its own brief but must not be forgotten. Cowork prunes items here once they've been folded into a brief or otherwise resolved.

- **🅿️ Session 018 (DetailPanel + Deep-Linking) ist auf Eis.** Wurde unter einem zwischenzeitlich revidierten Frontend-First-Plan geschrieben und darf NICHT an CC gegeben werden. Inhaltlich richtig, aber gegen das alte Schema gebaut — wird nach Stufe 2a (019) und 2b als Stufe 2c entweder neu geschrieben oder substantiell überarbeitet. Active-Threads-Tabelle unten flaggt das. Brief 019 (Schema-Foundation) sagt explizit: 018 nicht anfassen.
- **Seed-Modus für die 20 Bücher in Stufe 2b: hand-kuratiert, NICHT automatisiert gecrawled.** Cowork darf Websites (Lexicanum, Black Library, ISFDB, Open Library) lesen und Daten zusammentragen; Philipp überführt händisch in `seed-data/*.json`. Phase-4-Ingestion-Pipeline (echter Crawler + Provenance-Layer) bleibt für die 200+-Skala späterer Briefs.
- **Hub novel-count freshness.** Footer-Query liest nach 019 `select count(*) from works where kind='book'`. Next prerendert die Route weiterhin statisch — sobald Phase-4-Ingestion echte Bücher reinschiebt, entscheiden ob `export const revalidate = 60` (stündlicher Refresh) oder „Redeploy to update count" akzeptabel bleibt. Implementer-flagged in 007.
- **2b Facet-Fillrate.** Pflicht-Facets pro Buch in Stufe 2b: nur die UI-filter-relevanten (`tone`, `pov_side`, `protagonist_class`, `entry_point`) plus `content_warning`. Die anderen sieben Kategorien (`scope`, `plot_type`, `theme`, `length_tier`, `format`, `language`, `protagonist_gender`) sind best-effort, nicht Pflicht. Hält die ~240 Zuordnungen über 20 Bücher auf einer durchhaltbaren Curation-Last für Hand-Pflege; volle Annotation gerne sobald Lust und Zeit da sind. Wird im 2b-Brief explizit als Constraint stehen.

## Active threads

Open and recently-closed sessions, newest first. Cowork updates this list when it writes or reads a session. Older sessions stay in this folder until a phase ends, then move to `archive/`.

| Session | Role | Status | Topic |
|---|---|---|---|
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
