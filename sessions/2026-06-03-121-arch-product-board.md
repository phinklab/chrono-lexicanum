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
| P5 | Entity-Hubs `/fraktionen` + `/fraktion\|charakter\|welt/[id]` als Guides, Blurbs aus 122-B3 | ☐ |
| P6 | Display-Tweaks: Content-Warnings raus, leere Factions aus, Blurbs/Counts ein | ☐ |
| P7 | Frontend-Lockdown: CSS/TS-Cleanup, tote Components, Cleanup-Ledger im Handoff | ☐ (Teile via 147: DetailPanel/Aquila/roster.ts gelöscht, Deps bereinigt; Rest offen, u. a. FilterRail-Entscheid + Partials 20/22/57) |
| P8 | Topic-Straenge `/themen` + `/thema/[slug]` (reuse EntityView/RelatedWorks-Primitive); Daten aus 122-B8. Spec [129](./2026-06-04-129-arch-doorways-curation-layer.md) | ☐ |
| P9 | Charakter-Galerie `/charaktere` (nur kuratiert) + Primarchen-Tier; Daten aus 122-B9/B3. Spec [129](./2026-06-04-129-arch-doorways-curation-layer.md) | ☐ |

## Optional context (nur laden wenn der Task es braucht)

- Nordstern (Medienarchiv zuerst, Entities = Kontext, nicht Wiki): archivierte 118/119.
- IA + aktueller Stand: `brain/wiki/project-state.md`.
- Ask-Naht: 122-B4 liefert die Logik hinter einem Typen-Contract (kommt per Chat); P3 baut UI dagegen.
