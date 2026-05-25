---
session: 2026-05-13-070
role: implementer
date: 2026-05-13
status: complete
slug: faction-policy-hygiene
parent: 2026-05-13-070
links:
  - 2026-05-13-070-arch-faction-policy-hygiene
commits: []
---

# Faction-Policy & Hierarchie-Hygiene

## Summary

Browse-Root vs. Tree-Root als Konzept eingeführt (Policy-Datei + Decision-Wiki, KEIN Schema-Touch), `factions.json` audit-patched (Chaos-Rename + 14 Reparents), `seed-resolver-extensions` faction-Insert auf Upsert geliftet (Option A aus Notes Tabelle 4), Pre-Apply Parent-Hygiene-Check ins Runbook, und neue `brain:lint`-Kategorie „Faction policy" mit 2 Regeln. Junctions unverändert; kein Re-Apply nötig.

## What I did

- `scripts/seed-data/factions.json` — 14 Reparent-Edits + Chaos-Rename + alignment-Felder auf 14 ehemals-implizit-getaggten Rows. Heresy-Traitor-Legionen (`sons_of_horus`, `night_lords`, `thousand_sons`, `world_eaters`, `alpha_legion`) → `parent: "chaos"`; Loyalist-Astartes-Chapters (`ultramarines`, `blood_angels`, `space_wolves`, `dark_angels`, `raven_guard`, `salamanders`, `imperial_fists`, `black_templars`) → `parent: "adeptus_astartes"`; `grey_knights` → `adeptus_astartes`; `chaos`-Row `name: "Chaos"` (statt „Chaos Undivided") + `alignment: "chaos"` explizit.
- `scripts/seed-data/faction-policy.json` — neue Datei. `browseRoots[]` (16 IDs), `knownTopLevelExceptions: ["imperium"]`, `specialCases{}` (6 annotierte Edge-Cases). Schema bleibt unangetastet — Policy lebt in der JSON, nicht in `factions`-Spalten.
- `scripts/seed-resolver-extensions.ts` — `seedFactions()` auf `onConflictDoUpdate` umgestellt (Option A). Insert läuft jetzt über ALLE Rows (statt nur über die Filter-Liste der neuen Rows); ON CONFLICT auf `id` schreibt `name`, `parent_id`, `alignment`, `tone`, `glyph` aus `EXCLUDED.*`. Return-Shape: `{ added, updated }`. Aggregate-Log angepasst (`totalExisting` statt `totalSkipped`). `sql` aus `drizzle-orm` neu importiert.
- `scripts/brain-lint.ts` — neue Category `"Faction policy"` ans Ende des Union-Typs und `CATEGORY_ORDER` angefügt. `checkFactionPolicy(repoRoot)` direkt vor `compareFindings` eingehängt; nutzt bereits importierte `existsSync`/`readFileSync`. Regel 1 (warning): Faction-Row mit `parent: null`, deren `id` weder in `browseRoots` noch in `knownTopLevelExceptions` liegt. Regel 2 (error): Faction-Row mit `parent: X`, wo `X` keine existierende Faction-ID ist. Registrierung in `main()` als Zeile parallel zu den anderen `findings.push(...checkXxx(...))`-Aufrufen.
- `brain/wiki/decisions/faction-policy.md` — neue Decision-Page (Typ `decision`, `decision-date: 2026-05-13`). Sections: Context · Drei Ebenen · Browse-Root-Whitelist · Sonderfälle · Was wir bewusst NICHT entscheiden · Revisit-Trigger · Aftermath. Verlinkt von `brain/wiki/index.md` (Decisions-Tabelle, vor `why-excel-ssot-not-crawl`).
- `brain/wiki/index.md` — neue Zeile in Decisions-Tabelle.
- `brain/wiki/project-state.md` — `## Recently shipped` neue Top-Zeile für 070-impl. `## What's running` neuer Bullet „Faction-Policy" + Brain-Lint-Bullet auf 11 Kategorien aktualisiert. Frontmatter `sources:` + `related:` ergänzt um 070-arch/-impl und `decisions/faction-policy.md`.
- `docs/resolver-apply-runbook.md` — neue Section `## Pre-Apply Parent-Hygiene-Check` vor `## Apply Order` (Diff-gegen-last-applied-batch → Audit → Upsert-Seed → brain:lint cross-check → apply). `## If Something Is Already Off` aktualisiert um den Factions-Upsert-Status.

## Decisions I made

- **Update-Mechanik = Option A (Upsert in seed-resolver-extensions).** Cowork-Präferenz; künftige Pre-Apply-Hygiene-Sweeps brauchen den Pfad wiederholt. Nur die JSON-stammenden Spalten (`name`, `parent_id`, `alignment`, `tone`, `glyph`) werden via `EXCLUDED.*` überschrieben — kein Risiko für hypothetische Maintainer-Hand-Edits auf anderen Spalten, weil `factions` keine weiteren hat. Sectors/Locations/Characters bleiben `onConflictDoNothing` (insert-only), weil dort die JSON nicht die einzige Wahrheit ist (Maintainer-Anreicherung erwartet).
- **`grey_knights` Parent = `adeptus_astartes`.** Lore-Doppelnatur (Chamber Militant Ordo Malleus + Astartes-Grade). Resolver-Robustheit gewichtet: Books klassifizieren Grey Knights üblicherweise als Marines (Gene-seed, 1000-Knight-Rule), nicht als Inquisition-Apparat. Inquisition-Aspekt lebt in `specialCases` der Policy.
- **`alpha_legion` Parent = `chaos`** (Cowork-Empfehlung). Post-Heresy-Default; Pre-Heresy/Cabal-Twist-Ambivalenz ist HH-Domain-Sorge und nicht heute relevant.
- **Decision-Page liegt unter `decisions/`**, nicht top-level. Page-Type ist `decision` (Policy-Wahl mit Options-Considered-Charakter); folgt Konvention der existierenden ADR-Pages.
- **`imperium` als `knownTopLevelExceptions`-Entry, nicht als Browse-Root.** Sonst würde der Lint-Check ihn dauerhaft als Warning surface'n. Semantisch korrekt: `imperium` ist Grand-Alignment-Konzept (bereits in `factions.alignment` repräsentiert), keine UI-Filter-Wahl.
- **Reverse-Direction-Lint (browseRoots → factions.id) NICHT eingebaut.** Wäre marginale LOC, aber: wenn die JSON-Files konsistent sind, ist die Konstellation eher harmlos (UI würde dann eine leere Browse-Root anbieten, was ein UI-Bug ist, kein Daten-Bug). Lieber später, wenn UI-Code das wirklich braucht.

## Verification

- `npm run lint` — pass (1 pre-existing warning in `src/app/layout.tsx` zu Custom-Fonts, nicht von dieser Session).
- `npm run typecheck` — pass.
- `npm run brain:lint -- --no-write` — pass (siehe unten).
- `npm run db:seed-resolver-extensions` — Maintainer-Apply, Output siehe unten.
- Verify-SELECT — Output siehe unten.

### brain:lint output (post-changes)

```
Brain lint — 2026-05-13
  Blocking findings: 0
  Warnings: 4

  Inline diff raw fields: 0 blocking, 2 warning
  Brain size budget: 0 blocking, 1 warning
  Stale claim suspects: 0 blocking, 1 warning
```

Alle 4 Warnings sind pre-existing (log.md/open-questions.md inline-diff-raw-token, pipeline-state.md 390/300 body-lines, roadmap.md verweist auf `src/lib/recommend.ts`). **0 Findings in der neuen Category `Faction policy`** — Audit ist clean.

### `db:seed-resolver-extensions` output

```
[seed-resolver-extensions] start
[seed-resolver-extensions] validation ok
[seed-resolver-extensions] factions: +0 new, 52 updated (upsert on JSON columns)
[seed-resolver-extensions] sectors:  +0 new, 8 skipped existing
[seed-resolver-extensions] locations: +0 new, 68 skipped existing
[seed-resolver-extensions] characters: +0 new, 65 skipped existing
[seed-resolver-extensions] done. total: +0 new, 193 existing (factions upserted, others skipped)
```

Alle 52 Faction-Rows liefen durch den Upsert-Pfad (Option A). Sectors/Locations/Characters bleiben insert-only.

### Verify-SELECT

```sql
SELECT id, name, parent_id, alignment FROM factions
WHERE id IN ('chaos', 'sons_of_horus', 'ultramarines', 'world_eaters',
             'tanith_first', 'grey_knights', 'alpha_legion', 'imperium')
ORDER BY id;
```

Output (post-Apply):

```
alpha_legion         | Alpha Legion                 | parent=chaos                | alignment=chaos
chaos                | Chaos                        | parent=null                 | alignment=chaos
grey_knights         | Grey Knights                 | parent=adeptus_astartes     | alignment=imperium
imperium             | Imperium of Man              | parent=null                 | alignment=imperium
sons_of_horus        | Sons of Horus                | parent=chaos                | alignment=chaos
tanith_first         | Tanith First-and-Only        | parent=astra_militarum      | alignment=imperium
ultramarines         | Ultramarines                 | parent=adeptus_astartes     | alignment=imperium
world_eaters         | World Eaters                 | parent=chaos                | alignment=chaos
```

Alle 8 Rows entsprechen der Brief-Acceptance. Junction-Counts unverändert (kein Apply-Sweep angestoßen).

## Open issues / blockers

Keine. Cowork's Open-Question „bereits-Resolver-eingefügte Faktionen mit Parent-Inkonsistenzen" hat keine zusätzlichen Korrekturen produziert — die 23 Brief-063-Extensions sind alle policy-konform geparented (Spot-Check während dieser Session bestätigt). Cowork's Hinweis zu `gereon_resistance` (eher Resistance/Militia als formal Astra Militarum) bleibt eine kosmetische Frage — pragmatisch ist die jetzige Eingruppierung in Ordnung und passt zur Resolver-Logik der Books.

## For next session

- **`chaos`-Alias konnte aufgeräumt werden.** Bestehender Alias `"Chaos" → "chaos"` in `faction-aliases.json` ist nach dem `name`-Rename redundant (Direct-Match greift). Habe es trotzdem stehen lassen — schadet nicht, und Resolver-Direct-Match-Pfad hat Priorität. Kann in einer späteren Hygiene-Pass entfernt werden.
- **Tone-Anreicherung.** Mehrere Loyalist-Chapters tragen tone `"imperial"`, was generisch ist. Eine Tone/Glyph-Anreicherungs-Pass könnte z.B. `"angelic"`, `"frostbite"`, `"wolfish"` etc. unterscheiden. Eigener Brief, nicht heute.
- **Reverse-Lint-Direction.** Falls Browse-Roots-Liste mal nicht synchron mit `factions.json` läuft, würde ein Check „browseRoot ohne entsprechende Faction-Row" das früh fangen.
- **UI-Rollup-Vorarbeit.** Sobald 100+ Bücher resolved sind und UI-Polish anliegt, kann die Browse-Root-Policy in einen `WITH RECURSIVE`-Helper + Filter-Refactor umgesetzt werden.

## References

- Brief: [`sessions/2026-05-13-070-arch-faction-policy-hygiene.md`](./2026-05-13-070-arch-faction-policy-hygiene.md)
- Decision-Page: [`brain/wiki/decisions/faction-policy.md`](../brain/wiki/decisions/faction-policy.md)
- Policy-Data: [`scripts/seed-data/faction-policy.json`](../scripts/seed-data/faction-policy.json)
- Runbook: [`docs/resolver-apply-runbook.md`](../docs/resolver-apply-runbook.md)
