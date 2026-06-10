# Resolver-Pass 16 — Phase-0 Dossier (ssot-w40k-058..060 / W40K-0571..W40K-0592)

> Deterministic cross-axis context for the three axis-phases (Factions / Locations / Characters) + the
> Phase-4 integration. **Sections 2–6 are the mechanical output** of
> `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` (read-only, idempotent —
> re-running on the committed override files + seed-data yields byte-identical output). **Section 7 is the
> only LLM-synthesized part** (cross-batch alias-consolidation + needs-decision candidates). This wave is
> the **first W40K resolver pass since the 2026-06-10 weekly-refresh promotion** lifted the W40K corpus
> from 565 → 592 books (Pass 14/15 ran the HH domain). It is a **mixed late-W40K release bloc**: the
> *Adepta-Sororitas / faith-arc novels + anthologies* (058), the *Imperial-Guard / Ork / Chaos
> single-novel bloc + Fehervari Dark-Coil omnibi* (059), and the *Astra-Militarum-omnibus + Emperor's-
> Children domain-end restbatch* (060). The new promotion work is **light on the faction axis** (one
> strict-freq-2 new-row case — `Leagues of Votann` — plus a thin curated freq-1 tail; W40K has no
> Cross-Era rename chains, so the HH-style alias bloc does not recur), **a curated freq-1 location bloc**
> (the Siege-of-Vraks campaign-world cluster + a Votann Hold-ship vessel), and **the richest axis this
> wave — characters**: one strict-freq-2 cross-batch spine (`Darya Nevic`, with a single-identity
> confirmation caveat) plus a strong curated freq-1 lore-iconic title-character bloc (`Morvenn Vahl`,
> `Torquemada Coteaz`, `Arcadian Leontus`, `Grotsnik`, `Aestred Thurga`, `Xantine`). Phases 1–4 read
> THIS file, not the 3 override files or the loop-log. Brief-free pass (Brief 094 lean contract); the
> operative spec is [`scripts/runbooks/resolver-pass-runbook.md`](../../scripts/runbooks/resolver-pass-runbook.md)
> + the per-pass config — no architect brief is read to run a phase.

## 1. Scope header

- **Wave:** `ssot-w40k-058..060` (3 loop batches, **22 books** — `ssot-w40k-058` = 10 books
  (W40K-0571..0580), `ssot-w40k-059` = 10 books (W40K-0581..0590), `ssot-w40k-060` = 2 books
  (W40K-0591..0592, the **new W40K domain-end restbatch**)). These 22 books were promoted in the
  **2026-06-10 weekly-refresh content wave** (30 books total: 27 W40K + 3 HH), the first promotion
  off the weekly content-refresh pipeline. Composition:
  - **ssot-w40k-058 / W40K-0571..0580** = the **Adepta-Sororitas / faith-arc bloc + anthologies**.
    *Aestred Thurga: Pyre of Faith* (Order Pronatus relic-defence; Nurgle cult left unbound —
    `low_confidence:factions`), *Carnage Unending* (Armageddon Ork-war anthology, Yarrick),
    *Paragon of Faith and Other Stories* (Sororitas collection), *Apostle* (Word Bearers / Cerastes
    vs Sororitas on Legitur), *The Dark Coil: Ascension* (Fehervari omnibus — *The Reverie* /
    *Requiem Infernal* + shorts), *Morvenn Vahl: Spear of Faith* (Abbess Sanctorum vs Night Lords on
    Ophelia VII), *Darkness Eternal* (multi-POV Guard/T'au/Kroot anthology, Minka Lesk), *Saints of
    the Imperium* (Sororitas saints omnibus — Celestine / Ephrael Stern / Saint Katherine),
    *Ciaphas Cain: The Anthology* (Cain novella + 13 shorts), *The High Kâhl's Oath* (the **first
    Leagues of Votann novel** — Myrtun Dammergot).
  - **ssot-w40k-059 / W40K-0581..0590** = the **Imperial-Guard / Ork / Chaos single-novel bloc +
    Fehervari Dark-Coil omnibus**. *Daemonhammer* (Inquisitor Coteaz / Ordo Malleus, Formosa Sector),
    *Oaths of Damnation* (Exorcists vs Word Bearers on Fidem IV), *Grotsnik: Da Mad Dok* (Ork comedy
    on Hive Prome — `low_confidence:factions`), *Dominion Genesis* (Adeptus Mechanicus survivors of
    Gryphonne IV vs Hive Fleet Leviathan — `low_confidence:factions`), *Yarrick: Imperial Creed*
    (young Yarrick on Mistral; heretic cult / Cardinal Wangenheim — `low_confidence:factions`),
    *Legends of the Wolf: The Omnibus* (Wraight's Space Wolves trilogy + *Kraken* vs Death Guard),
    *Blood of the Imperium* (anthology — Space Wolves / Astra Militarum / Tyranids / Drukhari),
    *Siege of Vraks* (Death Korps of Krieg vs Vraksian militia + Alpha Legion / World Eaters / Death
    Guard), *The Dark Coil: Damnation* (Fehervari omnibus — *Fire Caste* / *Cult of the Spiral
    Dawn*), *Leontus* (Lord Solar Leontus vs a Speed Waaagh! on Fortuna Minor).
  - **ssot-w40k-060 / W40K-0591..0592** = the **Astra-Militarum omnibus + Emperor's-Children
    restbatch** (the new W40K domain-end restbatch, 2 books). *Soldiers of the Imperium* (Astra
    Militarum omnibus — *Death World* / *Kasrkin* / *Witchbringer* + 4 shorts), *Renegades: Lord of
    Excess* (Emperor's Children — Xantine, the Adored — on Serrine, Chaos-POV — `low_confidence:factions`).
- **IDs:** `W40K-0571..W40K-0592` (22 books).
- **Cumulative:** **592 W40K books** in the W40K authority layer after this pass (565 sealed through
  Pass-13/14-era + 27 added in the 2026-06-10 weekly-refresh, of which 22 are this wave's aggregator
  scope; see the restbatch caveat below). W40K-0592 is the new W40K domain-end restbatch. The HH side
  is sealed at **297 books** (294 through Pass 15 + 3 in the same weekly-refresh extension of
  `ssot-hh-030`) — **out of scope** for this pass. Full roster: 889 books (592 W40K + 297 HH).
- **Restbatch caveat (batch-057 extension rides applyRange, not the aggregate).** The weekly-refresh
  wave also **extended** `ssot-w40k-057` from 5 → 10 books (+W40K-0566..0570: *Hive*, *Da Freebooterz
  Code*, *World Ablaze*, *Legends of the Waaagh!*, *Veterans of the Fall*) because `loop:next` tiles
  positionally and could not surface books that landed *inside* a partial restbatch's slot. Those 5
  books are **outside this pass's surface-form aggregate** (config `aggregator.batches` = 058/059/060
  only) but **inside the Phase-4 `applyRange` `w40k 1..60`** — they re-apply idempotently against the
  current resolver state. Their unresolved surface forms are therefore **not** promoted by Pass 16; a
  future hygiene pass over batch 057 can pick them up if the long-tail is worth it. This is a known
  weekly-refresh-then-resolver artifact, not a data error.
- **Resolver baseline (pre-Pass-16 reference rows + aliases, emitted by the aggregator):** factions
  **202** rows / **94** aliases · locations **289** / **26** · characters **490** / **69**. Because the
  W40K corpus has been resolved up through batch 057 across prior W40K passes, **every freq ≥ 2
  faction in this wave except `Leagues of Votann` catches its existing row or alias direct** (Adepta
  Sororitas → `sisters_of_battle` 9 / Astra Militarum 9 / Orks 6 / Tyranids 4 / Death Guard 3 /
  Genestealer Cults 3 / Space Wolves 3 / T'au Empire → `tau` 3 / Word Bearers 3 / Adeptus Mechanicus
  → `mechanicus` 2 / Chaos Daemons → `daemons` 2 / Deathwatch 2 / Inquisition 2 / Night Lords 2), and
  the high-frequency Sororitas/Guard surface set lands on a thick anchor catalog. The genuinely new
  resolver work is therefore concentrated: **Phase 1** = one strict-freq-2 new faction row
  (`Leagues of Votann`) + a thin curated freq-1 tail (§7c); **Phase 2** = a curated freq-1 location
  bloc (Vraks campaign-world cluster + a Votann Hold-ship vessel; §7c); **Phase 3** = one strict-
  freq-2 cross-batch spine (`Darya Nevic`, identity-confirm caveat §7d) + a curated freq-1 lore-iconic
  title-character bloc (§7c).
- **Apply range Phase 4:** `w40k 1..60` (config `aggregator.applyRange` = `{ domain: "w40k", from: 1,
  to: 60 }`). Idempotent delete-then-insert re-apply of `ssot-w40k-001..057` (already applied at prior
  W40K passes + the weekly-refresh, no churn — the data has not changed) + re-resolve of
  `ssot-w40k-058..060` against the Pass-16-extended resolver state. Domain-aware Trias-Batch-Range
  tuples for the apply-side trio (`apply-override-dry.ts` / `test-resolver-coverage.ts` /
  `test-resolver-data-integrity.ts`) are appended with the **three new `{ domain: "w40k", n: "058" }`
  .. `{ domain: "w40k", n: "060" }` entries** alongside the existing W40K-001..057 + HH-001..030 set
  (runbook §3 Phase 4a + config `phase-4a-integration.trigger`).
- **Verify params (Phase 4b, from config `verify`):** `newRange` W40K-0571..W40K-0592, `oldRange`
  W40K-0001..W40K-0570, `ratingRange` W40K-0571..W40K-0592, `smokeSlugs` =
  `the-high-kahls-oath` (0580, last of 058), `leontus` (0590, last of 059),
  `renegades-lord-of-excess` (0592, last of 060) — one representative (the **last** book) per batch.
- **Clusters:** config has **no `clusters` field** this pass, so §3's cluster column stays `?`. The
  observed bloc framing is the three-batch composition narrated above (Sororitas-faith / Guard-Ork-
  Chaos+Fehervari / Astra-Militarum-omnibus+EC-restbatch); no per-batch cluster tags are emitted.

## 2. Book table (22 entries)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| W40K-0571 | `aestred-thurga-pyre-of-faith` | *Aestred Thurga: Pyre of Faith* | novel | Danie Ware | 2026 | `ssot-w40k-058` | `?` | `low_confidence:factions` |
| W40K-0572 | `carnage-unending` | *Carnage Unending* | anthology | ? | 2026 | `ssot-w40k-058` | `?` | — |
| W40K-0573 | `paragon-of-faith-and-other-stories` | *Paragon of Faith and Other Stories* | anthology | ? | 2026 | `ssot-w40k-058` | `?` | — |
| W40K-0574 | `apostle` | *Apostle* | novel | David Annandale | 2026 | `ssot-w40k-058` | `?` | — |
| W40K-0575 | `the-dark-coil-ascension` | *The Dark Coil: Ascension* | omnibus | Peter Fehervari | 2025 | `ssot-w40k-058` | `?` | — |
| W40K-0576 | `morvenn-vahl-spear-of-faith` | *Morvenn Vahl: Spear of Faith* | novel | Jude Reid | 2025 | `ssot-w40k-058` | `?` | — |
| W40K-0577 | `darkness-eternal` | *Darkness Eternal* | anthology | ? | 2025 | `ssot-w40k-058` | `?` | — |
| W40K-0578 | `saints-of-the-imperium` | *Saints of the Imperium* | collection | David Annandale, Andy Clark, Danie Ware | 2025 | `ssot-w40k-058` | `?` | — |
| W40K-0579 | `ciaphas-cain-the-anthology` | *Ciaphas Cain: The Anthology* | anthology | Sandy Mitchell | 2025 | `ssot-w40k-058` | `?` | — |
| W40K-0580 | `the-high-kahls-oath` | *The High Kâhl’s Oath* | novel | Gav Thorpe | 2025 | `ssot-w40k-058` | `?` | — |
| W40K-0581 | `daemonhammer` | *Daemonhammer* | novel | Darius Hinks | 2025 | `ssot-w40k-059` | `?` | — |
| W40K-0582 | `oaths-of-damnation` | *Oaths of Damnation* | novel | Robbie MacNiven | 2025 | `ssot-w40k-059` | `?` | — |
| W40K-0583 | `grotsnik-da-mad-dok` | *Grotsnik: Da Mad Dok* | novel | Denny Flowers | 2025 | `ssot-w40k-059` | `?` | `low_confidence:factions` |
| W40K-0584 | `dominion-genesis` | *Dominion Genesis* | novel | Jonathan D. Beer | 2025 | `ssot-w40k-059` | `?` | `low_confidence:factions` |
| W40K-0585 | `yarrick-imperial-creed` | *Yarrick: Imperial Creed* | novel | David Annandale | 2025 | `ssot-w40k-059` | `?` | `low_confidence:factions` |
| W40K-0586 | `legends-of-the-wolf-the-omnibus` | *Legends of the Wolf: The Omnibus* | omnibus | Chris Wraight | 2025 | `ssot-w40k-059` | `?` | — |
| W40K-0587 | `blood-of-the-imperium` | *Blood of the Imperium* | anthology | ? | 2025 | `ssot-w40k-059` | `?` | — |
| W40K-0588 | `siege-of-vraks` | *Siege of Vraks* | novel | Steve Lyons | 2025 | `ssot-w40k-059` | `?` | — |
| W40K-0589 | `the-dark-coil-damnation` | *The Dark Coil: Damnation* | omnibus | Peter Fehervari | 2025 | `ssot-w40k-059` | `?` | — |
| W40K-0590 | `leontus` | *Leontus* | novel | Rob Young | 2025 | `ssot-w40k-059` | `?` | — |
| W40K-0591 | `soldiers-of-the-imperium` | *Soldiers of the Imperium* | omnibus | ? | 2025 | `ssot-w40k-060` | `?` | — |
| W40K-0592 | `renegades-lord-of-excess` | *Renegades: Lord of Excess* | novel | Rich McCormick | 2025 | `ssot-w40k-060` | `?` | `low_confidence:factions` |

## 3. Surface-form aggregate (sorted: freq desc, name asc)

### Factions (37 distinct surface forms, 77 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Adepta Sororitas | 9 | W40K-0571, W40K-0573, W40K-0574 | direct | sisters_of_battle | `?` |
| Astra Militarum | 9 | W40K-0572, W40K-0575, W40K-0577 | direct | astra_militarum | `?` |
| Orks | 6 | W40K-0572, W40K-0579, W40K-0583 | direct | orks | `?` |
| Tyranids | 4 | W40K-0577, W40K-0579, W40K-0587 | direct | tyranids | `?` |
| Death Guard | 3 | W40K-0578, W40K-0586, W40K-0588 | direct | death_guard | `?` |
| Genestealer Cults | 3 | W40K-0579, W40K-0589, W40K-0592 | direct | genestealer_cults | `?` |
| Space Wolves | 3 | W40K-0572, W40K-0586, W40K-0587 | direct | space_wolves | `?` |
| T'au Empire | 3 | W40K-0577, W40K-0589, W40K-0591 | direct | tau | `?` |
| Word Bearers | 3 | W40K-0574, W40K-0578, W40K-0582 | direct | word_bearers | `?` |
| Adeptus Mechanicus | 2 | W40K-0575, W40K-0584 | direct | mechanicus | `?` |
| Chaos Daemons | 2 | W40K-0573, W40K-0581 | alias | daemons | `?` |
| Deathwatch | 2 | W40K-0575, W40K-0586 | direct | deathwatch | `?` |
| Inquisition | 2 | W40K-0572, W40K-0585 | direct | inquisition | `?` |
| Leagues of Votann | 2 | W40K-0577, W40K-0580 | unresolved | — | `?` |
| Night Lords | 2 | W40K-0575, W40K-0576 | direct | night_lords | `?` |
| Adeptus Astartes | 1 | W40K-0575 | direct | adeptus_astartes | `?` |
| Adeptus Ministorum | 1 | W40K-0589 | alias | ecclesiarchy | `?` |
| Aeldari Harlequins | 1 | W40K-0578 | unresolved | — | `?` |
| Alpha Legion | 1 | W40K-0588 | direct | alpha_legion | `?` |
| Black Templars | 1 | W40K-0572 | direct | black_templars | `?` |
| Cadian Kasrkin | 1 | W40K-0591 | unresolved | — | `?` |
| Catachan Jungle Fighters | 1 | W40K-0591 | direct | catachan_jungle_fighters | `?` |
| Death Korps of Krieg | 1 | W40K-0588 | direct | death_korps_of_krieg | `?` |
| Drukhari | 1 | W40K-0587 | alias | eldar | `?` |
| Emperor's Children | 1 | W40K-0592 | direct | emperors_children | `?` |
| Exorcists | 1 | W40K-0582 | unresolved | — | `?` |
| Hive Fleet Leviathan | 1 | W40K-0584 | direct | hive_fleet_leviathan | `?` |
| Kindred of the Eternal Starforge | 1 | W40K-0580 | unresolved | — | `?` |
| Kroot | 1 | W40K-0577 | direct | kroot | `?` |
| Necrons | 1 | W40K-0579 | direct | necrons | `?` |
| Order of Our Martyred Lady | 1 | W40K-0578 | direct | order_of_our_martyred_lady | `?` |
| Order Pronatus | 1 | W40K-0571 | unresolved | — | `?` |
| Ordo Malleus | 1 | W40K-0581 | direct | ordo_malleus | `?` |
| T'au | 1 | W40K-0575 | alias | tau | `?` |
| Vostroyan Blackbloods | 1 | W40K-0584 | unresolved | — | `?` |
| Vraksian Renegade Militia | 1 | W40K-0588 | unresolved | — | `?` |
| World Eaters | 1 | W40K-0588 | direct | world_eaters | `?` |

### Locations (32 distinct surface forms, 33 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Phaedra | 2 | W40K-0575, W40K-0589 | direct | phaedra | `?` |
| Armageddon | 1 | W40K-0572 | direct | armageddon | `?` |
| Cadia | 1 | W40K-0577 | direct | cadia | `?` |
| Citadel of Vraks | 1 | W40K-0588 | unresolved | — | `?` |
| Dasht i-Kevar | 1 | W40K-0591 | unresolved | — | `?` |
| Fenris | 1 | W40K-0586 | direct | fenris | `?` |
| Fidem IV | 1 | W40K-0582 | unresolved | — | `?` |
| Formosa Sector | 1 | W40K-0581 | unresolved | — | `?` |
| Fortuna Minor | 1 | W40K-0590 | unresolved | — | `?` |
| Great Grass Plains | 1 | W40K-0577 | unresolved | — | `?` |
| Gryphonne IV | 1 | W40K-0584 | unresolved | — | `?` |
| Hive Prome | 1 | W40K-0583 | unresolved | — | `?` |
| Katerah | 1 | W40K-0571 | unresolved | — | `?` |
| Kindred of the Eternal Starforge Hold ship | 1 | W40K-0580 | unresolved | — | `?` |
| Kiros | 1 | W40K-0578 | unresolved | — | `?` |
| Legitur | 1 | W40K-0574 | unresolved | — | `?` |
| Lentonia | 1 | W40K-0579 | unresolved | — | `?` |
| Malpertuis | 1 | W40K-0575 | unresolved | — | `?` |
| Mistral | 1 | W40K-0585 | direct | mistral | `?` |
| Oblazt | 1 | W40K-0575 | unresolved | — | `?` |
| Ophelia VII | 1 | W40K-0576 | direct | ophelia_vii | `?` |
| Ras Shakeh | 1 | W40K-0586 | unresolved | — | `?` |
| Redemption | 1 | W40K-0589 | unresolved | — | `?` |
| Rogar III | 1 | W40K-0591 | direct | rogar_iii | `?` |
| Sarastus | 1 | W40K-0575 | unresolved | — | `?` |
| Serrine | 1 | W40K-0592 | unresolved | — | `?` |
| Severitas | 1 | W40K-0578 | unresolved | — | `?` |
| Terra | 1 | W40K-0576 | direct | terra | `?` |
| Traitor Rock | 1 | W40K-0577 | unresolved | — | `?` |
| Visage | 1 | W40K-0591 | unresolved | — | `?` |
| Vraks Prime | 1 | W40K-0588 | unresolved | — | `?` |
| Vytarn | 1 | W40K-0575 | unresolved | — | `?` |

### Characters (60 distinct surface forms, 62 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Darya Nevic | 2 | W40K-0587, W40K-0590 | unresolved | — | `?` |
| Lucille von Shard | 2 | W40K-0577, W40K-0587 | direct | lucille_von_shard | `?` |
| Aestred Thurga | 1 | W40K-0571 | unresolved | — | `?` |
| Amberley Vail | 1 | W40K-0579 | direct | amberley_vail | `?` |
| Arcadian Leontus | 1 | W40K-0590 | unresolved | — | `?` |
| Ariken | 1 | W40K-0589 | unresolved | — | `?` |
| Arkos the Faithless | 1 | W40K-0588 | unresolved | — | `?` |
| Asenath Hyades | 1 | W40K-0575 | direct | asenath_hyades | `?` |
| Baldr | 1 | W40K-0586 | unresolved | — | `?` |
| Beastboss Bakmun | 1 | W40K-0583 | unresolved | — | `?` |
| Captain Obeysekera | 1 | W40K-0591 | unresolved | — | `?` |
| Cardinal Wangenheim | 1 | W40K-0585 | unresolved | — | `?` |
| Cardinal-Astra Xaphan | 1 | W40K-0588 | unresolved | — | `?` |
| Castellan Emeric | 1 | W40K-0572 | unresolved | — | `?` |
| Cerastes | 1 | W40K-0574 | unresolved | — | `?` |
| Ciaphas Cain | 1 | W40K-0579 | direct | ciaphas_cain | `?` |
| Commissar Roshant | 1 | W40K-0591 | unresolved | — | `?` |
| Commissar Yarrick | 1 | W40K-0572 | alias | sebastian_yarrick | `?` |
| Confessor Tenaxus | 1 | W40K-0588 | unresolved | — | `?` |
| Cross | 1 | W40K-0589 | unresolved | — | `?` |
| Daggan Zaidu | 1 | W40K-0582 | unresolved | — | `?` |
| Elias | 1 | W40K-0581 | unresolved | — | `?` |
| Ensor Cutler | 1 | W40K-0589 | unresolved | — | `?` |
| Ephrael Stern | 1 | W40K-0578 | direct | ephrael_stern | `?` |
| Fjolnir | 1 | W40K-0587 | unresolved | — | `?` |
| Glavia Aerand | 1 | W40K-0591 | unresolved | — | `?` |
| Grotsnik | 1 | W40K-0583 | unresolved | — | `?` |
| Gunnlaugur | 1 | W40K-0586 | direct | gunnlaugur | `?` |
| Holt Iverson | 1 | W40K-0589 | unresolved | — | `?` |
| Ikor | 1 | W40K-0583 | unresolved | — | `?` |
| Ingvar | 1 | W40K-0586 | direct | ingvar | `?` |
| Jurgen | 1 | W40K-0579 | direct | jurgen | `?` |
| Kol Rakhul | 1 | W40K-0576 | unresolved | — | `?` |
| Kyganil | 1 | W40K-0578 | direct | kyganil | `?` |
| Lord Commissar Rasp | 1 | W40K-0585 | direct | lord_commissar_rasp | `?` |
| Lorenzo | 1 | W40K-0591 | unresolved | — | `?` |
| Minka Lesk | 1 | W40K-0577 | direct | minka_lesk | `?` |
| Morvenn Vahl | 1 | W40K-0576 | unresolved | — | `?` |
| Myrtun Dammergot | 1 | W40K-0580 | unresolved | — | `?` |
| Olgeir | 1 | W40K-0586 | unresolved | — | `?` |
| Palatine Aesura | 1 | W40K-0574 | unresolved | — | `?` |
| S'janth | 1 | W40K-0592 | unresolved | — | `?` |
| Saint Celestine | 1 | W40K-0578 | direct | saint_celestine | `?` |
| Sebastian Yarrick | 1 | W40K-0585 | direct | sebastian_yarrick | `?` |
| Sergeant Greiss | 1 | W40K-0591 | direct | sergeant_greiss | `?` |
| Sister Aenor | 1 | W40K-0573 | unresolved | — | `?` |
| Sister Avra | 1 | W40K-0578 | unresolved | — | `?` |
| Sister Hospitaller Docia | 1 | W40K-0573 | unresolved | — | `?` |
| Skjoldis | 1 | W40K-0589 | unresolved | — | `?` |
| Takka | 1 | W40K-0577 | unresolved | — | `?` |
| Talin Sherax | 1 | W40K-0584 | unresolved | — | `?` |
| The Red Marshal | 1 | W40K-0582 | unresolved | — | `?` |
| Torquemada Coteaz | 1 | W40K-0581 | unresolved | — | `?` |
| Torrin Vey | 1 | W40K-0582 | unresolved | — | `?` |
| Tyborc | 1 | W40K-0588 | unresolved | — | `?` |
| Valtun the Patient | 1 | W40K-0583 | unresolved | — | `?` |
| Voltas | 1 | W40K-0581 | unresolved | — | `?` |
| Wulf Khan | 1 | W40K-0577 | unresolved | — | `?` |
| Xantine | 1 | W40K-0592 | unresolved | — | `?` |
| Yvraine | 1 | W40K-0578 | direct | yvraine | `?` |

## 4. Cross-axis surface-form conflicts

| surface form | axes |
| --- | --- |
| (none) | — |

## 5. Omnibus / anthology scan

| externalBookId | title | format | roster collection? | known constituents |
| --- | --- | --- | --- | --- |
| W40K-0572 | *Carnage Unending* | anthology | no | — |
| W40K-0573 | *Paragon of Faith and Other Stories* | anthology | no | — |
| W40K-0575 | *The Dark Coil: Ascension* | omnibus | no | — |
| W40K-0577 | *Darkness Eternal* | anthology | no | — |
| W40K-0579 | *Ciaphas Cain: The Anthology* | anthology | no | — |
| W40K-0586 | *Legends of the Wolf: The Omnibus* | omnibus | no | — |
| W40K-0587 | *Blood of the Imperium* | anthology | no | — |
| W40K-0589 | *The Dark Coil: Damnation* | omnibus | no | — |
| W40K-0591 | *Soldiers of the Imperium* | omnibus | no | — |

## 6. data_conflict flag scan

| externalBookId | title | flags |
| --- | --- | --- |
| W40K-0571 | *Aestred Thurga: Pyre of Faith* | `low_confidence:factions` |
| W40K-0583 | *Grotsnik: Da Mad Dok* | `low_confidence:factions` |
| W40K-0584 | *Dominion Genesis* | `low_confidence:factions` |
| W40K-0585 | *Yarrick: Imperial Creed* | `low_confidence:factions` |
| W40K-0592 | *Renegades: Lord of Excess* | `low_confidence:factions` |

## 7. Cross-batch alias-consolidation + needs-decision candidates

> The only LLM-synthesized section. It flags (7a) cross-form alias-consolidation cases the owning phase
> must collapse onto an existing canonical row (runbook §4); (7b) within-batch / cross-batch character
> spines; (7c) the freq-driven promotion shape per axis; and (7d) genuine needs-decision / judgment
> candidates. **This W40K wave has no Cross-Era rename structure** (Luna-Wolves→Sons-of-Horus,
> Kharn↔Kharn-the-Betrayer etc. are HH-domain phenomena), so the HH-style faction alias bloc does
> **not** recur — §7a is correspondingly thin on the faction axis. Everything below is grounded in
> §2–§6 + the existing W40K row/alias anchors confirmed in the §1 baseline. The §4 cross-axis conflict
> scan is **empty** (no same-name-on-two-axes collision), and the §5 omnibus scan carries **no
> roster-collection edges** this wave, so the Brief-091 forward-ref Guard is **not active** — the
> audit-cockpit Guard expects clean output (0 out-of-range refs, 0 unknown-work refs). **No Phase-0-
> forced `## Needs decision` stop**: there is no identity-disambig collision; §7d items are owner-phase
> judgment calls, not architectural blocks.

### 7a. Cross-batch alias-consolidation cases (→ existing row + alias)

> Format: surface-forms · book-IDs · same entity? · recommendation. These are the cases where a naïve
> implementer would create a fresh row instead of aliasing onto an existing anchor. Per runbook §4:
> **one canonical identity = one canonical row; variant surface forms live in `*-aliases.json`**.

**Factions (Phase 1):**

- *(No cross-batch alias-consolidation cases this wave.)* W40K has no Cross-Era rename chain, and
  every existing-entity faction this wave catches its row/alias **direct or via an already-landed
  alias** — confirmations only: `Chaos Daemons → daemons` (freq 2, alias), `T'au Empire → tau` /
  `T'au → tau` (freq 3 + 1, the spaced/short variants both already resolve), `Adeptus Mechanicus →
  mechanicus` (freq 2, alias), `Adeptus Ministorum → ecclesiarchy` (freq 1, alias), `Drukhari →
  eldar` (freq 1, the existing **coarse** Aeldari mapping — see §7d note). No alias-file edit needed
  for any of these. The faction-axis *new-row* work is `Leagues of Votann` (§7c) — a promotion, not an
  alias-consolidation.

**Locations (Phase 2):**

- *(No clean cross-batch alias-consolidation cases this wave.)* `Phaedra` (freq 2) already resolves
  direct. The Vraks cluster (`Vraks Prime` + `Citadel of Vraks`, both W40K-0588) is a **within-book**
  consolidation judgment (§7c / §7d), not a collapse onto an existing row. All other resolved location
  surfaces catch on existing rows direct (Armageddon / Cadia / Fenris / Mistral / Ophelia VII /
  Rogar III / Terra / Phaedra).

**Characters (Phase 3) — one clean cross-batch identity (already consolidated) + discretionary short-form aliases:**

- **Case A — `Commissar Yarrick` / `Sebastian Yarrick` → `sebastian_yarrick` (already landed,
  cross-batch confirmation).** `Commissar Yarrick` (freq 1, W40K-0572 *Carnage Unending*, batch 058,
  resolves **alias** → `sebastian_yarrick`) and `Sebastian Yarrick` (freq 1, W40K-0585 *Yarrick:
  Imperial Creed*, batch 059, resolves **direct** → `sebastian_yarrick`) are the **same person across
  two batches under two surface forms** — the canonical row plus the `Commissar Yarrick` alias were
  both landed by a prior W40K pass. **No edit needed**; cited as a Phase-3 **alias-consolidation test
  case** (assert both surface forms resolve to the single `sebastian_yarrick` row). This is the one
  genuinely cross-batch identity-merge this wave already covers.
- **Discretionary short-form / honor-title aliases (Phase 3 may add alongside the §7c new rows).**
  Several of this wave's curated freq-1 title-character promotions carry a likely future bare/short
  surface form that a later wave will surface; per runbook §4 (Character-Honor-Title-Split convention)
  Phase 3 *may* pre-add the alias when the new row is created, so the short form resolves on first
  re-appearance — e.g. `Leontus → arcadian_leontus` (the book/short surface vs the full name
  `Arcadian Leontus`), `Coteaz → torquemada_coteaz`, `Vahl → morvenn_vahl`. **None of these short
  forms appears in this wave's aggregate** (only the full names do), so each is *optional /
  discretionary* — add only if Phase 3 judges the short form lore-unambiguous. This is the natural
  second alias-consolidation test case (one new alias) to satisfy the runbook's ≥2-alias-test-case
  floor alongside Case A.

### 7b. Within-batch / cross-batch character spines

- **`Darya Nevic` — strict-freq-2 cross-batch spine (W40K-0587 + W40K-0590).** The only freq-≥2
  *unresolved* character this wave. Appears in *Blood of the Imperium* (anthology, batch 059) and
  *Leontus* (Rob Young, batch 059) — both Astra-Militarum-adjacent contexts. Strong **new-row**
  candidate by the runbook §4 freq-≥2-strict threshold, **with one caveat** (§7d): the two hits span
  an *anthology* and a *novel*, so Phase 3 should confirm single-identity from the source context
  before collapsing to one row (anthology + novel cross-context carries mild same-name-different-
  character risk). If confirmed → one `darya_nevic` row; if uncertain → `## Needs decision`, not a
  guess.
- *(No other cross-batch spines.)* `Lucille von Shard` (freq 2, W40K-0577 + W40K-0587) already
  resolves **direct** — a confirmation that a recurring Inquisitorial-cast character landed in a prior
  pass. All remaining unresolved characters are **freq-1**, so §7c (curated promotions) governs them.

### 7c. Freq-driven promotion shape per axis

**Faction axis (Phase 1) — one strict-freq-2 new row + a thin curated freq-1 tail.**

- **`Leagues of Votann` → new row `leagues_of_votann` (strict freq-2).** W40K-0577 *Darkness Eternal*
  + W40K-0580 *The High Kâhl's Oath* (the **first Leagues of Votann novel**, Myrtun Dammergot). The
  9th/10th-edition Squat-descended faction — a clean, lore-unambiguous new canonical faction row. The
  **dominant faction-axis promotion of the wave**.
- **Curated freq-1 candidates (Phase-1 judgment, promote the lore-iconic, leave the rest unresolved):**
  - `Order Pronatus` (W40K-0571) — a specific non-militant Adepta Sororitas Order. The schema already
    carries per-order rows (`order_of_our_martyred_lady` resolves direct this wave), so a dedicated
    `order_pronatus` row is consistent; alternatively alias → `sisters_of_battle`. Phase 1 decides
    row-vs-alias granularity.
  - `Exorcists` (W40K-0582) — a secretive Codex-divergent Space Marine Chapter. New chapter row or
    leave unresolved (freq-1, lore-borderline).
  - `Aeldari Harlequins` (W40K-0578) — Phase 1 decides: mirror the existing **coarse** `→ eldar`
    Aeldari mapping (consistent with `Drukhari → eldar`), add a dedicated `harlequins` row, or leave
    unresolved. See §7d.
  - `Kindred of the Eternal Starforge` (W40K-0580) — a specific Votann Kindred/League; alias →
    `leagues_of_votann` (once that row exists) or a sub-faction row. Phase 1 judgment (depends on the
    `leagues_of_votann` row landing first).
  - `Cadian Kasrkin` (W40K-0591) / `Vostroyan Blackbloods` (W40K-0584) — Astra Militarum elite/regiment
    surfaces; alias → `astra_militarum` or leave unresolved (freq-1 regiment granularity).
  - `Vraksian Renegade Militia` (W40K-0588) — generic renegade-militia surface from *Siege of Vraks*;
    likely leave unresolved (no lore-unambiguous canonical target) unless Phase 1 adds a campaign row.

**Location axis (Phase 2) — a curated freq-1 bloc (Vraks cluster + a Votann Hold-ship vessel), almost all else freq-1 long-tail.**

- **Vraks campaign-world cluster (W40K-0588 *Siege of Vraks*):** `Vraks Prime` + `Citadel of Vraks` —
  the iconic *Siege of Vraks* world (a lore-major Imperial-Armour campaign locale). Strong curated
  promotion: one `vraks` (or `vraks_prime`) row with `Citadel of Vraks` as an alias/sub-location, or
  two rows. Phase 2 decides grain (see §7d).
- **Vessel-grain:** `Kindred of the Eternal Starforge Hold ship` (W40K-0580) — a Votann Hold vessel.
  If promoted, model per the runbook §3 Phase-2 vessel convention: `tags:['vessel']`, `gx/gy:null`
  (a ship is not pinned to the galaxy map).
- **Other curated freq-1 candidates (promote the lore-notable):** `Gryphonne IV` (W40K-0584 — the
  Forge World consumed by Hive Fleet Leviathan), `Ras Shakeh` (W40K-0586 — Wraight Space Wolves world),
  `Formosa Sector` (W40K-0581), `Fortuna Minor` (W40K-0590). The remaining freq-1 surfaces (Dasht
  i-Kevar, Fidem IV, Great Grass Plains, Hive Prome, Katerah, Kiros, Legitur, Lentonia, Malpertuis,
  Oblazt, Redemption, Sarastus, Serrine, Severitas, Traitor Rock, Visage, Vytarn) are a thin long-tail
  — leave unresolved unless a specific one is judged lore-iconic.
- **Confirmations (direct):** Armageddon, Cadia, Fenris, Mistral, Ophelia VII, Phaedra (freq 2),
  Rogar III, Terra.

**Character axis (Phase 3) — the richest axis: one strict-freq-2 spine (§7b) + a strong curated freq-1 lore-iconic title-character bloc.**

- **Curated freq-1 lore-iconic title/major-character promotions (new rows):**
  - `Morvenn Vahl` (W40K-0576 *Morvenn Vahl: Spear of Faith*) — the **Abbess Sanctorum**, supreme
    commander of the Adepta Sororitas (a current major named GW character). Title-character. Strong
    promote.
  - `Torquemada Coteaz` (W40K-0581 *Daemonhammer*) — Inquisitor Coteaz of the Ordo Malleus, a long-
    iconic named Inquisitor. Strong promote.
  - `Arcadian Leontus` (W40K-0590 *Leontus*) — Lord Solar Leontus, the named 10th-edition Astra
    Militarum supreme commander. Title-character. Strong promote. (Note the discretionary `Leontus →
    arcadian_leontus` short-form alias, §7a.)
  - `Grotsnik` (W40K-0583 *Grotsnik: Da Mad Dok*) — Mad Dok / Painboss Grotsnik, an iconic named Ork.
    Title-character. Strong promote.
  - `Aestred Thurga` (W40K-0571 *Aestred Thurga: Pyre of Faith*) — Order Pronatus relic-bearer,
    title-character. Promote.
  - `Xantine` (W40K-0592 *Renegades: Lord of Excess*) — "Xantine, the Adored", the Emperor's Children
    title-antagonist. Promote.
- **`primaryFactionId` FK note (runbook §5):** these new rows reference factions from the Phase-1 set
  — `morvenn_vahl` / `aestred_thurga` → `sisters_of_battle` (+ `order_pronatus` if that row lands);
  `arcadian_leontus` → `astra_militarum`; `grotsnik` → `orks`; `torquemada_coteaz` → `ordo_malleus` /
  `inquisition`; `xantine` → `emperors_children`; a confirmed `darya_nevic` → `astra_militarum`. All
  targets either already exist or land in Phase 1 (which runs strictly before Phase 3) — **clean FK,
  no forward-ref trap**.
- **Supporting-cast freq-1 long-tail (Phase-3 judgment, mostly leave unresolved):** Beastboss Bakmun,
  Captain Obeysekera, Cardinal Wangenheim, Cardinal-Astra Xaphan, Castellan Emeric, Cerastes (Word
  Bearers, *Apostle*), Commissar Roshant, Confessor Tenaxus, Daggan Zaidu, Myrtun Dammergot (the
  Votann High Kâhl — could pair with the `leagues_of_votann` promotion), The Red Marshal, Valtun the
  Patient, Wulf Khan, et al. Promote only those judged lore-iconic with a clean primary-faction FK.
- **Confirmations (direct):** Amberley Vail, Asenath Hyades, Ciaphas Cain, Ephrael Stern, Gunnlaugur,
  Ingvar, Jurgen, Kyganil, Lord Commissar Rasp, Lucille von Shard (freq 2), Minka Lesk, Saint
  Celestine, Sebastian Yarrick, Sergeant Greiss, Yvraine — all landed by prior W40K passes.

### 7d. Needs-decision / judgment candidates (no Phase-0-forced stop)

> None of these is a same-name-different-identity collision (§4 is empty), so Phase 0 forces **no**
> `## Needs decision` stop. Each is a judgment call for the owning phase; only escalate to a
> `## Needs decision` block if the owning phase cannot resolve it from source context.

1. **`Darya Nevic` single-identity confirmation (Phase 3).** Freq-2 across an anthology (W40K-0587)
   and a novel (W40K-0590). Promote as one `darya_nevic` row **only if** the source context confirms
   the same character; if uncertain, `## Needs decision` rather than guess (runbook §4 identity-
   uncertainty rule).
2. **`Leagues of Votann` sub-faction granularity (Phase 1).** Decide whether `Kindred of the Eternal
   Starforge` (and the `Kindred ... Hold ship` vessel on the location axis) attach as a sub-row /
   alias to `leagues_of_votann` or stay unresolved. Depends on the `leagues_of_votann` row landing
   first (it does, within Phase 1).
3. **Aeldari sub-faction coarseness (Phase 1).** The resolver already maps `Drukhari → eldar`
   (coarse). `Aeldari Harlequins` (unresolved) puts the same question on Phase 1: mirror the coarse
   `→ eldar` mapping, add a dedicated `harlequins` row, or leave unresolved. Consistency with the
   existing coarse Aeldari mapping argues for `→ eldar` or a Harlequins row; Phase 1 picks.
4. **Vraks location grain (Phase 2).** `Vraks Prime` + `Citadel of Vraks` (both W40K-0588): one
   `vraks` row + alias/sub-location vs two rows. Judgment, not a stop.
5. **`low_confidence:factions` advisory carry-through (Phase 4a).** Five books (W40K-0571 / -0583 /
   -0584 / -0585 / -0592) carry `low_confidence:factions` — the unbound-Chaos-antagonist curation
   pattern (a heretic cult / unnamed Chaos foe left unbound because no Legion was confirmed). These are
   **advisory only**; Phase 4a carries them through, no resolver action.
6. **Omnibus/anthology collection-gap (Phase 4a, informational).** The §5 scan shows **9** omnibus/
   anthology books with **no roster-collection edges**, several of which have real lore constituents
   (the two Dark-Coil omnibi, *Legends of the Wolf*, *Soldiers of the Imperium*, *Ciaphas Cain: The
   Anthology*, *Saints of the Imperium*). The Brief-091 forward-ref Guard is therefore inactive (no
   edges to validate), but this is a `collection-gaps.json` data-completeness note for a future
   pass — **not** a Pass-16 resolver concern.
