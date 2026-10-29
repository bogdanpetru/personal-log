import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useSettings } from "./useSettings";
import { getI18n, loadLocale, subscribeI18n } from "@/lib/i18n/i18n";
import { directionFor, type Direction, type Locale } from "@/lib/i18n/locales";
import {
  translate,
  type MessageKey,
  type MessageParams,
} from "@/lib/i18n/translate";

export type Translate = (key: MessageKey, params?: MessageParams) => string;

interface UseTranslation {
  t: Translate;
  locale: Locale;
  dir: Direction;
}

export function useTranslation(): UseTranslation {
  const { settings } = useSettings();
  const state = useSyncExternalStore(subscribeI18n, getI18n);

  useEffect(() => {
    void loadLocale(settings.locale);
  }, [settings.locale]);

  const t = useCallback<Translate>(
    (key, params) => translate(state.messages, key, params),
    [state.messages],
  );

  return { t, locale: state.locale, dir: directionFor(state.locale) };
}
