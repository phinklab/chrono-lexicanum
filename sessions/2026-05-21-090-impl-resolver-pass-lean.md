---
session: 2026-05-21-090
role: implementer
date: 2026-05-21
status: partial          # Leg 1 (measurement) done; Leg 2 (Bausteine 2–5) gated on maintainer review
slug: resolver-pass-lean
parent: 2026-05-21-090
links:
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-21-088-arch-ssot-loop-lean
  - 2026-05-21-089-arch-resolver-pass-5
commits:
  - 922d0fd  # Brief 090 (arch) copied into branch
---

# Resolver-Pass lean — Token-Budget pro Phase, schlankes Runbook, 100er-Takt

## Summary

**Leg 1 (Baustein 1, the measurement gate) is done — and the gate PASSES.** The dominant token drivers are exactly where Brief 090 assumed: a universal "vorab document-reading" tax (Brief 076 + per-pass brief = **~22k tokens read by *every* phase** before any work) plus Phase 4's corpus-scaling raw apply-log. The rebuild (Bausteine 2–5) plausibly lands every phase under the ~60k read-scope budget. Per the maintainer's "pause for review" choice, I stopped here; Bausteine 2–5 are **not** executed yet.

## What I did

- Set up worktree `chrono-lexicanum-batches`, branch `codex/ingest-batches-resolver-pass-lean` from fresh `origin/main` (`58b7606`, includes the merged wiki-hygiene pass #79), copied Brief 090 in (commit `922d0fd`).
- Measured the static read-scope of each of today's 5 phases against the live `001..025` (250-book) corpus, deterministically from file bytes (`wc -c`, ÷4 ≈ tokens). No file content was pulled into context beyond what the `wc -c` byte counts required.

## Mess-Befund — heutige Phase → geschätzte Input-Token-Last (`001..025`, bytes ÷ 4)

Token estimates rounded; "vorab" = Brief 076 (16,899) + per-pass Brief 089 (5,154) = **22,053 tok**, paid identically by every phase.

| Phase | Was sie heute liest (Hauptposten) | ~Input-Tokens | Davon entfernbar |
|---|---|---:|---|
| **0 Preflight/Dossier** | vorab 22,053 + aggregator 3,073 + **override 021..025 22,301** + loop-log-Blöcke (tail) | **~47,400** (static) | vorab + overrides = ~44k |
| | ⚠ falls je das **volle** `ssot-loop-log.md` gelesen wird: +115,477 | **~162,900** | (Disziplin-Bombe) |
| **1 Factions** | vorab 22,053 + Dossier 6,502 + factions.json 5,509 + aliases 311 + policy 1,033 + test-resolver 9,467 + resolver/index 763 | **~45,600** | vorab = 22k |
| **2 Locations** | vorab 22,053 + Dossier 6,502 + locations.json 5,782 + aliases 103 + test-resolver 9,467 + phase-1-report 1,399 | **~45,300** | vorab = 22k |
| **3 Characters** | vorab 22,053 + Dossier 6,502 + **characters.json 9,592** + aliases 265 + test-resolver 9,467 + reports 1+2 2,327 | **~50,200** | vorab = 22k; characters.json wächst je Welle |
| **4 Integration/Apply/Verify/Report** | vorab 22,053 + Dossier 6,502 + integration-scripts ~6,200 + aggregator 3,073 + **override 021..025 22,301** + **phase4-apply-log RAW 17,927** + test-resolver 9,467 | **~87,500** | vorab + overrides + raw-log = ~62k |

**Benannte Haupt-Quellen (bestätigt Brief-090-Verdacht):**

1. **Universelle vorab-Dokumentenlast (Brief 076 + Per-Pass-Brief = ~22k tok/Phase).** Bei 5 Phasen × `/clear` werden Brief 076 (67,596 B) + Brief 089 (20,617 B) fünfmal frisch geladen, bevor irgendeine Phase arbeitet. Das ist der „es geht schon sehr viel drauf beim Dokumente-Lesen"-Treiber, exakt wie vermutet — und genau das, was das Runbook + Achs-Paket (Baustein 2) abschafft.
2. **Phase 4 = mit Abstand am schwersten (~87,5k static)** und die **einzige Phase mit unbegrenzt korpus-skalierendem Term:** das `phase4-apply-089.log` (71,708 B → ~17,9k tok) ist die Per-Batch-Rohausgabe von 25 Batch-Applies. Bei 86 Batches (859 Bücher) wären das ~62k tok allein für das Log. Plus die 5 Override-Files (89,202 B → ~22,3k tok), die im Phase-4-Scope liegen. Bestätigt den Phase-4-Korpus-Verdacht.
3. **Phase 0 / Loop-Log-Bombe.** `ssot-loop-log.md` ist heute **461,909 B = ~115k tok**. Würde eine Phase-0-Subsession es je im Volltext lesen statt tail-zu-readen, sprengt das allein das gesamte 120k-Budget. Die Tail-Read-Disziplin (Baustein 3, ssot-loop-runbook §8) ist also nicht Kosmetik, sondern budgetkritisch.

## Gate-Verdikt: Prämisse BESTÄTIGT → Leg 2 freigegeben (vorbehaltlich Maintainer-OK)

Die Messung trägt die Design-Prämisse von Brief 090 (Endzustand (A)):

- Der dominante Treiber liegt **dort, wo der Brief ihn vermutet**: Vorab-Dokumentenlesen (universell ~22k/Phase) + Phase-4-Korpus-Skalierung (Raw-Apply-Log + Override-Bulk). Kein überraschender vierter Treiber.
- **Post-Rebuild-Projektion** (Phase liest künftig: Runbook ~3k + Dossier + Achs-Paket, kein Brief 076/089, Phase 4 digest-only) bleibt bei `001..025` für **jede** Phase unter ~60k:

| Phase | Post-Rebuild Read-Scope | ~Input-Tokens |
|---|---|---:|
| 0 | Runbook + Aggregator-Output (Dossier) + Tail-Loop-Blöcke | **~15k** |
| 1 | Runbook + Dossier + factions-Paket + test-resolver | **~26k** |
| 2 | Runbook + Dossier + locations-Paket + test-resolver | **~25k** |
| 3 | Runbook + Dossier + **characters.json** + test-resolver | **~29k** |
| 4 | Runbook + Dossier + Digest (fix) + Integration-Scripts + test-resolver | **~27k** (korpus-**un**abhängig) |

Kein Endzustand-(B)-Trigger: keine Phase bliebe nach dem Umbau über ~60k.

## Open issues / blockers

Keine Blocker. **Stopp-Punkt ist gewählt, nicht erzwungen** — Maintainer-Wahl „pause for review" nach Baustein 1. Leg 2 (Bausteine 2–5 + Live-Re-Apply-Validierung gegen `001..025`) läuft erst nach Bestätigung.

## For next session (Leg 2)

- **Phase-3-Vorbehalt (Brief-090-Open-Question, nicht Blocker):** `characters.json` ist heute 38,369 B (~9,6k tok) und wächst mit **jeder** Welle (199 Rows bei 250 Büchern). Bei 100er-Wellen bis ~859 Büchern könnte der Volltext-Read Richtung 30–40k tok gehen — dann wird Phase 3 die erste, die ein Chunk-/Achs-Slice-Mechanismus für die Reference-JSON braucht. Bei `001..025` unkritisch; im Runbook als bekannte Wachstums-Kante vermerken.
- **`test-resolver.ts` (37,869 B → ~9,5k tok)** wird von Phasen 1/2/3/4 gelesen — größter Einzel-Nicht-Brief-Posten im Achs-Paket. Unter 60k unkritisch, aber im Auge behalten, falls die Test-Datei weiter wächst.
- Reihenfolge Leg 2: Baustein 2 (Runbook + 076-Banner + CLAUDE/AGENTS-Ausnahme + Driver/Config) → 3 (Phase 0 dicht) → 4 (Phase 4 digest-only + Live-Re-Apply) → 5 (`-NNN`-Konsolidierung + 100er-Takt + `nextResolverPauseAt` + Tests + `run-ssot-loop.sh`).

## References

- Brief 090 (`sessions/2026-05-21-090-arch-resolver-pass-lean.md`) — Baustein 1 § Abzweigung (der Gate), Acceptance (A)/(B).
- Brief 088 / 061 (Vorlage: operative Spec → Runbook, Brief auf Rationale reduziert).
