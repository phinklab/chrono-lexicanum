---
session: 2026-06-06-122
role: implementer
date: 2026-06-06
status: complete
slug: podcast-b1-s1-link-foundation
parent: 2026-06-03-122
links:
  - 2026-06-04-128
  - 2026-06-02-114
commits: []
---

# Podcast B1 — S1 Link Foundation

> Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch:
> `codex/ingest-batches-podcast-b1-s1-links` (frisch von `origin/main`).

## Summary

`external_links` bekommt Provenance (`source_kind` + `confidence`, exakt analog
`works`), und die drei podcast-relevanten Services (`official_website`,
`apple_podcasts`, `rss`) existieren jetzt sowohl im Dev-Seed (`services.json`)
als auch prod-sicher per idempotentem `INSERT … ON CONFLICT DO NOTHING` in der
Migration `0011`. Reines Fundament aus dem 128-Reconciliation-Plan — **kein**
Podcast-Ingest/Apply-Verhalten geändert, kein Podcast-Artefakt-Diff.

## What I did

- `src/db/schema.ts` — `externalLinks` erhält `sourceKind`
  (`source_kind NOT NULL DEFAULT 'manual'`) und `confidence`
  (`numeric(3,2) DEFAULT '1.00'`), 1:1 wie `works.sourceKind`/`works.confidence`.
  Additiv + defaulted, damit bestehende `external_links`-Inserts (Seed aus
  `books.json`) unverändert weiterlaufen.
- `src/db/migrations/0011_omniscient_shooting_star.sql` — generierte additive
  `ALTER TABLE`-Statements; **hand-ergänzt** um einen idempotenten
  `INSERT INTO services … ON CONFLICT (id) DO NOTHING` für die drei neuen
  Services (gleiche Konvention wie der hand-angehängte Trigger-SQL-Block in
  `0010`).
- `src/db/migrations/meta/_journal.json` + `meta/0011_snapshot.json` —
  Drizzle-Bookkeeping (von `db:generate` erzeugt, mitcommitten).
- `scripts/seed-data/services.json` — +3 Services in displayOrder-sortierter
  Position (`official_website`=5, `apple_podcasts`=55, `rss`=65); Werte
  identisch zum Migration-INSERT.
- `scripts/seed-data/README.md` — Service-Count 18 → 21 (beide Fundstellen).
- `sessions/2026-06-04-128-impl-podcast-b1-plan-reconciliation.md` — der
  Reconciliation-Plan (Parent dieses S1) war noch untracked; reitet als Doc im
  Code-PR mit, damit er nicht verwaist (Mixed-Change → PR, erlaubt).

## Decisions I made

- **Prod-Datenpfad = Migration, nicht Daten-Skript.** Der 128-Plan ließ offen
  „in der Migration **oder** einem kleinen Daten-Step desselben PRs". Ich habe
  den `ON CONFLICT`-Insert direkt in die Migration gelegt, weil `db:migrate` in
  `vercel-build` ohnehin bei jedem Deploy läuft — damit existieren die
  FK-Targets prod-sicher ohne ein zusätzliches, separat zu triggerndes Skript.
- **`confidence` nullable (nicht NOT NULL).** Der Brief sagt „analog
  `works.confidence`" — und `works.confidence` ist `default('1.00')` **ohne**
  `notNull`. Bewusst übernommen statt zu „härten", damit das Mirror exakt ist.
- **Service-Werte einmal definiert, zweifach projiziert.** `services.json` und
  der Migration-INSERT tragen identische Werte (id/name/domain/displayOrder),
  sodass Fresh-Seed (`db:seed`) und Prod-Migrate dieselbe Zeile erzeugen.
  `affiliateSupported` weggelassen → Spalten-Default `false`; `domain` für
  `official_website`/`rss` `NULL` (pro-Show-URLs, keine feste Domain).
- **Kein Podcast-Apply/Ingest angefasst.** S1 schreibt noch keine
  `external_links`-Rows für Podcasts (das ist S3). Die neue NOT-NULL-Spalte hat
  einen Default, also erzwang sie keine Typecheck-Anpassung in Apply/Ingest/Seed.

## Verification

Alle gegen `npm run …` (Git-Bash):

- `typecheck` — pass (exit 0)
- `lint` — pass (exit 0)
- `test:podcast-ingest` — 10 passed, 0 failed
- `test:podcast-apply` — 25 passed, 0 failed
- `brain:lint -- --no-write` — 0 blocking, 13 warnings (alle pre-existing)
- `db:migrate` — applied `0011` gegen die Dev-Supabase (done in 352 ms, exit 0;
  `.env.local` vorhanden).
- **Live-DB-Check** (Wegwerf-Skript, danach gelöscht): `external_links.source_kind`
  = enum, NOT NULL, default `'manual'`; `external_links.confidence` = numeric,
  nullable, default `1.00`; die 3 Services existieren mit den erwarteten Werten;
  `count(services)` = 21. Den Migration-INSERT direkt re-played →
  `count(services)` bleibt 21 (ON CONFLICT-Idempotenz bestätigt).
- **Adversariales Review-Workflow** über den Diff (4 Dimensionen:
  migration-safety, schema-correctness, consumer-breakage, consistency-scope),
  jeder Befund einzeln gegengeprüft → **0 bestätigte Findings** (der einzige
  Roh-Befund fiel in der Verifikation durch). Insbesondere: kein bestehender
  `external_links`-Consumer (Seed aus `books.json`, `apply-podcast.ts`,
  `src/lib/entity/*`, `src/app/podcasts/*`) bricht an den additiven Spalten.

## Open issues / blockers

Keine. B1-S1 ist daten-/schema-seitig abgeschlossen.

## For next session

- **S2 (eigener PR, `/clear` davor):** Registry
  (`scripts/seed-data/podcast-shows.json`) + registry-getriebener
  `ingest-podcast.ts --show/--all`; `ShowArtifact.show.links[]` und
  `EpisodeArtifact.links[]` (mind. RSS-Enclosure als `listen/rss/podcast_rss`).
  Pilot deterministisch re-generieren, dann Adeptus Ridiculous onboarden.
- **S3:** `apply-podcast.ts` schreibt `external_links` autoritativ aus
  `show.links[]`/`episodes[].links[]` (delete-then-insert je Work) und setzt
  dabei `source_kind`/`confidence` gemäß der Link-Matrix aus dem 128-Plan.
- Board 122-B1 bleibt hier unangetastet — Cowork hakt es im Coordination-Pass ab
  (Rollup-Ownership).

## References

- `sessions/2026-06-04-128-impl-podcast-b1-plan-reconciliation.md` — der
  S1–S5-Plan, den dieser PR mit S1 eröffnet.
- `sessions/2026-06-02-114-impl-podcast-schema-apply.md` — Podcast-Schema/Apply
  (Step 2), auf dem S1 aufsetzt.
- `src/db/schema.ts` `works` — die Provenance-Vorlage, die `external_links` jetzt
  spiegelt.
