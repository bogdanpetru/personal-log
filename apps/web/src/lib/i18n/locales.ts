export type Direction = "ltr" | "rtl";

export type Locale =
  | "en"
  | "zh"
  | "hi"
  | "es"
  | "fr"
  | "ar"
  | "bn"
  | "pt"
  | "ru"
  | "ur"
  | "id"
  | "de"
  | "ja"
  | "sw"
  | "mr"
  | "te"
  | "tr"
  | "ta"
  | "vi"
  | "ko"
  | "ro";

export interface LocaleInfo {
  code: Locale;
  native: string;
  english: string;
  dir: Direction;
}

const LOCALE_INFO: Record<
  Locale,
  { native: string; english: string; dir: Direction }
> = {
  en: { native: "English", english: "English", dir: "ltr" },
  zh: { native: "中文", english: "Chinese", dir: "ltr" },
  hi: { native: "हिन्दी", english: "Hindi", dir: "ltr" },
  es: { native: "Español", english: "Spanish", dir: "ltr" },
  fr: { native: "Français", english: "French", dir: "ltr" },
  ar: { native: "العربية", english: "Arabic", dir: "rtl" },
  bn: { native: "বাংলা", english: "Bengali", dir: "ltr" },
  pt: { native: "Português", english: "Portuguese", dir: "ltr" },
  ru: { native: "Русский", english: "Russian", dir: "ltr" },
  ur: { native: "اردو", english: "Urdu", dir: "rtl" },
  id: { native: "Bahasa Indonesia", english: "Indonesian", dir: "ltr" },
  de: { native: "Deutsch", english: "German", dir: "ltr" },
  ja: { native: "日本語", english: "Japanese", dir: "ltr" },
  sw: { native: "Kiswahili", english: "Swahili", dir: "ltr" },
  mr: { native: "मराठी", english: "Marathi", dir: "ltr" },
  te: { native: "తెలుగు", english: "Telugu", dir: "ltr" },
  tr: { native: "Türkçe", english: "Turkish", dir: "ltr" },
  ta: { native: "தமிழ்", english: "Tamil", dir: "ltr" },
  vi: { native: "Tiếng Việt", english: "Vietnamese", dir: "ltr" },
  ko: { native: "한국어", english: "Korean", dir: "ltr" },
  ro: { native: "Română", english: "Romanian", dir: "ltr" },
};

export const LOCALES: LocaleInfo[] = (
  Object.keys(LOCALE_INFO) as Locale[]
).map((code) => ({ code, ...LOCALE_INFO[code] }));

export function isLocale(value: string): value is Locale {
  return Object.hasOwn(LOCALE_INFO, value);
}

export function directionFor(locale: Locale): Direction {
  return LOCALE_INFO[locale].dir;
}

function primarySubtag(language: string): string {
  return language.toLowerCase().split("-")[0] ?? "";
}

export function defaultLocale(): Locale {
  if (typeof navigator === "undefined") {
    return "en";
  }
  const candidates = [navigator.language, ...navigator.languages];
  for (const candidate of candidates) {
    const code = primarySubtag(candidate);
    if (isLocale(code)) {
      return code;
    }
  }
  return "en";
}
