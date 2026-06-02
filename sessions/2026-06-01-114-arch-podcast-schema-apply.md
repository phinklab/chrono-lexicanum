---
session: 2026-06-01-114
role: architect
date: 2026-06-01
status: open
slug: podcast-schema-apply
parent: 2026-05-31-110
links:
  - 2026-06-01-110
commits: []
---

# Podcast Step 2 — Schema + idempotenter Apply

## Goal

Das committete Step-1-Pilot-Artefakt (`ingest/podcasts/the-40k-lorecast.json`) in die DB bringen: neue `podcast` + `podcast_episode` work-kinds + Detail-Tabellen, ein **idempotenter Dry-Run→Apply** (Schlüssel = Episode-GUID), und die aufgelösten Episode-Tags auf die bestehenden `work_*`-Junctions mappen (`role=subject|mentioned`). **Kein Rendering** (das ist der Product-Track, später).

## Context

Step 1 (Brief 110, gemergt) lieferte das Artefakt + Quality-Report, **kein** DB-Write. Das 110-impl § „Open questions" Punkt 3 enthält die Schema-Empfehlung des Implementierers (er hat dafür `src/db/schema.ts` gelesen) — sie ist die Grundlage dieses Briefs:

- `podcast` + `podcast_episode` als work-kinds, **modelliert nach dem bestehenden `channel`/`video`-CTI-Muster** (Container-Work + Unit-Work mit Self-Link) — aber **nicht** durch Überladen von `video` (ein Podcast-Episode ist Audio: Enclosure-MP3 + `durationSec`, keine Video-URL; `video` zu überladen vergiftet jede „alle Videos"-Query).
- `podcast_details` (≈ `channel_details`: `feedUrl`, `podcastGuid`, `appleId`, `imageUrl`).
- `podcast_episode_details` (≈ `video_details`: `podcastWorkId`-Self-Link analog `video_details.channelWorkId`, plus `audioUrl`, `durationSec`, `pubDate`, `season`, `episode`, `episodeKind`).
- **Stabiler Episode-Schlüssel:** der Feed-`<guid>` ist beliebig lang (RSS-Spec), `works.externalBookId` ist `varchar(16)` + buch-benannt → Episoden brauchen einen **eigenen** Schlüssel: `podcast_episode_details.episodeGuid text UNIQUE` (der idempotente Apply keyt darauf).
- neuer `source_kind`-Wert `podcast_rss`.
- Tags mappen 1:1 auf `work_characters`/`work_factions`/`work_locations` mit `role='subject'|'mentioned'` (Brief 109 §7); das Artefakt trägt `rawName` + `confidence` für den Audit-Trail (die Junctions haben `raw_name`).

## Constraints (architektonisch, bindend)

- **Schema-Migration** via Drizzle (`db:generate` → generiertes SQL unter `src/db/migrations/` committen → `db:migrate`). work-kind-Enum um die zwei Werte erweitern.
- **Apply liest das committete Artefakt** (`ingest/podcasts/the-40k-lorecast.json`) — single source, deterministisch, **kein** Live-Re-Fetch im Apply.
- **Idempotent, GUID-gekeyt:** zweimal denselben Artefakt anwenden = No-op / In-Place-Update, keine Dubletten (Muster wie der Override-Apply). Dry-Run-Modus druckt den Plan ohne Schreiben.
- **Nur aufgelöste Tags → Junctions** (canonicalId existiert), `role` aus dem Artefakt, `raw_name` + `confidence` auf der Junction. **Unresolved forms werden NICHT geschrieben** und **nie** als neue Reference-Rows auto-angelegt (Projekt-Invariante).
- Show = ein `podcast`-Container-Work; Episoden = `podcast_episode`-Works, via `podcastWorkId` an den Container gelinkt.
- **Keine** UI/Rendering, **kein** Resolver-Umbau (der Resolver/`resolveSurfaceForm` wird nur konsumiert, nicht geändert).

## Bundled (klein, gehört logisch davor) — Quick alias wins

Aus dem 110-impl § OQ-2: Alias-Gap-Forms, wo die kanonische Entität existiert, nur die Oberflächenform fehlt → in `scripts/seed-data/*-aliases.json` ergänzen (`Guilliman → roboute_guilliman`, `Vect → asdrubael_vect`, `Magnus → magnus_the_red`, `Titus`/`Demetrian Titus`, Webway-/Immaterium-Varianten). Dann Ingest mit Warm-Cache re-runnen (≈$0, unveränderte Episoden = Cache-Hits) → das verbesserte Artefakt committen, **bevor** der Apply läuft. Falls das den Brief zu groß macht: als eigenen Mini-PR davor abspalten — aber die verbesserte Coverage sollte vor dem Persistieren drin sein.

## Out of scope

- Rendering / Entity-Seiten-Integration (Product-Track — Episoden tauchen später via works-by-kind auf den Hubs auf).
- Weitere Shows (Step 3: Lorehammer, Adeptus Ridiculous, Laying Down The Lore).
- Transkripte, Audio-Rehosting, der Extraction-Prompt-Tweak gegen Common-Noun-Over-Extraction (separat).
- Auto-Anlegen von Reference-Rows für unresolved forms.

## Acceptance

Die Session ist fertig, wenn:

- [ ] Neue work-kinds `podcast` + `podcast_episode`; Tabellen `podcast_details` + `podcast_episode_details` (Migration unter `src/db/migrations/` committet).
- [ ] `podcast_episode_details.episodeGuid text UNIQUE`; der Apply keyt darauf; zweimaliger Lauf ist idempotent (keine Dubletten — per Test belegt).
- [ ] `source_kind` kennt `podcast_rss`.
- [ ] Apply liest das committete Artefakt, legt den Show-Work + Episode-Works + die aufgelösten Tag-Junctions an (`work_{characters,factions,locations}`, `role=subject|mentioned`, `raw_name` + `confidence` gesetzt); unresolved forms **nicht** geschrieben.
- [ ] Dry-Run druckt den Plan ohne DB-Write.
- [ ] `npm run typecheck` + `npm run lint` + die Resolver-/Apply-Tests grün; ein Test/Fixture belegt die Apply-Idempotenz.
- [ ] (falls gebündelt) Alias-Gap-Forms in `*-aliases.json`; Ingest re-run; verbessertes Artefakt committet.

## Open questions

- **Entschieden (2026-06-02 mit Philipp): dedizierter `podcast_episode`-work-kind** (nicht generisches `episode`) — ehrlichste Form jetzt, konsistent mit der bewussten Nicht-Überladung von `video`; Generalisierung erst bei echtem zweitem Medium. In Context + Constraints bereits so spezifiziert.
- Offen (CC's Wahl, klein): Show-Level-Metadaten (Cover/Beschreibung) jetzt schon in `podcast_details` befüllen oder erst, wenn das Rendering sie braucht? `imageUrl` ist im Schema vorgesehen.

## Notes

Worktree **`chrono-lexicanum-batches`**, Branch `codex/ingest-batches-podcast-schema` + PR. Schema-Empfehlung steht im 110-impl § OQ-3 — lies sie zuerst. Versionen (Drizzle etc.) recherchiert + pinnt CC, kein Pin im Brief.
