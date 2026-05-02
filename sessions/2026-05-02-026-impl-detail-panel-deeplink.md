---
session: 2026-05-02-026
role: implementer
date: 2026-05-02
status: complete
slug: detail-panel-deeplink
parent: 2026-05-02-025
links:
  - 2026-05-01-018
  - 2026-05-02-024
commits:
  - 0e0eaa59f1d2ab9877b44e86716b8c64b373189d
  - 876277511099309dad1c14f574be9f1391b5e8ad
  - 6639eb0e1960885e1283c2df637e8991fa2187b9
  - 648dae577e567ebb788a982f3f3f1bdc50efe592
---

# Stufe 2c.1 — DetailPanel + Deep-Linking (impl)

## Summary

Shipped the DetailPanel hero modal + URL deep-link contract on `feat/2c1-detail-panel-deeplink` (PR #11). Click on a BookDot in EraDetail opens the panel with synopsis, factions+alignment+role, 5 curated facets in a Reading-Notes block, sources grouped by `external_link.kind`, series prev/next nav (cross-era safe), all aria-modal/focus-trap/focus-return wired. URL becomes shareable `?era=<id>&book=<slug>`; direct hits on `?book=<slug>` server-resolve to canonical via `book_details.primary_era_id`. No schema change, no new dependencies.

One discoverable seed-data quirk surfaced via the curl smokes: the brief's example slugs (`horus-rising`, `legion`) don't match the actual seed format `slugify("{title}-{id}")` → `horus-rising-hh01`, `legion-hh07`. Functional behaviour is correct; the cosmetic shareable-URL question is for a follow-up brief.

## What I did

- `sessions/2026-05-02-025-arch-detail-panel-deeplink.md` — committed the brief.
- `sessions/README.md` — Cowork's active-threads + carry-over update for 025 (folded in pre-impl).
- `src/lib/timeline.ts` — added `BookDetail` type plus exported helper unions `ExternalLinkKind`, `FactionAlignment`. Type-only; the loaders live server-side so `timeline.ts` stays importable from client components.
- `src/app/timeline/page.tsx` — widened `searchParams` to `{ era?, book? }`; legacy `?era=M30|M31|M42` redirect now propagates `?book=` unchanged; new branches: (a) `?book=<slug>` without era resolves via `resolveBookEra`, (b) `?era=<unknown>&book=<valid>` resolves to canonical so the panel never orphans on Overview, (c) `?era=<valid>&book=<unknown>` drops `?book=`. Added `resolveBookEra(slug)` and `loadBookDetail(slug)` private async loaders; both wrapped in try/catch with null fallback.
- `src/components/timeline/DetailPanel.tsx` — new client component. ESC/backdrop/× close handlers; focus-trap on Tab/Shift+Tab; initial focus on the close-button; focus-return on unmount via `getElementById("book-marker-{slug}").focus({ preventScroll: true })`. Series prev/next push canonical URLs using each sibling's own `primaryEraId` (cross-era nav). Reading-Notes block renders 5 curated facets (`entry_point`, `length_tier`, `tone`, `theme`, `content_warning`) in fixed order; empty categories silent-dropped; whole block dropped if all 5 empty. Sources block groups external_links by `kind` in fixed order (read → listen → watch → buy_print → trailer → official_page → reference). Faction tags get a left-border alignment accent. Cover placeholder is a designed card (no `<img>`) with `[data-era]` hook for future per-era tinting.
- `src/components/timeline/EraDetail.tsx` — `BookDot` upgraded `<div>` → `<button type="button">`; `useRouter` imported; click handler swapped from dev-only `console.log` to `router.push("/timeline?era={primaryEraId}&book={slug}")` (slug URI-encoded); stable `id="book-marker-{slug}"` for focus-return; children `<div>` → `<span>` (HTML validity inside `<button>`).
- `src/app/globals.css` — extended `.book-marker` with the standard `<button>`-default neutralisation + a `:focus-visible` cyan-outline treatment matching `.era-seg-brackets` vocabulary. Appended a labelled sub-block at the end of the Timeline section (~360 lines) porting `archive/prototype-v1/styles/detail-modal.css`'s `.detail-modal` / `.dm-*` family minus the order-CTA, secondary-link, find-similar, and light-theme bits. Added new `.dm-rn-*` (Reading-Notes) and `.dm-src-*` (Sources) blocks.

## Decisions I made

- **(a) CSS organisation** — labelled sub-block in `globals.css` at the end of the Timeline section, not a co-located `detail-panel.css`. Reason: the prototype CSS already uses our `:root` aliases verbatim (drop-in friendly), the Timeline block from 011/013 already established this pattern, and one painterly source-of-truth is easier to grep than a co-located file. Trade-off: globals.css is now ~1580 lines.

- **(b) Sibling-query strategy** — two targeted `lt`/`gt` queries on `bookDetails.seriesIndex` (with `desc`/`asc` orderBy + `findFirst`), filtered `isNotNull(seriesIndex) AND isNotNull(primaryEraId)`. Reason: handles the sparse seed (Vol 1 → Vol 7 → Vol 9) naturally; the non-null filter on `primaryEraId` makes the returned type honestly non-nullable so the prev/next URL push always has both params. The big-single-query alternative would have needed JS slicing; the leaning-on-timeline-prop alternative would have coupled the loader to other page data and made the loader unreusable outside `/timeline`.

- **(c) Focus-return mechanism** — BookDot upgraded to `<button>` with stable `id="book-marker-{slug}"`. DetailPanel's `useEffect` cleanup focuses that id with `preventScroll: true`. Reason: ~25 lines of diff including the button-default reset and a `:focus-visible` indicator (cyan-stroke + drop-shadow, same vocabulary as `.era-seg-brackets`); EraDetail stays mounted across panel open/close (constraint 11) so the originating BookDot survives; `preventScroll` avoids a viewport jerk if the dot was panned out of view. Considered ref-threading from EraDetail down to BookDot — rejected because EraDetail doesn't know about the panel and ref-threading would couple them.

- **(d) Animation timing** — `dmFade` 200ms ease-out, `dmRise` 320ms `cubic-bezier(.2,.8,.2,1)` (translate -48%→-50% Y, scale 0.96→1, opacity 0→1). Reason: 320ms sits clearly snappy against band-hover (300ms) and the buzzy-glitch (.42s steps): the cogitator "reads you back" rather than "stutters at you." 200ms on the dimmer keeps it from drawing attention away from the modal lift. Brief flagged this for a possible polish-pass when EntryRail (2a.1) lands more competing motion — agree, but the current values feel right against today's motion vocabulary.

- **(e) `prefers-reduced-motion`** — relied on the existing global cascade in `globals.css` (universal selector → `animation-duration: 0.001ms` AND `transition-duration: 0.001ms`, both `!important`). Verified Z. 181–187 covers both `dmFade`/`dmRise` (`animation:`) and all hover transitions. No `@media (prefers-reduced-motion: reduce)` block in the panel CSS.

- **(f) Close-handler** — always `router.push("/timeline?era=" + eraId)`. Considered the `router.back()` heuristic via `window.history.length` (rejected: tab-global, would jump off-site for direct-hit shares) and a `document.referrer` check (rejected: marginal UX gain, runtime branching). Push is predictable, and Browser-Back walks naturally through panel states because BookDot click also pushes (constraint 6).

- **(g) Era-mismatch handling** — `?era=X&book=Y` where `Y.primaryEraId !== X` renders the panel anyway (no auto-correct). Reason: brief constraint 1 describes canonical shape but doesn't prescribe enforcement; constraint 11 forbids EraDetail remount mid-panel-flow; auto-correct would surprise users who clicked from a stale share. The unknown-era + valid-book branch (a NEW addition not in brief acceptance) does redirect — there the alternative would orphan the panel above an Overview that has no BookDot to focus-return to.

- **Sources block kind ordering** — `read → listen → watch → buy_print → trailer → official_page → reference`. Reason: action-types (read/listen/watch) cluster first; `buy_print` neutral inline (no CTA framing per constraint 20); meta-links (trailer/official_page) after; reference last as the lookup-when-curious backstop (constraint 17).

- **Sources group labels: English** ("Read", "Listen", "Watch", "Buy", "Trailer", "Official site", "Reference"). Reason: rest of the UI is English with German-tinged copy; label-language consistency matters more than mirroring the brief's German voice.

- **`content_warning` visual mark: `[!]` mono-prefix**, not Unicode `⚠`. Reason: existing design vocabulary is mono-line markers (◂, ▸, ◆, |) — a Unicode emoji glyph would break the painterly cogitator family. Plus an amber `--warm` border-left accent on the sub-section (Reader-Safety, not decoration; per constraint 13).

- **Faction tag alignment hint: left-border accent** in the imperium/chaos/xenos/neutral palette (cyan / amber / muted-cyan / line-grey). Subtler than full-tag tinting; brief left visual treatment open.

- **Cover placeholder rendering** — designed card with eyebrow (era id) + title + author + crest (first faction's `glyph` text) + caption "Cover art coming soon". `[data-era]` attribute on `.dm-cover-bg` is wired up but no per-era CSS rules defined yet — forward-compat hook. NO `<img>` element anywhere.

- **`FactionGlyph` component** — does NOT exist in `src/` yet (lands in 2a.2 per the docblock comment in `EraDetail.tsx`). Used `factions.glyph` text-column content directly in `<span>` (both `.dm-tag-ico` and `.dm-cover-crest`). Forward-compat: when the SVG component arrives, swap `<span>{f.glyph}</span>` → `<FactionGlyph id={f.id} size={11|28}/>`.

- **Loaders private to `page.tsx`, not exported from `timeline.ts`** — adjusted from the plan. Reason: `timeline.ts` is imported by Overview and EraDetail (both client components). If `loadBookDetail` were exported from there, the `db` import would be tree-pulled into the client bundle, throwing on `process.env.DATABASE_URL` at init time and bloating the bundle with `postgres`. Following the existing `loadTimeline` pattern: loaders are private async functions next to the page component, only the type travels through `timeline.ts`.

- **Slug-encoding everywhere** (`encodeURIComponent` on every `?book=` URL build) — defensive even though current slugs are ASCII. Cheap insurance.

- **Brief's `<img>` for coverUrl path** — not used. `coverUrl` is null today and the placeholder card stands on its own; rendering an `<img>` with a fake/placeholder URL would be a brief-violation. The current code-path (cover placeholder, no `<img>`) handles a future non-null `coverUrl` by ignoring it — when real cover URLs arrive, the placeholder block needs to swap into a conditional render alongside an `<img>` element. That's a cleanup, not a today-task.

## Verification

Local:

- `npm run lint` — pass (1 pre-existing layout.tsx warning unchanged).
- `npm run typecheck` — pass.
- `npm run build` — pass; `/timeline` remains `(Dynamic) ƒ`; no static-render regressions.
- Dev server (Philipp's already-running instance on :3000): hot-reloaded all 4 commits without restart.

Curl smokes (all 307 with correct `Location`):

| URL | → Location |
|---|---|
| `?book=horus-rising-hh01` | `/timeline?era=horus_heresy&book=horus-rising-hh01` ✓ |
| `?book=does-not-exist` | `/timeline` ✓ |
| `?era=horus_heresy&book=does-not-exist` | `/timeline?era=horus_heresy` ✓ |
| `?era=foo&book=horus-rising-hh01` | `/timeline?era=horus_heresy&book=horus-rising-hh01` ✓ |
| `?era=M31&book=horus-rising-hh01` | `/timeline?era=horus_heresy&book=horus-rising-hh01` ✓ |
| `?era=M30` | `/timeline?era=great_crusade` ✓ (no regression) |

Render checks (curl + grep):

- `?era=horus_heresy&book=horus-rising-hh01` returns 200; rendered HTML contains `detail-modal`, `dm-title`, `Reading notes`, `Sources`, `book-marker-horus-rising-hh01`, `Vol 1 / 10` (verbatim — see "Data anomaly to surface"), `Lexicanum` link with `target="_blank"` and `noopener`.
- `?era=great_crusade&book=legion-hh07` returns 200; rendered HTML contains `Vol 7`, `aria-label="Next volume"`, `book-marker-legion-hh07`. Cross-era series-nav: Legion's next-sibling query returns hh09 Mechanicum (`primaryEraId: horus_heresy`, `seriesIndex: 9`), so the next-volume button onClick will push `?era=horus_heresy&book=mechanicum-hh09`.

Pushed branch + opened PR #11; CI status check at PR is `ci / lint-and-typecheck` — verifying green at completion of this report.

## Open issues / blockers

None. Brief was complete and unambiguous on all material points.

## For next session

- **Slug format mismatch with brief.** The brief's example slugs (`horus-rising`, `eisenhorn-xenos`, `legion`, `dark-imperium`, `the-talon-of-horus`) imagined a `slugify(title)` format. The actual seed (`scripts/seed.ts:371`) uses `slugify("{title}-{id}")` so the real slugs are `horus-rising-hh01`, `eisenhorn-xenos-eis01`, `legion-hh07`, `dark-imperium-di01`, `the-talon-of-horus-bl01`. Functionally fine; aesthetically the `-hh01` tail is noise on shareable URLs. Two options for a future hygiene brief: (a) drop the `-{id}` from the slugify call (risk: title collisions across Horus Heresy entries with similar names); (b) keep the `-{id}` (cleaner uniqueness, uglier URLs). Not urgent — surface so Cowork can pick.

- **`series.totalPlanned` vs. `seriesIndex` inconsistency.** `horus_heresy_main` has `total: 10` in `series.json` but `hh41` (Garro) has `seriesIndex: 41`. Panel renders this verbatim as "Vol 41 / 10". Either the series total should be 64 (canonical Horus Heresy main-arc length, which is what the brief Acceptance line "Vol 1 / 64" implied) or hh41 has the wrong seriesIndex. Neither is a panel bug; it's a seed-data bug surfaced by the new Vol-N rendering. Tiny hygiene fix-up brief.

- **Empty `content_warning` test case unverified.** Brief Acceptance line wanted to verify a book with zero `content_warning` values renders gracefully (sub-section silently dropped). All 26 books in the current seed have ≥1 content_warning value, so the empty-case code-path (`READING_NOTES_ORDER.filter` on empty arrays) wasn't exercisable today. Logic is in place — when a future seed adds a book with no warnings, the sub-section will silent-drop as designed.

- **Unknown-era + valid-book branch (NOT in brief Acceptance bullets).** I added `?era=<unknown>&book=<valid>` → resolves to canonical `?era=<primaryEraId>&book=<slug>` because the alternative orphans the panel above an Overview that has no BookDot to focus-return on close (Overview lost its book-pins in 013, brief constraint 32). Verified via smoke #4. Cowork should glance at this — it's a reasonable interpretation of constraints 1+11 but explicitly added beyond brief.

- **Cover placeholder vs. real coverUrl.** Today's render is the placeholder card unconditionally. When `works.coverUrl` becomes non-null (Phase-4 ingestion), the placeholder needs to swap into an `<img>` render-path. Tiny conditional; flagged not to forget when cover-URL crawling lands.

- **FactionGlyph SVG component** still pending in 2a.2. Once it lands, two spots in DetailPanel.tsx and one spot in EraDetail.tsx (the comment-only docblock at line 12) are ready for the swap.

- **`docs/ui-backlog.md`** — no new items from this session. The panel feels right against the existing motion vocabulary; if EntryRail (2a.1) crowds the page later, the 320ms `dmRise` is the calibration knob to revisit.

- **Roadmap.** § Phase 2a has "DetailPanel + URL state" as an unchecked item that Stufe 2c.1 closes; brief Notes Z. 575+ flagged this for Cowork to handle on read-through.

## References

- Brief: [`sessions/2026-05-02-025-arch-detail-panel-deeplink.md`](2026-05-02-025-arch-detail-panel-deeplink.md)
- Plan file (local): `~/.claude/plans/lies-sessions-2026-05-02-025-arch-detail-zazzy-liskov.md`
- PR: <https://github.com/phinklab/chrono-lexicanum/pull/11>
- Predecessor briefs: 018 (superseded), 023/024 (Era-Anchor foundation), 019/020 (Schema foundation)
- Prototype port source: `archive/prototype-v1/components/DetailPanel.jsx` + `archive/prototype-v1/styles/detail-modal.css`
- Next.js 16 `searchParams` Promise pattern: <https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional>
- Drizzle relational queries (`findFirst` with nested `with`): <https://orm.drizzle.team/docs/rqb>
