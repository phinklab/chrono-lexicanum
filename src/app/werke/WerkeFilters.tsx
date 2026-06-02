"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import FilterSelect from "@/components/browse/FilterSelect";
import {
  rankSuggestions,
  SORT_OPTIONS,
  SUGGEST_GROUP_LABEL,
  SUGGEST_MIN_LEN,
  type SortKey,
  type Suggestion,
} from "./filters";

type Option = { value: string; label: string };

/**
 * Public browse controls for `/werke` (Brief 120). Every control writes to the
 * URL (`router.replace`, scroll preserved) so a filtered view is a shareable
 * link and the server re-renders the list. This island only reads/writes
 * params — the server owns the actual filtering (`applyWorksFilters`).
 *
 * The search is a universal typeahead (combobox): as the visitor types, a
 * grouped dropdown ranks the server-built `index` of books, factions, facets,
 * formats and authors. Picking a book opens it; picking a faction/facet/format
 * applies that filter; picking an author searches it. Submitting raw text runs
 * the broadened free-text `q` filter (which itself reaches across all of those
 * fields). So one box does the job the separate dropdowns also do — "search
 * for everything we can filter."
 *
 * Two rows by design: the prominent query console over a quieter row of facet
 * controls (Faction / Format / Sort). The dropdowns are the on-brand
 * `FilterSelect` (ARIA listbox), not native `<select>`.
 */
export default function WerkeFilters({
  factions,
  formats,
  activeFacet,
  index,
}: {
  factions: Option[];
  formats: Option[];
  activeFacet: { id: string; name: string; category: string | null } | null;
  index: Suggestion[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const sort = (params.get("sort") as SortKey | null) ?? "title";
  const faction = params.get("faction") ?? "";
  const format = params.get("format") ?? "";
  const facet = params.get("facet");
  const qParam = params.get("q") ?? "";

  // Local mirror of the search box so typing doesn't replace the URL on every
  // keystroke; the URL updates on submit (Enter / search button) or on picking
  // a suggestion. When the URL's q changes from outside (a facet link, Clear
  // all), re-sync during render — React's "adjust state when a prop changes"
  // pattern, no effect needed.
  const [q, setQ] = useState(qParam);
  const [prevQParam, setPrevQParam] = useState(qParam);
  if (qParam !== prevQParam) {
    setPrevQParam(qParam);
    setQ(qParam);
  }

  // Combobox state: dropdown open + active descendant (-1 = none, input owns).
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;

  const suggestions = useMemo(() => rankSuggestions(index, q), [index, q]);
  const showList = open && q.trim().length >= SUGGEST_MIN_LEN;

  const anyFilter = Boolean(qParam || faction || format || facet);

  function commit(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    commit(next);
  }

  function closeList() {
    setOpen(false);
    setActive(-1);
  }

  // Commit a picked suggestion. A book opens (soft-nav → the `(.)buch`
  // intercept mounts the overlay); a faction/facet/format applies that filter
  // and consumes the typed text; an author runs a text search for that name.
  const select = useCallback(
    (s: Suggestion) => {
      closeList();
      switch (s.kind) {
        case "book":
          // Consume the draft so the input is empty when focus returns here
          // after the book overlay closes (else onFocus would reopen the
          // dropdown over the just-dismissed book).
          setQ("");
          router.push(`/buch/${s.value}`);
          break;
        case "faction":
          setQ("");
          setParam("faction", s.value);
          break;
        case "facet":
          setQ("");
          setParam("facet", s.value);
          break;
        case "format":
          setQ("");
          setParam("format", s.value);
          break;
        case "author":
          setQ(s.value);
          setParam("q", s.value);
          break;
      }
    },
    // setParam/router are stable enough for this island; deps intentionally lean.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, params, pathname],
  );

  function submitQuery() {
    closeList();
    setParam("q", q.trim() || null);
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
        select(suggestions[active]);
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
    setQ("");
    closeList();
    setParam("q", null);
    inputRef.current?.focus();
  }

  function clearAll() {
    const next = new URLSearchParams();
    if (sort !== "title") next.set("sort", sort);
    closeList();
    commit(next);
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

  const activeId =
    showList && active >= 0 ? `${baseId}-opt-${active}` : undefined;

  // Announced to assistive tech when the suggestion set changes (WCAG 4.1.3):
  // sighted users read the dropdown; SR users get the count via this live node.
  const statusMsg = !showList
    ? ""
    : suggestions.length === 0
      ? "No quick matches — press Enter to search every field."
      : `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"}`;

  return (
    <div className="browse-filters" role="group" aria-label="Browse the archive">
      <form
        ref={rootRef}
        className="browse-search"
        role="search"
        onSubmit={onSearchSubmit}
      >
        <svg className="browse-search__sigil" viewBox="0 0 16 16" aria-hidden>
          <circle cx="8" cy="8" r="5.4" fill="none" stroke="currentColor" strokeWidth="1" />
          <path
            d="M8 0.5v3M8 12.5v3M0.5 8h3M12.5 8h3"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          className="browse-search__input"
          placeholder="Search titles, authors, factions, facets…"
          aria-label="Search the book archive"
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList && suggestions.length > 0 ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            if (q.trim().length >= SUGGEST_MIN_LEN) setOpen(true);
          }}
          onKeyDown={onInputKeyDown}
        />
        {q && (
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
            {suggestions.length === 0 ? (
              <p className="browse-suggest__empty">
                No quick matches — press <kbd>Enter</kbd> to search every field.
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
                            select(s);
                          }}
                        >
                          <span className="browse-suggest__label">
                            {highlight(s.label, q)}
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
                  <kbd>Enter</kbd> — search every field for “{q.trim()}”
                </p>
              </>
            )}
          </div>
        )}
      </form>

      <div className="browse-controls">
        <FilterSelect
          label="Faction"
          value={faction}
          allLabel="All factions"
          options={factions}
          onChange={(v) => setParam("faction", v)}
        />
        <FilterSelect
          label="Format"
          value={format}
          allLabel="All formats"
          options={formats}
          onChange={(v) => setParam("format", v)}
        />

        <div className="browse-sort" role="group" aria-label="Sort">
          <span className="browse-sort__label" aria-hidden>
            Sort
          </span>
          {SORT_OPTIONS.map((o) => {
            const isActive = sort === o.id;
            return (
              <button
                key={o.id}
                type="button"
                className={`browse-pill${isActive ? " active" : ""}`}
                aria-pressed={isActive}
                onClick={() => setParam("sort", o.id === "title" ? null : o.id)}
              >
                {o.label}
              </button>
            );
          })}
        </div>

        {activeFacet && (
          <button
            type="button"
            className="browse-facet-chip"
            onClick={() => setParam("facet", null)}
            title="Clear facet filter"
          >
            <span className="browse-facet-chip__key">
              {activeFacet.category ?? "Facet"}:
            </span>{" "}
            {activeFacet.name}
            <span className="browse-facet-chip__x" aria-hidden>
              ×
            </span>
          </button>
        )}

        {anyFilter && (
          <button type="button" className="browse-clear" onClick={clearAll}>
            Clear all
          </button>
        )}
      </div>
    </div>
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
