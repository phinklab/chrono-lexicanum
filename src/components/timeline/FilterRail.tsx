"use client";

/**
 * FilterRail — two-axis filter strip for EraDetail (Stufe 2a.2 / brief 029).
 *
 * Axes: Faction (over `work_factions`) and Length (over `work_facets WHERE
 * category='length_tier'`). Multi-select, OR within axis, AND between axes.
 * Filter state lives in the URL exclusively (`?faction=a,b&length=novella`).
 * Every toggle pushes through `router.replace` so Browser-Back doesn't fill
 * with filter clicks; `{ scroll: false }` so toggling doesn't yank the page.
 *
 * Server-side filtering is applied in `loadEraBooks` (page.tsx); this
 * component only RENDERS state and EMITS URL changes — it never inspects
 * `books` itself, so a future refactor of the filter SQL doesn't ripple here.
 *
 * Visual vocabulary: pill controls echoing the chrome `EraToggle`, but laid
 * out as labelled axes (Faction · pills | Length · pills) instead of a
 * segmented mutex — multi-select is the explicit difference.
 *
 * Hide rule: when an axis has only one available value, the axis is omitted
 * (single option is sinnfrei — brief 029 open-question 2 recommendation).
 * If both axes collapse, the whole rail hides — no filtering is meaningful
 * for the era and the EraDetail header's volumes-count carries the signal.
 */

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { type Era, type FilterOption } from "@/lib/timeline";
import {
  buildEraUrl,
  buildFilterUrl,
  parseFilterParams,
} from "@/lib/timelineUrl";

interface FilterRailProps {
  era: Era;
  availableFactions: readonly FilterOption[];
  availableLengthTiers: readonly FilterOption[];
  totalInEra: number;
  matchedCount: number;
}

export default function FilterRail({
  era,
  availableFactions,
  availableLengthTiers,
  totalInEra,
  matchedCount,
}: FilterRailProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const showFaction = availableFactions.length >= 2;
  const showLength = availableLengthTiers.length >= 2;

  const { factionIds, lengthIds } = useMemo(
    () => parseFilterParams(new URLSearchParams(sp.toString())),
    [sp],
  );

  const hasActive = factionIds.length > 0 || lengthIds.length > 0;

  // Both axes collapsed and no stale active filter → render nothing. (A stale
  // active filter for a hidden axis would still need a way out; leave the
  // rail visible in that case so the reset link surfaces.)
  if (!showFaction && !showLength && !hasActive) return null;

  function toggle(axis: "faction" | "length", id: string) {
    const current = axis === "faction" ? factionIds : lengthIds;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    const target = buildFilterUrl(
      axis,
      next,
      new URLSearchParams(sp.toString()),
    );
    router.replace(target, { scroll: false });
  }

  return (
    <div
      className="filter-rail"
      role="region"
      aria-label="Filter — faction and length"
    >
      <div className="fr-header">
        <span className="fr-eyebrow" aria-hidden>
          {"// FILTER"}
        </span>
        <span className="fr-count" aria-live="polite">
          <span className="fr-count-num">
            {String(matchedCount).padStart(2, "0")}
          </span>
          <span className="fr-count-sep" aria-hidden>
            /
          </span>
          <span className="fr-count-total">
            {String(totalInEra).padStart(2, "0")}
          </span>
          <span className="fr-count-label">volumes</span>
        </span>
        {hasActive && (
          <Link
            href={buildEraUrl(era.id, new URLSearchParams(sp.toString()))}
            className="fr-reset"
            replace
            scroll={false}
          >
            × Clear filters
          </Link>
        )}
      </div>

      {showFaction && (
        <FilterAxis
          label="Faction"
          options={availableFactions}
          selected={factionIds}
          onToggle={(id) => toggle("faction", id)}
        />
      )}
      {showLength && (
        <FilterAxis
          label="Length"
          options={availableLengthTiers}
          selected={lengthIds}
          onToggle={(id) => toggle("length", id)}
        />
      )}
    </div>
  );
}

interface FilterAxisProps {
  label: string;
  options: readonly FilterOption[];
  selected: readonly string[];
  onToggle: (id: string) => void;
}

function FilterAxis({ label, options, selected, onToggle }: FilterAxisProps) {
  const groupId = `fr-axis-${label.toLowerCase()}`;
  return (
    <div className="fr-axis" role="group" aria-labelledby={groupId}>
      <div className="fr-axis-label" id={groupId}>
        {label}
      </div>
      <div className="fr-pills">
        {options.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              className={clsx("fr-pill", active && "active")}
              aria-pressed={active}
              onClick={() => onToggle(opt.id)}
            >
              {opt.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
