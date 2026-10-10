import { afterEach, describe, expect, it } from "vitest";
import { defaultLanguage, FALLBACK_LANGUAGE, LANGUAGES } from "./languages";

function setNavigatorLanguage(code: string): void {
  Object.defineProperty(window.navigator, "language", {
    value: code,
    configurable: true,
  });
}

afterEach(() => {
  // Remove the own-property override; the jsdom Navigator.prototype getter
  // ("en-US") becomes visible again.
  Reflect.deleteProperty(window.navigator, "language");
});

describe("language table", () => {
  it("has unique BCP-47 codes", () => {
    const codes = LANGUAGES.map((language) => language.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("contains the fallback language", () => {
    expect(
      LANGUAGES.some((language) => language.code === FALLBACK_LANGUAGE),
    ).toBe(true);
  });

  it("derives native and English labels from Intl.DisplayNames", () => {
    const german = LANGUAGES.find((language) => language.code === "de-DE");
    expect(german?.label).toBe("Deutsch");
    expect(german?.english).toBe("German (Germany)");
  });

  it("renders the native label from the primary subtag only", () => {
    const japanese = LANGUAGES.find((language) => language.code === "ja-JP");
    expect(japanese?.label).toBe("日本語");
    expect(japanese?.english).not.toContain("日本語");
  });

  it("keeps variant codes sharing a primary subtag distinguishable", () => {
    const chinese = LANGUAGES.filter((language) =>
      language.code.startsWith("zh-"),
    );
    const labels = new Set(chinese.map((language) => language.label));
    expect(chinese.length).toBeGreaterThan(1);
    expect(labels.size).toBe(chinese.length);
  });
});

describe("defaultLanguage()", () => {
  it("returns the browser language when it is in the list", () => {
    setNavigatorLanguage("de-DE");
    expect(defaultLanguage()).toBe("de-DE");
  });

  it("falls back to en-US for unknown browser languages", () => {
    setNavigatorLanguage("zz-ZZ");
    expect(defaultLanguage()).toBe("en-US");
  });
});