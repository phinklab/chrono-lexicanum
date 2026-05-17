// Timeline eras — each era stores its own snapshot of the map state
// (landmarks, nebulae, cicatrix spine, necron dynasties, tyranid swarms).
// The active era + per-era snapshots live in localStorage so refresh
// preserves both your current era selection AND each era's edits.

window.ERAS = [
  {
    id: 'm31-horus-heresy',
    code: 'M31',
    name: 'Horus Heresy',
    sub: 'Civil War · Siege of Terra',
    accent: '#d04428',
    blurb: 'Brother turns on brother. The Warmaster\'s fleet burns toward Sol. Half the Legions are damned.',
    comingSoon: true,
  },
  {
    id: 'm41-imperium',
    code: 'M41',
    name: 'Age of the Imperium',
    sub: 'Late M41 · 13th Black Crusade',
    accent: '#f0b248',
    blurb: 'Ten thousand years of grinding war. Cadia stands. The Eye festers. Hive Fleets close from the Fringe.',
    comingSoon: true,
  },
  {
    id: 'm42-indomitus',
    code: 'M42',
    name: 'Era Indomitus',
    sub: 'Dark Imperium · Cicatrix Maledictum',
    accent: '#5ec8ef',
    blurb: 'Cadia is dust. The Great Rift bisects the galaxy. Guilliman walks again at the head of the Indomitus Crusade.',
  },
];

window.DEFAULT_ERA = 'm42-indomitus';
