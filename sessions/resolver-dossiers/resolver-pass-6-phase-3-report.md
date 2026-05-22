# Resolver-Pass 6 — Phase 3 (Characters) — Report

**Status:** done — no `## Needs decision` (dossier 7d "zero hard blockers" held).
**Wave:** `ssot-w40k-026..035` (W40K-0251..0350). **Branch:** `codex/ingest-batches-resolver-pass-6`.
**Read scope:** runbook + config + dossier + Phase-3 axis package only; `factions.json` consulted for FK
targets. No Brief 076/090, no override files, no loop-log.

## Done-summary

Promoted the wave's recurring character surface-forms from dossier §7 (7a consolidation cases + 7b
freq≥2 spines + curated freq-1). Cross-batch alias-consolidation (the omnibus/trilogy duplication this
wave is built for) handled as **one row + alias**, never two rows.

- **`characters.json`:** +38 rows (199 → 237).
- **`character-aliases.json`:** +6 keys (28 → 34).
- **`test-resolver.ts`:** +15 `resolveCharacter` checks (6 alias-consolidation, 8 direct spines, 1
  unresolved-stays-null) — exceeds the ≥5 / ≥2-consolidation minimum.

### Spines promoted (7b, freq ≥ 2 unless noted)
- **Night Lords — First Claw** (`night_lords`, ssot-w40k-035): Talos(5), Cyrion(5), Uzas(5), Xarl(5),
  Mercutian(4), Septimus(4, human artificer), Octavia(4, Navigator), The Exalted(2).
- **Salamanders — Tome of Fire** (`salamanders`, ssot-w40k-028): Tsu'gan(6), Dak'ir(5), Elysius(2);
  **Nihilan(3) → `dragon_warriors`** (Phase-1 promotion).
- **Word Bearers — Dark Apostle** (`word_bearers`, ssot-w40k-027): Marduk(4), Kol Badar(4), Burias(4),
  Jarulek(2).
- **Rogue Trader** (`rogue_traders`, ssot-w40k-026/027): Lucian Gerrit(4), Brielle Gerrit(3),
  Inquisitor Grand(3, `inquisition`); Sarik(2, `white_scars`).
- **Sisters of Battle** (`sisters_of_battle`, ssot-w40k-026): Sister Miriya(3), Sister Verity(3).
- **Black Templars / Helsreach**: Grimaldus(4), Helbrecht(2) (`black_templars`).
- **Other freq≥2 single-form:** Huron Blackheart(4 → `red_corsairs`, Phase-1), Kor'sarro Khan(4,
  `white_scars`), Amit(3, `flesh_tearers`), Mogrok(2, `orks`), Pedro Kantor(2, `crimson_fists`),
  Harek Ironhelm(2, `space_wolves`), Kairos Fateweaver(2, `tzeentch`), Karlaen(2, `blood_angels`),
  Torris Vaun(2, **`primaryFactionId: null`** — heretic antagonist, no clean canonical faction).

### Cross-batch alias-consolidation (7a — one row + alias)
| canonical row | resolves direct (name) | alias key | primaryFactionId |
|---|---|---|---|
| `variel_the_flayer` | Variel the Flayer | Variel | red_corsairs |
| `commander_shadowsun` | Commander Shadowsun | Shadowsun | tau |
| `sister_superior_augusta` | Sister Superior Augusta | Sister Augusta | sisters_of_battle |
| `obadiah_roth` | Obadiah Roth | Inquisitor Obadiah Roth | inquisition |
| `grukk_face_rippa` | Grukk Face-Rippa | Grukk | orks |
| *(no new row)* | — (existing `tigurius`) | Varro Tigurius | — |

### Deliberately NOT promoted (§4 discipline)
`Galenus`, `Sentina`, `Vabion` — each freq-2 but their only shared book is the W40K-0299 *Plagues of
Orath* anthology; their second appearances are in unrelated novellas by different authors/chapters
(Black Templars / Nurgle), so identity **and** faction are genuinely ambiguous (name-collision risk).
Left **unresolved** rather than write a speculative row/edge ("better an open long-tail than a wrong
canonical edge"). In-phase judgment, not a hard block. Locked with a "Galenus stays null" test.

## FK-safety (runbook §5)
Every new `primaryFactionId` points at an existing faction or `null`. The two **new** faction deps —
`red_corsairs` (Variel, Huron Blackheart) and `dragon_warriors` (Nihilan) — were landed by Pass-6
Phase 1 (factions.json), verified present before use. `tzeentch` used for Kairos Fateweaver. Confirmed
green by `test:resolver-data` ("character primaryFactionIds point at existing factions or null") and
`apply-override-dry` ("dangling JSON FK/alias refs: 0").

## Verification (§10) — all green
`npm run test:resolver` (incl. 15 new sixth-wave checks), `npm run test:resolver-data` (no duplicate
ids/names; FK + alias-target integrity), `npm run test:resolver-coverage`, `npm run
test:apply-override-dry` (all validation counts 0). The new 026..035 surface forms are proven against
the override files in Phase 4 when the apply-range extends; glyphs matched the dossier exactly (straight
ASCII apostrophe for Tsu'gan / Dak'ir / Kor'sarro Khan).

## Notes for later
- `characters.json` now 1433 lines / 237 rows — still comfortably whole-file readable; no axis-slice
  needed yet (runbook §3 Phase-3 watch).
- Phase 4 spot-checks (dossier 7d, not this phase): `Architect of Fate`/`Overfiend`/`War for Armageddon`
  anthology-constituent gaps; `format->collection` advisory flags on `Flesh Tearers` / `Lords of
  Caliban`.

## Files changed (Phase-3 scope only)
- `scripts/seed-data/characters.json`
- `scripts/seed-data/character-aliases.json`
- `scripts/test-resolver.ts`
- `sessions/resolver-dossiers/resolver-pass-6-phase-3-report.md`

Commit: `Resolver-Pass 6 Phase 3 (Characters) — ssot-w40k-026..035` (no co-author trailer).
