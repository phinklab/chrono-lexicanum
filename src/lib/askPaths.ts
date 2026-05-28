/**
 * /ask funnel data — six paths × three questions × four-to-six options each.
 * Ported verbatim from the Claude-Design handoff (HANDOFF_ask_the_archive.md §9).
 * Accent tokens reference CSS variables exposed in globals.css.
 */

export type AccentToken = "var(--cl-cyan)" | "var(--cl-gold)" | "var(--cl-blood)";

export type Option = {
  v: string;
  label: string;
  desc: string;
};

export type Question = {
  id: string;
  latin: string;
  label: string;
  sub: string;
  options: Option[];
};

export type PathDef = {
  id: string;
  sigil: string;
  latin: string;
  label: string;
  sub: string;
  desc: string;
  accent: AccentToken;
  questions: Question[];
};

export const PATHS: PathDef[] = [
  {
    id: "start",
    sigil: "I",
    latin: "PRIMVS GRADVS",
    label: "Where to Start",
    sub: "First step into 40,000 years of war",
    desc: "You're new to the Imperium. No lore needed — we'll find you a gentle entry that still hits.",
    accent: "var(--cl-cyan)",
    questions: [
      {
        id: "time",
        latin: "TEMPVS",
        label: "How much time do you have?",
        sub: "Be honest — what fits your life?",
        options: [
          { v: "evening", label: "One evening", desc: "Short story · 60 pages" },
          { v: "week", label: "One week", desc: "Novel · 300–400 pages" },
          { v: "month", label: "One month", desc: "Omnibus · 1000+ pages" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "taste",
        latin: "AFFECTVS",
        label: "What pulls you in?",
        sub: "Where does good sci-fi start for you?",
        options: [
          { v: "action", label: "Action & combat", desc: "Bolter, blade, storm" },
          { v: "intrigue", label: "Intrigue & politics", desc: "Betrayal, secrets, strategy" },
          { v: "horror", label: "Horror & mystery", desc: "What lurks in the dark?" },
          { v: "epic", label: "Epic & mythic", desc: "Gods, millennia" },
        ],
      },
      {
        id: "gate",
        latin: "PORTA",
        label: "Which door do you open?",
        sub: "There are many ways into the setting.",
        options: [
          { v: "astartes", label: "Space Marines", desc: "The classic · iron-hard" },
          { v: "mortal", label: "Mortals", desc: "Inquisition, Guard, civilians" },
          { v: "chaos", label: "Dark side", desc: "Heresy, daemons, cults" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
    ],
  },

  {
    id: "astartes",
    sigil: "II",
    latin: "VIA ASTARTES",
    label: "The Astartes Way",
    sub: "Bolter, brotherhood, duty",
    desc: "You want to march. Choose your chapter, your era, your tone — and follow the sons of the Emperor.",
    accent: "var(--cl-cyan)",
    questions: [
      {
        id: "chapter",
        latin: "CAPITVLVM",
        label: "Which chapter?",
        sub: "Which brotherhood carries your heart?",
        options: [
          { v: "ultra", label: "Ultramarines", desc: "Macragge · Codex Astartes" },
          { v: "wolves", label: "Space Wolves", desc: "Fenris · saga & mead" },
          { v: "angels", label: "Blood Angels", desc: "Baal · the red thirst" },
          { v: "salaman", label: "Salamanders", desc: "Nocturne · duty & fire" },
          { v: "dark", label: "Dark Angels", desc: "Caliban · the inner secret" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "aetas",
        latin: "AETAS",
        label: "Which era?",
        sub: "When does your chapter march?",
        options: [
          { v: "M31", label: "M31 · Heresy", desc: "Brothers become traitors" },
          { v: "M41", label: "M41 · End times", desc: "The long fight before the Rift" },
          { v: "M42", label: "M42 · Indomitus", desc: "Primaris · after Cadia" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "tone",
        latin: "AFFECTVS",
        label: "Which tone?",
        sub: "How should the book feel?",
        options: [
          { v: "heroic", label: "Heroic", desc: "Faith, sacrifice, valour" },
          { v: "tragic", label: "Tragic", desc: "Loss, fratricide, downfall" },
          { v: "siege", label: "Siege", desc: "Front, wall, strategy" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
    ],
  },

  {
    id: "chaos",
    sigil: "III",
    latin: "VIA HAERETICVS",
    label: "Chaos is my Friend",
    sub: "The Ruinous Powers call",
    desc: "Loyalty is a cage. Choose your god, your voice, your damnation — and step out of the Imperium's silence.",
    accent: "var(--cl-blood)",
    questions: [
      {
        id: "god",
        latin: "NVMEN",
        label: "Which power?",
        sub: "Who calls loudest?",
        options: [
          { v: "khorne", label: "Khorne", desc: "Blood for the Blood God" },
          { v: "tzeentch", label: "Tzeentch", desc: "Change · plans within plans" },
          { v: "nurgle", label: "Nurgle", desc: "Grandfather · disease as love" },
          { v: "slaanesh", label: "Slaanesh", desc: "Excess · senses as weapon" },
          { v: "undiv", label: "Undivided", desc: "The Four together · Black Legion" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "when",
        latin: "TEMPVS",
        label: "Which era?",
        sub: "Falling or fallen?",
        options: [
          { v: "fall", label: "The Fall · M31", desc: "Heresy · the betrayal forming" },
          { v: "long", label: "Long War · M41", desc: "Millennia in the Eye of Terror" },
          { v: "rift", label: "After the Rift · M42", desc: "Cicatrix · new crusades" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "voice",
        latin: "VOX",
        label: "Whose voice?",
        sub: "From which perspective do you fall?",
        options: [
          { v: "legion", label: "Traitor legionary", desc: "Memory of loyalty" },
          { v: "cult", label: "Cultist", desc: "Mortals, the devoted" },
          { v: "daemon", label: "Daemon", desc: "Beings of the Warp itself" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
    ],
  },

  {
    id: "xenos",
    sigil: "IV",
    latin: "VIA XENOS",
    label: "The Alien Path",
    sub: "The Other — and what it does to us",
    desc: "The Imperium hates what it doesn't understand. You don't. Pick an alien lens and see the galaxy anew.",
    accent: "var(--cl-cyan)",
    questions: [
      {
        id: "species",
        latin: "SPECIES",
        label: "Which species?",
        sub: "Whose view do you want to share?",
        options: [
          { v: "eldar", label: "Aeldari · Eldar", desc: "Dying people · death gods" },
          { v: "necron", label: "Necrons", desc: "Iron awakening · 60M years old" },
          { v: "tyranid", label: "Tyranids", desc: "Swarm · hunger without end" },
          { v: "orks", label: "Orks", desc: "WAAAGH! · war as religion" },
          { v: "tau", label: "T'au", desc: "The Greater Good · young people" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "lens",
        latin: "LENS",
        label: "Which lens?",
        sub: "From within or without?",
        options: [
          { v: "within", label: "From within", desc: "Told from the xenos perspective" },
          { v: "human", label: "From without", desc: "Human meets the Other" },
          { v: "clash", label: "In conflict", desc: "Two views collide" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "mode",
        latin: "MODVS",
        label: "War or mystery?",
        sub: "What drives the story?",
        options: [
          { v: "war", label: "War", desc: "Battle, campaign, extinction" },
          { v: "mystery", label: "Mystery", desc: "Rituals, visions, secrets" },
          { v: "first", label: "First contact", desc: "Encounter · trying to understand" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
    ],
  },

  {
    id: "heresy",
    sigil: "V",
    latin: "VIA HERESIS",
    label: "The Horus Heresy",
    sub: "Brother against brother · M31",
    desc: "The betrayal of all betrayals. Choose your legion, your key moment, your heart — and fall with the Emperor.",
    accent: "var(--cl-gold)",
    questions: [
      {
        id: "side",
        latin: "PARTES",
        label: "Which side?",
        sub: "Where does your heart beat?",
        options: [
          { v: "loyal", label: "Loyalists", desc: "Loyal to the Emperor · seven sons" },
          { v: "traitor", label: "Traitors", desc: "Follow Horus · eight legions" },
          { v: "both", label: "Both", desc: "Both perspectives interwoven" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "moment",
        latin: "MOMENTVM",
        label: "Which moment?",
        sub: "Key event of the Heresy?",
        options: [
          { v: "istvaan", label: "Istvaan", desc: "Drop-site massacre · the breaking" },
          { v: "prospero", label: "Prospero", desc: "Wolves against the Thousand Sons" },
          { v: "calth", label: "Calth", desc: "Underworld · chained war" },
          { v: "terra", label: "Terra", desc: "Siege of the Palace · endgame" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "lens",
        latin: "LENS",
        label: "Whose eyes?",
        sub: "Through whom do you experience it?",
        options: [
          { v: "primarch", label: "Primarch", desc: "Demigod · son of the Emperor" },
          { v: "captain", label: "Captain", desc: "Legionary · officer" },
          { v: "mortal", label: "Mortals", desc: "Remembrancer, Iterator, human" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
    ],
  },

  {
    id: "inquisition",
    sigil: "VI",
    latin: "VIA INQVISITIO",
    label: "Inquisition Files",
    sub: "The long shadow of the Imperium",
    desc: "No bolter — a file. No battle — an interrogation. Choose your ordo and follow the heretic hunters.",
    accent: "var(--cl-cyan)",
    questions: [
      {
        id: "ordo",
        latin: "ORDO",
        label: "Which ordo?",
        sub: "Which enemies do you hunt?",
        options: [
          { v: "hereticus", label: "Hereticus", desc: "Heretics · mutants · cults" },
          { v: "xenos", label: "Xenos", desc: "All the Other · extermination" },
          { v: "malleus", label: "Malleus", desc: "Daemon hunters · Grey Knights" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "method",
        latin: "MODVS",
        label: "Which method?",
        sub: "Detective or executioner?",
        options: [
          { v: "detective", label: "Detective", desc: "Investigation · evidence" },
          { v: "warrior", label: "Militant", desc: "Strike team · bolter & blade" },
          { v: "puritan", label: "Puritan", desc: "Purity · tradition · hard" },
          { v: "radical", label: "Radical", desc: "Forbidden means · grey zone" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
      {
        id: "scope",
        latin: "AMBITVS",
        label: "Which scope?",
        sub: "One case or a war?",
        options: [
          { v: "case", label: "One case", desc: "One planet · one sin" },
          { v: "sector", label: "Sector-wide", desc: "Several worlds · network" },
          { v: "crusade", label: "Crusade", desc: "Galactic · centuries" },
          { v: "any", label: "Doesn't matter", desc: "Cogitator decides" },
        ],
      },
    ],
  },
];

export type SampleBook = {
  title: string;
  author: string;
  year: string;
  slug: string;
};

/**
 * Placeholder result-set. The handoff (§14) explicitly defers the real
 * match-algorithm; ResultCard shows these 5 regardless of answers until the
 * recommend logic lands.
 */
export const CHRONO_SAMPLE_BOOKS: SampleBook[] = [
  { title: "Horus Rising", author: "Dan Abnett", year: "M31.005", slug: "horus-rising" },
  { title: "Eisenhorn: Xenos", author: "Dan Abnett", year: "M41.240", slug: "eisenhorn-xenos" },
  { title: "Gaunt's Ghosts: First and Only", author: "Dan Abnett", year: "M41.770", slug: "first-and-only" },
  { title: "A Thousand Sons", author: "Graham McNeill", year: "M30.997", slug: "a-thousand-sons" },
  { title: "The Infinite and the Divine", author: "Robert Rath", year: "M40.000", slug: "infinite-and-divine" },
];
