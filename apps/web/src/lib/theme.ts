export type ThemeMode = "system" | "light" | "dark";

export const THEME_MODES: ThemeMode[] = ["system", "light", "dark"];

const CYCLE: ThemeMode[] = ["light", "dark", "system"];

export function isThemeMode(value: string): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
  const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];
  return next ?? "light";
}
