---
session: 2026-05-21-090
role: implementer
date: 2026-05-21
status: implemented      # Leg 1 (measurement gate) + Leg 2 (Bausteine 2–5) both done
slug: resolver-pass-lean
parent: 2026-05-21-090
links:
  - 2026-05-16-076-arch-resolver-batch-4-axis-sliced
  - 2026-05-21-088-arch-ssot-loop-lean
  - 2026-05-21-089-arch-resolver-pass-5
commits:
  - 922d0fd  # Brief 090 (arch) copied into branch
  - cb29082  # Leg 1: Mess-Befund + Gate-Verdikt
  - c406ea4  # B5: Cadence 50->100 + nextResolverPauseAt + tests + loop-driver
  - d6b40ea  # B2: resolver-pass-runbook + 076-Banner + CLAUDE/AGENTS-Ausnahme + brief-freier Driver
  - 8925800  # B3/B4/B5: stabile wave-parametrisierte Tools + Phase-4-Digest (live-validiert)
---

# Resolver-Pass lean — Token-Budget pro Phase, schlankes Runbook, 100er-Takt

## Summary

**Both legs done; Brief 090 implemented.** Leg 1 (the measurement gate) passed — the dominant token drivers are exactly where Brief 090 assumed (universal vorab-document tax ~22k tok/phase + Phase-4 corpus-scaling raw apply-log). Leg 2 (Bausteine 2–5, after the maintainer confirmed the gate) rebuilt the pass to be runnable from runbook + config alone: a lean `sessions/resolver-pass-runbook.md`, a brief-free driver, Phase-4 digest-only (validated by a live idempotent re-apply against the 250-book corpus — counts byte-stable), stable wave-parametrized tools (no more `-NNN` clones), and the 50→100 resolver cadence (next pause 350/450/550). Full green suite.

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

## Gate-Verdikt: Prämisse BESTÄTIGT → Leg 2 ausgeführt (Maintainer-OK „go")

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

## Leg 2 — was gebaut wurde (Bausteine 2–5)

**Baustein 2 — Runbook + brief-freier Driver** (`d6b40ea`):
- `sessions/resolver-pass-runbook.md` (NEU): ausführbare Spec für **genau eine** Phase, gespiegelt an `ssot-loop-runbook.md`. Pro Phase eine **„Lies NUR …"**-Regel + benanntes **Achs-Paket** (Phase liest Runbook + Config + Dossier + ihr Achs-Paket — **nicht** Brief 076, **nicht** den per-pass Brief, **nicht** die Override-Files). Promotions-Regel (freq≥2 + kuratierte freq=1-Iconics), Alias-Disziplin, FK-Reihenfolge (Phase 1 vor 3), Phase-0-Token-Dichte (§6), Phase-4-Digest (§7), Loop-Log-Tail-Read (§8) als stabile Regeln.
- Brief 076: Rationale-only-Banner oben (Pattern aus Brief 061), Inhalt erhalten, nur de-mandatet.
- `CLAUDE.md` + `AGENTS.md`: Resolver-Pass-Phase-Ausnahme von der Session-Start-Leseroutine (analog der SSOT-Loop-Ausnahme).
- `scripts/run-resolver-pass.sh`: `runbook` ist jetzt das **required** operative Config-Feld, `brief` optional/rationale-only; Trigger injiziert den **Runbook-Pointer** (nicht den Brief) + die „Lies NUR"-Anweisung; Driver läuft brief-frei.
- `scripts/resolver-pass.config.json`: + `runbook` (required), `brief` optional; Trigger zeigen auf **Runbook-Sektionen** statt Spec-Duplikat; `aggregator`/`verify`-Parameter-Blöcke + Scopes auf die stabilen Tools.

**Baustein 3 — Phase 0 token-dicht:** Runbook-Regel: Phase 0 liest **nur** Aggregator-Output + Tail-Loop-Log-Blöcke, **nie** die Override-Files. Der Aggregator emittiert weiterhin 6 der 7 Dossier-Sektionen deterministisch.

**Baustein 4 — Phase 4 korpus-entkoppelt** (`8925800`): `run-phase4-apply.sh` schreibt einen **fix-großen Digest** (`ingest/.last-run/phase4-digest.md`, **4.119 B ≈ ~1k tok**, korpus-**un**abhängig); die rohe Per-Batch-Apply-Ausgabe geht in ein **gitignored** `*-verbose.log`. `verify-pass.ts` emittiert den Verify-Digest. Vorher: roher Apply-Log 71.708 B (~17,9k tok), korpus-skalierend. **Live-Validierung gegen `001..025` (250 Bücher):** PRE-APPLY == alle 5 POST-BATCH == POST-APPLY counts byte-identisch (works 250, work_factions 1153, work_locations 455, work_characters 701, work_facets 5404) — Re-Apply ist idempotent (delete-then-insert pro Junction), kein Production-Pass.

**Baustein 5 — Konsolidierung + 100er-Takt:**
- Stabile, wave-parametrisierte Tools (Wave/Range aus Config): `aggregate-surface-forms.ts` (Daten-Output **byte-identisch** zum -089-Klon, nur Provenance-Header neu), `db-counts.ts`, `seed-facets.ts`, `run-phase4-apply.sh`, `verify-pass.ts`, + geteilter `resolver-pass-config.ts`-Loader. Die `-089`-Klone gelöscht (superseded, verifiziert-äquivalent); 074/076/077/084 als historische Records belassen. Ein künftiger Pass erzeugt **keine** neuen `-NNN`-Klone.
- Cadence 50→100 (`c406ea4`): `loop-next-batch.ts` Konstante `% 50` → `% 100 === 50` (Pause bei kumulativ ≡ 50 mod 100 → 250/350/450/550, **nicht** bei 300). Neues `Decision`-Feld `nextResolverPauseAt`. `npm run loop:next` gegen `001..025` (cumulative 250): `resolverPause:false` + `nextResolverPauseAt:350`. `test-loop-next-batch.ts`: 17/17 grün (250-block→350, 200/300 keine Pause, 350 mit/ohne Block, 450/550, anti-bleed). `run-ssot-loop.sh`: Default `ITERATIONS` 5→10 (eine volle 100er-Welle), Docblock + `-h`-Hilfe nachgezogen. Stale 50er-Referenzen in `ssot-loop-runbook.md` + `resolver/index.ts` gesweept.

## Decisions I made

- **`-089`-Klone gelöscht statt nur ergänzt.** Baustein 5 heißt „Konsolidierung". Nur-Ergänzen hätte die Datei-Zahl erhöht. Da die stabilen Tools verifiziert-äquivalent sind (Aggregator-Daten byte-identisch; db-counts/seed-facets generisch; verify generalisiert) und die Pass-5-Config nun auf die stabilen Tools zeigt, sind die `-089`-Skripte vollständig superseded → gelöscht (reversibel via git). Die älteren `074/076/077/084`-Klone **belassen** (andere Pässe, nicht verifiziert-äquivalent, höheres Risiko) — ebenso der committete `phase4-apply-089.log` (historischer Record, kein Klon-Skript).
- **`verify-pass.ts` ohne pass-spezifische One-offs.** Der `-089`-Verify hatte Pass-5-Einzelchecks (commissar-Facet, Night-Lords-W40K-0244, Autoren-Backfill). Die sind nicht generalisierbar → aus dem stabilen Tool raus; das Runbook (§7) sagt, solche Einzelchecks laufen als ad-hoc-SQL der Phase. Generisch bleibt: Smoke-Slugs (Config-Liste), Rating-Coverage (Config-Range), Drift/Gap/Collection-Replica (Config-Ranges).
- **Cadence-Offset 50 statt 0.** `% 100 === 50` (nicht `% 100 === 0`) hält die Serie durch die historische 250-Grenze laufen (250 % 100 = 50), sodass die nächste Pause bei 350 landet — exakt wie vom Brief verlangt (350/450/550, **nicht** 300). Robust gegen stale `⏸ … bei 300`-Blöcke, weil 300 % 100 ≠ 50.
- **Live-Re-Apply als Validierung statt nur Dry-Run.** Maintainer-Wahl. Der Re-Apply ist genau das, was Phase 4 ohnehin tut (idempotent), mutiert keinen neuen Inhalt — die byte-stabilen Counts beweisen sowohl Idempotenz als auch die Digest-Only-Auslesbarkeit.

## Verification

- `npm run lint` — pass · `npm run typecheck` — pass · `npm run brain:lint -- --no-write` — pass.
- `npm run test:resolver` — 173 pass · `test:resolver-data` — pass · `test:resolver-coverage` — pass · `test:apply-override-dry` — pass · `test:loop-next` — 17 pass · `test:synopsis-lint` — 14 pass.
- `npm run loop:next` (live `001..025`): `resolverPause:false`, `nextResolverPauseAt:350`, next `ssot-w40k-026`.
- Aggregator-Determinismus: `aggregate-surface-forms.ts` vs. `-089`-Klon — Daten-Tabellen byte-identisch (nur Provenance-Header differiert by design).
- Live idempotent re-apply `001..025` über `run-phase4-apply.sh`: exit 0, counts byte-stabil über PRE/POST-BATCH×5/POST.
- `bash -n` auf beiden Drivern OK; `resolver-pass.config.json` JSON-valide.

## Open issues / blockers

Keine. Brief 090 ist `implemented`.

## For next session

- **Phase-3-Wachstums-Kante (Brief-090-Open-Question):** `characters.json` (~9,6k tok bei 250 Büchern, 199 Rows) wächst je Welle. Bei ~859 Büchern Richtung 30–40k tok Volltext-Read → Phase 3 wird die erste, die einen Chunk-/Achs-Slice-Mechanismus für die Reference-JSON braucht. Im Runbook §3 Phase 3 als bekannte Kante vermerkt; bei `001..025` unkritisch.
- **`test-resolver.ts` (~9,5k tok)** wird von Phasen 1–4 gelesen — größter Einzel-Nicht-Brief-Posten im Achs-Paket. Unter 60k unkritisch, aber bei weiterem Wachstum beobachten.
- **Driver bleibt supervised/„nicht scharf".** `run-resolver-pass.sh` ist konsistent zum Runbook, wurde aber nicht headless gegen einen echten Pass gefahren (Out-of-Scope). Ein erster echter brief-freier Pass-6 (`ssot-w40k-026..030`) wäre der nächste Realtest.

## References

- Brief 090 (`sessions/2026-05-21-090-arch-resolver-pass-lean.md`) — Baustein 1 § Abzweigung (der Gate), Acceptance (A)/(B).
- Brief 088 / 061 (Vorlage: operative Spec → Runbook, Brief auf Rationale reduziert).
