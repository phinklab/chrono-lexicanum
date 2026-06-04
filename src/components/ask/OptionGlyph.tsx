import type { IconType } from "react-icons";
import {
  GiAlienSkull,
  GiBolterGun,
  GiEagleEmblem,
  GiPentagramRose,
  GiRobotHelmet,
  GiTemplarEye,
} from "react-icons/gi";

/**
 * Faction option glyphs — Game Icons (react-icons/gi), grimdark line-and-fill
 * silhouettes that read cleanly at the slot size. Fill inherits the slot's
 * colour (currentColor = cyan). Returns null for an unknown name so the caller
 * falls back to the numeric index.
 *
 *   aquila  Imperium            chaos  Traitor Legions
 *   skull   Space Marines       eye    Inquisition  (skull -> power-armour helm)
 *   rifle   Astra Militarum      xenos  the Alien
 */
const GLYPHS: Record<string, IconType> = {
  aquila: GiEagleEmblem,
  chaos: GiPentagramRose,
  skull: GiRobotHelmet,
  eye: GiTemplarEye,
  rifle: GiBolterGun,
  xenos: GiAlienSkull,
};

export default function OptionGlyph({ name }: { name: string }) {
  const Icon = GLYPHS[name];
  if (!Icon) return null;
  return <Icon className="ask-option__glyph" size={28} aria-hidden />;
}
