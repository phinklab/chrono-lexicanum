---
session: 2026-05-29-105
role: implementer
date: 2026-05-29
status: complete
slug: buy-listen-links
parent: 2026-05-29-105
links:
  - 2026-05-27-103
commits: []
---

# Buy/listen links + audiobook narrators (Cluster A) — Data pass (Batches)

## Summary

Sourced audiobook credits for **66 books** into a committed sidecar
(`scripts/seed-data/audiobook-narrators.json`) and applied them durably to
`persons` + `work_persons` (88 rows, 29 narrators/performers). The P1 durability
fix is in and **proven**: scoping the override apply's `work_persons` delete to
author/editor roles means a resolver/SSOT re-apply of an audio-bearing batch now
leaves narrator/co_narrator/full_cast rows untouched. Brief stays `status: open`
for the Product/UI pass.

## Scope decided with the maintainer

The brief asked for a **spot-check (~15–20)** before bulk machinery. Mid-session
the maintainer chose a **medium batch (~60–80)**: spot-check to validate the
source, then continue through the major series + most-read titles in the same
pass. Landed at **66 credited + 4 audit = 70 checked**. A full 859 sweep stays a
recommended follow-up (the derived buy/listen *links* in the UI pass already
cover every book regardless).

## What I did

- `scripts/seed-data/audiobook-narrators.json` — **new.** The committed source of
  truth. `books[]` (66) keyed by `externalBookId`, each credit = `name`, `role`
  (`narrator`/`co_narrator`/`full_cast`), `sourceUrl`, `checkedAt`, `confidence`
  (+ optional `note`). `audit[]` (4) = checked-but-not-applied (no audiobook).
  88 credits: 63 narrator / 12 co_narrator / 13 full_cast.
- `src/lib/seed/persons.ts` — **new.** Extracted `slugifyPerson` + `deriveNameSort`
  verbatim out of `apply-override.ts` (which runs `main()` on import, so they
  couldn't be imported from there). Mirrors the Brief 077 `alignment.ts` move.
  Guarantees the audiobook apply slugifies names identically to the author path.
- `scripts/apply-audiobook-narrators.ts` — **new.** Small idempotent apply:
  validate → ensure persons → resolve `externalBookId`→`workId` → per-book scoped
  delete-then-insert of audio-role `work_persons`. `--dry-run` + `--file=` flags.
- `scripts/apply-override.ts` — **edit (the one narrow change).** Scoped the
  `work_persons` delete to `inArray(role, ["author","editor"])` (was: delete all
  for the work). Added `and` to the drizzle import; imports the two slug helpers
  from the new module instead of defining them locally. Behaviour-preserving for
  author/editor; audio roles now survive re-apply.
- `scripts/test-audiobook-narrators.ts` — **new.** Offline (DB-free) validator:
  asserts the committed sidecar is structurally valid + exercises every rule with
  synthetic bad inputs. `npm run test:audiobook-narrators` (12/12).
- `package.json` — **edit.** Added `apply:audiobook-narrators` (+ `--env-file`)
  and `test:audiobook-narrators` (no env, DB-free).

## Spot-check (acceptance #1)

Phase 1a checked ~18 representative books **before** any bulk work; the method
held, so I continued (Phase 1b) to 66. Method: **one web search per book** →
read the narrator/cast from the **Amazon/Audible product-page byline** (author,
then narrator(s)/cast, then "Black Library"). Representative slice:

| Book | Era | Format | Result |
|---|---|---|---|
| Horus Rising (HH-0001) | 2006 | novel | Toby Longworth (narrator) |
| Xenos (W40K-0001) | 2001 | novel | Toby Longworth |
| For the Emperor (W40K-0012) | 2003 | novel | **multi:** Perring + Rawlins + Gregory |
| Tales of Heresy (HH-0010) | 2009 | anthology | **5 narrators** (Armstrong + 4) |
| Butcher's Nails (HH-0245) | 2012 | audio_drama | **full cast** (Barrett + 4) |
| Garro: Legion of One (HH-0244) | 2011 | audio_drama | Toby Longworth (single performer) |
| Nightbringer (W40K-0047) | 2002 | novel | Bruce Mackinnon |
| Space Marine (W40K-0064) | 1993 | novel | **no audiobook** (audit) |
| Eye of Terror (W40K-0065) | 1999 | novel | **no audiobook** (only fan YouTube) |

- **Share with an audiobook:** of 70 checked, **66 (94%)** had a findable
  audiobook with named credits. The 4 misses are all pre-2008 titles (Space
  Marine '93, Eye of Terror '99, Deus Encarmine '04, Dark Apostle '07) — the
  Black Library audiobook program post-dates them and they appear unrecorded.
  Every modern/in-print title checked had credits.
- **Credit findability:** very high. The byline is on the Amazon/Audible page
  in essentially every case; audio-drama casts are also enumerated there and
  cross-checkable on Lexicanum/Fandom.
- **Cheapest source: per-book web search → Amazon/Audible byline.** Same cheap
  pattern that worked for Goodreads ratings; no multi-stage crawl/override loop
  needed (confirmed the brief's expectation).

## Coverage (acceptance #6)

- **66 books credited** — **33 HH / 33 W40K**.
- **Single-narrator: 58** · **multi-narrator (co_narrator): 5** · **full-cast: 3**.
- 88 `work_persons` rows; **29 distinct** narrators/performers created in `persons`.
- Series covered: HH originals (most of 1–29 + Master of Mankind), Siege of
  Terra (Solar War, Saturnine, Mortis, Warhawk, Echoes, End&Death I/II),
  Eisenhorn+Ravenor (6), Ciaphas Cain (3), Gaunt's Ghosts (5), Ultramarines (2),
  series openers (Night Lords/Soul Hunter, Ahriman, Dawn of Fire/Avenging Son,
  Beast Arises/I Am Slaughter), 5 HH audio dramas, and ~16 popular standalones
  (Titanicus, Infinite & Divine, Spear of the Emperor, Brutal Kunnin, Angron,
  Leviathan, Fall of Cadia, Krieg, Honourbound, Belisarius Cawl, …). These 66
  double as the **UI pass's audio-render pilot**.
- **4 audit entries** (`no_audiobook`): W40K-0064, W40K-0065, W40K-0217, W40K-0264.

## Durability (acceptance #4) — verified

Mechanism = the brief's recommended one: **scope the override delete to
author/editor** + **apply audio credits from the sidecar**. The two paths are
symmetric (apply-override owns author/editor; apply-audiobook-narrators owns the
three audio roles) and never clobber each other.

Proof, on the live DB:

1. Applied audio credits. `ssot-hh-001` range (HH-0001…HH-0010) =
   `{author: 9, narrator: 10, co_narrator: 4}` (HH-0001 = `author:Dan Abnett` +
   `narrator:Toby Longworth`).
2. Re-applied that override batch (`npm run db:apply-override -- --batch=ssot-hh-001`)
   through the **fixed** path → 10 books updated.
3. Re-queried: range counts **identical** — `{author: 9, narrator: 10, co_narrator: 4}`;
   HH-0001 still `author:Dan Abnett` + `narrator:Toby Longworth`. Narrator/co_narrator
   rows **survived**, author rows re-applied unchanged. (Before this fix the
   re-apply would have wiped all 14 audio rows.)

**Idempotency (acceptance #3):** re-ran `apply:audiobook-narrators` → 0 persons
created, global audio-role rows stayed exactly **88** (`{narrator:63, co_narrator:12,
full_cast:13}`) — no duplicates, no growth (`work_persons` PK `(workId, personId,
role)` + scoped delete-then-insert).

## Decisions I made

- **Role taxonomy.** `narrator` = single reader; `co_narrator` = additional
  readers on a multi-voice *reading* (Ciaphas Cain's framing readers; the 5-reader
  Tales of Heresy anthology — first reader `narrator`, rest `co_narrator`;
  Saturnine's Keeble + Gregory); `full_cast` = every named performer on a
  *dramatized* production (Butcher's Nails, Censure, Khârn). **Key call:** an
  "audio drama" with a *single* performer (Garro: Legion of One → Longworth; The
  Lightning Tower/The Dark King → Danny Webb) is `narrator`, **not** `full_cast` —
  role follows performer count, not the product's "audio drama" label.
- **Resolve by unique `external_book_id`, no kind/source scoping.** The Goodreads
  backfill scoped to `kind='book' AND W40K-%`; I deliberately did **not** — my
  sidecar includes `audio_drama` works and HH ids, and `works.external_book_id` is
  `UNIQUE`, so a direct `inArray` lookup is unambiguous and covers every work kind.
  All 66 resolved (0 unknown).
- **Added an optional `note` field to credits** (beyond the brief's
  name/role/sourceUrl/checkedAt/confidence). Used sparingly for genuine
  edition/role nuance (Horus Rising remaster; "single performer" justification on
  audio dramas; the Ciaphas Cain framing-reader split). The apply script ignores
  it — DB rows stay derived from name/role only.
- **Horus Rising recorded as Toby Longworth** (original BL unabridged), `confidence
  0.9`, with a `note` that a later remaster is narrated by Jonathan Keeble.
  Recording two separate-edition narrators as co-narrators of one work would be
  wrong; the UI just needs "who narrated it".
- **Extracted slug helpers rather than duplicating them** — the only way to
  guarantee `slugifyPerson` parity between the two apply paths, and the minimal
  behaviour-preserving change (verified: full resolver suite 473/473 still green).
- **Per-book transaction** in the apply (mirrors apply-override) so a failure can't
  leave a book with deleted-but-not-reinserted audio rows.
- **Confidence values:** 0.95 where the Audible byline named the narrator
  unambiguously; 0.8–0.9 for inferred/edition-variant cases (bundle narrators,
  the A-Thousand-Sons CD-vs-Audible discrepancy, full-cast spelling variance).

## Answers to the brief's open questions

1. **Did scoping the delete prove clean? Other code paths?** Clean — one narrow
   change, full suite green, durability proven. **Only `apply-override.ts` is a
   routine `work_persons` clobber.** The two other writers are benign: `seed.ts`
   only inserts into a freshly-`TRUNCATE`d table (legacy V1 full seed, not the
   SSOT path); `db-reset-for-ssot.ts` is a guarded `TRUNCATE … CASCADE` nuclear
   reset (`--confirm`/`DB_RESET_CONFIRM=1`) after which everything re-applies from
   source. Neither needs the treatment. So the single scope change is sufficient.
2. **Cheapest source / sidecar fields right?** Web search → Amazon/Audible byline
   is cheapest and reliable; no structured BL/Audible bulk listing was needed. The
   field set is right; I only **added** an optional `note`. Nothing to drop.
3. **Are derived links good enough vs. stored deep links?** (UI-pass question, but
   from the data side:) title-based search URLs will be fine for the vast majority.
   The few titles I'd flag for a possible stored override are **ambiguous/short
   common names** — e.g. *Legion*, *Nemesis*, *Censure*, *Krieg*, *Leviathan* —
   where an Amazon search may surface non-40K results; ISBN-keyed links (when
   `book_details.isbn13` is present) mitigate this.
4. **Markets / fallback:** out of scope for the data pass (the UI pass owns
   geo-localization). No data here constrains it.
5. **Unreliable derivations:** see #3 — the short-title collisions are the
   candidates for a later `external_links` override; none needed now.

## Verification

- `npm run test:audiobook-narrators` — **12/12 pass** (sidecar valid + rules).
- `npm run typecheck` (`tsc --noEmit`) — **clean.**
- `npm run lint` — **clean.**
- `npm run test:resolver` — **473/473** (confirms slug extraction is
  behaviour-preserving). `test:resolver-data`, `test:resolver-coverage`,
  `test:apply-override-dry`, `test:collection-refs` (10/10) — all green.
- `npm run brain:lint -- --no-write` — **0 blocking** (26 pre-existing warnings,
  all in `brain/**`, untouched).
- `npm run apply:audiobook-narrators -- --dry-run` then real apply — 66/66
  resolved, 29 persons, 88 rows.
- **Durability + idempotency** proven on the live DB (above).
- Canonical tables uncorrupted: author/editor counts unchanged after the override
  re-apply; only audio rows added.
- Temp verification probe (`scripts/_tmp-verify-audio.ts`) deleted before staging
  (`git status` shows exactly the 6 intended files).

## For next session (Product/UI pass + follow-ups)

- **UI pass anchor:** verify audio rendering against these 66 (e.g. HH-0001
  single-narrator, W40K-0012 multi-narrator, HH-0245 full-cast) — three render
  shapes the UI must handle.
- **Full 859 sweep** remains a recommended follow-up to credit the long tail
  (same one-search-per-book method; ~790 books left). The 4 audit `no_audiobook`
  rows are real gaps, not failures.
- **Audio-drama cast depth:** I credited the principal named performers per the
  byline; some full-cast dramas list more performers on Lexicanum than on the
  Amazon byline. A later pass could deepen casts if desired.
- **Spelling watch:** one performer appears as both "Charlotte Page" and
  "Charlotte Paige" across sources (recorded as "Charlotte Page"); "Seán Barrett"
  appears variously accented (slugifies to `sean_barrett` regardless).
- **Short-title store-link collisions** (#3) → candidate `external_links`
  overrides if search UX disappoints.

## References

- Sidecar source method: per-book Amazon/Audible product-page bylines + Lexicanum
  audio-drama cast pages (URLs captured per-credit in `sourceUrl`).
- Pattern precedents: `scripts/backfill-goodreads-rating.ts` (one-search-per-book
  apply), `scripts/apply-override.ts` (delete-then-insert junction), Brief 077
  `src/lib/seed/alignment.ts` (shared-helper extraction).
