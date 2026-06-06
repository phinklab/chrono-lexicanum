---
session: 2026-06-06-122
role: implementer
date: 2026-06-06
status: complete
slug: podcast-b1-s3-apply-links
parent: 2026-06-03-122
links:
  - 2026-06-06-122
  - 2026-06-04-128
  - 2026-06-02-114
commits: []
---

# Podcast B1 — S3 Apply Multi-Show + External Links

> Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch:
> `codex/ingest-batches-podcast-b1-s3-apply-links` (frisch von `origin/main`).

## Summary

`apply-podcast.ts` ist jetzt **registry-getrieben** (`--show <slug>` / `--all`,
`--file` als Escape-Hatch bleibt) und schreibt `external_links` für Podcast-Show
und -Episoden **autoritativ aus dem Artefakt** (`show.links[]` / `episodes[].links[]`),
per-Work delete-then-insert — exakt analog zu den bestehenden Entity-Junctions.
Provenance (`source_kind` + `confidence`) wird **1:1 aus dem `PodcastLink`
projiziert**, nie neu abgeleitet (die 128-Matrix lebt im Artefakt seit S2). Der
feed-intrinsische Scalar `podcast_episode_details.audioUrl` bleibt und wird weiter
aus demselben Artefakt co-geschrieben. **Adeptus Ridiculous** (363 Folgen) ist
jetzt vollständig in der Dev-DB — B1 ist damit batches-seitig erledigt.

Kein Schema-/Migrations-Diff (S1 hatte die Spalten + Services schon angelegt),
kein `brain/**`, kein `sessions/README.md`, kein Board-Edit (Rollup-Ownership).

## What I did

### Plan-Builder (pure, DB-frei)

- `src/lib/ingestion/podcast/apply-plan.ts`
  - `ShowPlan` und `EpisodePlan` bekommen je `links: PodcastLink[]`; der Report
    bekommt `showLinkCount` + `episodeLinkCount`.
  - `projectLinks(rawLinks)` — füllt fehlende `sourceKind`/`confidence` mit den
    128-Matrix-Defaults (`manual` / `1.00`) **nur für Legacy/fehlende Werte**
    (`?? `, d.h. `confidence: 0` bleibt erhalten), dedupt nach
    `(serviceId, kind, url)` (first-wins, JSON-Tuple-Key wie `links.ts`) und
    sortiert stabil → byte-deterministischer Plan, idempotenter Re-Apply.
  - `assertLinks(value, where)` — Validierung **vor** jedem Write: `serviceId`
    nicht-leer (services-FK), `url` nicht-leer, `kind ∈ external_link_kind`,
    `sourceKind ∈ {podcast_rss, manual}` falls gesetzt, `confidence ∈ [0,1]`
    falls gesetzt. Fehlende `links`-Arrays und fehlende Provenance werden
    **toleriert** (Pre-S2-Legacy). Verdrahtet in `assertShowArtifact` für Show +
    je Episode.

### Apply-Script

- `scripts/apply-podcast.ts`
  - `resolveTargets({file, show, all})` — Registry ist SSOT (`loadRegistry` +
    `selectShows`, gespiegelt von `ingest-podcast.ts`): `--all` → alle Shows,
    `--show <slug>` → eine (wirft bei unbekanntem Slug), default = Pilot.
    `--file <path>` umgeht die Registry und ist **mutually exclusive** mit
    `--show`/`--all`. Artefakt-Pfad = `ingest/podcasts/<slug>.json`.
  - Show-Links: in `upsertShow` (gleiche Transaktion wie Show-Upsert) per
    `DELETE external_links WHERE work_id = <show>` + Insert aus `plan.show.links`.
  - Episode-Links: in `applyEpisode` (gleiche Transaktion wie Detail + Junctions)
    per `DELETE … WHERE work_id = <episode>` + Insert aus `ep.links`. Beides
    **strikt nach `work_id` gescoped** → kein Book-Link wird je angefasst.
  - `linkRows(workId, links)` — 1:1-Projektion auf die `external_links`-Spalten;
    `confidence` als `numeric(3,2)`-String (`toFixed(2)`, Konvention aus
    `apply-override.ts`), `displayOrder` = deterministische Plan-Reihenfolge,
    `label`/`region`/`affiliate` → Spalten-Defaults.
  - `main` iteriert die Targets (eine geteilte `loadReferenceSets()`-Query),
    `printPlan` zeigt pro Show **Episodes, Tags, Links (inkl. Show-Services),
    Drops**; `applyShow` druckt eine DB-seitige Summary inkl.
    `External links — show/episodes`.

### Tests

- `scripts/test-podcast-apply.ts` — 25 → **37 Tests**. `validArtifact()`-Fixture
  trägt jetzt Show- (3) + Episode-Links; neue Sektion „links: projection +
  validation" (Projektion in Plan+Report, Sortier-Invarianz, Dedup-first-wins,
  Legacy-Default `manual`/`1.00`, komplett fehlende `links`-Arrays toleriert, +5
  Validierungs-Negativtests). Der In-Memory-`simulateApply` modelliert jetzt
  `external_links` als per-Work delete-then-insert; neue Idempotenz-Tests:
  Doppel-Apply ohne Link-Dubletten, verbesserter Artefakt-Replace ohne stale
  Links, und der Real-Artefakt-Test prüft Link-Projektion + Link-Idempotenz mit.

## Decisions I made

- **`external_links` per-Work, in derselben Transaktion wie die Junctions.** Der
  Brief verlangt „delete-then-insert nur für die betroffenen Podcast-Works". Der
  `work_id`-Scope garantiert das mechanisch: ein Book-Work hat eine andere id,
  also kann der `DELETE` ihn nie treffen. Die Links sitzen in der gleichen
  Episode-/Show-Transaktion → ein Fehler rollt den Work atomar zurück.
- **Provenance verbatim, Defaults nur als Boden.** `projectLinks` nimmt
  `sourceKind`/`confidence` aus dem `PodcastLink`; `manual`/`1.00` greifen
  ausschließlich, wenn das Feld fehlt (Legacy/Hand-Edit). Damit ist S3 reine
  Projektion, keine Matrix-Re-Derivation (128-Plan wörtlich).
- **Validierung lenient bei Provenance, strikt bei DB-Constraints.**
  `assertLinks` lässt fehlende `links`/`sourceKind`/`confidence` durch (Plan
  defaultet), erzwingt aber alles, was Postgres sonst erst beim INSERT ablehnen
  würde (FK/Enum/Range) — fail-before-write.
- **Kein Service-Existenz-Gate im Apply.** Anders als bei Entity-Tags (die gegen
  das Reference-Set gefiltert werden) gibt es für die 5 kontrollierten Services
  kein Drop: sie existieren prod- und dev-sicher (S1, Migration `0011`). Ein
  fehlender Service soll laut fehlschlagen (FK), nicht still verschwinden.
- **`--file` ⊥ `--show`/`--all`.** Eine explizite Datei ist Single-Artifact; mit
  einem Registry-Selektor kombiniert wäre die Absicht mehrdeutig → harter Fehler.

## Verification

Alle gegen `npm run …` (Git-Bash, `.env.local` vorhanden):

- `typecheck` — pass (exit 0)
- `lint` — pass (exit 0)
- `test:podcast-ingest` — **30 passed, 0 failed** (unverändert)
- `test:podcast-apply` — **37 passed, 0 failed** (war 25)
- `brain:lint -- --no-write` — 0 blocking, 13 warnings (alle pre-existing)

**Dry-run (beide Shows, stabile Counts):**

```
the-40k-lorecast:   149 Episoden, 519 Junctions, show 5 / episodes 149 Links
adeptus-ridiculous: 363 Episoden, 778 Junctions, show 5 / episodes 363 Links
```

**Live Apply (Dev-Supabase) — idempotent über zwei Läufe:**

| Show | Lauf 1 | Lauf 2 |
|---|---|---|
| the-40k-lorecast | 149 updated, 5 show / 149 ep Links | 149 updated, 5 / 149 (identisch) |
| adeptus-ridiculous | 134 inserted + 229 updated = 363, 5 / 363 | **0 inserted**, 363 updated, 5 / 363 (identisch) |

> Hinweis Wall-Clock: jede Episode ist eine eigene Mehr-Query-Transaktion über
> die Pooler-Verbindung (kein IPv6 → Pooler-URL); ein `--all` über 512 Episoden
> dauert ~13–16 min. Ein erster `--all`-Lauf mit 500 s Foreground-Timeout brach
> mitten in Adeptus ab (229/363) — **kein Korrektheitsproblem**: der Re-Run hat
> sauber auf 363 reconciliert, und schon der Teilstand zeigte distinct == total
> (keine Dubletten). Adeptus wurde danach im Hintergrund zweimal vollständig
> angewandt (Tabelle oben).

**Finaler DB-Stand (autoritativ, beide Shows):**

```
adeptus-ridiculous: episodes=363  audioUrl_present=363  showLinks=5(distinct 5)  epLinks=363(distinct 363)
the-40k-lorecast:   episodes=149  audioUrl_present=149  showLinks=5(distinct 5)  epLinks=149(distinct 149)
duplicate (work,service,kind,url) groups across podcast works: 0
total podcast external_links: 522   (= 154 Pilot + 368 Adeptus)
```

`audioUrl_present == episode count` für beide Shows → der Scalar ist intakt und
co-geschrieben (Brief-Req 3). `distinct == total` überall + 0 Dublette-Gruppen →
Links sind autoritativ + idempotent (Req 4/7).

### Adversariale Review (Multi-Agent-Workflow)

6 Dimensionen (idempotency, link-projection, validation, cli-multishow,
scope-consumers, tests), jeder Roh-Befund einzeln adversarial gegengeprüft
(default `real=false`): **0 bestätigte Findings, 15 refutiert** (21 Agents). Die
refutierten Befunde sind durchweg dokumentiertes/intendiertes Verhalten oder
außerhalb des S3-Scopes — die nennenswerten unter „Known limitations".

## Known limitations / follow-up (alle nur notiert, kein S3-Fix)

- **Cross-Work-Atomicity.** Show + N Episoden sind N+1 Transaktionen (Episode =
  bewusste Atomicity-Grenze, Brief 114). Ein Abbruch mitten im Lauf hinterlässt
  einen Teilstand, der per Re-Run sauber reconcilet (oben live gezeigt). Kein
  Korrektheitsbug; ein 363-Episoden-Single-Tx wäre schlechter (Lock-Druck).
- **Aus dem Feed verschwundene Episoden** werden nicht gelöscht (kein
  Reconcile-Sweep) — Pre-existing aus Brief 114 (`schema.ts`: bewusst kein
  `onDelete: cascade`), außerhalb des „delete-then-insert nur für betroffene
  Works"-Scopes. Kandidat für einen späteren Cleanup-Pass.
- **`--show` + `--all` gleichzeitig:** `--all` gewinnt, `--show` wird still
  ignoriert (Superset-Präzedenz, konsistent mit `ingest-podcast.ts`). Kosmetik,
  kein Daten-/Idempotenz-Effekt.

## For next session

- **S4 — YouTube Episode Matching (Folge-Item, bleibt offen).** Liest
  `youtubeChannelUrl`/`youtubeChannelId` aus der Registry (für beide Shows
  gesetzt), schreibt `youtube`/`watch`-Links **nur ins Artefakt**; der hier
  gebaute Apply projiziert sie danach unverändert mit (`projectLinks` +
  per-Work-Replace decken den `youtube`-Service bereits ab). B1 ist **ohne** S4
  batches-seitig abgeschlossen.
- **Product P4 (eigener Strang, bleibt Folgearbeit).** `/podcasts` (und
  Entity-Hubs) sollen Show-/Episode-Links gegen `external_links` rendern statt
  nur den `audioUrl`-Scalar. Reine Product-Board-Arbeit, nicht Batches.
- Board 122-B1 bleibt hier unangetastet — Cowork hakt es im Coordination-Pass ab
  (Rollup-Ownership).

## References

- `sessions/2026-06-04-128-impl-podcast-b1-plan-reconciliation.md` — der
  S1–S5-Plan + Link-Matrix, den S3 abschließt (B1-Kern).
- `sessions/2026-06-06-122-impl-podcast-b1-s2-registry-ingest.md` — S2
  (Registry + Link-Shape im Artefakt), auf dem S3 aufsetzt.
- `sessions/2026-06-02-114-impl-podcast-schema-apply.md` — Podcast-Schema/Apply
  (Step 2), die Identitäts-/Idempotenz-Basis.
- `src/lib/ingestion/podcast/apply-plan.ts`, `scripts/apply-podcast.ts`,
  `scripts/test-podcast-apply.ts` — der S3-Diff.
