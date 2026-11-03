import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeService } from "./ThemeService";

function mockPrefersDark(dark: boolean): void {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: dark,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as MediaQueryList);
}

let theme: ThemeService;

beforeEach(() => {
  theme = new ThemeService();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.classList.remove("dark");
});

describe("ThemeService", () => {
  it("applies the dark class to the document for explicit modes", () => {
    mockPrefersDark(true);
    theme.apply("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    theme.apply("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("follows the mocked system preference in system mode", () => {
    mockPrefersDark(true);
    theme.apply("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    mockPrefersDark(false);
    theme.apply("system");
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
    const stop = theme.watchSystem(onChange);
    stop();
    expect(removeEventListener).toHaveBeenCalledWith("change", onChange);
  });
});
