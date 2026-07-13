import Link from "next/link";
import BtnFx from "@/components/shared/BtnFx";
import SternwarteRings from "@/components/shared/SternwarteRings";
// Component-scoped stylesheet (S7a): the Curator threshold and compact switch
// ride with both tool routes.
import "@/app/styles/53-ask.css";

/**
 * The Curator has two presentations of the same routes:
 * - `landing`: two generous Sternwarte-dot doorways, shown only before a tool
 *   has been chosen;
 * - `compact`: a quiet inline switch above the active tool.
 *
 * Keeping both in one server component makes the labels, URLs and a11y state a
 * single contract while letting the selected tool own the visual hierarchy.
 */
export type AskTool = "questionnaire" | "faction";
export type AskToolTabsVariant = "landing" | "compact";

const TABS: ReadonlyArray<{
  id: AskTool;
  href: string;
  label: string;
  compactLabel: string;
  desc: string;
}> = [
  {
    id: "questionnaire",
    href: "/ask?mode=profile",
    label: "Four Questions",
    compactLabel: "Questions",
    desc: "Answer a short reading profile and receive a ranked path through the shelves.",
  },
  {
    id: "faction",
    href: "/ask/faction",
    label: "By Faction",
    compactLabel: "Faction",
    desc: "Choose an army and receive one carefully curated entry point.",
  },
];

type AskToolTabsProps = {
  active: AskTool | null;
  variant?: AskToolTabsVariant;
};

export default function AskToolTabs({
  active,
  variant = "compact",
}: AskToolTabsProps) {
  if (variant === "landing") {
    return (
      <nav className="curator-picker" aria-label="Choose a Curator path">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            prefetch
            className="lx-btn curator-picker__path"
          >
            <span className="curator-picker__label">{tab.label}</span>
            <span className="curator-picker__desc">{tab.desc}</span>
            <BtnFx />
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="curator-switch" aria-label="Curator paths">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            prefetch
            className={`curator-switch__link${isActive ? " is-active" : ""}`}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="curator-switch__dot" aria-hidden>
              <span className="curator-switch__seed" />
              {isActive && <SternwarteRings className="curator-switch__rings" />}
            </span>
            <span>{tab.compactLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
