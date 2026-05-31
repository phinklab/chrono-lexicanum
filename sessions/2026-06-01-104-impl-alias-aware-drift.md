---
session: 2026-06-01-104
role: implementer
date: 2026-06-01
status: implemented
slug: alias-aware-drift
parent: 2026-05-29-104-arch-alias-aware-drift
links:
  - 2026-05-29-104-arch-alias-aware-drift
  - 2026-05-28-103-impl-ui-audit-drift-gap-sweep
commits: []
---

# Alias-aware Drift — impl report

> **Worktree:** `chrono-lexicanum-product`, Strang: Product/UI, Branch: `codex/product-alias-aware-drift` (von `origin/main`).

## Summary

Built the shared alias module and routed all three drift call-sites through it. The drift test went from a boolean (`rawName !== canonical.name`) to three states — **none / known-alias / suspicious-drift** — classified **entity-exact** against the registered alias maps. Known edition renames (Imperial Guard → Astra Militarum, Eldar/Dark Eldar → Aeldari, …) now leave the suspicious-drift bucket and render as their own calm class; the cockpit drift count, global frequency and Brief-103 sub-sort see only real drift. The same module exposes the documented search-resolution contract (not wired to a UI yet) with a passing unit test.

No data, schema, DB, resolver or override touch — pure App-layer read-path + one new lib module + one new test.

**Headline finding (measured against live DB):** `drift_works` went **380 → 0**. Every drift junction in the 859-book corpus (500 junctions across 380 books) is a registered edition-rename — there is *zero* suspicious drift. This exceeds the brief's ~133 estimate because the full alias maps across all three axes cover far more than the top-3 faction clusters. `?audit=drift` is consequently an empty bucket now; see OQ 1 for the architect implications.

## What I did

### New: shared alias module `src/lib/aliases/index.ts`
- **SSOT wiring:** static imports of the existing `scripts/seed-data/*-aliases.json` (surface-form → id) **and** `{factions,locations,characters}.json` (id → name), exactly mirroring `src/lib/resolver/index.ts`. No second copy of the data; no runtime `fs`. `resolveJsonModule` bundles them for Next server components and Node scripts alike. The module is pure data+functions (no `server-only`), so the search half can later be used client-side too.
- **Drift API (entity-exact):**
  - `classifyDrift(axis, rawName, canonicalId, canonicalName): "none" | "known-alias" | "drift"` — the single source of the drift rule. `known-alias` requires `ALIAS_MAP[axis][rawName] === canonicalId`; a rawName that is a registered alias of a *different* entity stays `drift`. Exact / case-sensitive on this path (the stored rawName is the key that produced the resolution).
  - `tallyAxisDrift(axis, rows)` — folds one axis' junction rows into `{ suspectRawNames, suspectCount, knownAliases, knownAliasCount }`. Replaces the per-call-site `countResolvedDrift` + `collectDriftRawNames` helpers.
  - `isKnownAlias(...)` convenience.
- **Search API (contract, not wired):** `resolveSurfaceForm(query, axes?) : AliasResolution[]` — normalized (trim + lowercase via `normalizeQuery`) match against **both** alias keys and canonical names, across all three axes by default. Returns an array (honest about ambiguity); empty/unknown → `[]`. Diacritic/punctuation folding (`T'au`) is deliberately deferred to the search-wiring session per the brief.

### Three drift call-sites routed through the module
1. **`src/lib/atlas/queries.ts`** (`getWerkeRows`, feeds `/atlas/werke`): removed local `countResolvedDrift`; per-axis `tallyAxisDrift` using `wf.faction.id` etc. as `canonicalId`. `driftCount`/`hasDrift` now count suspicious drift only; added `knownAliasCount` to `WerkeRow`.
2. **`src/app/buecher/page.tsx`** (public cockpit): removed local `countResolvedDrift` + `collectDriftRawNames`; per-axis `tallyAxisDrift`. `driftCount` / `driftRawNames` / `factionDriftCount` etc. are now suspect-only, so `?audit=drift`, `counts`, `buildGlobalDriftFreq`, `driftScore`, `topDriftSignal` and the Brief-103 `· drift «X» ×N` sub-sort all operate on real drift. Added `knownAliasCount` + `knownAliases` to `CatalogueAudit`.
3. **`src/app/buch/[slug]/audit/page.tsx`** (detail): removed `isDrift`; each faction/location/character row classified via `classifyDrift(axis, rawName, id, name)`. New `<DriftMarker>` + `driftRowClass()` render the three states.

### Known-alias visibility (design freedom)
Chosen language: **"known alias"** / "ALIAS n" / "alias «Surface → Canonical»". Chosen colour: a **cool / luminous (cyan)** accent — deliberately set apart from drift's **warm/amber** "warning" treatment, so it reads unmistakably as *expected, not a bug*.
- **Detail page** (`/buch/[slug]/audit`): known-alias rows get `li.has-alias` (cool left-border + faint cool gradient) and an outlined `.entity-alias` "known alias" tag — calmer than the filled-amber `.entity-drift` tag. The existing `raw: «…»` line already shows which surface-form maps to which canonical entity.
- **Cockpit** (`/buecher`): an `ALIAS n` chip (`.catalogue-chip--alias`, cyan outline) in the audit chips, and an inline `· alias «Imperial Guard → Astra Militarum» +N` signal in the audit summary (shows surface→canonical for the first known alias + overflow count).
- **Optional URL filter:** added a `Known alias` audit pill (`?audit=alias`, URL-driven, no localStorage — consistent with the existing `audit=` flow). `AuditFilter` gained `"alias"`; `matchesAudit` (both `buecher/page.tsx` and `WerkePage.tsx`) and both `AUDIT_FILTERS` sets handle it. Because the shared `AuditFilter` type + `AuditPills` are reused by `/atlas/werke`, the pill appears there too and filters on `row.knownAliasCount > 0`.

### CSS
`src/app/styles/31-catalogue.css`: `.catalogue-chip--alias`, `.catalogue-row__alias-signal` (both `--cl-cyan` family). `src/app/styles/32-book-audit.css`: `.entity-alias`, `.audit-entity-list li.has-alias` (both `--hl` luminous family, parallel to the `--warm` drift styling).

### Test + script
`scripts/test-aliases.ts` (DB-free, `node:assert/strict` + pass/fail counter, repo's standalone-script convention) + `package.json` `test:aliases`. **Observed green: `aliases: 15 passed, 0 failed` (exit 0).** Covers the search contract (`imperial guard`/`Imperial Guard`/`  IMPERIAL GUARD  ` → astra_militarum via alias key; `astra militarum` → astra_militarum via canonical name; `eldar`/`dark eldar` → eldar; empty/unknown → []; axis filter) and entity-exact drift classification (known-alias, alias-of-other-entity stays drift, unregistered → drift, none cases, case-sensitivity, mixed tally split).

## Decisions I made
- **Static JSON import over runtime `readFileSync`** (OQ 2): `src/lib/resolver/index.ts` already imports these same JSONs this way and ships fine through the Next build, so there is precedent and no bundling/server-boundary problem. `readFileSync(process.cwd()/…)` would be fragile under Next file-tracing for files outside `src/`.
- **One classifier, one place:** `classifyDrift` is the only place the drift rule lives; `tallyAxisDrift` and all three call-sites call it. Removed the three duplicated `countResolvedDrift`/`isDrift`/`collectDriftRawNames` copies.
- **Search resolver returns a list** (OQ 3), not a single id — honest about cross-axis (and rare within-axis after case-folding) ambiguity; a convenience single-value wrapper can come with the search UI.
- **`alias` as a real audit filter** rather than detail-only — it reuses the entire existing `audit=`/`AuditPills`/`matchesAudit` machinery for ~no extra surface area and makes the quiet class browseable, satisfying "einsehbar als eigene Klasse".
- **Cool vs warm colour split** to encode "expected" vs "warning" semantically (OQ 4) — fits the Brief-096 `--cl-*` / internal-tools `--warm`/`--hl` token vocabularies already in those two CSS files; no new tokens.

## Verification
- `npm run typecheck` (`tsc --noEmit`) → **exit 0, green.**
- `npm run lint` (`eslint .`) → **exit 0, green.**
- `npm run test:aliases` → **15 passed, 0 failed.**
- `npm run test:resolver` (regression — no resolver files touched) → **473 passed, 0 failed.**
- `git diff --stat`: 8 files changed, +166 / −79; new untracked `src/lib/aliases/index.ts` + `scripts/test-aliases.ts`.
- **Live-DB before/after (measured against Supabase, 859 books):**
  - `drift_works` (books in `?audit=drift`): **380 → 0.**
  - dropped books (drift was alias-only): **380.** Known-alias books: **380.**
  - suspicious-drift junctions: **0.** known-alias junctions: **500.**
  - **Every drift junction in the corpus is a registered edition-rename** — there is no suspicious drift left. This is consistent and correct: the resolver only ever stores `(rawName, id)` where the alias map maps `rawName → id`, so by the entity-exact definition every drift junction *is* a known alias. The entity-exact guard still matters for future data integrity (a hand-written override that mis-points an alias) — it simply finds no mismatches in today's data. Far bigger than the brief's ~133 estimate (that was only the top-3 faction clusters; the full alias maps across all 3 axes cover ~500 junctions).
- **Browser smoke (dev server, live DB):** `/buecher`, `?audit=drift`, `?audit=alias`, `?audit=gap` all HTTP 200. `?audit=alias` → **380 hits of 859**, `.catalogue-chip--alias` + inline `· alias «Surface → Canonical»` signals render with real data (`Sisters of Silence → Talons of the Emperor`, `Mechanicum → Adeptus Mechanicus`, `Imperial Army → Astra Militarum`, `Isstvan V → Istvaan V`, …). Curl-level only — **a human still needs the visual desktop + ≤640px pass** (markers legible, layout intact, `?audit=gap` Brief-103 audio-drama behaviour unchanged).

### Verification status
- [x] `npm run typecheck` green (exit 0)
- [x] `npm run lint` green (exit 0)
- [x] `npm run test:aliases` green (15/0)
- [x] `npm run test:resolver` green (473/0, regression — no resolver files touched)
- [x] **before/after `drift_works`:** 380 → 0 (measured against live Supabase).
- [x] Curl smoke: all four `?audit=` views HTTP 200; alias chips + inline signals render with real data.
- [ ] **Human visual pass (maintainer):** desktop + ≤640px — `/buecher?audit=alias` (calm cool class legible, clearly set apart from gold drift vocabulary), `/buch/<slug>/audit` for an alias-bearing book (cool `known alias` marker vs amber `drift`), no-regression look at `?audit=gap` (Brief-103 audio-drama behaviour unchanged). Dev server is running on :3000.

## Open questions — answers for the next architect session
1. **Concrete drift reduction — measured:** `drift_works` **380 → 0**; **500** known-alias junctions across **380** books; **0** suspicious-drift junctions remain. There is *no* remaining suspicious drift to triage — the messier clusters the brief expected to survive (Mechanicum, Isstvan III/V, Sisters of Silence, Imperial Army, Tau Empire, Adeptus Ministorum, Luna Wolves, …) are **all registered aliases** and reclassified as known-alias. **Architect implications:** (a) `?audit=drift` is now a permanently-empty bucket on the current corpus — decide whether to keep the Drift pill + the Brief-103 drift sub-sort (`driftScore`, `· drift «X» ×N`) exposed (they still work, just have no data) or retire/relabel them; (b) the empty bucket is itself a positive data-quality signal — every surface-form variant in the corpus is curated; (c) ~44 % of books (380/859) now carry the calm alias class — if that reads as too busy, the architect may want it detail-page-only or behind the `?audit=alias` filter rather than always-on in the cockpit chips/inline signal (today it is always-on).
2. **Module ↔ JSON wiring:** direct static import from `scripts/seed-data/` (see Decisions). No bundling/server-boundary problem — same approach the resolver already ships with.
3. **Search ambiguity:** `resolveSurfaceForm` returns `AliasResolution[]`. A surface form can map to entities on different axes (and, after case-folding, conceivably to two ids within an axis), so a list is the honest contract; each hit carries `axis`, `canonicalId`, `matchedVia` (`alias` | `canonical-name`) and the matched `surfaceForm`. The search UI can pick/disambiguate.
4. **known-alias visibility form:** own audit chip + inline signal on the cockpit, calm cool marker on the detail page, **plus** an optional `?audit=alias` filter pill. The Brief-096 redesign drove the cool-vs-warm colour choice (reusing `--cl-cyan` / `--hl`).

## For next session
- Wire the search box to `resolveSurfaceForm` (the contract + test are ready); decide final normalization (diacritics/punctuation, `T'au`).
- Triage the remaining suspicious-drift clusters into: real alias-candidates (add to `*-aliases.json`, Batches strand) vs cross-era identities (ADR) vs genuine mis-resolves.
- Optional: surface `knownAliasCount` in the `/atlas/werke` `EntityTable` chips too (data is already on `WerkeRow`; only the chip render is missing).
- Housekeeping: I left `.b104-verify.log` (and possibly `.b104-*.log`) in the worktree as a verification scratch file — delete before commit (they are untracked; not part of the diff).
