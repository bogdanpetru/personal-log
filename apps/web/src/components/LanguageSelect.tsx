import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { searchLanguages } from "@/lib/languageSearch";
import { LANGUAGES } from "@/lib/languages";
import {
  LanguageOptions,
  LIST_ID,
  languageOptionId,
} from "./LanguageOptions";
import { LanguageSearchField } from "./LanguageSearchField";
import { LanguageTrigger } from "./LanguageTrigger";

interface LanguageSelectProps {
  value: string;
  disabled?: boolean;
  onChange: (language: string) => void;
}

export function LanguageSelect({
  value,
  disabled = false,
  onChange,
}: LanguageSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = LANGUAGES.find((option) => option.code === value);
  const filtered = useMemo(() => searchLanguages(query), [query]);
  const activeOption = filtered[activeIndex];

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
      if (activeOption) {
        commit(activeOption.code);
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
      closePopup();
    }
  };

  return (
    <div className="relative w-48">
      <LanguageTrigger
        ref={triggerRef}
        label={selected ? selected.label : value}
        open={open}
        disabled={disabled}
        listId={open ? LIST_ID : undefined}
        activeId={
          open && activeOption ? languageOptionId(activeOption.code) : undefined
        }
        onToggle={open ? closePopup : openPopup}
      />
      {open && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={closePopup}
          />
          <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
            <LanguageSearchField
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setActiveIndex(0);
                setQuery(event.target.value);
              }}
              onKeyDown={handleInputKeyDown}
            />
            <LanguageOptions
              options={filtered}
              value={value}
              activeIndex={activeIndex}
              query={query}
              onSelect={commit}
              onHighlight={setActiveIndex}
            />
          </div>
        </>
      )}
    </div>
  );
}