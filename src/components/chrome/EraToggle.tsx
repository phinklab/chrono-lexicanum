"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * EraToggle — three-state toggle (M30 / M31 / M42) wired to the URL search
 * param `?era=`. Source of truth is the URL; default (no param) = M31.
 *
 * URL-writing policy: clicking a non-default era sets `?era=...`; clicking
 * M31 (the default) strips the param so the canonical Hub URL stays clean.
 * Two URL states ('/' and '/?era=M31') therefore both render M31 active.
 * The trade is: shareable links explicitly carry M30 / M42 but the default
 * URL doesn't get noisier.
 *
 * Updates use `router.replace` (not `push`) so back-button doesn't fill with
 * era flips, and `{ scroll: false }` so toggling doesn't yank the page.
 *
 * Phase 2a's Timeline picks up the param this brief writes; nothing else
 * reads `era` today.
 */
const ERAS = ["M30", "M31", "M42"] as const;
type Era = (typeof ERAS)[number];
const DEFAULT: Era = "M31";

function isEra(value: string | null): value is Era {
  return value !== null && (ERAS as readonly string[]).includes(value);
}

export default function EraToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const raw = params.get("era");
  const active: Era = isEra(raw) ? raw : DEFAULT;

  function pick(next: Era) {
    if (next === active) return;
    const merged = new URLSearchParams(params.toString());
    if (next === DEFAULT) merged.delete("era");
    else merged.set("era", next);
    const qs = merged.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="era-toggle" role="group" aria-label="Era">
      {ERAS.map((era) => (
        <button
          key={era}
          type="button"
          onClick={() => pick(era)}
          className={era === active ? "active" : undefined}
          aria-pressed={era === active}
        >
          {era}
        </button>
      ))}
    </div>
  );
}
