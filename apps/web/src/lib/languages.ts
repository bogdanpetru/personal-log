// Language codes offered for transcription, passed as BCP-47 to the plugin.
// The platform has no API to *enumerate* languages (Intl.supportedValuesOf
// covers calendars/currencies/time zones only), so the codes stay a curated
// list — one entry per primary language (variants like en-GB just duplicate
// the main one) — but the names come from the browser: `Intl.DisplayNames`
// renders each code natively and in English, so no display text is hardcoded
// here.

export interface LanguageOption {
  /** BCP-47 code passed to the transcription plugin. */
  code: string;
  /** Native name from Intl.DisplayNames (rendered in its own locale). */
  label: string;
  /** Short English name from Intl.DisplayNames (search text). */
  english: string;
}

const LANGUAGE_CODES = [
  "af-ZA",
  "sq-AL",
  "hy-AM",
  "az-AZ",
  "eu-ES",
  "bn-BD",
  "bs-BA",
  "bg-BG",
  "ca-ES",
  "zh-CN",
  "hr-HR",
  "cs-CZ",
  "da-DK",
  "nl-NL",
  "en-US",
  "et-EE",
  "fil-PH",
  "fi-FI",
  "fr-FR",
  "gl-ES",
  "ka-GE",
  "de-DE",
  "el-GR",
  "gu-IN",
  "he-IL",
  "hi-IN",
  "hu-HU",
  "is-IS",
  "id-ID",
  "it-IT",
  "ja-JP",
  "kn-IN",
  "kk-KZ",
  "km-KH",
  "ko-KR",
  "lv-LV",
  "lt-LT",
  "mk-MK",
  "ms-MY",
  "ml-IN",
  "mr-IN",
  "mn-MN",
  "ne-NP",
  "nb-NO",
  "fa-IR",
  "pl-PL",
  "pt-BR",
  "ro-RO",
  "ru-RU",
  "sr-RS",
  "si-LK",
  "sk-SK",
  "sl-SI",
  "es-ES",
  "sw-KE",
  "sv-SE",
  "ta-IN",
  "te-IN",
  "th-TH",
  "tr-TR",
  "uk-UA",
  "ur-PK",
  "vi-VN",
  "cy-GB",
];

const displayNamesCache = new Map<string, Intl.DisplayNames>();

function displayName(code: string, locale: string): string {
  const key = `${locale}:${code}`;
  let displayNames = displayNamesCache.get(key);
  if (displayNames === undefined) {
    displayNames = new Intl.DisplayNames([locale], { type: "language" });
    displayNamesCache.set(key, displayNames);
  }
  try {
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

// Region qualifiers ("German (Germany)") add nothing in the list — they just
// duplicate the main name. Keep the first part, drop the parenthetical.
function primaryLanguageName(code: string, locale: string): string {
  const full = displayName(code, locale);
  const shortened = full.replace(/\s*\([^)]*\)$/, "").trim();
  return shortened === "" ? full : shortened;
}

// Native label from the primary subtag (de-DE → "Deutsch" rendered in de).
// CLDR renders language names in their own orthography — "français",
// "русский" — so the label gets sentence casing to read uniformly in the list.
function nativeLabel(code: string): string {
  const [primary] = code.split("-");
  if (primary === undefined) {
    return code;
  }
  const label = displayName(primary, primary);
  return `${label.charAt(0).toLocaleUpperCase()}${label.slice(1)}`;
}

export const LANGUAGES: LanguageOption[] = LANGUAGE_CODES.map((code) => ({
  code,
  label: nativeLabel(code),
  english: primaryLanguageName(code, "en"),
}));

export const FALLBACK_LANGUAGE = "en-US";

export function defaultLanguage(): string {
  const browser = navigator.language;
  const known = LANGUAGES.some((language) => language.code === browser);
  return known ? browser : FALLBACK_LANGUAGE;
}