export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];

export const THEME_LABELS: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const CYCLE: ThemeMode[] = ["light", "dark", "system"];
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function isThemeMode(value: string): value is ThemeMode {
  return Object.hasOwn(THEME_LABELS, value);
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
  const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];
  return next ?? "light";
}

export function prefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return prefersDark() ? "dark" : "light";
  }
  return mode;
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle(
    "dark",
    resolveTheme(mode) === "dark",
  );
}

export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
