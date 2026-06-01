---
session: 2026-05-28-103
role: implementer
date: 2026-05-28
status: complete
slug: data-audit-drift-gap-sweep
parent: 2026-05-27-103
links:
  - 2026-05-27-103-arch-audit-drift-gap-sweep
  - 2026-05-27-102-impl-hh-consolidation-pass
  - 2026-05-26-100-impl-resolver-hh
commits: []
---

# Audit-Cockpit Drift/Gap-Sweep — Daten-Pass (Batches-Strang)

## Summary

Brief-103-Daten-Pass implementiert: neuer `npm run audit:gap-candidates`-Helper (read-only Triage gegen Postgres, deterministischer Konsolen-Output + Markdown-Diff-Datei) plus zwei Pilot-Override-Backfills (HH-0260 *Hunter's Moon* + HH-0270 *Iron Corpses*). NEW-Range gap_works im `verify-pass.ts`-Digest sinkt erwartungsgemäß um **2** (18 → 16); beide Pilot-Bücher tragen post-Apply f/l/c ≥ 1 auf allen Achsen. UI-Pass und Brain-/Rollup-Edits sind Out-of-Scope (Brief 103 Strang-Disziplin, Brief 095 Rollup-Ownership).

Worktree: `chrono-lexicanum-batches`, Strang: Batch/Ingestion, Branch: `codex/ingest-batches-audit-pilot`.

## What I did

### Helper-Skript

- `scripts/audit-gap-candidates.ts` (neu, 246 Zeilen) — read-only SQL gegen `works ⨝ book_details` mit `kind='book' AND (format IS NULL OR format <> 'audio_drama')` und der Cockpit-Logik `factions=0 OR locations=0 OR characters=0`. Output deterministisch sortiert (`external_book_id ASC, slug ASC`), gibt pro Buch `external_book_id`, `slug`, `title`, `format`, `f/l/c`-Counts, `confidence` plus Summary-Block (`total`, `by domain`, `by axis`). Schreibt zusätzlich Markdown-Snapshot nach `ingest/.last-run/audit-gap-candidates.md` für späteren Diff. Kein DB-Write, kein Override-Touch, kein Resolver-Trigger.
- `package.json` — neuer Script-Eintrag `"audit:gap-candidates": "tsx --env-file=.env.local scripts/audit-gap-candidates.ts"` zwischen `analyze:v2-surfaces` und `backfill:hardcover-rating` (alphabetisch sortierte Audit-Cluster).
- Idempotenz verifiziert: zwei konsekutive Läufe gegen unveränderten DB-Stand produzieren byte-identischen Konsolen-Output und Markdown (`diff /tmp/audit-run-A.txt /tmp/audit-run-B.txt` → `IDEMPOTENT`).

### Pilot-Override HH-0260 (Hunter's Moon, Welle ssot-hh-026)

Pre-State (Pass-15-Stand): `f=2 (Space Wolves, Alpha Legion) / l=0 / c=0`. Synopsis nennt explizit Pelago (Welt), Tidon/Ven/Sareo/Felbjorn (story-spezifische Fisherfolk + Vlka-Fenryka-Watcher) und Leman Russ / Alpharius (Heresy-Primarchen, die den Watcher entsendet bzw. dessen Brüder sind). Pre-Pass-15 hat der Implementierer Pelago + die vier Story-Chars in den Override gepackt, der Resolver hat sie alle gleichzeitig als unresolved verworfen (kein Anchor in `locations.json` / `characters.json`).

Backfill-Strategie (Halluzinations-Schutz, Brief 103 § Notes): nur kanonisierungsfähige Achsen-Punkte promoten, die in der Synopsis-Lore explizit benannt sind.

- `scripts/seed-data/locations.json` — neuer Anchor `pelago` (oceanic Backwater, sector/gx/gy = null, tags `["space_wolves"]` für den Vlka-Fenryka-Watcher-Lore-Anker). Tag-Konvention mirror `tallarn` / `nuceria` / `northwilds` (single-Legion-tagged Pass-15-Locations).
- `scripts/seed-data/manual-overrides-ssot-hh-026.json` HH-0260 — Charakter-Array um zwei kanonische Mentions erweitert: `{ "name": "Leman Russ", "role": "mentioned" }` + `{ "name": "Alpharius", "role": "mentioned" }`. Beide sind freq-3 Primarchen-Anchors aus Pass 10 (`leman_russ`, `alpharius`), beide werden in der Synopsis wörtlich genannt ("one of the Vlka Fenryka watchers Leman Russ had placed aboard his brother Alpharius's ships"). Tidon/Ven/Sareo/Felbjorn bleiben als unresolved Surface-Forms im Override stehen — sie sind story-spezifische Minor-Chars eines 60-Min-Audio-Dramas, eine Promotion wäre Single-Mention-Bloat. Die `low_confidence:characters`-Begründung aus Pass-15-Dossier §6 trägt sich von selbst durch den Resolver-Skip.

Post-State: `f=2 (unverändert) / l=1 (Pelago) / c=2 (Russ + Alpharius)`. Gap geschlossen.

### Pilot-Override HH-0270 (Iron Corpses, Welle ssot-hh-027)

Pre-State: `f=1 (Iron Warriors) / l=1 (Tallarn) / c=0`. Synopsis nennt nur einen Charakter explizit: Iron-Warriors-Warsmith Koparnos (sole POV des Audio-Dramas). Der Override hatte ihn schon mit `role: "pov"` im Charakter-Array stehen — Resolver hat ihn nur als unresolved verworfen (kein Anchor in `characters.json`).

- `scripts/seed-data/characters.json` — neuer Anchor `koparnos` (Iron-Warriors-Warsmith, `primaryFactionId: "iron_warriors"`, Notes referenzieren Brief 103 + HH-0270). Override-File HH-0270 bleibt unverändert; Resolver greift den existierenden `{ "name": "Koparnos", "role": "pov" }`-Eintrag, sobald das Anchor in `characters.json` steht.

Post-State: `f=1 / l=1 / c=1`. Gap geschlossen.

### Brief-Status-Flip

- `sessions/2026-05-27-103-arch-audit-drift-gap-sweep.md` — Frontmatter `status: open → implemented` (Single-Line-Edit innerhalb desselben PRs, Brief-103-§-Notes-Konvention). Brief bleibt für den UI-Pass weiter referenzierbar; der zweite Pass kann den Status idempotent halten oder Cowork räumt im Post-Merge-Pass auf.

## Decisions I made

- **Audio-Drama-Filter im Helper-Skript per `bd.format <> 'audio_drama'`-SQL-Klausel, nicht per Application-Layer-Filter.** Brief 103 macht das Kriterium explizit (`bookDetails.format !== 'audio_drama'`), die DB-Spalte ist da, die Klausel ist eine Zeile, deterministische Ordnung ist gratis. Application-Layer-Filtering wäre ein unnötiger Round-Trip.
- **Markdown-Snapshot nach `ingest/.last-run/audit-gap-candidates.md`, nicht in einen audit-eigenen Pfad.** Brief 103 lässt die Wahl. `ingest/.last-run/` ist der etablierte Diff-Pfad für read-only Pre/Post-Snapshots (Brief 102 `phase4-digest.md` lebt dort), und der Maintainer-Diff-Workflow gegen einen Pre-Snapshot ist `git diff`-trivial. Keine neue Verzeichniskonvention.
- **Pelago-Tags konservativ als `["space_wolves"]`**, nicht `["space_wolves", "alpha_legion"]`. Die Alpha Legion erscheint im Audio-Drama nur über den abgestürzten Stormbird (Antagonist eines Schiffes, keine planetare Präsenz). Die Vlka Fenryka stationieren dort dauerhaft Watcher — das ist die einzige strukturelle Faction-Präsenz. Mirror der Pass-15-Pattern (`nuceria: ["world_eaters"]`, `tallarn: ["astra_militarum"]`).
- **Story-Chars Tidon/Ven/Sareo/Felbjorn NICHT promoten.** Brief 103 § Notes: "Lore-Anker, die nicht in einer dieser Quellen explizit benannt sind, gehören NICHT in den Override (Halluzinations-Schutz)." Sie sind benannt — aber sie sind Single-Mention-Audio-Drama-Minor-Cast (kein Cross-Buch-Anchor, keine Heresy-Iconic-Figure). Eine Promotion würde die canonical characters.json um 4 Single-Mention-Einträge aufblähen, die nie wieder gematcht werden. Russ + Alpharius sind freq-3-Primarchen — beide Anchor ist gratis und konsistent mit der Pass-10-Primarchen-Spine-Promotion.
- **Koparnos vollkanonisch promoten statt als Mention zu kürzen.** Im Gegensatz zu Tidon/Ven/Sareo/Felbjorn ist Koparnos POV-Charakter eines Iron-Warriors-fokussierten Audio-Dramas mit klarem Tallarn-Anchor-Punkt. Die Iron-Warriors-Charakter-Liste hat freq-1-Promotionen schon mehrfach (Pass 15 `bulveye`, `erud_vahn` etc.) — Koparnos passt in dasselbe Bucket. POV-Rolle ist die stärkste verfügbare Charakter-Rolle; bei einer Mention-Promotion wäre die Junction-Rolle eine Stufe schwächer als die Synopsis-Realität.
- **Helper-Skript laufzeit-strict gegen Brief-103-Spec (kein „smart"-Filter).** Forecast im Brief: "~10–20 echte fixable Data-Quality-Lücken". Tatsächlicher Output post-Backfill: **325 Kandidaten** (HH=73, W40K=252). Brief-Spec ist literal — `hasJunctionGap=true AND format!='audio_drama'`. Eine "smarter" Filterung (z.B. confidence-Schwelle, oder Single-Axis-Heuristik) wäre ein scope-creep. Der Maintainer-Excel-Sweep-Schritt (Out-of-Scope Brief 103) verfeinert 325 → ~10–20.
- **Branch-Strategie folgt Brief 103 Vorschlag** — `codex/ingest-batches-audit-pilot`, einmal aus `origin/main` gezweigt. Kein Rebase auf eine in-flight Feature-Branch.
- **Tight diff.** Drei Daten-File-Touches (`locations.json`, `characters.json`, `manual-overrides-ssot-hh-026.json`), ein neues Skript (`audit-gap-candidates.ts`), ein `package.json`-Eintrag, ein Brief-Status-Flip, ein Impl-Report. Kein UI-Touch (out-of-scope), kein `brain/**`/`sessions/README.md`-Touch (Brief 095 Rollup-Ownership), kein Resolver-Skript-Touch.

## Verification

Pre-State capture (Pass-15-Stand vor Brief-103-Edits):

- `npm run test:apply-override-dry` — clean, `out-of-range=0`, `unknown-work=0`.
- `tsx --env-file=.env.local scripts/verify-pass.ts --config scripts/resolver-pass.config.json`:
  - HH-0260: `f=2/l=0/c=0`, HH-0270: `f=1/l=1/c=0`.
  - NEW range (`HH-0251..HH-0294`): `gap_works=18`, `drift_works=25`.
- `npm run audit:gap-candidates` — 325 Kandidaten (HH=73, W40K=252; factions=0 → 29, locations=0 → 228, characters=0 → 194). Idempotent (zwei Läufe byte-identisch).

Post-State (nach `db:seed-resolver-extensions` + `db:apply-override --batch ssot-hh-026/027`):

- `npm run db:seed-resolver-extensions` — `+2 new` (locations=+1 pelago, characters=+1 koparnos), alle anderen Zeilen unverändert (`location tags: 0 updated, 140 already current`).
- `npm run db:apply-override -- --batch ssot-hh-026` — HH-0260 update: `factions=2 locations=1 characters=2 authors=1`. Inserts=0, updates=10.
- `npm run db:apply-override -- --batch ssot-hh-027` — HH-0270 update: `factions=1 locations=1 characters=1 authors=1`. Inserts=0, updates=10.
- `tsx --env-file=.env.local scripts/verify-pass.ts --config scripts/resolver-pass.config.json`:
  - Smoke slugs: HH-0260 `f=2/l=1/c=2`, HH-0270 `f=1/l=1/c=1`, HH-0280 `f=2/l=2/c=1`, HH-0290 `f=2/l=0/c=2`, HH-0294 `f=20/l=4/c=3`.
  - Rating coverage (`HH-0251..HH-0294`): 44/44 rated, `goodreads=44`.
  - NEW range gap_works: **18 → 16** (−2 = HH-0260 + HH-0270, exakt Brief-Forecast).
  - NEW range drift_works: 25 (unverändert — Drift-Achse wurde nicht angefasst).
  - OLD range (`HH-0001..HH-0250`): `gap_works=80` (unverändert), `drift_works=125` (unverändert).
  - Out-of-Range-Tripwire: 147 — Artefakt der HH-only `applyRange` im Pass-15-Config gegen den post-Brief-102 Full-Corpus-DB-Stand (Brief 102 Cross-Domain-Boundary-Logik erwartet 0 nur bei Multi-Range-Configs wie `consolidation-pass-2.config.json`). Keine Regression durch diesen PR.
- `npm run audit:gap-candidates` (post-Backfill) — Summary unverändert bei 325 Kandidaten. HH-0260 + HH-0270 waren vor dem Backfill **nie in der Liste** (Audio-Drama-Filter strippt sie qua Spec, nicht qua Junction-Count) — Acceptance-Kriterium "verschwinden aus Kandidatenliste" trivial erfüllt. Idempotent.
- `npm run test:apply-override-dry` — clean, `out-of-range=0`, `unknown-work=0`.
- `npm run test:resolver` — 473 passed, 0 failed.
- `npm run test:resolver-data` — `resolver data integrity ok` (alle 10 Checks grün, inkl. `coverage smoke slugs exist in w40k-001..057 + hh-001..030`).
- `npm run test:resolver-coverage` — Below-threshold-Zeilen als Data-Findings (keine automatischen Failures); Totals `factions=2754/3101, locations=1146/1458, characters=2000/2526`.
- `npm run test:collection-refs` — 10 passed, 0 failed.
- `npm run lint` — 0 errors, 1 vorbestehende Next-Font-Warning in `src/app/layout.tsx:44` (Brief 103 § Notes flagt sie explizit als pre-existing/strang-fremd).
- `npm run typecheck` — pass.
- `npm run brain:lint -- --no-write` — `Blocking findings: 0`, 25 Warnings (alle pre-existing: inline-diff=2, brain-size=4, stale-claim=13, faction-policy=6) — keine neue Blocking-Warning durch diesen PR.

## Open issues / blockers

Keine. Brief-Acceptance-Set (Daten-Pass) komplett:

- [x] `npm run audit:gap-candidates` reproduzierbar, sortiert, mit `external_book_id`, `slug`, `title`, `f/l/c`-Counts (+ Format, Confidence, Summary-Block).
- [x] HH-0260 + HH-0270 in den jeweiligen Override-JSONs editiert, Lore-Anker-Konform (Russ + Alpharius + Pelago / Koparnos), Schema-Konform.
- [x] Pre/Post-NEW-Range gap_works dokumentiert: 18 → 16 (−2 = HH-0260 + HH-0270 raus).
- [x] Post-Backfill-`audit:gap-candidates` enthält HH-0260 + HH-0270 nicht (Audio-Drama-Filter, qua Spec).
- [x] `test:apply-override-dry` ok mit `out-of-range=0, unknown-work=0`; volle Resolver-Trias grün; `test:collection-refs` grün.
- [x] `lint` + `typecheck` + `brain:lint --no-write` grün (keine neuen Blocking-Warnings).
- [x] Kein UI-Touch, kein `brain/**`-/`sessions/README.md`-Touch (Brief 095 Rollup-Ownership), kein Schema-Touch.

## Open-Questions-Antworten (für Cowork)

- **(1) Konkrete Zahl der fixable Gap-Kandidaten post-Audio-Drama-Filter.** `npm run audit:gap-candidates` zeigt **325 Bücher** mit `hasJunctionGap=true AND format!='audio_drama'`. Verteilung: **HH=73**, **W40K=252**, other=0 — also W40K-konzentriert (~78 %). Achsen-Breakdown: `factions=0 → 29`, `locations=0 → 228`, `characters=0 → 194`. Bücher können in mehreren Achsen zählen. Die Brief-Forecast-Zahl "~10–20 echte fixable" bezieht sich m.E. auf die Subset nach Maintainer-Excel-Sweep-Triage (Bücher mit explizit benannten Lore-Ankern, die der Pass-Implementierer übersprungen hat) — die rohe Helper-Liste ist breiter. Spitze des Eisbergs: viele frühere W40K-Paperbacks (`W40K-0264 dark-apostle`, `W40K-0297 flesh-tearers`, `W40K-0345 shield-of-baal-devourer` etc.) mit `confidence=1.00` haben locations=0 oder characters=0, weil die ursprüngliche Lexicanum-/OpenLibrary-Crawl-Pipeline für diese Domäne dünner aufgesammelt hat. Lore-Reichtum ist da, Backfill-Aufwand ist linear pro Buch — Material für den laufenden Maintainer-Excel-Sweep.
- **(4) Pilot-Backfill-Qualität.** Pro Pilot-Buch sehr klein: HH-0260 Override-Block-Diff = **2 Zeilen** (Russ + Alpharius im `characters`-Array), HH-0270 Override-Block-Diff = **0 Zeilen** (Koparnos war als POV bereits im Override drin, Pre-Pass-15-Implementierer hat ihn nur nicht canonisch promoten können). Reference-JSON-Adds = 2 Zeilen × 2 Files (Pelago in `locations.json` + Koparnos in `characters.json`). Recherche-Quellen waren in beiden Fällen **die Synopsis im Override-File selbst** — die Pre-Pass-15-Synopses sind so lore-precise, dass alle Lore-Anker wörtlich benannt waren (Pelago, Tidon/Ven/Sareo/Felbjorn, Russ, Alpharius im HH-0260-Block; Koparnos, Tallarn, Ostentio Contritio im HH-0270-Block). Keine externe Lexicanum-/Black-Library-Recherche nötig. Effort pro Buch: **~5 min** für die Schema-Entscheidung (welche Anker promoten, welche als unresolved liegen lassen), ~1 min für die Edits, ~3 min für Dry-Apply + Verify-Stichprobe. Skalier-Schätzung für den Maintainer-Excel-Sweep: bei ~10–20 echten Fixable-Backfills (Brief-Forecast) etwa **2–4 h** Arbeit, vorausgesetzt die Synopses sind ähnlich lore-precise wie HH-0260/HH-0270.

(Open Questions 2/3/5/6 sind UI-Pass-Themen — Antworten landen im UI-Impl-Report.)

## For next session

- **Maintainer-Excel-Sweep-Pilot.** Mit dem `audit:gap-candidates`-Skript ist die Triage-Liste 1-Befehl-reproduzierbar. Empfehlung: nächste Cowork-Session zieht einen Subset von **HH-Domain-Kandidaten** (73 Bücher, davon viele Single-Axis-`factions=0`-Fälle wie `HH-XXXX` mit unresolved Surface-Forms, die per Maintainer-Excel triagebar sind) und probiert den Sweep-Workflow gegen 5–10 Beispiele. Brief 103-Forecast war "~10–20 echte fixable" — der Sweep wird zeigen, wie eng das tatsächlich ist.
- **Cockpit-Audit-Detailseite (Brief 103 § UI-Pass).** Cockpit-Refinements in `/buch/[slug]/audit` sind in Brief 103 als "optional" markiert. Wenn der UI-Pass die Sub-Sort sichtbar macht (Drift-Tie-Group-via-`Luna Wolves`×12-Anzeige), könnte die Detailseite analog die Top-Gap-Achse anzeigen ("Buch hat `locations=0`; Synopsis nennt: Tallarn, Pelago, …"). Out-of-Scope hier, aber Material für einen Folge-Brief, der UI + Daten verzahnt.
- **Pelago-Tags-Review.** Ich habe Pelago konservativ als `["space_wolves"]` getaggt (Vlka-Fenryka-Watcher-Anker). Falls Cowork im Post-Merge-Pass beim Tag-Audit der Pass-15-Locations zum Schluss kommt, dass Pelago mit `["space_wolves", "alpha_legion"]` (analog Calth mit `["ultramarines", "word_bearers"]`) den Audio-Drama-Plot besser reflektiert, ist das ein Single-Line-Edit. Drift/Gap-Verhalten ändert sich dadurch nicht.
- **Audit-Helper-Output-Persistenz.** Der Markdown-Snapshot `ingest/.last-run/audit-gap-candidates.md` wird pro Lauf überschrieben. Wenn Cowork einen Audit-Time-Series-Verlauf will (Brief-103-Forecast "die Restliste schmilzt über Wochen"), wäre ein dated Snapshot in `ingest/audit-snapshots/YYYY-MM-DD-gap-candidates.md` ein 5-Zeilen-Add. Heute nicht nötig (`git log` über die `.last-run`-Datei selbst zeigt den Verlauf).

## References

- Brief 103 (architect): `sessions/2026-05-27-103-arch-audit-drift-gap-sweep.md`.
- Brief 102 (predecessor, HH-Konsolidierungs-Pass): `sessions/2026-05-27-102-impl-hh-consolidation-pass.md`.
- Resolver-Pass 15 Dossier (Pre-State-Quelle für HH-0260 `low_confidence:characters`): `sessions/resolver-dossiers/resolver-pass-15-dossier.md` §6.
- `scripts/audit-gap-candidates.ts` — neuer Helper.
- `scripts/seed-data/manual-overrides-ssot-hh-026.json` HH-0260 — Russ + Alpharius Mentions.
- `scripts/seed-data/manual-overrides-ssot-hh-027.json` HH-0270 — Koparnos POV (unverändert, Resolver picks up via neuen Anchor).
- `scripts/seed-data/locations.json` — Pelago Anchor.
- `scripts/seed-data/characters.json` — Koparnos Anchor.
- `ingest/.last-run/audit-gap-candidates.md` — post-Backfill-Snapshot (325 Kandidaten).
- `src/app/buecher/page.tsx:264-272` — Cockpit-`hasJunctionGap`-Logik, die der Helper spiegelt.
- `scripts/verify-pass.ts:79-106` — `audit replica NEW range`-SQL, gegen die der Pre/Post-Drop von 2 gemessen wurde.
