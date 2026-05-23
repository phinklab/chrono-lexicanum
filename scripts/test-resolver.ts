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
