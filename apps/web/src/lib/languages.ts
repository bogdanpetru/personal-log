export interface LanguageOption {
  code: string;
  label: string;
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

function primaryLanguageName(code: string, locale: string): string {
  const full = displayName(code, locale);
  const shortened = full.replace(/\s*\([^)]*\)$/, "").trim();
  return shortened === "" ? full : shortened;
}

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