# SSOT-Loop Log

> Append-only log of every loop-brief iteration (Brief 061). Cowork reads the latest entries to plan resolver briefs, vocabulary expansions, and mini-fixes. Pro Iteration ein H2-Block.
>
> Status: ✅ committed | ⏸ resolver-pause | ✋ skip-50-stop | 🏁 loop-complete

## 2026-05-12 · ssot-w40k-002 · W40K-0011..W40K-0020 · ✅

- **Cumulative books in authority:** 20 / 50 to next resolver pause (10 before this batch + 10 written here)
- **CC model:** claude-opus-4-7
- **Pre-check:** Detected existing `manual-overrides-ssot-w40k-001.json` (10 books) — no other files. W40K max = 1, HH max = 0, cumulative = 10, 10 % 50 ≠ 0 → no resolver pause. Next batch: `ssot-w40k-002`, slice = W40K-0011..W40K-0020.
- **WebSearch:** mean ≈ 1.2 / book, max = 2 (over 10 books). 12 total searches.
  - 2 searches: W40K-0011 *Penitent* (Bequin trilogy — needed plot detail on the King-in-Yellow arc), W40K-0019 *The Last Ditch* (needed Lexicanum-confirmation that the buried threat is a 7000-year-old Tyranid hive ship, not just "an older enemy")
  - 1 search each: W40K-0012..0018, W40K-0020
- **Per-book bullets:**
  - **W40K-0011 *Penitent* (Abnett, 2021):** Bequin trilogy book 2. POV Beta Bequin, Sancour/Queen Mab, Eisenhorn vs Ravenor cold war + Cognitae + King in Yellow. Solid coverage from training data + 2 WebSearches. Clean tags, no flags.
  - **W40K-0012 *For the Emperor* (Mitchell, 2003):** Ciaphas Cain series-start. Gravalax, Tau-border crisis + hidden genestealer conspiracy. Establishes Cain/Jurgen/Vail/Kasteen/Broklaw cast. Clean.
  - **W40K-0013 *Caves of Ice* (Mitchell, 2004):** Cain book 2. Simia Orichalcae, surface war with Orks + underground Necron tomb. Clean.
  - **W40K-0014 *The Traitor's Hand* (Mitchell, 2005):** Cain book 3. Adumbria, Slaaneshi cult + inter-regimental rivalry with Tomas Beije (Tallarn 229th). Clean.
  - **W40K-0015 *Death or Glory* (Mitchell, 2006):** Cain book 4. Roster typo "Death of Glory" → corrected in-place to "Death or Glory" in `book-roster.json` (title + slug `death-or-glory`) on maintainer instruction; no `data_conflict` flag committed. ⚠ **Excel-SSOT-Quelle** (`Warhammer_Books_SSOT.xlsx`) trägt den Typo weiterhin — Maintainer muss dort dieselbe Korrektur fahren, sonst regeneriert `import-ssot-roster.ts` den Fehler. Chronologically a prequel to *For the Emperor* — Cain's first big exploit on Perlia behind enemy Ork lines vs Warboss Gargash Korbul. Tagged entry_point=standalone because the book itself frames as Vail unearthing a younger memoir; the rest of the series doesn't strictly require it.
  - **W40K-0016 *Duty Calls* (Mitchell, 2007):** Cain book 5. Periremunda — Tyranids + emerging Chaos cult + hidden genestealer hybrids in the planetary administration. Vail returns actively. Opens the loose "Shadowlight" arc that closes in book 6.
  - **W40K-0017 *Cain's Last Stand* (Mitchell, 2008):** Cain book 6. Perlia revisited, 13th-Black-Crusade splinter under Warmaster Varan, Shadowlight artefact in the Valley of Daemons. Despite the title, NOT the series finale (three more books follow) — tagged mid_series. Tonally the darkest of the early Cain memoirs; grimdark kept in tone-tags as an exception.
  - **W40K-0018 *The Emperor's Finest* (Mitchell, 2011):** Cain book 7. Viridia, Reclaimers Space Marine chapter, space hulk with awakening Tyranids + stowaway Orks + Mira Sulla subplot. Reclaimers is a Cain-novel-exclusive homebrew Astartes chapter — no canonical-tab Surface-Form match expected.
  - **W40K-0019 *The Last Ditch* (Mitchell, 2012):** Cain book 8. Nusquam Fundumentibus, Ork campaign + 7000-year-buried Tyranid hive ship reveal. Strategic stakes are higher than the on-world fight — implied galactic-scale rewrite of Tyranid-arrival chronology.
  - **W40K-0020 *The Greater Good* (Mitchell, 2013):** Cain book 9. Quadravidia, Damocles Gulf. Tau invasion → temporary Imperium-Tau alliance vs incoming Tyranid hive fleet. Earth Caste secret experiment subplot. Scope=sector because Damocles is a sector-scale theatre.
- **value_outside_vocabulary** (candidates surfaced by this batch, none promoted):
  - `prequel` — entry_point category has no `prequel` value; W40K-0015 *Death or Glory* is structurally a prequel within Cain's memoir frame. Covered weakly by `standalone`.
  - `unreliable_narrator` / `memoir_frame` — Cain books are framed as Cain's memoir edited and footnoted by Vail. No theme-tag captures this.
  - `dark_comedy` — Cain's tone is satirical + grim-setting, partially covered by `satirical`, but the combination (grim setting / comic narration) is distinctive enough to consider its own tag.
  - `commissar` — protagonist_class has no `commissar`. Cain is technically Officio Prefectus, tagged here as `guardsman` (closest available).
- **Notable surface-form frequencies within this batch:**
  - *Factions:* Imperial Guard ×9, Commissariat ×9, Inquisition ×6, Ordo Xenos ×3, Tyranids ×4, Orks ×4, Chaos ×4, Genestealer Cults ×3, Tau Empire ×2, Adeptus Mechanicus ×2, Necrons ×1, Slaanesh ×1, Cognitae ×1, Black Legion ×1, Space Marines ×1, Reclaimers ×1.
  - *Locations:* Perlia ×2 (W40K-0015 + W40K-0017); each other locale unique to one book.
  - *Characters:* Ciaphas Cain ×9 (POV), Jurgen ×9, Amberley Vail ×9, Regina Kasteen ×5, Ruput Broklaw ×4. Penitent (W40K-0011) inherits Eisenhorn/Ravenor/Cherubael cast carried over from the ssot-w40k-001 Bequin opener.
- **Notes:**
  - Inquisition-consistency constraint (brief 061): held for every Cain book. Vail is on-page or in framing across all nine; Inquisition + Ordo Xenos listed even where she's framing-only, because the books explicitly treat her edits as Inquisitorial supervision of the memoir.
  - "Imperial Guard" used over "Astra Militarum" (publication era 2003-2013, lore-name change to Astra Militarum came post-2014). "Tau Empire" used over "T'au" (post-9th-edition spelling). Both are deliberate publication-era surface-form treue, not retconning.
  - Tone choice: `satirical + action_heavy` is the Cain default in this batch; `grimdark` kept only on *Cain's Last Stand* (the darker entry). Eisenhorn-batch had `grimdark` on everything — that's not a useful default for the Cain books, which are deliberately comic-grim.
  - No Omnibus/Collection in this slice — all ten are novels per SSOT + per all sources.
