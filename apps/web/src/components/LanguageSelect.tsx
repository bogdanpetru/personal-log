import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";

const LIST_ID = "transcription-language-listbox";

interface LanguageSelectProps {
  /** BCP-47 code of the selected language. */
  value: string;
  disabled?: boolean;
  onChange: (language: string) => void;
}

/** Lowercased, diacritic-stripped form for accent-insensitive search. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Combining_Mark}/gu, "")
    .toLowerCase();
}

export function LanguageSelect({
  value,
  disabled,
  onChange,
}: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = LANGUAGES.find((option) => option.code === value);
  const filtered = useMemo(() => {
    const needle = fold(query.trim());
    if (needle === "") {
      return LANGUAGES;
    }
    return LANGUAGES.filter((option) =>
      fold(`${option.label} ${option.english} ${option.code}`).includes(needle),
    );
  }, [query]);

  // Opening the popup puts focus in the search field.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const openPopup = () => {
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  };

  const closePopup = () => {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  };

  const commit = (code: string) => {
    onChange(code);
    closePopup();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePopup();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[activeIndex];
      if (option) {
        commit(option.code);
      }
      return;
    }
    if (filtered.length === 0) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + filtered.length) % filtered.length,
      );
    } else if (event.key === "Tab") {
      // Let focus move, but the popup closes with it.
      closePopup();
    }
  };

  return (
    <div className="relative w-48">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label="Transcription language"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={open ? LIST_ID : undefined}
        aria-activedescendant={
          open && filtered[activeIndex]
            ? `transcription-language-${filtered[activeIndex].code}`
            : undefined
        }
        disabled={disabled}
        onClick={() => (open ? closePopup() : openPopup())}
        className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-[3px] border border-border bg-transparent px-3 text-sm transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="truncate">{selected ? selected.label : value}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={closePopup}
          />
          <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="Search languages"
                value={query}
                onChange={(event) => {
                  // Typing always restarts keyboard navigation at the first result.
                  setActiveIndex(0);
                  setQuery(event.target.value);
                }}
                onKeyDown={handleInputKeyDown}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul
              role="listbox"
              id={LIST_ID}
              className="max-h-60 overflow-auto p-1"
            >
              {filtered.map((option, index) => {
                const active = index === activeIndex;
                return (
                  <li
                    key={option.code}
                    id={`transcription-language-${option.code}`}
                    role="option"
                    aria-selected={option.code === value}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm ${active ? "bg-muted" : ""}`}
                    tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => commit(option.code)}
                    onMouseMove={() => setActiveIndex(index)}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.code === value && (
                      <Check
                        aria-hidden="true"
                        className="size-4 shrink-0 text-primary"
                      />
                    )}
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {option.english}
                    </span>
                  </li>
                );
              })}
            </ul>
            {filtered.length === 0 && (
              <p className="border-t border-border px-3 py-2 text-sm text-muted-foreground">
                No languages match "{query}"
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}