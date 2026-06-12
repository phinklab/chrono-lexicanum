---
session: 2026-06-04-128
role: implementer
date: 2026-06-04
status: complete
slug: podcast-b1-plan-reconciliation
parent: 2026-06-03-122
links:
  - 2026-05-31-110
  - 2026-06-01-110
  - 2026-06-01-114
  - 2026-06-02-114
  - 2026-06-03-121
commits: []
---

# Podcast B1 - Plan-Reconciliation nach Review

> Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch:
> `codex/ingest-batches-podcast-links`.

## Summary

Die Review ist in der Substanz richtig: Episode-Links gehoeren in
`external_links`, YouTube-Matching muss vom deterministischen Fundament getrennt
werden, und der Multi-Show-Ausbau soll erst am bekannten Pilot bewiesen werden,
bevor ein fremder Feed-Host dazukommt. Dieser Plan ersetzt den urspruenglichen
S1-S5-Split fuer Board-Item 122-B1.

Wichtigste bewusste Abweichung von der Review-Option: `podcast_episode_details.audioUrl`
bleibt vorerst als feed-intrinsischer Scalar bestehen. Der Apply schreibt dieselbe
Audio-URL aus demselben Artefakt zusaetzlich als `external_links`-Row. Damit gibt
es eine Quelle, aber zwei DB-Projektionen: den bestehenden `/podcasts`-Loader
und den generischen Cross-Media-Link-Store.

## Review-Auswertung

### Uebernehmen

- **Episode-Links in `external_links`.** Episoden sind `works`; deshalb muessen
  ihre Listen-/Watch-Links im work-skalierten Link-Store landen, nicht nur in
  `podcast_episode_details`.
- **`external_links` bekommt Provenance.** Additive Migration:
  `source_kind source_kind NOT NULL DEFAULT 'manual'` und
  `confidence numeric(3,2) DEFAULT '1.00'`, analog `works.confidence`.
- **Artefakt als Single Source.** `show.links[]` und `episodes[].links[]` sind
  der autoritative Input. Apply loescht und schreibt die `external_links` je
  Podcast-Show/Episode aus dem Artefakt neu.
- **YouTube-Episode-Matching entkoppeln.** Link-Shape und RSS-Audio kommen in
  den B1-Kern; der fragile Matcher wird ein Folge-Item nach B1-Closure.
- **Session 2 entlasten.** Erst Pilot auf Registry + Link-Shape umstellen und
  deterministisch re-generieren, dann Adeptus Ridiculous als erster fremder
  Feed-Host.
- **Registry statt Hardcoding.** Show N+1 ist ein JSON-Eintrag plus
  `ingest/apply --show <slug>`; YouTube-Kanal/Playlist kommt aus der Registry,
  nicht aus Code.
- **Prod-Service-Rows explizit.** `services.json` reicht fuer Dev-Seed, aber die
  geseedete Prod-DB braucht idempotente Inserts fuer neue Services.
- **`--all` soft-failt pro Feed.** Ein toter Feed darf den ganzen Multi-Show-Lauf
  nicht abbrechen.
- **Rollup-Ownership beachten.** Batches schreibt kein Board/Brain-Backfill;
  Completion steht im Impl-Report, Cowork hakt 122-B1 im Coordination-Pass ab.

### Anders machen

- **Audio-Scalar nicht jetzt retiren.** Sauberer waere nur `external_links`, aber
  der bestehende `/podcasts`-Loader liest `podcast_episode_details.audioUrl`.
  B1 haelt Scope klein: Scalar bleibt, wird aus `episodes[].links[]`/Feed-Audio
  co-geschrieben und driftet nicht, weil das Artefakt die einzige Quelle ist.
- **Kein neuer `subscribe`-Enum-Wert.** Der RSS-Feed-Link nutzt
  `external_link_kind='listen'` mit `serviceId='rss'`; die UI kann ihn ueber den
  Service als "RSS feed" labeln. Ein neuer Enum ist fuer B1 nicht noetig.
- **B1 schliesst ohne YouTube-Episode-Matches.** Show-Level-YouTube-Link aus der
  Registry ist okay; Episode-Level-YouTube ist optionaler Follow-up.

### Nicht uebernehmen

- **Board 122 direkt editieren.** Das Board ist Architect-/Coordination-Backfill;
  im Batches-Worktree bleibt es unangetastet.
- **Product-Gap im Batches-PR loesen.** Entity-Hubs listen Podcast-Episoden noch
  nicht vollwertig mit Links neben Buechern. Das ist Product-Board-Arbeit, nicht
  B1-Datenarbeit.

## Angepasster B1-Plan

### S1 - Link Foundation

Ziel: Link-Schema und Services so vorbereiten, dass Podcast-Links generisch und
prod-sicher geschrieben werden koennen.

Code/Data:

- `src/db/schema.ts`: `externalLinks` erhaelt `sourceKind` und `confidence`.
- Migration: additive Spalten auf `external_links`; keine Consumer brechen, weil
  bestehende Reader explizite Projektionen nutzen.
- `scripts/seed-data/services.json`: neue Services
  `official_website`, `rss`, `apple_podcasts`.
- `scripts/seed-data/README.md`: Service-Count 18 -> 21.
- Prod-Datenpfad: idempotente Service-Inserts
  `ON CONFLICT (id) DO NOTHING`, entweder in der Migration oder in einem
  kleinen Daten-Step desselben PRs.

Link-Matrix:

| Scope | serviceId | kind | sourceKind | confidence | Quelle |
|---|---|---|---|---:|---|
| Show official site | `official_website` | `official_page` | `manual` | 1.00 | Registry |
| Show RSS feed | `rss` | `listen` | `podcast_rss` | 1.00 | Feed URL |
| Show Apple | `apple_podcasts` | `listen` | `manual` | 1.00 | Registry / Apple id |
| Show Spotify | `spotify` | `listen` | `manual` | 1.00 | Registry |
| Show YouTube channel | `youtube` | `watch` | `manual` | 1.00 | Registry |
| Episode audio enclosure | `rss` | `listen` | `podcast_rss` | 1.00 | RSS item |
| Episode YouTube match | `youtube` | `watch` | `youtube` | matcher score | Follow-up |

Acceptance:

- Migration generated and applied or clearly reported if env is absent.
- Existing tests still green; no podcast ingest/apply behavior change yet.
- Services exist in JSON and in the target DB after the data step.

### S2 - Registry + Multi-Show Ingest, ohne DB-Writes

Ziel: Ingest wird registry-getrieben und produziert link-faehige Artefakte.

Code/Data:

- Neue Registry, bevorzugt `scripts/seed-data/podcast-shows.json`:
  `slug`, `title`, `feedUrl`, `appleId`, optional `podcastGuid`,
  `links[]`, optional `youtubeChannelUrl`/`youtubeChannelId`.
- `scripts/ingest-podcast.ts` liest `--show <slug>` aus der Registry; default
  bleibt der Pilot.
- `--all` iteriert Shows und soft-failt pro Feed mit Summary.
- `ShowArtifact` erhaelt `show.links[]`.
- `EpisodeArtifact` erhaelt `links[]`; mindestens die RSS-Enclosure-Audio-URL
  wird als `listen/rss/podcast_rss` Link serialisiert.
- Pilot zuerst re-generieren und gegen den aktuellen Artefakt-Diff pruefen:
  Tagging bleibt cache-warm/stabil, erwarteter Diff sind Links/Registry-Felder.
- Danach Adeptus Ridiculous als erste neue Show onboarden; wenn der Buzzsprout-
  Feed strukturell zickt, S2 nicht mit Architekturarbeit vermischen, sondern im
  Report sauber blocken/abspalten.

Acceptance:

- Pilot-Artefakt mit neuem Link-Shape deterministisch re-generiert.
- Adeptus-Artefakt + Report erstellt oder Feed-Problem als `needs-decision`
  dokumentiert.
- Kein DB-Write in S2.

### S3 - Apply Multi-Show + External Links

Ziel: B1-Kern schliessen. Show/Episoden/Junctions und Link-Rows werden aus den
committeten Artefakten in die DB geschrieben.

Code:

- `scripts/apply-podcast.ts` erhaelt `--show <slug>` und `--all`.
- Apply bleibt idempotent: Show via `podcastGuid -> feedUrl -> slug`, Episode via
  `(podcastWorkId, episodeGuid)`.
- Apply schreibt weiterhin `podcast_episode_details.audioUrl` aus dem Artefakt.
- Apply ersetzt pro Podcast-Work die `external_links` autoritativ aus
  `show.links[]` / `episodes[].links[]`.
- Entity-Junction-Ownership bleibt wie heute: pro Episode delete-then-insert
  fuer `work_characters`, `work_factions`, `work_locations`.

Acceptance:

- Dry-run zeigt pro Show: Episodes, Tags, Links, Drops.
- Live-Apply zweimal hintereinander ist idempotent: keine neuen Episoden, keine
  Junction-/Link-Dubletten, stabile Counts.
- B1 gilt nach S3 als daten-/batches-seitig erledigt, auch ohne
  Episode-Level-YouTube-Matches.

### S4 - YouTube Episode Matching, Folge-Item

Ziel: Artefakte optional um YouTube-Episode-Links anreichern, ohne B1 zu
blockieren.

Regeln:

- Kanal/Playlist kommt immer aus der Registry, nie hardcoded fuer Adeptus.
- Matching schreibt nur ins Artefakt; der bestehende Apply fuegt danach
  `youtube/watch`-Rows hinzu.
- Matcher muss Score/Confidence und Match-Grund reporten.
- Wenn API/ToS/Flakiness unsauber ist, bleibt S4 geparkt.

### S5 - Product, eigener Strang

Bleibt Product-Board-Arbeit:

- 121-P4: `/podcasts` rendert Show-Links und Download/Listen-Optionen gegen
  `external_links`, mit Fallback auf den Scalar solange noetig.
- Zusaetzliches Product-Gap fuer Entity-Hubs: `/fraktion`, `/charakter`,
  `/welt` sollen Podcast-Episoden nicht nur zaehlen, sondern als echte Works mit
  passendem Label/Listen-Link neben Buechern fuehren. Das gehoert in 121-P5 oder
  ein neues Product-Board-Item.

## For next implementation session

- Mit S1 starten, frisch von `origin/main` branchen, nachdem vorherige Podcast-
  PRs gemergt sind.
- Keine `brain/**`, kein `sessions/README.md`, kein Board-Status im Batches-PR.
- Bei S2/S3 jeweils eigener PR und `/clear` dazwischen, weil Artefakte und
  Migrationen aufeinander aufbauen.

## Verification

Keine Code-Aenderung in dieser Reconciliation. Geprueft gegen:

- `sessions/2026-05-31-110-arch-podcast-ingest-pilot.md`
- `sessions/2026-06-01-110-impl-podcast-ingest-pilot.md`
- `sessions/2026-06-01-114-arch-podcast-schema-apply.md`
- `sessions/2026-06-02-114-impl-podcast-schema-apply.md`
- `sessions/2026-06-03-121-arch-product-board.md`
- `sessions/2026-06-03-122-arch-batches-board.md`
- `src/db/schema.ts`
- `src/lib/ingestion/podcast/*`
- `scripts/ingest-podcast.ts`
- `scripts/apply-podcast.ts`
- `src/app/podcasts/*`
- `src/lib/entity/*`
- `scripts/seed-data/services.json`
- `scripts/seed-data/README.md`
