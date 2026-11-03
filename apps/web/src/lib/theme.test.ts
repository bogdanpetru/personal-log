import { describe, expect, it } from "vitest";
import { isThemeMode, nextThemeMode } from "./theme";

describe("theme", () => {
  it("cycles light → dark → system → light", () => {
    expect(nextThemeMode("light")).toBe("dark");
    expect(nextThemeMode("dark")).toBe("system");
    expect(nextThemeMode("system")).toBe("light");
  });

  it("recognises known modes only", () => {
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("sepia")).toBe(false);
  });
});
