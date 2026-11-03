import type { ThemeMode } from "../theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

export class ThemeService {
  apply(mode: ThemeMode): void {
    document.documentElement.classList.toggle(
      "dark",
      this.resolve(mode) === "dark",
    );
  }

  watchSystem(onChange: () => void): () => void {
    const query = window.matchMedia(DARK_QUERY);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }

  private resolve(mode: ThemeMode): "light" | "dark" {
    if (mode === "system") {
      return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
    }
    return mode;
  }
}
