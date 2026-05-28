# Resolver-Pass 10 — Phase-0 Dossier (ssot-hh-001..002 / HH-0001..0020)

> Deterministic cross-axis context for the three axis-phases (Factions / Locations / Characters) + the
> Phase-4 integration. **Sections 2–6 are the mechanical output** of
> `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` (read-only, idempotent —
> re-running on the committed override files + seed-data yields byte-identical output). **Section 7 is the
> only LLM-synthesized part** (cross-batch alias-consolidation + needs-decision candidates, with heavy
> weight on Cross-Era identity calls because this is the first Horus-Heresy wave). Phases 1–4 read THIS
> file, not the 2 override files or the loop-log. Brief-free pass (Brief 094 lean contract); the operative
> spec is [`sessions/resolver-pass-runbook.md`](../resolver-pass-runbook.md) + the per-pass config — no
> architect brief is read to run a phase.

## 1. Scope header

- **Wave:** `ssot-hh-001..002` (2 loop batches, 10 + 10 = 20 books — the **HH-domain bootstrap wave**, opening the Horus Heresy authority layer after the W40K corpus completed at Pass 9 / W40K-0565).
- **IDs:** `HH-0001..HH-0020` (20 books — the canonical first stretch of Black Library's Horus Heresy series, Abnett's *Horus Rising* through Abnett's *Know No Fear* + the *The Primarchs* anthology, 2006–2012).
- **Cumulative:** 20 HH books in the HH authority layer (0 applied through Pass 9; this is the first HH apply). W40K side is sealed at 565/565 books — out of scope for this pass.
- **Resolver baseline (pre-Pass-10 reference rows + aliases):** factions **173** rows / **59** aliases · locations **224** / **16** · characters **344** / **43**. (Emitted deterministically by the aggregator; supersedes any other count.) Note that the baseline already carries every W40K Cross-Era anchor row — `sons_of_horus` / `mechanicus` / `astra_militarum` / `custodes` / `magnus_the_red` / `kharn_the_betrayer` / `lucius_the_eternal` / `abaddon_the_despoiler` / `ferrus_manus` / `mortarion` / `roboute_guilliman` / `kor_phaeron` / `astelan` / `ahzek_ahriman` etc. all exist — so the HH-side aliasing work in §7 lands on already-stable targets, no FK risk from W40K-side row gaps.
- **Apply range Phase 4:** `hh 1..2` (config `aggregator.applyRange` = `{ domain: "hh", from: 1, to: 2 }`). First-time apply only; **no idempotent re-apply** of earlier HH batches because there are none. Domain-aware Trias-Batch-Range tuples are appended to the apply-side trio (`apply-override-dry.ts` / `test-resolver-coverage.ts` / `test-resolver-data-integrity.ts`) as the two new `{ domain: "hh", n: "001" }` / `{ domain: "hh", n: "002" }` entries — first HH entries ever, alongside the existing W40K entries (runbook §3 Phase 4a + config `phase-4a-integration.trigger`).
- **Clusters (observed; config has no `clusters` field this pass, so §3's cluster column stays `?`):**
  - `ssot-hh-001` → **HH novels 1–10**: the original Black Library opening arc. Abnett *Horus Rising* (HH-0001, Sons of Horus / Luna Wolves POV, Loken/Torgaddon/Abaddon dramatis personae); McNeill *False Gods* (HH-0002, Davin / Horus's corruption); Counter *Galaxy in Flames* (HH-0003, Isstvan III virus-bombing); Swallow *The Flight of the Eisenstein* (HH-0004, Garro / Death-Guard loyalists escape); McNeill *Fulgrim* (HH-0005, Emperor's Children / Laeran campaign); Scanlon *Descent of Angels* (HH-0006, Caliban / pre-Imperial Dark Angels); Abnett *Legion* (HH-0007, Alpha Legion / Cabal); Counter *Battle for the Abyss* (HH-0008, Calth pre-Heresy / Ultramarines-vs-Word-Bearers fleet action); McNeill *Mechanicum* (HH-0009, Martian Schism / Knights of Taranis / Legio Mortis); anthology *Tales of Heresy* (HH-0010, 7-story collection — known roster constituents HH-0150..HH-0156, all forward-refs outside this wave's apply range).
  - `ssot-hh-002` → **HH novels 11–20**: Lee *Fallen Angels* (HH-0011, Caliban / Luther arc); McNeill *A Thousand Sons* (HH-0012, Magnus's downfall, Aghoru / Nikaea / Prospero / Tizca); Swallow *Nemesis* (HH-0013, Officio Assassinorum vs. Horus, Dagonet / Iesta Veracrux); Dembski-Bowden *The First Heretic* (HH-0014, Word Bearers / Colchis / Monarchia burning); Abnett *Prospero Burns* (HH-0015, Space Wolves POV of the Burning of Prospero, Fenris / Kasper Hawser); anthology *Age of Darkness* (HH-0016, 9-story collection — known roster constituents HH-0157..HH-0165, all forward-refs outside this wave's apply range); McNeill *The Outcast Dead* (HH-0017, psyker prison-break on Terra, Hollow Mountain / Imperial Palace); Thorpe *Deliverance Lost* (HH-0018, Raven Guard / Corax / Branne); Abnett *Know No Fear* (HH-0019, Calth massacre / Word Bearers betrayal of Ultramarines); anthology *The Primarchs* (HH-0020, 4-story collection — known roster constituents HH-0117..HH-0120, again forward-refs outside this wave's apply range).
- **Headline shape (from §3):** 33 distinct faction surface forms / 79 occ · 37 location / 56 occ · 73 character / 107 occ. Cross-axis conflicts (§4) = **0** (clean wave on that front). 3 anthology rows (§5, all three with known constituents in book-roster — but every constituent is **outside the cumulative apply range hh 1..2**, so they're forward-refs; range-aware forward-ref Guard per Brief 091 must allow this, see 7d). **Zero** `data_conflict` / `low_confidence` flag rows (§6 is empty) — clean override authoring, no advisory carry-through this wave.
- **Generated by** `scripts/aggregate-surface-forms.ts --config scripts/resolver-pass.config.json` from the 2 override files (ssot-hh-001, ssot-hh-002, 20 books) + `book-roster.json` + the current `factions.json` / `locations.json` / `characters.json` + their alias tables.

## 2. Book table (20 entries)

| externalBookId | slug | title | format | author | year | batch | cluster | flags |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HH-0001 | `horus-rising` | *Horus Rising* | novel | Dan Abnett | 2006 | `ssot-hh-001` | `?` | — |
| HH-0002 | `false-gods` | *False Gods* | novel | Graham McNeill | 2006 | `ssot-hh-001` | `?` | — |
| HH-0003 | `galaxy-in-flames` | *Galaxy in Flames* | novel | Ben Counter | 2006 | `ssot-hh-001` | `?` | — |
| HH-0004 | `the-flight-of-the-eisenstein` | *The Flight of the Eisenstein* | novel | James Swallow | 2007 | `ssot-hh-001` | `?` | — |
| HH-0005 | `fulgrim` | *Fulgrim* | novel | Graham McNeill | 2007 | `ssot-hh-001` | `?` | — |
| HH-0006 | `descent-of-angels` | *Descent of Angels* | novel | Mitchel Scanlon | 2007 | `ssot-hh-001` | `?` | — |
| HH-0007 | `legion` | *Legion* | novel | Dan Abnett | 2008 | `ssot-hh-001` | `?` | — |
| HH-0008 | `battle-for-the-abyss` | *Battle for the Abyss* | novel | Ben Counter | 2008 | `ssot-hh-001` | `?` | — |
| HH-0009 | `mechanicum` | *Mechanicum* | novel | Graham McNeill | 2008 | `ssot-hh-001` | `?` | — |
| HH-0010 | `tales-of-heresy` | *Tales of Heresy* | anthology | ? | 2009 | `ssot-hh-001` | `?` | — |
| HH-0011 | `fallen-angels` | *Fallen Angels* | novel | Mike Lee | 2009 | `ssot-hh-002` | `?` | — |
| HH-0012 | `a-thousand-sons` | *A Thousand Sons* | novel | Graham McNeill | 2010 | `ssot-hh-002` | `?` | — |
| HH-0013 | `nemesis` | *Nemesis* | novel | James Swallow | 2010 | `ssot-hh-002` | `?` | — |
| HH-0014 | `the-first-heretic` | *The First Heretic* | novel | Aaron Dembski-Bowden | 2010 | `ssot-hh-002` | `?` | — |
| HH-0015 | `prospero-burns` | *Prospero Burns* | novel | Dan Abnett | 2010 | `ssot-hh-002` | `?` | — |
| HH-0016 | `age-of-darkness` | *Age of Darkness* | anthology | ? | 2011 | `ssot-hh-002` | `?` | — |
| HH-0017 | `the-outcast-dead` | *The Outcast Dead* | novel | Graham McNeill | 2011 | `ssot-hh-002` | `?` | — |
| HH-0018 | `deliverance-lost` | *Deliverance Lost* | novel | Gav Thorpe | 2011 | `ssot-hh-002` | `?` | — |
| HH-0019 | `know-no-fear` | *Know No Fear* | novel | Dan Abnett | 2012 | `ssot-hh-002` | `?` | — |
| HH-0020 | `the-primarchs` | *The Primarchs* | anthology | ? | 2012 | `ssot-hh-002` | `?` | — |

## 3. Surface-form aggregate (sorted: freq desc, name asc)

### Factions (33 distinct surface forms, 79 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Word Bearers | 7 | HH-0002, HH-0003, HH-0008 | direct | word_bearers | `?` |
| Dark Angels | 5 | HH-0006, HH-0010, HH-0011 | direct | dark_angels | `?` |
| Thousand Sons | 5 | HH-0008, HH-0012, HH-0015 | direct | thousand_sons | `?` |
| World Eaters | 5 | HH-0003, HH-0008, HH-0010 | direct | world_eaters | `?` |
| Custodes | 4 | HH-0012, HH-0014, HH-0017 | unresolved | — | `?` |
| Emperor's Children | 4 | HH-0003, HH-0005, HH-0017 | direct | emperors_children | `?` |
| Mechanicum | 4 | HH-0001, HH-0009, HH-0018 | unresolved | — | `?` |
| Sons of Horus | 4 | HH-0003, HH-0004, HH-0016 | direct | sons_of_horus | `?` |
| Space Wolves | 4 | HH-0008, HH-0010, HH-0012 | direct | space_wolves | `?` |
| Ultramarines | 4 | HH-0008, HH-0014, HH-0016 | direct | ultramarines | `?` |
| Alpha Legion | 3 | HH-0007, HH-0018, HH-0020 | direct | alpha_legion | `?` |
| Death Guard | 3 | HH-0003, HH-0004, HH-0017 | direct | death_guard | `?` |
| Iron Hands | 3 | HH-0005, HH-0016, HH-0020 | direct | iron_hands | `?` |
| Adeptus Custodes | 2 | HH-0004, HH-0010 | direct | custodes | `?` |
| Imperial Army | 2 | HH-0001, HH-0007 | unresolved | — | `?` |
| Luna Wolves | 2 | HH-0001, HH-0002 | unresolved | — | `?` |
| Raven Guard | 2 | HH-0016, HH-0018 | direct | raven_guard | `?` |
| Adeptus Arbites | 1 | HH-0013 | direct | adeptus_arbites | `?` |
| Adeptus Astra Telepathica | 1 | HH-0017 | direct | adeptus_astra_telepathica | `?` |
| Cabal | 1 | HH-0007 | unresolved | — | `?` |
| Dark Eldar | 1 | HH-0010 | alias | eldar | `?` |
| Eldar | 1 | HH-0020 | alias | eldar | `?` |
| Interex | 1 | HH-0001 | unresolved | — | `?` |
| Iron Warriors | 1 | HH-0016 | direct | iron_warriors | `?` |
| Knights of Taranis | 1 | HH-0009 | unresolved | — | `?` |
| Laer | 1 | HH-0005 | unresolved | — | `?` |
| Legio Mortis | 1 | HH-0009 | unresolved | — | `?` |
| Legio Tempestus | 1 | HH-0009 | direct | legio_tempestus | `?` |
| Night Lords | 1 | HH-0016 | direct | night_lords | `?` |
| Officio Assassinorum | 1 | HH-0013 | direct | officio_assassinorum | `?` |
| Salamanders | 1 | HH-0016 | direct | salamanders | `?` |
| Sisters of Silence | 1 | HH-0010 | alias | talons_of_the_emperor | `?` |
| The Order | 1 | HH-0006 | unresolved | — | `?` |

### Locations (37 distinct surface forms, 56 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Terra | 8 | HH-0004, HH-0010, HH-0012 | direct | terra | `?` |
| Isstvan V | 4 | HH-0005, HH-0014, HH-0016 | alias | istvaan_v | `?` |
| Caliban | 3 | HH-0006, HH-0010, HH-0011 | direct | caliban | `?` |
| Prospero | 3 | HH-0012, HH-0015, HH-0016 | direct | prospero | `?` |
| Ultramar | 3 | HH-0008, HH-0016, HH-0019 | direct | ultramar | `?` |
| Calth | 2 | HH-0017, HH-0019 | direct | calth | `?` |
| Eye of Terror | 2 | HH-0014, HH-0020 | direct | eye_of_terror | `?` |
| Isstvan III | 2 | HH-0003, HH-0004 | unresolved | — | `?` |
| Aghoru | 1 | HH-0012 | unresolved | — | `?` |
| Cadia | 1 | HH-0014 | direct | cadia | `?` |
| Colchis | 1 | HH-0014 | unresolved | — | `?` |
| Dagonet | 1 | HH-0013 | unresolved | — | `?` |
| Davin | 1 | HH-0002 | direct | davin | `?` |
| Deliverance | 1 | HH-0018 | unresolved | — | `?` |
| Diamat | 1 | HH-0011 | unresolved | — | `?` |
| Eolith | 1 | HH-0007 | unresolved | — | `?` |
| Fenris | 1 | HH-0015 | direct | fenris | `?` |
| Hollow Mountain | 1 | HH-0017 | unresolved | — | `?` |
| Hydra Cordatus | 1 | HH-0016 | direct | hydra_cordatus | `?` |
| Iesta Veracrux | 1 | HH-0013 | unresolved | — | `?` |
| Imperial Palace | 1 | HH-0017 | direct | imperial_palace | `?` |
| Isstvan System | 1 | HH-0003 | unresolved | — | `?` |
| Khur | 1 | HH-0014 | unresolved | — | `?` |
| Laeran | 1 | HH-0005 | unresolved | — | `?` |
| Macragge | 1 | HH-0008 | direct | macragge | `?` |
| Magma City | 1 | HH-0009 | unresolved | — | `?` |
| Mars | 1 | HH-0009 | direct | mars | `?` |
| Monarchia | 1 | HH-0014 | unresolved | — | `?` |
| Murder | 1 | HH-0001 | unresolved | — | `?` |
| Nikaea | 1 | HH-0012 | unresolved | — | `?` |
| Nurth | 1 | HH-0007 | unresolved | — | `?` |
| Perditus | 1 | HH-0020 | unresolved | — | `?` |
| Sarosh | 1 | HH-0006 | unresolved | — | `?` |
| Sixty-Three Nineteen | 1 | HH-0001 | unresolved | — | `?` |
| Tizca | 1 | HH-0012 | direct | tizca | `?` |
| Veridia | 1 | HH-0019 | unresolved | — | `?` |
| Xenobia | 1 | HH-0001 | unresolved | — | `?` |

### Characters (73 distinct surface forms, 107 total occurrences)

| surface form | freq | beispiel-bücher (max 3) | status | canonical id (if resolved) | cluster-tags |
| --- | --- | --- | --- | --- | --- |
| Erebus | 4 | HH-0002, HH-0003, HH-0014 | unresolved | — | `?` |
| Lion El'Jonson | 4 | HH-0006, HH-0011, HH-0016 | unresolved | — | `?` |
| Alpharius | 3 | HH-0007, HH-0018, HH-0020 | unresolved | — | `?` |
| Fulgrim | 3 | HH-0003, HH-0005, HH-0020 | unresolved | — | `?` |
| Garviel Loken | 3 | HH-0001, HH-0002, HH-0003 | unresolved | — | `?` |
| Horus | 3 | HH-0001, HH-0002, HH-0003 | unresolved | — | `?` |
| Leman Russ | 3 | HH-0010, HH-0012, HH-0015 | unresolved | — | `?` |
| Lorgar | 3 | HH-0010, HH-0014, HH-0019 | unresolved | — | `?` |
| Omegon | 3 | HH-0007, HH-0018, HH-0020 | unresolved | — | `?` |
| Tarik Torgaddon | 3 | HH-0001, HH-0002, HH-0003 | unresolved | — | `?` |
| Angron | 2 | HH-0003, HH-0010 | unresolved | — | `?` |
| Ezekyle Abaddon | 2 | HH-0001, HH-0002 | unresolved | — | `?` |
| Ferrus Manus | 2 | HH-0005, HH-0020 | direct | ferrus_manus | `?` |
| Horus Aximand | 2 | HH-0001, HH-0002 | unresolved | — | `?` |
| Kor Phaeron | 2 | HH-0014, HH-0019 | direct | kor_phaeron | `?` |
| Luther | 2 | HH-0006, HH-0011 | unresolved | — | `?` |
| Malcador the Sigillite | 2 | HH-0013, HH-0018 | unresolved | — | `?` |
| Mortarion | 2 | HH-0003, HH-0004 | direct | mortarion | `?` |
| Nathaniel Garro | 2 | HH-0003, HH-0004 | unresolved | — | `?` |
| Nemiel | 2 | HH-0006, HH-0011 | unresolved | — | `?` |
| Roboute Guilliman | 2 | HH-0016, HH-0019 | direct | roboute_guilliman | `?` |
| Zahariel | 2 | HH-0006, HH-0011 | unresolved | — | `?` |
| Ahzek Ahriman | 1 | HH-0012 | direct | ahzek_ahriman | `?` |
| Amendera Kendel | 1 | HH-0010 | unresolved | — | `?` |
| Aquillon | 1 | HH-0014 | unresolved | — | `?` |
| Argel Tal | 1 | HH-0014 | unresolved | — | `?` |
| Astelan | 1 | HH-0010 | direct | astelan | `?` |
| Atharva | 1 | HH-0017 | unresolved | — | `?` |
| Barabas Dantioch | 1 | HH-0016 | unresolved | — | `?` |
| Branne | 1 | HH-0018 | unresolved | — | `?` |
| Brynngar | 1 | HH-0008 | unresolved | — | `?` |
| Caxton | 1 | HH-0009 | unresolved | — | `?` |
| Cestus | 1 | HH-0008 | unresolved | — | `?` |
| Constantin Valdor | 1 | HH-0010 | unresolved | — | `?` |
| Corax | 1 | HH-0018 | unresolved | — | `?` |
| Dalia Cythera | 1 | HH-0009 | unresolved | — | `?` |
| Eidolon | 1 | HH-0005 | unresolved | — | `?` |
| Eristede Kell | 1 | HH-0013 | unresolved | — | `?` |
| Hurtado Bronzi | 1 | HH-0007 | unresolved | — | `?` |
| Iacton Qruze | 1 | HH-0016 | unresolved | — | `?` |
| John Grammaticus | 1 | HH-0007 | unresolved | — | `?` |
| Julius Kaesoron | 1 | HH-0005 | unresolved | — | `?` |
| Kai Zulane | 1 | HH-0017 | unresolved | — | `?` |
| Kaleb Arin | 1 | HH-0004 | unresolved | — | `?` |
| Kasper Hawser | 1 | HH-0015 | unresolved | — | `?` |
| Kelbor-Hal | 1 | HH-0009 | unresolved | — | `?` |
| Kharn | 1 | HH-0010 | alias | kharn_the_betrayer | `?` |
| Konrad Curze | 1 | HH-0016 | unresolved | — | `?` |
| Koriel Zeth | 1 | HH-0009 | unresolved | — | `?` |
| Kyril Sindermann | 1 | HH-0001 | unresolved | — | `?` |
| Lemuel Gaumon | 1 | HH-0012 | unresolved | — | `?` |
| Little Horus Aximand | 1 | HH-0016 | unresolved | — | `?` |
| Longfang | 1 | HH-0015 | unresolved | — | `?` |
| Lucius | 1 | HH-0005 | unresolved | — | `?` |
| Magnus the Red | 1 | HH-0012 | direct | magnus_the_red | `?` |
| Mersadie Oliton | 1 | HH-0001 | unresolved | — | `?` |
| Mhotep | 1 | HH-0008 | unresolved | — | `?` |
| Peto Soneka | 1 | HH-0007 | unresolved | — | `?` |
| Regulus | 1 | HH-0009 | unresolved | — | `?` |
| Remus Ventanus | 1 | HH-0019 | unresolved | — | `?` |
| Rogal Dorn | 1 | HH-0004 | unresolved | — | `?` |
| Sar Daviel | 1 | HH-0006 | unresolved | — | `?` |
| Saul Tarvitz | 1 | HH-0003 | unresolved | — | `?` |
| Severian | 1 | HH-0017 | unresolved | — | `?` |
| Sheed Ranko | 1 | HH-0007 | unresolved | — | `?` |
| Skraal | 1 | HH-0008 | unresolved | — | `?` |
| Solun Decius | 1 | HH-0004 | unresolved | — | `?` |
| Spear | 1 | HH-0013 | unresolved | — | `?` |
| Tagore | 1 | HH-0017 | unresolved | — | `?` |
| The Emperor | 1 | HH-0010 | unresolved | — | `?` |
| Uriah Olathaire | 1 | HH-0010 | unresolved | — | `?` |
| Yosef Sabrat | 1 | HH-0013 | unresolved | — | `?` |
| Zadkiel | 1 | HH-0008 | unresolved | — | `?` |

## 4. Cross-axis surface-form conflicts

| surface form | axes |
| --- | --- |
| (none) | — |

## 5. Omnibus / anthology scan

| externalBookId | title | format | roster collection? | known constituents |
| --- | --- | --- | --- | --- |
| HH-0010 | *Tales of Heresy* | anthology | yes (7) | HH-0150, HH-0151, HH-0152, HH-0153, HH-0154, HH-0155, … (7 total) |
| HH-0016 | *Age of Darkness* | anthology | yes (9) | HH-0157, HH-0158, HH-0159, HH-0160, HH-0161, HH-0162, … (9 total) |
| HH-0020 | *The Primarchs* | anthology | yes (4) | HH-0117, HH-0118, HH-0119, HH-0120 |

## 6. data_conflict flag scan

| externalBookId | title | flags |
| --- | --- | --- |
| (none) | — | — |

## 7. Cross-batch alias-consolidation + needs-decision candidates

> The only LLM-synthesized section. It flags (7a) surface-form variants the owning phase must collapse into
> **one** row + an alias — Pass 10 is the **HH bootstrap wave**, so the dominant pattern is **Cross-Era
> aliasing** (HH-era surface form on existing W40K-era canonical row, per runbook §4 Cross-Era-Identitäten);
> (7b) the big single-form cross-batch spines that group Primarch / Heresy-loyalist / Heresy-traitor casts
> into one row each; (7c) the freq-driven promotion shape per axis; (7d) genuine needs-decision candidates
> (mostly forward-ref anthology constituents — all three anthologies in this wave reference roster IDs that
> are outside the cumulative apply range, so Brief 091's range-aware forward-ref Guard is the key Phase-4
> integration concern). Everything is grounded in the §2–§6 aggregate (book-IDs cited) + canonical
> Black-Library Horus-Heresy series structure + the Cross-Era convention written into runbook §4. **Zero
> hard blockers expected** — every call below resolves in-phase with justification. If an identity turns
> genuinely ambiguous in-phase (e.g. a generic name with two distinct HH-era bearers), that phase writes a
> `## Needs decision` block in its per-phase status file and stops (runbook §3 / §4 "Ausnahme — echte
> Identitäts-Disambig").

### 7a. Cross-batch alias-consolidation cases (→ one row + alias)

> Format: surface-forms · book-IDs · same entity? · recommendation. These are the cases where a naïve
> implementer would create **two** rows or — in the HH-bootstrap case — would invent a new HH-era row
> instead of aliasing onto the existing W40K-era anchor. Per runbook §4: **one canonical identity = one
> canonical row; era-specific surface forms live in `*-aliases.json`**. The time axis (Pre-Heresy ↔
> Heresy ↔ Post-Heresy) is a story property, not an identity property.

**Factions (Phase 1):** Cross-Era faction renames — the existing post-Heresy canonical row is the anchor;
the HH-era surface form is mapped onto it via `faction-aliases.json`.

- **Case A — Luna Wolves ↔ Sons of Horus.** `Luna Wolves` (HH-0001 *Horus Rising*, HH-0002 *False Gods*,
  freq 2, unresolved) is the pre-Heresy organizational name of the legion that Horus renames to **Sons of
  Horus** mid-Heresy (the rename happens in *False Gods* itself, on-page). Same organizational entity,
  two era-specific names. → **alias `Luna Wolves` → `sons_of_horus`** (anchor `sons_of_horus` exists at
  `factions.json:17`). Combined effective freq 6 on `sons_of_horus` once the alias lands (the existing 4
  direct hits plus the 2 HH-era surface forms). **No** separate `luna_wolves` row — exactly the
  worked-example in runbook §4. (The full-form variant `Luna Wolves Legion` does not surface this wave;
  if it shows up later, same alias target.)
- **Case B — Mechanicum ↔ Mechanicus.** `Mechanicum` (HH-0001, HH-0009 *Mechanicum* novel + HH-0018,
  freq 4, unresolved) is the pre-Imperial-reformation organizational name of the Martian tech-priesthood;
  the Imperium reforms it into **Adeptus Mechanicus** post-Heresy. Same organizational entity, two
  era-specific names. → **alias `Mechanicum` → `mechanicus`** (anchor `mechanicus` exists at
  `factions.json:101`). The pattern matches Luna Wolves exactly. **No** separate `mechanicum` row.
- **Case C — Imperial Army ↔ Astra Militarum.** `Imperial Army` (HH-0001, HH-0007 *Legion*, freq 2,
  unresolved) is the pre-Imperial-reformation name of the standing Imperial human-soldiery force; the
  Imperium reforms it post-Heresy into the **Imperia Militarum / Astra Militarum** (Imperial Guard).
  Cross-Era same-organization-different-name. → **alias `Imperial Army` → `astra_militarum`** (anchor
  `astra_militarum` exists at `factions.json:141`; existing aliases `Imperial Guard` → `astra_militarum`
  + `Astra Militarum` → `astra_militarum` already prove the grain). **No** separate `imperial_army` row.

> Three Cross-Era faction aliases · zero new faction rows from this case-set. The 7a Phase-1 add count
> for the alias file alone is **3**; the new-row count for 7a is **0**. Other faction promotions (Custodes
> alias-confirmation + Cabal / Interex / Laer / Knights of Taranis / Legio Mortis / The Order new rows)
> are 7c, not 7a.

**Characters (Phase 3):** Cross-Era Honor-Title splits — same person, HH-era surface form (without title)
mapped onto the existing W40K-era anchor row (with title), per runbook §4. The existing alias
`Kharn` → `kharn_the_betrayer` (43 baseline character aliases includes it) is the proof-of-pattern.

- **Case D — Lucius ↔ Lucius the Eternal.** `Lucius` (HH-0005 *Fulgrim*, freq 1, unresolved) is the
  pre-Heresy form of the Emperor's Children swordsman who later becomes the daemonically-resurrected
  **Lucius the Eternal**. Same person, two surface forms (per runbook §4 worked-example list). → **alias
  `Lucius` → `lucius_the_eternal`** (anchor `lucius_the_eternal` exists at `characters.json:598`). **No**
  separate `lucius` row. Freq-1 is intentional here — the runbook explicitly names Lucius / Lucius the
  Eternal as a worked-example Honor-Title split, so this is a **lore-iconic freq=1 alias add** (Promotion
  threshold §4: freq ≥ 2 strict + a curated list of lore-iconic freq=1 promotions; this is the curated
  list).
- **Case E — Ezekyle Abaddon ↔ Abaddon the Despoiler.** `Ezekyle Abaddon` (HH-0001, HH-0002, freq 2,
  unresolved) is the pre-Heresy / Heresy-era full name of the Sons of Horus First Captain who later
  founds the Black Legion and becomes **Abaddon the Despoiler**. Same person; runbook §4 names
  `Abaddon ↔ Abaddon the Despoiler` as a worked-example. The HH wave surfaces the full first-name form
  `Ezekyle Abaddon` rather than the bare `Abaddon`, but it's the same identity claim. → **alias
  `Ezekyle Abaddon` → `abaddon_the_despoiler`** (anchor `abaddon_the_despoiler` exists at
  `characters.json:612`). Combined effective freq 3 on `abaddon_the_despoiler` once the alias lands
  (existing 1 W40K-side direct + the 2 HH-era full-form surfaces). **No** separate `ezekyle_abaddon` row.
- **Case F (already direct — confirmation only) — Magnus the Red.** `Magnus the Red` (HH-0012 *A Thousand
  Sons*, freq 1) resolves **direct** to `magnus_the_red` (`characters.json:591`) — no alias work needed,
  but listed here because the runbook §4 names it as a worked-example. If a future HH wave surfaces the
  bare `Magnus`, the alias `Magnus → magnus_the_red` will be added then; this wave only sees the
  full-with-title form, so no action.
- **Case G (already direct — confirmation only) — Ferrus Manus / Mortarion / Roboute Guilliman / Kor
  Phaeron / Ahzek Ahriman / Astelan.** All resolve direct in §3 — the existing W40K-side canonical rows
  are the anchors, and the HH wave surfaces the same surface form. **No** action; listed only to make the
  Cross-Era anchor-confirmation explicit. Note `Astelan` (HH-0010 *Tales of Heresy* anthology) is an
  example of a character who survives Heresy → post-Heresy / Fallen with the same surface form — the
  existing W40K canonical row absorbs the HH hit cleanly.

> Two Cross-Era character aliases · zero new character rows from this case-set. The 7a Phase-3 add count
> for the alias file is **2**. Every other HH-character is a 7c new-row promotion (worked through below).

**Locations (Phase 2):** No Cross-Era location renames in this wave. Most HH locations are still called
the same name post-Heresy (Caliban / Prospero / Calth / Macragge / Terra / Mars / etc.), and they're
already direct. The single existing alias `Isstvan V → istvaan_v` (already in `location-aliases.json`)
catches the doubled-s spelling variant. **No** location alias-consolidation pairs in this wave (the
unresolved `Isstvan III` / `Isstvan System` are 7c new-row promotions, not 7a aliases).

### 7b. Big single-form cross-batch spines (one row each — not alias work)

These are **single, consistent** surface forms that recur across an arc / a Primarch cluster, so each
one promotes to **one** new canonical row (the bulk of Phase-3 volume in the HH-bootstrap wave is here).
All are freq ≥ 2 unresolved unless flagged lore-iconic-freq-1.

**Primarch spine (per runbook §4: "Primarchen ohne heutige Row").** Every traitor + loyalist Primarch
who surfaces in this wave and has no existing canonical row becomes a fresh row in Phase 3.
primaryFactionId resolves to the Legion-row that already exists in `factions.json` (every Legion in this
list has its row — see baseline). Phase 3 reads the freshly-committed Phase-1 factions.json before
adding any character row, per runbook §5 FK-safety.

- **`Horus` (3 — HH-0001, HH-0002, HH-0003).** Warmaster, Sons of Horus / Luna Wolves. New row `horus`.
  primaryFactionId `sons_of_horus`. Lore-iconic anchor of the entire Heresy.
- **`Lion El'Jonson` (4 — HH-0006, HH-0011, HH-0016).** Dark Angels Primarch (note the apostrophe in
  `El'Jonson` — keep the surface form as-is; slug `lion_el_jonson` strips it). New row.
  primaryFactionId `dark_angels`.
- **`Leman Russ` (3 — HH-0010, HH-0012, HH-0015).** Space Wolves Primarch. New row `leman_russ`.
  primaryFactionId `space_wolves`.
- **`Lorgar` (3 — HH-0010, HH-0014, HH-0019).** Word Bearers Primarch. New row `lorgar`.
  primaryFactionId `word_bearers`.
- **`Fulgrim` (3 — HH-0003, HH-0005, HH-0020).** Emperor's Children Primarch. New row `fulgrim`.
  primaryFactionId `emperors_children`.
- **`Alpharius` (3 — HH-0007, HH-0018, HH-0020).** Alpha Legion Primarch. New row `alpharius`.
  primaryFactionId `alpha_legion`. Note: Alpha Legion has two Primarchs (twins Alpharius & Omegon, the
  Cabal-arc twist) — both promote.
- **`Omegon` (3 — HH-0007, HH-0018, HH-0020).** Alpha Legion twin-Primarch. New row `omegon`. Same
  primaryFactionId `alpha_legion`. The Legion-twin convention does not split the legion row.
- **`Angron` (2 — HH-0003, HH-0010).** World Eaters Primarch. New row `angron`. primaryFactionId
  `world_eaters`.
- **`Rogal Dorn` (1 — HH-0004, lore-iconic).** Imperial Fists Primarch. Curated freq-1 promotion (per
  runbook §4 — Primarchen on the named list). New row `rogal_dorn`. primaryFactionId `imperial_fists`
  (exists at `factions.json:190`).
- **`Corax` (1 — HH-0018, lore-iconic).** Raven Guard Primarch. Curated freq-1 promotion. New row
  `corax`. primaryFactionId `raven_guard`.
- **`Konrad Curze` (1 — HH-0016, lore-iconic).** Night Lords Primarch. Curated freq-1 promotion. New row
  `konrad_curze`. primaryFactionId `night_lords`.

> 11 Primarch rows from the curated freq-1 + freq-2 + freq-3 list. Combined with the 7a Cross-Era
> aliasing (Lucius / Ezekyle Abaddon onto the existing W40K rows) + the 7a confirmations (Magnus /
> Ferrus Manus / Mortarion / Roboute Guilliman / Kor Phaeron all already direct), this completes the
> Primarch coverage for this wave. Sanguinius / Vulkan / Jaghatai Khan / Perturabo / Mortarion (loyalist
> brothers) don't surface in this wave's §3 except where already direct.

**Heresy loyalist / traitor character spines.** These are the in-novel POV / supporting casts that
recur cross-batch in this wave. Each promotes to a single new row.

- **`Garviel Loken` (3 — HH-0001, HH-0002, HH-0003).** Sons of Horus / Luna Wolves Mournival captain;
  central POV of the opening trilogy; later "lost" then surfaced again in later HH novels (well beyond
  this wave). New row `garviel_loken`. primaryFactionId `sons_of_horus`.
- **`Tarik Torgaddon` (3 — HH-0001, HH-0002, HH-0003).** Sons of Horus / Luna Wolves Mournival captain.
  New row `tarik_torgaddon`. primaryFactionId `sons_of_horus`.
- **`Horus Aximand` (2 — HH-0001, HH-0002).** Sons of Horus Mournival captain ("Little Horus"). New row
  `horus_aximand`. primaryFactionId `sons_of_horus`. **Cross-batch alias-consolidation candidate:** the
  freq-1 surface form `Little Horus Aximand` (HH-0016) is the same person — see 7a-class candidate (7b
  here because the entity has a clear primary canonical surface form). → **alias `Little Horus Aximand`
  → `horus_aximand`** in `character-aliases.json`. Combined effective freq 3 (2 + 1) once Phase 3 adds
  both row + alias.
- **`Erebus` (4 — HH-0002, HH-0003, HH-0014).** Word Bearers First Chaplain / Heresy puppet-master.
  Highest-freq unresolved character in the wave. New row `erebus`. primaryFactionId `word_bearers`.
  Lore-iconic Heresy antagonist; surfaces across batches both as Heresy architect and as the
  prime-mover behind *The First Heretic*'s Word Bearer fall.
- **`Nathaniel Garro` (2 — HH-0003, HH-0004).** Death Guard battle-captain; loyalist who escapes the
  Eisenstein and later founds the Knights-Errant frame. New row `nathaniel_garro`. primaryFactionId
  `death_guard` (this is FK-safe — Garro remains nominally Death Guard in this wave even though loyalist).
- **`Malcador the Sigillite` (2 — HH-0013, HH-0018).** Imperial regent / first Sigillite. New row
  `malcador_the_sigillite`. primaryFactionId — judgment call: `imperium` if such a broad row exists,
  else leave empty / `astra_militarum` is the wrong grain. Phase 3 picks; Sigillite has no clean Legion
  affiliation.
- **`Luther` (2 — HH-0006, HH-0011).** Caliban-side Order knight, Lion's mentor; the *Descent of
  Angels* / *Fallen Angels* pivot character (the Fallen arc). New row `luther`. primaryFactionId
  `dark_angels` (the Order eventually merges into the Dark Angels Legion — see "The Order" 7c below;
  Phase 3 may also choose to point at a future Order row if Phase 1 promotes it).
- **`Nemiel` (2 — HH-0006, HH-0011).** Dark Angels chaplain; *Descent of Angels* + *Fallen Angels* arc
  POV. New row `nemiel`. primaryFactionId `dark_angels`.
- **`Zahariel` (2 — HH-0006, HH-0011).** Dark Angels librarian; same arc as Nemiel. New row `zahariel`.
  primaryFactionId `dark_angels`.

**Heresy supporting cast — lore-iconic freq-1 promotions (curated).** These are the named loyalists /
traitors / mortals whose surface forms surface once in this wave but are foundational HH-arc figures
(per runbook §4 promotion threshold: lore-iconic freq=1 curated promotions are legitimate).

- **`Constantin Valdor` (1 — HH-0010).** Captain-General of the Custodes during the Heresy; lore-iconic
  freq-1. New row `constantin_valdor`. primaryFactionId `custodes`.
- **`Saul Tarvitz` (1 — HH-0003).** Emperor's Children loyalist; lone-voice warning of Isstvan III. New
  row `saul_tarvitz`. primaryFactionId `emperors_children`. Lore-iconic.
- **`Argel Tal` (1 — HH-0014).** Word Bearers / Gal Vorbak; *First Heretic* POV. New row `argel_tal`.
  primaryFactionId `word_bearers`. Lore-iconic.
- **`Iacton Qruze` (1 — HH-0016).** Sons of Horus / Luna Wolves elder; "Half-heard"; later Knight-Errant.
  Lore-iconic. New row `iacton_qruze`. primaryFactionId `sons_of_horus`.
- **`Kasper Hawser` (1 — HH-0015).** *Prospero Burns* POV (mortal scholar with Space Wolves). New row
  `kasper_hawser`. primaryFactionId — mortal civilian, no clean Legion; default empty or `imperium`.
- **`Mersadie Oliton` (1 — HH-0001).** Remembrancer; *Horus Rising* documentary POV. New row
  `mersadie_oliton`. primaryFactionId — civilian Remembrancer, no Legion.
- **`Kyril Sindermann` (1 — HH-0001).** Iterator; *Horus Rising* mortal supporting cast. New row
  `kyril_sindermann`. primaryFactionId — civilian Iterator.
- **`John Grammaticus` (1 — HH-0007).** Cabal agent; *Legion* POV; later HH recurring. New row
  `john_grammaticus`. primaryFactionId — Cabal agent; if Phase 1 promotes `cabal` as own row (see 7c),
  point at it; else empty / `imperium` fallback is wrong, so probably better to leave empty until the
  Cabal row decision lands.
- **`Kelbor-Hal` (1 — HH-0009).** Fabricator-General of Mars who breaks for Horus. Lore-iconic
  *Mechanicum* antagonist. New row `kelbor_hal`. primaryFactionId `mechanicus` (post-7a-alias confirmation
  that Mechanicum ↔ Mechanicus is one row).
- **`Eidolon` (1 — HH-0005).** Emperor's Children Lord Commander; lore-iconic. New row `eidolon`.
  primaryFactionId `emperors_children`.
- **`Julius Kaesoron` (1 — HH-0005).** Emperor's Children captain; lore-iconic. New row
  `julius_kaesoron`. primaryFactionId `emperors_children`.
- **`Branne` (1 — HH-0018).** Raven Guard captain; *Deliverance Lost* support. New row `branne_nev`.
  primaryFactionId `raven_guard`. (Slug judgment — Phase 3 may keep just `branne` or use the full name
  `Branne Nev` if available.)
- **`Solun Decius` (1 — HH-0004).** Death Guard sergeant; first plague-victim arc. New row
  `solun_decius`. primaryFactionId `death_guard`. Lore-iconic.
- **`Kaleb Arin` (1 — HH-0004).** Death Guard housecarl. New row `kaleb_arin`. primaryFactionId
  `death_guard`.
- **`Hurtado Bronzi` (1 — HH-0007).** Geno Five-Two Chiliad officer; *Legion* loyalist POV. New row
  `hurtado_bronzi`. primaryFactionId — Imperial Army → after 7a alias, that's `astra_militarum`.
- **`Peto Soneka` (1 — HH-0007).** Geno Five-Two Chiliad officer. New row `peto_soneka`.
  primaryFactionId `astra_militarum` (via Imperial Army alias).
- **`Sheed Ranko` (1 — HH-0007).** Geno Five-Two Chiliad officer. New row `sheed_ranko`. Same.
- **`Sar Daviel` (1 — HH-0006).** Caliban Order knight. New row `sar_daviel`. primaryFactionId
  `dark_angels` (or `the_order` if Phase 1 promotes it).
- **`Cestus` (1 — HH-0008).** Ultramarines captain; *Battle for the Abyss* POV. New row `cestus`.
  primaryFactionId `ultramarines`.
- **`Brynngar` (1 — HH-0008).** Space Wolves character in *Battle for the Abyss*. New row `brynngar`.
  primaryFactionId `space_wolves`.
- **`Skraal` (1 — HH-0008).** World Eaters character in *Battle for the Abyss*. New row `skraal`.
  primaryFactionId `world_eaters`.
- **`Mhotep` (1 — HH-0008).** Thousand Sons character in *Battle for the Abyss*. New row `mhotep`.
  primaryFactionId `thousand_sons`.
- **`Zadkiel` (1 — HH-0008).** Word Bearers captain (antagonist in *Battle for the Abyss*). New row
  `zadkiel`. primaryFactionId `word_bearers`.
- **`Aquillon` (1 — HH-0014).** Custodes envoy; *First Heretic*. New row `aquillon`. primaryFactionId
  `custodes`.
- **`Lemuel Gaumon` (1 — HH-0012).** Remembrancer; *A Thousand Sons*. New row `lemuel_gaumon`.
  primaryFactionId — civilian, no Legion.
- **`Kai Zulane` (1 — HH-0017).** Astropath; *The Outcast Dead* POV. New row `kai_zulane`. primaryFactionId
  `adeptus_astra_telepathica` (exists, direct §3).
- **`Severian` (1 — HH-0017).** *The Outcast Dead* psyker. New row `severian`. primaryFactionId — Phase 3
  judgment.
- **`Tagore` (1 — HH-0017).** *The Outcast Dead* World Eater. New row `tagore`. primaryFactionId
  `world_eaters`.
- **`Atharva` (1 — HH-0017).** *The Outcast Dead* Thousand Son. New row `atharva`. primaryFactionId
  `thousand_sons`.
- **`Remus Ventanus` (1 — HH-0019).** Ultramarines captain; *Know No Fear* POV. New row `remus_ventanus`.
  primaryFactionId `ultramarines`.
- **`Eristede Kell` (1 — HH-0013).** Vindicare assassin; *Nemesis*. New row `eristede_kell`.
  primaryFactionId `officio_assassinorum` (exists, direct §3).
- **`Spear` (1 — HH-0013).** Chaos-assassin antagonist; *Nemesis*. New row `spear`. primaryFactionId —
  Chaos-side fallback; Phase 3 picks (`chaos` if it exists, else empty).
- **`Yosef Sabrat` (1 — HH-0013).** *Nemesis* mortal POV. New row `yosef_sabrat`. primaryFactionId
  `adeptus_arbites` (exists, direct §3) or civilian.
- **`Caxton` (1 — HH-0009).** *Mechanicum* character. New row `caxton`. primaryFactionId `mechanicus`.
- **`Dalia Cythera` (1 — HH-0009).** *Mechanicum* POV. New row `dalia_cythera`. primaryFactionId
  `mechanicus`.
- **`Regulus` (1 — HH-0009).** *Mechanicum* Adept; Horus's Martian ally. New row `regulus`. primaryFactionId
  `mechanicus`.
- **`Koriel Zeth` (1 — HH-0009).** Mechanicum Magos / Magma City. New row `koriel_zeth`. primaryFactionId
  `mechanicus`.
- **`Amendera Kendel` (1 — HH-0010).** Sister of Silence Witchseeker; *Tales of Heresy*. New row
  `amendera_kendel`. primaryFactionId `talons_of_the_emperor` (consistent with the existing alias `Sisters
  of Silence → talons_of_the_emperor`).
- **`Uriah Olathaire` (1 — HH-0010).** *Tales of Heresy* mortal POV (Imperial cult priest). New row
  `uriah_olathaire`. primaryFactionId — civilian, no Legion.
- **`The Emperor` (1 — HH-0010).** Phase 3 judgment whether to promote — lore-iconic in the maximal
  sense, but the surface form is generic. Default: **promote** as `the_emperor` (Phase-3 may use a
  cleaner slug like `emperor_of_mankind` if a convention exists; check baseline). primaryFactionId —
  none / `imperium`. Note this is a single freq-1 surface; some authority layers prefer not to
  canonicalise "The Emperor" as a character row because He's also an entity in his own right
  (faction-tier). Phase 3 judgment is welcome here. If Phase 3 leaves it unresolved, no Phase-4 break.

> 11 Primarch rows + ~30 supporting-cast rows from this 7b section = ~41 new character rows for the wave.
> The exact count is Phase-3's judgment (some freq-1 supporting cast may stay unresolved long-tail);
> the runbook §4 promotion-threshold lets each phase justify its set in the per-phase status file.

### 7c. Per-axis promotion shape (freq-driven; owning phase justifies the exact set)

**Factions (Phase 1).** Strict **freq ≥ 2 unresolved** promotion candidates + curated freq-1
lore-iconic adds:

- **`Custodes` (freq 4, unresolved).** Identical-target Cross-Era alias-confirmation. The existing alias
  `Adeptus Custodes → custodes` (already in `faction-aliases.json`, freq 2 in this wave → direct) proves
  the canonical row. Default = **add alias `Custodes` → `custodes`** to the faction-alias file. **No** new
  row. Effective combined freq after alias = 6.
- **`Mechanicum` (freq 4).** See 7a Case B — alias to `mechanicus`. (Listed here because it's also freq
  ≥ 2 unresolved — 7a is the structural recommendation; 7c is the freq-count justification.)
- **`Luna Wolves` (freq 2).** See 7a Case A — alias to `sons_of_horus`.
- **`Imperial Army` (freq 2).** See 7a Case C — alias to `astra_militarum`.
- **`Cabal` (freq 1, lore-iconic).** Xenos conspiracy from Abnett's *Legion*. Lore-iconic HH-specific
  faction. Default = **new row `cabal`** (xenos faction grain). primaryFactionId — n/a (factions don't
  have primaryFactionId). Phase 1 judgment whether to promote; this is the curated freq-1 list, and
  `John Grammaticus` (7b) needs it as primaryFactionId target.
- **`Interex` (freq 1, lore-iconic).** Xenos-collaborator human civilization from *Horus Rising*.
  Lore-iconic. Default = **new row `interex`**. Phase 1 judgment.
- **`Laer` (freq 1, lore-iconic).** Slaaneshi-tainted xenos race from *Fulgrim* — the Laer Coil incident
  is foundational to the Emperor's Children fall to Slaanesh. Default = **new row `laer`** (xenos
  faction). Phase 1 judgment.
- **`Knights of Taranis` (freq 1).** Imperial Knight House on Mars; central to *Mechanicum*. Plausible
  promotion if Phase 1 wants per-Knight-House grain (consistent with the Cadian / Catachan-regiment
  grain pattern); else leave unresolved. Phase 1 judgment — `imperial_knights` (exists) is the parent
  fallback if no per-House grain.
- **`Legio Mortis` (freq 1).** Titan Legion turned traitor (Horus's loyal Titan Legion); central to
  *Mechanicum*. The W40K-side has `legio_tempestus` (direct in §3). Parity consideration: if Phase 1
  wants per-Legio grain (consistent with already-existing `legio_tempestus`), default = **new row
  `legio_mortis`**. Otherwise leave unresolved.
- **`The Order` (freq 1).** Pre-Imperial Caliban knightly order from *Descent of Angels* / *Fallen
  Angels*. Lore-iconic but surface form is generic. Default = either **own row `the_order_caliban`** (or
  `order_of_caliban` for naming clarity) or alias to `dark_angels` (since the Order eventually merges
  into the Dark Angels). Phase 1 judgment; Luther's primaryFactionId (7b) is the downstream sensitivity.

> The Phase-1 promotion shape: **3 Cross-Era alias adds** (Luna Wolves / Mechanicum / Imperial Army) + **1
> alias-confirmation add** (Custodes) + **0..6 new rows** (Cabal / Interex / Laer optional + Knights of
> Taranis / Legio Mortis / The Order judgment calls). The 4 alias-side adds are mechanical with anchor
> rows confirmed present (§1 baseline). The new-row count is Phase 1's discretion within the curated
> freq-1 list; the Phase-1 status report justifies the exact set picked.

**Locations (Phase 2).** Strict **freq ≥ 2 unresolved** + curated freq-1 lore-iconic:

- **`Isstvan III` (freq 2, unresolved).** Heresy-pivotal world (the virus-bombing). The
  existing alias `Istvaan V` / `Isstvan V` → `istvaan_v` (location-aliases.json) is the proof-pattern —
  the canonical-row spelling uses two t's (`istvaan_v`). Default = **new row `istvaan_iii`** (matching the
  two-t convention) **+ alias `Isstvan III` → `istvaan_iii`** (catching the doubled-s spelling). Combined
  effective freq 2 on the new row. **Likely** primarily a `gx/gy` near `istvaan_v` (same Istvaan system,
  see §3 freq-1 `Isstvan System` below).
- **`Isstvan System` (freq 1, lore-iconic).** Sector/system grain — parent of Isstvan III and Isstvan V.
  Default = either **new row `istvaan_system`** (if Phase 2 wants system-level granularity, parent of
  `istvaan_iii` + `istvaan_v`), or leave unresolved (single-occurrence, low evidence). Phase 2 judgment;
  the system-grain row would be consistent with the existing system-level rows in `sectors.json` /
  `locations.json` (Phase-2 inspection).
- **`Colchis` (freq 1, lore-iconic).** Lorgar's homeworld / Word Bearers homeworld; *First Heretic*
  centerpiece. Default = **new row `colchis`** (world grain). Lore-iconic curated freq-1 add.
- **`Monarchia` (freq 1, lore-iconic).** Word Bearers' Perfect City on Khur; the Emperor's burning of
  Monarchia is the foundational *First Heretic* pivot. Default = **new row `monarchia`** (city/sub-world
  grain). Lore-iconic curated freq-1 add.
- **`Khur` (freq 1, lore-iconic).** Word Bearers world (where Monarchia stood). Default = **new row
  `khur`** (world grain) — companion to Monarchia. Curated freq-1.
- **`Nikaea` (freq 1, lore-iconic).** Council of Nikaea — the foundational psyker-trial moment;
  *A Thousand Sons* + cross-HH-arc reference point. Lore-iconic. Default = **new row `nikaea`** (world
  grain).
- **`Aghoru` (freq 1).** Tomb-world from *A Thousand Sons* (Magnus's archaeological expedition).
  Lore-iconic to the Thousand Sons arc. Default = **new row `aghoru`** (world grain). Phase 2 judgment.
- **`Deliverance` (freq 1, lore-iconic).** Raven Guard homeworld (the Kiavahr moon); *Deliverance Lost*
  centerpiece. Default = **new row `deliverance`** (world/moon grain). Curated freq-1.
- **`Diamat` (freq 1).** Mechanicum / Iron Hands battle-world; *Fallen Angels* + cross-HH. Lore-iconic
  to the Heresy strategic frame. Default = **new row `diamat`**. Phase 2 judgment.
- **`Laeran` (freq 1).** Coral-world conquered by the Emperor's Children; the Laer-coil seduction
  source. Lore-iconic *Fulgrim* anchor. Default = **new row `laeran`** (world grain). Note this is
  distinct from the `Laer` faction (xenos race) — same root, different axis (no §4 cross-axis conflict
  because both are unresolved in different axes; if Phase 1 promotes `laer` and Phase 2 promotes `laeran`,
  one is the race, the other is the world).
- **`Sarosh` (freq 1).** *Descent of Angels* world. Plausible promotion; Phase 2 judgment.
- **`Murder` (freq 1).** Xenos-infested world from *Horus Rising* (the spider-world Interex campaign).
  Lore-iconic *Horus Rising* set-piece. Default = **new row `murder`** (world grain — surface form is
  the planet's actual name). Phase 2 judgment.
- **`Sixty-Three Nineteen` (freq 1).** Imperium-conquered world from *Horus Rising* (numbered designation).
  Phase 2 judgment whether to promote; the numeric surface form is awkward as a slug.
- **`Xenobia` (freq 1).** *Horus Rising* world. Phase 2 judgment.
- **`Nurth` (freq 1).** *Legion* world (the Geno Five-Two Chiliad's posting). Phase 2 judgment.
- **`Eolith` (freq 1).** *Legion* world. Phase 2 judgment.
- **`Magma City` (freq 1).** *Mechanicum* — sub-location of Mars (Koriel Zeth's domain). Plausible
  Mars-sub-location row or leave unresolved.
- **`Iesta Veracrux` (freq 1).** *Nemesis* world. Phase 2 judgment.
- **`Dagonet` (freq 1).** *Nemesis* world (Horus's puppet-governor target). Phase 2 judgment.
- **`Hollow Mountain` (freq 1).** *The Outcast Dead* — Terra sub-locale (the prison-cell complex).
  Plausible Terra-sub-location row or leave unresolved.
- **`Veridia` (freq 1).** *Know No Fear* world (the forge-world Calth siege references). Phase 2
  judgment.
- **`Perditus` (freq 1).** *The Primarchs* anthology world (Ferrus Manus / Mortarion arc). Phase 2
  judgment.

**Vessel watch (none high-evidence in this wave).** The signature HH-era ships — *Vengeful Spirit*
(Warmaster's flagship), *Eisenstein* (Garro's frigate, central to HH-0004), *Macragge's Honour*
(Guilliman's flagship in HH-0019), *Furious Abyss* (HH-0008 antagonist ship) — don't appear in §3 as
named location surface forms in the override files (the vessel-as-location convention is
`tags:['vessel']`, `gx/gy:null` per runbook §3 Phase 2; the override authors did not flag these as
location entries this wave). **No vessel promotions** required. If a future HH wave surfaces them, the
vessel convention applies.

> The Phase-2 promotion shape: **0 Cross-Era alias adds** + **1 freq-2 new row** (`istvaan_iii` + alias)
> + **6–14 freq-1 lore-iconic new rows** (Colchis / Monarchia / Khur / Nikaea / Deliverance + judgment
> calls on Aghoru / Diamat / Laeran / Murder / Sarosh / etc.). Conservative floor: 7 new rows + 1 alias.

**Characters (Phase 3).** See 7a (2 alias adds: Lucius / Ezekyle Abaddon) + 7b (~41 new rows). Phase-1
faction set must commit first (runbook §5). The `primaryFactionId` of every new character row points at
a faction that exists in the **post-Phase-1** `factions.json` — every Legion + Custodes + Mechanicus +
Astra Militarum + Officio Assassinorum + Adeptus Astra Telepathica + Imperial Knights + Talons of the
Emperor + Adeptus Arbites is **already present** in the baseline (see §1 + the verification grep in this
dossier). The only potential Phase-1-dependent new-row primary-factions are: `cabal` (if Phase 1 promotes
it, John Grammaticus points there), `the_order_caliban` (if Phase 1 promotes it, Luther / Sar Daviel
point there). Both are safe — if Phase 1 leaves them unresolved, Phase 3's fallback for the dependent
characters is `dark_angels` (Luther / Sar Daviel) or empty (Grammaticus).

> The Phase-3 promotion shape: **2 Cross-Era alias adds** (Lucius / Ezekyle Abaddon) + **1
> alias-consolidation add** (Little Horus Aximand → horus_aximand) + **~41 new rows** (Phase-3 judgment
> on the freq-1 long tail). The bulk-by-far is the new-row count — the largest single Phase-3 promotion
> pass to date, reflecting that this is the HH-bootstrap wave with no prior HH characters in the layer.

### 7d. needs-decision candidates (expected: 0 hard blockers; 1 architectural concern for Phase 4a)

- **Forward-ref anthology constituents — Brief 091 range-aware Guard is the centerpiece.** All three
  anthologies in §5 (*Tales of Heresy* HH-0010 → constituents HH-0150..HH-0156, *Age of Darkness* HH-0016
  → HH-0157..HH-0165, *The Primarchs* HH-0020 → HH-0117..HH-0120) reference roster IDs that are
  **outside** the cumulative apply range `hh 1..2` (HH-0001..HH-0020). When Phase 4a applies the
  anthologies, the `collection-gaps` / collection-edge logic will encounter forward-refs to books that
  are not yet in the authority layer. The **range-aware forward-ref Guard (Brief 091)** must let these
  pass — that's its purpose. **Expected behavior:** the Guard suppresses the constituent collection
  edges for the anthologies in this wave; later HH waves will apply the constituent novels (HH-0117..,
  HH-0150.., HH-0157..) and the cumulative re-apply will then materialize the edges (delete-then-insert
  idempotent, runbook §7). **No Phase-0 action**; Phase 4a verifies the Guard is wired for the
  domain-aware applyRange `{domain:"hh", from:1, to:2}` and that the constituent slugs are correctly
  recognized as "outside-range" rather than "missing entirely". If the Guard misfires, that's a Phase-4a
  `## Needs decision` stop. This is the **only architectural concern** in this wave's 7d.
- **The `Astelan` Cross-Era confirmation — single canonical row carries Heresy + Fallen lore unchanged.**
  `Astelan` (HH-0010 *Tales of Heresy*, freq 1) resolves direct → `astelan` (the existing W40K-side
  canonical row, `characters.json:647`). The W40K row's existing lore notes (if any) for the Fallen-era
  Astelan need not change — the same row absorbs both the HH-era and post-Heresy surface form. **No
  action**; listed only as a Cross-Era confirmation success.
- **`The Emperor` (freq 1) — slug-and-axis judgment for Phase 3.** Surface form is grammatically generic
  but lore-canonical for the Emperor of Mankind. Plausible Phase-3 picks: (a) promote as character row
  `the_emperor` / `emperor_of_mankind` (single-row Cross-Era-anchor for future waves that surface "The
  Emperor" / "Emperor"), (b) leave unresolved long-tail (single freq-1 hit in an anthology). Phase 3
  judgment; if a baseline character row for the Emperor exists already (Phase 3 verifies via grep), this
  is a 7a confirmation; if not, it's a 7c new-row promotion. **Not a hard block.**
- **`Little Horus Aximand` ↔ `Horus Aximand` alias-consolidation.** Same person (the Sons of Horus
  Mournival captain Aximand, nicknamed "Little Horus" to distinguish from Warmaster Horus). Surface
  forms are `Horus Aximand` (freq 2, HH-0001/HH-0002) + `Little Horus Aximand` (freq 1, HH-0016). 7b
  flagged this — promotion is one row `horus_aximand` + alias `Little Horus Aximand` → `horus_aximand`.
  **Not a hard block**, but Phase 3 must do **both** the row add and the alias add (a naïve implementer
  who only sees the freq-2 surface form would forget the freq-1 nickname).
- **Lucius identity disambig — possible but not realised this wave.** Per runbook §4 "Ausnahme — echte
  Identitäts-Disambig": the surface form `Lucius` is technically generic. In Black Library lore there
  are at least two distinct characters named Lucius (the Emperor's Children swordsman who becomes
  Lucius the Eternal, **and** a Cadian colonel / Mordian general / etc. in W40K). In this wave the only
  `Lucius` surface form is in HH-0005 *Fulgrim* — unambiguously the Emperor's Children swordsman. → 7a
  Case D alias is safe. **If a future wave surfaces `Lucius` in a Cadian / non-Heresy-era context, that
  wave's Phase 3 stops and writes a `## Needs decision`** (the alias may then need disambig — e.g.
  `Lucius (Emperor's Children)` / `Lucius (Cadian)` slug suffixes, or the alias is removed and surface
  forms re-aliased per-book). Phase 10 does not face this; advisory only.
- **`Branne` slug — naming convention.** §3 surfaces just `Branne`; canonical Black Library spelling is
  `Branne Nev` (Raven Guard captain). Phase 3 should use the full slug `branne_nev` even though the
  surface form is just `Branne` (matches the Pass-9 convention of using full canonical names for the
  slug while keeping the surface form as-it-appears in the override file). **Not a hard block.**
- **No `data_conflict` flags / no `low_confidence` flags (§6 is empty).** Clean override authoring this
  wave — every book has consistent format/setting/authors metadata and complete faction/location/character
  lists. No advisory carry-through to the audit cockpit from this wave's overrides. Loop-log batch notes
  (if any) for ssot-hh-001 / ssot-hh-002 may add color but no apply-blocking concerns.
- **Cumulative milestone — HH bootstrap.** Per project state: W40K corpus sealed at 565/565 books at
  Pass 9; this is the **first HH apply** (cumulativeBefore=0 + slice=20 reaches 20/X HH where X is the
  full HH-domain target — unknown at this wave; loop-helper continues with HH batches until the HH
  domain is fully applied or the loop hits Loop-Complete). The Phase 4b impl-report should flag the HH
  authority-layer bootstrap as the milestone, with the W40K seal-line as the predecessor.
- **Cross-axis surface-form conflicts** — **none in this wave** per §4. Both the `Laer` faction
  (xenos race, freq 1) and `Laeran` location (coral-world, freq 1) are surface-form-distinct — no
  collision on the same string. Worth keeping awareness for the next *Fulgrim*-adjacent wave when both
  may surface and Phase 1 / Phase 2 must keep the grain straight (faction = race, location = planet).

The per-axis promotion extents (7c), the 7a Cross-Era alias cases, and the 7b new-row character spines
are in-phase **judgments**, justified in each phase report — none escalates to a hard block under
current evidence. The single architectural item that warrants Phase-4a vigilance is the **range-aware
forward-ref Guard behaviour for the three anthologies' out-of-range constituent edges** (Brief 091).
