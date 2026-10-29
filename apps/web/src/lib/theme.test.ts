import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  isThemeMode,
  nextThemeMode,
  resolveTheme,
  watchSystemTheme,
} from "./theme";

function mockPrefersDark(dark: boolean): void {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: dark,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as MediaQueryList);
}

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.classList.remove("dark");
});

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

  it("resolves an explicit mode without the system", () => {
    mockPrefersDark(true);
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });

  it("follows the system preference in system mode", () => {
    mockPrefersDark(true);
    expect(resolveTheme("system")).toBe("dark");
    mockPrefersDark(false);
    expect(resolveTheme("system")).toBe("light");
  });

  it("applies the dark class to the document", () => {
    mockPrefersDark(false);
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("watches system changes until unsubscribed", () => {
    const onChange = vi.fn();
    const removeEventListener = vi.fn();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener,
    } as unknown as MediaQueryList);
    const stop = watchSystemTheme(onChange);
    stop();
    expect(removeEventListener).toHaveBeenCalledWith("change", onChange);
  });
});
