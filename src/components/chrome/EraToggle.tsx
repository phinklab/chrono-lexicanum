"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * EraToggle — three-button millennium switcher (M30 / M31 / M42) wired to the
 * URL search param `?era=`. Source of truth is the URL.
 *
 * URL contract (set by brief 2026-04-29-008): the visible labels are
 * Warhammer-canon shorthand (M30 / M31 / M42), but the value written to
 * `?era=` is the prototype era id the Timeline route consumes:
 *
 *   M30 → ?era=great_crusade
 *   M31 → ?era=horus_heresy
 *   M42 → ?era=indomitus
 *
 * The four non-canonical eras (age_rebirth, long_war, age_apostasy,
 * time_ending) are reachable by clicking the Overview ribbon — they have
 * no toggle button. When `?era=` matches one of them (or is absent), no
 * toggle button is in the active state.
 *
 * Click behaviour: clicking a button writes its mapped era id to the URL.
 * Clicking the active button is a no-op (the toggle is a 3-way mutex; to
 * leave a canonical era you click the Overview ribbon back, not the toggle).
 *
 * Updates use `router.replace` so the back-button doesn't fill with era
 * flips, and `{ scroll: false }` so toggling doesn't yank the page.
 *
 * Legacy tolerance: page.tsx redirects `?era=M30 | M31 | M42` (the value the
 * pre-008 toggle wrote) to the mapped era id, so old shared URLs keep working.
 */

const TOGGLE_TO_ERA = {
  M30: "great_crusade",
  M31: "horus_heresy",
  M42: "indomitus",
} as const;

const BUTTONS = ["M30", "M31", "M42"] as const;
type ToggleLabel = (typeof BUTTONS)[number];
type EraId = (typeof TOGGLE_TO_ERA)[ToggleLabel];

const ERA_TO_TOGGLE: Record<EraId, ToggleLabel> = {
  great_crusade: "M30",
  horus_heresy: "M31",
  indomitus: "M42",
};

function eraToActiveLabel(era: string | null): ToggleLabel | null {
  if (!era) return null;
  return (ERA_TO_TOGGLE as Record<string, ToggleLabel>)[era] ?? null;
}

export default function EraToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const active = eraToActiveLabel(params.get("era"));

  function pick(label: ToggleLabel) {
    if (label === active) return;
    const merged = new URLSearchParams(params.toString());
    merged.set("era", TOGGLE_TO_ERA[label]);
    const qs = merged.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="era-toggle" role="group" aria-label="Era">
      {BUTTONS.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => pick(label)}
          className={label === active ? "active" : undefined}
          aria-pressed={label === active}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
