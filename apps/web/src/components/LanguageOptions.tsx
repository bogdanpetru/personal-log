import type { LanguageOption } from "@/lib/languages";
import { List } from "@/components/List";
import { Text } from "@/components/Text";
import { LanguageOptionRow } from "./LanguageOptionRow";

export const LIST_ID = "transcription-language-listbox";

export function languageOptionId(code: string): string {
  return `transcription-language-${code}`;
}

interface LanguageOptionsProps {
  options: LanguageOption[];
  value: string;
  activeIndex: number;
  query: string;
  onSelect: (code: string) => void;
  onHighlight: (index: number) => void;
}

export function LanguageOptions({
  options,
  value,
  activeIndex,
  query,
  onSelect,
  onHighlight,
}: LanguageOptionsProps) {
  return (
    <>
      <List id={LIST_ID} role="listbox" className="max-h-60 overflow-auto p-1">
        {options.map((option, index) => (
          <LanguageOptionRow
            key={option.code}
            id={languageOptionId(option.code)}
            label={option.label}
            english={option.english}
            active={index === activeIndex}
            selected={option.code === value}
            onSelect={() => onSelect(option.code)}
            onHighlight={() => onHighlight(index)}
          />
        ))}
      </List>
      {options.length === 0 && (
        <Text size="sm" muted className="border-t border-border px-3 py-2">
          No languages match "{query}"
        </Text>
      )}
    </>
  );
}