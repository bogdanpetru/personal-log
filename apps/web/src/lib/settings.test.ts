import { beforeEach, describe, expect, it, vi } from "vitest";
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
  it("defaults to the browser language and the original format", () => {
    expect(getSettings()).toEqual({
      language: defaultLanguage(),
      downloadFormat: "original",
    });
  });

  it("persists updates and keeps the snapshot in sync", () => {
    updateSettings({ language: "de-DE", downloadFormat: "mp3" });
    expect(getSettings()).toEqual({
      language: "de-DE",
      downloadFormat: "mp3",
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({
      language: "de-DE",
      downloadFormat: "mp3",
    });
  });

  it("reads stored settings back", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language: "fr-FR", downloadFormat: "wav" }),
    );
    expect(getSettings()).toEqual({
      language: "fr-FR",
      downloadFormat: "wav",
    });
  });

  it("ignores invalid stored values", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language: 42, downloadFormat: "flac" }),
    );
    expect(getSettings()).toEqual({
      language: defaultLanguage(),
      downloadFormat: "original",
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
