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

- **Confidence-Map aus Stufe 2b ungelesen.** Cowork hat in `docs/data/2b-book-roster.md` für 7 Bücher (`pe01` Path of the Warrior, `gk01` Grey Knights, `pm01` Priests of Mars, `nl01` Soul Hunter, `bl01` Talon of Horus, `gh01` Ghazghkull, `id01` Infinite & Divine) Confidence-Werte 0.6–0.8 festgehalten. seed.ts greift sie aktuell nicht ab — `sourceKind` ist hardcoded `manual`, `confidence` defaultet auf `1.00`. Aktivierung der per-Buch-Confidence-Persistenz ist Phase-4-Aufgabe (echte Provenance-Pipeline). Hier nur als Reminder, dass die Werte existieren und im Roster-Doc liegen, sobald sie gebraucht werden.
- **`check:eras` ins CI einhängen.** Report 024 § „For next session" — das Script ist DB-frei und damit CI-tauglich, würde sich neben `lint` + `typecheck` in `.github/workflows/ci.yml` einklemmen. Tiny Hygiene-Aktion, eigene kleine Session wenn jemand Lust hat. Stand-alone-Brief vermutlich Overkill; lässt sich auch in den nächsten passenden Hub-/Hygiene-Brief einreihen.
- **`secondary_era_ids text[]` für Multi-Era-Sichtbarkeit.** Report 024 § „For next session" — `id01 The Infinite and the Divine` (M35–M41) wäre der offensichtliche Driver, weil es plausibel auch in `age_apostasy`/`long_war` lebt. UX-Konsequenz ist offen (zählt zweimal in den Era-Counts? lädt EraDetail zweimal?), darum kein eigener Brief jetzt. Wenn der Bedarf konkret in einer Discovery-/Reading-Path-UX-Diskussion auftaucht, eigener Brief.

## Active threads

Open and recently-closed sessions, newest first. Cowork updates this list when it writes or reads a session. Older sessions stay in this folder until a phase ends, then move to `archive/`.

| Session | Role | Status | Topic |
|---|---|---|---|
| [2026-05-02-025](2026-05-02-025-arch-detail-panel-deeplink.md) | architect | open | **Stufe 2c.1 — DetailPanel + Deep-Linking (Rewrite of 018, post-2c.0).** Click auf BookDot öffnet Hero-Modal mit `BookDetail`-Shape (synopsis, authors, factions+alignment+role, kuratierte Facets in Reading-Notes-Block, externalLinks gruppiert nach kind, Series-Volume-Nav). URL-Contract: `?era=<id>&book=<slug>` kanonisch; `?book=<slug>` ohne era resolved server-side über `book_details.primary_era_id`. Cross-Era-Volume-Nav via lookup auf next/prev-Volume's primaryEraId. Keine Migration, keine neuen Deps. Editorial confirmed: alle external_links rendern, 5 kuratierte Facets (entry_point/length_tier/tone/theme/content_warning), Characters-Sektion erst wenn data da ist. |
| [2026-05-02-024](2026-05-02-024-impl-era-anchor.md) | implementer | complete | Stufe 2c.0 shipped — `book_details.primary_era_id` (nullable, seed-strict) + Migration 0004; alle 26 Bücher in `books.json` mit `primaryEraId` (hh14→horus_heresy, mf01→indomitus per Philipp). Overview/EraDetail/page.tsx-Mapping/TimelineBook auf den Anchor umgezogen, kein midpoint mehr. `npm run check:eras`-Guardrail liefert Verteilung 1·5·1·1·0·15·3 = 26 (exit 0). Roster-Doc-Verteilung passt. Lint/typecheck/build grün, curl-Smokes pro Era stimmen mit DB SELECT überein. |
| [2026-05-02-023](2026-05-02-023-arch-era-anchor.md) | architect | implemented | **Stufe 2c.0 — Era-Anchor.** Algorithmisches Era-Bucketing (Overview strict-midpoint, EraDetail midpoint±5) wird durch ein explizites `book_details.primary_era_id`-Feld ersetzt. CC-Tasks: Schema-Migration, `primaryEraId` für 26 Bücher in `books.json` eintragen (Vorbefüllungs-Tabelle im Brief, 2 Editorial-Fragen für Philipp), `seed.ts` + `TimelineBook` + `Overview` + `EraDetail` + `page.tsx`-Mapping durchziehen, plus `npm run check:eras`-Guardrail-Script. Folgt: 2c.1 = DetailPanel + Deep-Linking (Rewrite von 018). |
| [2026-05-02-022](2026-05-02-022-impl-rich-seed-2b.md) | implementer | complete | Stufe 2b shipped — 26 Bücher (3 Sanity + 23 neue) geseedet idempotent, Counts wie erwartet (29 factions / 21 series / 12 persons / 60 work_factions / 413 work_facets / 26 external_links). Discriminator-Sanity 0/0/0/0. Hub-Footer auf ISR `revalidate=3600` (Build bestätigt `Revalidate 1h`). BookDot-Tooltip wrap-fix für lange Titel (Ghazghkull 41 chars, Vaults of Terra 36 chars) via `max-width:260px + white-space:normal`. 2 Bücher fallen vom Brief-Era-Mapping ab (id01 in Era-Lücke, mf01 in indomitus statt time_ending) — flagged als Algorithmus-vs-Daten-Frage in carry-over, nicht in 2b gefixt. |
| [2026-05-01-021](2026-05-01-021-arch-rich-seed-2b.md) | architect | implemented | **Stufe 2b — Rich Seed (26 Bücher voll annotiert) + Hub-Count-Refresh.** Cowork hat `seed-data/*.json` per Hand populiert (Sanity-3 unverändert + 23 neue B&uuml;cher; +4 Factions, +7 Series, +10 Persons); Begleit-Doc `docs/data/2b-book-roster.md` mit Quellen-Links und Wert-Begründungen. CC-Tasks: `npm run db:seed` durchziehen, Discriminator-Sanity verifizieren, `revalidate = 3600` auf `src/app/page.tsx`, UI-Smoke-Checks bei 16 Büchern in `time_ending`. Keine Schema-Änderung, keine neuen UI-Surfaces — Design-Freiheit nur falls Crowding/Truncation in EraDetail bricht. |
| [2026-05-01-020](2026-05-01-020-impl-schema-foundation.md) | implementer | complete | Stufe 2a shipped — `works` + CTI-Detail-Tabellen + Junctions + 12 Facet-Kategorien (85 Werte inkl. NEON-14) + services/external_links + unified persons. Discriminator-Härtung via app-Helper PLUS CHECK-Trigger. Migration thematisch in 0002 (drop) / 0003 (create) gesplittet (drizzle-kit TTY-Workaround dokumentiert). Hub-Footer + Timeline-Route auf `works WHERE kind='book'`, `TimelineBook.authors: string[]` durchgezogen, 3 Sanity-Bücher voll annotiert, Build grün. |
| [2026-05-01-019](2026-05-01-019-arch-schema-foundation.md) | architect | implemented | **Stufe 2a — Schema-Foundation: `works` + Detail-Tabellen + Werk-Junctions + Facet-System (12 Kategorien inkl. NEON-14) + `external_links` + unified `persons`. Routen umgestellt, Build grün, 3 voll annotierte Sanity-Bücher.** Drop-and-create der alten `book*`-Tabellen, CTI-Pattern mit DB-erzwungener Discriminator-Integrität, `kind=tv_series` (Wort-Kollision vermieden), `audio_drama` als Format-Facet (nicht als kind). Post-Codex-Review: Forward-Migration festgelegt (kein Squash), Campaigns aus 2a gestrichen (nicht-FK-validiertes `text[]`-Pattern), Facet-Acceptance auf Konfigurations-Vollständigkeit statt Zahlen-Schwelle umformuliert. |
| [2026-05-01-018](2026-05-01-018-arch-detail-panel-deep-linking.md) | architect | superseded | **🅿️ Phase 2a.3 — DetailPanel + Deep-Linking — AUF EIS gelegt nach Plan-Wechsel zu DB-First.** Brief-Inhalt ist nicht falsch, aber gegen das alte (pre-2a) Schema gebaut. **Ersetzt durch 025 (Stufe 2c.1)** — der die URL-Contract-Scaffolding und visuelle Intent von 018 erbt, aber gegen das post-2a/post-2c.0-Schema portiert (works+CTI, externalLinks-Tabelle, kuratierte Facets, primaryEraId als Era-Resolution). 018 nicht implementieren — bleibt als historischer Reference im Folder, wandert beim Phase-2a-Archiv-Sweep nach `archive/`. |
| [2026-05-01-017](2026-05-01-017-impl-ci-cleanup.md) | implementer | complete | CI-Workflow Check-Run-Name suffix-frei — `push: branches: [main]` aus `ci.yml` raus, Required-Status-Check wieder einhängbar |
| [2026-05-01-016](2026-05-01-016-arch-ci-cleanup.md) | architect | implemented | CI-Workflow Check-Naming stabilisieren — `(pull_request)`-Suffix loswerden, Required-Status-Check im Ruleset wieder einsetzbar machen |
| [2026-05-01-015](2026-05-01-015-impl-build-hygiene.md) | implementer | complete | Phase 1.5 shipped — CI green on PRs, Drizzle migration runs on Vercel deploy, /healthz live, preview-URL comments confirmed |
| [2026-05-01-014](2026-05-01-014-arch-build-hygiene.md) | architect | implemented | Phase 1.5 Build-Hygiene — CI, Drizzle migration on Vercel deploy, /healthz, preview-URL comments |
| [2026-04-30-013](2026-04-30-013-impl-timeline-buzzy-hover-and-pin-scale.md) | implementer | complete | Timeline polish shipped — buzzy era-band glitch, themed focus brackets, per-era count badges replace ribbon pins |
| [2026-04-30-012](2026-04-30-012-arch-timeline-buzzy-hover-and-pin-scale.md) | architect | implemented | Timeline polish — buzzy/glitchy hover, focus-ring fix, book pins that scale to hundreds |
| [2026-04-29-011](2026-04-29-011-impl-timeline-overview-eraview.md) | implementer | complete | Phase 2a slim shipped — Overview ribbon + EraDetail at /timeline; ?era= contract migrated; 3-book fixture seeded |
| [2026-04-29-008](2026-04-29-008-arch-timeline-overview-eraview.md) | architect | implemented | Phase 2a slim — Overview ribbon + EraView track-view at /timeline; ?era= URL contract conflated; 2-3 book fixture |

Archived sessions live in [`archive/2026-04/`](archive/2026-04/) — Phase 1 (bootstrap, handoff), Phase 1.1 (stack bumps), Phase 2.0 (CSS + Hub + chrome), and the Aquila redesign side-quest.
