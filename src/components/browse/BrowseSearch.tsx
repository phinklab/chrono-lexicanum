"use client";

import {
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  rankSuggestions,
  SUGGEST_GROUP_LABEL,
  SUGGEST_MIN_LEN,
  type Suggestion,
} from "@/app/archive/filters";

/**
 * BrowseSearch — the canonical "search everything we can filter" combobox,
 * shared by /werke and Home as
 * one console rather than two copies. It owns all the combobox MECHANICS — the
 * grouped typeahead, keyboard model (↑/↓/Enter/Esc), active-descendant, the live
 * status region, click-outside and scroll-into-view — and renders the exact
 * `.browse-search` + `.browse-suggest` markup the CSS already styles.
 *
 * The suggestion index is NOT a prop (Launch S6): serialized into the page it
 * cost every route ~470 KB of initial HTML/RSC. The console fetches
 * `/api/search-index` lazily on the visitor's first focus/keystroke; the
 * resolved index is module-cached, so all consoles (Home, /archive,
 * /archive/podcasts) share one fetch per session. Until it arrives — or if it
 * fails — the free-text path (`Enter` → onSubmit) works regardless; the
 * dropdown says so instead of faking an empty result.
 *
 * It owns NO routing. The query value is fully controlled (`value` /
 * `onValueChange`) so /werke can mirror it from the URL `q`, and every commit is
 * delegated to the parent:
 *   - onPick(s)    — a chosen suggestion (book / faction / facet / format / author)
 *   - onSubmit(q)  — the broadened free-text search (Enter with nothing highlighted)
 *   - onClear()    — the custom × button
 * /werke wires these to filter-in-place (`router.replace`, scroll preserved);
 * Home wires them to navigate into the archive (`router.push` to /book or /archive).
 * The filter/rank contract stays the single pure source in `werke/filters.ts`.
 */

/** Module-scoped index cache: one fetch per SPA session shared by every
 *  console. A failed fetch clears the slot so the next focus retries. */
let indexPromise: Promise<Suggestion[]> | null = null;
let resolvedIndex: Suggestion[] | null = null;

function fetchSearchIndex(): Promise<Suggestion[]> {
  if (!indexPromise) {
    indexPromise = fetch("/api/search-index")
      .then(async (res) => {
        if (!res.ok) throw new Error(`search index: HTTP ${res.status}`);
        const data = (await res.json()) as Suggestion[];
        resolvedIndex = data;
        return data;
      })
      .catch((err: unknown) => {
        indexPromise = null;
        throw err;
      });
  }
  return indexPromise;
}

export default function BrowseSearch({
  value,
  onValueChange,
  onPick,
  onSubmit,
  onClear,
  pending = false,
  placeholder = "Search titles, authors, factions, facets…",
  ariaLabel = "Search the book archive",
}: {
  value: string;
  onValueChange: (next: string) => void;
  onPick: (suggestion: Suggestion) => void;
  onSubmit: (query: string) => void;
  onClear: () => void;
  /** A pick is navigating (anti-flash-gated). Tints + spins the reticle and
   *  flags the form `aria-busy`, so the box acknowledges the click while the
   *  target streams. Parents source this from `useRouteNavState().pendingVisible`. */
  pending?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}) {
  // Combobox state: dropdown open + active descendant (-1 = none, input owns).
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // The lazily-fetched index. Initialised from the module cache so a console
  // mounted after a soft-nav starts ready instead of re-showing the load hint.
  const [index, setIndex] = useState<Suggestion[] | null>(resolvedIndex);
  const [indexFailed, setIndexFailed] = useState(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;

  // First focus/keystroke pulls the index; later calls are no-ops (or retries
  // after a failure). Resolution is idempotent, so a stale console picking up
  // the shared promise after remount is fine.
  function ensureIndex() {
    if (index !== null) return;
    setIndexFailed(false);
    fetchSearchIndex()
      .then(setIndex)
      .catch(() => setIndexFailed(true));
  }

  // Ranking is pure but O(index) per keystroke (~3,400 entries) — memoised so
  // unrelated re-renders (pending tint, focus churn) don't re-rank.
  const suggestions = useMemo(
    () => (index ? rankSuggestions(index, value) : []),
    [index, value],
  );
  const showList = open && value.trim().length >= SUGGEST_MIN_LEN;

  function closeList() {
    setOpen(false);
    setActive(-1);
  }

  // A picked suggestion: close, then hand the routing/draft decision to the
  // parent. The parent owns the value, so it adjusts the draft (clear it for a
  // book/faction pick, set it to the author name, …) as its mode dictates.
  function pick(s: Suggestion) {
    closeList();
    onPick(s);
  }

  function submitQuery() {
    closeList();
    onSubmit(value.trim());
  }

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    submitQuery();
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showList) {
        setOpen(true);
        setActive(suggestions.length ? 0 : -1);
      } else {
        setActive((i) => Math.min(suggestions.length - 1, i + 1));
      }
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (showList && active >= 0 && suggestions[active]) {
        pick(suggestions[active]);
      } else {
        // No highlighted suggestion → run the broadened free-text search
        // explicitly (don't depend on implicit form submission).
        submitQuery();
      }
      return;
    }
    if (e.key === "Escape") {
      if (showList) {
        e.preventDefault();
        closeList();
      }
    }
  }

  function clearSearch() {
    closeList();
    onClear();
    inputRef.current?.focus();
  }

  // Pointer outside the search console closes the dropdown.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeList();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!showList || active < 0) return;
    document
      .getElementById(`${baseId}-opt-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, showList, baseId]);

  const activeId = showList && active >= 0 ? `${baseId}-opt-${active}` : undefined;

  const indexReady = index !== null;
  const emptyHint = indexFailed
    ? "Suggestions unavailable. Press Enter to search every field."
    : "No quick matches. Press Enter to search every field.";

  // Announced to assistive tech when the suggestion set changes (WCAG 4.1.3):
  // sighted users read the dropdown; SR users get the count via this live node.
  const statusMsg = !showList
    ? ""
    : !indexReady
      ? indexFailed
        ? "Suggestions unavailable. Press Enter to search every field."
        : "Consulting the index…"
      : suggestions.length === 0
        ? "No quick matches. Press Enter to search every field."
        : `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"}`;

  return (
    <form
      ref={rootRef}
      className={`browse-search browse-search--live${
        pending ? " browse-search--pending" : ""
      }`}
      role="search"
      aria-busy={pending || undefined}
      onSubmit={onSearchSubmit}
    >
      <input
        ref={inputRef}
        type="search"
        className="browse-search__input"
        placeholder={placeholder}
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList && suggestions.length > 0 ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          ensureIndex();
          onValueChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          ensureIndex();
          if (value.trim().length >= SUGGEST_MIN_LEN) setOpen(true);
        }}
        onKeyDown={onInputKeyDown}
      />
      {value && (
        <button
          type="button"
          className="browse-search__clear"
          aria-label="Clear search"
          onClick={clearSearch}
        >
          ×
        </button>
      )}

      <span className="browse-search__status" role="status" aria-live="polite">
        {statusMsg}
      </span>

      {showList && (
        <div className="browse-suggest">
          {!indexReady ? (
            <p className="browse-suggest__empty">
              {indexFailed ? (
                <>
                  Suggestions unavailable. Press <kbd>Enter</kbd> to search
                  every field.
                </>
              ) : (
                <>Consulting the index…</>
              )}
            </p>
          ) : suggestions.length === 0 ? (
            <p className="browse-suggest__empty">
              No quick matches. Press <kbd>Enter</kbd> to search every field.
            </p>
          ) : (
            <>
              <ul
                id={listId}
                className="browse-suggest__list"
                role="listbox"
                aria-label="Search suggestions"
              >
                {suggestions.map((s, i) => {
                  const newGroup = i === 0 || suggestions[i - 1].kind !== s.kind;
                  return (
                    <Fragment key={`${s.kind}:${s.value}`}>
                      {newGroup && (
                        <li
                          className="browse-suggest__group"
                          role="presentation"
                          aria-hidden="true"
                        >
                          {SUGGEST_GROUP_LABEL[s.kind]}
                        </li>
                      )}
                      <li
                        id={`${baseId}-opt-${i}`}
                        role="option"
                        aria-selected={i === active}
                        // The visible label drops the kind; spell it out here so
                        // a screen reader hears "Faction: White Scars" etc.
                        aria-label={`${SUGGEST_GROUP_LABEL[s.kind]}: ${s.label}${
                          s.hint ? `, ${s.hint}` : ""
                        }`}
                        className={`browse-suggest__opt browse-suggest__opt--${s.kind}${
                          i === active ? " is-active" : ""
                        }`}
                        onMouseEnter={() => setActive(i)}
                        // mousedown (not click) fires before the input blur, so
                        // the pick lands before the click-outside handler closes.
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pick(s);
                        }}
                      >
                        <span className="browse-suggest__label">
                          {highlight(s.label, value)}
                        </span>
                        {s.hint && (
                          <span className="browse-suggest__hint">{s.hint}</span>
                        )}
                      </li>
                    </Fragment>
                  );
                })}
              </ul>
              <p className="browse-suggest__foot">
                <kbd>Enter</kbd>: search every field for “{value.trim()}”
              </p>
            </>
          )}
        </div>
      )}
    </form>
  );
}

/** Bold the first case-insensitive occurrence of `query` inside `label`. */
function highlight(label: string, query: string): ReactNode {
  const needle = query.trim().toLowerCase();
  if (!needle) return label;
  const at = label.toLowerCase().indexOf(needle);
  if (at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <mark className="browse-suggest__hit">{label.slice(at, at + needle.length)}</mark>
      {label.slice(at + needle.length)}
    </>
  );
}
