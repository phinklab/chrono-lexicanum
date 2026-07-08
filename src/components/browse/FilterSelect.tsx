"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export type FilterOption = { value: string; label: string };

/**
 * On-brand replacement for the browse `<select>` controls.
 * The native `<select>` popup renders in the OS theme — on the dark catalogue
 * surface that reads as an unreadable "silver" menu. This is a real ARIA
 * listbox (button + popover) so the menu inherits the site's tokens and stays
 * legible, while keeping full keyboard semantics (arrow/Home/End/Enter/Esc,
 * click-outside, active-descendant).
 *
 * Stateless w.r.t. the URL: selecting an option calls `onChange(value | null)`
 * and the parent commits it to the query string (`router.replace`, scroll
 * preserved).
 */
export default function FilterSelect({
  label,
  value,
  allLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  allLabel: string;
  options: readonly FilterOption[];
  onChange: (value: string | null) => void;
}) {
  const items: FilterOption[] = [{ value: "", label: allLabel }, ...options];
  const selectedIndex = Math.max(
    0,
    items.findIndex((o) => o.value === value),
  );

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const baseId = useId();

  const close = useCallback((focusButton: boolean) => {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }, []);

  // Open seeds the active option to the current selection (done here, in the
  // event handler, rather than in an effect — keeps state-sync out of render).
  function openMenu() {
    setActive(selectedIndex);
    setOpen(true);
  }

  // Pointer outside the control closes it.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // On open, move focus into the listbox so arrow keys work immediately.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  // Keep the active option scrolled into view (faction lists can be long).
  useEffect(() => {
    if (!open) return;
    document
      .getElementById(`${baseId}-opt-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open, baseId]);

  function choose(idx: number) {
    onChange(items[idx].value || null);
    close(true);
  }

  function onButtonKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  }

  function onListKeyDown(e: ReactKeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(items.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(items.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  }

  const isSet = Boolean(value);

  return (
    <div className="filter-select" ref={rootRef}>
      <span className="filter-select__label" id={`${baseId}-label`}>
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        className={`filter-select__btn${isSet ? " is-set" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${baseId}-label ${baseId}-value`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKeyDown}
      >
        <span className="filter-select__value" id={`${baseId}-value`}>
          {items[selectedIndex]?.label ?? allLabel}
        </span>
        <span className="filter-select__caret" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          className="filter-select__list"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${baseId}-label`}
          aria-activedescendant={`${baseId}-opt-${active}`}
          onKeyDown={onListKeyDown}
        >
          {items.map((o, idx) => {
            const selected = idx === selectedIndex;
            return (
              <li
                key={o.value || "__all"}
                id={`${baseId}-opt-${idx}`}
                role="option"
                aria-selected={selected}
                className={`filter-select__opt${
                  idx === active ? " is-active" : ""
                }${selected ? " is-selected" : ""}`}
                onMouseEnter={() => setActive(idx)}
                onClick={() => choose(idx)}
              >
                <span className="filter-select__opt-label">{o.label}</span>
                {selected && (
                  <span className="filter-select__tick" aria-hidden>
                    ✓
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
