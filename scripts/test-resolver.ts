/**
 * Standalone unit test for src/lib/resolver/index.ts.
 *
 * No test framework: node:assert/strict + one console line per case, same
 * pattern as scripts/test-discovery-merge.ts.
 */
import assert from "node:assert/strict";
import process from "node:process";

import {
  normalizeCharacterRole,
  resolveCharacter,
  resolveFaction,
  resolveLocation,
} from "../src/lib/resolver";
import type { Alignment } from "../src/lib/seed/alignment";
import { decideFactionSkips } from "./apply-override-skip";
import { decideLocationSkips } from "./apply-override-location-skip";
import { normalizeRatingOverride } from "./apply-override-rating";
import { normalizeForHardcover } from "./hardcover-title-normalize";
import { normalizeAuthor } from "./hardcover-author-normalize";

let pass = 0;
let fail = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
    pass += 1;
  } catch (e) {
    console.error(`not ok - ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
    fail += 1;
  }
}

console.log("resolveFaction");

check("direct match - existing canonical Inquisition", () => {
  const r = resolveFaction("Inquisition");
  assert.equal(r.id, "inquisition");
  assert.equal(r.raw, "Inquisition");
});

check("direct match - existing canonical Ultramarines", () => {
  assert.equal(resolveFaction("Ultramarines").id, "ultramarines");
});

check("direct match - first resolver wave Tanith First-and-Only", () => {
  assert.equal(resolveFaction("Tanith First-and-Only").id, "tanith_first");
});

check("direct match - Heretic Astartes mid-node", () => {
  assert.equal(resolveFaction("Heretic Astartes").id, "heretic_astartes");
});

check("direct match - Black Legion", () => {
  assert.equal(resolveFaction("Black Legion").id, "black_legion");
});

check("direct match - Death Guard", () => {
  assert.equal(resolveFaction("Death Guard").id, "death_guard");
});

check("direct match - Emperor's Children", () => {
  assert.equal(resolveFaction("Emperor's Children").id, "emperors_children");
});

check("direct match - Khorne", () => {
  assert.equal(resolveFaction("Khorne").id, "khorne");
});

check("direct match - Adeptus Titanicus", () => {
  assert.equal(resolveFaction("Adeptus Titanicus").id, "adeptus_titanicus");
});

check("direct match - Officio Assassinorum", () => {
  assert.equal(resolveFaction("Officio Assassinorum").id, "officio_assassinorum");
});

check("alias - Imperial Guard routes to Astra Militarum", () => {
  assert.equal(resolveFaction("Imperial Guard").id, "astra_militarum");
});

check("alias - Drukhari routes to collapsed Aeldari umbrella", () => {
  assert.equal(resolveFaction("Drukhari").id, "eldar");
});

check("alias - Dark Eldar routes to collapsed Aeldari umbrella", () => {
  assert.equal(resolveFaction("Dark Eldar").id, "eldar");
});

check("alias - Chaos Undivided routes to Chaos umbrella", () => {
  assert.equal(resolveFaction("Chaos Undivided").id, "chaos");
});

check("alias - Mentor Legion routes to Mentors", () => {
  assert.equal(resolveFaction("Mentor Legion").id, "mentors");
});

check("alias - Biel-Tan routes to eldar on faction axis", () => {
  assert.equal(resolveFaction("Biel-Tan").id, "eldar");
});

check("alias - Iyanden routes to eldar on faction axis", () => {
  assert.equal(resolveFaction("Iyanden").id, "eldar");
});

check("case-sensitivity - lowercase chaos is not a direct match", () => {
  assert.equal(resolveFaction("chaos").id, null);
});

check("unknown - fabricated faction stays null", () => {
  assert.equal(resolveFaction("Cabal of Eight").id, null);
});

check("direct match - third wave Cadian Shock Troops", () => {
  assert.equal(resolveFaction("Cadian Shock Troops").id, "cadian_shock_troops");
});

check("direct match - third wave Death Korps of Krieg", () => {
  assert.equal(resolveFaction("Death Korps of Krieg").id, "death_korps_of_krieg");
});

check("direct match - third wave Carcharodons", () => {
  assert.equal(resolveFaction("Carcharodons").id, "carcharodons");
});

check("direct match - third wave Order of Our Martyred Lady", () => {
  assert.equal(
    resolveFaction("Order of Our Martyred Lady").id,
    "order_of_our_martyred_lady",
  );
});

check("direct match - third wave Aeldari Corsairs", () => {
  assert.equal(resolveFaction("Aeldari Corsairs").id, "aeldari_corsairs");
});

check("direct match - third wave Triarch Praetorians", () => {
  assert.equal(resolveFaction("Triarch Praetorians").id, "triarch_praetorians");
});

check("direct match - Watson historical Hydra cabal", () => {
  assert.equal(resolveFaction("Hydra").id, "hydra_cabal");
});

check("alias - Space Sharks routes to Carcharodons", () => {
  assert.equal(resolveFaction("Space Sharks").id, "carcharodons");
});

check("alias - Death Korps short form routes to canonical regiment", () => {
  assert.equal(resolveFaction("Death Korps").id, "death_korps_of_krieg");
});

check("alias - Adepta Sororitas routes to sisters_of_battle", () => {
  assert.equal(resolveFaction("Adepta Sororitas").id, "sisters_of_battle");
});

check("alias - Triarch Council routes to Triarch Praetorians", () => {
  assert.equal(resolveFaction("Triarch Council").id, "triarch_praetorians");
});

check("direct match - fourth wave Necromunda mid-node", () => {
  assert.equal(resolveFaction("Necromunda").id, "necromunda");
});

check("direct match - fourth wave House Escher", () => {
  assert.equal(resolveFaction("House Escher").id, "house_escher");
});

check("direct match - fourth wave House Helmawr", () => {
  assert.equal(resolveFaction("House Helmawr").id, "house_helmawr");
});

check("direct match - fourth wave House Ko'iron lore-iconic freq=1", () => {
  assert.equal(resolveFaction("House Ko'iron").id, "house_koiron");
});

check("direct match - fourth wave Necromunda Enforcers", () => {
  assert.equal(resolveFaction("Necromunda Enforcers").id, "necromunda_enforcers");
});

check("direct match - fourth wave Guilders cluster-iconic", () => {
  assert.equal(resolveFaction("Guilders").id, "guilders");
});

check("direct match - fourth wave Last Chancers under astra_militarum", () => {
  assert.equal(resolveFaction("Last Chancers").id, "last_chancers");
});

check("direct match - fourth wave Soul Drinkers Firstborn-Primaris coexistent", () => {
  assert.equal(resolveFaction("Soul Drinkers").id, "soul_drinkers");
});

check("direct match - fourth wave Howling Griffons adeptus_astartes successor", () => {
  assert.equal(resolveFaction("Howling Griffons").id, "howling_griffons");
});

check("direct match - fourth wave House Belisarius Navigator House", () => {
  assert.equal(resolveFaction("House Belisarius").id, "house_belisarius");
});

check("direct match - fifth wave Blood Ravens (Dawn of War chapter, freq=6)", () => {
  assert.equal(resolveFaction("Blood Ravens").id, "blood_ravens");
});

check("direct match - fifth wave Deathwatch (Ordo Xenos chamber militant)", () => {
  assert.equal(resolveFaction("Deathwatch").id, "deathwatch");
});

check("direct match - fifth wave Adeptus Astra Telepathica (freq=2)", () => {
  assert.equal(
    resolveFaction("Adeptus Astra Telepathica").id,
    "adeptus_astra_telepathica",
  );
});

check("direct match - fifth wave Mordian Iron Guard (freq>=2 regiment)", () => {
  assert.equal(resolveFaction("Mordian Iron Guard").id, "mordian_iron_guard");
});

check("direct match - fifth wave Vostroyan Firstborn (freq=1 iconic regiment)", () => {
  assert.equal(resolveFaction("Vostroyan Firstborn").id, "vostroyan_firstborn");
});

check("direct match - fifth wave Tempestus Scions under astra_militarum", () => {
  assert.equal(resolveFaction("Tempestus Scions").id, "tempestus_scions");
});

check("direct match - fifth wave Savlar Chem-Dogs (hyphen surface form)", () => {
  assert.equal(resolveFaction("Savlar Chem-Dogs").id, "savlar_chem_dogs");
});

check("alias - fifth wave Collegia Titanica routes to Adeptus Titanicus", () => {
  assert.equal(resolveFaction("Collegia Titanica").id, "adeptus_titanicus");
});

check("direct match - sixth wave Dragon Warriors (Nihilan's warband, freq=4)", () => {
  assert.equal(resolveFaction("Dragon Warriors").id, "dragon_warriors");
});

check("direct match - sixth wave Red Corsairs (Huron's renegades, freq=4)", () => {
  assert.equal(resolveFaction("Red Corsairs").id, "red_corsairs");
});

check("direct match - sixth wave White Consuls (Ultramarines successor, freq=4)", () => {
  assert.equal(resolveFaction("White Consuls").id, "white_consuls");
});

check("direct match - sixth wave Relictors (radical chapter, freq=3)", () => {
  assert.equal(resolveFaction("Relictors").id, "relictors");
});

check("direct match - sixth wave Blood Gorgons (ex-World Eaters warband, freq=2)", () => {
  assert.equal(resolveFaction("Blood Gorgons").id, "blood_gorgons");
});

check("direct match - sixth wave Doom Eagles (Ultramarines successor, freq=2)", () => {
  assert.equal(resolveFaction("Doom Eagles").id, "doom_eagles");
});

check("direct match - sixth wave Marines Errant (loyalist successor, freq=2)", () => {
  assert.equal(resolveFaction("Marines Errant").id, "marines_errant");
});

check("direct match - sixth wave Legion of the Damned (eponymous novel, freq=1)", () => {
  assert.equal(resolveFaction("Legion of the Damned").id, "legion_of_the_damned");
});

check("alias - sixth wave Tau (no apostrophe) routes to tau", () => {
  assert.equal(resolveFaction("Tau").id, "tau");
});

check("alias - sixth wave Chaos Daemons routes to daemons umbrella", () => {
  assert.equal(resolveFaction("Chaos Daemons").id, "daemons");
});

check("alias - sixth wave Daemons of Tzeentch routes to tzeentch god-faction", () => {
  assert.equal(resolveFaction("Daemons of Tzeentch").id, "tzeentch");
});

check("alias - sixth wave Militarum Tempestus routes to Tempestus Scions", () => {
  assert.equal(resolveFaction("Militarum Tempestus").id, "tempestus_scions");
});

check("direct match - seventh wave Talons of the Emperor (Custodes + Sisters of Silence, freq=3)", () => {
  assert.equal(resolveFaction("Talons of the Emperor").id, "talons_of_the_emperor");
});

check("alias - seventh wave Sisters of Silence routes to Talons of the Emperor", () => {
  assert.equal(resolveFaction("Sisters of Silence").id, "talons_of_the_emperor");
});

check("direct match - seventh wave Senatorum Imperialis (M32 High Lords body, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Senatorum Imperialis").id, "senatorum_imperialis");
});

check("alias - seventh wave The Fallen routes to Fallen Angels (Dark Angels' Fallen Brethren)", () => {
  assert.equal(resolveFaction("The Fallen").id, "fallen_angels");
});

check("alias - seventh wave Craftworld Eldar routes to Aeldari umbrella", () => {
  assert.equal(resolveFaction("Craftworld Eldar").id, "eldar");
});

check("direct match - seventh wave House Chimaeros (Imperial Knight noble house, freq=2)", () => {
  assert.equal(resolveFaction("House Chimaeros").id, "house_chimaeros");
});

check("direct match - seventh wave House Draconis (Imperial Knight noble house, freq=2)", () => {
  assert.equal(resolveFaction("House Draconis").id, "house_draconis");
});

check("alias - seventh wave Striking Scorpions routes to Aeldari umbrella (Aspect-Warrior sub-form)", () => {
  assert.equal(resolveFaction("Striking Scorpions").id, "eldar");
});

check("alias - eighth wave Adeptus Ministorum routes to Ecclesiarchy (freq=11 wave-top surface form)", () => {
  assert.equal(resolveFaction("Adeptus Ministorum").id, "ecclesiarchy");
});

check("alias - eighth wave High Lords of Terra routes to Senatorum Imperialis (M42 governance body)", () => {
  assert.equal(resolveFaction("High Lords of Terra").id, "senatorum_imperialis");
});

check("alias - eighth wave Cadian Shock routes to Cadian Shock Troops regiment", () => {
  assert.equal(resolveFaction("Cadian Shock").id, "cadian_shock_troops");
});

check("alias - eighth wave Officio Prefectus routes to Commissariat (formal institutional name)", () => {
  assert.equal(resolveFaction("Officio Prefectus").id, "commissariat");
});

check("alias - eighth wave Ordo Sepulturum routes to Inquisition umbrella (sub-Ordo)", () => {
  assert.equal(resolveFaction("Ordo Sepulturum").id, "inquisition");
});

check("alias - eighth wave Saim-Hann routes to Aeldari umbrella (Craftworld sub-form)", () => {
  assert.equal(resolveFaction("Saim-Hann").id, "eldar");
});

check("alias - eighth wave Ziasuthra routes to Aeldari umbrella (Iyanden-cluster cross-axis surface)", () => {
  assert.equal(resolveFaction("Ziasuthra").id, "eldar");
});

check("direct match - eighth wave Kroot (T'au auxiliary xenos species, freq=3)", () => {
  assert.equal(resolveFaction("Kroot").id, "kroot");
});

check("direct match - eighth wave Ratlings (Astra Militarum abhuman auxiliaries, freq=3)", () => {
  assert.equal(resolveFaction("Ratlings").id, "ratlings");
});

check("direct match - eighth wave Traitor Guard (renegade Imperial Guard, freq=3, parent=chaos)", () => {
  assert.equal(resolveFaction("Traitor Guard").id, "traitor_guard");
});

check("direct match - eighth wave Lamenters (Blood Angels successor chapter, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Lamenters").id, "lamenters");
});

check("direct match - eighth wave Blood Drinkers (Blood Angels successor chapter, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Blood Drinkers").id, "blood_drinkers");
});

check("direct match - ninth wave Ogryns (Astra Militarum abhuman auxiliaries, freq=2 strict, Baggit-and-Clodde duology)", () => {
  assert.equal(resolveFaction("Ogryns").id, "ogryns");
});

check("direct match - ninth wave Sautekh Dynasty (Necron dynasty grain, freq=1 lore-iconic, Severed)", () => {
  assert.equal(resolveFaction("Sautekh Dynasty").id, "sautekh_dynasty");
});

check("alias - ninth wave Enforcers routes to Adeptus Arbites (Varangantua Crime sub-faction, freq=2 strict)", () => {
  assert.equal(resolveFaction("Enforcers").id, "adeptus_arbites");
});

check("alias - ninth wave Argent Shroud routes to Sisters of Battle (Sororitas preceptory, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Argent Shroud").id, "sisters_of_battle");
});

check("alias - ninth wave Chaos Cultists routes to Chaos umbrella (generic Chaos surface form, freq=1)", () => {
  assert.equal(resolveFaction("Chaos Cultists").id, "chaos");
});

check("alias - ninth wave Chaos Cults routes to Chaos umbrella (generic Chaos surface form, freq=1)", () => {
  assert.equal(resolveFaction("Chaos Cults").id, "chaos");
});

check("alias - tenth wave Luna Wolves routes to Sons of Horus (HH bootstrap Cross-Era faction-rename, freq=2)", () => {
  assert.equal(resolveFaction("Luna Wolves").id, "sons_of_horus");
});

check("alias - tenth wave Mechanicum routes to Adeptus Mechanicus (HH bootstrap Cross-Era pre-reformation name, freq=4)", () => {
  assert.equal(resolveFaction("Mechanicum").id, "mechanicus");
});

check("alias - tenth wave Imperial Army routes to Astra Militarum (HH bootstrap Cross-Era pre-reformation name, freq=2)", () => {
  assert.equal(resolveFaction("Imperial Army").id, "astra_militarum");
});

check("alias - tenth wave Custodes (short form) routes to custodes (alias-confirmation, freq=4)", () => {
  assert.equal(resolveFaction("Custodes").id, "custodes");
});

check("direct match - tenth wave Cabal (xenos conspiracy from Legion, top-level xenos, freq=1 lore-iconic HH bootstrap)", () => {
  assert.equal(resolveFaction("Cabal").id, "cabal");
});

check("direct match - tenth wave Interex (pre-Imperial human civilization from Horus Rising, historical_canon_layer, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Interex").id, "interex");
});

check("direct match - tenth wave Laer (Slaaneshi xenos race from Fulgrim, distinct from laeran location row, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Laer").id, "laer");
});

check("direct match - tenth wave Knights of Taranis (Mars Imperial Knight House from Mechanicum, parent=imperial_knights, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Knights of Taranis").id, "knights_of_taranis");
});

check("direct match - tenth wave Legio Mortis (traitor Titan Legion from Mechanicum, parent=adeptus_titanicus + alignment=chaos, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Legio Mortis").id, "legio_mortis");
});

check("direct match - tenth wave The Order of Caliban (pre-Imperial Caliban knightly order from Descent of Angels, parent=dark_angels, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("The Order of Caliban").id, "order_of_caliban");
});

check("direct match - Resolver-Pass 11 Knights Errant (Malcador's loyalist-Astartes cadre, combined freq=6 across `Knights Errant` + `Knights-Errant`, parent=imperium)", () => {
  assert.equal(resolveFaction("Knights Errant").id, "knights_errant");
});

check("alias - Resolver-Pass 11 Knights-Errant (hyphen variant) routes to knights_errant (7a Case B alias-consolidation, author-style hyphenation)", () => {
  assert.equal(resolveFaction("Knights-Errant").id, "knights_errant");
});

check("alias - Resolver-Pass 11 Daemons of Chaos routes to daemons umbrella (7a Case A — End-and-Death trilogy surface form, parity with Pass-6 Chaos Daemons alias)", () => {
  assert.equal(resolveFaction("Daemons of Chaos").id, "daemons");
});

check("alias - Resolver-Pass 11 Adeptus Mechanicum routes to mechanicus (7a Case C — HH formal-name variant of Pass-10 Mechanicum alias)", () => {
  assert.equal(resolveFaction("Adeptus Mechanicum").id, "mechanicus");
});

check("alias - Resolver-Pass 11 Mechanicus (bare canonical-name-without-Adeptus) routes to mechanicus (7a Case C — second variant)", () => {
  assert.equal(resolveFaction("Mechanicus").id, "mechanicus");
});

check("alias - Resolver-Pass 11 Daemons of Khorne routes to daemons umbrella (sub-faction grain flat-aliased to parent; Phase-1-Decision keeps `khorne_daemons` deferred)", () => {
  assert.equal(resolveFaction("Daemons of Khorne").id, "daemons");
});

check("direct match - Resolver-Pass 11 Lectitio Divinitatus (Emperor-as-god cult, Garro/Keeler-arc foundational, freq=1 lore-iconic, parent=imperium)", () => {
  assert.equal(resolveFaction("Lectitio Divinitatus").id, "lectitio_divinitatus");
});

check("direct match - Resolver-Pass 11 Legio Ignatum (loyalist Titan Legion, Mortis HH-0061, freq=1 lore-iconic, parent=adeptus_titanicus parity)", () => {
  assert.equal(resolveFaction("Legio Ignatum").id, "legio_ignatum");
});

check("direct match - Resolver-Pass 11 Legio Solaria (all-female Princeps Titan Legion, Titandeath HH-0053, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Legio Solaria").id, "legio_solaria");
});

check("direct match - Resolver-Pass 11 Legio Vulpa (traitor Titan Legion, Titandeath HH-0053, alignment=chaos parity with legio_mortis, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Legio Vulpa").id, "legio_vulpa");
});

check("direct match - Resolver-Pass 11 Selenar Gene-Cult (Lunar gene-engineering cult, Sons of Selenar HH-0058, freq=1 lore-iconic)", () => {
  assert.equal(resolveFaction("Selenar Gene-Cult").id, "selenar_gene_cult");
});

check("alias - Resolver-Pass 11 Selenar (short form variant) routes to selenar_gene_cult (7a alias-consolidation, single row + alias per runbook §4)", () => {
  assert.equal(resolveFaction("Selenar").id, "selenar_gene_cult");
});

check("direct match - Resolver-Pass 11 Thunder Warriors (proto-Astartes of Unification Wars, Dreams of Unity HH-0074, freq=1 lore-iconic, tone=historical_canon_layer)", () => {
  assert.equal(resolveFaction("Thunder Warriors").id, "thunder_warriors");
});

check("direct match - Resolver-Pass 11 House Devine (Molech Imperial Knight house, Vengeful Spirit HH-0029, freq=1 lore-iconic, parent=imperial_knights + alignment=chaos)", () => {
  assert.equal(resolveFaction("House Devine").id, "house_devine");
});

check("direct match - Resolver-Pass 11 Sanguinary Guard (Blood Angels honor-guard formation, Echoes of Eternity HH-0063, freq=1 lore-iconic, parent=blood_angels sub-tier)", () => {
  assert.equal(resolveFaction("Sanguinary Guard").id, "sanguinary_guard");
});

check("direct match - Resolver-Pass 12 Rangdan (xenos species, foundational antagonist der Rangdan Xenocides, Alpharius: Head of the Hydra HH-0096, freq=1 lore-iconic, parent=null top-level xenos parity mit cabal/interex/laer)", () => {
  assert.equal(resolveFaction("Rangdan").id, "rangdan");
});

check("direct match - Resolver-Pass 12 Hrud (entropy-aura xenos species, cross-era recurring, Perturabo: The Hammer of Olympia HH-0084 Hrud-Migration-backdrop, freq=1 lore-iconic, parent=null top-level xenos)", () => {
  assert.equal(resolveFaction("Hrud").id, "hrud");
});

check("alias - Resolver-Pass 12 Daemons of Nurgle routes to daemons umbrella (7a Case A — Grandfather's Gift HH-0101, parity mit Pass-11 Daemons of Khorne / Pass-11 Daemons of Chaos: sub-faction-grain flat-aliased to parent, nurgle_daemons-sub-row deferred)", () => {
  assert.equal(resolveFaction("Daemons of Nurgle").id, "daemons");
});

check("alias - Resolver-Pass 12 confirmation Mechanicum still routes to mechanicus (Pass-10 alias chain holds: HH-0121 Corax: Soulforge + HH-0130 Cybernetica re-surface the alias this wave, no row-split)", () => {
  assert.equal(resolveFaction("Mechanicum").id, "mechanicus");
});

check("alias - Resolver-Pass 12 confirmation Knights-Errant hyphen variant still routes to knights_errant (Pass-11 alias chain holds: HH-0130 Cybernetica + HH-0134 Garro: Vow of Faith re-surface the alias this wave)", () => {
  assert.equal(resolveFaction("Knights-Errant").id, "knights_errant");
});

check("direct match - Resolver-Pass 13 Crusader Host (cross-Legion Imperial Terra-delegation organ, Luna Mendax HH-0176 + Riven HH-0177, freq=2 strict, parent=imperium)", () => {
  assert.equal(resolveFaction("Crusader Host").id, "crusader_host");
});

check("direct match - Resolver-Pass 13 Serpent Cult (House Devine internal chaos cult on Molech, The Devine Adoratrice HH-0182 + Wolf Mother HH-0195, freq=2 strict, parent=house_devine sub-tier)", () => {
  assert.equal(resolveFaction("Serpent Cult").id, "serpent_cult");
});

check("direct match - Resolver-Pass 13 Therion Cohort (Imperial Army elite regiment cross-arc with marcus_valerius spine, The Divine Word HH-0171, freq=1 lore-iconic, parent=astra_militarum named-regiment-Tier)", () => {
  assert.equal(resolveFaction("Therion Cohort").id, "therion_cohort");
});

check("direct match - Resolver-Pass 13 Davinite Lodge (pre-Imperial Davin chaos cult Erebus uses for Horus corruption in False Gods HH-0002, surfaced in Twisted HH-0196, parent=chaos)", () => {
  assert.equal(resolveFaction("Davinite Lodge").id, "davinite_lodge");
});

check("alias - Resolver-Pass 13 Davinite Serpent Lodge (Serpent HH-0175 Thoros-priest vignette) routes to davinite_lodge (7a Case A — single-row + alias per runbook §4 Surface-Form-Treue, same Davin cult two surface-form variants)", () => {
  assert.equal(resolveFaction("Davinite Serpent Lodge").id, "davinite_lodge");
});

check("alias - Resolver-Pass 13 confirmation Luna Wolves still routes to sons_of_horus (Pass-10 cross-era rename anchor exhaustively re-surfaced in HH-0179 The Wolf of Ash and Fire + HH-0188 Brotherhood of the Moon, no row-split)", () => {
  assert.equal(resolveFaction("Luna Wolves").id, "sons_of_horus");
});

check("alias - Resolver-Pass 13 confirmation Imperial Army still routes to astra_militarum (Pass-10 alias holds: HH-0149 Echoes of Revelation + HH-0198 Tallarn: Witness re-surface the alias this wave)", () => {
  assert.equal(resolveFaction("Imperial Army").id, "astra_militarum");
});

check("direct match - Resolver-Pass 14 Ordo Sinister (Mechanicum pariah-princeps psi-titan sub-org defending the Imperial Webway, Ordo Sinister HH-0215, freq=1 lore-iconic, parent=mechanicus)", () => {
  assert.equal(resolveFaction("Ordo Sinister").id, "ordo_sinister");
});

check("direct match - Resolver-Pass 14 Legio Audax (the Ember Wolves traitor Titan Legion, The Ember Wolves HH-0216 POV-Legion, freq=1 lore-iconic, parent=adeptus_titanicus alignment=chaos parity with legio_mortis/legio_vulpa)", () => {
  assert.equal(resolveFaction("Legio Audax").id, "legio_audax");
});

check("direct match - Resolver-Pass 14 Legio Castigatra (loyalist Titan Legion antagonist to Audax in the Ember Wolves duel, HH-0216, freq=1 lore-iconic paired Titan-vs-Titan promotion, parent=adeptus_titanicus alignment=imperium parity with legio_ignatum/legio_solaria)", () => {
  assert.equal(resolveFaction("Legio Castigatra").id, "legio_castigatra");
});

check("direct match - Resolver-Pass 14 Legio Cybernetica (Mechanicum Kastelan-robot sub-org, Myriad HH-0209 Mars loyalist guerrilla cell direct sequel to the Cybernetica novel, freq=1 lore-iconic, parent=mechanicus)", () => {
  assert.equal(resolveFaction("Legio Cybernetica").id, "legio_cybernetica");
});

check("direct match - Resolver-Pass 14 Blackshields (catch-all Heresy-era mixed-/renegade-Legion Astartes warband category, Blackshield HH-0208 Crysos Morturg POV, freq=1 lore-iconic + future-proof for the Endryd-Haar sub-arc surfacing 36 books later at HH-0286, parent=null no alignment)", () => {
  assert.equal(resolveFaction("Blackshields").id, "blackshields");
});

check("alias-consolidation - Resolver-Pass 14 House Taranis routes to knights_of_taranis (HH-0227 The Lightning Hall — same Mars-based Imperial Knight House as the Pass-10 knights_of_taranis canonical row from HH-0009 Mechanicum, two surface-form variants per runbook §4 Surface-Form-Treue, identity-coherence overrides naïve row creation)", () => {
  assert.equal(resolveFaction("House Taranis").id, "knights_of_taranis");
});

check("alias - Resolver-Pass 14 confirmation Knights-Errant hyphen variant still routes to knights_errant (Pass-11 alias chain holds — wave's highest-frequency faction alias with 6 hits across HH-0226/HH-0228/HH-0244/HH-0246/HH-0247/HH-0248, Garro/Eisenstein audio-drama bloc anchors it exhaustively)", () => {
  assert.equal(resolveFaction("Knights-Errant").id, "knights_errant");
});

check("alias - Resolver-Pass 14 confirmation Mechanicum still routes to mechanicus (Pass-10 alias holds: HH-0209 Myriad + HH-0210 Into Exile re-surface the alias this wave)", () => {
  assert.equal(resolveFaction("Mechanicum").id, "mechanicus");
});

check("direct match - Resolver-Pass 15 Officio Sigillite (Malcador's Imperial-civil/Intelligence apparatus, namesake audio drama The Sigillite HH-0252, freq=1 lore-iconic, parent=imperium parity with knights_errant — Malcador wave-top character surface freq=7 closes the org-tier lore loop)", () => {
  assert.equal(resolveFaction("Officio Sigillite").id, "officio_sigillite");
});

check("direct match - Resolver-Pass 15 Legio Praesagius (loyalist Titan Legion the True Messengers, Honour to the Dead HH-0253 Calth/Ithraca, freq=1 lore-iconic, parent=adeptus_titanicus parity with legio_ignatum/legio_solaria/legio_castigatra/legio_cybernetica)", () => {
  assert.equal(resolveFaction("Legio Praesagius").id, "legio_praesagius");
});

check("direct match - Resolver-Pass 15 Adeptus Administratum (Imperial-civilian bureaucracy, cumulative cross-pass freq-2 promotion Pass-14 HH-0224 Abyssal + Pass-15 HH-0263 Garro: Shield of Lies, parent=imperium parity with senatorum_imperialis)", () => {
  assert.equal(resolveFaction("Adeptus Administratum").id, "adeptus_administratum");
});

check("alias - Resolver-Pass 15 Administratum (short form) routes to adeptus_administratum (Authority-Layer-Pragmatik: kurze und lange Form derselben Org, runbook §4 Surface-Form-Treue analog Mechanicum/Adeptus-Mechanicum-Pair)", () => {
  assert.equal(resolveFaction("Administratum").id, "adeptus_administratum");
});

check("alias - Resolver-Pass 15 confirmation Luna Wolves still routes to sons_of_horus (Pass-10 cross-era rename anchor exhaustively re-surfaced in HH-0254 Wolf Hunt + HH-0291 Collected Visions artbook + HH-0294 Visions of Heresy 2018 ed., no row-split)", () => {
  assert.equal(resolveFaction("Luna Wolves").id, "sons_of_horus");
});

check("alias - Resolver-Pass 15 confirmation Imperial Army still routes to astra_militarum (Pass-10 alias holds: HH-0252 The Sigillite + HH-0255 Censure re-surface the alias this wave)", () => {
  assert.equal(resolveFaction("Imperial Army").id, "astra_militarum");
});

check("alias - Resolver-Pass 15 confirmation Knights-Errant (hyphen) still routes to knights_errant (Pass-11 alias holds — wave's 2017 Garro re-issue trio HH-0271/HH-0272/HH-0273 anchors it exhaustively, plus Knights Errant direct freq=2 HH-0263/HH-0268)", () => {
  assert.equal(resolveFaction("Knights-Errant").id, "knights_errant");
});

console.log("\nresolveLocation");

check("direct match - existing canonical Terra", () => {
  assert.equal(resolveLocation("Terra").id, "terra");
});

check("direct match - existing canonical The Great Rift", () => {
  assert.equal(resolveLocation("The Great Rift").id, "great_rift");
});

check("alias - Great Rift routes to existing row", () => {
  assert.equal(resolveLocation("Great Rift").id, "great_rift");
});

check("alias - Cicatrix Maledictum routes to Great Rift", () => {
  assert.equal(resolveLocation("Cicatrix Maledictum").id, "great_rift");
});

check("direct match - Ultramar region", () => {
  assert.equal(resolveLocation("Ultramar").id, "ultramar");
});

check("direct match - Imperium Nihilus era frame", () => {
  assert.equal(resolveLocation("Imperium Nihilus").id, "imperium_nihilus");
});

check("direct match - Elara's Veil", () => {
  assert.equal(resolveLocation("Elara's Veil").id, "elaras_veil");
});

check("direct match - Casus Belli vessel", () => {
  assert.equal(resolveLocation("Casus Belli").id, "casus_belli");
});

check("direct match - Solace vessel", () => {
  assert.equal(resolveLocation("Solace").id, "solace");
});

check("direct match - Black Library place", () => {
  assert.equal(resolveLocation("Black Library").id, "black_library_place");
});

check("direct match - Iyanden location axis", () => {
  assert.equal(resolveLocation("Iyanden").id, "iyanden");
});

check("unknown - fabricated world stays null", () => {
  assert.equal(resolveLocation("Atoll Verloren").id, null);
});

check("direct match - third wave Bale Stars era frame", () => {
  assert.equal(resolveLocation("Bale Stars").id, "bale_stars");
});

check("direct match - third wave Stalinvast historical layer", () => {
  assert.equal(resolveLocation("Stalinvast").id, "stalinvast");
});

check("direct match - third wave Cepharil", () => {
  assert.equal(resolveLocation("Cepharil").id, "cepharil");
});

check("direct match - third wave Steel Tread vessel", () => {
  assert.equal(resolveLocation("Steel Tread").id, "steel_tread");
});

check("alias - Dark City routes to Commorragh", () => {
  assert.equal(resolveLocation("Dark City").id, "commorragh");
});

check("alias - Serenade routes to Cepharil", () => {
  assert.equal(resolveLocation("Serenade").id, "cepharil");
});

check("direct match - fourth wave Hive Primus Necromunda sub-location", () => {
  assert.equal(resolveLocation("Hive Primus").id, "hive_primus");
});

check("direct match - fourth wave Underhive region-tier", () => {
  assert.equal(resolveLocation("Underhive").id, "underhive");
});

check("direct match - fourth wave The Spire Necromunda upper-hive", () => {
  assert.equal(resolveLocation("The Spire").id, "spire");
});

check("direct match - fourth wave Junktion eponymous setting", () => {
  assert.equal(resolveLocation("Junktion").id, "junktion");
});

check("direct match - fourth wave The Fang Space Wolves monastery", () => {
  assert.equal(resolveLocation("The Fang").id, "fang");
});

check("direct match - fourth wave Asaheim Fenris continent", () => {
  assert.equal(resolveLocation("Asaheim").id, "asaheim");
});

check("direct match - fourth wave Planet of the Sorcerers Thousand Sons daemon world", () => {
  assert.equal(resolveLocation("Planet of the Sorcerers").id, "planet_of_the_sorcerers");
});

check("direct match - fourth wave Gothic Sector region", () => {
  assert.equal(resolveLocation("Gothic Sector").id, "gothic_sector");
});

check("direct match - fourth wave Shadow Point Gothic War", () => {
  assert.equal(resolveLocation("Shadow Point").id, "shadow_point");
});

check("direct match - fourth wave The Phalanx Imperial Fists star-fort", () => {
  assert.equal(resolveLocation("The Phalanx").id, "phalanx");
});

check("alias - fourth wave lowercase the Phalanx routes to phalanx", () => {
  assert.equal(resolveLocation("the Phalanx").id, "phalanx");
});

check("direct match - fourth wave Hydraphur Calpurnia fortress system in Pacificus", () => {
  assert.equal(resolveLocation("Hydraphur").id, "hydraphur");
});

check("direct match - fourth wave Selaaca Soul Drinkers", () => {
  assert.equal(resolveLocation("Selaaca").id, "selaaca");
});

check("alias - fourth wave Tau Empire space routes to tau_empire", () => {
  assert.equal(resolveLocation("Tau Empire space").id, "tau_empire");
});

check("unresolved - fourth wave Imperium-as-Location cross-axis frame stays null", () => {
  assert.equal(resolveLocation("Imperium").id, null);
});

check("direct match - fifth wave Golgotha (Gunheads war world, freq=2)", () => {
  assert.equal(resolveLocation("Golgotha").id, "golgotha");
});

check("direct match - fifth wave Sin of Damnation (space hulk vessel)", () => {
  assert.equal(resolveLocation("Sin of Damnation").id, "sin_of_damnation");
});

check("direct match - fifth wave Tartarus (Dawn of War, freq=2)", () => {
  assert.equal(resolveLocation("Tartarus").id, "tartarus");
});

check("direct match - fifth wave Solemnus (Black Templars homeworld)", () => {
  assert.equal(resolveLocation("Solemnus").id, "solemnus");
});

check("direct match - fifth wave Danik's World (apostrophe surface form)", () => {
  assert.equal(resolveLocation("Danik's World").id, "daniks_world");
});

check("direct match - sixth wave Orath (Plagues of Orath warzone, freq=4)", () => {
  assert.equal(resolveLocation("Orath").id, "orath");
});

check("direct match - sixth wave Dal'yth (T'au septworld, apostrophe surface form)", () => {
  assert.equal(resolveLocation("Dal'yth").id, "dalyth");
});

check("direct match - sixth wave Sanctuary 101 (Necron massacre site, numeric id)", () => {
  assert.equal(resolveLocation("Sanctuary 101").id, "sanctuary_101");
});

check("direct match - sixth wave Cryptus (Shield of Baal system, Case G primary)", () => {
  assert.equal(resolveLocation("Cryptus").id, "cryptus");
});

check("alias - sixth wave Cryptus System routes to cryptus (Case G)", () => {
  assert.equal(resolveLocation("Cryptus System").id, "cryptus");
});

check("alias - sixth wave the Maelstrom routes to maelstrom (warp-region gap-fix)", () => {
  assert.equal(resolveLocation("the Maelstrom").id, "maelstrom");
});

check("direct match - seventh wave Ullanor (Beast Arises M32 throneworld of orks, freq=5)", () => {
  assert.equal(resolveLocation("Ullanor").id, "ullanor");
});

check("direct match - seventh wave Alaitoc (Craftworld, Path of the Eldar trilogy, freq=4)", () => {
  assert.equal(resolveLocation("Alaitoc").id, "alaitoc");
});

check("direct match - seventh wave Velchanos Magna (Forge World, Sanders Mechanicus trilogy, freq=3)", () => {
  assert.equal(resolveLocation("Velchanos Magna").id, "velchanos_magna");
});

check("direct match - seventh wave Adrastapol (Imperial Knight noble homeworld, freq=2)", () => {
  assert.equal(resolveLocation("Adrastapol").id, "adrastapol");
});

check("direct match - seventh wave The Rock (Dark Angels mobile fortress-monastery, freq=2)", () => {
  assert.equal(resolveLocation("The Rock").id, "rock");
});

check("direct match - seventh wave Phall (Beast Arises Imperial Navy contested system, freq=2)", () => {
  assert.equal(resolveLocation("Phall").id, "phall");
});

check("direct match - seventh wave Mistral (Yarrick Hades-class hive world, freq=2)", () => {
  assert.equal(resolveLocation("Mistral").id, "mistral");
});

check("direct match - seventh wave Inwit (Imperial Fists homeworld, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Inwit").id, "inwit");
});

check("direct match - seventh wave Ulthwe (Craftworld, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Ulthwe").id, "ulthwe");
});

check("direct match - seventh wave Baal Secundus (Blood Angels recruitment moon, distinct row from baal, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Baal Secundus").id, "baal_secundus");
});

check("direct match - eighth wave Blackstone Fortress (Hinks' eponymous artefact-fortress, freq=3)", () => {
  assert.equal(resolveLocation("Blackstone Fortress").id, "blackstone_fortress");
});

check("direct match - eighth wave Precipice (free-trade outpost docked to Blackstone Fortress, freq=3)", () => {
  assert.equal(resolveLocation("Precipice").id, "precipice");
});

check("direct match - eighth wave Crannog Mons (Cadian feature, Cadian Saga, freq=2)", () => {
  assert.equal(resolveLocation("Crannog Mons").id, "crannog_mons");
});

check("direct match - eighth wave Malouri (Cadian feature, Cadian Saga, freq=2)", () => {
  assert.equal(resolveLocation("Malouri").id, "malouri");
});

check("direct match - eighth wave Almace (Cardinal world, Charadon Crusade target, freq=1 lore-iconic M42)", () => {
  assert.equal(resolveLocation("Almace").id, "almace");
});

check("direct match - eighth wave Thennos (Iron Hands forge moon, Eye of Medusa, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Thennos").id, "thennos");
});

check("direct match - eighth wave Saim-Hann (Aeldari craftworld, location-axis row; faction-axis aliases to eldar)", () => {
  assert.equal(resolveLocation("Saim-Hann").id, "saim_hann");
});

check("direct match - ninth wave Varangantua (Warhammer Crime hive city, master Crime setting, freq=10 wave-top surface form)", () => {
  assert.equal(resolveLocation("Varangantua").id, "varangantua");
});

check("direct match - ninth wave Alecto (Sector grain containing Varangantua, freq=8)", () => {
  assert.equal(resolveLocation("Alecto").id, "alecto");
});

check("direct match - ninth wave Antikef (Necron crownworld, Twice-Dead King trilogy + omnibus, freq=3)", () => {
  assert.equal(resolveLocation("Antikef").id, "antikef");
});

check("direct match - ninth wave Sedh (Necron-adjacent world to Antikef, Twice-Dead King cluster, freq=2)", () => {
  assert.equal(resolveLocation("Sedh").id, "sedh");
});

check("direct match - ninth wave Anaxian Line (Dawn-of-Fire strategic region, Iron Kingdom + Hand of Abaddon, freq=2)", () => {
  assert.equal(resolveLocation("Anaxian Line").id, "anaxian_line");
});

check("direct match - ninth wave Hive Blackbracken (King of Pigs + Resting Places anthology, freq=2)", () => {
  assert.equal(resolveLocation("Hive Blackbracken").id, "hive_blackbracken");
});

check("direct match - ninth wave Imperial Palace (Terra sub-location, Lord of the Fallen, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Imperial Palace").id, "imperial_palace");
});

check("direct match - tenth wave Istvaan III (HH bootstrap Heresy virus-bombing world, two-t convention analog to istvaan_v, freq=2)", () => {
  assert.equal(resolveLocation("Istvaan III").id, "istvaan_iii");
});

check("alias - tenth wave Isstvan III routes to istvaan_iii (doubled-s spelling variant analog to Isstvan V → istvaan_v)", () => {
  assert.equal(resolveLocation("Isstvan III").id, "istvaan_iii");
});

check("direct match - tenth wave Istvaan System (Heresy system grain, parent of istvaan_iii + istvaan_v, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Istvaan System").id, "istvaan_system");
});

check("direct match - tenth wave Colchis (Word Bearers homeworld, The First Heretic, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Colchis").id, "colchis");
});

check("direct match - tenth wave Monarchia (Word Bearers Perfect City on Khur, The First Heretic burning pivot, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Monarchia").id, "monarchia");
});

check("direct match - tenth wave Khur (Word Bearers world hosting Monarchia, The First Heretic, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Khur").id, "khur");
});

check("direct match - tenth wave Nikaea (Council of Nikaea psyker-trial moment, A Thousand Sons, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Nikaea").id, "nikaea");
});

check("direct match - tenth wave Deliverance (Raven Guard homeworld moon, Deliverance Lost, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Deliverance").id, "deliverance");
});

check("direct match - tenth wave Aghoru (Thousand Sons tomb-world archaeological expedition, A Thousand Sons, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Aghoru").id, "aghoru");
});

check("direct match - tenth wave Laeran (Slaaneshi coral-world distinct from laer faction row, Fulgrim, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Laeran").id, "laeran");
});

check("direct match - tenth wave Diamat (Mechanicum / Iron Hands battle-world Heresy strategic anchor, Fallen Angels, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Diamat").id, "diamat");
});

check("direct match - Resolver-Pass 11 Sol System (system grain parent of Terra/Mars/Luna/Pluto, Siege-of-Terra arc, freq=4 strict)", () => {
  assert.equal(resolveLocation("Sol System").id, "sol_system");
});

check("direct match - Resolver-Pass 11 Vengeful Spirit (Warmaster's flagship vessel, tags=['vessel'] gx/gy=null per runbook §3 Phase 2 vessel-convention, freq=4 strict)", () => {
  assert.equal(resolveLocation("Vengeful Spirit").id, "vengeful_spirit");
});

check("direct match - Resolver-Pass 11 Lion's Gate Spaceport (Terra sub-locale, Siege-of-Terra battlefield Lost-and-Damned/First-Wall, freq=3 strict)", () => {
  assert.equal(resolveLocation("Lion's Gate Spaceport").id, "lions_gate_spaceport");
});

check("direct match - Resolver-Pass 11 Chondax (White Scars war-world, Scars/Legacies-of-Betrayal, freq=2 strict)", () => {
  assert.equal(resolveLocation("Chondax").id, "chondax");
});

check("direct match - Resolver-Pass 11 Molech (Imperial Knight world, Vengeful Spirit House-Devine pivot, freq=2 strict)", () => {
  assert.equal(resolveLocation("Molech").id, "molech");
});

check("direct match - Resolver-Pass 11 Pluto (Sol-System outpost, Praetorian-of-Dorn / Solar-War, freq=2 strict)", () => {
  assert.equal(resolveLocation("Pluto").id, "pluto");
});

check("direct match - Resolver-Pass 11 Tallarn (Iron Warriors siege-world per eponymous anthology HH-0045, freq=2 strict)", () => {
  assert.equal(resolveLocation("Tallarn").id, "tallarn");
});

check("direct match - Resolver-Pass 11 Nuceria (Angron's homeworld + Daemonhood-pivot from Betrayer HH-0024, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Nuceria").id, "nuceria");
});

check("direct match - Resolver-Pass 11 Signus Prime (Blood Angels Signus Trial from Fear to Tread HH-0021, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Signus Prime").id, "signus_prime");
});

check("direct match - Resolver-Pass 11 Pythos (eponymous Damnation-of-Pythos HH-0030 Iron Hands remnants world, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Pythos").id, "pythos");
});

check("direct match - Resolver-Pass 11 Iydris (Eldar maiden-world climax of Angel Exterminatus HH-0023, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Iydris").id, "iydris");
});

check("direct match - Resolver-Pass 11 Nostramo (Night Lords homeworld, Curze-pre-Heresy destroyed parity with caliban, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Nostramo").id, "nostramo");
});

check("direct match - Resolver-Pass 11 Armatura (World Eaters training world from Betrayer HH-0024, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Armatura").id, "armatura");
});

check("direct match - Resolver-Pass 11 Beta-Garmon (Titandeath system from Titandeath HH-0053 largest-Titan-engagement-of-Heresy, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Beta-Garmon").id, "beta_garmon");
});

check("direct match - Resolver-Pass 11 Saturnine Gate (eponymous Saturnine HH-0059 Imperial Palace sub-location, freq=1 lore-iconic Siege-of-Terra sub-locale)", () => {
  assert.equal(resolveLocation("Saturnine Gate").id, "saturnine_gate");
});

check("direct match - Resolver-Pass 11 Golden Throne (End-and-the-Death HH-0067 Imperial Palace inner-sanctum, freq=1 lore-iconic Siege-of-Terra sub-locale)", () => {
  assert.equal(resolveLocation("Golden Throne").id, "golden_throne");
});

check("direct match - Resolver-Pass 11 Sanctum Imperialis (End-and-the-Death HH-0067 Imperial Palace inner-Throne-chamber, freq=1 lore-iconic Siege-of-Terra sub-locale)", () => {
  assert.equal(resolveLocation("Sanctum Imperialis").id, "sanctum_imperialis");
});

check("direct match - Resolver-Pass 12 Galaspar (Mortarion: The Pale King HH-0098 + Scions of the Emperor HH-0093 — The-Order-tyranny target world, freq=2 strict)", () => {
  assert.equal(resolveLocation("Galaspar").id, "galaspar");
});

check("direct match - Resolver-Pass 12 Olympia (Perturabo's homeworld, Perturabo: The Hammer of Olympia HH-0084, freq=1 Primarch-birthworld lore-iconic)", () => {
  assert.equal(resolveLocation("Olympia").id, "olympia");
});

check("direct match - Resolver-Pass 12 Barbarus (Mortarion's homeworld, Mortarion: The Pale King HH-0098, freq=1 Primarch-birthworld lore-iconic)", () => {
  assert.equal(resolveLocation("Barbarus").id, "barbarus");
});

check("direct match - Resolver-Pass 12 Cthonia (Horus's homeworld, Blood of the Emperor HH-0097, freq=1 Primarch-birthworld lore-iconic)", () => {
  assert.equal(resolveLocation("Cthonia").id, "cthonia");
});

check("direct match - Resolver-Pass 12 Kiavahr (Raven Guard parent-world of moon Deliverance, Corax: Lord of Shadows HH-0091, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Kiavahr").id, "kiavahr");
});

check("direct match - Resolver-Pass 12 Thramas Sector (Dark Angels vs Night Lords Thramas Crusade sector, Prince of Crows HH-0124, freq=1 lore-iconic sector-grain)", () => {
  assert.equal(resolveLocation("Thramas Sector").id, "thramas_sector");
});

check("direct match - Resolver-Pass 12 Urgall Depression (Isstvan V Dropsite Massacre landing-zone sub-location, Scorched Earth HH-0122, freq=1 lore-iconic, parallel to Pass-11 Lion's Gate Spaceport sub-location grain)", () => {
  assert.equal(resolveLocation("Urgall Depression").id, "urgall_depression");
});

check("direct match - Resolver-Pass 12 Occluda Noctis (Rogal Dorn pre-Heresy operational frontier beyond Northern Major Warp Storm, Rogal Dorn: The Emperor's Crusader HH-0099, freq=1 lore-iconic)", () => {
  assert.equal(resolveLocation("Occluda Noctis").id, "occluda_noctis");
});

check("direct match - Resolver-Pass 12 Desh'ea (Angron's first scene with World Eaters / Kharn, Angron HH-0138, freq=1 lore-iconic, apostrophe-stripped slug parity with Ka'Bandha → ka_bandha)", () => {
  assert.equal(resolveLocation("Desh'ea").id, "deshea");
});

check("direct match - Resolver-Pass 12 Alaxxes Nebula (White Scars vs Alpha Legion ambush site, Wolf King HH-0131, cross-pass cumulative freq 2 with Pass-11 HH-0028 Scars — Pass-11-deferred, Pass-12-promotes)", () => {
  assert.equal(resolveLocation("Alaxxes Nebula").id, "alaxxes_nebula");
});

check("direct match - Resolver-Pass 12 Constanix II (Mechanicum forge world, Corax: Soulforge HH-0121, freq=1 lore-iconic forge-world grain)", () => {
  assert.equal(resolveLocation("Constanix II").id, "constanix_ii");
});

check("alias - Resolver-Pass 12 Lycaeus routes to deliverance (7a Case D — pre-Liberation Mechanicum-era name for the moon that becomes Deliverance after Corax's slave uprising, Ravenlord HH-0127, era-rename onto post-rename canonical row pattern-parallel to Luna-Wolves-→-Sons-of-Horus)", () => {
  assert.equal(resolveLocation("Lycaeus").id, "deliverance");
});

check("alias - Resolver-Pass 12 Phall System routes to phall (7a Case E — system-grain surface for the warp-route collision site, The Crimson Fist HH-0125, flat alias to existing phall canonical row per runbook §4 budget-conservatism)", () => {
  assert.equal(resolveLocation("Phall System").id, "phall");
});

check("direct match - Resolver-Pass 13 Terathalion (strict freq-2 promotion across Blades of the Traitor HH-0144 and Daemonology HH-0183, Heresy-era Mortarion/Death-Guard compliance-warp-locale)", () => {
  assert.equal(resolveLocation("Terathalion").id, "terathalion");
});

check("direct match - Resolver-Pass 13 Titan (curated freq-1 lore-iconic, Saturn moon Sol-System sub-locale staging Dorn/Qruze/Solomon-Voss execution argument in The Last Remembrancer HH-0160)", () => {
  assert.equal(resolveLocation("Titan").id, "titan");
});

check("direct match - Resolver-Pass 13 Hy Brasil (curated freq-1 lore-iconic Terran hive site of Dan Abnett Custodes Heresy debut Blood Games HH-0150)", () => {
  assert.equal(resolveLocation("Hy Brasil").id, "hy_brasil");
});

check("direct match - Resolver-Pass 13 Schadenhold (curated freq-1 lore-iconic Iron Warriors loyalist fortress on Lesser Damantyne where Barabas Dantioch stands in The Iron Within HH-0164)", () => {
  assert.equal(resolveLocation("Schadenhold").id, "schadenhold");
});

check("direct match - Resolver-Pass 13 Lesser Damantyne (curated freq-1 lore-iconic Iron-Warriors-loyalist outpost world hosting Schadenhold in The Iron Within HH-0164)", () => {
  assert.equal(resolveLocation("Lesser Damantyne").id, "lesser_damantyne");
});

check("direct match - Resolver-Pass 13 Iron Blood (curated freq-1 lore-iconic vessel-grain — Perturabo's Iron Warriors flagship after Eye-of-Terror passage in Black Oculus HH-0194)", () => {
  assert.equal(resolveLocation("Iron Blood").id, "iron_blood");
});

check("direct match - Resolver-Pass 13 Molech's Enlightenment (curated freq-1 lore-iconic vessel-grain House Devine Knight-vessel staging Alivia Sureka + Severian counter-cult arc in Wolf Mother HH-0195)", () => {
  assert.equal(resolveLocation("Molech's Enlightenment").id, "molechs_enlightenment");
});

check("direct match - Resolver-Pass 13 Ring of Iron (curated freq-1 lore-iconic Mars-orbit Dark Mechanicum installation in Vorax HH-0186)", () => {
  assert.equal(resolveLocation("Ring of Iron").id, "ring_of_iron");
});

check("alias - Resolver-Pass 13 Signus Cluster routes to signus_prime (7d region-vs-world grain — flat alias-to-world per dossier-recommended budget conservatism, parallel to Pass-11/12 cluster/sector flat-grain handling, Lost Sons HH-0169)", () => {
  assert.equal(resolveLocation("Signus Cluster").id, "signus_prime");
});

check("direct match - Resolver-Pass 14 Chemos (Fulgrim's Primarch homeworld, The Last Phoenix HH-0233 omnibus surface, freq=1 lore-iconic Primarch-homeworld grain parity with barbarus/caliban/colchis/nuceria/prospero)", () => {
  assert.equal(resolveLocation("Chemos").id, "chemos");
});

check("direct match - Resolver-Pass 14 Macragge's Honour (Ultramarines flagship vessel-grain, Illyrium HH-0238, freq=1 lore-iconic, parity with iron_blood/molechs_enlightenment vessel rows, tags=['vessel'] gx/gy=null)", () => {
  assert.equal(resolveLocation("Macragge's Honour").id, "macragges_honour");
});

check("direct match - Resolver-Pass 14 Irkalla (Sisters of Silence Black Ship vessel-grain, Abyssal HH-0224 civilian-POV-inside-Black-Ship, freq=1 lore-iconic, tags=['vessel'] gx/gy=null)", () => {
  assert.equal(resolveLocation("Irkalla").id, "irkalla");
});

check("direct match - Resolver-Pass 14 Imperial Webway (Emperor's hidden Webway project under Terra, Ordo Sinister HH-0215, freq=1 lore-iconic Heresy-era mega-engineering construct, parent=null region/construct grain — not planet, not vessel)", () => {
  assert.equal(resolveLocation("Imperial Webway").id, "imperial_webway");
});

check("direct match - Resolver-Pass 14 Albia (Terran sub-region, Eater of Dreams HH-0228 Albian Land surface, freq=1 lore-iconic Terran region grain, sector=solar)", () => {
  assert.equal(resolveLocation("Albia").id, "albia");
});

check("direct match - Resolver-Pass 14 Illyrium (Macragge province sub-locale, Illyrium HH-0238 namesake audio-drama, freq=1 lore-iconic Ultramar/Macragge sub-locale grain, sector=ultima)", () => {
  assert.equal(resolveLocation("Illyrium").id, "illyrium");
});

check("direct match - Resolver-Pass 14 Jupiter (Sol-system planet, The Serpent's Dance HH-0226 Jovian shipyards surface, freq=1 lore-iconic Sol-system locale parity with Pass-? mars/luna/terra)", () => {
  assert.equal(resolveLocation("Jupiter").id, "jupiter");
});

check("direct match - Resolver-Pass 14 Astagar (cumulative cross-pass freq-2 promotion — Pass-13 HH-0141 Sedition's Gate + Pass-14 HH-0217 The Laurel of Defiance, 7d cumulative-cross-pass case, parallel to Pass-13 cross-pass consolidation pattern)", () => {
  assert.equal(resolveLocation("Astagar").id, "astagar");
});

check("alias - Resolver-Pass 14 Phalanx routes to phalanx (HH-0247 Burden of Duty bare-name surface form for the existing 'The Phalanx' canonical row — Imperial-Fists star-fortress / mobile fortress-monastery vessel-grain, tags=['vessel'] confirmed; parallel to existing 'the Phalanx' lowercase-article alias)", () => {
  assert.equal(resolveLocation("Phalanx").id, "phalanx");
});

check("alias - Resolver-Pass 14 Laer routes to laeran (7a-pattern alias-consolidation — The Last Phoenix HH-0233 omnibus surfaces bare 'Laer' for the existing Laeran world canonical row, identity-coherence override of dossier-7c naïve row-creation recommendation per runbook §4 'eine kanonische Identität = eine Canonical-Row')", () => {
  assert.equal(resolveLocation("Laer").id, "laeran");
});

check("alias - Resolver-Pass 15 Solar System routes to sol_system (7a Case L1 — spacing-variant of the canonical 'Sol System' surface form, HH-0271 Garro: Ashes of Fealty, identity-equivalence floor-case alias add per runbook §4)", () => {
  assert.equal(resolveLocation("Solar System").id, "sol_system");
});

check("alias - Resolver-Pass 15 Planet of Sorcerers routes to planet_of_the_sorcerers (identity-coherence override of dossier-7c branch-(a) Sortiarius-row-creation recommendation per runbook §4 'eine kanonische Identität = eine Canonical-Row' — the existing W40K canonical row planet_of_the_sorcerers already covers this Thousand-Sons daemon-world identity; HH-0256 Thief of Revelations + HH-0258 Lucius: The Eternal Blade strict freq-2 within-batch surfaces the descriptive-without-the variant, parallel to Pass-14 Laer → laeran pattern)", () => {
  assert.equal(resolveLocation("Planet of Sorcerers").id, "planet_of_the_sorcerers");
});

check("direct match - Resolver-Pass 15 Pharos (curated freq=1 lore-iconic — the Heart of the Pharos HH-0278 Sotha-Pharos-beacon sub-locale, foundational Heresy-era Ultramarines-Sotha-defense arc, parent grain sotha)", () => {
  assert.equal(resolveLocation("Pharos").id, "pharos");
});

check("alias - Resolver-Pass 15 Mount Pharos routes to pharos (companion alias to the new pharos row — bare 'Pharos' is the lore-canonical short form, 'Mount Pharos' is the in-this-wave surface variant from HH-0278, descriptive-variant alias closes the surface-form gap per runbook §4)", () => {
  assert.equal(resolveLocation("Mount Pharos").id, "pharos");
});

check("direct match - Resolver-Pass 15 Sicarus (curated freq=1 lore-iconic — Word Bearers daemon-world in the Eye of Terror, namesake-driven HH-0280 Children of Sicarus, foundational Heresy-Word-Bearers post-Heresy throneworld, daemon-world grain parallel to planet_of_the_sorcerers)", () => {
  assert.equal(resolveLocation("Sicarus").id, "sicarus");
});

check("direct match - Resolver-Pass 15 Ithraca (curated freq=1 lore-iconic — Calth civilian sub-locale, HH-0253 Honour to the Dead, cross-arc with Know-No-Fear / Mark-of-Calth Calth sub-locale set, sector ultima parity)", () => {
  assert.equal(resolveLocation("Ithraca").id, "ithraca");
});

check("direct match - Resolver-Pass 15 Northwilds (curated freq=1 lore-iconic — Caliban sub-region, HH-0259 Cypher: Guardian of Order, Dark-Angels Heresy-era Order-of-Caliban locale, sector obscurus parity with caliban)", () => {
  assert.equal(resolveLocation("Northwilds").id, "northwilds");
});

check("direct match - Resolver-Pass 15 Numinus (curated freq=1 lore-iconic — Calth-region locale, HH-0273 Garro: Oath of Moment, cross-arc with Calth-region sub-locale set, sector ultima parity with ithraca)", () => {
  assert.equal(resolveLocation("Numinus").id, "numinus");
});

console.log("\nresolveCharacter");

check("direct match - first resolver wave Ibram Gaunt", () => {
  assert.equal(resolveCharacter("Ibram Gaunt").id, "ibram_gaunt");
});

check("direct match - Mykola Shonai", () => {
  assert.equal(resolveCharacter("Mykola Shonai").id, "mykola_shonai");
});

check("direct match - Marneus Calgar", () => {
  assert.equal(resolveCharacter("Marneus Calgar").id, "marneus_calgar");
});

check("direct match - Roboute Guilliman", () => {
  assert.equal(resolveCharacter("Roboute Guilliman").id, "roboute_guilliman");
});

check("direct match - Saint Celestine", () => {
  assert.equal(resolveCharacter("Saint Celestine").id, "saint_celestine");
});

check("direct match - Kharn with diacritic", () => {
  assert.equal(resolveCharacter("Kh\u00e2rn the Betrayer").id, "kharn_the_betrayer");
});

check("direct match - Magnus the Red", () => {
  assert.equal(resolveCharacter("Magnus the Red").id, "magnus_the_red");
});

check("direct match - Duke Sliscus", () => {
  assert.equal(resolveCharacter("Duke Sliscus").id, "duke_sliscus");
});

check("alias - Kharn without epithet", () => {
  assert.equal(resolveCharacter("Kh\u00e2rn").id, "kharn_the_betrayer");
  assert.equal(resolveCharacter("Kharn").id, "kharn_the_betrayer");
});

check("alias - Lukas the Trickster", () => {
  assert.equal(resolveCharacter("Lukas the Trickster").id, "lukas_the_strifeson");
});

check("alias - Jackalwolf", () => {
  assert.equal(resolveCharacter("Jackalwolf").id, "lukas_the_strifeson");
});

check("alias - Serpent of Commorragh", () => {
  assert.equal(resolveCharacter("Serpent of Commorragh").id, "duke_sliscus");
});

check("alias - Inquisitor Czevak", () => {
  assert.equal(resolveCharacter("Inquisitor Czevak").id, "bronislaw_czevak");
});

check("unknown - long-tail character stays null", () => {
  assert.equal(resolveCharacter("Mandragore Carrion").id, null);
});

check("direct match - third wave Belisarius Cawl", () => {
  assert.equal(resolveCharacter("Belisarius Cawl").id, "belisarius_cawl");
});

check("direct match - third wave Hadeya Etsul cross-batch", () => {
  assert.equal(resolveCharacter("Hadeya Etsul").id, "hadeya_etsul");
});

check("direct match - third wave Lucille von Shard cross-batch", () => {
  assert.equal(resolveCharacter("Lucille von Shard").id, "lucille_von_shard");
});

check("direct match - third wave Kile Simlex cross-batch", () => {
  assert.equal(resolveCharacter("Kile Simlex").id, "kile_simlex");
});

check("direct match - third wave Bree Jagdea cross-batch", () => {
  assert.equal(resolveCharacter("Bree Jagdea").id, "bree_jagdea");
});

check("direct match - third wave Watson Jaq Draco", () => {
  assert.equal(resolveCharacter("Jaq Draco").id, "jaq_draco");
});

check("direct match - third wave Watson Meh'Lindi", () => {
  assert.equal(resolveCharacter("Meh'Lindi").id, "meh_lindi");
});

check("alias - Cawl short form routes to Belisarius Cawl", () => {
  assert.equal(resolveCharacter("Cawl").id, "belisarius_cawl");
});

check("alias - Inquisitor Draco routes to Jaq Draco", () => {
  assert.equal(resolveCharacter("Inquisitor Draco").id, "jaq_draco");
});

check("alias - Lord Castellan Creed routes to Ursarkar Creed", () => {
  assert.equal(resolveCharacter("Lord Castellan Creed").id, "ursarkar_e_creed");
});

check("direct match - fourth wave Ragnar Blackmane Space Wolves saga POV", () => {
  assert.equal(resolveCharacter("Ragnar Blackmane").id, "ragnar_blackmane");
});

check("alias - fourth wave Ragnar Thunderfist pre-Blackmane novitiate routes to ragnar_blackmane", () => {
  assert.equal(resolveCharacter("Ragnar Thunderfist").id, "ragnar_blackmane");
});

check("direct match - fourth wave Sarpedon Soul Drinkers Chapter-Master", () => {
  assert.equal(resolveCharacter("Sarpedon").id, "sarpedon");
});

check("direct match - fourth wave Daenyathos Soul Drinkers founder-philosopher", () => {
  assert.equal(resolveCharacter("Daenyathos").id, "daenyathos");
});

check("direct match - fourth wave Kal Jerico Multi-Era one-row", () => {
  assert.equal(resolveCharacter("Kal Jerico").id, "kal_jerico");
});

check("direct match - fourth wave Mad Donna canonical surface", () => {
  assert.equal(resolveCharacter("Mad Donna").id, "mad_donna");
});

check("alias - fourth wave D'onne Ulanti cross-batch consolidation routes to mad_donna", () => {
  assert.equal(resolveCharacter("D'onne Ulanti").id, "mad_donna");
});

check("direct match - fourth wave Lieutenant Kage Last Chancers POV", () => {
  assert.equal(resolveCharacter("Lieutenant Kage").id, "lieutenant_kage");
});

check("alias - fourth wave the Burned Man cross-batch consolidation routes to lieutenant_kage", () => {
  assert.equal(resolveCharacter("the Burned Man").id, "lieutenant_kage");
});

check("direct match - fourth wave Lord Gerontius Helmawr classic-imprint (Helmawr split)", () => {
  assert.equal(resolveCharacter("Lord Gerontius Helmawr").id, "gerontius_helmawr");
});

check("direct match - fourth wave Lord Helmawr modern-imprint (Helmawr split)", () => {
  assert.equal(resolveCharacter("Lord Helmawr").id, "lord_helmawr");
});

check("direct match - fourth wave Shira Calpurnia Adeptus Arbites POV", () => {
  assert.equal(resolveCharacter("Shira Calpurnia").id, "shira_calpurnia");
});

check("direct match - fourth wave Captain Leoten Sempter Gothic War", () => {
  assert.equal(resolveCharacter("Captain Leoten Sempter").id, "captain_leoten_sempter");
});

check("direct match - fifth wave Alaric (Grey Knights, freq=4)", () => {
  assert.equal(resolveCharacter("Alaric").id, "alaric");
});

check("direct match - fifth wave Gabriel Angelos (Blood Ravens, freq=4)", () => {
  assert.equal(resolveCharacter("Gabriel Angelos").id, "gabriel_angelos");
});

check("direct match - fifth wave Macha (Eldar Farseer, freq=4)", () => {
  assert.equal(resolveCharacter("Macha").id, "macha");
});

check("direct match - fifth wave Mephiston (Blood Angels, freq=2)", () => {
  assert.equal(resolveCharacter("Mephiston").id, "mephiston");
});

check("alias-consolidation - fifth wave Lo Bannick both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Lo Bannick").id, "lo_bannick");
  assert.equal(
    resolveCharacter("Marken Cortein Lo Bannick").id,
    "lo_bannick",
  );
});

check("alias-consolidation - fifth wave Dante both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Commander Dante").id, "commander_dante");
  assert.equal(resolveCharacter("Dante").id, "commander_dante");
});

check("direct match - sixth wave Talos (Night Lords First Claw, freq=5)", () => {
  assert.equal(resolveCharacter("Talos").id, "talos");
});

check("direct match - sixth wave Tsu'gan (Salamanders, freq=6)", () => {
  assert.equal(resolveCharacter("Tsu'gan").id, "tsugan");
});

check("direct match - sixth wave Marduk (Word Bearers, freq=4)", () => {
  assert.equal(resolveCharacter("Marduk").id, "marduk");
});

check("direct match - sixth wave Lucian Gerrit (Rogue Trader, freq=4)", () => {
  assert.equal(resolveCharacter("Lucian Gerrit").id, "lucian_gerrit");
});

check("direct match - sixth wave Grimaldus (Black Templars, freq=4)", () => {
  assert.equal(resolveCharacter("Grimaldus").id, "grimaldus");
});

check("direct match - sixth wave Huron Blackheart (Red Corsairs, Phase-1 FK)", () => {
  assert.equal(resolveCharacter("Huron Blackheart").id, "huron_blackheart");
});

check("direct match - sixth wave Nihilan (Dragon Warriors, Phase-1 FK)", () => {
  assert.equal(resolveCharacter("Nihilan").id, "nihilan");
});

check("direct match - sixth wave Kairos Fateweaver (Tzeentch, freq=2)", () => {
  assert.equal(resolveCharacter("Kairos Fateweaver").id, "kairos_fateweaver");
});

check("alias-consolidation - sixth wave Variel both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Variel the Flayer").id, "variel_the_flayer");
  assert.equal(resolveCharacter("Variel").id, "variel_the_flayer");
});

check("alias-consolidation - sixth wave Shadowsun both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Commander Shadowsun").id, "commander_shadowsun");
  assert.equal(resolveCharacter("Shadowsun").id, "commander_shadowsun");
});

check("alias-consolidation - sixth wave Sister Augusta both surface forms collapse to one row", () => {
  assert.equal(
    resolveCharacter("Sister Superior Augusta").id,
    "sister_superior_augusta",
  );
  assert.equal(resolveCharacter("Sister Augusta").id, "sister_superior_augusta");
});

check("alias-consolidation - sixth wave Obadiah Roth both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Obadiah Roth").id, "obadiah_roth");
  assert.equal(resolveCharacter("Inquisitor Obadiah Roth").id, "obadiah_roth");
});

check("alias-consolidation - sixth wave Grukk both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Grukk Face-Rippa").id, "grukk_face_rippa");
  assert.equal(resolveCharacter("Grukk").id, "grukk_face_rippa");
});

check("alias-consolidation - sixth wave Varro Tigurius full name resolves to existing Tigurius", () => {
  assert.equal(resolveCharacter("Tigurius").id, "tigurius");
  assert.equal(resolveCharacter("Varro Tigurius").id, "tigurius");
});

check("unknown - sixth wave Galenus stays null (identity-ambiguous, deliberately unpromoted)", () => {
  assert.equal(resolveCharacter("Galenus").id, null);
});

check("direct match - seventh wave Asdrubael Vect (Supreme Overlord of Commorragh, freq 4)", () => {
  assert.equal(resolveCharacter("Asdrubael Vect").id, "asdrubael_vect");
});

check("direct match - seventh wave Lord Solar Macharius (lore-iconic Macharian Crusade, freq 4)", () => {
  assert.equal(resolveCharacter("Lord Solar Macharius").id, "lord_solar_macharius");
});

check("direct match - seventh wave Koorland (Beast Arises POV, freq 10)", () => {
  assert.equal(resolveCharacter("Koorland").id, "koorland");
});

check("direct match - seventh wave Drakan Vangorich (Officio Assassinorum, freq 8)", () => {
  assert.equal(resolveCharacter("Drakan Vangorich").id, "drakan_vangorich");
});

check("direct match - seventh wave Cypher (fallen_angels FK via Phase-1 alias decision)", () => {
  assert.equal(resolveCharacter("Cypher").id, "cypher");
});

check("direct match - seventh wave The Blade of Antwyr (weapon-as-character edge case, daemons FK)", () => {
  assert.equal(resolveCharacter("The Blade of Antwyr").id, "the_blade_of_antwyr");
});

check("direct match - seventh wave Danial Tan Draconis (house_draconis, Phase-1 FK)", () => {
  assert.equal(resolveCharacter("Danial Tan Draconis").id, "danial_tan_draconis");
});

check("alias-consolidation - seventh wave Ahzek Ahriman both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Ahzek Ahriman").id, "ahzek_ahriman");
  assert.equal(resolveCharacter("Ahriman").id, "ahzek_ahriman");
});

check("alias-consolidation - seventh wave Abaddon the Despoiler both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Abaddon the Despoiler").id, "abaddon_the_despoiler");
  assert.equal(resolveCharacter("Abaddon").id, "abaddon_the_despoiler");
});

check("alias-consolidation - seventh wave Sebastian Yarrick both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Sebastian Yarrick").id, "sebastian_yarrick");
  assert.equal(resolveCharacter("Commissar Yarrick").id, "sebastian_yarrick");
});

check("alias-consolidation - seventh wave Commander Farsight both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Commander Farsight").id, "commander_farsight");
  assert.equal(resolveCharacter("Farsight").id, "commander_farsight");
});

check("alias-consolidation - seventh wave Gunnlaugur both surface forms collapse to one row", () => {
  assert.equal(resolveCharacter("Gunnlaugur").id, "gunnlaugur");
  assert.equal(resolveCharacter("Gunnlaugr").id, "gunnlaugur");
});

check("alias-consolidation - eighth wave Zelia Lor + bare given name 'Zelia' collapse to one row (7a Case A)", () => {
  assert.equal(resolveCharacter("Zelia Lor").id, "zelia_lor");
  assert.equal(resolveCharacter("Zelia").id, "zelia_lor");
});

check("alias-consolidation - eighth wave Ursarkar Creed + Lord Castellan Creed collapse to one row (wave §3 alias-resolved surface)", () => {
  assert.equal(resolveCharacter("Ursarkar Creed").id, "ursarkar_e_creed");
  assert.equal(resolveCharacter("Lord Castellan Creed").id, "ursarkar_e_creed");
});

check("direct match - eighth wave Mortarion (Daemon Primarch / Death Guard, Dark Imperium trilogy freq=3)", () => {
  assert.equal(resolveCharacter("Mortarion").id, "mortarion");
});

check("direct match - eighth wave Minka Lesk (Cadian POV, Cadian Saga freq=5)", () => {
  assert.equal(resolveCharacter("Minka Lesk").id, "minka_lesk");
});

check("direct match - eighth wave Erasmus Crowl (Inquisitor POV, Vaults of Terra trilogy freq=4)", () => {
  assert.equal(resolveCharacter("Erasmus Crowl").id, "erasmus_crowl");
});

check("direct match - eighth wave Janus Draik (Rogue Trader POV, Blackstone Fortress duology freq=3)", () => {
  assert.equal(resolveCharacter("Janus Draik").id, "janus_draik");
});

check("direct match - eighth wave Grekh (Kroot tracker, primaryFactionId binds Phase-1 kroot row, freq=3)", () => {
  assert.equal(resolveCharacter("Grekh").id, "grekh");
});

check("direct match - eighth wave Yvraine (Ynnari prophetess, Iyanden duology freq=2)", () => {
  assert.equal(resolveCharacter("Yvraine").id, "yvraine");
});

check("direct match - eighth wave Talen (Warped Galaxies Imperial Guardsman boy, freq=6 wave-top character)", () => {
  assert.equal(resolveCharacter("Talen").id, "talen");
});

check("direct match - eighth wave Mekki (Warped Galaxies tech-priest novice, freq=5)", () => {
  assert.equal(resolveCharacter("Mekki").id, "mekki");
});

check("direct match - eighth wave Kardan Stronos (Iron Council Chapter Master, freq=1 lore-iconic Iron Hands cluster anchor)", () => {
  assert.equal(resolveCharacter("Kardan Stronos").id, "kardan_stronos");
});

check("direct match - eighth wave Typhus (Herald of Nurgle / Death Guard, freq=1 lore-iconic primarch-tier)", () => {
  assert.equal(resolveCharacter("Typhus").id, "typhus");
});

check("alias-consolidation - ninth wave Agusto Zidarov + Probator Agusto Zidarov collapse to one row (7a Case A, Bloodlines + Broken City)", () => {
  assert.equal(resolveCharacter("Agusto Zidarov").id, "agusto_zidarov");
  assert.equal(resolveCharacter("Probator Agusto Zidarov").id, "agusto_zidarov");
});

check("alias-consolidation - ninth wave Ghazghkull Mag Uruk Thraka + Ghazghkull Thraka collapse to one row (cross-pass 7a — Pass-7 ghazghkull_thraka row from Yarrick trilogy + full Pass-9 surface form across W40K-0530/0558/0559)", () => {
  assert.equal(resolveCharacter("Ghazghkull Thraka").id, "ghazghkull_thraka");
  assert.equal(resolveCharacter("Ghazghkull Mag Uruk Thraka").id, "ghazghkull_thraka");
});

check("direct match - ninth wave Oltyx (Necron Nemesor protagonist of Twice-Dead King trilogy + omnibus, freq=3)", () => {
  assert.equal(resolveCharacter("Oltyx").id, "oltyx");
});

check("direct match - ninth wave Inquisitor Rostov (John French's Ordo Hereticus inquisitor across Dawn of Fire spine, freq=2)", () => {
  assert.equal(resolveCharacter("Inquisitor Rostov").id, "inquisitor_rostov");
});

check("direct match - ninth wave Clodde (Ogryn POV of Baggit-and-Clodde duology, primaryFactionId=ogryns binds Phase-1 row, freq=2)", () => {
  assert.equal(resolveCharacter("Clodde").id, "clodde");
});

check("direct match - ninth wave Trajann Valoris (Captain-General of the Adeptus Custodes, Auric Gods, freq=1 lore-iconic)", () => {
  assert.equal(resolveCharacter("Trajann Valoris").id, "trajann_valoris");
});

check("direct match - ninth wave Szarekh (Necron Silent King, Dawn of Fire finale, freq=1 lore-iconic primarch-tier)", () => {
  assert.equal(resolveCharacter("Szarekh").id, "szarekh");
});

check("alias - Resolver-Pass 10 Cross-Era: 'Lucius' (HH Emperor's Children swordsman) routes to lucius_the_eternal", () => {
  assert.equal(resolveCharacter("Lucius").id, "lucius_the_eternal");
});

check("alias - Resolver-Pass 10 Cross-Era: 'Ezekyle Abaddon' (HH Sons of Horus First Captain) routes to abaddon_the_despoiler", () => {
  assert.equal(resolveCharacter("Ezekyle Abaddon").id, "abaddon_the_despoiler");
});

check("alias - Resolver-Pass 10 cross-batch consolidation: 'Little Horus Aximand' routes to horus_aximand", () => {
  assert.equal(resolveCharacter("Little Horus Aximand").id, "horus_aximand");
});

check("direct match - Resolver-Pass 10 (7b Heresy spine, freq 3): Horus (Warmaster)", () => {
  assert.equal(resolveCharacter("Horus").id, "horus");
});

check("direct match - Resolver-Pass 10 (7b Heresy spine, freq 3): Garviel Loken (Sons of Horus Mournival)", () => {
  assert.equal(resolveCharacter("Garviel Loken").id, "garviel_loken");
});

check("direct match - Resolver-Pass 10 (7b Heresy spine, highest-freq new HH character, freq 4): Erebus (Word Bearers First Chaplain)", () => {
  assert.equal(resolveCharacter("Erebus").id, "erebus");
});

check("direct match - Resolver-Pass 10 (7b Primarch spine, apostrophe-stripped slug): Lion El'Jonson", () => {
  assert.equal(resolveCharacter("Lion El'Jonson").id, "lion_el_jonson");
});

check("direct match - Resolver-Pass 11 (7b Primarch spine, freq 10 — highest-freq unresolved in HH-003..008 wave): Sanguinius (Blood Angels Primarch, Fear to Tread → Echoes of Eternity)", () => {
  assert.equal(resolveCharacter("Sanguinius").id, "sanguinius");
});

check("direct match - Resolver-Pass 11 (7b Primarch spine, freq 5): Jaghatai Khan (White Scars Primarch, Scars / Path of Heaven / Warhawk)", () => {
  assert.equal(resolveCharacter("Jaghatai Khan").id, "jaghatai_khan");
});

check("direct match - Resolver-Pass 11 (7b Primarch spine, freq 5): Perturabo (Iron Warriors Primarch, Angel Exterminatus / Tallarn / First Wall)", () => {
  assert.equal(resolveCharacter("Perturabo").id, "perturabo");
});

check("direct match - Resolver-Pass 11 (7b supporting cast, freq 4): Shiban Khan (White Scars POV, Wraight HH arc)", () => {
  assert.equal(resolveCharacter("Shiban Khan").id, "shiban_khan");
});

check("direct match - Resolver-Pass 11 (7b supporting cast, freq 3): Sigismund (Imperial Fists First Captain → Black Templars)", () => {
  assert.equal(resolveCharacter("Sigismund").id, "sigismund");
});

check("direct match - Resolver-Pass 11 (7b supporting cast, freq 3): Euphrati Keeler (Lectitio Divinitatus saint, primaryFactionId lectitio_divinitatus per Phase 1 Verweise)", () => {
  assert.equal(resolveCharacter("Euphrati Keeler").id, "euphrati_keeler");
});

check("direct match - Resolver-Pass 11 (7b supporting cast, freq 2, apostrophe-stripped slug): Ka'Bandha (Bloodthirster of Khorne, primaryFactionId daemons)", () => {
  assert.equal(resolveCharacter("Ka'Bandha").id, "ka_bandha");
});

check("direct match - Resolver-Pass 11 (7b supporting cast, freq 2): Tylos Rubio (former Thousand Sons → Knight-Errant, primaryFactionId knights_errant per Phase 1 Verweise)", () => {
  assert.equal(resolveCharacter("Tylos Rubio").id, "tylos_rubio");
});

check("direct match - Resolver-Pass 11 (7a alias-consolidation new row, longer-form canonical): Targutai Yesugei (White Scars Stormseer, combined freq 2 with Yesugei alias)", () => {
  assert.equal(resolveCharacter("Targutai Yesugei").id, "targutai_yesugei");
});

check("alias-consolidation - Resolver-Pass 11 (7a Case I): Yesugei (short-form) routes to targutai_yesugei (one row + alias per runbook §4 longer-form-canonical pattern, parity with branne_nev + Branne)", () => {
  assert.equal(resolveCharacter("Yesugei").id, "targutai_yesugei");
});

check("alias-consolidation - Resolver-Pass 11 (7a Case D — single highest-impact alias of the wave): Horus Lupercal (Warmaster's full name, freq 9) routes to horus (combined effective freq 12 on existing Pass-10 anchor)", () => {
  assert.equal(resolveCharacter("Horus Lupercal").id, "horus");
  assert.equal(resolveCharacter("Horus").id, "horus");
});

check("alias - Resolver-Pass 11 (7a Case E Cross-Era honor-title-split parity with Kharn ↔ Kharn the Betrayer): Calas Typhon (Heresy-era name of Typhus the Traveller) routes to typhus", () => {
  assert.equal(resolveCharacter("Calas Typhon").id, "typhus");
});

check("alias-consolidation - Resolver-Pass 11 (7a Case F Cross-Era full-name parity with Case D): Corvus Corax (Primarch full name) routes to corax", () => {
  assert.equal(resolveCharacter("Corvus Corax").id, "corax");
  assert.equal(resolveCharacter("Corax").id, "corax");
});

check("alias - Resolver-Pass 11 (7a Case G Cross-Era full-name parity): Lorgar Aurelian (Word Bearers Primarch full name) routes to lorgar", () => {
  assert.equal(resolveCharacter("Lorgar Aurelian").id, "lorgar");
});

check("alias - Resolver-Pass 11 (7a Case H Cross-Era formal-title parity): Emperor of Mankind (formal title) routes to the_emperor", () => {
  assert.equal(resolveCharacter("Emperor of Mankind").id, "the_emperor");
});

check("direct match - Resolver-Pass 11 (7c curated freq=1 lore-iconic): Maloghurst the Twisted (Sons of Horus equerry, Slaves to Darkness)", () => {
  assert.equal(resolveCharacter("Maloghurst the Twisted").id, "maloghurst_the_twisted");
});

check("direct match - Resolver-Pass 11 (7c curated freq=1 lore-iconic): Rylanor (Emperor's Children Ancient, Angel Exterminatus Iydris trap-pivot)", () => {
  assert.equal(resolveCharacter("Rylanor").id, "rylanor");
});

check("direct match - Resolver-Pass 11 (7c curated freq=1 lore-iconic, §7d axis-disambig — character not location): Madail (Daemonic Lord of Hosts, Fear to Tread)", () => {
  assert.equal(resolveCharacter("Madail").id, "madail");
});

check("direct match - Resolver-Pass 11 (7c curated freq=1 lore-iconic; §7d two-distinct-rows confirmed): Mohana Mankata Vi (Sisters of Silence Knight-Centura, primaryFactionId talons_of_the_emperor)", () => {
  assert.equal(resolveCharacter("Mohana Mankata Vi").id, "mohana_mankata_vi");
});

check("direct match - Resolver-Pass 11 (7c curated freq=1 lore-iconic; §7d two-distinct-rows confirmed): Esha Ani Mohana (Legio Solaria Princeps Senior, distinct identity from Mohana Mankata Vi)", () => {
  assert.equal(resolveCharacter("Esha Ani Mohana").id, "esha_ani_mohana");
});

check("alias-consolidation - Resolver-Pass 12 (7a Case B Cross-Era short-form parity with Calas Typhon Pass-11): Typhon (bare-form of Death Guard First Captain who becomes Typhus the Traveller, The Lion HH-0119) routes to typhus", () => {
  assert.equal(resolveCharacter("Typhon").id, "typhus");
});

check("alias-consolidation - Resolver-Pass 12 (7a Case C typo cross-batch consolidation — same Imperial Fists captain at Battle of Phall): Alexis Pollux (double-l misspelling, Ember of Extinction HH-0109) routes to alexis_polux (lore-canonical, The Crimson Fist HH-0125)", () => {
  assert.equal(resolveCharacter("Alexis Pollux").id, "alexis_polux");
});

check("direct match - Resolver-Pass 12 (7b freq-2 cross-batch spine Calth Underworld War antagonist): Kurtha Sedd (Word Bearers Dark Apostle, The Honoured HH-0132 + The Unburdened HH-0133, primaryFactionId word_bearers)", () => {
  assert.equal(resolveCharacter("Kurtha Sedd").id, "kurtha_sedd");
});

check("direct match - Resolver-Pass 12 (7b freq-2 cross-batch spine Calth Underworld War loyalist): Steloc Aethon (Ultramarines Honoured commander, namesake of The Honoured HH-0132 + The Unburdened HH-0133, primaryFactionId ultramarines)", () => {
  assert.equal(resolveCharacter("Steloc Aethon").id, "steloc_aethon");
});

check("direct match - Resolver-Pass 12 (7c curated freq=1 lore-iconic — longer-form canonical per runbook §4): Barabas Dantioch (Iron Warriors Warsmith, lone-loyalist archetype, Perturabo: The Hammer of Olympia HH-0084)", () => {
  assert.equal(resolveCharacter("Barabas Dantioch").id, "barabas_dantioch");
});

check("alias-consolidation - Resolver-Pass 12 (7c longer-form-canonical pattern parity with branne_nev + Branne / targutai_yesugei + Yesugei): Dantioch (short form) routes to barabas_dantioch", () => {
  assert.equal(resolveCharacter("Dantioch").id, "barabas_dantioch");
});

check("direct match - Resolver-Pass 12 (7c curated freq=1 lore-iconic — Chaos God as on-page actor, §7d axis-grain judgment: character row): Nurgle (Grandfather Nurgle, Grandfather's Gift HH-0101, primaryFactionId nurgle god-pantheon row)", () => {
  assert.equal(resolveCharacter("Nurgle").id, "nurgle");
});

check("alias-consolidation - Resolver-Pass 13 (7a Case B short-form pattern, parity with Little Horus Aximand → horus_aximand): Maloghurst routes to maloghurst_the_twisted", () => {
  assert.equal(resolveCharacter("Maloghurst").id, "maloghurst_the_twisted");
});

check("alias-consolidation - Resolver-Pass 13 (7a Case C full-form-to-existing-short-canonical, deferred row-rename candidate): Nassir Amit routes to amit", () => {
  assert.equal(resolveCharacter("Nassir Amit").id, "amit");
});

check("alias-consolidation - Resolver-Pass 13 (7a Case E longer-variant with leading 'The', parity with existing Emperor of Mankind alias): The Emperor of Mankind routes to the_emperor", () => {
  assert.equal(resolveCharacter("The Emperor of Mankind").id, "the_emperor");
});

check("alias-consolidation - Resolver-Pass 13 (7a Case D paired short-form alias, parity with Branne → branne_nev / Dantioch → barabas_dantioch): Arvida routes to revuel_arvida", () => {
  assert.equal(resolveCharacter("Arvida").id, "revuel_arvida");
});

check("direct match - Resolver-Pass 13 (7a Case D longer-form-canonical Thousand Sons psyker, Rebirth HH-0161 + Sedition's Gate HH-0141): Revuel Arvida", () => {
  assert.equal(resolveCharacter("Revuel Arvida").id, "revuel_arvida");
});

check("direct match - Resolver-Pass 13 (7b cross-batch spine freq=2 Therion Cohort officer with Raven Guard, HH-0149 + HH-0171): Marcus Valerius", () => {
  assert.equal(resolveCharacter("Marcus Valerius").id, "marcus_valerius");
});

check("direct match - Resolver-Pass 13 (7b cross-batch spine freq=2 Ultramarine ambassador, HH-0159 + HH-0173, identity check passed): Arcadese", () => {
  assert.equal(resolveCharacter("Arcadese").id, "arcadese");
});

check("direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic Iterator/remembrancer, Last Remembrancer HH-0160 execution argument with Dorn/Qruze on Titan): Solomon Voss", () => {
  assert.equal(resolveCharacter("Solomon Voss").id, "solomon_voss");
});

check("direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic Dark Angels Voted Lieutenant at the Tsagualsa parlay, Savage Weapons HH-0165): Corswain", () => {
  assert.equal(resolveCharacter("Corswain").id, "corswain");
});

check("direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic — false-Sejanus thread foundational Heresy beat, Death of a Silversmith HH-0170): Hastur Sejanus", () => {
  assert.equal(resolveCharacter("Hastur Sejanus").id, "hastur_sejanus");
});

check("direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic Dark Angels First-of-the-Fallen, Call of the Lion HH-0154): Merir Astelan", () => {
  assert.equal(resolveCharacter("Merir Astelan").id, "merir_astelan");
});

check("direct match - Resolver-Pass 13 (7c curated freq=1 strong-lore-iconic Iron Hands captain under Crusader Host, Riven HH-0177): Crius", () => {
  assert.equal(resolveCharacter("Crius").id, "crius");
});

check("direct match - Resolver-Pass 13 (7c medium freq=1 Phase-3-promote — Raven Guard Shadowmaster Sisypheum-origin debut, Kryptos HH-0167): Nykona Sharrowkyn", () => {
  assert.equal(resolveCharacter("Nykona Sharrowkyn").id, "nykona_sharrowkyn");
});

check("direct match - Resolver-Pass 13 (7c medium freq=1 Phase-3-promote — Night Lords lapsed-Librarian, Child of Night HH-0181): Fel Zharost", () => {
  assert.equal(resolveCharacter("Fel Zharost").id, "fel_zharost");
});

check("direct match - Resolver-Pass 14 Macer Varren (7b strict freq-3 cross-batch spine — Knights-Errant ex-World-Eaters operative across HH-0228 Eater of Dreams / HH-0244 Garro: Legion of One / HH-0248 Garro: Sword of Truth, primaryFactionId knights_errant)", () => {
  assert.equal(resolveCharacter("Macer Varren").id, "macer_varren");
});

check("direct match - Resolver-Pass 14 Helig Gallor (7b strict freq-2 cross-batch spine — Knights-Errant agent paired with Garro in HH-0205 and with Amendera Kendel in HH-0226, primaryFactionId knights_errant)", () => {
  assert.equal(resolveCharacter("Helig Gallor").id, "helig_gallor");
});

check("direct match - Resolver-Pass 14 Hydragyrum (7c strong freq=1 lore-iconic — Ordo Sinister female pariah-princeps protagonist of HH-0215, primaryFactionId ordo_sinister Phase-1-row FK)", () => {
  assert.equal(resolveCharacter("Hydragyrum").id, "hydragyrum");
});

check("direct match - Resolver-Pass 14 Sibel Niasta (7c/7d strong freq=1 lore-iconic co-protagonist of HH-0235 Malcador: First Lord of the Imperium, anthology-cascade strict freq-2 via HH-0237 promoted on co-protagonist warrant, primaryFactionId adeptus_astra_telepathica)", () => {
  assert.equal(resolveCharacter("Sibel Niasta").id, "sibel_niasta");
});

check("direct match - Resolver-Pass 14 Crysos Morturg (7c strong freq=1 lore-iconic — first-named Blackshield POV in HH-0208 Blackshield, future-proof for the Endryd-Haar sub-arc at HH-0286+, primaryFactionId blackshields Phase-1-row FK)", () => {
  assert.equal(resolveCharacter("Crysos Morturg").id, "crysos_morturg");
});

check("direct match - Resolver-Pass 14 Yored Massak (7c strong freq=1 lore-iconic — Knights-Errant Imperial-Fists Librarian recruited by Garro on the Phalanx, HH-0247 Burden of Duty, primaryFactionId knights_errant)", () => {
  assert.equal(resolveCharacter("Yored Massak").id, "yored_massak");
});

check("direct match - Resolver-Pass 14 Torquill Eliphas (7c strong freq=1 lore-iconic — Word Bearers / Ark of Testimony Templum Daemonarchia constructor on Kronus in HH-0207 Inheritor, primaryFactionId word_bearers)", () => {
  assert.equal(resolveCharacter("Torquill Eliphas").id, "torquill_eliphas");
});

check("alias-consolidation - Resolver-Pass 14 'the Emperor' lowercase-article variant routes to the_emperor (Case A new alias add — bare lowercase-article surface form HH-0222 Two Metaphysical Blades + HH-0225 Lantern's Light; resolver is case-sensitive per Brief 049/072 so the Pass-13 Case-E 'The Emperor of Mankind' capitalized variant does not cover this form; same canonical identity per runbook §4 — alias entry, not row creation)", () => {
  assert.equal(resolveCharacter("the Emperor").id, "the_emperor");
});

check("alias-consolidation - Resolver-Pass 14 confirmation 'The Emperor of Mankind' capitalized variant still routes to the_emperor (Pass-13 Case-E alias holds; paired with the new Pass-14 'the Emperor' lowercase-article variant on the same canonical row)", () => {
  assert.equal(resolveCharacter("The Emperor of Mankind").id, "the_emperor");
});

check("direct match - Resolver-Pass 15 Endryd Haar (7b strict freq-3 within-batch spine — Pass-14-forecasted Blackshields-trilogy protagonist landing exactly at HH-0286 as predicted; Blackshields: The False War HH-0286 + Blackshields: The Red Fief HH-0287 + Blackshields: The Broken Chain HH-0290, primaryFactionId blackshields)", () => {
  assert.equal(resolveCharacter("Endryd Haar").id, "endryd_haar");
});

check("direct match - Resolver-Pass 15 Khalid Hassan (7c strong freq=1 lore-iconic — Malcador's covert operative, deuteragonist of the Officio-Sigillite namesake audio drama, HH-0252 The Sigillite, primaryFactionId officio_sigillite Phase-1-row FK)", () => {
  assert.equal(resolveCharacter("Khalid Hassan").id, "khalid_hassan");
});

check("direct match - Resolver-Pass 15 Argonis (7c strong freq=1 lore-iconic — Sons of Horus emissary, late-Heresy compliance-arc Horus envoy, HH-0285 Dark Compliance, primaryFactionId sons_of_horus)", () => {
  assert.equal(resolveCharacter("Argonis").id, "argonis");
});

check("direct match - Resolver-Pass 15 Yasu Nagasena (7c strong freq=1 lore-iconic — Imperial talent-scout/agent, protagonist of Wolf Hunt HH-0254, primaryFactionId officio_sigillite parity with khalid_hassan)", () => {
  assert.equal(resolveCharacter("Yasu Nagasena").id, "yasu_nagasena");
});

check("direct match - Resolver-Pass 15 Zagreus Kane (7c strong freq=1 lore-iconic — Mechanicum Fabricator-General successor candidate, eventual post-Heresy Fabricator-General, HH-0284 The Binary Succession, primaryFactionId mechanicus)", () => {
  assert.equal(resolveCharacter("Zagreus Kane").id, "zagreus_kane");
});

check("alias-consolidation - Resolver-Pass 15 (7a Case A typo-variant — transposed vowels Ae↔Aeo): Aenoid Thiel routes to aeonid_thiel (HH-0289 Nightfane — same Ultramarines Codicier/Sergeant figure recurring across the Calth / Aeonid-Thiel audio-drama bloc; identity-equivalence floor-case alias add)", () => {
  assert.equal(resolveCharacter("Aenoid Thiel").id, "aeonid_thiel");
});

check("alias-consolidation - Resolver-Pass 15 (7a Case B Cross-Era/Character-Honor-Title-Split — Heresy-era pre-Dreadnought honor-title variant per Pass-11 bjorn row note explicit anticipation, parity with Kharn ↔ Kharn the Betrayer): Bjorn the One-Handed routes to bjorn (HH-0261 Wolf's Claw — the same future Bjorn the Fell-Handed)", () => {
  assert.equal(resolveCharacter("Bjorn the One-Handed").id, "bjorn");
});

check("alias-consolidation - Resolver-Pass 15 (7d Cross-Era same-identity disambig recommendation (a) — runbook §4 default for Heresy-era honor-title / Cross-Era surface forms): Lord Cypher routes to cypher (HH-0259 Cypher: Guardian of Order — Heresy-era Dark-Angels Order-of-Caliban title-holder is the same individual who becomes the post-Heresy Lord-of-the-Fallen Cypher)", () => {
  assert.equal(resolveCharacter("Lord Cypher").id, "cypher");
});

check("alias-consolidation - Resolver-Pass 15 confirmation Horus Lupercal still routes to horus (Pass-11 alias holds — HH-0277 The Either + HH-0291 Collected Visions + HH-0294 Visions of Heresy 2018 ed.)", () => {
  assert.equal(resolveCharacter("Horus Lupercal").id, "horus");
});

console.log("\nnormalizeCharacterRole");

check("role - pov stays pov", () => {
  assert.equal(normalizeCharacterRole("pov").role, "pov");
});

check("role - appears stays appears", () => {
  assert.equal(normalizeCharacterRole("appears").role, "appears");
});

check("role - mentioned stays mentioned", () => {
  assert.equal(normalizeCharacterRole("mentioned").role, "mentioned");
});

check("role - supporting becomes appears", () => {
  const normalized = normalizeCharacterRole("supporting");
  assert.equal(normalized.role, "appears");
  assert.equal(normalized.changed, true);
});

check("role - antagonist becomes appears", () => {
  const normalized = normalizeCharacterRole("antagonist");
  assert.equal(normalized.role, "appears");
  assert.equal(normalized.changed, true);
});

check("role - unexpected values throw before DB insert", () => {
  assert.throws(() => normalizeCharacterRole("cameo"), /Unsupported character role/);
});

// ---------------------------------------------------------------------------
// Brief 077: grand-alignment-junction-skip
// ---------------------------------------------------------------------------

console.log("decideFactionSkips");

const REDUNDANT_IDS = new Set<string>(["imperium", "chaos"]);
// Curated alignment map covering the IDs used in the cases below; real
// apply-override.ts builds the equivalent map from factions.json via
// normalizeAlignment(). Hand-curated here for self-documenting test cases.
const ALIGNMENT_BY_ID = new Map<string, Alignment>([
  ["imperium", "imperium"],
  ["chaos", "chaos"],
  ["space_wolves", "imperium"],
  ["adeptus_astartes", "imperium"],
  ["word_bearers", "chaos"],
  ["khorne_daemons", "chaos"],
]);

function runSkip(
  resolved: Array<{ id: string; role: string; rawName: string }>,
  original: Array<{ name: string; role: string }>,
) {
  return decideFactionSkips({
    resolved,
    original,
    alignmentById: ALIGNMENT_BY_ID,
    redundantIds: REDUNDANT_IDS,
    resolveFaction,
  });
}

check("skip fires - Imperium dropped when Space Wolves is in the block", () => {
  const original = [
    { name: "Space Wolves", role: "primary" },
    { name: "Imperium", role: "primary" },
  ];
  const resolved = [
    { id: "space_wolves", role: "primary", rawName: "Space Wolves" },
    { id: "imperium", role: "primary", rawName: "Imperium" },
  ];
  const { keep, skippedSurfaceForms } = runSkip(resolved, original);
  assert.deepEqual(keep.map((f) => f.id), ["space_wolves"]);
  assert.deepEqual(skippedSurfaceForms, ["Imperium"]);
});

check("skip fires - Chaos dropped when Word Bearers is in the block", () => {
  const original = [
    { name: "Word Bearers", role: "primary" },
    { name: "Chaos", role: "primary" },
  ];
  const resolved = [
    { id: "word_bearers", role: "primary", rawName: "Word Bearers" },
    { id: "chaos", role: "primary", rawName: "Chaos" },
  ];
  const { keep, skippedSurfaceForms } = runSkip(resolved, original);
  assert.deepEqual(keep.map((f) => f.id), ["word_bearers"]);
  assert.deepEqual(skippedSurfaceForms, ["Chaos"]);
});

check("skip does NOT fire - Imperium alone (no peer sub-faction in block)", () => {
  const original = [{ name: "Imperium", role: "primary" }];
  const resolved = [
    { id: "imperium", role: "primary", rawName: "Imperium" },
  ];
  const { keep, skippedSurfaceForms } = runSkip(resolved, original);
  assert.deepEqual(keep.map((f) => f.id), ["imperium"]);
  assert.deepEqual(skippedSurfaceForms, []);
});

check("skip does NOT fire - chaos peer is not an imperium peer", () => {
  // Khorne Daemons (alignment=chaos) shares the block with Imperium
  // (alignment=imperium). No imperium-aligned peer for Imperium → keep.
  const original = [
    { name: "Khorne Daemons", role: "primary" },
    { name: "Imperium", role: "primary" },
  ];
  const resolved = [
    { id: "khorne_daemons", role: "primary", rawName: "Khorne Daemons" },
    { id: "imperium", role: "primary", rawName: "Imperium" },
  ];
  const { keep, skippedSurfaceForms } = runSkip(resolved, original);
  assert.deepEqual(
    keep.map((f) => f.id).sort(),
    ["imperium", "khorne_daemons"],
  );
  assert.deepEqual(skippedSurfaceForms, []);
});

check("both skips fire - Imperium AND Chaos when each has an alignment-peer sub", () => {
  // Mixed block: Astartes Loyalist + Word Bearers + both grand-alignment tags.
  // Imperium has peer in space_wolves, Chaos has peer in word_bearers.
  const original = [
    { name: "Space Wolves", role: "primary" },
    { name: "Word Bearers", role: "primary" },
    { name: "Imperium", role: "primary" },
    { name: "Chaos", role: "primary" },
  ];
  const resolved = [
    { id: "space_wolves", role: "primary", rawName: "Space Wolves" },
    { id: "word_bearers", role: "primary", rawName: "Word Bearers" },
    { id: "imperium", role: "primary", rawName: "Imperium" },
    { id: "chaos", role: "primary", rawName: "Chaos" },
  ];
  const { keep, skippedSurfaceForms } = runSkip(resolved, original);
  assert.deepEqual(
    keep.map((f) => f.id).sort(),
    ["space_wolves", "word_bearers"],
  );
  assert.deepEqual(skippedSurfaceForms.sort(), ["Chaos", "Imperium"]);
});

check("multiple aliases for the same skipped id are all captured", () => {
  // "Imperium" and "Imperium of Man" both resolve to imperium. The resolver
  // dedupes by id, so only one resolved entry; but both raw surface forms
  // must land in skippedSurfaceForms for audit completeness.
  const original = [
    { name: "Adeptus Astartes", role: "primary" },
    { name: "Imperium", role: "primary" },
    { name: "Imperium of Man", role: "primary" },
  ];
  const resolved = [
    { id: "adeptus_astartes", role: "primary", rawName: "Adeptus Astartes" },
    { id: "imperium", role: "primary", rawName: "Imperium" },
  ];
  const { keep, skippedSurfaceForms } = runSkip(resolved, original);
  assert.deepEqual(keep.map((f) => f.id), ["adeptus_astartes"]);
  assert.deepEqual(skippedSurfaceForms, ["Imperium", "Imperium of Man"]);
});

// ---------------------------------------------------------------------------
// Brief 084: location umbrella-surface-form-skip
// ---------------------------------------------------------------------------

console.log("\ndecideLocationSkips");

const REDUNDANT_LOCATION_SURFACE_FORMS = new Set<string>(
  [
    "Imperium",
    "Imperium of Man",
    "Imperium of Mankind",
    "Chaos",
    "Chaos Space",
    "Realm of Chaos",
    "the Warp",
    "Warp Space",
    "Xenos",
    "Aliens",
    "Alien Space",
  ].map((s) => s.trim().toLowerCase()),
);

check("location skip fires - Imperium dropped when Cadia is in the block", () => {
  const decision = decideLocationSkips({
    surfaceForms: [
      { name: "Cadia", role: "primary" },
      { name: "Imperium", role: "primary" },
    ],
    redundantSurfaceForms: REDUNDANT_LOCATION_SURFACE_FORMS,
    resolvedLocationIds: ["cadia"],
  });
  assert.deepEqual(
    decision.keepSurfaceForms.map((sf) => sf.name),
    ["Cadia"],
  );
  assert.deepEqual(decision.skippedSurfaceForms, ["Imperium"]);
});

check("location skip preserves - Imperium alone (no peer resolved)", () => {
  // Galaxy-wide-survey / lore-only book: only the umbrella tag is present
  // and nothing else resolves. The umbrella stays in `locationsUnresolved`
  // (Erhaltungs-Pfad), no audit-bucket entry.
  const decision = decideLocationSkips({
    surfaceForms: [{ name: "Imperium", role: "primary" }],
    redundantSurfaceForms: REDUNDANT_LOCATION_SURFACE_FORMS,
    resolvedLocationIds: [],
  });
  assert.deepEqual(
    decision.keepSurfaceForms.map((sf) => sf.name),
    ["Imperium"],
  );
  assert.deepEqual(decision.skippedSurfaceForms, []);
});

check("location skip fires for multiple umbrellas - Imperium and Chaos both dropped", () => {
  const decision = decideLocationSkips({
    surfaceForms: [
      { name: "Cadia", role: "primary" },
      { name: "Imperium", role: "primary" },
      { name: "Chaos", role: "primary" },
    ],
    redundantSurfaceForms: REDUNDANT_LOCATION_SURFACE_FORMS,
    resolvedLocationIds: ["cadia"],
  });
  assert.deepEqual(
    decision.keepSurfaceForms.map((sf) => sf.name),
    ["Cadia"],
  );
  assert.deepEqual(decision.skippedSurfaceForms.sort(), ["Chaos", "Imperium"]);
});

check("location skip is case-insensitive on the surface form", () => {
  // IMPERIUM and Imperium of MAN both match (case-insensitive, trimmed)
  // regardless of the canonical casing in `redundantSurfaceForms`.
  const decision = decideLocationSkips({
    surfaceForms: [
      { name: "Cadia", role: "primary" },
      { name: "IMPERIUM", role: "primary" },
      { name: "  Imperium of MAN  ", role: "primary" },
    ],
    redundantSurfaceForms: REDUNDANT_LOCATION_SURFACE_FORMS,
    resolvedLocationIds: ["cadia"],
  });
  assert.deepEqual(
    decision.keepSurfaceForms.map((sf) => sf.name),
    ["Cadia"],
  );
  assert.deepEqual(decision.skippedSurfaceForms.sort(), [
    "  Imperium of MAN  ",
    "IMPERIUM",
  ]);
});

// ---------------------------------------------------------------------------
// Brief 086: Hardcover title normalization (cleanup + colon-fallbacks +
// originalIfDifferent). 14 cases carried from Brief 085, each now also
// asserting `originalIfDifferent`, plus 3 dedicated anchors below.
// ---------------------------------------------------------------------------

console.log("\nnormalizeForHardcover");

check("pass-through - clean title without noise", () => {
  const r = normalizeForHardcover("Xenos");
  assert.equal(r.primary, "Xenos");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, null);
});

check("vol-range + founding-omnibus - Gaunt's Ghosts: The Founding Omnibus, 1-3", () => {
  const r = normalizeForHardcover("Gaunt's Ghosts: The Founding Omnibus, 1-3");
  assert.equal(r.primary, "Gaunt's Ghosts");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "Gaunt's Ghosts: The Founding Omnibus, 1-3");
});

check("generic omnibus - Eisenhorn Omnibus -> Eisenhorn (no colon, original kept)", () => {
  const r = normalizeForHardcover("Eisenhorn Omnibus");
  assert.equal(r.primary, "Eisenhorn");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "Eisenhorn Omnibus");
});

check("specific :The Omnibus - Ravenor: The Omnibus (generic must NOT eat to 'Ravenor: The')", () => {
  const r = normalizeForHardcover("Ravenor: The Omnibus");
  assert.equal(r.primary, "Ravenor");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "Ravenor: The Omnibus");
});

check("(Legends) suffix - 'The Last Chancers (Legends)'", () => {
  const r = normalizeForHardcover("The Last Chancers (Legends)");
  assert.equal(r.primary, "The Last Chancers");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "The Last Chancers (Legends)");
});

check("Vol + Omnibus - 'Uriel Ventris Omnibus Vol. 1'", () => {
  const r = normalizeForHardcover("Uriel Ventris Omnibus Vol. 1");
  assert.equal(r.primary, "Uriel Ventris");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "Uriel Ventris Omnibus Vol. 1");
});

check("colon-character-prefix - 'Belisarius Cawl: The Great Work' yields BOTH fallbacks", () => {
  const r = normalizeForHardcover("Belisarius Cawl: The Great Work");
  assert.equal(r.primary, "Belisarius Cawl: The Great Work");
  assert.deepEqual(r.fallbacks, ["Belisarius Cawl", "The Great Work"]);
  // cleanup left it unchanged → no original-fallback needed.
  assert.equal(r.originalIfDifferent, null);
});

check("colon-series-prefix - 'Imperator: Wrath of the Omnissiah' yields BOTH fallbacks", () => {
  const r = normalizeForHardcover("Imperator: Wrath of the Omnissiah");
  assert.equal(r.primary, "Imperator: Wrath of the Omnissiah");
  assert.deepEqual(r.fallbacks, ["Imperator", "Wrath of the Omnissiah"]);
  assert.equal(r.originalIfDifferent, null);
});

check("Part marker - 'Horus Rising Part One'", () => {
  const r = normalizeForHardcover("Horus Rising Part One");
  assert.equal(r.primary, "Horus Rising");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "Horus Rising Part One");
});

check("Complete-X-Omnibus - 'Iron Warriors: The Complete Honsou Omnibus' -> 'Iron Warriors'", () => {
  const r = normalizeForHardcover("Iron Warriors: The Complete Honsou Omnibus");
  assert.equal(r.primary, "Iron Warriors");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "Iron Warriors: The Complete Honsou Omnibus");
});

check("ordinal-Omnibus - 'Space Wolf: The Second Omnibus' -> 'Space Wolf'", () => {
  const r = normalizeForHardcover("Space Wolf: The Second Omnibus");
  assert.equal(r.primary, "Space Wolf");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "Space Wolf: The Second Omnibus");
});

check("em-dash vol-range - 'Some Trilogy, 1–3' (en-dash variant)", () => {
  const r = normalizeForHardcover("Some Trilogy, 1–3");
  assert.equal(r.primary, "Some Trilogy");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "Some Trilogy, 1–3");
});

check("colon with no noise stays - 'Mephiston: Lord of Death' yields both fallbacks", () => {
  const r = normalizeForHardcover("Mephiston: Lord of Death");
  assert.equal(r.primary, "Mephiston: Lord of Death");
  assert.deepEqual(r.fallbacks, ["Mephiston", "Lord of Death"]);
  assert.equal(r.originalIfDifferent, null);
});

check("empty cleanup result throws (defensive guard)", () => {
  assert.throws(() => normalizeForHardcover("(Legends)"));
});

check("input trimming - leading/trailing whitespace doesn't survive (original=null)", () => {
  const r = normalizeForHardcover("  Xenos  ");
  assert.equal(r.primary, "Xenos");
  // trimmed roster === primary → not a distinct original.
  assert.equal(r.originalIfDifferent, null);
});

// Three dedicated originalIfDifferent anchors (Brief 086 acceptance).
check("originalIfDifferent anchor - pass-through stays null", () => {
  assert.equal(normalizeForHardcover("Xenos").originalIfDifferent, null);
});

check("originalIfDifferent anchor - cleanup-cut keeps the omnibus original", () => {
  const r = normalizeForHardcover("Eisenhorn Omnibus");
  assert.equal(r.primary, "Eisenhorn");
  assert.equal(r.originalIfDifferent, "Eisenhorn Omnibus");
});

check("originalIfDifferent anchor - Ravenor regression (primary cut, original retained)", () => {
  const r = normalizeForHardcover("Ravenor: The Omnibus");
  assert.equal(r.primary, "Ravenor");
  assert.deepEqual(r.fallbacks, []);
  assert.equal(r.originalIfDifferent, "Ravenor: The Omnibus");
});

// ---------------------------------------------------------------------------
// Brief 086: Hardcover author normalization (initial-drop + bidirectional
// diminutive alias). Uses the real scripts/seed-data/author-aliases.json.
// ---------------------------------------------------------------------------

console.log("\nnormalizeAuthor");

check("initial-drop - 'James A. Swallow' -> 'James Swallow'", () => {
  assert.deepEqual(normalizeAuthor("James A. Swallow"), ["James Swallow"]);
});

check("diminutive forward - 'Daniel Abnett' -> 'Dan Abnett'", () => {
  assert.deepEqual(normalizeAuthor("Daniel Abnett"), ["Dan Abnett"]);
});

check("diminutive backward - 'Dan Abnett' -> 'Daniel Abnett' (bidirectional)", () => {
  assert.deepEqual(normalizeAuthor("Dan Abnett"), ["Daniel Abnett"]);
});

check("combined - 'Daniel A. Abnett' -> ['Daniel Abnett', 'Dan Abnett']", () => {
  assert.deepEqual(normalizeAuthor("Daniel A. Abnett"), ["Daniel Abnett", "Dan Abnett"]);
});

check("pass-through - first name not in table yields []", () => {
  assert.deepEqual(normalizeAuthor("Aaron Dembski-Bowden"), []);
});

check("case-insensitive first-name match - 'dan abnett' -> 'Daniel abnett' (rest verbatim)", () => {
  // The first name is matched case-insensitively and swapped to the table's
  // canonical casing; the remainder is preserved verbatim (downstream
  // authorMatches() lowercases both sides, so casing of the rest is moot).
  assert.deepEqual(normalizeAuthor("dan abnett"), ["Daniel abnett"]);
});

check("dedup - input form is never echoed and no duplicates", () => {
  const out = normalizeAuthor("Dan A. Abnett");
  // initial-drop → 'Dan Abnett'; diminutive → 'Daniel Abnett'.
  assert.deepEqual(out, ["Dan Abnett", "Daniel Abnett"]);
  assert.equal(new Set(out).size, out.length);
  assert.ok(!out.includes("Dan A. Abnett"));
});

// ---------------------------------------------------------------------------
// Brief 087: Goodreads rating override normalization.
// ---------------------------------------------------------------------------

console.log("\nnormalizeRatingOverride");

check("rating override - rated writes Goodreads value/count/source", () => {
  const out = normalizeRatingOverride(
    {
      status: "rated",
      source: "goodreads",
      value: 4.126,
      count: 1234,
      evidenceUrl: "https://www.goodreads.com/book/show/1-example",
    },
    "W40K-0201",
  );
  assert.deepEqual(out, {
    state: "rated",
    rating: "4.13",
    ratingCount: 1234,
    ratingSource: "goodreads",
    evidenceUrl: "https://www.goodreads.com/book/show/1-example",
  });
});

check("rating override - unrated marker writes checked-goodreads null state", () => {
  const out = normalizeRatingOverride(
    {
      status: "unrated",
      source: "goodreads",
      reason: "Goodreads page checked; no aggregate rating yet.",
      evidenceUrl: "https://www.goodreads.com/book/show/2-example",
    },
    "W40K-0202",
  );
  assert.deepEqual(out, {
    state: "unrated",
    rating: null,
    ratingCount: null,
    ratingSource: "goodreads",
    evidenceUrl: "https://www.goodreads.com/book/show/2-example",
    reason: "Goodreads page checked; no aggregate rating yet.",
  });
});

check("rating override - absent field is no-op", () => {
  assert.deepEqual(normalizeRatingOverride(undefined, "W40K-0203"), {
    state: "absent",
  });
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
