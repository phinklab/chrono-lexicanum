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

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
