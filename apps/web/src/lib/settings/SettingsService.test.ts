import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "../i18n/locales";
import { defaultLanguage } from "../languages";
import { SettingsService } from "./SettingsService";

const STORAGE_KEY = "personal-log:settings";

let settings: SettingsService;

beforeEach(() => {
  localStorage.clear();
  settings = new SettingsService();
});

describe("SettingsService", () => {
  it("defaults to the browser language and locale, the original format, the system theme and the native engine", () => {
    expect(settings.get()).toEqual({
      language: defaultLanguage(),
      downloadFormat: "original",
      theme: "system",
      locale: defaultLocale(),
      transcriptionEngine: "native",
    });
  });

  it("persists updates and keeps the snapshot in sync", () => {
    settings.update({ language: "de-DE", downloadFormat: "mp3" });
    const expected = {
      language: "de-DE",
      downloadFormat: "mp3",
      theme: "system",
      locale: defaultLocale(),
      transcriptionEngine: "native",
    };
    expect(settings.get()).toEqual(expected);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(expected);
  });

  it("persists the theme mode", () => {
    settings.update({ theme: "dark" });
    expect(settings.get().theme).toBe("dark");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).theme).toBe("dark");
  });

  it("persists the app locale", () => {
    settings.update({ locale: "ro" });
    expect(settings.get().locale).toBe("ro");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).locale).toBe("ro");
  });

  it("persists the transcription engine", () => {
    settings.update({ transcriptionEngine: "whisper" });
    expect(settings.get().transcriptionEngine).toBe("whisper");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).transcriptionEngine).toBe(
      "whisper",
    );
  });

  it("reads stored settings back", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        language: "fr-FR",
        downloadFormat: "wav",
        theme: "light",
        locale: "ro",
        transcriptionEngine: "whisper",
      }),
    );
    const fresh = new SettingsService();
    expect(fresh.get()).toEqual({
      language: "fr-FR",
      downloadFormat: "wav",
      theme: "light",
      locale: "ro",
      transcriptionEngine: "whisper",
    });
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        language: 42,
        downloadFormat: "flac",
        theme: "sepia",
        locale: "xx",
        transcriptionEngine: "cloud",
      }),
    );
    const fresh = new SettingsService();
    expect(fresh.get()).toEqual({
      language: defaultLanguage(),
      downloadFormat: "original",
      theme: "system",
      locale: defaultLocale(),
      transcriptionEngine: "native",
    });
  });

  it("notifies subscribers until they unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = settings.subscribe(listener);
    settings.update({ downloadFormat: "m4a" });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    settings.update({ downloadFormat: "wav" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
