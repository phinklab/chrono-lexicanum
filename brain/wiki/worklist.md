---
title: Worklist — konsolidierte offene Arbeit
type: overview
created: 2026-07-01
updated: 2026-07-01
sources:
  - ../../sessions/README.md
  - ../../sessions/2026-06-03-121-arch-product-board.md
  - ../../sessions/2026-06-03-122-arch-batches-board.md
  - ../../sessions/archive/2026-06/2026-06-28-168-impl-weekly-refresh-catchup.md
  - ../../sessions/archive/2026-06/2026-06-30-171-impl-per-book-ssot-migration.md
  - ../../sessions/2026-07-01-172-impl-podcast-weekly-maintenance.md
related:
  - ./project-state.md
  - ./open-questions.md
  - ./deferred-questions.md
confidence: high
---

# Worklist

> **Die eine kanonische Stelle für offene Arbeit.** Konsolidiert am 2026-07-01 (Cowork-Session mit Philipp) aus: Boards 121/122, `sessions/README.md`-Nachträgen, `open-questions.md`, `project-state.md` § What's open und den Impl-Reports 166–172.
>
> **Pflege-Regel:** Neue offene Punkte landen HIER (nicht als Nachtrags-Prosa im README, nicht als Kleinkram-Bullet in project-state). Erledigtes wird gestrichen, nicht kommentiert. Die Boards 121/122 bleiben die Spec-Referenz für ihre Items; diese Liste ist die Priorisierung darüber. OQ-Queue (`open-questions.md`) bleibt separat für „muss der nächste Brief adressieren". **Ausnahme UI:** kosmetisches UI bleibt in `docs/ui-backlog.md` und wird bewusst NICHT hier getrackt — UI läuft als eigener Gesamt-Pass (§ E).

## A. Forward-Queue (priorisiert, mit Philipp 2026-07-01 bestätigt)

1. **P14 Map / Sternenkarte** (121, entsperrt). Worklist: 53 sektor-zugeordnete Welten aus Stage 3 (Brief 155). ⚠ Redditor-Koordinaten-Excel seit 2026-06-24 angekündigt, **nicht geliefert** — Excel sichten, bevor der Brief geschnitten wird; alternativ P14 nur auf die 53 Welten schneiden. Reconciliation aufs interne `gx`/`gy`-0–1000-Raster ist der architektonische Kern.
2. **P12 URL-Migration EN + `/buch`-SSG** (121). Reiner Architektur-Schnitt, keine Daten nötig.
3. **P13 Mobile-Sweep** (121).
4. Dazwischen, wenn Luft: **B6 Dead-Code-Sweep** (Code liegt komplett, nie gelaufen) · **B7 brain:lint-Guardrail** · **P15 Map-Chrome-Kohärenz** (Kandidat aus 150, sinnvoll mit/nach P14).

## B. Pakete (gebündelt je eine Session)

### B-1. Podcast-Hygiene-Session (Batches)

Gehört zusammen, eine Session:

- **8 gedriftete Podcast-Artefakte** (`luetin09` + `the-40k-lorecast`): `test:podcast-cc-direct` auf `origin/main` rot; Re-Assemble nötig (aus 171-Impl).
- **Podcast-Catchup für 3 Shows** — in 168 bewusst deferred; Entscheidung `api` vs. `cc-direct` fällig (cc-direct ist der bewährte Null-Kosten-Pfad). Läuft jetzt über den 172er-Delta-Pfad (`prepare-delta`/`merge-delta` → `apply:podcast --show`).
- **Alias-Backlog:** ~63 Luetin- + ~212 Lorehammer-Surface-Forms.
- **Lorehammer-Twin-Filter** für Cold-Reingest.
- Abgegrenzt bleibt: S4 YouTube-Episode-Matching (Session 128) — nur aufnehmen, wenn der Rest Platz lässt.

### B-2. Roster-Rebind + Verify-Kleinkram (Batches, klein)

- **Rebind:** `import-faction-starters.ts` + `book-review/projection.ts` lesen noch den eingefrorenen `book-roster.json` statt `loadEffectiveCorpusBooks` — sehen per-Buch-Bücher nicht (aus 171-Impl, kein Blocker, aber Drift-Falle).
- Einmal `npm run refresh:audit-artifacts` lokal read-only ziehen, bevor dem Wochenlauf vertraut wird (Brief 151).
- Optional `npm run db:drift` gegen Prod als read-only Bestätigung.
- Kosmetik: Slug-Diskrepanz `W40K-0259` / `W40K-0330` (für Äquivalenz verbatim erhalten; bei Gelegenheit normalisieren).

## C. Blockiert / wartet auf Vorleistung

- **P8 Themen-Stränge + P9 Charakter-Galerie** (121) ← warten auf **B8 Themen-Kurations-JSON + B9 Primarchen-Kuration** (122). B9 schaltet zusätzlich die Compendium-Primarchen-Kategorie frei. Spec: Brief 129 (bleibt als Spec-Dokument offen).
- **B5 Hand-Kuratierung** — läuft als kontinuierliche Hand-Arbeit (Codex-Auftrag → `curation-overlay.json` → Dry-Run/Verify), kein Session-Schnitt nötig.
- **P7 Frontend-Lockdown-Rest** — Teile via 147 erledigt; Rest wandert in den UI-Gesamt-Pass (§ E).

## D. OQ-Queue (separat in [`open-questions.md`](./open-questions.md), hier nur gespiegelt)

- **16b** `primaryEraId`-Placeholder — verortet (Brief 173): der `'time_ending'`-Hardcode lebt post-171 in `scripts/book-apply-shared.ts` (`M41_ERA_ID`, Z. 99 → `computeBookRows` Z. 712); Consumer lesen das Feld nur als uniformen Platzhalter. Brief erst bei Consumer-Druck.
- **16c** Atlas-Extension für Events (`atlas:regen` Event-Pages).

## E. Bewusst geparkt (nicht vergessen, aber kein Zug)

- **UI-Gesamt-Pass (eigene Session, Philipp-Entscheid 2026-07-01):** UI wird komplett in einer separaten Session neu angegangen — Kandidat: **erst wenn P14 Map steht**. Bis dahin sammeln kosmetische Einzelitems weiter in [`docs/ui-backlog.md`](../../docs/ui-backlog.md) (bleibt live, wird nicht hierher gefaltet); dort liegt auch das MediaPlayer-Mobile-Konzeptthema. Farbsprachen-Konsolidierung (Review 141) + P7-Frontend-Lockdown-Rest gehören in diesen Pass.
- **Character-Long-Tail: 315 Sentinels** (Stage 3) — geparkt seit 155.
- **Launch-Tag:** `PREVIEW_GATE=off` (Env-Flip), danach dedizierter Cleanup-Brief, der die komplette Gate-/Invite-Maschinerie ausbaut — Details + Datei-Liste in [`deferred-questions.md`](./deferred-questions.md) § Preview-Gate. Promote beim Reddit-Launch-Brief.
- Übrige Dormant-Items mit Triggern: [`deferred-questions.md`](./deferred-questions.md).

## F. Maintainer-Merker (Philipp)

- Redditor-Excel für Sternenkarte nachfassen (blockiert die volle P14-Fassung).
- Repo-Setting „Allow Actions to create PRs" bleibt ON.
- Nach Daten-Applies bei Bedarf `POST /api/revalidate`.
