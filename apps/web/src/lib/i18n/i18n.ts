import en, { type Messages } from "./messages/en";
import { directionFor, type Locale } from "./locales";

interface I18nState {
  locale: Locale;
  messages: Partial<Messages>;
}

const loaders = import.meta.glob<{ default: Partial<Messages> }>(
  "./messages/*.ts",
);
const cache = new Map<Locale, Partial<Messages>>([["en", en]]);
const listeners = new Set<() => void>();

let state: I18nState = { locale: "en", messages: en };
let request: Locale = "en";

export function getI18n(): I18nState {
  return state;
}

export function subscribeI18n(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function apply(locale: Locale, messages: Partial<Messages>): void {
  if (state.locale === locale && state.messages === messages) {
    return;
  }
  document.documentElement.lang = locale;
  document.documentElement.dir = directionFor(locale);
  state = { locale, messages };
  for (const listener of [...listeners]) {
    listener();
  }
}

function loaderFor(locale: Locale): (() => Promise<{ default: Partial<Messages> }>) | undefined {
  return loaders[`./messages/${locale}.ts`];
}

export async function loadLocale(locale: Locale): Promise<void> {
  request = locale;
  const cached = cache.get(locale);
  if (cached !== undefined) {
    apply(locale, cached);
    return;
  }
  apply(locale, en);
  const loader = loaderFor(locale);
  if (loader === undefined) {
    return;
  }
  const module = await loader();
  cache.set(locale, module.default);
  if (request === locale) {
    apply(locale, module.default);
  }
}
