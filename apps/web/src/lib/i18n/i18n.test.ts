import { beforeEach, describe, expect, it } from "vitest";
import { getI18n, loadLocale } from "./i18n";
import { LOCALES } from "./locales";
import en, { type Messages } from "./messages/en";
import { translate } from "./translate";

const modules = import.meta.glob<{ default: Partial<Messages> }>(
  "./messages/*.ts",
  { eager: true },
);

beforeEach(async () => {
  await loadLocale("en");
});

describe("i18n", () => {
  it("serves English immediately", () => {
    const state = getI18n();
    expect(state.locale).toBe("en");
    expect(translate(state.messages, "nav.back")).toBe("Back");
  });

  it("loads a locale chunk and applies lang", async () => {
    await loadLocale("ro");
    const state = getI18n();
    expect(state.locale).toBe("ro");
    expect(document.documentElement.lang).toBe("ro");
    expect(translate(state.messages, "nav.back")).toBe("Înapoi");
  });

  it("sets the text direction for right-to-left locales", async () => {
    await loadLocale("ar");
    expect(document.documentElement.dir).toBe("rtl");
    await loadLocale("en");
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("has a message module for every supported locale", () => {
    const files = Object.keys(modules)
      .map((path) => path.replace("./messages/", "").replace(".ts", ""))
      .sort();
    const codes = LOCALES.map((locale) => locale.code).sort();
    expect(files).toEqual(codes);
  });

  it("has every message key in every locale", () => {
    const keys = Object.keys(en).sort();
    for (const [path, module] of Object.entries(modules)) {
      expect(Object.keys(module.default).sort(), path).toEqual(keys);
    }
  });
});
