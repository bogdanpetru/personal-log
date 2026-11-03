import { useEffect } from "react";
import { useSettings } from "./useSettings";
import { nextThemeMode, type ThemeMode } from "@/lib/theme";
import { themeService } from "@/lib/themeService";

interface UseTheme {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycle: () => void;
}

export function useTheme(): UseTheme {
  const { settings, updateSettings } = useSettings();
  const mode = settings.theme;

  useEffect(() => {
    themeService.apply(mode);
    return themeService.watchSystem(() => themeService.apply(mode));
  }, [mode]);

  return {
    mode,
    setMode: (next) => updateSettings({ theme: next }),
    cycle: () => updateSettings({ theme: nextThemeMode(mode) }),
  };
}
