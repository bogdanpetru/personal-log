import { describe, expect, it, vi } from "vitest";
import { defaultLocale, directionFor, isLocale, LOCALES } from "./locales";

function stubBrowserLanguages(language: string, languages: string[]): void {
  vi.spyOn(navigator, "language", "get").mockReturnValue(language);
  vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
}

describe("locales", () => {
  it("supports twenty major languages plus Romanian", () => {
    expect(LOCALES).toHaveLength(21);
    expect(new Set(LOCALES.map((locale) => locale.code)).size).toBe(21);
    expect(LOCALES.some((locale) => locale.code === "ro")).toBe(true);
  });

  it("marks Arabic and Urdu right-to-left", () => {
    expect(directionFor("ar")).toBe("rtl");
    expect(directionFor("ur")).toBe("rtl");
    expect(directionFor("ro")).toBe("ltr");
  });

  it("recognises supported locales only", () => {
    expect(isLocale("ro")).toBe(true);
    expect(isLocale("xx")).toBe(false);
  });

  it("defaults to the browser language", () => {
    stubBrowserLanguages("ro-RO", ["ro-RO", "en-US", "en"]);
    expect(defaultLocale()).toBe("ro");
  });

  it("falls back to English for unsupported browser languages", () => {
    stubBrowserLanguages("xx-YY", ["xx-YY"]);
    expect(defaultLocale()).toBe("en");
  });
});
