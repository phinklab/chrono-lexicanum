"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Shared transition for programmatic server-bound navigation. Action and state
 * contexts are split so action-only consumers do not re-render on pending
 * changes. Raw `isPending` drives accessibility immediately; delayed
 * `pendingVisible` prevents visual flashes on instant/cached navigation.
 * Route loading boundaries cover the later stream-to-paint phase.
 */

type NavOptions = { scroll?: boolean };

interface NavActions {
  /** Push (stacks history) inside the shared transition. */
  navigate: (href: string, opts?: NavOptions) => void;
  /** Replace (no history entry) inside the shared transition. */
  replace: (href: string, opts?: NavOptions) => void;
}

interface NavState {
  /** True the instant a nav starts — wire to `aria-busy`. */
  isPending: boolean;
  /** True only once pending outlasts the anti-flash delay — wire to visuals. */
  pendingVisible: boolean;
}

const NavActionsContext = createContext<NavActions | null>(null);
const NavStateContext = createContext<NavState>({
  isPending: false,
  pendingVisible: false,
});

/**
 * Delay before the indicator is allowed to paint. A navigation that commits
 * faster than this clears the timer and shows nothing — the "no flash on
 * instant/cached navs" guarantee. 120ms sits under the ~200ms threshold where a
 * response still feels immediate, so genuine waits light up promptly.
 */
const SHOW_DELAY_MS = 120;

export function useRouteNav(): NavActions {
  const ctx = useContext(NavActionsContext);
  if (!ctx) {
    throw new Error("useRouteNav must be used within <NavProgressProvider>");
  }
  return ctx;
}

export function useRouteNavState(): NavState {
  return useContext(NavStateContext);
}

export function NavProgressProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingVisible, setPendingVisible] = useState(false);

  const navigate = useCallback(
    (href: string, opts?: NavOptions) => {
      startTransition(() => {
        router.push(href, opts);
      });
    },
    [router],
  );

  const replace = useCallback(
    (href: string, opts?: NavOptions) => {
      startTransition(() => {
        router.replace(href, opts);
      });
    },
    [router],
  );

  // Anti-flash gate: while a nav is pending, arm a timer to reveal the
  // indicator once the wait outlasts the threshold. The cleanup — run when
  // pending flips back to false (or on unmount) — clears the timer and hides
  // the indicator again, so a fast/cached nav that resolves first reveals
  // nothing. Keeping the reveal in the timer and the reset in cleanup avoids a
  // synchronous setState in the effect body.
  useEffect(() => {
    if (!isPending) return;
    const timer = setTimeout(() => setPendingVisible(true), SHOW_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setPendingVisible(false);
    };
  }, [isPending]);

  const actions = useMemo<NavActions>(
    () => ({ navigate, replace }),
    [navigate, replace],
  );
  const state = useMemo<NavState>(
    () => ({ isPending, pendingVisible }),
    [isPending, pendingVisible],
  );

  return (
    <NavActionsContext.Provider value={actions}>
      <NavStateContext.Provider value={state}>
        {children}
        <RouteProgressBar />
      </NavStateContext.Provider>
    </NavActionsContext.Provider>
  );
}

/**
 * The global indicator: a gold hairline beam sweeping the top edge of the
 * viewport while a transition is in flight. `position: fixed` + always mounted
 * → zero layout shift; opacity gated on `pendingVisible` → no flash. Reduced
 * motion swaps the sweep for a calm static rail (and the global cascade in
 * 10-base.css stills the keyframe besides).
 */
function RouteProgressBar() {
  const { pendingVisible } = useRouteNavState();
  const reduced = useReducedMotion();

  const className = [
    "route-progress",
    pendingVisible ? "is-active" : "",
    reduced ? "route-progress--static" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // aria-busy follows the gated signal (not raw isPending) so a sub-threshold
  // nav that resolves in <120ms never toggles the live region.
  return (
    <div className={className} role="status" aria-busy={pendingVisible}>
      <span className="route-progress__track" aria-hidden>
        <span className="route-progress__beam" />
      </span>
      <span className="route-progress__sr">
        {pendingVisible ? "Loading…" : ""}
      </span>
    </div>
  );
}
