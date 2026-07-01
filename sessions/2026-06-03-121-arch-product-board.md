---
session: 2026-06-03-121
role: architect
date: 2026-06-03
status: open
slug: product-board
parent: null
links: []
commits: []
---

# 121 — Product board (standing)

Stehendes Strang-Board, kein One-Shot-Brief. Status-Spalte = Wahrheit.

**Ablauf.** Briefing pro Task läuft über Chat (Cowork → Philipp → CC), kein Input-Doc im Repo. CC baut bei Abschluss ein **sehr kleines** Handoff-Doc in `sessions/`; Cowork reviewt + archiviert es und hakt die Zeile ab.

**Strang.** Worktree `chrono-lexicanum-product`, Branch `codex/product-*`. Stay-local-iterate, kein PR bis Philipp `fertig` sagt. `brain/**` + `sessions/README.md` nicht anfassen (Rollup).

## Design freedom

Optik = deine (frontend-design Skill): Farben, Spacing, Typo, Motion, Copy, Klassen. **`/werke` ist die OPTISCHE Blaupause — nur visuelle Sprache.** Keine Funktionen/Features zwischen Seiten portieren; jede Seite behält ihre eigene Funktion.

## Guardrails (hart)

- URL-/searchParam-Contracts jeder Route intakt; `params`/`searchParams` awaited.
- Server-Components default; kein `db`-Import in `'use client'`.
- `prefers-reduced-motion`, sichtbarer Keyboard-Fokus, lesbarer Kontrast.
- `/map` Layout/Features unverändert (nur Theme-Erbe).
- Kein Daten-/Schema-Change → 122. Reine Anzeige-Tweaks ok.
- Keine Version-Pins (CC recherchiert/pinnt). Keine neuen Entity-Bilder.

## Tasks

| # | Task | Status |
|---|---|---|
| P1 | Home `/` Redesign - 3-Baender-Regroup (Bestand / Tueren-nach-Thema / Linsen), Spec [129](./2026-06-04-129-arch-doorways-curation-layer.md) | ☑ erledigt (PR #129) |
| P2 | Chronicle `/timeline` Redesign (Contract bleibt) | ☑ erledigt (Briefe 137/138/140 Timeline-Cinematic-Port; Polish 145/146) |
| P3 | Ask `/ask` Funnel-Redesign, wired gegen 122-B4 | ☑ erledigt (126) |
| P4 | Podcast `/podcasts` Redesign + Link-zur-Show & Download-Option (Daten 122-B1) | ☑ erledigt (129, PR #133) |
| P5 | Entity-Hubs `/fraktionen` + `/fraktion\|charakter\|welt/[id]` als Guides, Blurbs aus 122-B3 | ☑ erledigt (maintainer-direkt: `/compendium` + Blurbs live, 981/981) |
| P6 | Display-Tweaks: Content-Warnings raus, leere Factions aus, Blurbs/Counts ein | ☑ erledigt bis auf CW-Anzeige → P10/Brief 150 |
| P7 | Frontend-Lockdown: CSS/TS-Cleanup, tote Components, Cleanup-Ledger im Handoff | ☐ (Teile via 147: DetailPanel/Aquila/roster.ts gelöscht, Deps bereinigt; Rest offen, u. a. FilterRail-Entscheid + Partials 20/22/57) |
| P8 | Topic-Straenge `/themen` + `/thema/[slug]` (reuse EntityView/RelatedWorks-Primitive); Daten aus 122-B8. Spec [129](./2026-06-04-129-arch-doorways-curation-layer.md) | ☐ |
| P9 | Charakter-Galerie `/charaktere` (nur kuratiert) + Primarchen-Tier; Daten aus 122-B9/B3. Spec [129](./2026-06-04-129-arch-doorways-curation-layer.md) | ☐ |
| P10 | Polish-Sweep: CW-Anzeige raus, Fraktions-Icons statt Punkt (Imperium/SM/Xenos/Chaos), Cogitator-Loading transparent, Login-BG neu + generalisierter Artist-Credit-Slot. Brief [150](./archive/2026-06/2026-06-12-150-arch-polish-sweep.md) | ☑ erledigt (impl [150](./archive/2026-06/2026-06-13-150-impl-polish-sweep.md), 2026-06-13; + 8 Eyeballing-Runden — Credit final „piwireddit", Map-Chrome Gold-Sprache → P15) |
| P11 | Seiten-Rückbau + Security-Rest: Rückbau `/atlas`-Seite, `/buecher` (308), ~~„Open Full Page"-Reiter im Buch-Popup~~ (bereits in 150 entfernt — Popup zeigt nur Back+×, Fullpages bleiben kanonisch), FilterRail + alte Chronicle-Komponenten; Gate-Ausnahmen `/healthz` + `/api/revalidate`; einfache statische CSP (Entscheide 2026-06-12). **Keine Admin-UI:** weder deployed noch local-only; Hand-Kuration läuft künftig per Codex-Änderung am 149er `curation-overlay.json` + Dry-Run/Verify. | ☑ erledigt (Report 153, gemergt) |
| P12 | URL-Migration Englisch (`/factions`, `/characters`, `/worlds`, …) + 308-Redirects + interne Links; im selben Zug `/buch/[slug]`-SSG-Refactor (searchParams/headers in Client-Insel) | ☐ |
| P13 | Mobile-Optimierung aller Seiten außer Map (seitenweise, mehrere Sessions) | ☐ |
| P14 | Map-Komplett-Überarbeitung | ☐ entsperrt (53 sektor-zugeordnete Stage-3-Welten als Worklist; Redditor-Koordinaten-Excel seit 2026-06-24 angekündigt, nicht geliefert — sichten oder auf die 53 Welten schneiden) |
| P15 | Map-Chrome-Kohärenz-Pass: das /map-Chrome ist nach 150 (Eyeballing-Runden 6–8) in der Gold-Sprache, aber als Stapel akkumulierter Einzel-Fixes (Ornamente/Borders/Glows raus, Popups redesignt, Gelb-Washes raus, Solar klickbar, Backdrop 0.18). Ein kohärenter Design-Pass statt Fix-Stapel. **Distinkt von P14** (kein Daten-Bedarf), Kandidat aus impl 150 „For next session" | ☐ Kandidat |
| P16 | Ask-Hub „Find your next book": `/ask` trägt ein zweites Tool „1 Faction, 1 Book" (Faction → kuratierter Einstieg aus maintainer-gepflegter `faction-starters.json`, Reshuffle bei ≥2 Picks, Korpus- oder Freiform-Pick); Fragebogen unverändert; + ◇/◆-Glyph-Rückbau in `QuestionCard`. Brief [166](./archive/2026-06/2026-06-26-166-arch-ask-hub-one-faction-one-book.md) | ☑ erledigt (impl 2026-06-26, gemergt) |

> Außerhalb der P-Nummern erledigt (Status-Resync 2026-07-01, Brief 173): Product-Wave **159–163** (Universal Search / Hintergrund+Scroll / Perceived-Latency / Entity-ISR / Invite-Links; PRs #186–#191) + **169** `faction-starters`-Re-Link (impl 2026-06-28, gemergt).

## Optional context (nur laden wenn der Task es braucht)

- Nordstern (Medienarchiv zuerst, Entities = Kontext, nicht Wiki): archivierte 118/119.
- IA + aktueller Stand: `brain/wiki/project-state.md`.
- Ask-Naht: 122-B4 liefert die Logik hinter einem Typen-Contract (kommt per Chat); P3 baut UI dagegen.
