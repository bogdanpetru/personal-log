import { useState } from "react";
import { Combobox } from "@/components/Combobox";
import { useTranslation } from "@/hooks/useTranslation";
import { isLocale, LOCALES, type Locale, type LocaleInfo } from "@/lib/i18n/locales";

interface AppLanguageSelectorProps {
  value: Locale;
  onChange: (locale: Locale) => void;
}

function matches(locale: LocaleInfo, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return true;
  }
  return `${locale.native} ${locale.english}`.toLowerCase().includes(needle);
}

export function AppLanguageSelector({
  value,
  onChange,
}: AppLanguageSelectorProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const options = LOCALES.filter((locale) => matches(locale, query)).map(
    (locale) => ({
      value: locale.code,
      label: locale.native,
      description: locale.english,
    }),
  );
  const selected = LOCALES.find((locale) => locale.code === value);

  return (
    <Combobox
      value={value}
      options={options}
      query={query}
      onQueryChange={setQuery}
      onChange={(next) => {
        if (isLocale(next)) {
          onChange(next);
        }
      }}
      label={t("settings.appLanguage")}
      searchPlaceholder={t("recorder.searchLanguages")}
      emptyLabel={t("recorder.noLanguages", { query })}
      placeholder={selected?.native ?? value}
      className="w-56"
      contentClassName="w-64"
    />
  );
}
