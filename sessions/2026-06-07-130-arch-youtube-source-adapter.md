---
session: 2026-06-07-130
role: architect
date: 2026-06-07
status: open
slug: youtube-source-adapter
parent: null
links:
  - 2026-06-03-122
  - 2026-06-04-128
  - 2026-06-01-110
  - 2026-06-02-114
commits: []
---

# YouTube-as-source adapter — @luetin09 als YouTube-only Podcast-Show

## Goal

Eine zweite **Source-Acquisition** neben dem RSS-Pfad: ein YouTube-Adapter, der die
Uploads des Kanals **@luetin09** (Warhammer-40k-Lore, **nur** auf YouTube, kein RSS-Feed)
in **dasselbe interne Episoden-Modell, dieselbe Artefakt-Form und denselben Downstream**
einspeist wie die bestehenden RSS-Shows. Neu ist **ausschließlich** die Beschaffungs-Logik
davor; Tagging, Resolve, Artefakt-Assembly und (später) der DB-Apply bleiben unberührt.

Scope dieses Briefs (mit Philipp am 2026-06-07 festgelegt): **Adapter + Dry-Run**. Der
Adapter wird gebaut und produziert ein committed Dry-Run-Artefakt der **ersten 10 Folgen**
von @luetin09 im finalen Format — **keine DB-Writes**. Die nötigen Apply-Änderungen werden
hier **dokumentiert, aber nicht implementiert** (bewusster Folgeschritt nach Review).

> **Strang:** Batches (`chrono-lexicanum-batches`). Dies ist Code-Arbeit → eigener Task-Branch
> (`codex/ingest-batches-youtube-source`) + PR. Erweitert Board-Task **122-B1** („Podcast Step 3:
> weitere Shows"). Dieser Brief selbst ist doc-only und liegt auf `main`.

> **Abgrenzung zu S4 (Brief 128).** Das geplante **S4 = YouTube-Episode-*Matching*** reichert
> *bestehende RSS-Shows*, die auch auf YouTube posten, um `youtube/watch`-Episodenlinks an —
> die RSS-Feed bleibt dort die Episoden-Quelle. **Diese Aufgabe ist kategorisch anders:** für
> @luetin09 gibt es **keine RSS-Feed**; YouTube **ist** die Episoden-Quelle. S4 bleibt
> unangetastet. (Synergie: die hier gebaute Data-API-Beschaffung kann S4 später wiederverwenden —
> aber das ist nicht Teil dieses Briefs.)

## Context

Was heute existiert (von Cowork verifiziert am 2026-06-07 — **CC soll die Dateien dennoch
selbst gegenlesen**, nicht blind übernehmen):

**Pipeline-Form (zwei Skripte, dry-run → review → apply):**

- `scripts/ingest-podcast.ts` — Registry-getriebener **Dry-Run** (LLM-Tagging, kein DB). Pro Show:
  `fetchFeed(feedUrl)` → `parseFeed(xml)` → `{ show, episodes }` → LLM-Extract (gecached unter
  `ingest/.llm-cache/`) → `resolveEpisodeTags` (Alias-Modul) → `buildShowArtifact` → schreibt
  `ingest/podcasts/<slug>.json` + `<slug>.report.md`.
- `scripts/apply-podcast.ts` — separater, bewusster **Write** aus dem committed Artefakt in
  Postgres (`works` + `podcast_details` + `podcast_episode_details` + Junctions + `external_links`).
  `--dry-run` baut + druckt den Plan **ohne** Writes.

**Der Andock-Punkt (Source-Adapter-Grenze) ist exakt `ParsedFeed`:**

```ts
// src/lib/ingestion/podcast/feed.ts  (= der RSS-Adapter)
interface ParsedFeed { show: ParsedShowMeta; episodes: PodcastEpisode[] }
```

`ingest-podcast.ts` (Z. 111–112) ruft `fetchFeed` + `parseFeed` und arbeitet danach für
Extract/Resolve/Artefakt-Daten nur noch mit `{ show, episodes }`. Ein YouTube-Adapter, der
denselben `ParsedFeed`-Contract liefert, fällt durch denselben Tagging-/Resolve-Pfad.

**Wichtige Naht:** Die Link-Assembly ist die einzige bewusst source-aware Stelle. `ParsedFeed`
trägt keine Quelleninfo; deshalb darf `buildEpisodeLinks` die Quelle **nicht** aus URL-Formen,
`audioUrl:null` oder Watch-Domains erraten. `ingest-podcast.ts` gibt `cfg.source` explizit an
`buildShowLinks` / `buildEpisodeLinks` weiter (oder eine äquivalente explizite Source-Option).
RSS bleibt Default; YouTube bekommt einen eigenen Link-Pfad. Keine URL-Heuristik.

**Internes Episoden-Modell** (`src/lib/ingestion/podcast/types.ts`):

```ts
interface ParsedShowMeta { title: string; podcastGuid: string | null; imageUrl: string | null }
interface PodcastEpisode {
  guid: string;            // Stable-ID → episodeGuid; UNIQUE(show, guid)
  title: string;
  descriptionText: string; // HTML-stripped Plaintext = der Tagging-Input
  pubDate: string | null;  // ISO 8601
  durationSec: number | null;
  audioUrl: string | null; // RSS-Enclosure-MP3
  link: string | null;
  season: number | null;
  episode: number | null;
}
```

**Schema-Befunde (`src/db/schema.ts`) — wichtig:**

- `source_kind`-pgEnum enthält **bereits `"youtube"`** (Z. 91, in Stufe 2a für genau diesen Fall
  vorprovisioniert). **Keine Migration nötig**, um YouTube-Provenance zu schreiben.
- `work_kind` hat `podcast` (Show-Container) + `podcast_episode` (Feed-Item). Die `video` /
  `video_details`-Tabelle existiert ebenfalls — ist aber ein **ungenutzter Phase-5-Platzhalter**
  (Relations-Kommentar: „querying channel→video is a Phase 5 path"; keine Ingestion schreibt dort
  hinein). Wir routen @luetin09 **bewusst NICHT** dorthin — siehe Decision unten.
- `podcast_episode_details`: `episodeGuid text NOT NULL`, `UNIQUE(podcastWorkId, episodeGuid)` =
  die Dedup-/Identitäts-Achse. `audioUrl` ist **nullable**. Passt für YouTube ohne Schema-Change.
- `external_links.sourceKind` ist das `source_kind`-Enum (akzeptiert `youtube`) + `confidence`.

**Registry (`scripts/seed-data/podcast-shows.json` + `registry.ts`):** eine JSON-Zeile pro Show.
`PodcastShowConfig` trägt **bereits** optionale `youtubeChannelUrl` / `youtubeChannelId`-Felder
(B1 trägt sie nur mit; bisher von S4 vorgesehen). `feedUrl` ist aktuell **required** (`reqString`);
neu zu ergänzen ist der `source`-Discriminator (`"rss" | "youtube"`, default `"rss"`).
`SERVICE_LINK_SPEC.youtube = { kind: "watch", sourceKind: "manual", confidence: 1 }` (Show-Level-
Kanal-Link, Brief-128-Matrix).

**Show-Link-Falle:** `buildShowLinks` leitet heute immer einen
`rss/listen/podcast_rss`-Link aus `feedUrl` ab. Für `source:"youtube"` ist `feedUrl` aber nur
die stabile channel-id-gebundene Identity für `podcast_details.feedUrl`, **kein** externer
RSS-Listenlink. Der Show-Link-Builder muss source-aware werden: RSS-Shows behalten den
abgeleiteten RSS-Link; YouTube-Shows bekommen **keinen** abgeleiteten `rss`-Link, sondern nur
den Registry-YouTube-Kanal-Link.

**Link-Provenance (Brief 128 Matrix):** `PodcastLinkSourceKind` ist heute `"podcast_rss" | "manual"`.
Die 128-Matrix sieht für einen **Episode-YouTube-Link** aber `sourceKind: youtube` vor — der Typ
wurde dafür noch nicht erweitert.

**Apply-Provenance-Befund (für den dokumentierten Folgeschritt):** `apply-podcast.ts` **hardcodet**
`sourceKind: "podcast_rss"` auf dem Show-Work (Z. 249) **und** auf jedem Episode-Work (Z. 327). Für
eine YouTube-Quelle müssten diese `"youtube"` werden. → Out of scope hier, siehe „Dokumentierter
Folgeschritt".

## Decision — @luetin09 landet als `podcast` / `podcast_episode`, nicht als `video`

Philipps harte Vorgabe: **gleicher Ort, gleiches Format, gleicher Downstream wie die RSS-Episoden.**
Deshalb wird @luetin09 als **`podcast`-Show** modelliert, deren **`podcast_episode`**-Folgen aus
YouTube stammen — nicht über `video`/`video_details`. Begründung: `video_details` hätte einen
**separaten Downstream** (eigene Detail-Form, kein `episodeKind`, keine Show-Container-Semantik) und
würde „gleiches Format" brechen. Der einzige Trade-off — eine „Podcast-Episode" ohne Audio-Enclosure —
ist folgenlos: `audioUrl` ist nullable, und der menschlich relevante Link (YouTube-Watch) läuft ohnehin
über `external_links` (`youtube/watch`). Tagging/Search hängen an `descriptionText` + den Junctions,
beide quellen-unabhängig.

## Feld-Mapping — YouTube Data API v3 → bestehendes Schema

**Show (`ParsedShowMeta` + Registry-Config):**

| Ziel | YouTube-Quelle (Data API v3) | Notiz |
|---|---|---|
| `show.title` | `channels.list` → `snippet.title` | „Luetin09" |
| `show.podcastGuid` | — | `null` (YouTube hat keinen `podcast:guid`) |
| `show.imageUrl` | `channels.list` → `snippet.thumbnails.high.url` | Kanal-Avatar |
| `cfg.slug` | (Registry) | `"luetin09"` |
| `cfg.feedUrl` | abgeleitet aus channel id | `https://www.youtube.com/feeds/videos.xml?channel_id=<UC…>` — stabile, channel-id-gebundene Identity; **kein** RSS-Parse-Pfad und **kein** `rss`-Show-Link (nur Identitäts-/Provenance-String, hält `podcast_details.feedUrl` befüllt) |
| `cfg.youtubeChannelId` | `channels.list` → `items[0].id` | `UC…`, **muss verifiziert werden** |
| `show.links[]` | (Registry) | ein `{ serviceId:"youtube", kind:"watch", sourceKind:"manual", confidence:1 }` (Kanal-Seite); **kein** abgeleiteter `rss`-Link |

**Episode (`PodcastEpisode`):**

| Ziel | YouTube-Quelle (Data API v3) | Notiz |
|---|---|---|
| `guid` | `playlistItems` → `contentDetails.videoId` (= 11-Zeichen-Video-ID) | stabil → `episodeGuid`; Dedup via `UNIQUE(show, guid)` |
| `title` | `videos.list` → `snippet.title` | |
| `descriptionText` | `videos.list` → `snippet.description` | bereits Plaintext — nur Whitespace normalisieren, **kein** `htmlToText` nötig |
| `pubDate` | `videos.list` → `snippet.publishedAt` | **bereits ISO 8601** → direkt |
| `durationSec` | `videos.list` → `contentDetails.duration` | **ISO-8601-Dauer** (`PT#H#M#S`) → **neuer Parser** (bestehender `parseDurationToSeconds` kann nur `HH:MM:SS`) |
| `audioUrl` | — | `null` (kein Enclosure) |
| `link` | abgeleitet aus video id | `https://www.youtube.com/watch?v=<id>` |
| `season` / `episode` | — | `null` (YouTube hat keine Staffeln/Nummern) |
| `episode.links[]` | abgeleitet | **ein** `{ serviceId:"youtube", kind:"watch", url:<watch-url>, sourceKind:"youtube", confidence:1 }` (statt RSS-Audio-Enclosure) |

**Extras von YouTube ohne Schema-Home — bewusst verworfen (Parity):**

- `statistics.viewCount` / `likeCount` → **droppen** (kein Schema-Feld; kein Change in v1).
- Per-Video-Thumbnail → **droppen** (der RSS-Pfad setzt auch keinen Per-Episode-`coverUrl`; ein
  späterer optionaler `snippet.thumbnails → works.coverUrl`-Schritt ist eine 1-Zeilen-Erweiterung).
- YouTubes eigene `snippet.tags` → **ignorieren**; Entity-Tagging kommt unverändert aus dem LLM über
  `descriptionText` (quellen-agnostisch).

**`episodeKind`** (lore/news_recap/interview/other): unverändert vom LLM-Extract gesetzt. **Keine
Adapter-Arbeit** — luetin09-Lore-Videos klassifizieren über denselben Pfad wie RSS-Folgen.

## Acquisition — Data API v3 (empfohlen & gewählt)

**Warum Data API v3** (Philipp hat zugestimmt): pure `fetch` (passt zum Stack — das Projekt hat null
Binär-Deps), **offiziell** (kein ToS-Graubereich wie yt-dlp), stabiler dokumentierter Contract, die
Registry-Felder (`youtubeChannelId`) liegen bereits bereit, und `videos.list` liefert **Volltext-
Beschreibungen** (den Tagging-Input) effizient in 50er-Batches. Kosten: ein **kostenloser** Google-API-
Key in `.env.local`; Quota für diesen Use-Case trivial (Voll-Backfill ≈ wenige Dutzend Units gegen
10 000/Tag).

**Verworfene Alternativen (zur Doku):** *yt-dlp* — keyless, aber externes Python-Binary + ToS-Graubereich
+ schwererer Per-Video-Crawl für Beschreibungen. *Kanal-Atom-Feed* (`…/feeds/videos.xml?channel_id=`) —
liefert nur ~15 neueste Videos und ist Atom (`feed.ts` parst nur RSS 2.0) → unzureichend für Backfill;
die URL dient hier nur als stabile `feedUrl`-Identity.

**Flow (Backfill + laufend, identisch):**

1. **Handle → Channel + Uploads-Playlist:** `GET channels.list?part=snippet,contentDetails&forHandle=luetin09`
   → `items[0].id` (`UC…`), `items[0].contentDetails.relatedPlaylists.uploads` (`UU…`),
   `snippet.title` + `snippet.thumbnails`.
2. **Alle Upload-Video-IDs auflisten:** `GET playlistItems.list?part=contentDetails&playlistId=<UU…>&maxResults=50`
   — über `nextPageToken` paginieren bis erschöpft. Gesamtzahl = `pageInfo.totalResults`.
3. **Metadaten hydratisieren (50er-Batches):** `GET videos.list?part=snippet,contentDetails&id=<id1,…,id50>`
   → `title`, `description`, `publishedAt`, `duration`.
4. **Mappen** → `PodcastEpisode[]` + `ParsedShowMeta` → `ParsedFeed` → identischer Downstream.

**Backfill vs. laufend:** kein Daemon — wie der RSS-Pfad manuelles Re-Run. Idempotent über
`episodeGuid = video id` (Re-Run upsertet per `(show, guid)`, keine Duplikate). Laufend = derselbe Lauf
erneut; neue Videos kommen dazu. (Optionale spätere Effizienz: nur die erste `playlistItems`-Seite für
„neueste" pollen — **nicht** Teil dieses Briefs.)

**Für die 10-Folgen-Demo:** die 10 neuesten Uploads nehmen (eine `playlistItems`-Seite, daraus 10 ids,
**ein** `videos.list`-Call). `--limit=10` greift wie beim RSS-Pfad.

## Constraints (hart)

- **Nur Metadaten. NIEMALS Video/Audio herunterladen** — in keinem Pfad, mit keinem Tool. Reine
  HTTP-GETs gegen die Data API v3.
- **Gleicher Ort, gleiches Format, kein Zweitsystem.** Der Adapter liefert exakt den `ParsedFeed`-
  Contract (`{ show: ParsedShowMeta, episodes: PodcastEpisode[] }`). Extract/Resolve bleiben
  unverändert quellen-agnostisch. Nur die Source-Auswahl vor dem Fetch und die Link-Assembly
  (`show.links` / `episode.links`) sind source-aware. Kein paralleler Ingest, kein paralleler
  Datenspeicher.
- **API-Key niemals hardcoden.** Aus `process.env.YOUTUBE_API_KEY` lesen (geladen via
  `tsx --env-file=.env.local`, wie `ANTHROPIC_API_KEY`). In `.env.example` dokumentieren (Pattern wie
  der bestehende Anthropic-Block), `.env.local` bleibt gitignored.
- **RSS-Pfad unverändert.** Der bestehende `feed.ts`-Pfad und das Verhalten der RSS-Shows
  (`the-40k-lorecast`, `adeptus-ridiculous`) dürfen sich nicht ändern. Der `source`-Discriminator
  defaultet auf `"rss"` (rückwärtskompatibel).
- **Netzwerk von Pure getrennt.** Wie `feed.ts` (`fetchFeed` Netzwerk vs. `parseFeed` pure): der
  Netzwerk-Fetch der Data API ist von einer **reinen Map-Funktion** (API-JSON → `ParsedFeed`) getrennt,
  damit Letztere gegen ein committed Fixture **ohne Netzwerk und ohne Key** unit-testet.
- **Version-Policy.** Keine neue Runtime-Dependency nötig (globales `fetch`). Falls CC doch eine
  Hilfsbibliothek zieht: aktuelle stabile Version selbst recherchieren + pinnen (Cowork pinnt nie).
- **TypeScript strict, server-only.** Kein `any`; das Skript ist Node-seitig (kein `'use client'`).

## Out of scope (explizit NICHT anfassen — Implementer sind eifrig)

- **Keine DB-Writes / keine echte Apply-Implementierung.** `apply-podcast.ts` wird in diesem Brief
  **nicht** geändert (die `source_kind`-Anpassung ist nur dokumentiert, s. u.). Der einzige erlaubte
  Apply-Aufruf ist `--dry-run` (baut + druckt den Plan, schreibt nichts).
- **S4 (YouTube-Episode-Matching für RSS-Shows)** — nicht starten, nicht vorbereiten, nicht „schon mal
  mit-erledigen".
- **`video` / `video_details`** — nicht hineinrouten, nicht erweitern.
- **Downstream-Semantik** (`extract.ts`, `resolve.ts`, `artifact.ts`-Sortier-/Report-Logik,
  Such-/Reader-Projektionen) — nicht refactoren. Minimal erlaubte Ausnahme: `artifact.ts` darf
  die explizite `cfg.source`-Information an die Link-Builder durchreichen, damit Links nicht aus
  URLs geraten werden.
- **Kein Schema-/Migrations-Change.** Alle benötigten Enum-Werte (`source_kind.youtube`) existieren
  bereits; die `PodcastLinkSourceKind`-Erweiterung ist **types-only** (kein `pgEnum`, keine Migration).
- **Shorts/Streams-Filterung** — in v1 **nicht** filtern (der RSS-Pfad filtert auch nicht; Parity).
  Nur als Open Question berichten.
- **Kein Polling/Cron/Scheduler.** Manuelles Re-Run wie überall in der Pipeline.

## Acceptance

Die Session ist fertig, wenn:

- [ ] Registry trägt einen **`source`-Discriminator** (`"rss" | "youtube"`, default `"rss"`,
      rückwärtskompatibel) + einen **luetin09-Eintrag** (`source:"youtube"`, **verifizierte**
      `youtubeChannelId`, `feedUrl` = Uploads-Feed-URL, `youtubeChannelUrl`, ein `youtube`-Show-Link).
      Die zwei bestehenden RSS-Einträge bleiben unverändert gültig.
- [ ] Ein **neuer YouTube-Source-Adapter** (Netzwerk-Fetch der Data API v3 **getrennt** von einer reinen
      Map-Funktion) liefert exakt `{ show: ParsedShowMeta, episodes: PodcastEpisode[] }` — derselbe
      `ParsedFeed`-Contract wie `feed.ts`.
- [ ] **ISO-8601-Dauer-Parser** (`PT#H#M#S`, auch `PT#M#S` / `PT#S`; Edge-Cases wie `P0D`/leer → `null`)
      mit Unit-Tests.
- [ ] `ingest-podcast.ts` wählt den Adapter anhand `cfg.source`; RSS bleibt der Default. Der RSS-Pfad
      wird mit fixture-/warm-cache-basiertem Vergleich geprüft: bei identischem Input bleiben
      `the-40k-lorecast` / `adeptus-ridiculous` strukturell und in der Link-Shape unverändert.
- [ ] `buildShowLinks` ist **source-aware**: RSS-Shows behalten den abgeleiteten
      `rss/listen/podcast_rss`-Show-Link; YouTube-Shows bekommen **keinen** aus `feedUrl`
      abgeleiteten `rss`-Link.
- [ ] `buildEpisodeLinks` ist **source-aware** und bekommt die Quelle explizit (`cfg.source` oder
      äquivalent), **ohne URL-Heuristik**: YouTube-Episoden tragen **genau einen**
      `{ youtube, watch, sourceKind:youtube, 1.0 }`-Link; RSS-Episoden unverändert den
      RSS-Audio-Enclosure-Link.
- [ ] `PodcastLinkSourceKind` + `PODCAST_LINK_SOURCE_KINDS` um `"youtube"` erweitert (types-only);
      `assertLinks` (apply-plan) akzeptiert es.
- [ ] **Demo:** `npm run ingest:podcast -- --show luetin09 --limit=10` schreibt
      `ingest/podcasts/luetin09.json` + `.report.md`. Die 10 Episoden tragen `guid` = Video-ID,
      ISO-`pubDate`, gesetzte `durationSec`, `link` = Watch-URL, `audioUrl: null`, je einen
      `youtube/watch`-Link; `episodeKind` + Tags wie auf dem RSS-Pfad gesetzt.
- [ ] **Parity-Check:** das luetin09-Artefakt ist **strukturell deckungsgleich** mit einem RSS-Show-
      Artefakt (gleiche Keys/Shape). Unterschiede liegen nur in **Feldwerten** (`audioUrl: null`,
      Link-Domain, Episode-Link-`sourceKind`), nicht im Schema. (CC zeigt den Vergleich im Report.)
- [ ] **Optional, nicht-invasiv:** `npm run apply:podcast -- --show luetin09 --dry-run` baut + druckt den
      Plan **ohne** Writes (belegt, dass das Artefakt durch `buildApplyPlan` valide ist und zeigt das
      finale gemappte DB-Format).
- [ ] `YOUTUBE_API_KEY` in `.env.example` dokumentiert (Pattern wie der `ANTHROPIC_API_KEY`-Block); im
      Code nur via `process.env` gelesen; **kein Key im Repo**.
- [ ] **Reiner Map-Unit-Test** gegen ein committed API-Fixture (kein Netzwerk, kein Key in CI).
- [ ] `npm run typecheck` + `npm run lint` grün. Kein Media-Download in irgendeinem Pfad.

## Dokumentierter Folgeschritt (NICHT in dieser Session implementieren)

Für den späteren echten DB-Apply von @luetin09 (eigener Brief, nach Review des Dry-Runs):

- `apply-podcast.ts` setzt `works.sourceKind` aktuell **hardcoded** `"podcast_rss"` für Show (Z. ~249)
  und Episode (Z. ~327). Für eine `source:"youtube"`-Show müssen beide `"youtube"` werden (Enum-Wert
  existiert) — d. h. den `source`-Discriminator aus der Registry/dem Artefakt in den Apply tragen.
- `upsertShow`-Identität (`podcastGuid → feedUrl → slug`) funktioniert für luetin09 unverändert, weil
  `feedUrl` befüllt ist (Uploads-Feed-URL). (Nur falls `feedUrl` je leer bliebe, müsste die Identität
  rein auf `slug` fallen.)
- Diese Punkte sind klein, aber bewusst getrennt: erst Artefakt reviewen, dann schreiben.

## Open questions (im Report beantworten)

- Tatsächliche **Gesamtzahl** der @luetin09-Uploads (`pageInfo.totalResults`) — für die Backfill-Dimension.
- **Channel-ID** `UC…` + Auflösungs-/Verifikationsmethode (`forHandle`) inkl. Gegencheck (Kanalname
  „Luetin09", 40k-Lore) — adversarial bestätigen, wie beim 128-Link-Workflow, **nicht raten**.
- **Shorts/Streams** im Uploads-Feed vorhanden? Falls ja: Empfehlung, ob/wie später filtern (v1: nicht).
- **Tag-Coverage** der 10 Demo-Folgen (wie viele tragen ≥1 aufgelösten Tag) — Sanity vs. RSS-Shows.
- **Private/gelöschte** Items in der Uploads-Playlist: bestätige, dass der Adapter fehlende
  `videos.list`-Rückgaben toleriert (skippt), statt zu crashen.

## Notes (illustrativ — KEINE fertige Implementierung)

**Registry-Eintrag (Form, Werte verifizieren):**

```jsonc
{
  "slug": "luetin09",
  "source": "youtube",                 // neuer Discriminator; default "rss"
  "title": "Luetin09",
  "feedUrl": "https://www.youtube.com/feeds/videos.xml?channel_id=UC…",  // Identity, kein Parse
  "appleId": null,
  "podcastGuid": null,
  "youtubeChannelId": "UC…",           // per channels.list?forHandle auflösen + verifizieren
  "youtubeChannelUrl": "https://www.youtube.com/@luetin09",
  "links": [ { "serviceId": "youtube", "url": "https://www.youtube.com/@luetin09" } ]
}
```

**Data-API-Endpunkte (alle GET, key via `&key=${process.env.YOUTUBE_API_KEY}`):**

```
channels.list      ?part=snippet,contentDetails&forHandle=luetin09
playlistItems.list ?part=contentDetails&playlistId=<UU…>&maxResults=50&pageToken=<…>
videos.list        ?part=snippet,contentDetails&id=<id1,…,id50>
```

**ISO-8601-Dauer-Fälle (für den Parser-Test):** `PT1H2M3S`→3723, `PT15M`→900, `PT45S`→45,
`PT2H`→7200, leer/`P0D`→`null`.

**`.env.example`-Block (Stil wie der Anthropic-Block):**

```
# --- YouTube Data API v3 (Brief 130 — luetin09 YouTube-Source) ---------------
# API-Key für den YouTube-Source-Adapter (nur Metadaten, kein Media-Download).
#   1. Google-Cloud-Projekt anlegen (console.cloud.google.com).
#   2. „YouTube Data API v3" aktivieren → Credentials → API key.
#   3. Hier einsetzen. NIEMALS committen.
YOUTUBE_API_KEY=
```

**Branch/Worktree-Erinnerung:** Batches-Strang → `chrono-lexicanum-batches`, Branch
`codex/ingest-batches-youtube-source`, PR (kein Merge durch CC). `brain/**` + `sessions/README.md`
sind coord-only — CC trägt substanzielle System-Fakten in den **Impl-Report**, Cowork backfillt.
