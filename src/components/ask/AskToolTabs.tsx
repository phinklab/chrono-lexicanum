import Link from "next/link";

/**
 * The hub switch (Brief 166). Two named ways into the catalogue — the
 * questionnaire and the faction tool — sit side by side as a segmented control.
 * Pure Links, so it is a server component and fully keyboard-operable for free;
 * the active route is marked with `aria-current="page"` and a `data-active`
 * hook the CSS reads. Rendered in both tool masts so the reader always sees
 * both paths and can cross between them.
 */
export type AskTool = "questionnaire" | "faction";

const TABS: ReadonlyArray<{ id: AskTool; href: string; label: string }> = [
  { id: "questionnaire", href: "/ask", label: "Ask the Archive" },
  { id: "faction", href: "/ask/fraktion", label: "One Faction, One Book" },
];

export default function AskToolTabs({ active }: { active: AskTool }) {
  return (
    <nav className="ask-tabs" aria-label="Find your next book">
      <ul className="ask-tabs__list">
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <li key={tab.id} className="ask-tabs__item">
              <Link
                href={tab.href}
                className="ask-tabs__link"
                data-active={isActive}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
