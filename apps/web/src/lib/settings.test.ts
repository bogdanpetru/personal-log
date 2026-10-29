import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultLocale } from "./i18n/locales";
import { defaultLanguage } from "./languages";
import {
  getSettings,
  resetSettings,
  subscribeSettings,
  updateSettings,
} from "./settings";

const STORAGE_KEY = "personal-log:settings";

beforeEach(() => {
  resetSettings();
});

describe("settings", () => {
  it("defaults to the browser language and locale, the original format and the system theme", () => {
    expect(getSettings()).toEqual({
      language: defaultLanguage(),
      downloadFormat: "original",
      theme: "system",
      locale: defaultLocale(),
    });
  });

  it("persists updates and keeps the snapshot in sync", () => {
    updateSettings({ language: "de-DE", downloadFormat: "mp3" });
    const expected = {
      language: "de-DE",
      downloadFormat: "mp3",
      theme: "system",
      locale: defaultLocale(),
    };
    expect(getSettings()).toEqual(expected);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(expected);
  });

  it("persists the theme mode", () => {
    updateSettings({ theme: "dark" });
    expect(getSettings().theme).toBe("dark");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).theme).toBe("dark");
  });

  it("persists the app locale", () => {
    updateSettings({ locale: "ro" });
    expect(getSettings().locale).toBe("ro");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).locale).toBe("ro");
  });

  it("reads stored settings back", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        language: "fr-FR",
        downloadFormat: "wav",
        theme: "light",
        locale: "ro",
      }),
    );
    expect(getSettings()).toEqual({
      language: "fr-FR",
      downloadFormat: "wav",
      theme: "light",
      locale: "ro",
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
      }),
    );
    expect(getSettings()).toEqual({
      language: defaultLanguage(),
      downloadFormat: "original",
      theme: "system",
      locale: defaultLocale(),
    });
  });

  it("notifies subscribers until they unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSettings(listener);
    updateSettings({ downloadFormat: "m4a" });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    updateSettings({ downloadFormat: "wav" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
