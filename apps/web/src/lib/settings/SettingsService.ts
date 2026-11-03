import { isAudioFormatId } from "../audio/formats";
import { defaultLocale, isLocale } from "../i18n/locales";
import { defaultLanguage } from "../languages";
import { isTranscriptionEngine } from "../transcription/TranscriptionEngine";
import { isThemeMode } from "../theme";
import type { Settings } from "./Settings";

const STORAGE_KEY = "personal-log:settings";

export class SettingsService {
  private snapshot: Settings | null = null;
  private readonly listeners = new Set<() => void>();

  get(): Settings {
    this.snapshot ??= this.read();
    return this.snapshot;
  }

  update(patch: Partial<Settings>): Settings {
    const next = { ...this.get(), ...patch };
    this.snapshot = next;
    this.persist(next);
    this.notify();
    return next;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  reset(): void {
    this.snapshot = null;
    this.persist(null);
    this.notify();
  }

  private fallback(): Settings {
    return {
      language: defaultLanguage(),
      downloadFormat: "original",
      theme: "system",
      locale: defaultLocale(),
      transcriptionEngine: "native",
    };
  }

  private read(): Settings {
    const defaults = this.fallback();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return defaults;
      }
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return {
        language:
          typeof parsed.language === "string"
            ? parsed.language
            : defaults.language,
        downloadFormat:
          typeof parsed.downloadFormat === "string" &&
          isAudioFormatId(parsed.downloadFormat)
            ? parsed.downloadFormat
            : defaults.downloadFormat,
        theme:
          typeof parsed.theme === "string" && isThemeMode(parsed.theme)
            ? parsed.theme
            : defaults.theme,
        locale:
          typeof parsed.locale === "string" && isLocale(parsed.locale)
            ? parsed.locale
            : defaults.locale,
        transcriptionEngine: isTranscriptionEngine(parsed.transcriptionEngine)
          ? parsed.transcriptionEngine
          : defaults.transcriptionEngine,
      };
    } catch {
      return defaults;
    }
  }

  private persist(settings: Settings | null): void {
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

  private notify(): void {
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}
