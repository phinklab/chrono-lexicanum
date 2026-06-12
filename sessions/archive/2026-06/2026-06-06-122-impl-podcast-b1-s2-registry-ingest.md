---
session: 2026-06-06-122
role: implementer
date: 2026-06-06
status: complete
slug: podcast-b1-s2-registry-ingest
parent: 2026-06-03-122
links:
  - 2026-06-06-122
  - 2026-06-04-128
  - 2026-06-02-114
  - 2026-06-01-110
commits: []
---

# Podcast B1 — S2 Registry + Multi-Show Ingest (no DB writes)

> Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch:
> `codex/ingest-batches-podcast-b1-s2-registry` (frisch von `origin/main`).

## Summary

Der Podcast-Ingest ist jetzt **registry-getrieben** statt hardcodiert, und das
committete Artefakt trägt ein **Link-Shape** (`show.links[]` + `episodes[].links[]`),
das S3 1:1 in `external_links` projizieren kann (Brief-128-Link-Matrix). Der
Pilot („The 40k Lorecast") wurde deterministisch re-generiert — **Tagging
byte-identisch**, einziger Diff sind die Links + ein `$generatedBy`-Stempel.
**Adeptus Ridiculous** (Buzzsprout, 363 Folgen, aktiv) ist als erste fremde Show
aufgenommen, sein Artefakt + Report sind erzeugt. **Kein DB-Write, kein
`apply:podcast`** — reine S2-Arbeit.

## What I did

### Registry (neu)

- `scripts/seed-data/podcast-shows.json` — die neue Show-Registry. Ein Eintrag
  pro Show mit `slug`, `title`, `feedUrl`, `appleId`, `podcastGuid`, kuratierten
  `links[]` und optionalen `youtubeChannelUrl`/`youtubeChannelId` (für S4). Zwei
  Shows: der Pilot (aus dem Hardcoding gezogen) und Adeptus Ridiculous.
- `src/lib/ingestion/podcast/registry.ts` — `parseRegistry` (pure Validierung,
  fs-frei), `loadRegistry` (von Disk), `getShow`, `selectShows` (der reine Kern
  der CLI: `--all` / `--show <slug>` / default Pilot), `SERVICE_LINK_SPEC` (die
  Brief-128-Matrix als Daten: serviceId → kind/sourceKind/confidence),
  `DEFAULT_SHOW_SLUG`.

### Link-Shape

- `src/lib/ingestion/podcast/types.ts` — neue `PodcastLink`-Schnittstelle
  (`serviceId`, `kind`, `url`, `sourceKind`, `confidence`) plus lokale
  String-Unions `ExternalLinkKind` / `PodcastLinkSourceKind` (+ Runtime-Arrays
  für Validierung), gespiegelt vom DB-Enum, ohne Drizzle-Import (wie
  `EpisodeKind`). `ShowArtifact.show` und `EpisodeArtifact` bekommen je
  `links: PodcastLink[]` (required).
- `src/lib/ingestion/podcast/links.ts` (neu) — pure, deterministische
  Link-Assembly: `buildShowLinks` (RSS aus `feedUrl` + Apple aus `appleId`
  **abgeleitet**, Rest aus der Registry), `buildEpisodeLinks` (RSS-Enclosure aus
  `audioUrl` als `listen`/`rss`/`podcast_rss`), `enrichLink` (füllt
  kind/sourceKind/confidence aus dem Spec), `appleUrlFromId`. Alle Builder
  deduppen nach `(serviceId, kind, url)` und sortieren stabil danach.
- `src/lib/ingestion/podcast/artifact.ts` — `buildShowArtifact` nimmt
  `show.links` entgegen und leitet pro Episode `buildEpisodeLinks(e)` ab;
  `buildReport` bekommt zwei Link-Zeilen (Show-Link-Services + Episode-Link-
  Coverage). `$generatedBy` + die Repro-Zeile sind auf B1-S2 aktualisiert.

### CLI

- `scripts/ingest-podcast.ts` — komplett registry-getrieben. `--show <slug>`
  (default = Pilot), `--all` (iteriert alle Shows, **soft-failt pro Feed**:
  ein toter Feed bricht den Lauf nicht ab, Fehler landet in der Summary, Exit
  ≠ 0 erst nach allen Shows), `--limit` (Smoke). Der feed-deklarierte
  `podcast:guid` bleibt autoritativ, fällt aber auf den Registry-Wert zurück.
  Die alten Ad-hoc-Flags `--feed`/`--slug`/`--apple-id` entfallen — eine neue
  Show ist jetzt ein Registry-Eintrag, kein CLI-Override (Registry = SSOT).

### Tests

- `scripts/test-podcast-ingest.ts` — +16 Tests (10 → 26): `parseRegistry`
  (valide/duplicate-slug/missing-field/bad-link-kind/unknown-service-ohne-spec),
  `getShow`/`selectShows` (default/--show/--all/unknown), `enrichLink`,
  `buildShowLinks` (RSS+Apple abgeleitet, dedup, sortiert, deterministisch,
  appleId=null), `buildEpisodeLinks`, Artefakt-Link-Shape byte-stabil, und ein
  Smoke gegen die committete Registry (Pilot+Adeptus, 5 Show-Services).
- `scripts/test-podcast-apply.ts` — Fixtures (`validArtifact`) um `links: []`
  ergänzt (Typ-Anpassung); Apply-Logik unverändert (ignoriert Links — S3-Sache).

### Doc

- `scripts/seed-data/README.md` — Files-Tabelle um `podcast-shows.json`
  ergänzt (consumed by `ingest-podcast.ts`, **nicht** geseedet).

## Decisions I made

- **Link-Shape trägt volle Provenance, S3 ist reine Projektion.** Jeder
  `PodcastLink` carries `sourceKind` + `confidence` aus `SERVICE_LINK_SPEC`,
  sodass S3 die Matrix **nicht** erneut ableiten muss — „Artefakt als Single
  Source" (128-Plan) wörtlich genommen. Eine Service ohne Spec-Default muss
  kind/sourceKind/confidence im Registry-Eintrag explizit setzen (Parser
  erzwingt das), damit `enrichLink` nie unvollständig ist.
- **RSS + Apple abgeleitet, Rest kuratiert.** Der RSS-Feed-Link (= `feedUrl`)
  und der Apple-Link (`appleUrlFromId(appleId)`, region-neutrale `id`-Form)
  werden vom Ingest erzeugt; die Registry listet nur, was der Feed nicht
  hergibt (official site, Spotify, YouTube). Hält die Registry minimal + DRY.
- **`--feed`/`--slug`/`--apple-id` entfernt.** S2 macht die Registry zur SSOT;
  eine Ad-hoc-Feed-URL ohne Registry-Eintrag hätte weder appleId noch
  kuratierte Links und würde das Link-Shape unvollständig lassen. Onboarding =
  Registry-Eintrag (genau wie Adeptus). Bewusste, kleine Verhaltensreduktion.
- **`--all` Exit-Code.** Soft-fail pro Feed (Loop läuft weiter), aber wenn am
  Ende **irgendeine** Show fehlschlug → `process.exitCode = 1`, damit CI einen
  toten Feed sieht. Kein Abbruch, kein stilles Verschlucken.
- **Spotify/YouTube nur adversarial-verifiziert aufgenommen.** RSS/Apple/
  official-site habe ich direkt verifiziert (iTunes-Lookup, Feed-Fetch,
  https-Check). Spotify + YouTube für **beide** Shows liefen durch einen
  Verifikations-Workflow (Discover → independent Refute); alle vier Claims
  `refuted=false` mit Cross-Link von der offiziellen Seite / Host-Match →
  „sicher bekannt", confidence 1.00 / sourceKind `manual`. Siehe „Provenance".
- **Pilot-Diff bewusst minimal.** `links` werden ans Ende jedes Episode- und
  des Show-Objekts angehängt; dadurch ändern sich an den bestehenden Zeilen nur
  die Trailing-Commas. Verifiziert: Tag-/Episode-Content **byte-identisch** zum
  HEAD-Artefakt (Links gestrippt → deep-equal).

## Provenance — verifizierte Show-Identitäten

| Show | feedUrl | appleId | podcastGuid | direkt verifiziert | adversarial verifiziert |
|---|---|---|---|---|---|
| the-40k-lorecast | feeds.redcircle.com/cc233adb-… | 1709093251 | cc233adb-… | RSS, Apple, official site | Spotify `2Z8HKiDH3nlvFzO2H18GHI`, YouTube `@40KLorecast` |
| adeptus-ridiculous | rss.buzzsprout.com/1497970.rss | 1679817767 | 7402e137-… | RSS (363 Folgen, jüngste 2026-06-03), Apple, official site | Spotify `6KnaAHvqf0pgTs3Kw3qQTR`, YouTube `UCPfZBLCYNEonc-Cyk1QUHPA` |

- Adeptus aufgelöst via iTunes-Search-API (`term=Adeptus Ridiculous&entity=podcast`,
  resultCount 1, exakter Treffer). Feed direkt gefetcht + strukturell geparst:
  Channel-Title, `podcast:guid`, 363 `<item>`, Buzzsprout-Stil-GUIDs
  (`Buzzsprout-<id>` → Slug-Derivation funktioniert), jüngste Folge 2026-06-03
  (aktiv). official site = Channel-`<link>` (`adeptusridiculous.com` →
  `https://www.adeptusridiculous.com/`, https-verifiziert).
- Spotify/YouTube: 6-Agent-Verifikations-Workflow, jede Claim einzeln
  refutiert (alle `refuted=false`, mehrfache unabhängige Korroboration).

## Verification

Alle gegen `npm run …` (Git-Bash):

- `typecheck` — pass (exit 0)
- `lint` — pass (exit 0)
- `test:podcast-ingest` — **26 passed, 0 failed** (war 10)
- `test:podcast-apply` — **25 passed, 0 failed** (gegen das re-generierte
  link-tragende Pilot-Artefakt)
- `brain:lint -- --no-write` — 0 blocking, 13 warnings (alle pre-existing)
- **Pilot-Determinismus:** `links` gestrippt → neues Artefakt deep-equal zum
  HEAD-Artefakt; 76/149 Episoden mit unresolved forms unverändert, 149/149
  tragen jetzt einen RSS-Link, 5 Show-Links. Nur Link-Shape + Stempel im Diff.
  Re-Generierung aus dem **bereinigten** Code (siehe Review) ist byte-identisch.
- **Kein DB-Write:** `scripts/ingest-podcast.ts` importiert kein `@/db`, ruft
  kein `apply`; keine Migration, keine `db:*`-Kommandos gelaufen.

### Adversariale Review (Multi-Agent-Workflow)

5 Review-Dimensionen (determinism/link-shape, S3-forward-compat,
registry-validation, cli-multishow, no-db-write/tests), jeder Roh-Befund einzeln
adversarial gegengeprüft. Die vier Kern-Dimensionen (Determinismus,
S3-Projektion, CLI-Soft-Fail, kein-DB-Write) kamen **clean** durch — 0 Befunde.
Bestätigt + behoben:

- **(high) `confidence`-Range.** `parseRegistry` prüfte nur `Number.isFinite`,
  nicht `[0, 1]` — ein Registry-Wert `1.5` wäre erst an Postgres' `numeric(3,2)`
  in S3 gescheitert. Jetzt: Range-Check im Parser + Test.
- **(low) Dedup-Key-Robustheit.** Der Dedup-Key war space-konkateniert; jetzt
  `JSON.stringify([serviceId, kind, url])` (kollisionsfrei, kein Trennzeichen).
  Semantisch neutral — Pilot-Artefakt byte-identisch (verifiziert).
- **(med/low) Test-Coverage-Lücken.** Direkte Tests für `sortLinks`
  (Order-Invarianz), `enrichLink`-Fehlerpfad, Dedup-First-Wins, und
  `confidence`-out-of-range ergänzt. `test:podcast-ingest` 26 → **30**.

> **Hinweis (Tooling-Artefakt):** Beim Schreiben von `links.ts` schlich sich in
> EINER Zeile (dem Dedup-Key) ein NUL-Byte je Template-Space ein — entdeckt,
> Datei sauber neu geschrieben, alle berührten Files + committete Artefakte auf
> `0x00` geprüft (alle 0). Kein NUL im Repo.

### Ingest-Kommandos (dokumentiert)

```
# Pilot deterministisch re-generieren (warmer Cache → 149/149 hits, $0):
PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast
# entspricht: npm run ingest:podcast -- --show the-40k-lorecast

# Adeptus Ridiculous (frisch, 363 Folgen):
PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --show adeptus-ridiculous

# Beide (soft-fail pro Feed, Summary):
PODCAST_LLM_MODEL=claude-sonnet-4-6 npm run ingest:podcast -- --all
```

Pilot-Lauf: 149 Episoden, 137 getaggt (91.9 %), 149/149 Cache-Hits, $0.
Adeptus-Lauf: 363 Episoden, 280 getaggt (77.1 %), Erstlauf 0/363 Cache-Hits,
720 835/45 717 Tokens, **$2.85**. Warm-Re-Run aus dem bereinigten Code:
363/363 Cache-Hits, $0, **byte-identisch** (Dedup-Key-Änderung neutral).
Beide Artefakte bestehen `assertShowArtifact` (S3 kann sie konsumieren); jede
Episode trägt ihren RSS-Enclosure-Link, jede Show 5 Links (rss, apple_podcasts,
official_website, spotify, youtube) exakt gemäß der 128-Matrix.

## Open issues / blockers

Keine. S2 ist daten-/batches-seitig abgeschlossen, ohne DB-Write.

## For next session

- **S3 (eigener PR, `/clear` davor):** `apply-podcast.ts` bekommt `--show`/
  `--all` und schreibt `external_links` autoritativ aus `show.links[]` /
  `episodes[].links[]` (delete-then-insert je Work), mit `source_kind` +
  `confidence` direkt aus dem `PodcastLink` (keine Matrix-Re-Derivation). Audio-
  Scalar (`podcast_episode_details.audioUrl`) bleibt, co-geschrieben. Show via
  `podcastGuid → feedUrl → slug`, Episode via `(podcastWorkId, episodeGuid)`.
- **S4 (Folge-Item):** YouTube-Episode-Matching liest `youtubeChannelUrl`/
  `youtubeChannelId` aus der Registry (für beide Shows gesetzt), schreibt nur
  ins Artefakt.
- Board 122-B1 bleibt hier unangetastet — Cowork hakt im Coordination-Pass ab
  (Rollup-Ownership).

## References

- `sessions/2026-06-04-128-impl-podcast-b1-plan-reconciliation.md` — der
  S1–S5-Plan + Link-Matrix, den S2 umsetzt.
- `sessions/2026-06-06-122-impl-podcast-b1-s1-link-foundation.md` — S1
  (external_links-Provenance + Services), auf dem S2 aufsetzt.
- `src/lib/ingestion/podcast/registry.ts`, `links.ts`, `types.ts` — die neuen
  Bausteine.
- `scripts/seed-data/podcast-shows.json` — die Registry.
