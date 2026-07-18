/**
 * The Warmaster's Web — eighteen Legion-scale movements from Horus' opening
 * dispositions to Terra, or to the last evidenced point for forces that did
 * not reach the Siege. Each tour act owns one main route. Sourced subordinate
 * fleets appear only as faint, terminating branches.
 */

import type { Voyage, VoyageArmTarget, VoyageArmVia } from "../types";

const LOYALIST_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/qbwgpft8/loyalist-lore-where-were-the-legiones-astartes-as-the-horus-heresy-broke-out/";
const TRAITOR_SOURCE =
  "https://www.warhammer-community.com/en-gb/articles/w3jmtzfv/traitor-lore-how-the-trap-was-set/";
const SIEGE_SOURCE = "https://wh40k.lexicanum.com/wiki/Siege_of_Terra";
const TIMELINE_SOURCE = "https://wh40k.lexicanum.com/wiki/Timeline_of_the_Horus_Heresy";

const worldTarget = (
  world: string,
  text: string,
  source = TIMELINE_SOURCE,
  dx = 9,
  dy = -7,
): VoyageArmTarget => ({ world, text, source, label: { dx, dy, anchor: "start" } });

const via = (target: VoyageArmTarget, bow?: number): VoyageArmVia => ({
  target,
  ...(bow === undefined ? {} : { bow }),
});

const SHIELD_WORLDS = {
  name: "Gordian League Shield Worlds",
  gx: 972,
  gy: 92,
  text: "Horus sent the First Legion beyond the galactic rim against the Gordian League, buying the rebellion distance from the Lion.",
  source:
    "https://assets.warhammer-community.com/22-01_the_horus_heresy_black_book_extract_the_thramas_crusade-fwtcctcyvt-kspnxfwdz1.pdf",
  placement: {
    precision: "schematic",
    note: "The Shield Worlds lie in the intergalactic black without a published bearing; this off-chart point marks an exit from the galaxy, not an eastern coordinate.",
    source:
      "https://assets.warhammer-community.com/22-01_the_horus_heresy_black_book_extract_the_thramas_crusade-fwtcctcyvt-kspnxfwdz1.pdf",
  },
  label: { dx: -10, dy: -9, anchor: "end" },
} satisfies VoyageArmTarget;

const IYDRIS = {
  name: "Iydris",
  gx: 268,
  gy: 244,
  text: "Fulgrim entered the Crone World Iydris, became a daemon primarch and left an increasingly fractured Legion behind him.",
  source: "https://wh40k.lexicanum.com/wiki/Iydris",
  placement: {
    precision: "relative",
    note: "Iydris is identified as a Crone World within the Eye of Terror but has no published system coordinate; it is placed beside the charted warp storm.",
    source: "https://wh40k.lexicanum.com/wiki/Iydris",
  },
  label: { dx: 9, dy: -7, anchor: "start" },
} satisfies VoyageArmTarget;

const DARK_GLASS = {
  name: "Dark Glass",
  gx: 454,
  gy: 267,
  text: "At the abandoned Webway station Dark Glass, the Khan destroyed Mortarion's trap and opened the White Scars' last road to Terra.",
  source: "https://wh40k.lexicanum.com/wiki/Dark_Glass",
  placement: {
    precision: "schematic",
    note: "Dark Glass has no realspace coordinate; this point sits on the documented Kalium-to-Terra sequence and does not claim a physical midpoint.",
    source: "https://wh40k.lexicanum.com/wiki/Dark_Glass",
  },
  label: { dx: 9, dy: -7, anchor: "start" },
} satisfies VoyageArmTarget;

const PLUTO = {
  name: "Pluto",
  gx: 329.5,
  gy: 398.2,
  text: "At Pluto the Alpha Legion penetrated the Solar defences; Dorn killed Alpharius before the Hydra could open the road to Terra.",
  source: "https://wh40k.lexicanum.com/wiki/Battle_of_Pluto",
  placement: {
    precision: "relative",
    note: "Pluto is plotted immediately beyond the charted Terra–Luna cluster; the local offset is diagrammatic because the galactic map cannot show Solar-System scale.",
    source: "https://wh40k.lexicanum.com/wiki/Battle_of_Pluto",
  },
  label: { dx: -8, dy: -8, anchor: "end" },
} satisfies VoyageArmTarget;

const DWELL = {
  name: "Dwell",
  gx: 497.6,
  gy: 213.5,
  text: "Shadrak Meduson's shattered-Legion force ambushed Horus at Dwell; the Warmaster survived and continued toward Molech.",
  source: "https://wh40k.lexicanum.com/wiki/Battle_of_Dwell",
  placement: {
    precision: "schematic",
    note: "Dwell has a named system and a documented place on the Isstvan-to-Molech sequence but no published galactic region; this point claims chronology only.",
    source: "https://wh40k.lexicanum.com/wiki/Dwell",
  },
  label: { dx: 9, dy: -7, anchor: "start" },
} satisfies VoyageArmTarget;

const ARAGNA_CHAIN = {
  name: "Aragna Chain",
  gx: 540,
  gy: 224,
  text: "Meduson's guerrilla coalition was finally broken in the Aragna Chain, ending the largest sustained Iron Hands counteroffensive.",
  source: "https://wh40k.lexicanum.com/wiki/Shadrak_Meduson",
  placement: {
    precision: "schematic",
    note: "The Aragna Chain is named in Meduson's campaign but has no published sector; it is placed beyond Dwell only to preserve the documented final sequence.",
    source: "https://wh40k.lexicanum.com/wiki/Shadrak_Meduson",
  },
  label: { dx: 9, dy: -7, anchor: "start" },
} satisfies VoyageArmTarget;

const ULLANOR = {
  name: "Ullanor · Dark Muster",
  gx: 414.5,
  gy: 310.46,
  text: "Horus recalled the Traitor host to Ullanor for the Dark Muster before the final advance on the Solar System.",
  source: "https://wh40k.lexicanum.com/wiki/Ullanor",
  placement: {
    precision: "relative",
    note: "Ullanor uses the later Armageddon identity anchor: the planet was moved to that location long after the Heresy, so this is not claimed as its M31 coordinate.",
    source: "https://wh40k.lexicanum.com/wiki/Ullanor",
  },
  label: { dx: 9, dy: -7, anchor: "start" },
} satisfies VoyageArmTarget;

const TERRA = worldTarget(
  "terra",
  "Terra is both the besieged destination and the dividing line between Legions that arrived, arrived too late, or never reached the Throneworld.",
  SIEGE_SOURCE,
  -9,
  -8,
);
const LUNA = worldTarget("luna", "The Traitor armada broke through Luna before descending on Terra.", SIEGE_SOURCE);
const ISSTVAN_III = worldTarget(
  "istvaan-iii",
  "Horus purged loyalist elements of four Traitor Legions on Isstvan III and turned rebellion into open war.",
  TRAITOR_SOURCE,
);
const ISSTVAN_V = worldTarget(
  "istvaan-v",
  "The Drop Site Massacre destroyed the loyalist spearhead and exposed four more Legions as traitors.",
  "https://www.warhammer-community.com/en-gb/articles/5b3wkzet/the-horus-heresy-the-tragic-tale-of-the-dropsite-massacre/",
);
const THRAMAS = worldTarget("thramas-sector", "The First and Eighth Legions tore the Thramas Sector apart until both forces divided.");
const PERDITUS = worldTarget("perditus-ultima", "At Perditus the Lion seized Tuchulcha, the engine that would break the Thramas Crusade.");
const MACRAGGE = worldTarget("macragge", "Macragge became the centre of Imperium Secundus while the Ruinstorm barred Terra.");
const DAVIN = worldTarget("davin", "Davin's destruction opened a narrow road through the Ruinstorm toward Terra.");
const CHEMOS = worldTarget("chemos", "The Dark Angels destroyed Chemos during the Lion's campaign against the Traitor homeworlds.");
const BARBARUS = worldTarget("barbarus", "Barbarus was destroyed in the Lion's scorched-earth passage toward the Sol war.");
const DELIVERANCE = worldTarget("deliverance", "Deliverance sheltered the Raven Guard and later received the Lion after his homeworld campaign.");
const KALIUM = worldTarget("kalium", "Kalium became a convergence point for White Scars, Emperor's Children and the wider road to Terra.");
const PHALL = worldTarget("phall", "The Retribution Fleet mauled Perturabo's ambush at Phall before both forces were recalled.");
const HYDRA = worldTarget("hydra-cordatus", "Perturabo returned to the Hydra Cordatus region before the Angel Exterminatus campaign.");
const TALLARN = worldTarget("tallarn", "The Iron Warriors' invasion turned Tallarn into a poisoned armoured war and delayed Perturabo's advance.");
const BETA_GARMON = worldTarget(
  "beta-garmon-iv",
  "At Beta-Garmon the Traitor advance broke the last great loyalist defence before Sol.",
  "https://www.warhammer-community.com/en-gb/articles/ikfy40va/the-lore-of-legions-imperialis-how-the-great-slaughter-began/",
);
const CHONDAX = worldTarget("chondax", "The White Scars learned of the rebellion only after the Alpha Legion's Chondax blockade failed.", LOYALIST_SOURCE);
const PROSPERO = worldTarget("prospero", "Horus twisted the Emperor's censure into the burning of Prospero and divided two loyal Legions.", LOYALIST_SOURCE);
const ALAXXES = worldTarget("alaxxes-nebula", "The Wolves, depleted after Prospero, were trapped and nearly destroyed in the Alaxxes Nebula.");
const TRISOLIAN = worldTarget("trisolian", "Russ wounded Horus aboard the Vengeful Spirit at Trisolian but could not finish him.");
const YARANT = worldTarget("yarant", "The Space Wolves' failed strike ended at Yarant; the Raven Guard extracted the survivors far from the Siege.");
const SOTHA = worldTarget("sotha", "Sotha's Pharos anchored Imperium Secundus and drew several Legion forces into the eastern war.");
const SIGNUS = worldTarget("signus-prime", "The Blood Angels survived Horus' daemonic trap at Signus and escaped into the Ruinstorm.", LOYALIST_SOURCE);
const MEDUSA = worldTarget("medusa", "After Ferrus Manus fell, the largest Iron Hands authority regrouped around Medusa rather than one coherent fleet.");
const BODT = worldTarget("bodt", "Autek Mor's force annihilated the World Eaters recruiting world of Bodt in a separate vengeance campaign.");
const ARMATURA = worldTarget("armatura", "The Shadow Crusade shattered Armatura as the World Eaters and Word Bearers burned through Ultramar.");
const NUCERIA = worldTarget("nuceria", "On Nuceria Angron ascended and the Shadow Crusade reached its bloody culmination.");
const CALTH = worldTarget("calth", "The Word Bearers' prepared assault at Calth crippled the Ultramarines and ignited the war across Ultramar.");
const MOLECH = worldTarget("molech", "Horus brought the Sons of Horus and Death Guard to Molech and passed through the Emperor's hidden gate.");
const SORTIARIUS = worldTarget("sortiarius", "The Thousand Sons escaped ruined Prospero to Sortiarius before Magnus committed them to Horus.");
const PARAMAR = worldTarget("paramar", "Alpha Legion elements fought for the strategically vital Paramar system as an independent branch of the wider war.");
const NOCTURNE = worldTarget("nocturne", "Most surviving Salamanders regrouped on Nocturne while Vulkan's path separated from the Legion.");
const MAELSTROM = worldTarget("the-maelstrom", "Kor Phaeron escaped the failed Calth campaign into the Maelstrom with his surviving force.");

export const WARMASTER_WEB: Voyage = {
  id: "warmasters-web",
  name: "The Warmaster's Web",
  tag: "M31 · Horus Heresy",
  mapState: "hh",
  blurb: "Eighteen Legions, eighteen roads: follow each main force from Horus' opening disposition to Terra—or to the point where its road to the Siege ended.",
  cartography: {
    label: "Legion movements",
    note: "Each step reveals one Primarch or main-fleet route. Fainter strands are sourced detachments that separate and stop; they are not followed as second journeys.",
  },
  strategic: { mode: "legion-steps" },
  stations: [
    {
      name: SHIELD_WORLDS.name,
      gx: SHIELD_WORLDS.gx,
      gy: SHIELD_WORLDS.gy,
      heading: "I · DARK ANGELS",
      date: "004–014.M31 · after the Siege",
      text: "The Lion fights back from the galactic fringe; Corswain's divided force reaches Terra before the Primarch does.",
      source: "https://wh40k.lexicanum.com/wiki/Dark_Angels",
      placement: SHIELD_WORLDS.placement,
      arms: [
        {
          legion: "I",
          name: "Dark Angels",
          color: "#66727a",
          role: "LOYALIST · MAIN FORCE ARRIVES AFTER THE SIEGE",
          text: "The Lion breaks the Thramas Crusade, crosses Imperium Secundus and burns Traitor homeworlds before reaching Terra too late. Corswain's separated fleet reaches the Siege and helps relight the Astronomican.",
          via: [THRAMAS, PERDITUS, MACRAGGE, DAVIN, CHEMOS, BARBARUS, DELIVERANCE].map((target) => via(target)),
          target: TERRA,
          branches: [
            {
              name: "Corswain's relief force",
              from: THRAMAS,
              target: TERRA,
              opacity: 0.3,
              source: "https://wh40k.lexicanum.com/wiki/Corswain",
            },
          ],
          source: "https://www.warhammer-community.com/en-gb/articles/duUqTQr1/legions-of-the-horus-heresy-do-everything-amazingly-with-the-dark-angels/",
        },
      ],
    },
    {
      world: "istvaan-iii",
      heading: "III · EMPEROR'S CHILDREN",
      date: "005–014.M31 · Siege of Terra",
      text: "Fulgrim's Legion passes from the Isstvan purges through apotheosis and fragmentation to the walls of Terra.",
      source: "https://wh40k.lexicanum.com/wiki/Emperor%27s_Children",
      breakBefore: true,
      arms: [
        {
          legion: "III",
          name: "Emperor's Children",
          color: "#9653a6",
          role: "TRAITOR · SIEGE ASSAULT",
          text: "After both Isstvan massacres Fulgrim ascends on Iydris and his Legion splinters. Reassembled for the Dark Muster, the Emperor's Children reach Terra, then abandon the Palace assault to prey on its population.",
          via: [via(ISSTVAN_V), via(IYDRIS), via(ULLANOR), via(BETA_GARMON)],
          target: TERRA,
          branches: [
            {
              name: "Eidolon's splinter host",
              from: ISSTVAN_V,
              target: KALIUM,
              source: "https://wh40k.lexicanum.com/wiki/Eidolon_(Emperor%27s_Children)",
            },
          ],
          source: "https://www.warhammer-community.com/en-gb/articles/n9NCTAu5/legions-of-the-horus-heresy-no-ones-perfect-except-the-emperors-children/",
        },
      ],
    },
    {
      world: "istvaan-v",
      heading: "IV · IRON WARRIORS",
      date: "006–014.M31 · Siege and withdrawal",
      text: "Perturabo's road is a chain of sieges, diversions and rear-guard battles ending at the Palace he was born to break.",
      source: "https://wh40k.lexicanum.com/wiki/Iron_Warriors",
      breakBefore: true,
      arms: [
        {
          legion: "IV",
          name: "Iron Warriors",
          color: "#929899",
          role: "TRAITOR · SIEGE ASSAULT, THEN WITHDRAWAL",
          text: "From Isstvan V Perturabo fights at Phall, Iydris and Tallarn before carrying Horus' war through Beta-Garmon to Terra. He directs the early Siege, then withdraws the Legion when the war becomes a contest of daemons rather than strategy.",
          via: [via(PHALL), via(HYDRA), via(IYDRIS), via(TALLARN), via(BETA_GARMON)],
          target: TERRA,
          source: "https://www.warhammer-community.com/en-gb/articles/r3URO0Mq/legions-of-the-horus-heresy-break-down-walls-with-the-iron-warriors/",
        },
      ],
    },
    {
      world: "chondax",
      heading: "V · WHITE SCARS",
      date: "006–014.M31 · Siege of Terra",
      text: "The Khan escapes Chondax, tests the truth at Prospero and cuts a hidden road home through Dark Glass.",
      source: "https://wh40k.lexicanum.com/wiki/White_Scars",
      breakBefore: true,
      arms: [
        {
          legion: "V",
          name: "White Scars",
          color: "#e6dfca",
          role: "LOYALIST · SIEGE DEFENDER",
          text: "Jaghatai leaves Chondax only after choosing his own truth. The White Scars wage a years-long running war, break Mortarion's trap at Kalium and Dark Glass, and reach Terra in time to defend the Lion's Gate and retake the spaceport.",
          via: [via(PROSPERO), via(KALIUM), via(DARK_GLASS)],
          target: TERRA,
          source: "https://www.warhammer-community.com/en-gb/articles/cxkwaut7/legions-of-the-horus-heresy-the-white-scars-ride-like-the-wind/",
        },
      ],
    },
    {
      world: "prospero",
      heading: "VI · SPACE WOLVES",
      date: "004–013.M31 · absent from the Siege",
      text: "Russ reaches Terra, then spends his Legion on a failed attempt to kill Horus before the Siege begins.",
      source: "https://wh40k.lexicanum.com/wiki/Space_Wolves",
      breakBefore: true,
      arms: [
        {
          legion: "VI",
          name: "Space Wolves",
          color: "#7890a2",
          role: "LOYALIST · ROAD ENDS AT YARANT",
          text: "After burning Prospero and surviving Alaxxes, Russ brings the Wolves to Terra—then rejects Dorn's defensive war. His strike wounds Horus at Trisolian but leaves the Legion broken at Yarant, where Corax extracts the survivors far from the Siege.",
          via: [via(ALAXXES), via(TERRA), via(TRISOLIAN)],
          target: YARANT,
          source: "https://www.warhammer-community.com/en-gb/articles/nzoeiud5/legions-of-the-horus-heresy-the-space-wolves-are-the-best-boys-yes-they-are/",
        },
      ],
    },
    {
      world: "terra",
      heading: "VII · IMPERIAL FISTS",
      date: "004–014.M31 · Siege of Terra",
      text: "Dorn's main force never leaves the Throneworld war; its great outward branch is the Retribution Fleet at Phall.",
      source: "https://wh40k.lexicanum.com/wiki/Imperial_Fists",
      breakBefore: true,
      arms: [
        {
          legion: "VII",
          name: "Imperial Fists",
          color: "#d4a62d",
          role: "LOYALIST · PRAETORIANS OF TERRA",
          text: "The Imperial Fists turn Sol into a fortress, contest Pluto and carry the Palace defence through the entire Siege. The main Legion is already at its destination; the faint strand marks the Phall fleet's costly departure and return.",
          via: [via(PLUTO)],
          target: TERRA,
          branches: [
            {
              name: "Retribution Fleet",
              from: TERRA,
              via: [via(PHALL)],
              target: TERRA,
              source: "https://wh40k.lexicanum.com/wiki/Battle_of_Phall",
            },
          ],
          source: "https://www.warhammer-community.com/en-gb/articles/DyPr7J1s/legions-of-the-horus-heresy-plan-ahead-with-the-imperial-fists/",
        },
      ],
    },
    {
      world: "istvaan-v",
      heading: "VIII · NIGHT LORDS",
      date: "006–014.M31 · splinter at Terra",
      text: "The Thramas war destroys the Night Lords as a coherent Legion; only splinter commands continue to Horus.",
      source: "https://wh40k.lexicanum.com/wiki/Night_Lords",
      breakBefore: true,
      arms: [
        {
          legion: "VIII",
          name: "Night Lords",
          color: "#3d587f",
          role: "TRAITOR · MAIN LEGION SHATTERS AT THRAMAS",
          text: "Curze's Legion leaves Isstvan V for the Thramas Crusade and breaks into predatory warbands under the Dark Angels' assault. The main route ends with that fragmentation; Skraivok's contingent is the faint branch that later reaches Terra.",
          target: THRAMAS,
          branches: [
            {
              name: "Skraivok's siege contingent",
              from: THRAMAS,
              target: TERRA,
              source: "https://wh40k.lexicanum.com/wiki/Gendor_Skraivok",
            },
            {
              name: "Sotha raiding force",
              from: THRAMAS,
              target: SOTHA,
              source: "https://wh40k.lexicanum.com/wiki/Battle_of_Sotha",
            },
          ],
          source: "https://www.warhammer-community.com/en-gb/articles/jCJJgfOU/legions-of-the-horus-heresy-the-night-lords-treat-every-day-like-its-halloween/",
        },
      ],
    },
    {
      world: "signus-prime",
      heading: "IX · BLOOD ANGELS",
      date: "007–014.M31 · Siege of Terra",
      text: "Sanguinius survives Signus, crosses the Ruinstorm and returns from Beta-Garmon to command Terra's defence.",
      source: "https://wh40k.lexicanum.com/wiki/Blood_Angels",
      breakBefore: true,
      arms: [
        {
          legion: "IX",
          name: "Blood Angels",
          color: "#b82d35",
          role: "LOYALIST · SIEGE DEFENDER",
          text: "The Blood Angels escape Signus into Imperium Secundus, break the Ruinstorm at Davin and reach Terra. Sanguinius then leads the defence at Beta-Garmon before returning to the Palace and his final duel aboard the Vengeful Spirit.",
          via: [via(MACRAGGE), via(DAVIN), via(TERRA), via(BETA_GARMON)],
          target: TERRA,
          source: "https://www.warhammer-community.com/en-gb/articles/dMSkOM6f/legions-of-the-horus-heresy-find-beauty-in-battle-with-the-blood-angels/",
        },
      ],
    },
    {
      world: "istvaan-v",
      heading: "X · IRON HANDS",
      date: "006–013.M31 · shattered Legion",
      text: "Ferrus dies at the Drop Site; no single Iron Hands fleet replaces him, so Medusa anchors the largest surviving authority.",
      source: "https://wh40k.lexicanum.com/wiki/Iron_Hands",
      breakBefore: true,
      arms: [
        {
          legion: "X",
          name: "Iron Hands",
          color: "#586768",
          role: "LOYALIST · NO COHERENT ROAD TO TERRA",
          text: "The Tenth ceases to move as one Legion when Ferrus Manus falls. The Medusan Council becomes its largest centre, while Meduson and Autek Mor prosecute separate wars shown as branches; none brings the Legion to the Siege.",
          target: MEDUSA,
          branches: [
            {
              name: "Meduson's guerrilla war",
              from: ISSTVAN_V,
              via: [via(DWELL)],
              target: ARAGNA_CHAIN,
              source: "https://wh40k.lexicanum.com/wiki/Shadrak_Meduson",
            },
            {
              name: "Autek Mor's vengeance fleet",
              from: ISSTVAN_V,
              target: BODT,
              source: "https://wh40k.lexicanum.com/wiki/Battle_of_Bodt",
            },
          ],
          source: "https://www.warhammer-community.com/en-gb/articles/e20Jxmbd/legions-of-the-horus-heresy-the-iron-hands-are-hard-as-nails/",
        },
      ],
    },
    {
      world: "istvaan-iii",
      heading: "XII · WORLD EATERS",
      date: "005–014.M31 · Siege of Terra",
      text: "Angron's Legion cuts from both Isstvans through the Shadow Crusade and Beta-Garmon to Terra.",
      source: "https://wh40k.lexicanum.com/wiki/World_Eaters",
      breakBefore: true,
      arms: [
        {
          legion: "XII",
          name: "World Eaters",
          color: "#4d7fa8",
          role: "TRAITOR · SIEGE ASSAULT",
          text: "The World Eaters survive their own Isstvan purge, massacre the loyalists at Isstvan V and burn through Ultramar beside Lorgar. Angron ascends on Nuceria; the Legion follows Horus through Beta-Garmon and Ullanor into the slaughter on Terra.",
          via: [via(ISSTVAN_V), via(ARMATURA), via(NUCERIA), via(BETA_GARMON), via(ULLANOR)],
          target: TERRA,
          source: "https://www.warhammer-community.com/en-gb/articles/prYsRNS5/legions-of-the-horus-heresy-the-world-eaters-are-the-angriest-astartes-around/",
        },
      ],
    },
    {
      world: "calth",
      heading: "XIII · ULTRAMARINES",
      date: "007–014.M31 · relief after the Siege",
      text: "Guilliman fights out of Calth and the Ruinstorm, but the largest loyal fleet reaches Terra only after Horus falls.",
      source: "https://wh40k.lexicanum.com/wiki/Ultramarines",
      breakBefore: true,
      arms: [
        {
          legion: "XIII",
          name: "Ultramarines",
          color: "#3f6fc0",
          role: "LOYALIST · ARRIVES AFTER THE SIEGE",
          text: "Calth traps the Ultramarines in a war across their own realm. Guilliman crosses Nuceria and Imperium Secundus, opens the Ruinstorm road at Davin and drives for Terra; the Astronomican guides his three thousand ships in only after Horus is dead.",
          via: [via(NUCERIA), via(MACRAGGE), via(SOTHA), via(DAVIN)],
          target: TERRA,
          source: "https://www.warhammer-community.com/en-gb/articles/sE68Ut3D/legions-of-the-horus-heresy-organise-the-ultramarines-into-an-unbeatable-force/",
        },
      ],
    },
    {
      world: "istvaan-iii",
      heading: "XIV · DEATH GUARD",
      date: "005–014.M31 · Siege of Terra",
      text: "Mortarion's fleet follows Horus to Molech, then emerges from a damned transit remade by Nurgle.",
      source: "https://wh40k.lexicanum.com/wiki/Death_Guard",
      breakBefore: true,
      arms: [
        {
          legion: "XIV",
          name: "Death Guard",
          color: "#879064",
          role: "TRAITOR · SIEGE ASSAULT",
          text: "The Death Guard purge Isstvan III, spring the Drop Site trap and campaign beside Horus at Molech and Beta-Garmon. Typhon's warp passage delivers them to Sol as plague-ridden servants of Nurgle before their assault on Terra.",
          via: [via(ISSTVAN_V), via(MOLECH), via(BETA_GARMON), via(LUNA)],
          target: TERRA,
          branches: [
            {
              name: "Garro's loyalist frigate",
              from: ISSTVAN_III,
              via: [via(LUNA)],
              target: TERRA,
              source: "https://wh40k.lexicanum.com/wiki/Nathaniel_Garro",
            },
          ],
          source: "https://www.warhammer-community.com/en-gb/articles/Q5O7YM0G/legions-of-the-horus-heresy-the-death-guard-trade-glory-for-guts-lots-of-guts/",
        },
      ],
    },
    {
      world: "prospero",
      heading: "XV · THOUSAND SONS",
      date: "004–014.M31 · Siege of Terra",
      text: "The broken Fifteenth escapes to Sortiarius and returns under Magnus as a small but decisive Traitor force.",
      source: "https://wh40k.lexicanum.com/wiki/Thousand_Sons",
      breakBefore: true,
      arms: [
        {
          legion: "XV",
          name: "Thousand Sons",
          color: "#bd4439",
          role: "TRAITOR · SIEGE ASSAULT",
          text: "Prospero's survivors flee with Magnus to Sortiarius. The Crimson King eventually binds the remnant to Horus, joins the Dark Muster and brings the Legion's sorcery to the breach in Terra's wards.",
          via: [via(SORTIARIUS), via(ULLANOR)],
          target: TERRA,
          source: "https://www.warhammer-community.com/en-gb/articles/CgKQT7yy/legions-of-the-horus-heresy-the-thousand-sons-know-more-than-you/",
        },
      ],
    },
    {
      world: "istvaan-iii",
      heading: "XVI · SONS OF HORUS",
      date: "005–014.M31 · Siege of Terra",
      text: "The Warmaster's own Legion forms the spine of the advance from the Isstvan purges to the Vengeful Spirit above Terra.",
      source: "https://wh40k.lexicanum.com/wiki/Sons_of_Horus",
      breakBefore: true,
      arms: [
        {
          legion: "XVI",
          name: "Sons of Horus",
          color: "#47877d",
          role: "TRAITOR · WARMASTER'S MAIN ADVANCE",
          text: "The Sons of Horus execute both Isstvan traps, survive Meduson's ambush at Dwell and carry Horus through Molech, Trisolian and Beta-Garmon. Recalled to Ullanor, they break Luna and descend on Terra as the Warmaster's spearhead.",
          via: [via(ISSTVAN_V), via(DWELL), via(MOLECH), via(TRISOLIAN), via(BETA_GARMON), via(ULLANOR), via(LUNA)],
          target: TERRA,
          source: "https://www.warhammer-community.com/en-gb/articles/71MXsCP4/legions-of-the-horus-heresy-the-sons-of-horus-are-the-real-first-legion/",
        },
      ],
    },
    {
      world: "istvaan-v",
      heading: "XVII · WORD BEARERS",
      date: "006–014.M31 · main force does not reach Terra",
      text: "Lorgar burns Ultramar but loses Horus' favour; only a chosen fragment continues into the Solar War.",
      source: "https://wh40k.lexicanum.com/wiki/Word_Bearers",
      breakBefore: true,
      arms: [
        {
          legion: "XVII",
          name: "Word Bearers",
          color: "#8b3342",
          role: "TRAITOR · MAIN HOST EXILED BEFORE TERRA",
          text: "After Isstvan V, Lorgar's main host conducts the Shadow Crusade through Armatura and Nuceria. His failed challenge at Ullanor ends the Primarch's road to Terra; Kor Phaeron and Zardu Layak lead the two faint, separated contingents.",
          via: [via(ARMATURA), via(NUCERIA)],
          target: ULLANOR,
          branches: [
            {
              name: "Kor Phaeron at Calth",
              from: ISSTVAN_V,
              via: [via(CALTH)],
              target: MAELSTROM,
              source: "https://wh40k.lexicanum.com/wiki/Kor_Phaeron",
            },
            {
              name: "Zardu Layak's five thousand",
              from: ULLANOR,
              target: TERRA,
              opacity: 0.34,
              source: "https://wh40k.lexicanum.com/wiki/Zardu_Layak",
            },
          ],
          source: "https://www.warhammer-community.com/en-gb/articles/HtuedR3Y/legions-of-the-horus-heresy-save-the-galaxys-soul-with-the-word-bearers/",
        },
      ],
    },
    {
      world: "istvaan-v",
      heading: "XVIII · SALAMANDERS",
      date: "006–014.M31 · Primarch at Terra",
      text: "The Legion is shattered at Isstvan; Vulkan's exceptional route reaches Terra while most survivors remain dispersed or on Nocturne.",
      source: "https://wh40k.lexicanum.com/wiki/Salamanders",
      breakBefore: true,
      arms: [
        {
          legion: "XVIII",
          name: "Salamanders",
          color: "#438d5c",
          role: "LOYALIST · PRIMARCH REACHES TERRA",
          text: "No intact Salamanders host marches on the Throneworld after Isstvan V. Vulkan is restored through Macragge and Nocturne, then takes the hidden Webway road to Terra; the route therefore follows the Primarch while the Legion remains shattered.",
          via: [via(MACRAGGE), via(NOCTURNE)],
          target: TERRA,
          source: "https://www.warhammer-community.com/en-gb/articles/qqkc4nwb/legions-of-the-horus-heresy-the-salamanders-are-the-only-good-guys-with-flamers-in-all-warhammer/",
        },
      ],
    },
    {
      world: "istvaan-v",
      heading: "XIX · RAVEN GUARD",
      date: "006–013.M31 · absent from the Siege",
      text: "Corax reaches Terra only to rebuild and leave again; the Raven Guard end the Heresy fighting a shadow war far from the Palace.",
      source: "https://wh40k.lexicanum.com/wiki/Raven_Guard",
      breakBefore: true,
      arms: [
        {
          legion: "XIX",
          name: "Raven Guard",
          color: "#747b80",
          role: "LOYALIST · ROAD ENDS AT YARANT",
          text: "The Raven Guard escape Isstvan V, report to Terra and rebuild on Deliverance before the Alpha Legion ruins Corax's new gene-stock. Corax returns to guerrilla war and rescues Russ at Yarant; his Legion never joins the Siege.",
          via: [via(TERRA), via(DELIVERANCE)],
          target: YARANT,
          source: "https://www.warhammer-community.com/en-gb/articles/VCdIEdQ3/legions-of-the-horus-heresy-raven-guard-are-the-new-black/",
        },
      ],
    },
    {
      world: "istvaan-v",
      heading: "XX · ALPHA LEGION",
      date: "006–014.M31 · no unified Siege route",
      text: "The Hydra obstructs both sides from Chondax to Pluto; after Alpharius falls, its movements cease to form one reliable road.",
      source: "https://wh40k.lexicanum.com/wiki/Alpha_Legion",
      breakBefore: true,
      arms: [
        {
          legion: "XX",
          name: "Alpha Legion",
          color: "#339a9c",
          role: "TRAITOR? · MAIN ROAD ENDS AFTER PLUTO",
          text: "The Alpha Legion closes the Drop Site trap, delays the White Scars at Chondax and penetrates Sol at Pluto, where Dorn kills Alpharius. Omegon's later withdrawal around Ullanor and scattered cells on Terra do not restore a single Legion route.",
          via: [via(CHONDAX), via(PLUTO)],
          target: ULLANOR,
          branches: [
            {
              name: "Paramar campaign force",
              from: CHONDAX,
              target: PARAMAR,
              source: "https://wh40k.lexicanum.com/wiki/First_Battle_of_Paramar",
            },
            {
              name: "Solar infiltration cells",
              from: PLUTO,
              target: TERRA,
              source: "https://wh40k.lexicanum.com/wiki/Alpha_Legion",
            },
          ],
          source: "https://www.warhammer-community.com/en-gb/articles/aIDlhCzn/legions-of-the-horus-heresy-the-alpha-legion-are-on-your-side-or-are-they/",
        },
      ],
    },
  ],
  lbl: { x: 645, y: 565, t: "THE WARMASTER'S WEB" },
};
