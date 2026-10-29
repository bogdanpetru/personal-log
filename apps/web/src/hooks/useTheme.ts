import { useEffect } from "react";
import { useSettings } from "./useSettings";
import {
  applyTheme,
  nextThemeMode,
  watchSystemTheme,
  type ThemeMode,
} from "@/lib/theme";

interface UseTheme {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycle: () => void;
}

export function useTheme(): UseTheme {
  const { settings, updateSettings } = useSettings();
  const mode = settings.theme;

  useEffect(() => {
    applyTheme(mode);
    return watchSystemTheme(() => applyTheme(mode));
  }, [mode]);

  return {
    mode,
    setMode: (next) => updateSettings({ theme: next }),
    cycle: () => updateSettings({ theme: nextThemeMode(mode) }),
  };
}
