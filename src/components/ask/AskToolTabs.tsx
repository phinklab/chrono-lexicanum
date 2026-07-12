import Link from "next/link";

/**
 * The tool doors — the two named ways into the catalogue (questionnaire and
 * faction tool), as prominent as the archive's Books/Podcasts doors and in the
 * same door grammar (arch-door classes, 31-catalogue.css). Pure Links, server
 * component; the active route carries the Sternwarte dot in its kicker.
 * `scroll={false}` + `prefetch={true}`: switching tools is a view swap — the
 * soft nav keeps the reader at the same scroll depth instead of jumping back
 * to the hero, and the full-route prefetch has the other tool ready in the
 * router cache when clicked (production; prefetch is disabled in dev).
 * Cold/slow switches fall back to the jump-proof cogitator screen
 * (ask/loading.tsx).
 */
export type AskTool = "questionnaire" | "faction";

const TABS: ReadonlyArray<{
  id: AskTool;
  href: string;
  kicker: string;
  label: string;
  desc: string;
}> = [
  {
    id: "questionnaire",
    href: "/ask",
    kicker: "Tool I",
    label: "Ask the Archive",
    desc: "Four questions to your one entry book.",
  },
  {
    id: "faction",
    href: "/ask/faction",
    kicker: "Tool II",
    label: "One Faction, One Book",
    desc: "Pick a banner and get one curated start.",
  },
];

export default function AskToolTabs({ active }: { active: AskTool }) {
  return (
    <nav className="arch-doors ask-doors" aria-label="Find your next book">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            scroll={false}
            prefetch={true}
            className={`arch-door${isActive ? " is-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="arch-door__kicker">{tab.kicker}</span>
            <span className="arch-door__title">{tab.label}</span>
            <span className="arch-door__count">{tab.desc}</span>
          </Link>
        );
      })}
    </nav>
  );
}
