/* ───────────────────────────────────────────────────────────────────────────
 * roster.js — the book fixture for the Chronicle prototype lab.
 *
 * Source: the WH40k Lexicanum "Chronological order of settings of Black Library
 * publications" list Philipp supplied. EVERY entry carries a real in-universe
 * setting date — so unlike the earlier 294-book draft, nothing here is
 * invented. The few genuinely-fuzzy datings (~, c., "540s", "Late M30",
 * ranges) keep their verbatim Lexicanum string in `raw` and are flagged
 * `approx: true`; they're placed at a representative year but rendered with a
 * subtler "≈" treatment and counted under the on-screen approximate-placement
 * note. Exact datings render solid.
 *
 * `chrono` is the author-cleaned, machine-parseable form (eras.json
 * convention, M*1000+year — see projection.js). `raw` is what the panel shows.
 * The list is already in setting-chronological order, so the array index is a
 * faithful reading-order `seq` for the reading-sequence layout.
 *
 * Fixture only. Real per-book startY/endY for the full catalog is a
 * Batches/data-strand job; the live app does not read this file.
 * ─────────────────────────────────────────────────────────────────────────── */
(function () {
  "use strict";
  var TLP = window.TLP;

  // The 7 canonical eras (mirrored from scripts/seed-data/eras.json — read-only).
  var RAW_ERAS = [
    { id: "great_crusade", name: "Great Crusade",  start: 30798, end: 30997, tone: "The Emperor reclaims the galaxy for humanity." },
    { id: "horus_heresy",  name: "Horus Heresy",   start: 30998, end: 31014, tone: "Civil war shatters the Imperium." },
    { id: "age_rebirth",   name: "Age of Rebirth", start: 31015, end: 31999, tone: "Recovery under the High Lords of Terra." },
    { id: "long_war",      name: "The Long War",   start: 32000, end: 36999, tone: "Ten thousand years of attrition." },
    { id: "age_apostasy",  name: "Age of Apostasy",start: 37000, end: 37999, tone: "Schism and tyranny." },
    { id: "time_ending",   name: "Time of Ending", start: 40997, end: 41999, tone: "Omens gather before the Rift." },
    { id: "indomitus",     name: "Indomitus Era",  start: 42000, end: 42100, tone: "A sundered galaxy. Guilliman returns." },
  ];

  // [title, authors, chrono(clean), raw(Lexicanum), series, book#, fmt, approx]
  var R = function (t, a, chrono, raw, series, book, fmt, approx) {
    return { title: t, authors: [].concat(a), chrono: chrono, raw: raw, series: series, book: book || null, fmt: fmt, approx: !!approx };
  };

  var SOURCE = [
    // ── 30th Millennium ───────────────────────────────────────────────────
    R("The Last Church", "Graham McNeill", "730.M30", "730s.M30", "Tales of Heresy", null, "short_story", true),
    R("Descent of Angels", "Mitchel Scanlon", "846.M30", "~846.M30", "Horus Heresy", "Book 6", "novel", true),
    R("Valdor: Birth of the Imperium", "Chris Wraight", "990.M30", "Late M30", "Horus Heresy Characters", null, "novel", true),

    // ── 31st Millennium · the Heresy proper ─────────────────────────────────
    R("Horus Rising", "Dan Abnett", "001.M31", "~001.M31", "Horus Heresy", "Book 1", "novel", true),
    R("Legion", "Dan Abnett", "003.M31", "~003.M31", "Horus Heresy", "Book 7", "novel", true),
    R("False Gods", "Graham McNeill", "004.M31", "004.M31", "Horus Heresy", "Book 2", "novel", false),
    R("The Master of Mankind", "Aaron Dembski-Bowden", "004-014.M31", "004–014.M31", "Horus Heresy", "Book 41", "novel", false),
    R("Mechanicum", "Graham McNeill", "005.M31", "005.M31 (739.M30 prologue)", "Horus Heresy", "Book 9", "novel", false),
    R("Galaxy in Flames", "Ben Counter", "005-006.M31", "005–006.M31", "Horus Heresy", "Book 3", "novel", false),
    R("Fulgrim", "Graham McNeill", "005-006.M31", "005–006.M31", "Horus Heresy", "Book 5", "novel", false),
    R("Dropsite Massacre", "John French", "006.M31", "006.M31", "Horus Heresy", "Standalone", "novella", false),
    R("The Flight of the Eisenstein", "James Swallow", "006.M31", "006.M31", "Horus Heresy", "Book 4", "novel", false),
    R("Battle for the Abyss", "Ben Counter", "007.M31", "007.M31", "Horus Heresy", "Book 8", "novel", false),
    R("Know No Fear", "Dan Abnett", "007.M31", "007.M31", "Horus Heresy", "Book 19", "novel", false),

    // ── Siege of Terra & the Scouring (late 31st) ──────────────────────────
    R("The Solar War", "John French", "014.M31", "000.014.M31", "Siege of Terra", "Book 1", "novel", false),
    R("The Lost and the Damned", "Guy Haley", "014.M31", "~119.014.M31", "Siege of Terra", "Book 2", "novel", true),
    R("The First Wall", "Gav Thorpe", "014.M31", "~014.M31", "Siege of Terra", "Book 3", "novel", true),
    R("Ashes of the Imperium", "Chris Wraight", "014.M31", "~014.M31", "The Scouring", "Book 1", "novel", true),

    // ── 32nd Millennium · The Beast Arises ─────────────────────────────────
    R("Battle of the Fang", "Chris Wraight", "100.M32", "Undated M32", "Space Marine Battles", null, "novel", true),
    R("I Am Slaughter", "Dan Abnett", "544.M32", "544.M32", "The Beast Arises", "Book 1", "novella", false),
    R("Predator, Prey", "Rob Sanders", "544.M32", "544.M32", "The Beast Arises", "Book 2", "novella", false),
    R("The Emperor Expects", "Gav Thorpe", "544.M32", "544.M32", "The Beast Arises", "Book 3", "novella", false),
    R("The Last Wall", "David Annandale", "544.M32", "544.M32", "The Beast Arises", "Book 4", "novella", false),
    R("Throneworld", "Guy Haley", "544.M32", "544.M32", "The Beast Arises", "Book 5", "novella", false),
    R("Echoes of the Long War", "David Guymer", "544.M32", "544.M32", "The Beast Arises", "Book 6", "novella", false),
    R("The Hunt for Vulkan", "David Annandale", "545.M32", "540s.M32", "The Beast Arises", "Book 7", "novella", true),
    R("The Beast Must Die", "Gav Thorpe", "545.M32", "540s.M32", "The Beast Arises", "Book 8", "novella", true),
    R("Watchers in Death", "David Annandale", "545.M32", "540s.M32", "The Beast Arises", "Book 9", "novella", true),
    R("The Last Son of Dorn", "David Guymer", "545.M32", "540s.M32", "The Beast Arises", "Book 10", "novella", true),
    R("Shadow of Ullanor", "Rob Sanders", "545.M32", "540s.M32", "The Beast Arises", "Book 11", "novella", true),
    R("The Beheading", "Guy Haley", "546.M32", "546.M32", "The Beast Arises", "Book 12", "novella", false),

    // ── 34th Millennium ────────────────────────────────────────────────────
    R("Fabius Bile: Primogenitor", "Josh Reynolds", "764.M34", "764.M34", "Fabius Bile", "Book 1", "novel", false),

    // ── 40th Millennium ────────────────────────────────────────────────────
    R("Requiem Infernal", "Peter Fehervari", "419.M40", "419.M40", "Dark Coil", null, "novel", false),
    R("Krieg", "Steve Lyons", "949.M40", "949.M40", "Death Korps of Krieg", null, "novel", false),

    // ── 41st Millennium ────────────────────────────────────────────────────
    R("Pestilence", "Dan Abnett", "075.M41", "075.M41", "Inquisitor (Shorts)", null, "short_story", false),
    R("Regia Occulta", "Dan Abnett", "223.M41", "223.M41", "Inquisitor (Shorts)", null, "short_story", false),
    R("Xenos", "Dan Abnett", "240.M41", "240.M41", "Eisenhorn", "Book 1", "novel", false),
    R("Missing in Action", "Dan Abnett", "241.M41", "241.M41", "Inquisitor (Shorts)", null, "short_story", false),
    R("Malleus", "Dan Abnett", "338-345.M41", "338–345.M41", "Eisenhorn", "Book 2", "novel", false),
    R("Backcloth for a Crown Additional", "Dan Abnett", "355.M41", "355.M41", "Inquisitor (Shorts)", null, "short_story", false),
    R("The Strange Demise of Titus Endor", "Dan Abnett", "360.M41", "c. 360.M41", "Inquisitor (Shorts)", null, "short_story", true),
    R("Hereticus", "Dan Abnett", "386.M41", "386.M41", "Eisenhorn", "Book 3", "novel", false),
    R("Ravenor", "Dan Abnett", "402.M41", "402.M41", "Ravenor", "Book 1", "novel", false),
    R("Thorn Wishes Talon", "Dan Abnett", "403.M41", "~402–403.M41", "Inquisitor (Shorts)", null, "short_story", true),
    R("Ravenor Returned", "Dan Abnett", "403.M41", "c. 403.M41", "Ravenor", "Book 2", "novel", true),
    R("Ravenor Rogue", "Dan Abnett", "404.M41", "404.M41", "Ravenor", "Book 3", "novel", false),
    R("The Curiosity", "Dan Abnett", "448.M41", "448.M41", "Inquisitor (Shorts)", null, "short_story", false),
    R("Gardens of Tycho", "Dan Abnett", "455.M41", "455.M41", "Inquisitor (Shorts)", null, "short_story", false),
    R("The Keeler Image", "Dan Abnett", "465.M41", "c. 465.M41", "Inquisitor (Shorts)", null, "short_story", true),
    R("Perihelion", "Dan Abnett", "470.M41", "c. 470.M41", "Inquisitor (Shorts)", null, "short_story", true),
    R("The Magos", "Dan Abnett", "475.M41", "c. 475.M41", "Eisenhorn", "Book 4", "novel", true),
    R("Pariah", "Dan Abnett", "500.M41", "c. 500.M41", "Bequin", "Book 1", "novel", true),
    R("Farsight: Crisis of Faith", "Phil Kelly", "744.M41", "744.M41", "Farsight", "Book 1", "novel", false),
    R("Farsight: Empire of Lies", "Phil Kelly", "760.M41", "760.M41", "Farsight", "Book 2", "novel", false),
    R("Double Eagle", "Dan Abnett", "773.M41", "773.M41", "Gaunt's Ghosts (Spin-off)", null, "novel", false),
    R("Titanicus", "Dan Abnett", "779.M41", "~779.M41", "Gaunt's Ghosts (Spin-off)", null, "novel", true),
    R("Siege of Vraks", "Steve Lyons", "812-830.M41", "812–830.M41", "Death Korps of Krieg", null, "novel", false),
    R("Assault on Black Reach", "Nick Kyme", "855.M41", "855.M41", "Ultramarines", null, "novel", false),
    R("Carcharodons: Red Tithe", "Robbie MacNiven", "875.M41", "4.550.875.M41", "Carcharodons", null, "novel", false),
    R("Death or Glory", "Sandy Mitchell", "925.M41", "920s.M41", "Ciaphas Cain", "Book 4", "novel", true),
    R("Commissar", "Andy Hoare", "926.M41", "After 833.926.M41", "Imperial Guard", "Book 12", "novel", false),
    R("For the Emperor", "Sandy Mitchell", "931.M41", "931.M41", "Ciaphas Cain", "Book 1", "novel", false),
    R("Caves of Ice", "Sandy Mitchell", "933.M41", "between 931 and 936.M41", "Ciaphas Cain", "Book 2", "novel", true),
    R("Duty Calls", "Sandy Mitchell", "934.M41", "between 931 and 936.M41", "Ciaphas Cain", "Book 5", "novel", true),
    R("The Traitor's Hand", "Sandy Mitchell", "936.M41", "936.M41", "Ciaphas Cain", "Book 3", "novel", false),
    R("Old Soldiers Never Die", "Sandy Mitchell", "938.M41", "938.M41", "Ciaphas Cain", "Novella", "novella", false),
    R("The Greater Good", "Sandy Mitchell", "992.M41", "992.M41", "Ciaphas Cain", "Book 9", "novel", false),
    R("Vainglorious", "Sandy Mitchell", "992.M41", "487.992.M41", "Ciaphas Cain", "Book 11", "novel", false),
    R("Scourge the Heretic", "Sandy Mitchell", "993.M41", "049–231.993.M41", "Dark Heresy", "Book 1", "novel", false),
    R("Innocence Proves Nothing", "Sandy Mitchell", "993.M41", "107–260.993.M41", "Dark Heresy", "Book 2", "novel", false),
    R("13th Legion", "Gav Thorpe", "995.M41", "~995.M41", "Last Chancers", "Book 1", "novel", true),
    R("Kill Team", "Gav Thorpe", "996.M41", "~995–996.M41", "Last Chancers", "Book 2", "novel", true),
    R("Choose Your Enemies", "Sandy Mitchell", "997.M41", "between 931 and 997.M41", "Ciaphas Cain", "Book 10", "novel", true),
    R("Farsight: Blade of Truth", "Phil Kelly", "997.M41", "997.M41", "Farsight", "Book 3", "novel", false),
    R("Dante", "Guy Haley", "998.M41", "998.M41", "Dante", null, "novel", false),
    R("The Devastation of Baal", "Guy Haley", "998-999.M41", "998–999.M41", "Dante", null, "novel", false),
    R("The Fall of Cadia", "Robert Rath", "999.M41", "999.M41", "Standalone", null, "novel", false),
    R("Annihilation Squad", "Gav Thorpe", "999.M41", "999.M41", "Last Chancers", "Book 3", "novel", false),
    R("Dawn of War", "C. S. Goto", "999.M41", "999.M41", "Dawn of War", "Book 1", "novel", false),
    R("Huron Blackheart: Master of the Maelstrom", "Mike Brooks", "999.M41", "~999.M41", "Standalone", null, "novella", true),
    R("His Will", "Guy Haley", "999.M41", "~999.M41", "Dark Imperium", null, "short_story", true),

    // ── 42nd Millennium · Era Indomitus ────────────────────────────────────
    R("The Lion: Son of the Forest", "Mike Brooks", "005.M42", "Early M42", "Standalone", null, "novel", true),
    R("Cain's Last Stand", "Sandy Mitchell", "002-005.M42", "002–005.M42", "Ciaphas Cain", "Book 6", "novel", false),
    R("Indomitus", "Gav Thorpe", "010.M42", "~010.M42", "Indomitus", null, "novel", true),
    R("Dark Imperium", "Guy Haley", "012.M42", "~012.M42", "Dark Imperium", "Book 1", "novel", true),
    R("Plague War", "Guy Haley", "012.M42", "~012.M42", "Dark Imperium", "Book 2", "novel", true),
    R("Godblight", "Guy Haley", "012.M42", "~012.M42", "Dark Imperium", "Book 3", "novel", true),
  ];

  // ── enrichment ────────────────────────────────────────────────────────────
  var ERAS = TLP.buildLabEras(RAW_ERAS);

  function slugify(s) {
    return s.toLowerCase()
      .replace(/['’.:,]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  function eraFor(y) {
    for (var i = 0; i < ERAS.length; i++) {
      if (y >= ERAS[i].start && y <= ERAS[i].end) return ERAS[i].id;
    }
    return ERAS[ERAS.length - 1].id;
  }

  var seenSlug = {};
  var books = SOURCE.map(function (b, i) {
    var p = TLP.parseChrono(b.chrono);
    var sy = p.startY != null ? p.startY : TLP.TIMELINE_MIN;
    var slug = slugify(b.title);
    if (seenSlug[slug]) slug = slug + "-" + (seenSlug[slug] + 1);
    seenSlug[slugify(b.title)] = (seenSlug[slugify(b.title)] || 0) + 1;
    return {
      id: slug,
      slug: slug,
      title: b.title,
      authors: b.authors,
      series: b.series,
      book: b.book,
      fmt: b.fmt,
      raw: b.raw,
      startY: sy,
      endY: p.endY != null ? p.endY : sy,
      isRange: p.endY != null && p.endY !== p.startY,
      settingYKind: b.approx ? "approx" : "known",
      seq: i + 1,
      segment: eraFor(sy),
    };
  });

  // Sort by setting date (then reading order) — the canonical timeline order.
  books.sort(function (a, b) { return a.startY - b.startY || a.seq - b.seq; });

  var bySegment = {};
  ERAS.forEach(function (e) { bySegment[e.id] = []; });
  books.forEach(function (bk) { (bySegment[bk.segment] || (bySegment[bk.segment] = [])).push(bk); });

  var eraById = {};
  ERAS.forEach(function (e) { eraById[e.id] = e; });

  window.HH = {
    ERAS: ERAS,
    books: books,
    bySegment: bySegment,
    eraById: eraById,
    total: books.length,
    // The 3 "broad eras" Philipp asked to keep as the early-millennia focus.
    FOCUS_ERAS: ["great_crusade", "horus_heresy", "age_rebirth"],
  };
})();
