import { useState } from "react";
import { Combobox } from "@/components/Combobox";
import { searchLanguages } from "@/lib/languageSearch";
import { LANGUAGES } from "@/lib/languages";

interface LanguageSelectorProps {
  value: string;
  disabled?: boolean;
  onChange: (language: string) => void;
}

export function LanguageSelector({
  value,
  disabled = false,
  onChange,
}: LanguageSelectorProps) {
  const [query, setQuery] = useState("");
  const selectedLabel =
    LANGUAGES.find((option) => option.code === value)?.label ?? value;
  const options = searchLanguages(query).map((option) => ({
    value: option.code,
    label: option.label,
    description: option.english,
  }));

  return (
    <Combobox
      value={value}
      options={options}
      query={query}
      onQueryChange={setQuery}
      onChange={onChange}
      label="Transcription language"
      searchPlaceholder="Search languages"
      emptyLabel={`No languages match "${query}"`}
      placeholder={selectedLabel}
      disabled={disabled}
      className="w-48"
      contentClassName="w-64"
    />
  );
}
