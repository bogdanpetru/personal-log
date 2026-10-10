// Language codes offered for transcription, passed as BCP-47 to the plugin.
// The platform has no API to *enumerate* languages (Intl.supportedValuesOf
// covers calendars/currencies/time zones only), so the codes stay a curated
// list — but the labels come from the browser: `Intl.DisplayNames` renders
// each code natively and in English, so no display text is hardcoded here.

export interface LanguageOption {
  /** BCP-47 code passed to the transcription plugin. */
  code: string;
  /** Native name from Intl.DisplayNames (rendered in its own locale). */
  label: string;
  /** English name from Intl.DisplayNames (search text). */
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
  "zh-TW",
  "hr-HR",
  "cs-CZ",
  "da-DK",
  "nl-NL",
  "en-US",
  "en-GB",
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
  "pt-PT",
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

// Native label from the primary subtag (de-DE → "Deutsch" rendered in de);
// the English name uses the full code, so region info lands in search too
// (de-DE → "German (Germany)").
// CLDR renders language names in their own orthography — "français",
// "русский" — so the label gets sentence casing to read uniformly in the list.
// Variant codes sharing a primary subtag (pt-BR/pt-PT, zh-CN/zh-TW) keep the
// region name instead, or two options would read identically ("中文").
const primaryCounts = new Map<string, number>();
for (const code of LANGUAGE_CODES) {
  const primary = code.split("-")[0];
  if (primary !== undefined) {
    primaryCounts.set(primary, (primaryCounts.get(primary) ?? 0) + 1);
  }
}

function nativeLabel(code: string): string {
  const [primary] = code.split("-");
  if (primary === undefined) {
    return code;
  }
  const label =
    (primaryCounts.get(primary) ?? 1) > 1
      ? displayName(code, primary)
      : displayName(primary, primary);
  return `${label.charAt(0).toLocaleUpperCase()}${label.slice(1)}`;
}

export const LANGUAGES: LanguageOption[] = LANGUAGE_CODES.map((code) => ({
  code,
  label: nativeLabel(code),
  english: displayName(code, "en"),
}));

export const FALLBACK_LANGUAGE = "en-US";

export function defaultLanguage(): string {
  const browser = navigator.language;
  const known = LANGUAGES.some((language) => language.code === browser);
  return known ? browser : FALLBACK_LANGUAGE;
}