import { expect, test } from "vitest";
import { searchLanguages } from "./languageSearch";

test("empty and blank queries return the full list", () => {
  expect(searchLanguages("").length).toBeGreaterThan(0);
  expect(searchLanguages("  ").length).toBe(searchLanguages("").length);
});

test("ignores diacritics: 'franc' matches Français", () => {
  expect(searchLanguages("franc").map((o) => o.code)).toContain("fr-FR");
});

test("matches the English name: 'chinese' matches 中文", () => {
  expect(searchLanguages("chinese").map((o) => o.code)).toContain("zh-CN");
});

test("matches codes: 'sv-SE' matches", () => {
  expect(searchLanguages("sv-SE").map((o) => o.code)).toContain("sv-SE");
});

test("no match returns an empty list", () => {
  expect(searchLanguages("zzz")).toHaveLength(0);
});