import { isAudioFormatId, type AudioFormatId } from "./audio/formats";
import { defaultLanguage } from "./languages";
import { isThemeMode, type ThemeMode } from "./theme";

export interface Settings {
  language: string;
  downloadFormat: AudioFormatId;
  theme: ThemeMode;
}

const STORAGE_KEY = "personal-log:settings";

let snapshot: Settings | null = null;
const listeners = new Set<() => void>();

function fallback(): Settings {
  return {
    language: defaultLanguage(),
    downloadFormat: "original",
    theme: "system",
  };
}

function read(): Settings {
  const defaults = fallback();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      language:
        typeof parsed.language === "string" ? parsed.language : defaults.language,
      downloadFormat:
        typeof parsed.downloadFormat === "string" &&
        isAudioFormatId(parsed.downloadFormat)
          ? parsed.downloadFormat
          : defaults.downloadFormat,
      theme:
        typeof parsed.theme === "string" && isThemeMode(parsed.theme)
          ? parsed.theme
          : defaults.theme,
    };
  } catch {
    return defaults;
  }
}

function persist(settings: Settings | null): void {
  try {
    if (settings === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch {
    return;
  }
}

function notify(): void {
  for (const listener of [...listeners]) {
    listener();
  }
}

export function getSettings(): Settings {
  snapshot ??= read();
  return snapshot;
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  snapshot = next;
  persist(next);
  notify();
  return next;
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetSettings(): void {
  snapshot = null;
  persist(null);
  notify();
}
